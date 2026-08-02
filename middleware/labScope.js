const Lab = require('../models/Lab');

// Runs after `protect`. Confirms the logged-in user's lab is still approved -
// catches the case where a lab gets suspended mid-session (token still valid,
// but the lab should immediately lose access). Superadmins skip this (no lab).
async function requireActiveLab(req, res, next) {
  try {
    if (req.user.role === 'superadmin') return next();

    if (!req.user.lab) {
      return res.status(403).json({ message: 'Your account is not linked to a lab.' });
    }

    const lab = await Lab.findById(req.user.lab);
    if (!lab) {
      return res.status(403).json({ message: 'Your lab could not be found.' });
    }
    if (lab.status !== 'approved') {
      const messages = {
        pending: 'Your lab is still awaiting approval.',
        rejected: 'Your lab registration was rejected.',
        suspended: 'Your lab account has been suspended. Contact support.',
      };
      return res.status(403).json({ message: messages[lab.status] || 'Your lab is not active.' });
    }

    req.lab = lab;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireActiveLab };
