const Patient = require('../models/Patient');
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
    const exists = await Lab.findOne({ code: candidate });
    if (!exists) return candidate;
  }
  return `${base}${Date.now().toString().slice(-4)}`;
}

// Generates PT-0001, PT-0002, ... scoped to a single lab (each lab starts its own numbering)
async function generatePatientId(labId) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const count = await Patient.countDocuments({ lab: labId });
    const candidate = `PT-${String(count + 1 + attempt).padStart(4, '0')}`;
    const exists = await Patient.findOne({ lab: labId, patientId: candidate });
    if (!exists) return candidate;
  }
  return `PT-${Date.now()}`;
}

module.exports = { generateLabCode, generatePatientId };