import mongoose from "mongoose";

const heartRateSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  readings: [{
    timestamp: {
      type: Date,
      required: true
    },
    value: {
      type: Number,
      required: true
    }
  }]
});

const HeartRate = mongoose.model('HeartRate', heartRateSchema);
export { HeartRate };