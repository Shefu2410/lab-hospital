const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'pathologist', 'lab-technician'],
      default: 'lab-technician',
    },
    // Every user belongs to exactly one Lab.
    lab: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lab',
      required: true,
    },
  },
  { timestamps: true }
);

// Usernames only need to be unique *within* a lab (two labs can both have "admin").
userSchema.index({ lab: 1, username: 1 }, { unique: true });

// Hash password whenever it is set/changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
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
