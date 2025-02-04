import mongoose from "mongoose";

async function connectDB(url) {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.DB_CONNECTION_URI}/${process.env.DB_NAME}`
        );
        console.log(
            `MONGODB connected!! DB HOST: ${connectionInstance.connection.host}`
        );
        return connectionInstance;
    } catch (error) {
        console.log("MONGODB CONNECTION FAILED: ", error);
        process.exit(1);
    }
}

export { connectDB };
