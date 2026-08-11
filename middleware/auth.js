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

    const lab = await Lab.findById(user.lab);
    if (!lab) {
      return res.status(401).json({ message: 'Your lab could not be found.' });
    }
    if (!lab.active) {
      return res.status(403).json({ message: 'This lab account is deactivated. Contact support.' });
    }
    if (lab.status && lab.status !== 'approved') {
      return res.status(403).json({ message: 'This lab is not currently approved. Contact support.' });
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

// Verifies the owner's JWT (issued by routes/ownerAuthRoutes.js). Separate
// from `protect` because the owner is not a lab User in the database.
function ownerProtect(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Not authorized. Please log in as owner.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'owner') {
      return res.status(403).json({ message: 'Owner access only.' });
    }
    req.owner = true;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session. Please log in again.' });
  }
}

module.exports = { protect, requireRole, ownerProtect };
