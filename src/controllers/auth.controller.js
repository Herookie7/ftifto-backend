const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken } = require('../utils/token');
const { sendAnalyticsEvent } = require('../services/notifications.service');
const auditLogger = require('../services/auditLogger');

const buildAuthResponse = (user) => ({
  token: signToken({ id: user._id, role: user.role }),
  user
});

const registerUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { name, email, phone, password, role } = req.body;

  const existingUser = await User.findOne({
    $or: [{ email }, { phone }]
  }).lean();

  if (existingUser) {
    res.status(409);
    throw new Error('User with provided email or phone already exists');
  }

  const user = await User.create({
    name,
    email,
    phone,
    password,
    role
  });

  sendAnalyticsEvent('user_signup', {
    user_id: user._id.toString(),
    user_role: role || 'customer'
  });

  auditLogger.logEvent({
    category: 'auth',
    action: 'register',
    userId: user._id.toString(),
    metadata: {
      role: user.role,
      ip: req.ip
    }
  });

  return res.status(201).json(buildAuthResponse(user));
});

const loginUser = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }

  const { identifier, password } = req.body;

  // Support login with email, phone, or metadata.username (for riders)
  const user = await User.findOne({
    $or: [
      { email: identifier },
      { phone: identifier },
      { 'metadata.username': identifier }
    ]
  }).select('+password');

  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  if (user.isActive === false) {
    res.status(403);
    throw new Error('Account is deactivated');
  }

  user.password = undefined;

  auditLogger.logEvent({
    category: 'auth',
    action: 'login',
    userId: user._id.toString(),
    metadata: {
      identifier,
      ip: req.ip
    }
  });

  return res.json(buildAuthResponse(user));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  res.json({
    user: req.user
  });
});

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser
};

