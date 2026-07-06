const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${err.message}`, err.stack);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, error: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ success: false, error: `${field} already exists` });
  }

  // Mongoose cast error
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, error: `Invalid ${err.path}: ${err.value}` });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, error: `File too large. Max ${process.env.MAX_FILE_SIZE_MB || 10}MB` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }

  // Custom app errors with status
  if (err.status) {
    return res.status(err.status).json({ success: false, error: err.message });
  }

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};

// Helper to create structured errors
const createError = (message, status = 400) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

module.exports = errorHandler;
module.exports.createError = createError;
