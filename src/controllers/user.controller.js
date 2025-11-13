const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');

const getUsers = asyncHandler(async (req, res) => {
  const { role, search, page = 1, limit = 25, isActive } = req.query;

  const query = {};

  if (role) {
    query.role = role;
  }

  if (typeof isActive !== 'undefined') {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .select('-password'),
    User.countDocuments(query)
  ]);

  res.json({
    total,
    page: Number(page),
    limit: Number(limit),
    results: users
  });
});

const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  res.json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const updates = req.body;
  delete updates.password;

  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  Object.assign(user, updates);

  await user.save();

  res.json(user);
});

const toggleUserActiveStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user
  });
});

const getRoleCounts = asyncHandler(async (req, res) => {
  const aggregation = await User.aggregate([
    {
      $group: {
        _id: '$role',
        total: { $sum: 1 },
        active: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        }
      }
    }
  ]);

  res.json(
    aggregation.reduce((acc, item) => {
      acc[item._id] = {
        total: item.total,
        active: item.active
      };
      return acc;
    }, {})
  );
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  toggleUserActiveStatus,
  getRoleCounts
};

