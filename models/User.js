const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      // 'superadmin' is the platform admin who approves/rejects/suspends labs.
      // It is not tied to any single Lab.
      enum: ['superadmin', 'admin', 'pathologist', 'lab-technician'],
      default: 'lab-technician',
    },
    // Every user belongs to exactly one Lab, except a superadmin.
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: function () {
        return this.role !== 'superadmin';
      },
    },
  },
  { timestamps: true }
);

// Usernames only need to be unique *within* a lab (two labs can both have "admin").
userSchema.index({ lab: 1, username: 1 }, { unique: true });

// Hash password whenever it is set/changed
userSchema.pre('save', async function (next) {

  if (!this.isModified('password')) {
    return next();
  }

  // If password is already bcrypt hashed,
  // don't hash it again.
  if (
    this.password.startsWith('$2a$') ||
    this.password.startsWith('$2b$') ||
    this.password.startsWith('$2y$')
  ) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);

  this.password =
    await bcrypt.hash(
      this.password,
      salt
    );

  next();
});
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    username: this.username,
    role: this.role,
    lab: this.lab || null,
  };
};

module.exports = mongoose.model('User', userSchema);
