const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true }, // stored as bcrypt hash
  name: { type: String, default: 'Admin' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);