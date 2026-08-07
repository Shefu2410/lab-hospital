const mongoose = require('mongoose');

const labSchema = new mongoose.Schema({
  labName: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  adminName: { type: String, required: true },
  password: { type: String, required: true }, // stored as bcrypt hash
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  labCode: { type: String, default: null }, // assigned only on approval
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lab', labSchema);