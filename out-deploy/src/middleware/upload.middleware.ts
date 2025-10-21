/**
 * Upload Middleware - File upload handling using multer
 * Supports images and documents for DialogueAgent analysis
 */

import multer from 'multer';
import { RequestHandler } from 'express';
import path from 'path';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  }
});

// File filter for allowed types
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Simple debug logging - no file size
  console.log('🔍 File upload:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    fieldname: file.fieldname
  });

  // Allowed file types
  const allowedMimes = [
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'application/rtf'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    console.log('✅ File type accepted:', file.mimetype);
    cb(null, true);
  } else {
    console.log('❌ File type rejected:', file.mimetype);
    cb(new Error(`File type ${file.mimetype} is not allowed. Supported types: images (JPEG, PNG, GIF, WebP) and documents (PDF, DOC, DOCX, TXT, MD, RTF)`));
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // Increased to 50MB limit for better reliability
    files: 1, // Only one file at a time
    fieldSize: 10 * 1024 * 1024, // 10MB for form fields
    fieldNameSize: 100, // Max field name size
    parts: 20 // Max number of parts
  }
});

// Middleware for single file upload
export const uploadSingle: RequestHandler = upload.single('file');

// Error handling middleware for multer errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large. Maximum size is 10MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Only one file allowed per upload.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${error.message}`
    });
  }
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.message || 'File upload failed'
    });
  }
  
  next();
}; 