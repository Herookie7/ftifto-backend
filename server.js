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
const { generateWeeklyDeliveriesJob } = require('./src/cron/subscriptionCron'); // Import Cron


const startServer = async () => {
  const server = http.createServer(app);

  // Start server listening first (but don't accept connections until ready)
  const PORT = process.env.PORT || 8001;

  // Wait for GraphQL to initialize after server is created (so we can pass it for subscriptions)
  // This ensures Apollo Server middleware is registered and subscriptions are configured
  const { initializeGraphQL } = require('./src/app');
  try {
    await initializeGraphQL(server);
    logger.info('GraphQL initialized with WebSocket subscriptions support');
  } catch (error) {
    logger.warn('GraphQL initialization failed, but continuing server start', { error: error.message });
  }

  // Now start accepting connections
  server.listen(PORT, '0.0.0.0', () => {
    logger.info(`🚀 Server running on port ${PORT}`);
    console.log(`🚀 Server running on port ${PORT}`);

    // Start Cron Jobs
    generateWeeklyDeliveriesJob.start();
    logger.info('Weekly subscription delivery generation cron job started');
  });

  server.on('error', (error) => {
    logger.error('Server error', { error: error.message, code: error.code });
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
      process.exit(1);
    }
  });

  // Connect to database in background (non-blocking)
  // This allows the server to start even if DB connection is slow or fails
  connectDatabase().then(() => {
    logger.info('Database connected successfully');
  }).catch((error) => {
    logger.error('Database connection failed, but server is running', { error: error.message });
    // Don't exit - let the server continue running
    // The app can handle DB connection errors gracefully
  });

  // Initialize other services (non-blocking)
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

  try {
    const { initializeNotificationSchedulers } = require('./src/services/notificationScheduler');
    initializeNotificationSchedulers();
  } catch (error) {
    logger.warn('Failed to initialize notification schedulers', { error: error.message });
  }

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

    try {
      const { shutdownNotificationSchedulers } = require('./src/services/notificationScheduler');
      shutdownNotificationSchedulers();
    } catch (error) {
      logger.warn('Error shutting down notification schedulers', { error: error.message });
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

