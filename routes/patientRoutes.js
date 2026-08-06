const express = require('express');
const Patient = require('../models/Patient');
const Result = require('../models/Result');
const { protect, requireRole } = require('../middleware/auth');
const { generatePatientId } = require('../utils/idGenerator');

const router = express.Router();
router.use(protect);

// GET /api/patients - list, scoped to the logged-in user's lab, optional ?search= and/or ?today=true
router.get('/', async (req, res, next) => {
  try {
    const { search, today } = req.query;
    const filter = { lab: req.user.lab };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    if (today === 'true') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      filter.createdAt = { $gte: startOfDay };
    }
    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    next(err);
  }
});

// GET /api/patients/:id
router.get('/:id', async (req, res, next) => {
  try {
    const patient = await Patient.findOne({ _id: req.params.id, lab: req.user.lab });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });
    res.json(patient);
  } catch (err) {
    next(err);
  }
});

// POST /api/patients - register a new patient in the current lab.
// A person can only ever be registered once: phone number is the check used
// to catch a repeat registration, since name alone isn't reliably unique.
router.post('/', async (req, res, next) => {
  try {
    const { name, age, ageUnit, gender, phone, email, address, referredBy } = req.body;
    const cleanPhone = (phone || '').trim();

    if (!name || age === undefined || age === null || !gender || !cleanPhone) {
      return res.status(400).json({ message: 'Name, age, gender and phone are required.' });
    }

    const existing = await Patient.findOne({ lab: req.user.lab, phone: cleanPhone });
    if (existing) {
      return res.status(409).json({
        message: `Phone number ${cleanPhone} is already registered to ${existing.name} (${existing.patientId}). If this is a different person, use their own phone number; otherwise use the existing record instead of registering again.`,
        existingPatient: existing,
      });
    }

    const patientId = await generatePatientId(req.user.lab);
    const patient = await Patient.create({
      lab: req.user.lab,
      patientId,
      name: name.trim(),
      age,
      ageUnit: ageUnit || 'Years',
      gender,
      phone: cleanPhone,
      email: email || '',
      address: address || '',
      referredBy: referredBy || '',
    });

    res.status(201).json(patient);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/patients/:id - admin only, permanently removes a patient AND
// every report belonging to them (a report can't be kept if its patient is
// gone - it would just point at nothing).
router.delete('/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const patient = await Patient.findOneAndDelete({ _id: req.params.id, lab: req.user.lab });
    if (!patient) return res.status(404).json({ message: 'Patient not found.' });

    const { deletedCount } = await Result.deleteMany({ lab: req.user.lab, patient: patient._id });

    res.json({
      message:
        deletedCount > 0
          ? `Patient ${patient.patientId} (${patient.name}) and their ${deletedCount} report${deletedCount === 1 ? '' : 's'} were deleted.`
          : `Patient ${patient.patientId} (${patient.name}) was deleted.`,
      reportsDeleted: deletedCount,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;