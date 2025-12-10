const asyncHandler = require('express-async-handler');

/**
 * Image Upload Controller
 * 
 * Currently supports:
 * - URL input (returns URL as-is)
 * 
 * Future implementation (when multer is installed):
 * - File upload to local storage or S3/Cloudinary
 * - Returns uploaded file URL
 */

/**
 * Upload image via URL or file
 * POST /api/v1/upload/image
 * 
 * Body (current):
 * - imageUrl: String (URL to image)
 * 
 * Body (future with multer):
 * - image: File (multipart/form-data)
 */
const uploadImage = asyncHandler(async (req, res) => {
  // Current implementation: URL input
  if (req.body.imageUrl) {
    const imageUrl = req.body.imageUrl.trim();
    
    // Validate URL
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      res.status(400);
      throw new Error('Invalid image URL. Must start with http:// or https://');
    }

    return res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Image URL accepted'
    });
  }

  // Future implementation: File upload
  // When multer is installed, uncomment below:
  /*
  if (req.file) {
    // Option 1: Local storage (current)
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/images/${req.file.filename}`;
    
    // Option 2: S3 upload (future)
    // const s3Service = require('../services/s3.service');
    // const imageUrl = await s3Service.uploadFile(req.file);
    
    // Option 3: Cloudinary upload (future)
    // const cloudinary = require('../services/cloudinary.service');
    // const imageUrl = await cloudinary.uploadImage(req.file.path);
    
    return res.json({
      success: true,
      imageUrl: imageUrl,
      message: 'Image uploaded successfully'
    });
  }
  */

  res.status(400);
  throw new Error('Either imageUrl (string) or image (file) must be provided');
});

module.exports = {
  uploadImage
};

