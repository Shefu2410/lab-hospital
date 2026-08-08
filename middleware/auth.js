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

    // Superadmins aren't attached to a lab by default. If they're hitting a
    // lab-scoped route (patients, results, etc.), they must specify which
    // lab they're acting on behalf of via the x-lab-id header or ?lab= query.
    if (user.role === 'superadmin') {
      req.user = user.toSafeObject();
      const actingLabId = req.headers['x-lab-id'] || req.query.lab;

      if (actingLabId) {
        const lab = await Lab.findById(actingLabId);
        if (!lab) {
          return res.status(404).json({ message: 'Specified lab could not be found.' });
        }
        req.user.lab = lab._id;
        req.lab = lab;
      } else {
        req.lab = null;
      }
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
    // Belt-and-suspenders: guarantee req.user.lab is always the lab's id,
    // even if toSafeObject() ever changes what it returns.
    req.user.lab = user.lab;
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

// Blocks accounts with no lab attached from lab-scoped routes like
// patients/results, where req.user.lab is required. Superadmins can pass
// this by specifying which lab they're acting on behalf of (see protect()).
function requireLab(req, res, next) {
  if (!req.user || !req.user.lab) {
    const message = req.user?.role === 'superadmin'
      ? 'Specify which lab to act on behalf of (x-lab-id header or ?lab= query param).'
      : 'This action is only available to lab accounts.';
    return res.status(403).json({ message });
  }
  next();
}

module.exports = { protect, requireRole, requireLab };