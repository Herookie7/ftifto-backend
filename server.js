require('./.renderfix.js');

const http = require('http');
const mongoose = require('mongoose');
const config = require('./src/config');
const connectDatabase = require('./src/config/database');
const app = require('./src/app');
const cluster = require('cluster');
const os = require('os');
const { initializeRealtime, shutdownRealtime } = require('./src/realtime');
const { initializeFirebase, sendAnalyticsEvent } = require('./src/services/notifications.service');
const Sentry = require('@sentry/node');
const logger = require('./src/logger');
const alerts = require('./src/services/alerts.service');
const startMetricsPush = require('./src/services/metricsPush.service');
const maintenanceService = require('./src/services/maintenance.service');
const secretsProvider = require('./src/config/secretsProvider');

const startServer = async () => {
  try {
    await connectDatabase();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Database connection failed, but continuing to start server', { error: error.message });
    // Don't exit - let the server start even if DB connection fails
    // The app can handle DB connection errors gracefully
  }

  // Note: Demo seed runs automatically in database.js after connection
  // This ensures seeding happens at the right time (after DB is connected)

  const server = http.createServer(app);
  
  try {
    initializeRealtime(server);
  } catch (error) {
    logger.warn('Failed to initialize realtime server', { error: error.message });
  }
  
  try {
    initializeFirebase();
  } catch (error) {
    logger.warn('Failed to initialize Firebase', { error: error.message });
  }
  
  try {
    startMetricsPush();
  } catch (error) {
    logger.warn('Failed to start metrics push', { error: error.message });
  }

  const PORT = process.env.PORT || 8001;

  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 Server running on port ${PORT}`);
  });
  
  server.on('error', (error) => {
    logger.error('Server error', { error: error.message, code: error.code });
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    }
  });

  let isShuttingDown = false;

  const shutdown = async (signal) => {
    if (isShuttingDown) {
      return;
    }
    isShuttingDown = true;

    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    try {
      await shutdownRealtime();
    } catch (error) {
      logger.error('Error shutting down realtime server', { error: error.message });
    }

    try {
      await mongoose.connection.close();
    } catch (error) {
      logger.error('Error closing MongoDB connection during shutdown', { error: error.message });
    }

    try {
      await maintenanceService.shutdown();
    } catch (error) {
      logger.warn('Error shutting down maintenance service', { error: error.message });
    }

    server.close(() => {
      logger.info('Server closed gracefully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => {
    shutdown('SIGTERM').catch((error) => {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    });
  });
  process.on('SIGINT', () => {
    shutdown('SIGINT').catch((error) => {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    });
  });

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection', { error: err.message });
    alerts.notifyError(err, { context: 'unhandledRejection' });
    if (config.sentry?.dsn) {
      Sentry.captureException(err, {
        tags: {
          signal: 'unhandledRejection'
        }
      });
    }
    shutdown('unhandledRejection').catch((error) => {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    });
  });
};

const startCluster = () => {
  // Disable cluster mode on Render - Render handles scaling
  const shouldUseCluster = config.cluster.enabled && !config.app.isRender && cluster.isPrimary;
  
  if (!shouldUseCluster) {
    startServer().catch((error) => {
      logger.error('Failed to start server', { error: error.message, stack: error.stack });
      process.exit(1);
    });
    return;
  }

  const workers = config.cluster.workers || os.cpus().length;
  logger.info(`Primary cluster ${process.pid} starting ${workers} workers`);

  for (let i = 0; i < workers; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn('Worker exited', { pid: worker.process.pid, code, signal });
    alerts.notifyEvent('Worker exited', { pid: worker.process.pid, code, signal });
    cluster.fork();
  });
};

const bootstrap = async () => {
  await secretsProvider.loadIntoProcess();
  startCluster();
};

bootstrap().catch((error) => {
  logger.error('Failed to bootstrap application', { error: error.message });
  process.exit(1);
});

