const express = require('express');
const Lab = require('../models/Lab');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { requireOwnerKey } = require('../middleware/ownerAuth');
const { generateLabCode } = require('../utils/idGenerator');

const router = express.Router();

// POST /api/labs/register - a new lab signs itself up (public, no auth).
// Creates the Lab (inactive) and its first admin user. The lab CANNOT log in
// until you approve it via PUT /api/labs/:code/approve - see below.
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
      active: false, // pending until the platform owner approves it
    });

    const admin = await User.create({
      name: adminName.trim(),
      username: adminUsername.trim().toLowerCase(),
      password: adminPassword,
      role: 'admin',
      lab: lab._id,
    });

    res.status(201).json({
      message: `Lab registered with code ${lab.code}. It won't be able to log in until the platform owner approves it.`,
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

// POST /api/labs/forgot-code - public. Looks up a lab by the email it
// registered with and returns its code, for a lab that lost/forgot it.
router.post('/forgot-code', async (req, res, next) => {
  try {
    const { labEmail } = req.body;
    if (!labEmail) {
      return res.status(400).json({ message: 'Enter the email address the lab registered with.' });
    }

    const lab = await Lab.findOne({ email: labEmail.trim().toLowerCase() });
    if (!lab) {
      return res.status(404).json({ message: 'No lab is registered with that email address.' });
    }

    res.json({ code: lab.code, name: lab.name });
  } catch (err) {
    next(err);
  }
});

// ---------- owner-only: approve / revoke labs ----------
// Not a user login - these require the private OWNER_SECRET_KEY (see .env
// and middleware/ownerAuth.js) sent as the x-owner-key header. Only you know
// this key, so only you can let a new lab in.

// GET /api/labs/owner/all - list every lab and its active/pending status
router.get('/owner/all', requireOwnerKey, async (req, res, next) => {
  try {
    const labs = await Lab.find().sort({ createdAt: -1 });
    res.json(labs);
  } catch (err) {
    next(err);
  }
});

// PUT /api/labs/owner/:code/approve - let this lab log in
router.put('/owner/:code/approve', requireOwnerKey, async (req, res, next) => {
  try {
    const lab = await Lab.findOneAndUpdate(
      { code: req.params.code.trim().toUpperCase() },
      { active: true },
      { new: true }
    );
    if (!lab) return res.status(404).json({ message: 'No lab found with that code.' });
    res.json({ message: `${lab.name} (${lab.code}) can now log in.`, lab });
  } catch (err) {
    next(err);
  }
});

// PUT /api/labs/owner/:code/revoke - block this lab from logging in
// (works for a pending lab you're rejecting, or an approved lab you want to cut off)
router.put('/owner/:code/revoke', requireOwnerKey, async (req, res, next) => {
  try {
    const lab = await Lab.findOneAndUpdate(
      { code: req.params.code.trim().toUpperCase() },
      { active: false },
      { new: true }
    );
    if (!lab) return res.status(404).json({ message: 'No lab found with that code.' });
    res.json({ message: `${lab.name} (${lab.code}) can no longer log in.`, lab });
  } catch (err) {
    next(err);
  }
});

module.exports = router;