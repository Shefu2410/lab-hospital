const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
    patientId: { type: String, required: true },
    name: { type: String, required: true },
    age: { type: Number, required: true },
    ageUnit: { type: String, enum: ['Years', 'Months', 'Days'], default: 'Years' },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    referredBy: { type: String, default: '' },
  },
  { timestamps: true }
);

patientSchema.index({ lab: 1, patientId: 1 }, { unique: true });

module.exports = mongoose.model('Patient', patientSchema);
