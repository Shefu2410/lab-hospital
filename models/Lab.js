const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    labName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    adminName: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    password: {
      type: String,
      required: true
    },

    labCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      default: null
    },

    status: {
      type: String,
      enum: [
        'pending',
        'approved',
        'rejected',
        'revoked'
      ],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

// Username should be unique inside a lab.
// Since each Lab currently has one registration/admin username,
// this prevents duplicate usernames globally at registration level.
labSchema.index(
  { username: 1 },
  { unique: true }
);

module.exports = mongoose.model('Lab', labSchema);