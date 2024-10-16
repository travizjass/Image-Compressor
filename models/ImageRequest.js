const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    productName: String,
    inputUrls: [String],
    outputUrls: [String],
});

const requestSchema = new mongoose.Schema({
    requestId: { type: String, required: true, unique: true },
    status: { type: String, default: 'pending' },
    images: [imageSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ImageRequest', requestSchema);
