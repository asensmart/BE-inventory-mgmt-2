const mongoose = require('mongoose');

const expenses = new mongoose.Schema({
    type: {
        type: Object,
        required: true
    },
    price: {
        type: String,
        required: true
    },
    paidTo: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
})

module.exports = mongoose.model("Expense", expenses);