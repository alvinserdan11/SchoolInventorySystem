const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  category_id:         { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  name:                { type: String, required: true },
  serial_number:       { type: String, default: '' },
  specifications:      { type: String, default: '' },
  operational_status:  { type: String, enum: ['Available','In-Use','Damaged'], default: 'Available' },
  condition_status:    { type: String, enum: ['Good','Fair','Needs Repair'], default: 'Good' },
  total_quantity:      { type: Number, required: true, min: 0 },
  available_quantity:  { type: Number, required: true, min: 0 },
  storage_location:    { type: String, default: '' },
  image_url:           { type: String, default: '' },
  is_active:           { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Equipment', equipmentSchema);
