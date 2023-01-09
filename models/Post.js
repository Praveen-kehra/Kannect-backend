const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const {Comment} = require("./Comment");

const PostSchema = new Schema(
    {
        userId: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            max: 500,
        },
        image: {
            type: String,
        },
        likes: {
            type: Array,
            default: [],
        },
        comments: {
            type: [Comment],
            default: []
        },
    },
    { timestamps: true }
);

module.exports = model("Post", PostSchema);