const mongoose = require('mongoose');

const valueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, default: '' },
    normalMin: { type: Number },
    normalMax: { type: Number },
    normalText: { type: String },
    value: { type: String, default: '' },
    flag: { type: String, enum: ['NA', 'Normal', 'High', 'Low'], default: 'NA' },
  },
  { _id: false }
);

// One test panel bundled inside a report, e.g. "CBC" with its own parameters.
const testEntrySchema = new mongoose.Schema(
  {
    testCatalog: { type: mongoose.Schema.Types.ObjectId, ref: 'TestCatalog', required: true },
    testName: { type: String, required: true },
    values: { type: [valueSchema], default: [] },
  },
  { _id: false }
);

// A Result is one visit's report for one patient. If a patient orders several
// test panels in the same visit, they all live inside `tests` here under a
// single reportId - they do NOT get separate report IDs.
const resultSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
    reportId: { type: String, required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    tests: { type: [testEntrySchema], default: [] },
    status: {
      type: String,
      enum: ['Pending', 'Tested', 'Partial Approved', 'Approved'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

// Convenience: "CBC, LFT, RFT" for list views / search
resultSchema.virtual('testNames').get(function () {
  return this.tests.map((t) => t.testName).join(', ');
});

resultSchema.virtual('hasAbnormal').get(function () {
  return this.tests.some((t) => t.values.some((v) => v.flag === 'High' || v.flag === 'Low'));
});

resultSchema.set('toJSON', { virtuals: true });
resultSchema.set('toObject', { virtuals: true });

resultSchema.index({ lab: 1, reportId: 1 }, { unique: true });

module.exports = mongoose.model('Result', resultSchema);