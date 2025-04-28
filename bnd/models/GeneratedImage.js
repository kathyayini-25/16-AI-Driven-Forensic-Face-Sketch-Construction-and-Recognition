const mongoose = require('mongoose');

const generatedImageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String, required: true }, // Base64 or file path
    userId: { type: String, required: true },
    datetime: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GeneratedImage', generatedImageSchema);