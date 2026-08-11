const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },

    // Platform-level approval workflow. A newly registered lab starts
    // 'pending' and cannot log in until the owner approves it from /owner.html.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'],
      default: 'pending',
    },
    approvedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },

    // Reversible (AES-encrypted, not hashed) copy of the lab admin's password,
    // captured only at registration time. This exists solely so the owner can
    // read it back from the Owner page (see routes/adminRoutes.js). It is
    // never exposed through any lab-facing API. If the lab admin later
    // changes their password, this stored copy goes stale on purpose - it is
    // only meant to cover the initial handover.
    adminPasswordEnc: { type: String, default: '' },

    // Kept for backward compatibility / manual deactivation independent of
    // the approval workflow above.
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Lab', labSchema);
