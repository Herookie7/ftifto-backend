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

// GraphQL Apollo Server setup
const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./graphql/schema');
const resolvers = require('./graphql/resolvers');

let apolloServer = null;

// Initialize GraphQL Server
const initializeGraphQL = async (server) => {
  try {
    apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      persistedQueries: false,
      cache: 'bounded',
      context: async ({ req, connection }) => {
        // Handle subscriptions (connection context) vs queries/mutations (req context)
        if (connection) {
          // Subscription context
          const token = connection.context?.authorization?.split(' ')[1] || null;
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
            logger.warn('Invalid token in subscription context', { error: error.message });
            return { user: null };
          }
        }
        
        // Query/Mutation context
        const token = req?.headers?.authorization?.split(' ')[1] || null;
        
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
    
    // Apply Apollo Server middleware - handles both GET and POST for /graphql
    apolloServer.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // CORS is already handled by express cors middleware
    });
    
    // Install WebSocket subscription handlers if server is provided
    if (server) {
      const { SubscriptionServer } = require('subscriptions-transport-ws');
      const { execute, subscribe } = require('graphql');
      const { makeExecutableSchema } = require('@graphql-tools/schema');
      
      const schema = makeExecutableSchema({
        typeDefs,
        resolvers
      });
      
      const subscriptionServer = SubscriptionServer.create(
        {
          schema,
          execute,
          subscribe,
          onConnect: async (connectionParams, websocket) => {
            // Extract token from connection params
            const token = connectionParams?.authorization?.split(' ')[1] || 
                         connectionParams?.Authorization?.split(' ')[1] || null;
            
            let user = null;
            if (token) {
              try {
                const { verifyToken } = require('./utils/token');
                const decoded = verifyToken(token);
                const User = require('./models/User');
                user = await User.findById(decoded.id);
              } catch (error) {
                logger.warn('Invalid token in WebSocket connection', { error: error.message });
              }
            }
            
            return { user, authorization: connectionParams?.authorization || connectionParams?.Authorization };
          },
          onDisconnect: () => {
            logger.info('GraphQL subscription client disconnected');
          }
        },
        {
          server,
          path: '/graphql'
        }
      );
      
      logger.info('GraphQL WebSocket subscriptions enabled at /graphql');
      console.log('✅ GraphQL WebSocket subscriptions enabled');
    }
    
    logger.info('GraphQL server started successfully at /graphql');
    console.log('✅ GraphQL server started at /graphql');
    
    return true;
  } catch (error) {
    logger.error('Failed to start GraphQL server', { error: error.message, stack: error.stack });
    console.error('❌ Failed to start GraphQL server:', error.message);
    return false;
  }
};

// GraphQL health check endpoint (must be before /api routes)
app.get('/graphql/health', (req, res) => {
  res.json({ 
    status: apolloServer ? 'ok' : 'initializing',
    message: apolloServer 
      ? 'GraphQL endpoint is available' 
      : 'GraphQL endpoint is initializing',
    endpoint: '/graphql'
  });
});

// Explicit GraphQL POST handler (registered synchronously, before notFound middleware)
// This ensures the route is available even if applyMiddleware has timing issues
app.post('/graphql', async (req, res) => {
  if (!apolloServer) {
    return res.status(503).json({ 
      errors: [{ message: 'GraphQL server is initializing' }] 
    });
  }
  
  try {
    // Extract GraphQL request from body
    const { query, variables, operationName } = req.body;
    
    if (!query) {
      return res.status(400).json({ 
        errors: [{ message: 'GraphQL query is required' }] 
      });
    }
    
    // Execute the GraphQL operation
    const result = await apolloServer.executeOperation({
      query,
      variables: variables || {},
      operationName: operationName || undefined
    }, {
      req,
      res
    });
    
    // Send the response - handle both single and batch results
    if (result.body && result.body.kind === 'single') {
      res.json(result.body.singleResult);
    } else if (result.body) {
      res.json(result.body);
    } else {
      res.json(result);
    }
  } catch (error) {
    logger.error('GraphQL POST handler error', { error: error.message, stack: error.stack });
    res.status(500).json({ 
      errors: [{ message: error.message }] 
    });
  }
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

// Export app and initializeGraphQL
module.exports = app;
module.exports.initializeGraphQL = initializeGraphQL;

