const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Lab = require('../models/Lab');
const { requireOwnerKey } = require('../middleware/ownerAuth');

// ============================================================
// Helper: Generate unique Lab Code
// Example: RKH82A
// ============================================================

async function generateLabCode(labName) {
  const base =
    (labName || 'LAB')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 3) || 'LAB';

  for (let attempt = 0; attempt < 20; attempt++) {
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase();

    const code = `${base}${randomPart}`;

    const existing = await Lab.findOne({
      labCode: code
    });

    if (!existing) {
      return code;
    }
  }

  // Very unlikely fallback
  return `${base}${Date.now().toString().slice(-4)}`;
}


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

    // Validate fields
    if (!labName || !email || !adminName || !password) {
      return res.status(400).json({
        message: 'All fields are required'
      });
    }

    // Check email
    const cleanEmail = email.toLowerCase().trim();

    const existingLab = await Lab.findOne({
      email: cleanEmail
    });

    if (existingLab) {
      return res.status(409).json({
        message: 'A lab with this email is already registered'
      });
    }

    // Password hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create lab
    const lab = await Lab.create({
      labName: labName.trim(),
      email: cleanEmail,
      adminName: adminName.trim(),
      password: hashedPassword,

      // New labs start as pending
      status: 'pending',

      // Lab code will be created when owner approves
      labCode: ''
    });

    return res.status(201).json({
      message: 'Signup received. Your lab is pending owner approval.',
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
//
// Login using:
// Lab Code + Password
// ============================================================

router.post('/login', async (req, res) => {
  try {
    const {
      labCode,
      password
    } = req.body;

    // Validate
    if (!labCode || !password) {
      return res.status(400).json({
        message: 'Lab code and password are required'
      });
    }

    const cleanLabCode = labCode
      .trim()
      .toUpperCase();

    // Find lab by Lab Code
    const lab = await Lab.findOne({
      labCode: cleanLabCode
    });

    if (!lab) {
      return res.status(404).json({
        message: 'Lab not found with this lab code'
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      lab.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    // Pending
    if (lab.status === 'pending') {
      return res.status(403).json({
        message: 'Your lab is still pending owner approval.'
      });
    }

    // Rejected
    if (lab.status === 'rejected') {
      return res.status(403).json({
        message: 'Your lab registration was rejected.'
      });
    }

    // Only approved labs can login
    if (lab.status !== 'approved') {
      return res.status(403).json({
        message: 'Your lab is not approved yet.'
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: lab._id,
        role: 'lab',
        labCode: lab.labCode
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
        adminName: lab.adminName,
        labCode: lab.labCode,
        status: lab.status
      }
    });

  } catch (err) {
    console.error('Lab login error:', err);

    return res.status(500).json({
      message: 'Server error during lab login'
    });
  }
});


// ============================================================
// OWNER: GET ALL LABS
// GET /api/labs/owner/all
// ============================================================

router.get(
  '/owner/all',
  requireOwnerKey,
  async (req, res) => {
    try {
      const labs = await Lab.find()
        .select('-password')
        .sort({ createdAt: -1 });

      return res.json(labs);

    } catch (err) {
      console.error('Get labs error:', err);

      return res.status(500).json({
        message: 'Failed to load labs'
      });
    }
  }
);


// ============================================================
// OWNER: APPROVE LAB
// PUT /api/labs/owner/:code/approve
// ============================================================

router.put(
  '/owner/:code/approve',
  requireOwnerKey,
  async (req, res) => {
    try {
      const code = req.params.code;

      const lab = await Lab.findOne({
        $or: [
          { labCode: code },
          { _id: code }
        ]
      });

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found'
        });
      }

      // Generate Lab Code if it doesn't already exist
      if (!lab.labCode) {
        lab.labCode = await generateLabCode(
          lab.labName
        );
      }

      // Approve lab
      lab.status = 'approved';

      await lab.save();

      return res.json({
        message: 'Lab approved successfully',
        lab: {
          id: lab._id,
          labName: lab.labName,
          email: lab.email,
          adminName: lab.adminName,
          labCode: lab.labCode,
          status: lab.status
        }
      });

    } catch (err) {
      console.error('Approve lab error:', err);

      return res.status(500).json({
        message: 'Failed to approve lab'
      });
    }
  }
);


// ============================================================
// OWNER: REVOKE LAB
// PUT /api/labs/owner/:code/revoke
// ============================================================

router.put(
  '/owner/:code/revoke',
  requireOwnerKey,
  async (req, res) => {
    try {
      const code = req.params.code;

      const lab = await Lab.findOne({
        labCode: code
      });

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found'
        });
      }

      lab.status = 'pending';

      await lab.save();

      return res.json({
        message: 'Lab approval revoked',
        lab: {
          labName: lab.labName,
          labCode: lab.labCode,
          status: lab.status
        }
      });

    } catch (err) {
      console.error('Revoke lab error:', err);

      return res.status(500).json({
        message: 'Failed to revoke lab'
      });
    }
  }
);


module.exports = router;