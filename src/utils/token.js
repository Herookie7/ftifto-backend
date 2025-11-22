const jwt = require('jsonwebtoken');
const config = require('../config');

const signToken = (payload, options = {}) =>
  jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.tokenExpiry,
    ...options
  });

const verifyToken = (token) => jwt.verify(token, config.auth.jwtSecret);

module.exports = {
  signToken,
  verifyToken
};

