import mongoose, { Schema } from "mongoose";

const smartwatchSchema = new Schema(
    {
        model: {
            type: String,
            required: true,
            trim: true
        },
        serialNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        manufacturer: {
            type: String,
            required: true,
            trim: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Smartwatch = mongoose.model("Smartwatch", smartwatchSchema); 