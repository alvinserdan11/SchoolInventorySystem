const express = require('express');
const router = express.Router();
const Equipment = require('../models/Equipment');

// GET all equipment
router.get('/', async (req, res) => {
  try {
    const equipment = await Equipment.find().populate('category_id').sort({ createdAt: -1 });
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create equipment
router.post('/', async (req, res) => {
  try {
    const equipment = new Equipment(req.body);
    await equipment.save();
    res.status(201).json({ success: true, data: equipment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update equipment
router.put('/:id', async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: equipment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE equipment
router.delete('/:id', async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
