const express = require('express');
const router = express.Router();
const Penalty = require('../models/Penalty');

// GET all penalties
router.get('/', async (req, res) => {
  try {
    const penalties = await Penalty.find()
      .populate('transaction_id')
      .populate('user_id', 'first_name last_name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: penalties });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create penalty
router.post('/', async (req, res) => {
  try {
    const penalty = new Penalty(req.body);
    await penalty.save();
    res.status(201).json({ success: true, data: penalty });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update penalty (mark as paid/waived)
router.put('/:id', async (req, res) => {
  try {
    const penalty = await Penalty.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: penalty });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
