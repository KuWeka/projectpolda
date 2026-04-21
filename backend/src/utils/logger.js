const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('winston-daily-rotate-file');

const safeStringify = (value) => {
  const seen = new WeakSet();
  return JSON.stringify(value, (key, val) => {
    if (typeof val === 'object' && val !== null) {
      if (seen.has(val)) return '[Circular]';
      seen.add(val);
    }
    return val;
  }, 2);
};

const getRequestContext = (req) => {
  if (!req) return null;
  return {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get ? req.get('User-Agent') : undefined,
    userId: req.user?.id,
    userRole: req.user?.role,
  };
};

/**
 * Winston Logger Configuration
 * Structured logging with file rotation and different log levels
 */

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const requestContext = meta.request || getRequestContext(meta.req);
    delete meta.req;
    delete meta.request;

    const log = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
      ...(requestContext ? { request: requestContext } : {})
    };

    return safeStringify(log);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let output = `${timestamp} ${level}: ${message}`;

    if (Object.keys(meta).length > 0) {
      output += ` ${safeStringify(meta)}`;
    }

    return output;
  })
);

// File transport with rotation
const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/app-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: logFormat
});

// Error log transport
const errorFileRotateTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '20m',
  maxFiles: '30d',
  format: logFormat
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Write all logs with importance level of `error` or less to error log
    errorFileRotateTransport,
    // Write all logs with importance level of `info` or less to main log
    fileRotateTransport
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

// Custom logging methods
logger.request = (req, message, meta = {}) => {
  logger.info(message, { request: getRequestContext(req), ...meta });
};

logger.audit = (action, userId, userRole, details = {}, req = null) => {
  logger.info(`AUDIT: ${action}`, {
    userId,
    userRole,
    action,
    details,
    request: getRequestContext(req)
  });
};

logger.security = (event, details = {}, req = null) => {
  logger.warn(`SECURITY: ${event}`, {
    event,
    details,
    request: getRequestContext(req)
  });
};

logger.performance = (operation, duration, details = {}) => {
  logger.info(`PERFORMANCE: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

module.exports = logger;