const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lab = require('../models/Lab');
const { protect } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role, lab: user.lab }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });
}

// POST /api/auth/login
// body: { labCode, username, password }
// A platform admin (superadmin) logs in the same way but with the reserved
// lab code "PLATFORM", since they aren't attached to any single lab.
router.post('/login', async (req, res, next) => {
  try {
    const { labCode, username, password } = req.body;
    if (!labCode || !username || !password) {
      return res.status(400).json({ message: 'Lab code, username and password are required.' });
    }

    const normalizedCode = labCode.trim().toUpperCase();

    if (normalizedCode === 'PLATFORM') {
      const admin = await User.findOne({ role: 'superadmin', username: username.trim().toLowerCase() });
      if (!admin || !(await admin.comparePassword(password))) {
        return res.status(401).json({ message: 'Invalid username or password.' });
      }
      const token = signToken(admin);
      return res.json({ token, user: admin.toSafeObject(), lab: null });
    }

    const lab = await Lab.findOne({ code: normalizedCode });
    if (!lab) return res.status(404).json({ message: 'No lab found with that code.' });

    if (lab.status !== 'approved') {
      const messages = {
        pending: 'This lab is still awaiting approval. Please check back once it has been approved.',
        rejected: `This lab's registration was not approved.${lab.rejectionReason ? ' Reason: ' + lab.rejectionReason : ''}`,
        suspended: 'This lab account is suspended. Contact support.',
      };
      return res.status(403).json({ message: messages[lab.status] || 'This lab is not active.' });
    }

    const user = await User.findOne({ lab: lab._id, username: username.trim().toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = signToken(user);
    res.json({
      token,
      user: user.toSafeObject(),
      lab: { code: lab.code, name: lab.name },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me - confirms the current session and returns the user
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
