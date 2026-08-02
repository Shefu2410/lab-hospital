const express = require('express');
const Lab = require('../models/Lab');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { generateLabCode } = require('../utils/idGenerator');

const router = express.Router();

// POST /api/labs/register - a new lab signs itself up (public, no auth).
// Creates the Lab and its first admin user. It's active immediately -
// there's no separate approval step, the lab admin can log in right away.
router.post('/register', async (req, res, next) => {
  try {
    const { labName, labEmail, labPhone, labAddress, adminName, adminUsername, adminPassword } = req.body;

    if (!labName || !labEmail || !adminName || !adminUsername || !adminPassword) {
      return res.status(400).json({
        message: 'labName, labEmail, adminName, adminUsername and adminPassword are required.',
      });
    }

    const existingLab = await Lab.findOne({ email: labEmail.trim().toLowerCase() });
    if (existingLab) {
      return res.status(409).json({ message: 'A lab with that email has already registered.' });
    }

    const code = await generateLabCode(labName);

    const lab = await Lab.create({
      code,
      name: labName.trim(),
      email: labEmail.trim().toLowerCase(),
      phone: labPhone || '',
      address: labAddress || '',
    });

    const admin = await User.create({
      name: adminName.trim(),
      username: adminUsername.trim().toLowerCase(),
      password: adminPassword,
      role: 'admin',
      lab: lab._id,
    });

    res.status(201).json({
      message: `Lab registered. Log in with lab code ${lab.code}.`,
      lab: { code: lab.code, name: lab.name },
      admin: admin.toSafeObject(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/labs/me - the logged-in lab admin's own lab profile
router.get('/me', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.user.lab);
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    res.json(lab);
  } catch (err) {
    next(err);
  }
});

// PUT /api/labs/me - lab admin updates their own contact details
router.put('/me', protect, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const lab = await Lab.findByIdAndUpdate(
      req.user.lab,
      { ...(name && { name }), ...(phone !== undefined && { phone }), ...(address !== undefined && { address }) },
      { new: true, runValidators: true }
    );
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    res.json(lab);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
