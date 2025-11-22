const express = require('express');
const { body, param } = require('express-validator');
const { requestDeletion, requestDataPortability, getRequestStatus } = require('../controllers/privacy.controller');

const router = express.Router();

const emailOptionalValidator = body('email')
  .optional()
  .isEmail()
  .withMessage('A valid email is required');

router.post(
  '/request-deletion',
  [
    emailOptionalValidator,
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be under 500 characters')
  ],
  requestDeletion
);

router.post(
  '/request-portability',
  [
    emailOptionalValidator,
    body('reason').optional().isString().isLength({ max: 500 }).withMessage('Reason must be under 500 characters')
  ],
  requestDataPortability
);

router.get(
  '/status/:requestId',
  [param('requestId').isMongoId().withMessage('requestId must be a valid identifier')],
  getRequestStatus
);

module.exports = router;


