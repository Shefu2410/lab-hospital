const express = require('express');
const mongoose = require('mongoose');
const Lab = require('../models/Lab');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const { generateLabCode } = require('../utils/idGenerator');
const { encryptSecret } = require('../utils/secretCrypto');
const { notifyOwnerNewLabPending } = require('../utils/mailer');

const router = express.Router();

// POST /api/labs/register - a new lab signs itself up (public, no auth).
// Creates the Lab (status = 'pending') and its first admin user. The lab
// cannot log in until the owner approves it from /owner.html - see the
// status check in routes/authRoutes.js.
//
// Both writes (Lab + User) happen inside a Mongo transaction so a failure
// creating the User (e.g. duplicate username) can never leave an orphaned
// Lab document behind, and vice versa. Duplicate email / username are also
// checked explicitly up front so we can return clear, specific messages
// instead of relying on a raw MongoDB E11000 duplicate-key error.
router.post('/register', async (req, res, next) => {
  const { labName, labEmail, labPhone, labAddress, adminName, adminUsername, adminPassword } = req.body;

  if (!labName || !labEmail || !adminName || !adminUsername || !adminPassword) {
    return res.status(400).json({
      message: 'labName, labEmail, adminName, adminUsername and adminPassword are required.',
    });
  }

  const normalizedEmail = labEmail.trim().toLowerCase();
  const normalizedUsername = adminUsername.trim().toLowerCase();

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const existingLab = await Lab.findOne({ email: normalizedEmail }).session(session);
    if (existingLab) {
      await session.abortTransaction();
      return res.status(409).json({ message: 'A lab with that email has already registered.' });
    }

    const existingUser = await User.findOne({ username: normalizedUsername }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      return res.status(409).json({ message: 'That username is already registered.' });
    }

    const code = await generateLabCode(labName);

    const [lab] = await Lab.create(
      [
        {
          code,
          name: labName.trim(),
          email: normalizedEmail,
          phone: labPhone || '',
          address: labAddress || '',
          status: 'pending',
          // Kept only so the owner can view/hand over the initial password from
          // the Owner page - see utils/secretCrypto.js for why this is reversible.
          adminPasswordEnc: encryptSecret(adminPassword),
        },
      ],
      { session }
    );

    const [admin] = await User.create(
      [
        {
          name: adminName.trim(),
          username: normalizedUsername,
          password: adminPassword,
          role: 'admin',
          lab: lab._id,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // Fire-and-forget - registration should succeed even if email sending fails.
    notifyOwnerNewLabPending(lab).catch(() => {});

    res.status(201).json({
      message: `Lab registered and is pending approval. You'll be able to log in with lab code ${lab.code} once it's approved.`,
      lab: { code: lab.code, name: lab.name, status: lab.status },
      admin: admin.toSafeObject(),
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
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