const { ApiResponse } = require('../utils/apiResponse');

/**
 * Validation Middleware using Joi schemas
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json(ApiResponse.error('Validation failed', errors, 400));
    }

    // Replace req.body with validated/sanitized data
    req.body = value;
    next();
  };
};

/**
 * Query parameter validation
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json(ApiResponse.error('Query validation failed', errors, 400));
    }

    // Replace req.query with validated data
    req.query = value;
    next();
  };
};

/**
 * File upload validation
 */
const validateFile = (schema) => {
  return (req, res, next) => {
    if (!req.file) {
      return res.status(400).json(ApiResponse.error('No file uploaded'));
    }

    const { error } = schema.validate(req.file, {
      abortEarly: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json(ApiResponse.error('File validation failed', errors, 400));
    }

    next();
  };
};

module.exports = {
  validate,
  validateQuery,
  validateFile
};