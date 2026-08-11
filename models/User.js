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

const User = mongoose.model('User', userSchema);

// --- Auto-fix: remove any stale standalone unique index on "username" ---
// An earlier version of this schema may have had `unique: true` directly
// on the `username` field. Mongoose does not drop old indexes when a
// schema changes, so MongoDB can still be enforcing a global unique
// constraint on username across ALL labs, even though the schema above
// only wants uniqueness scoped to { lab, username }. This runs once,
// automatically, whenever the app connects - no manual script needed.
mongoose.connection.once('open', async () => {
  try {
    const indexes = await User.collection.indexes();
    const staleIndex = indexes.find(
      (idx) =>
        idx.unique === true &&
        Object.keys(idx.key).length === 1 &&
        Object.keys(idx.key)[0] === 'username'
    );

    if (staleIndex) {
      await User.collection.dropIndex(staleIndex.name);
      console.log(`[User model] Dropped stale unique index "${staleIndex.name}" on username.`);
    }

    // Ensure the correct compound index exists.
    await User.collection.createIndex({ lab: 1, username: 1 }, { unique: true });
  } catch (err) {
    // Non-fatal - log it but don't crash the app on startup.
    console.error('[User model] Index sync check failed:', err.message);
  }
});

module.exports = User;