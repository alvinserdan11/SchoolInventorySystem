const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { authMiddleware } = require('./middleware/authMiddleware');
const { requireRole } = require('./middleware/roleMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// Only allow your frontend
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB!'))
  .catch(err => console.error('MongoDB connection error:', err));

// Login rate limiter: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no auth required)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/auth'));

// Admin + Custodian can access (day-to-day operations)
app.use('/api/equipment', authMiddleware, require('./routes/equipment'));
app.use('/api/transactions', authMiddleware, require('./routes/transactions'));
app.use('/api/penalties', authMiddleware, require('./routes/penalties'));
app.use('/api/categories', authMiddleware, require('./routes/categories'));

// Admin ONLY routes (system management)
app.use('/api/users', authMiddleware, require('./routes/users'));

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