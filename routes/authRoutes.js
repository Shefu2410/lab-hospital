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
router.post('/login', async (req, res, next) => {
  try {
    const { labCode, username, password } = req.body;
    if (!labCode || !username || !password) {
      return res.status(400).json({ message: 'Lab code, username and password are required.' });
    }

    const lab = await Lab.findOne({ code: labCode.trim().toUpperCase() });
    if (!lab) return res.status(404).json({ message: 'No lab found with that code.' });
    if (!lab.active) {
      return res.status(403).json({ message: 'This lab account is deactivated. Contact support.' });
    }
    if (lab.status === 'pending') {
      return res.status(403).json({ message: 'Your lab is still pending approval. You will be able to log in once an owner approves it.' });
    }
    if (lab.status === 'rejected') {
      return res.status(403).json({ message: `Your lab's registration was rejected.${lab.rejectionReason ? ' Reason: ' + lab.rejectionReason : ''}` });
    }
    if (lab.status === 'suspended') {
      return res.status(403).json({ message: 'This lab account is suspended. Contact support.' });
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
