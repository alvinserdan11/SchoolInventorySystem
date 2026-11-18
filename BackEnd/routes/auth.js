const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // For now, simple check: username = "admin", password = "admin123"
    // In production, search by username field and compare hashed password
    if (username === 'admin' && password === 'admin123') {
      return res.json({
        success: true,
        user: {
          _id: 'admin001',
          first_name: 'Admin',
          last_name: 'User',
          user_type: 'admin',
          role: 'operator'
        }
      });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
