const jwt = require('jsonwebtoken');

// Protects routes so only a logged-in admin (valid JWT with role 'admin') can access them.
module.exports = function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization; // expects "Bearer <token>"
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access only' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};