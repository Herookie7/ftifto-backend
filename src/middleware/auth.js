const asyncHandler = require('express-async-handler');
const config = require('../config');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401);
    throw new Error('Not authorized: missing token');
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded?.id) {
      res.status(401);
      throw new Error('Invalid authentication token');
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }

    if (user.isActive === false) {
      res.status(403);
      throw new Error('Account is deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    if (config.app.nodeEnv !== 'test') {
      // eslint-disable-next-line no-console
      console.error('Auth error:', error.message);
    }
    throw new Error('Not authorized');
  }
});

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error('Forbidden: insufficient permissions');
  }
  next();
};

module.exports = {
  protect,
  authorizeRoles
};

