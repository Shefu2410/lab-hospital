const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Lab = require('../models/Lab');

// Verifies the Bearer token, attaches req.user (safe fields only), and
// confirms the user's lab is still active (catches a lab being deactivated
// mid-session, not just at next login).
async function protect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    // Superadmins aren't attached to a lab - nothing further to check.
    if (user.role === 'superadmin') {
      req.user = user.toSafeObject();
      req.lab = null;
      return next();
    }

    const lab = await Lab.findById(user.lab);
    if (!lab) {
      return res.status(401).json({ message: 'Your lab could not be found.' });
    }
    if (lab.status !== 'approved') {
      const messages = {
        pending: 'Your lab is still awaiting approval.',
        rejected: 'Your lab registration was not approved.',
        suspended: 'This lab account has been suspended. Contact support.',
      };
      return res.status(403).json({ message: messages[lab.status] || 'This lab account is not active.' });
    }

    req.user = user.toSafeObject();
    req.lab = lab;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

// Restricts a route to specific roles, e.g. requireRole('admin', 'pathologist')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to do that.' });
    }
    next();
  };
}

module.exports = { protect, requireRole };
