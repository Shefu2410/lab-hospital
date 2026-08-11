const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// The owner isn't a lab user - there's exactly one owner account, and its
// credentials live in .env rather than the database:
//   OWNER_USERNAME
//   OWNER_PASSWORD
// Set a strong, unique password there before deploying.

// POST /api/owner/login  body: { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!process.env.OWNER_USERNAME || !process.env.OWNER_PASSWORD) {
    return res.status(500).json({ message: 'Owner login is not configured. Set OWNER_USERNAME and OWNER_PASSWORD in .env.' });
  }

  if (username !== process.env.OWNER_USERNAME || password !== process.env.OWNER_PASSWORD) {
    return res.status(401).json({ message: 'Invalid owner credentials.' });
  }

  const token = jwt.sign({ role: 'owner' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  res.json({ token, user: { name: 'Owner', role: 'owner' } });
});

module.exports = router;
