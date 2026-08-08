const Lab = require('../models/Lab');

// Generates a short unique lab code from its name, e.g. "Rajkot Hospital" -> "RAJHO23"
async function generateLabCode(name) {
  const base = (name || 'LAB')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 5) || 'LAB';

  for (let attempt = 0; attempt < 8; attempt++) {
    const suffix = Math.floor(10 + Math.random() * 89); // 2-digit suffix
    const candidate = `${base}${suffix}`;
    const exists = await Lab.findOne({ labCode: candidate }); // was: { code: candidate }
    if (!exists) return candidate;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

// Generates PT-0001, PT-0002, ... scoped to a single lab (each lab starts its
// own numbering). Uses an atomic findOneAndUpdate($inc) directly on the Lab
// document's patientSeq field - no separate Counter collection needed.
// MongoDB serializes the increment itself, so two simultaneous registrations
// can never be handed the same number, unlike the old countDocuments-based
// approach which had a race window between reading the count and saving the
// new patient.
//
// REQUIRES: add this field to models/Lab.js's schema:
//   patientSeq: { type: Number, default: 0 }
async function generatePatientId(labId) {
  const lab = await Lab.findByIdAndUpdate(
    labId,
    { $inc: { patientSeq: 1 } },
    { new: true }
  );

  return `PT-${String(lab.patientSeq).padStart(4, '0')}`;
}

module.exports = { generateLabCode, generatePatientId };