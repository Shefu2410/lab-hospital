const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const Lab = require('../models/Lab');
const requireAdmin = require('../middleware/requireAdmin');

// POST /api/admin/login
router.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ message: 'Login successful', token });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ message: 'Server error during admin login' });
  }
});

// GET /api/admin/labs/pending  (admin only)
router.get('/api/admin/labs/pending', requireAdmin, async (req, res) => {
  try {
    const pending = await Lab.find({ status: 'pending' }).select('-password');
    return res.json(pending);
  } catch (err) {
    console.error('Fetch pending labs error:', err);
    return res.status(500).json({ message: 'Server error fetching pending labs' });
  }
});

// GET /api/admin/labs  (admin only) — all labs, any status
router.get('/api/admin/labs', requireAdmin, async (req, res) => {
  try {
    const labs = await Lab.find().select('-password');
    return res.json(labs);
  } catch (err) {
    console.error('Fetch labs error:', err);
    return res.status(500).json({ message: 'Server error fetching labs' });
  }
});

// POST /api/admin/labs/:id/approve  (admin only)
router.post('/api/admin/labs/:id/approve', requireAdmin, async (req, res) => {
  try {
    const labCode = 'LAB-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', labCode },
      { new: true }
    ).select('-password');

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    return res.json({ message: 'Lab approved', lab });
  } catch (err) {
    console.error('Approve lab error:', err);
    return res.status(500).json({ message: 'Server error approving lab' });
  }
});

// POST /api/admin/labs/:id/reject  (admin only)
router.post('/api/admin/labs/:id/reject', requireAdmin, async (req, res) => {
  try {
    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).select('-password');

    if (!lab) {
      return res.status(404).json({ message: 'Lab not found' });
    }

    return res.json({ message: 'Lab rejected', lab });
  } catch (err) {
    console.error('Reject lab error:', err);
    return res.status(500).json({ message: 'Server error rejecting lab' });
  }
});

module.exports = router;