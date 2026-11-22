const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/authMiddleware');

// Apply auth middleware to all user routes
router.use(authMiddleware);

// GET all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create user
router.post('/', async (req, res) => {
  try {
    const userData = { ...req.body };

    // Hash password if provided
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = new User(userData);
    await user.save();
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update user
router.put('/:id', async (req, res) => {
  try {
    const userData = { ...req.body };

    // Hash password if it's being updated
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
    }

    const user = await User.findByIdAndUpdate(req.params.id, userData, { new: true });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;