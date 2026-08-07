const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const Lab = require('../models/Lab');
const { requireOwnerKey } = require('../middleware/ownerAuth');

// ============================================================
// LAB REGISTRATION
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
        message: 'All fields are required.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check duplicate email
    const existingLab = await Lab.findOne({
      email: cleanEmail
    });

    if (existingLab) {
      return res.status(409).json({
        message: 'A lab with this email is already registered.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create pending lab
    const lab = await Lab.create({
      labName: labName.trim(),
      email: cleanEmail,
      adminName: adminName.trim(),
      password: hashedPassword,

      // Lab code is created ONLY after approval
      labCode: null,

      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Your lab is pending owner approval.',
      labId: lab._id
    });

  } catch (error) {
    console.error('LAB REGISTER ERROR:', error);

    res.status(500).json({
      message: 'Server error during lab registration.'
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
        message: 'Email and password are required.'
      });
    }

    const lab = await Lab.findOne({
      email: email.toLowerCase().trim()
    });

    if (!lab) {
      return res.status(404).json({
        message: 'Lab not found.'
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(
      password,
      lab.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.'
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

    // Revoked
    if (lab.status === 'revoked') {
      return res.status(403).json({
        message: 'Your lab access has been revoked.'
      });
    }

    // Must have code
    if (!lab.labCode) {
      return res.status(500).json({
        message: 'Lab is approved but lab code is missing.'
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

    res.json({
      success: true,
      message: 'Login successful.',

      token,

      lab: {
        id: lab._id,
        labName: lab.labName,
        email: lab.email,
        adminName: lab.adminName,
        labCode: lab.labCode
      }
    });

  } catch (error) {

    console.error('LAB LOGIN ERROR:', error);

    res.status(500).json({
      message: 'Server error during login.'
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
        .sort({
          createdAt: -1
        });

      res.json(labs);

    } catch (error) {

      console.error('GET LABS ERROR:', error);

      res.status(500).json({
        message: 'Failed to load laboratories.'
      });
    }
  }
);


// ============================================================
// OWNER - APPROVE LAB
// PUT /api/labs/owner/:id/approve
// ============================================================

router.put(
  '/owner/:id/approve',
  requireOwnerKey,
  async (req, res) => {

    try {

      const lab = await Lab.findById(req.params.id);

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found.'
        });
      }

      if (lab.status === 'approved') {
        return res.status(400).json({
          message: 'This lab is already approved.'
        });
      }

      // --------------------------------------------------------
      // Generate unique lab code
      // Example: RKHCR64
      // --------------------------------------------------------

      let labCode;
      let exists = true;

      while (exists) {

        const randomPart = Math.random()
          .toString(36)
          .substring(2, 7)
          .toUpperCase();

        labCode = `RKH${randomPart}`;

        exists = await Lab.exists({
          labCode
        });
      }

      // Update lab
      lab.status = 'approved';
      lab.labCode = labCode;

      await lab.save();

      res.json({
        success: true,
        message: 'Laboratory approved successfully.',
        lab: {
          id: lab._id,
          labName: lab.labName,
          email: lab.email,
          adminName: lab.adminName,
          labCode: lab.labCode,
          status: lab.status
        }
      });

    } catch (error) {

      console.error('APPROVE LAB ERROR:', error);

      res.status(500).json({
        message: 'Failed to approve laboratory.'
      });
    }
  }
);


// ============================================================
// OWNER - REJECT LAB
// PUT /api/labs/owner/:id/reject
// ============================================================

router.put(
  '/owner/:id/reject',
  requireOwnerKey,
  async (req, res) => {

    try {

      const lab = await Lab.findById(req.params.id);

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found.'
        });
      }

      lab.status = 'rejected';

      await lab.save();

      res.json({
        success: true,
        message: 'Laboratory rejected successfully.'
      });

    } catch (error) {

      console.error('REJECT LAB ERROR:', error);

      res.status(500).json({
        message: 'Failed to reject laboratory.'
      });
    }
  }
);


// ============================================================
// OWNER - REVOKE APPROVED LAB
// PUT /api/labs/owner/:id/revoke
// ============================================================

router.put(
  '/owner/:id/revoke',
  requireOwnerKey,
  async (req, res) => {

    try {

      const lab = await Lab.findById(req.params.id);

      if (!lab) {
        return res.status(404).json({
          message: 'Lab not found.'
        });
      }

      lab.status = 'revoked';

      await lab.save();

      res.json({
        success: true,
        message: 'Laboratory access revoked successfully.'
      });

    } catch (error) {

      console.error('REVOKE LAB ERROR:', error);

      res.status(500).json({
        message: 'Failed to revoke laboratory.'
      });
    }
  }
);


module.exports = router;