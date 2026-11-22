const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  student_id_number: { type: String, default: '' },
  username: { type: String, unique: true, sparse: true },
  first_name: { type: String, required: true },
  middle_name: { type: String, default: '' },
  last_name: { type: String, required: true },
  address: { type: String, default: '' },
  email: { type: String, required: true, unique: true },
  contact_number: { type: String, required: true },
  date_of_birth: { type: Date, default: null },
  department: { type: String, required: true },
  course: { type: String, required: true },
  user_type: { type: String, enum: ['student', 'teacher', 'custodian', 'admin'], required: true },
  role: { type: String, enum: ['borrower', 'operator'], required: true },
  account_status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  password: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
