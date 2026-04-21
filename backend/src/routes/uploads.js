const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const {
  validateFileType,
  validateFileSize
} = require('../utils/validators');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

/**
 * File filter for multer - validates file type and size
 */
const fileFilter = (req, file, cb) => {
  // Validate MIME type
  const validation = validateFileType(file.mimetype, file.originalname);
  if (!validation.isValid) {
    return cb(new Error(validation.error));
  }
  
  cb(null, true);
};

/**
 * Multer configuration with security improvements
 * - File size limit: 5MB (configurable via env)
 * - Max files: 5 per request
 * - File type whitelist enforced
 */
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 5242880), // 5MB default
    files: 5 // Maximum 5 files per request
  }
});

/**
 * POST /api/uploads/ticket/:ticketId
 * Upload files untuk ticket attachment
 * Params: ticketId
 * Files: form-data dengan key 'files' (max 5 files)
 */
router.post('/ticket/:ticketId', auth, upload.array('files', 5), asyncHandler(async (req, res) => {
  const { ticketId } = req.params;
  const files = req.files;
  
  // Check if ticket exists
  const [ticketExists] = await pool.query('SELECT id FROM tickets WHERE id = ?', [ticketId]);
  if (ticketExists.length === 0) {
    // Clean up uploaded files if ticket doesn't exist
    if (files) {
      files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) logger.error('Error deleting uploaded file', { error: err.message, filePath: file.path });
        });
      });
    }
    return res.status(404).json({ 
      success: false,
      message: 'Ticket tidak ditemukan' 
    });
  }

  if (!files || files.length === 0) {
    return res.status(400).json({ 
      success: false,
      message: 'Tidak ada file yang di-upload' 
    });
  }

  try {
    // Validate each file size
    for (const file of files) {
      const sizeValidation = validateFileSize(file.size);
      if (!sizeValidation.isValid) {
        // Clean up uploaded files on validation failure
        files.forEach(f => {
          fs.unlink(f.path, (err) => {
            if (err) logger.error('Error deleting file after upload validation failure', { error: err.message, filePath: f.path });
          });
        });
        return res.status(400).json({ 
          success: false,
          message: sizeValidation.error 
        });
      }
    }

    // Prepare bulk insert
    const values = files.map(file => [
      ticketId,
      file.originalname,
      `/${path.basename(file.path)}`,
      file.size,
      file.mimetype
    ]);

    await pool.query(
      'INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_size, mime_type) VALUES ?',
      [values]
    );

    res.status(201).json({ 
      success: true,
      message: 'File berhasil di-upload',
      uploadedFiles: files.map(f => ({
        originalName: f.originalname,
        size: f.size,
        filename: path.basename(f.path)
      }))
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (files) {
      files.forEach(file => {
        fs.unlink(file.path, (err) => {
          if (err) logger.error('Error deleting file after upload failure', { error: err.message, filePath: file.path });
        });
      });
    }
    throw error;
  }
}));

/**
 * GET /api/uploads/ticket/:ticketId
 * Get attachment list untuk ticket
 */
router.get('/ticket/:ticketId', auth, asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM ticket_attachments WHERE ticket_id = ?', [req.params.ticketId]);
  res.json({ 
    success: true,
    attachments: rows 
  });
}));

// Error handling untuk multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ 
        success: false,
        message: 'File terlalu besar' 
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        success: false,
        message: 'Maksimal 5 file dapat di-upload sekaligus' 
      });
    }
  }
  
  if (err.message && err.message.includes('Tipe file tidak diizinkan')) {
    return res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }

  next(err);
});

module.exports = router;
