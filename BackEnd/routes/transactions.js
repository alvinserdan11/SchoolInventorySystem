const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Equipment = require('../models/Equipment');

// GET all transactions (borrowing history)
router.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('user_id', 'first_name last_name')
      .populate('equipment_id', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: transactions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET pending requests
router.get('/requests/pending', async (req, res) => {
  try {
    const requests = await Transaction.find({ status: 'Pending' })
      .populate('user_id', 'first_name last_name')
      .populate('equipment_id', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create borrowing request
router.post('/', async (req, res) => {
  try {
    console.log('POST /transactions body:', req.body);

    // Check if equipment exists and has enough stock
    const equipment = await Equipment.findById(req.body.equipment_id);
    console.log('Found equipment:', equipment);

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    if (equipment.available_quantity < req.body.quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.available_quantity} item(s) available. Cannot borrow ${req.body.quantity}.`
      });
    }

    // Create the transaction
    const transaction = new Transaction(req.body);
    await transaction.save();
    console.log('Transaction saved:', transaction._id);

    // Decrease available quantity when status is "Borrowed"
    if (req.body.status === 'Borrowed') {
      const updated = await Equipment.findByIdAndUpdate(
        req.body.equipment_id,
        { $inc: { available_quantity: -req.body.quantity } },
        { new: true }
      );
      console.log('Equipment stock updated. New available:', updated.available_quantity);
    }

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error('POST /transactions ERROR:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT approve/reject/update transaction
router.put('/:id', async (req, res) => {
  try {
    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const oldStatus = oldTransaction.status;
    const newStatus = req.body.status;

    const transaction = await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // If status changed TO "Borrowed", decrease stock
    if (newStatus === 'Borrowed' && oldStatus !== 'Borrowed') {
      await Equipment.findByIdAndUpdate(oldTransaction.equipment_id, {
        $inc: { available_quantity: -oldTransaction.quantity }
      });
    }

    // If status changed TO "Returned", increase stock
    if (newStatus === 'Returned' && oldStatus !== 'Returned') {
      await Equipment.findByIdAndUpdate(oldTransaction.equipment_id, {
        $inc: { available_quantity: oldTransaction.quantity }
      });
    }

    res.json({ success: true, data: transaction });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;