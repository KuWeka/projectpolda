/**
 * Global error handler middleware
 * Centralizes error handling and standardizes error response format
 */

const errorHandler = (err, req, res, _next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = {};

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors || {};
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token kadaluarsa. Silakan login kembali.';
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token tidak valid.';
  }

  if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.message;
  }

  if (err.code === 'ENOENT') {
    statusCode = 404;
    message = 'File tidak ditemukan';
  }

  // Log error for debugging (except in test mode)
  if (process.env.NODE_ENV !== 'test') {
    const logger = require('../utils/logger');
    logger.error('Global error handler', {
      statusCode,
      message,
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString(),
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Send standardized error response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { details, stack: err.stack }),
    ...(Object.keys(details).length > 0 && { details })
  });
};

/**
 * Async error wrapper - wraps route handlers to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler
};
