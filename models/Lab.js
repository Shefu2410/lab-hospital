const mongoose = require('mongoose');

const labSchema = new mongoose.Schema(
  {
    // --------------------------------------------------
    // LAB DETAILS
    // --------------------------------------------------

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

    // --------------------------------------------------
    // FIRST ADMIN DETAILS
    // --------------------------------------------------

    adminName: {
      type: String,
      required: true,
      trim: true
    },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    password: {
      type: String,
      required: true
    },

    // --------------------------------------------------
    // LAB CODE
    //
    // This is generated when the owner approves
    // the laboratory.
    // --------------------------------------------------

    labCode: {
      type: String,
      unique: true,
      sparse: true,
      default: null,
      uppercase: true,
      trim: true
    },

    // --------------------------------------------------
    // LAB STATUS
    // --------------------------------------------------

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


// --------------------------------------------------
// INDEXES
// --------------------------------------------------

labSchema.index(
  { email: 1 },
  { unique: true }
);

labSchema.index(
  { username: 1 },
  { unique: true }
);

labSchema.index(
  { labCode: 1 },
  {
    unique: true,
    sparse: true
  }
);


module.exports = mongoose.model('Lab', labSchema);