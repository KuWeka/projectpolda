/**
 * Audit Logging Utility
 * Logs important system events and user actions
 */

const fs = require('fs').promises;
const path = require('path');

class AuditLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.auditFile = path.join(this.logDir, 'audit.log');
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
    this.maxFiles = 5;
  }

  /**
   * Initialize audit logging
   */
  async init() {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      const logger = require('./logger');
      logger.error('Failed to create audit log directory', { error: error.message });
    }
  }

  /**
   * Log an audit event
   */
  async log(event) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: event.level || 'info',
      action: event.action,
      userId: event.userId,
      userRole: event.userRole,
      resource: event.resource,
      resourceId: event.resourceId,
      details: event.details || {},
      ip: event.ip,
      userAgent: event.userAgent
    };

    const logLine = JSON.stringify(logEntry) + '\n';

    try {
      await this.rotateLogIfNeeded();
      await fs.appendFile(this.auditFile, logLine);
    } catch (error) {
      const logger = require('./logger');
      logger.error('Failed to write audit log', { error: error.message });
    }
  }

  /**
   * Log user authentication events
   */
  async logAuth(action, userId, success, details = {}, req = null) {
    await this.log({
      level: success ? 'info' : 'warning',
      action: `auth.${action}`,
      userId,
      details: {
        success,
        ...details
      },
      ip: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  /**
   * Log resource access/modification
   */
  async logResource(action, userId, userRole, resource, resourceId, details = {}, req = null) {
    await this.log({
      action: `resource.${action}`,
      userId,
      userRole,
      resource,
      resourceId,
      details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  /**
   * Log security events
   */
  async logSecurity(action, details = {}, req = null) {
    await this.log({
      level: 'warning',
      action: `security.${action}`,
      details,
      ip: req?.ip,
      userAgent: req?.get('User-Agent')
    });
  }

  /**
   * Rotate log file if it exceeds max size
   */
  async rotateLogIfNeeded() {
    try {
      const stats = await fs.stat(this.auditFile);
      if (stats.size >= this.maxFileSize) {
        await this.rotateLog();
      }
    } catch {
      // File doesn't exist yet, that's fine
    }
  }

  /**
   * Rotate log files
   */
  async rotateLog() {
    try {
      // Move existing log files
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(this.logDir, `audit.${i}.log`);
        const newFile = path.join(this.logDir, `audit.${i + 1}.log`);

        try {
          await fs.rename(oldFile, newFile);
        } catch {
          // File might not exist, continue
        }
      }

      // Move current log to .1
      const backupFile = path.join(this.logDir, 'audit.1.log');
      await fs.rename(this.auditFile, backupFile);

    } catch (error) {
      const logger = require('./logger');
      logger.error('Failed to rotate audit log', { error: error.message });
    }
  }

  /**
   * Get recent audit logs
   */
  async getRecentLogs(limit = 100) {
    try {
      const content = await fs.readFile(this.auditFile, 'utf8');
      const lines = content.trim().split('\n').filter(line => line.trim());

      return lines
        .slice(-limit)
        .map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return { error: 'Invalid log entry', raw: line };
          }
        })
        .reverse(); // Most recent first

    } catch {
      return [];
    }
  }
}

module.exports = new AuditLogger();