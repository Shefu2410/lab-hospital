// Gatekeeping for platform-owner-only actions (approving/rejecting new labs).
// This is intentionally NOT a user account or login screen - just a private
// secret key (set in .env) that only you know. Send it as the
// x-owner-key header on requests to the owner-only endpoints below.
function requireOwnerKey(req, res, next) {
  const provided = req.headers['x-owner-key'];
  const expected = process.env.OWNER_SECRET_KEY;

  if (!expected) {
    return res.status(500).json({ message: 'OWNER_SECRET_KEY is not configured on the server.' });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({ message: 'Invalid or missing owner key.' });
  }
  next();
}

module.exports = { requireOwnerKey };