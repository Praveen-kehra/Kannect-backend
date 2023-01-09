const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const CommentSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true,
    },
    profilePicture: {
        type: String,
        default: ""
    },
    username: {
        type: String,  
        required: true 
    },
    commentDescription: {
        type: String,
        max: 500,
        required: true,
        min: 1
    },
},
    { timestamps: true }
)
module.exports = model("Comment", CommentSchema);
