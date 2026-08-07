const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Lab = require('../models/Lab');
const { requireOwnerKey } = require('../middleware/ownerAuth');


// ============================================================
// REGISTER NEW LAB
// POST /api/labs/register
// ============================================================

router.post('/register', async (req, res) => {
  try {
    const {
      labName,
      email,
      adminName,
      password
    } = req.body;

    // Check required fields
    if (!labName || !email || !adminName || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Check duplicate email
    const existing = await Lab.findOne({
      email: email.toLowerCase().trim()
    });

    if (existing) {
      return res.status(409).json({
        message: 'A lab with this email is already registered'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create lab
    const lab = await Lab.create({
      labName: labName.trim(),
      email: email.toLowerCase().trim(),
      adminName: adminName.trim(),
      password: hashedPassword,

      // New labs must wait for owner approval
      status: 'pending'
    });

    return res.status(201).json({
      message: 'Registration submitted successfully. Your lab is pending approval.',
      labId: lab._id
    });

  } catch (err) {
    console.error('Register error:', err);

    return res.status(500).json({
      message: 'Server error during registration'
    });
  }
});


// ============================================================
// LAB LOGIN
// POST /api/labs/login
// ============================================================

router.post('/login', async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    const lab = await Lab.findOne({
      email: email.toLowerCase().trim()
    });

    if (!lab) {
      return res.status(404).json({
        message: 'Lab not found'
      });
    }

    // Check password
    const match = await bcrypt.compare(
      password,
      lab.password
    );

    if (!match) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    // Pending lab cannot login
    if (lab.status === 'pending') {
      return res.status(403).json({
        message: 'Your lab is still pending owner approval.'
      });
    }

    // Rejected lab cannot login
    if (lab.status === 'rejected') {
      return res.status(403).json({
        message: 'Your lab registration was rejected.'
      });
    }

    // Only approved labs can login
    if (lab.status !== 'approved') {
      return res.status(403).json({
        message: 'Your lab is not approved.'
      });
    }

    const token = jwt.sign(
      {
        id: lab._id,
        role: 'lab',
        labCode: lab.code
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '12h'
      }
    );

    return res.json({
      message: 'Login successful',

      token,

      lab: {
        id: lab._id,
        labName: lab.labName,
        email: lab.email,
        labCode: lab.code
      }
    });

  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      message: 'Server error during login'
    });
  }
});


// ============================================================
// OWNER - GET ALL LABS
// GET /api/labs/owner/all
// ============================================================

router.get(
  '/owner/all',
  requireOwnerKey,
  async (req, res) => {
    try {
      const labs = await Lab.find({})
        .select('-password')
        .sort({ createdAt: -1 });

      return res.json(labs);

    } catch (err) {
      console.error('Owner get labs error:', err);

      return res.status(500).json({
        message: 'Could not load labs'
      });
    }
  }
);


// ============================================================
// OWNER - APPROVE LAB
// PUT /api/labs/owner/:code/approve
// ============================================================

router.put(
  '/owner/:code/approve',
  requireOwnerKey,
  async (req, res) => {
    try {
      const lab = await Lab.findOne({
        code: req.params.code
      });

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found'
        });
      }

      if (lab.status === 'approved') {
        return res.status(400).json({
          message: 'This lab is already approved.'
        });
      }

      lab.status = 'approved';

      await lab.save();

      return res.json({
        message: 'Lab approved successfully.',
        lab
      });

    } catch (err) {
      console.error('Approve lab error:', err);

      return res.status(500).json({
        message: 'Could not approve lab'
      });
    }
  }
);


// ============================================================
// OWNER - REJECT LAB
// PUT /api/labs/owner/:code/reject
// ============================================================

router.put(
  '/owner/:code/reject',
  requireOwnerKey,
  async (req, res) => {
    try {
      const lab = await Lab.findOne({
        code: req.params.code
      });

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found'
        });
      }

      lab.status = 'rejected';

      await lab.save();

      return res.json({
        message: 'Lab rejected successfully.',
        lab
      });

    } catch (err) {
      console.error('Reject lab error:', err);

      return res.status(500).json({
        message: 'Could not reject lab'
      });
    }
  }
);


module.exports = router;