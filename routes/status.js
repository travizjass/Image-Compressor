const express = require('express');
const multer = require('multer');
const csvParser = require('csv-parser');
const axios = require('axios');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const ImageRequest = require('../models/ImageRequest');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Multer setup for CSV file upload
const upload = multer({ dest: 'uploads/' });

router.post('/', upload.single('file'), async (req, res) => {
    const file = req.file;
    const requestId = uuidv4();

    if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const results = [];

    // Parse CSV
    fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            // Validate and save request
            if (!validateCSV(results)) {
                return res.status(400).json({ message: 'Invalid CSV format' });
            }

            const requestDoc = new ImageRequest({
                requestId: requestId,
                status: 'pending',
                images: results.map(row => ({
                    productName: row['Product Name'],
                    inputUrls: row['Input Image Urls'].split(',').map(url => url.trim()),
                    outputUrls: []
                }))
            });

            await requestDoc.save();

            // Start asynchronous image processing
            processImages(requestDoc);

            // Respond with request ID
            res.json({ requestId });
        });
});

function validateCSV(data) {
    // Simple validation: Check if the CSV has required columns
    return data.every(row => row['Product Name'] && row['Input Image Urls']);
}

async function processImages(requestDoc) {
    for (const imageEntry of requestDoc.images) {
        const outputUrls = [];
        for (const url of imageEntry.inputUrls) {
            try {
                // Fetch image and process with sharp
                const response = await axios({
                    url,
                    responseType: 'arraybuffer'
                });
                const buffer = Buffer.from(response.data, 'binary');

                const outputBuffer = await sharp(buffer)
                    .jpeg({ quality: 50 }) // Compress image
                    .toBuffer();

                const outputFileName = `${uuidv4()}.jpg`;
                const outputPath = path.join(__dirname, '..', 'public', 'images', outputFileName);
                fs.writeFileSync(outputPath, outputBuffer);

                // Simulate URL saving (assuming you'd upload to a public server)
                outputUrls.push(`https://yourserver.com/images/${outputFileName}`);
            } catch (err) {
                console.error(`Failed to process image ${url}: `, err);
            }
        }
        imageEntry.outputUrls = outputUrls;
    }

    // Update request status and save output
    requestDoc.status = 'completed';
    await requestDoc.save();
}

module.exports = router;
