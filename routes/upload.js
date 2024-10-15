const express = require('express');
const { uploadCSV } = require('../controllers/imageController');
const router = express.Router();

router.post('/', uploadCSV);

module.exports = router;
