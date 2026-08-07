const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Lab = require('../models/Lab');

// POST /api/labs/register
router.post('/register', async (req, res) => {
  try {
    const { labName, email, adminName, password } = req.body;

    if (!labName || !email || !adminName || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await Lab.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'A lab with this email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lab = await Lab.create({
      labName,
      email: email.toLowerCase().trim(),
      adminName,
      password: hashedPassword,
      status: 'pending'
    });

    return res.status(201).json({
      message: 'Signup received. Your lab is pending admin approval.',
      labId: lab._id
    });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/labs/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const lab = await Lab.findOne({ email: email.toLowerCase().trim() });
    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    const match = await bcrypt.compare(password, lab.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (lab.status === 'pending') {
      return res.status(403).json({ message: 'Your lab is still pending admin approval.' });
    }
    if (lab.status === 'rejected') {
      return res.status(403).json({ message: 'Your lab registration was rejected.' });
    }

    const token = jwt.sign(
      { id: lab._id, role: 'lab', labCode: lab.labCode },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      message: 'Login successful',
      token,
      lab: { id: lab._id, labName: lab.labName, email: lab.email, labCode: lab.labCode }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;