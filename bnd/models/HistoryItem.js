const mongoose = require('mongoose');

const historyItemSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    itemId: { type: String, unique: true, required: true },
    srcImages: [String],
    results: [{
        resImage: String,
        accuracy: Number,
        description: String
    }]
});

module.exports = mongoose.model('HistoryItem', historyItemSchema);