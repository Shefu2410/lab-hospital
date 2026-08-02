const express = require('express');
const Lab = require('../models/Lab');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Result = require('../models/Result');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(protect, requireRole('superadmin'));

// GET /api/admin/labs?status= - list every lab on the platform
router.get('/labs', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const labs = await Lab.find(filter).sort({ createdAt: -1 });
    res.json(labs);
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
