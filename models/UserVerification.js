const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const UserVerification = new Schema(
    {
        userId: String,
        uniqueString: String,
        createdAt: Date,
        expiresAt: Date,
    }
);

module.exports = model("UserVerification", UserVerification);