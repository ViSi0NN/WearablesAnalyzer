import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        smartwatches: [
            {
                type: Schema.Types.ObjectId,
                ref: "Smartwatch"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }
    },
    {
        timestamps: true
    }
)

userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { //payload
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET, //secret key
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY //expiry 
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { //payload
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET, //secret key
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY //expiry 
        }
    )
}

export const User = mongoose.model("User", userSchema); 