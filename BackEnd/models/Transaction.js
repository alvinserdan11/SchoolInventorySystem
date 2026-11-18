const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user_id:              { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  equipment_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Equipment', required: true },
  borrower_name:        { type: String, required: true },
  borrower_id_number:   { type: String, required: true },
  equipment_name:       { type: String, required: true },
  quantity:             { type: Number, required: true, min: 1 },
  purpose:              { type: String, required: true },
  checkout_date:        { type: Date, required: true },
  expected_return_date: { type: Date, required: true },
  actual_return_date:   { type: Date, default: null },
  return_condition:     { type: String, enum: ['Good','Damaged','Needs Repair'], default: null },
  status:               { type: String, enum: ['Pending','Approved','Rejected','Borrowed','Returned','Overdue'], default: 'Pending' },
  signature_data_url:   { type: String, default: '' },
  notes:                { type: String, default: '' },
  processed_by:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
