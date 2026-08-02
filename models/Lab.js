const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    // No platform-level approval step anymore - a lab is usable as soon as it
    // registers. `active` is kept only so a lab's own admin (or a future
    // internal tool) could flip it off if the lab needs to be deactivated.
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lab', labSchema);
