const config = require('../config');
const logger = require('../logger');
const alerts = require('../services/alerts.service');
const Sentry = require('@sentry/node');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);

  const response = {
    status: 'error',
    statusCode,
    message: err.message || 'Internal server error'
  };

  if (err.details) {
    response.details = err.details;
  } else if (err.errors) {
    response.details = err.errors;
  }

  if (!config.app.isProduction) {
    response.stack = err.stack;
  }

  if (!res.headersSent) {
    if (statusCode >= 500) {
      if (config.sentry?.dsn) {
        Sentry.captureException(err, {
          tags: {
            component: 'express-error-handler'
          }
        });
      }
      logger.error(err.message, {
        statusCode,
        stack: err.stack
      });
      alerts.notifyError(err, { statusCode });
    } else {
      logger.warn(err.message, {
        statusCode,
        details: response.details
      });
    }
    return res.status(statusCode).json(response);
  }

  return undefined;
};

module.exports = errorHandler;

