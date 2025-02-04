import express from "express"
import { HeartRate } from "../models/heartrate.model.js";
import { upload } from "../middlewares/multer.middleware.js";
import fs from "fs";
import csv from "csv-parser"
const router = express.Router();

// Validation function for readings
function isValidReading(reading) {
  // Check if timestamp is valid
  const timestamp = new Date(reading.timestamp);
  if (isNaN(timestamp.getTime())) {
    return false;
  }

  // Check if value is a valid number
  const value = parseInt(reading.value);
  if (isNaN(value)) {
    return false;
  }

  // Optional: Add reasonable range checks for heart rate
  if (value < 30 || value > 250) {
    return false;
  }

  return true;
}

// Function to reduce data points by taking periodic samples
function reduceDataPoints(readings, intervalMinutes = 5) {
  // Filter out any invalid readings first
  const validReadings = readings.filter(isValidReading);
  
  if (validReadings.length === 0) {
    return [];
  }

  // Sort readings by timestamp
  validReadings.sort((a, b) => a.timestamp - b.timestamp);
  
  const reducedReadings = [];
  const intervalMs = intervalMinutes * 60 * 1000;
  
  let currentInterval = new Date(validReadings[0].timestamp).getTime();
  let currentSum = 0;
  let currentCount = 0;
  
  validReadings.forEach(reading => {
    const readingTime = reading.timestamp.getTime();
    
    if (readingTime < currentInterval + intervalMs) {
      currentSum += reading.value;
      currentCount++;
    } else {
      if (currentCount > 0) {
        reducedReadings.push({
          timestamp: new Date(currentInterval),
          value: Math.round(currentSum / currentCount)
        });
      }
      
      currentInterval = currentInterval + intervalMs;
      while (currentInterval + intervalMs < readingTime) {
        currentInterval += intervalMs;
      }
      currentSum = reading.value;
      currentCount = 1;
    }
  });
  
  if (currentCount > 0) {
    reducedReadings.push({
      timestamp: new Date(currentInterval),
      value: Math.round(currentSum / currentCount)
    });
  }
  
  return reducedReadings;
}

router.post('/heartData', upload.single('heartData'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const readingsByUser = new Map();
    const invalidReadings = [];
    
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv({
          headers: ['userId', 'timestamp', 'value'],
          skipLines: 0
        }))
        .on('data', (data) => {
          try {
            const reading = {
              userId: data.userId.trim(),
              timestamp: new Date(data.timestamp.trim()),
              value: parseInt(data.value.trim())
            };

            if (!reading.userId) {
              invalidReadings.push({ ...data, reason: 'Invalid user ID' });
              return;
            }

            if (!isValidReading(reading)) {
              invalidReadings.push({ ...data, reason: 'Invalid timestamp or value' });
              return;
            }

            if (!readingsByUser.has(reading.userId)) {
              readingsByUser.set(reading.userId, []);
            }
            readingsByUser.get(reading.userId).push(reading);
          } catch (err) {
            invalidReadings.push({ ...data, reason: 'Parse error' });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    const results = [];
    
    // Process valid readings for each user
    for (const [userId, readings] of readingsByUser) {
      const reducedReadings = reduceDataPoints(readings, 5);
      
      if (reducedReadings.length > 0) {
        await HeartRate.findOneAndUpdate(
          { userId },
          { 
            $set: { 
              readings: reducedReadings
            }
          },
          { upsert: true }
        );

        results.push({
          userId,
          originalReadings: readings.length,
          reducedReadings: reducedReadings.length,
          reductionPercentage: Math.round((1 - reducedReadings.length / readings.length) * 100)
        });
      }
    }

    // Delete the uploaded file
    fs.unlinkSync(req.file.path);

    const response = {
      message: 'Data processed',
      summary: results
    };

    // Only include invalid readings in response if there were any
    if (invalidReadings.length > 0) {
      response.invalidReadings = {
        count: invalidReadings.length,
        samples: invalidReadings.slice(0, 5) // Show first 5 invalid readings as examples
      };
    }

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Error processing file:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ 
      error: 'Failed to process file',
      details: error.message 
    });
  }
});

export default router;