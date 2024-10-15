const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const Request = require('../models/ImageRequest'); // Ensure the model is correctly imported

const router = express.Router();

// Multer setup to handle CSV file upload
const storage = multer.diskStorage({
    destination: './uploads', // Ensure this directory exists
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB (optional)
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.csv') {
            return cb(new Error('Only CSV files are allowed'), false);
        }
        cb(null, true);
    }
}).single('csvFile');

// CSV Validation Middleware
const validateCSVFile = (req, res, next) => {
    const filePath = req.file.path;

    let valid = true;
    const requiredHeaders = ['SNO', 'Product Name', 'Input Image Urls'];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headers) => {
            if (!requiredHeaders.every(header => headers.includes(header))) {
                valid = false;
            }
        })
        .on('end', () => {
            if (!valid) {
                fs.unlinkSync(filePath); // Delete the uploaded invalid CSV file
                return res.status(400).json({ error: 'Invalid CSV format. Required columns: Serial Number, Product Name, Input Image Urls.' });
            }
            next();
        })
        .on('error', (err) => {
            fs.unlinkSync(filePath); // Delete the uploaded file on error
            return res.status(500).json({ error: 'Error reading CSV file.' });
        });
};

// Upload CSV API
router.post('/upload', (req, res) => {
    // Upload CSV
    upload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            // Handle Multer-specific errors (e.g., file size too large)
            return res.status(500).json({ error: `Multer Error: ${err.message}` });
        } else if (err) {
            // Handle other errors like invalid file type
            return res.status(400).json({ error: `File Upload Error: ${err.message}` });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Validate CSV file
        validateCSVFile(req, res, async function () {
            const filePath = req.file.path;
            const requestId = uuidv4(); // Generate a unique request ID
            const products = [];

            // Parse CSV and store product data
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (row) => {
                    products.push({
                        serialNumber: row['SNO'],
                        productName: row['Product Name'],
                        inputImageUrls: row['Input Image Urls'].split(',') // Convert comma-separated URLs into an array
                    });
                })
                .on('end', async () => {
                    // Save request data into the database
                    const newRequest = new Request({
                        requestId,
                        status: 'pending',
                        products
                    });

                    await newRequest.save();

                    // Send back the request ID immediately
                    res.json({
                        message: 'CSV file uploaded successfully',
                        requestId
                    });

                    // You can initiate the image processing asynchronously after this if needed
                })
                .on('error', () => {
                    res.status(500).json({ error: 'Error processing the CSV file' });
                });
        });
    });
});

module.exports = router;
