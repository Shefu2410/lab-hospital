// Central error handler - keeps route handlers free of repetitive try/catch noise
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }

  if (err.code === 11000) {
    const keys = Object.keys(err.keyValue || {});
    const field = keys.find((k) => k !== 'lab') || keys[0] || 'field';
    return res.status(409).json({ message: `That ${field} is already registered.` });
  }

  res.status(err.status || 500).json({ message: err.message || 'Something went wrong on the server.' });
}

function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };