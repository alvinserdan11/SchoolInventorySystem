const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/authMiddleware');
const { authMiddleware } = require('../middleware/authMiddleware');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user by username or student_id_number
    const user = await User.findOne({
      $or: [
        { username: username },
        { student_id_number: username }
      ]
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user has a password (operators/admins only)
    if (!user.password) {
      return res.status(401).json({ success: false, message: 'This account cannot log in with password' });
    }

    // Compare password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check account status
    if (user.account_status !== 'Active') {
      return res.status(403).json({ success: false, message: 'Account is inactive. Contact administrator.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        user_type: user.user_type,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token: token,
      user: {
        _id: user._id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name} ${user.last_name}`,
        user_type: user.user_type,
        role: user.role
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/auth/change-password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    if (!user || !user.password) {
      return res.status(404).json({ success: false, message: 'User not found or password not set' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;