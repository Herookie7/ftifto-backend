const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const Redis = require('ioredis');
const config = require('../config');
const logger = require('../logger');
const { registerNamespaces, emitOrderUpdate } = require('./emitter');
const Sentry = require('@sentry/node');

let io;
let redisClients = [];

const initializeRealtime = (server) => {
  if (io) {
    return io;
  }

  io = new Server(server, {
    cors: {
      origin: config.socket.allowOrigins,
      methods: ['GET', 'POST']
    }
  });

  const ordersNamespace = io.of(config.socket.namespaces.orders);
  const ridersNamespace = io.of(config.socket.namespaces.riders);

  const captureSocketError = (namespace, error) => {
    logger.error('Socket.IO namespace error', {
      namespace,
      error: error.message
    });
    if (config.sentry?.dsn) {
      Sentry.captureException(error, {
        tags: {
          component: 'socket.io',
          namespace
        }
      });
    }
  };

  io.engine.on('connection_error', (err) => {
    logger.warn('Socket.IO engine connection error', { error: err.message });
    if (config.sentry?.dsn) {
      Sentry.captureException(err, {
        tags: {
          component: 'socket.io',
          stage: 'engine'
        }
      });
    }
  });

  if (config.socket.redisUrl) {
    const pubClient = new Redis(config.socket.redisUrl);
    const subClient = pubClient.duplicate();

    [pubClient, subClient].forEach((client) => {
      client.on('error', (error) => {
        logger.error('Redis adapter error', { error: error.message });
      });
    });

    ordersNamespace.adapter(createAdapter(pubClient, subClient));
    ridersNamespace.adapter(createAdapter(pubClient, subClient));
    redisClients = [pubClient, subClient];
    logger.info('Socket.IO Redis adapter enabled');
  }

  ordersNamespace.on('connection', (socket) => {
    socket.on('error', (error) => captureSocketError(config.socket.namespaces.orders, error));

    socket.on('joinOrder', (orderId) => {
      if (orderId) {
        socket.join(orderId);
      }
    });

    socket.on('leaveOrder', (orderId) => {
      if (orderId) {
        socket.leave(orderId);
      }
    });

    socket.on('order:update', ({ orderId, payload }) => {
      if (orderId) {
        emitOrderUpdate(orderId, payload);
      }
    });
  });

  ridersNamespace.on('connection', (socket) => {
    socket.on('error', (error) => captureSocketError(config.socket.namespaces.riders, error));

    socket.on('joinRiderRoom', (riderId) => {
      if (riderId) {
        socket.join(riderId);
      }
    });

    socket.on('leaveRiderRoom', (riderId) => {
      if (riderId) {
        socket.leave(riderId);
      }
    });

    socket.on('rider:location:update', ({ riderId, location }) => {
      if (riderId && location) {
        ridersNamespace.to(riderId).emit('rider:location', { riderId, location });
      }
    });
  });

  registerNamespaces({
    orders: ordersNamespace,
    riders: ridersNamespace
  });

  ordersNamespace.on('error', (error) => captureSocketError(config.socket.namespaces.orders, error));
  ridersNamespace.on('error', (error) => captureSocketError(config.socket.namespaces.riders, error));

  return io;
};

const shutdownRealtime = async () => {
  if (io) {
    await io.close();
    io = undefined;
  }
  await Promise.all(
    redisClients.map((client) =>
      client
        .quit()
        .catch((error) => logger.warn('Error closing Redis client', { error: error.message }))
    )
  );
  redisClients = [];
};

const getIo = () => io;

module.exports = {
  initializeRealtime,
  shutdownRealtime,
  getIo
};

