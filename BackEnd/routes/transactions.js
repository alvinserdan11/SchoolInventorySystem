const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Equipment = require('../models/Equipment');
const { authMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Helper to safely update equipment stock
async function safeStockUpdate(equipmentId, changeQty) {
  const equipment = await Equipment.findById(equipmentId);
  if (!equipment) return null;

  let newAvailable = equipment.available_quantity + changeQty;
  // Prevent corruption: available can never exceed total or be negative
  newAvailable = Math.max(0, Math.min(newAvailable, equipment.total_quantity));

  if (equipment.available_quantity !== newAvailable) {
    equipment.available_quantity = newAvailable;
    await equipment.save();
    console.log(`Safe stock update: ${equipment.name} ${changeQty > 0 ? '+' : ''}${changeQty} -> ${newAvailable}/${equipment.total_quantity}`);
  }
  return equipment;
}

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

// POST check and update overdue transactions
router.post('/check-overdue', async (req, res) => {
  try {
    const Penalty = require('../models/Penalty');
    const now = new Date();
    const BASE_PENALTY = 50;
    const PENALTY_PER_DAY = 50;

    // Find all borrowed items that are past expected return date
    const overdueTransactions = await Transaction.find({
      status: 'Borrowed',
      expected_return_date: { $exists: true, $ne: null, $lt: now }
    }).populate('user_id', 'first_name last_name')
      .populate('equipment_id', 'name');

    let updatedCount = 0;
    let penaltyCount = 0;

    for (const txn of overdueTransactions) {
      // Update status to Overdue
      txn.status = 'Overdue';
      await txn.save();
      updatedCount++;

      const user = txn.user_id;
      const userName = user ? `${user.first_name} ${user.last_name}` : 'Unknown';

      // Calculate days overdue
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysOverdue = Math.floor((now - new Date(txn.expected_return_date)) / msPerDay) + 1;
      const amountDue = BASE_PENALTY + (PENALTY_PER_DAY * (daysOverdue - 1));

      // Check if penalty already exists
      const existing = await Penalty.findOne({
        transaction_id: txn._id,
        reason: 'Late return',
        payment_status: 'Pending'
      });

      if (!existing) {
        await Penalty.create({
          transaction_id: txn._id,
          user_id: user ? user._id : null,
          user_name: userName,
          amount_due: amountDue,
          reason: 'Late return',
          payment_status: 'Pending',
          date_notified: new Date(),
          recorded_by: req.user.userId
        });
        penaltyCount++;
      } else if (existing.amount_due !== amountDue) {
        // Update penalty amount if more days have passed
        existing.amount_due = amountDue;
        await existing.save();
      }
    }

    res.json({
      success: true,
      message: `${updatedCount} transaction(s) marked overdue. ${penaltyCount} new penalty(s) created.`,
      overdueCount: updatedCount
    });
  } catch (err) {
    console.error('Check overdue error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST sync equipment stock (recalculate from transactions)
router.post('/sync-stock', async (req, res) => {
  try {
    const allEquipment = await Equipment.find();

    let fixedCount = 0;
    for (const equipment of allEquipment) {
      const equipIdStr = equipment._id.toString();

      // Fetch all active transactions and filter manually (handles string vs ObjectId mismatch)
      const activeTxns = await Transaction.find({
        status: { $in: ['Borrowed', 'Overdue'] }
      });

      let borrowedQuantity = 0;
      for (const txn of activeTxns) {
        const txnEquipId = txn.equipment_id ? txn.equipment_id.toString() : null;
        if (txnEquipId === equipIdStr) {
          borrowedQuantity += (parseInt(txn.quantity) || 0);
        }
      }

      const correctAvailable = equipment.total_quantity - borrowedQuantity;

      console.log(`Sync ${equipment.name}: total=${equipment.total_quantity}, borrowedQty=${borrowedQuantity}, currentAvailable=${equipment.available_quantity}, correctAvailable=${correctAvailable}`);

      if (equipment.available_quantity !== correctAvailable) {
        equipment.available_quantity = correctAvailable;
        await equipment.save();
        fixedCount++;
        console.log(`  -> FIXED to ${correctAvailable}`);
      }
    }

    res.json({
      success: true,
      message: `${fixedCount} equipment item(s) stock synced.`,
      fixedCount
    });
  } catch (err) {
    console.error('Sync stock error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create borrowing request
router.post('/', async (req, res) => {
  try {
    console.log('=== POST /transactions ===');
    console.log('Raw body:', req.body);

    // Ensure quantity is a proper number
    const qty = parseInt(req.body.quantity) || 0;
    console.log('Parsed qty:', qty);

    // Find equipment to check availability
    const equipment = await Equipment.findById(req.body.equipment_id);
    console.log('Equipment found:', equipment?.name, '| Available before:', equipment?.available_quantity);

    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }
    if (equipment.available_quantity < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.available_quantity} item(s) available. Cannot borrow ${qty}.`
      });
    }

    // Save transaction with parsed quantity
    const transactionData = { ...req.body, quantity: qty, processed_by: req.user.userId };
    const transaction = new Transaction(transactionData);
    await transaction.save();
    console.log('Transaction saved with quantity:', transaction.quantity);

    // Decrease stock safely
    if (req.body.status === 'Borrowed' && qty > 0) {
      await safeStockUpdate(req.body.equipment_id, -qty);
    }

    console.log('=== POST complete ===');
    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    console.error('POST /transactions ERROR:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT approve/reject/update transaction
router.put('/:id', async (req, res) => {
  try {
    console.log('=== PUT /transactions/:id called ===');
    console.log('Transaction ID:', req.params.id);
    console.log('Request body:', req.body);

    const oldTransaction = await Transaction.findById(req.params.id);
    if (!oldTransaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const oldStatus = oldTransaction.status;
    const newStatus = req.body.status;

    console.log('Status change:', oldStatus, '->', newStatus);
    console.log('Equipment ID:', oldTransaction.equipment_id);
    console.log('Quantity:', oldTransaction.quantity);

    const updateData = { ...req.body };
    if (newStatus === 'Returned') {
      updateData.processed_by = req.user.userId;
    }

    const transaction = await Transaction.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // If status changed TO "Returned" (from Borrowed OR Overdue), restore stock
    const wasReturned = oldStatus === 'Borrowed' || oldStatus === 'Overdue';
    if (newStatus === 'Returned' && wasReturned) {
      console.log('Restoring stock for returned item...');

      if (!oldTransaction.equipment_id) {
        console.log('ERROR: equipment_id is missing!');
      } else if (!oldTransaction.quantity) {
        console.log('ERROR: quantity is missing!');
      } else {
        await safeStockUpdate(oldTransaction.equipment_id, oldTransaction.quantity);
      }
    }

    console.log('=== PUT complete ===');
    res.json({ success: true, data: transaction });
  } catch (err) {
    console.error('PUT /transactions ERROR:', err);
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;