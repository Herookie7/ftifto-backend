const asyncHandler = require('express-async-handler');
const logger = require('../logger');

/**
 * Image compression utility
 * Compresses images using sharp if available, otherwise returns original buffer
 */
const compressImage = async (buffer, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'jpeg'
  } = options;

  try {
    // Try to use sharp if available
    const sharp = require('sharp');
    
    let image = sharp(buffer);
    const metadata = await image.metadata();
    
    // Resize if image is larger than max dimensions
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      image = image.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    // Compress based on format
    if (format === 'webp') {
      return await image.webp({ quality }).toBuffer();
    } else if (format === 'png') {
      return await image.png({ quality, compressionLevel: 9 }).toBuffer();
    } else {
      return await image.jpeg({ quality, mozjpeg: true }).toBuffer();
    }
  } catch (error) {
    // If sharp is not available or fails, log and return original
    if (error.code === 'MODULE_NOT_FOUND') {
      logger.warn('Sharp not installed, skipping image compression. Install sharp for image optimization.');
    } else {
      logger.error('Image compression error', { error: error.message });
    }
    return buffer; // Return original buffer if compression fails
  }
};

/**
 * Middleware to handle image uploads with compression
 * Currently supports URL input, ready for file upload with multer
 * 
 * For future file upload implementation:
 * 1. Install multer: npm install multer
 * 2. Install sharp: npm install sharp
 * 3. Uncomment multer configuration below
 * 4. Update controller to handle file uploads
 */

// Future multer configuration (uncomment when multer is installed):
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     const uploadDir = 'uploads/images';
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedTypes = /jpeg|jpg|png|webp|gif/;
//   const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimetype = allowedTypes.test(file.mimetype);
// 
//   if (mimetype && extname) {
//     return cb(null, true);
//   } else {
//     cb(new Error('Only image files (jpeg, jpg, png, webp, gif) are allowed'));
//   }
// };

// const upload = multer({
//   storage: storage,
//   limits: {
//     fileSize: 5 * 1024 * 1024 // 5MB
//   },
//   fileFilter: fileFilter
// });

// For now, validate URL input
const validateImageUrl = asyncHandler(async (req, res, next) => {
  // If body contains imageUrl, validate it
  if (req.body.imageUrl) {
    const url = req.body.imageUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      res.status(400);
      throw new Error('Invalid image URL. Must start with http:// or https://');
    }
  }
  next();
});

/**
 * Middleware to compress uploaded images
 * Should be used after multer upload middleware
 */
const compressUploadedImage = asyncHandler(async (req, res, next) => {
  if (req.file && req.file.buffer) {
    try {
      const compressedBuffer = await compressImage(req.file.buffer, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        format: 'jpeg'
      });
      
      // Update file buffer with compressed version
      req.file.buffer = compressedBuffer;
      req.file.size = compressedBuffer.length;
      
      logger.debug('Image compressed', {
        originalSize: req.file.originalSize || 'unknown',
        compressedSize: compressedBuffer.length
      });
    } catch (error) {
      logger.error('Image compression failed', { error: error.message });
      // Continue with original image if compression fails
    }
  }
  next();
});

module.exports = {
  validateImageUrl,
  compressImage,
  compressUploadedImage
  // upload: upload.single('image') // Uncomment when multer is installed
};

