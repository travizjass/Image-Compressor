const ImageRequest = require('../models/ImageRequest');
const { processCSV } = require('../services/csvProcessor');

exports.uploadCSV = async (req, res) => {
    try {
        const requestId = await processCSV(req.file);
        res.json({ requestId });
    } catch (err) {
        res.status(500).json({ error: 'Error processing CSV' });
    }
};

exports.checkStatus = async (req, res) => {
    const { id } = req.params;
    const request = await ImageRequest.findById(id);
    res.json({ status: request.status });
};
