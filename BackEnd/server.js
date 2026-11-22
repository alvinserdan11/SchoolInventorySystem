const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { authMiddleware } = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Public routes (no auth required)
app.use('/api/auth', require('./routes/auth'));

// Protected routes (auth required)
app.use('/api/users', authMiddleware, require('./routes/users'));
app.use('/api/equipment', authMiddleware, require('./routes/equipment'));
app.use('/api/categories', authMiddleware, require('./routes/categories'));
app.use('/api/transactions', authMiddleware, require('./routes/transactions'));
app.use('/api/penalties', authMiddleware, require('./routes/penalties'));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'School Inventory System API is running!' });
});

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});