const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    // Labs created by seed.js or directly in the DB default to active. Labs
    // created via POST /api/labs/register are explicitly set to inactive and
    // stay that way until the platform owner approves them - see
    // routes/labRoutes.js (owner-only endpoints) and middleware/ownerAuth.js.
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lab', labSchema);