const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const UserSchema = new Schema({
    isVerified: {
        type: Boolean,
        default: false
    },
    username: {
        type: String,
        require: true,
        min: 3,
        max: 20,
        unique: true
    },
    email: {
        type: String,
        require: true,
        min: 3,
        max: 20,
        unique: true
    },
    password: {
        type: String,
        require: true,
        min: 5
    },
    profilePicture: {
        type: String,
        default: ""
    },
    coverPicture: {
        type: String,
        default: ""
    },
    followers: {
        type: Array,
        default: []
    },
    followings: {
        type: Array,
        default: []
    },
    isAdmin: {
        type: Boolean,
        defualt: false
    },
    description:{
        type: String,
        max: 50
    },
    city:{
        type: String,
        max: 50
    },
    from:{
        type: String,
        max: 50
    },
    relationship:{
        type: Number,
        enum: [1, 2, 3]
    },
},
    { timestamps: true }
);

module.exports = model("User", UserSchema);