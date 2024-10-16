const express = require('express');
const Request = require('../models/ImageRequest'); // Assuming you have a Request schema/model for saving requests in your database
const router = express.Router();

// GET /api/status/:requestId
router.get('status/:requestId', async (req, res) => {
    const { requestId } = req.params;  // Extract the requestId from the URL

    try {
        // Search for the request in the database using the requestId
        const requestDoc = await Request.findOne({ requestId });

        // If no request is found, return a 404 error
        if (!requestDoc) {
            return res.status(404).json({ message: 'Request not found' });
        }

        // Send back the request status and image details
        res.json({
            requestId: requestDoc.requestId,
            status: requestDoc.status,
            images: requestDoc.images
        });
    } catch (error) {
        console.error(`Error fetching request status: ${error}`);
        // Return a 500 error if something went wrong on the server
        res.status(500).json({ message: 'Server error, please try again later.' });
    }
});

module.exports = router;
