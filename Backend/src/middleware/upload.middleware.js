import multer from 'multer';
import path from 'path';

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  videos: ['video/mp4', 'video/webm'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  audio: ['audio/mpeg', 'audio/mp4'],
};

// ⚠ Block these extensions
const BLOCKED_EXTENSIONS = [
  '.exe',
  '.sh',
  '.bat',
  '.js',
  '.php',
  '.py',
  '.rb',
  '.html',
  '.htm',
  '.css',
  '.svg',
];

const storage = multer.memoryStorage();

/**
 * Sanitize filename to avoid path traversal attacks
 */
const sanitizeFilename = (originalName) => {
  const safe = originalName.replace(/[^\w.-]/g, '_');
  return 'file_' + Date.now() + '_' + safe;
};

/**
 * Main secure file filter
 */
const secureFileFilter = (req, file, cb) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase();

    // Block dangerous extensions
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return cb(new Error(`Blocked file type: ${ext}`), false);
    }

    // Check MIME type
    const isAllowed = Object.values(ALLOWED_MIME_TYPES)
      .flat()
      .includes(file.mimetype);

    if (!isAllowed) {
      return cb(
        new Error(`Invalid file type. MIME received: ${file.mimetype}`),
        false
      );
    }

    // Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);

    cb(null, true);
  } catch (err) {
    cb(err, false);
  }
};

// EXPORT MULTER
export const upload = multer({
  storage,
  fileFilter: secureFileFilter,
  limits: {
    // Keep this conservative to avoid memory pressure and third-party timeouts.
    fileSize: Number(process.env.MAX_UPLOAD_FILE_SIZE || 5 * 1024 * 1024),
  },
});
