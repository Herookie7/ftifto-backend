const rateLimit = require('express-rate-limit');
const logger = require('../logger');

/**
 * Per-user rate limiter middleware
 * Different limits for authenticated vs unauthenticated users
 */
const userRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Higher limit for authenticated users
    return req.user ? 200 : 50;
  },
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user && req.user._id) {
      return `user:${req.user._id.toString()}`;
    }
    return `ip:${req.ip || req.connection.remoteAddress}`;
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: (req) => {
    const limit = req.user ? 200 : 50;
    return {
      error: 'Too many requests',
      message: `You have exceeded the rate limit of ${limit} requests per 15 minutes. Please try again later.`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    };
  },
  handler: (req, res) => {
    const limit = req.user ? 200 : 50;
    logger.warn('Rate limit exceeded', {
      userId: req.user?._id?.toString(),
      ip: req.ip,
      limit,
      path: req.path
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: `You have exceeded the rate limit of ${limit} requests per 15 minutes. Please try again later.`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  },
  skip: (req) => {
    // Skip rate limiting for health checks and metrics
    return req.path === '/health' || req.path === '/status' || req.path.startsWith('/metrics');
  }
});

/**
 * Strict rate limiter for sensitive endpoints (login, registration, etc.)
 */
const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Only 5 attempts per 15 minutes
  keyGenerator: (req) => {
    // Use IP for strict limiter (works for both authenticated and unauthenticated)
    return `strict:${req.ip || req.connection.remoteAddress}`;
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'Too many attempts. Please try again after 15 minutes.'
  },
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Too many attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * API rate limiter for GraphQL and REST API endpoints
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on user role
    if (req.user) {
      switch (req.user.role) {
        case 'ADMIN':
          return 500;
        case 'SELLER':
        case 'RIDER':
          return 300;
        case 'CUSTOMER':
        default:
          return 200;
      }
    }
    return 50; // Unauthenticated users
  },
  keyGenerator: (req) => {
    if (req.user && req.user._id) {
      return `api:${req.user.role}:${req.user._id.toString()}`;
    }
    return `api:ip:${req.ip || req.connection.remoteAddress}`;
  },
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: (req) => {
    const limit = req.user 
      ? (req.user.role === 'ADMIN' ? 500 : req.user.role === 'SELLER' || req.user.role === 'RIDER' ? 300 : 200)
      : 50;
    return {
      error: 'API rate limit exceeded',
      message: `You have exceeded the API rate limit of ${limit} requests per 15 minutes.`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    };
  },
  handler: (req, res) => {
    const limit = req.user 
      ? (req.user.role === 'ADMIN' ? 500 : req.user.role === 'SELLER' || req.user.role === 'RIDER' ? 300 : 200)
      : 50;
    logger.warn('API rate limit exceeded', {
      userId: req.user?._id?.toString(),
      role: req.user?.role,
      ip: req.ip,
      limit,
      path: req.path
    });
    
    res.status(429).json({
      error: 'API rate limit exceeded',
      message: `You have exceeded the API rate limit of ${limit} requests per 15 minutes.`,
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

module.exports = {
  userRateLimiter,
  strictRateLimiter,
  apiRateLimiter
};
