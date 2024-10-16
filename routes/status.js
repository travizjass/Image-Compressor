const express = require('express');
const Request = require('../models/ImageRequest');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { createObjectCsvWriter } = require('csv-writer');

// Function to generate CSV file
const generateCSV = async (requestDoc, csvFilePath) => {
    const csvWriter = createObjectCsvWriter({
        path: csvFilePath,
        header: [
            { id: 'serialNumber', title: 'S. No.' },
            { id: 'productName', title: 'Product Name' },
            { id: 'inputUrls', title: 'Input Image Urls' },
            { id: 'outputUrls', title: 'Output Image Urls' }
        ]
    });

    const records = requestDoc.images.map((imageEntry, index) => ({
        serialNumber: index + 1,
        productName: imageEntry.productName,
        inputUrls: imageEntry.inputUrls.join(', '), // Join array of URLs with commas
        outputUrls: imageEntry.outputUrls.join(', ') // Join array of output URLs with commas
    }));

    // Write data to CSV
    await csvWriter.writeRecords(records);
    console.log('CSV file generated successfully!');
};

// GET /api/status/:requestId (with CSV download)
router.get('/:requestId', async (req, res) => {
    const { requestId } = req.params;

    try {
        const requestDoc = await Request.findOne({ requestId });

        if (!requestDoc) {
            return res.status(404).json({ message: 'Request not found' });
        }

        if (requestDoc.status !== 'completed') {
            return res.json({
                requestId: requestDoc.requestId,
                status: requestDoc.status,
                images: requestDoc.images
            });
        }

        // Path to save the CSV file (e.g., public/csv/request_<requestId>.csv)
        const csvFilePath = path.join(__dirname, '..', 'public', 'csv', `request_${requestId}.csv`);

        // Ensure the CSV directory exists
        const csvDir = path.dirname(csvFilePath);
        if (!fs.existsSync(csvDir)) {
            fs.mkdirSync(csvDir, { recursive: true });
        }

        // Generate CSV file
        await generateCSV(requestDoc, csvFilePath);

        // Return the CSV file to the user
        res.download(csvFilePath, `request_${requestId}.csv`, (err) => {
            if (err) {
                console.error('Error downloading CSV:', err);
                res.status(500).json({ message: 'Error generating CSV file' });
            }
        });

    } catch (error) {
        console.error(`Error fetching request status: ${error}`);
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
});

module.exports = router;
