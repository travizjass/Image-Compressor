const express = require('express');
const mongoose = require('mongoose');
const uploadRoutes = require('./routes/upload');
const statusRoutes = require('./routes/status');
require('dotenv').config();

const app = express();

// Database connection
mongoose.connect(process.env.DB_URI)
    .then(() => console.log('Database connected'))
    .catch(err => console.log('DB Error:', err));

// Middleware
app.use(express.json());

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/status', statusRoutes);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
