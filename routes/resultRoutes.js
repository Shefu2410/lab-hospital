const express = require('express');
const Result = require('../models/Result');
const Patient = require('../models/Patient');
const TestCatalog = require('../models/TestCatalog');
const { protect, requireRole } = require('../middleware/auth');
const { generateReportId } = require('../utils/idGenerator');
const { applyFlags } = require('../utils/flagLogic');

const router = express.Router();
router.use(protect);

const STATUS_FLOW = ['Pending', 'Tested', 'Partial Approved', 'Approved'];
const APPROVAL_ROLES = ['admin', 'pathologist'];

// GET /api/results?search=&status=&abnormal= - list, newest first, scoped to the current lab
// status may be a single value ("Pending") or comma-separated ("Tested,Partial Approved")
// abnormal=true restricts to reports with at least one High/Low flagged value
router.get('/', async (req, res, next) => {
  try {
    const { search, status, abnormal } = req.query;
    const filter = { lab: req.user.lab };
    if (status) filter.status = { $in: status.split(',').map((s) => s.trim()) };

    let reports = await Result.find(filter).populate('patient', 'name patientId').sort({ updatedAt: -1 });

    if (search) {
      const term = search.toLowerCase();
      reports = reports.filter(
        (r) =>
          r.reportId.toLowerCase().includes(term) ||
          r.testNames.toLowerCase().includes(term) ||
          (r.patient && r.patient.name.toLowerCase().includes(term))
      );
    }

    if (abnormal === 'true') {
      reports = reports.filter((r) => r.hasAbnormal);
    }

    res.json(reports);
  } catch (err) {
    next(err);
  }
});

// GET /api/results/:id - full detail for the results screen
router.get('/:id', async (req, res, next) => {
  try {
    const report = await Result.findOne({ _id: req.params.id, lab: req.user.lab }).populate('patient');
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// POST /api/results - create ONE report for a patient covering one or more test panels.
// body: { patientId, testCatalogIds: [id, id, ...] }
// If the same patient orders 3 panels in one visit, they all land in this
// single report under one reportId - they never get 3 separate IDs.
router.post('/', async (req, res, next) => {
  try {
    const { patientId, testCatalogIds } = req.body;
    const ids = Array.isArray(testCatalogIds) ? testCatalogIds : testCatalogIds ? [testCatalogIds] : [];

    if (!patientId || !ids.length) {
      return res.status(400).json({ message: 'patientId and at least one testCatalogId are required.' });
    }

    const patient = await Patient.findOne({ _id: patientId, lab: req.user.lab });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const catalogTests = await TestCatalog.find({ _id: { $in: ids }, lab: req.user.lab });
    if (catalogTests.length !== ids.length) {
      return res.status(404).json({ message: 'One or more test panels were not found.' });
    }

    const tests = catalogTests.map((test) => ({
      testCatalog: test._id,
      testName: test.name,
      values: test.parameters.map((p) => ({
        name: p.name,
        unit: p.unit,
        normalMin: p.normalMin,
        normalMax: p.normalMax,
        normalText: p.normalText,
        value: '',
        flag: 'NA',
      })),
    }));

    const reportId = await generateReportId(req.user.lab);

    const report = await Result.create({
      lab: req.user.lab,
      reportId,
      patient: patient._id,
      tests,
      status: 'Pending',
    });

    const populated = await report.populate('patient', 'name patientId');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

// PUT /api/results/:id/values - save entered values and recompute flags
// body: { tests: [ { testCatalog: id, values: [...] }, ... ] }
router.put('/:id/values', async (req, res, next) => {
  try {
    const { tests } = req.body;
    if (!Array.isArray(tests)) {
      return res.status(400).json({ message: 'tests must be an array.' });
    }

    const report = await Result.findOne({ _id: req.params.id, lab: req.user.lab }).populate('patient');
    if (!report) return res.status(404).json({ message: 'Report not found.' });

    // Merge incoming values into the matching test entry by testCatalog id
    report.tests = report.tests.map((existing) => {
      const incoming = tests.find((t) => String(t.testCatalog) === String(existing.testCatalog));
      if (!incoming || !Array.isArray(incoming.values)) return existing;
      return { ...existing.toObject(), values: applyFlags(incoming.values) };
    });

    const anyEntered = report.tests.some((t) => t.values.some((v) => (v.value ?? '').toString().trim() !== ''));
    if (anyEntered && report.status === 'Pending') {
      report.status = 'Tested';
    }

    await report.save();

    res.json(report);
  } catch (err) {
    next(err);
  }
});

// PUT /api/results/:id/status - advance / set report status
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!STATUS_FLOW.includes(status)) {
      return res.status(400).json({ message: `status must be one of: ${STATUS_FLOW.join(', ')}` });
    }

    if ((status === 'Partial Approved' || status === 'Approved') && !APPROVAL_ROLES.includes(req.user.role)) {
      return res.status(403).json({ message: 'Only a pathologist or admin can approve reports.' });
    }

    const report = await Result.findOneAndUpdate(
      { _id: req.params.id, lab: req.user.lab },
      { status },
      { new: true, runValidators: true }
    ).populate('patient');

    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json(report);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/results/:id - admin only, permanently removes a report
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const report = await Result.findOneAndDelete({ _id: req.params.id, lab: req.user.lab });
    if (!report) return res.status(404).json({ message: 'Report not found.' });
    res.json({ message: `Report ${report.reportId} deleted.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;