const mongoose = require('mongoose');

const users = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    role: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
})

module.exports = mongoose.model("Users", users);