const express = require('express');
const TestCatalog = require('../models/TestCatalog');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// GET /api/tests - list all panels for the current lab
router.get('/', async (req, res, next) => {
  try {
    const tests = await TestCatalog.find({ lab: req.user.lab }).sort({ name: 1 });
    res.json(tests);
  } catch (err) {
    next(err);
  }
});

// GET /api/tests/:id
router.get('/:id', async (req, res, next) => {
  try {
    const test = await TestCatalog.findOne({ _id: req.params.id, lab: req.user.lab });
    if (!test) return res.status(404).json({ message: 'Test panel not found.' });
    res.json(test);
  } catch (err) {
    next(err);
  }
});

// POST /api/tests - add a new panel to the current lab's catalog
router.post('/', async (req, res, next) => {
  try {
    const { code, name, department, price, parameters } = req.body;
    if (!code || !name || !Array.isArray(parameters) || !parameters.length) {
      return res.status(400).json({ message: 'Code, name and at least one parameter are required.' });
    }

    const test = await TestCatalog.create({
      lab: req.user.lab,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      department: department || 'General',
      price: price || 0,
      parameters,
    });

    res.status(201).json(test);
  } catch (err) {
    next(err);
  }
});

// PUT /api/tests/:id - edit a panel (only within the current lab)
router.put('/:id', async (req, res, next) => {
  try {
    const test = await TestCatalog.findOneAndUpdate(
      { _id: req.params.id, lab: req.user.lab },
      req.body,
      { new: true, runValidators: true }
    );
    if (!test) return res.status(404).json({ message: 'Test panel not found.' });
    res.json(test);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tests/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const test = await TestCatalog.findOneAndDelete({ _id: req.params.id, lab: req.user.lab });
    if (!test) return res.status(404).json({ message: 'Test panel not found.' });
    res.json({ message: 'Test panel deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
