const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    unit: { type: String, default: '' },
    normalMin: { type: Number },
    normalMax: { type: Number },
    normalText: { type: String }, // used when a plain range doesn't apply (e.g. "Negative")
  },
  { _id: false }
);

const testCatalogSchema = new mongoose.Schema(
  {
    lab: { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    name: { type: String, required: true },
    department: { type: String, default: 'General' },
    price: { type: Number, default: 0 },
    parameters: { type: [parameterSchema], default: [] },
  },
  { timestamps: true }
);

testCatalogSchema.index({ lab: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('TestCatalog', testCatalogSchema);
