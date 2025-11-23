const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const os = require('os');
const { version } = require('../package.json');
const config = require('./config');
const swaggerSpec = require('./docs/swagger');
const routes = require('./routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');
const maintenance = require('./middleware/maintenance');
const logger = require('./logger');
const metrics = require('./metrics');
const metricsRouter = require('./routes/metrics.routes');
const Sentry = require('@sentry/node');
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

const docsRoute = config.docs.route || '/api/v1/docs';

const app = express();

if (config.sentry?.dsn) {
  Sentry.init({
    dsn: config.sentry.dsn,
    tracesSampleRate: config.sentry.tracesSampleRate,
    environment: config.app.nodeEnv
  });

  app.use(Sentry.Handlers.requestHandler());
  if (config.sentry.tracesSampleRate > 0) {
    app.use(Sentry.Handlers.tracingHandler());
  }

  logger.info('Sentry error tracking enabled');
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const buildMatcher = (pattern) => {
  if (pattern === '*') {
    return () => true;
  }

  if (!pattern.includes('*')) {
    return (origin = '') => origin === pattern;
  }

  const regexPattern = `^${escapeRegex(pattern).replace(/\\\*/g, '.*')}$`;
  const regex = new RegExp(regexPattern);
  return (origin = '') => regex.test(origin);
};

const originMatchers = config.cors.origins.map(buildMatcher);

const isOriginAllowed = (origin = '') => originMatchers.some((match) => match(origin));

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }

    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));

const captureStripeWebhook = (req, res, buf) => {
  if (req.originalUrl === '/api/v1/payments/webhook') {
    req.rawBody = buf;
  }
};

app.use(
  express.json({
    limit: '1mb',
    verify: captureStripeWebhook
  })
);
app.use(
  express.urlencoded({
    extended: true,
    verify: captureStripeWebhook
  })
);
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: 'draft-7',
  legacyHeaders: false
});

app.use(limiter);

app.use(metrics.requestMetricsMiddleware);

if (config.app.nodeEnv !== 'test') {
  app.use(
    morgan(config.logging.level, {
      stream: logger.stream
    })
  );
}

app.use(
  '/portal',
  express.static(path.join(__dirname, '..', 'docs'), {
    index: 'index.html'
  })
);

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Welcome to the unified Tifto API',
    links: {
      docs: docsRoute,
      status: '/status',
      metrics: '/metrics',
      portal: '/portal'
    }
  });
});

const mapMongoState = (state) => {
  switch (state) {
    case 0:
      return 'disconnected';
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'unknown';
  }
};

app.get('/api/live', (req, res) => {
  res.json({ status: 'live', uptime: process.uptime() });
});

app.get('/api/ready', (req, res) => {
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    return res.status(503).json({
      status: 'not-ready',
      mongoState: mapMongoState(state)
    });
  }

  return res.json({
    status: 'ready',
    mongoState: mapMongoState(state)
  });
});

app.get('/status', (req, res) => {
  const uptime = process.uptime();
  const mongoState = mapMongoState(mongoose.connection.readyState);
  const requestsServed = metrics.getRequestCount();

  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Tifto Backend Status</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 2rem; background: #f7f9fc; color: #1f2933; }
      h1 { color: #2563eb; }
      section { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 5px 15px rgba(15,23,42,0.08); }
      dl { display: grid; grid-template-columns: max-content 1fr; grid-gap: 0.5rem 1.5rem; }
      dt { font-weight: 600; }
      a { color: #2563eb; text-decoration: none; }
    </style>
  </head>
  <body>
    <section>
      <h1>ftifto-backend</h1>
      <dl>
        <dt>Version</dt><dd>${version}</dd>
        <dt>Commit</dt><dd>${config.build.commitSha || 'unknown'}</dd>
        <dt>Uptime</dt><dd>${uptime.toFixed(0)} seconds</dd>
        <dt>MongoDB</dt><dd>${mongoState}</dd>
        <dt>Requests Served</dt><dd>${requestsServed}</dd>
        <dt>Hostname</dt><dd>${os.hostname()}</dd>
        <dt>Portal</dt><dd><a href="/portal">/portal</a></dd>
        <dt>Docs</dt><dd><a href="${docsRoute}">${docsRoute}</a></dd>
        <dt>Status</dt><dd><a href="/status">/status</a></dd>
        <dt>Metrics</dt><dd><a href="/metrics">/metrics</a></dd>
      </dl>
    </section>
  </body>
</html>`);
});

app.use(maintenance);

// Add GraphQL health check route immediately (before async initialization)
// This ensures the endpoint is available even if GraphQL initialization is delayed
app.get('/graphql/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'GraphQL endpoint is available',
    endpoint: '/graphql',
    note: 'Use POST method for GraphQL queries'
  });
});

// GraphQL Apollo Server setup
let apolloServer;

const initializeGraphQL = async () => {
  try {
    apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      persistedQueries: false,
      cache: 'bounded',
      context: async ({ req }) => {
        const token = req.headers.authorization?.split(' ')[1] || null;
        
        if (!token) {
          return { user: null };
        }

        try {
          const { verifyToken } = require('./utils/token');
          const decoded = verifyToken(token);
          const User = require('./models/User');
          const user = await User.findById(decoded.id);
          
          return { user };
        } catch (error) {
          // Token is invalid or expired, return null user
          logger.warn('Invalid token in GraphQL context', { error: error.message });
          return { user: null };
        }
      },
      formatError: (err) => {
        logger.error('GraphQL Error', { error: err.message, stack: err.stack });
        return {
          message: err.message,
          code: err.extensions?.code,
          path: err.path
        };
      }
    });

    await apolloServer.start();
    apolloServer.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // CORS is already handled by express cors middleware
    });
    logger.info('GraphQL server started at /graphql');
    console.log('GraphQL server started at /graphql');
    
    return true;
  } catch (error) {
    logger.error('Failed to start GraphQL server', { error: error.message, stack: error.stack });
    console.error('Failed to start GraphQL server:', error.message, error.stack);
    // Add a fallback route to provide helpful error message
    app.get('/graphql', (req, res) => {
      res.status(503).json({
        status: 'error',
        message: 'GraphQL server is not available. Check server logs for details.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    });
    return false;
  }
};

// Initialize GraphQL immediately (non-blocking but will complete)
initializeGraphQL().catch((error) => {
  logger.error('GraphQL initialization failed', { error: error.message, stack: error.stack });
});

app.use('/api', routes);

const setDocsCache = (req, res, next) => {
  res.set('Cache-Control', 'public, max-age=600');
  next();
};

app.use(docsRoute, setDocsCache, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/metrics', metricsRouter);

app.use(notFound);

if (config.sentry?.dsn) {
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError() {
        return true;
      }
    })
  );
}

app.use(errorHandler);

module.exports = app;

