const mongoose = require('mongoose');

const imageRequestSchema = new mongoose.Schema({
    requestID: String,
    productName: String,
    inputImageUrls: [String],
    outputImageUrls: [String],
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ImageRequest', imageRequestSchema);
