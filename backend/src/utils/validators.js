/**
 * Security validators for input validation and password strength
 */

/**
 * Validate password strength
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (optional but recommended)
 */
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password minimal 8 karakter');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf besar');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 huruf kecil');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung minimal 1 angka');
  }

  // Special character check (recommended but not required in basic implementation)
  // if (!/[!@#$%^&*]/.test(password)) {
  //   errors.push('Password harus mengandung minimal 1 karakter spesial (!@#$%^&*)');
  // }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate email format
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate input length and type
 */
const validateInputLength = (input, minLength = 1, maxLength = 255) => {
  if (!input || input.length < minLength) {
    return { isValid: false, error: `Input minimal ${minLength} karakter` };
  }
  if (input.length > maxLength) {
    return { isValid: false, error: `Input maksimal ${maxLength} karakter` };
  }
  return { isValid: true };
};

/**
 * Sanitize user input (basic XSS prevention)
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

/**
 * Validate allowed file types
 */
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv'
];

const ALLOWED_EXTENSIONS = [
  'jpg', 'jpeg', 'png', 'gif', 'webp',
  'pdf', 'doc', 'docx', 'xls', 'xlsx',
  'txt', 'csv'
];

const validateFileType = (mimetype, filename) => {
  // Check mimetype
  if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
    return {
      isValid: false,
      error: `Tipe file tidak diizinkan. Format yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  // Check file extension
  const extension = filename.split('.').pop().toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      isValid: false,
      error: `Ekstensi file tidak diizinkan. Format yang diizinkan: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  return { isValid: true };
};

/**
 * Validate file size
 * @param {number} fileSize - Size in bytes
 * @param {number} maxSizeInMB - Maximum size in MB (default 5)
 */
const validateFileSize = (fileSize, maxSizeInMB = 5) => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (fileSize > maxSizeInBytes) {
    return {
      isValid: false,
      error: `Ukuran file terlalu besar. Maksimal ${maxSizeInMB}MB`
    };
  }
  return { isValid: true };
};

module.exports = {
  validatePasswordStrength,
  validateEmail,
  validateInputLength,
  sanitizeInput,
  validateFileType,
  validateFileSize,
  ALLOWED_MIME_TYPES,
  ALLOWED_EXTENSIONS
};
