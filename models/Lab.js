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

    password: {
      type: String,
      required: true
    },

    labCode: {
      type: String,
      unique: true,
      sparse: true,
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

module.exports = mongoose.model('Lab', labSchema);