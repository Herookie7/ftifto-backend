const maintenanceService = require('../services/maintenance.service');
const config = require('../config');
const logger = require('../logger');

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const BYPASS_PATHS = [
  '/status',
  '/metrics',
  '/api/live',
  '/api/ready',
  '/api/v1/admin/maintenance'
];

const shouldBypass = (req) => {
  const path = req.originalUrl || req.path || '';

  if (READ_METHODS.has(req.method) && path.startsWith('/metrics')) {
    return true;
  }

  return BYPASS_PATHS.some((prefix) => path.startsWith(prefix));
};

const isReadMethod = (method) => READ_METHODS.has(method.toUpperCase());

const maintenanceMiddleware = async (req, res, next) => {
  try {
    if (req.method === 'OPTIONS') {
      return next();
    }

    if (shouldBypass(req)) {
      return next();
    }

    const state = await maintenanceService.getState();
    if (!state.enabled) {
      return next();
    }

    if (state.readOnly && isReadMethod(req.method)) {
      return next();
    }

    return res.status(503).json({
      status: 'maintenance',
      message: state.message || config.maintenance.defaultMessage,
      readOnly: state.readOnly,
      updatedAt: state.updatedAt,
      updatedBy: state.updatedBy
    });
  } catch (error) {
    logger.error('Maintenance middleware error', { error: error.message });
    return next();
  }
};

module.exports = maintenanceMiddleware;


