const express = require('express');
const { checkStatus } = require('../controllers/imageController');
const router = express.Router();

router.get('/:id', checkStatus);

module.exports = router;
