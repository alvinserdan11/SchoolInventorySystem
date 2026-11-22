const mongoose = require('mongoose');

const penaltySchema = new mongoose.Schema({
  transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: false, default: null },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user_name: { type: String, required: true },
  amount_due: { type: Number, required: true },
  reason: { type: String, required: true },
  payment_status: { type: String, enum: ['Pending', 'Paid', 'Waived'], default: 'Pending' },
  date_notified: { type: Date, default: Date.now },
  date_settled: { type: Date, default: null },
  recorded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Penalty', penaltySchema);