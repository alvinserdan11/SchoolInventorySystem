const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { authMiddleware } = require('./middleware/authMiddleware');
const { requireRole } = require('./middleware/roleMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Render and other reverse proxies)
app.set('trust proxy', 1);

// Allowed origins for CORS
const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, same-origin)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production, allow any origin since frontend is served from same domain
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies (with 10MB limit for image uploads)
app.use(express.json({ limit: '10mb' }));

// Serve frontend static files from docs folder
app.use(express.static(path.join(__dirname, '../docs')));

// ============================================
// HEALTH CHECK (used by Render)
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ============================================
// MONGODB CONNECTION
// ============================================
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('ERROR: MONGODB_URI is not defined in environment variables!');
      process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB!');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    // Retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

// Handle MongoDB connection events
mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

// ============================================
// RATE LIMITERS
// ============================================

// Login rate limiter: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all API routes
app.use('/api/', apiLimiter);

// ============================================
// ROUTES
// ============================================

// Public routes (no auth required)
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', require('./routes/auth'));

// Protected routes - Admin + Custodian can access (day-to-day operations)
app.use('/api/equipment', authMiddleware, require('./routes/equipment'));
app.use('/api/transactions', authMiddleware, require('./routes/transactions'));
app.use('/api/penalties', authMiddleware, require('./routes/penalties'));
app.use('/api/categories', authMiddleware, require('./routes/categories'));

// Protected routes - Admin ONLY (system management)
app.use('/api/users', authMiddleware, require('./routes/users'));

// ============================================
// FRONTEND ROUTES (SPA support)
// ============================================

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../docs', 'index.html'));
});

// Catch-all: serve index.html for any unrecognized route
// This allows the frontend to handle client-side routing
app.get('*', (req, res) => {
  // Only serve index.html for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../docs', 'index.html'));
  }
});

// ============================================
// ERROR HANDLERS
// ============================================

// Global 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`============================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Local: http://localhost:${PORT}`);
  console.log(`============================================`);
});
