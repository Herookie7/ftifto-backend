const express = require('express');
const { body } = require('express-validator');
const { uploadImage } = require('../controllers/upload.controller');
const { validateImageUrl } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @route   POST /api/v1/upload/image
 * @desc    Upload image via URL or file
 * @access  Private (authenticated users)
 * 
 * Body:
 * - imageUrl: String (optional, URL to image)
 * - image: File (optional, multipart/form-data - future)
 */
router.post(
  '/image',
  protect,
  [
    body('imageUrl')
      .optional()
      .isString()
      .withMessage('imageUrl must be a string')
      .isURL()
      .withMessage('imageUrl must be a valid URL')
  ],
  validateImageUrl,
  uploadImage
);

module.exports = router;

