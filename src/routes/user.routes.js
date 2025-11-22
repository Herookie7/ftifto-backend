const express = require('express');
const { body } = require('express-validator');
const { getUsers, getUserById, updateUser, toggleUserActiveStatus, getRoleCounts } = require('../controllers/user.controller');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', authorizeRoles('admin'), getUsers);
router.get('/stats', authorizeRoles('admin'), getRoleCounts);
router.get('/:id', authorizeRoles('admin', 'seller', 'rider', 'customer'), getUserById);

router.put(
  '/:id',
  authorizeRoles('admin'),
  [
    body('name').optional().isString(),
    body('email').optional().isEmail(),
    body('phone').optional().isString(),
    body('role').optional().isIn(['customer', 'seller', 'rider', 'admin'])
  ],
  updateUser
);

router.post('/:id/toggle', authorizeRoles('admin'), toggleUserActiveStatus);

module.exports = router;

