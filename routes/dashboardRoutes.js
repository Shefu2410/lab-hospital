const express = require('express');
const Patient = require('../models/Patient');
const Result = require('../models/Result');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/dashboard/stats - scoped to the current lab
router.get('/stats', async (req, res, next) => {
  try {
    const labId = req.user.lab;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [totalPatients, patientsToday, pending, tested, partialApproved, approved, allReports] =
      await Promise.all([
        Patient.countDocuments({ lab: labId }),
        Patient.countDocuments({ lab: labId, createdAt: { $gte: startOfDay } }),
        Result.countDocuments({ lab: labId, status: 'Pending' }),
        Result.countDocuments({ lab: labId, status: 'Tested' }),
        Result.countDocuments({ lab: labId, status: 'Partial Approved' }),
        Result.countDocuments({ lab: labId, status: 'Approved' }),
        Result.find({ lab: labId }, { tests: 1 }),
      ]);

    const abnormalReports = allReports.filter((r) =>
      r.tests.some((t) => t.values.some((v) => v.flag === 'High' || v.flag === 'Low'))
    ).length;

    res.json({ totalPatients, patientsToday, pending, tested, partialApproved, approved, abnormalReports });
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/recent - latest 8 reports for the current lab
router.get('/recent', async (req, res, next) => {
  try {
    const reports = await Result.find({ lab: req.user.lab })
      .populate('patient', 'name patientId')
      .sort({ updatedAt: -1 })
      .limit(8);
    res.json(reports);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
