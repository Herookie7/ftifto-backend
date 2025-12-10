const asyncHandler = require('express-async-handler');

/**
 * Middleware to handle image uploads
 * Currently supports URL input, ready for file upload with multer
 * 
 * For future file upload implementation:
 * 1. Install multer: npm install multer
 * 2. Uncomment multer configuration below
 * 3. Update controller to handle file uploads
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

module.exports = {
  validateImageUrl
  // upload: upload.single('image') // Uncomment when multer is installed
};

