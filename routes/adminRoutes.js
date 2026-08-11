const express = require('express');
const Lab = require('../models/Lab');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Result = require('../models/Result');
const { ownerProtect } = require('../middleware/auth');
const { decryptSecret } = require('../utils/secretCrypto');
const { notifyLabStatusChanged } = require('../utils/mailer');

const router = express.Router();
router.use(ownerProtect);

// GET /api/admin/labs?status= - list every lab on the platform.
// Never includes the password field - use GET /labs/:id/password to reveal
// one at a time, so a page load can't silently leak every lab's password.
router.get('/labs', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const labs = await Lab.find(filter).select('-adminPasswordEnc').sort({ createdAt: -1 });
    res.json(labs);
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/labs/:id/password - reveal the lab admin's initial password.
// Deliberately a separate, explicit endpoint (rather than including it in
// the list above) so it's only ever fetched when the owner clicks "reveal".
router.get('/labs/:id/password', async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id).select('adminPasswordEnc');
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    const password = decryptSecret(lab.adminPasswordEnc);
    if (!password) {
      return res.status(404).json({ message: 'No stored password for this lab (registered before this feature, or the admin has since changed it).' });
    }
    res.json({ password });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/labs/:id - single lab, with basic usage counts
router.get('/labs/:id', async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });

    const [userCount, patientCount, reportCount] = await Promise.all([
      User.countDocuments({ lab: lab._id }),
      Patient.countDocuments({ lab: lab._id }),
      Result.countDocuments({ lab: lab._id }),
    ]);

    res.json({ ...lab.toObject(), userCount, patientCount, reportCount });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/labs/:id/approve
router.put('/labs/:id/approve', async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedAt: new Date(), rejectionReason: '' },
      { new: true }
    );
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    notifyLabStatusChanged(lab).catch(() => {});
    res.json(lab);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/labs/:id/reject   body: { reason }
router.put('/labs/:id/reject', async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: req.body.reason || '' },
      { new: true }
    );
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    notifyLabStatusChanged(lab).catch(() => {});
    res.json(lab);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/labs/:id/suspend
router.put('/labs/:id/suspend', async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, { status: 'suspended' }, { new: true });
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    notifyLabStatusChanged(lab).catch(() => {});
    res.json(lab);
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/labs/:id/reactivate - bring a suspended lab back to approved
router.put('/labs/:id/reactivate', async (req, res, next) => {
  try {
    const lab = await Lab.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });
    notifyLabStatusChanged(lab).catch(() => {});
    res.json(lab);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/labs/:id - permanently remove a lab and everything in it
router.delete('/labs/:id', async (req, res, next) => {
  try {
    const lab = await Lab.findById(req.params.id);
    if (!lab) return res.status(404).json({ message: 'Lab not found.' });

    await Promise.all([
      User.deleteMany({ lab: lab._id }),
      Patient.deleteMany({ lab: lab._id }),
      Result.deleteMany({ lab: lab._id }),
      require('../models/TestCatalog').deleteMany({ lab: lab._id }),
    ]);
    await lab.deleteOne();

    res.json({ message: `Lab "${lab.name}" and all its data were deleted.` });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats - platform-wide overview
router.get('/stats', async (req, res, next) => {
  try {
    const [totalLabs, pendingLabs, approvedLabs, rejectedLabs, suspendedLabs, totalPatients, totalReports] =
      await Promise.all([
        Lab.countDocuments(),
        Lab.countDocuments({ status: 'pending' }),
        Lab.countDocuments({ status: 'approved' }),
        Lab.countDocuments({ status: 'rejected' }),
        Lab.countDocuments({ status: 'suspended' }),
        Patient.countDocuments(),
        Result.countDocuments(),
      ]);

    res.json({ totalLabs, pendingLabs, approvedLabs, rejectedLabs, suspendedLabs, totalPatients, totalReports });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
