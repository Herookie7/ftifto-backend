const env = require('./env');

const parseList = (value, { separator = ',', allowWildcard = false } = {}) => {
  if (!value) {
    return allowWildcard ? ['*'] : [];
  }

  return value
    .split(separator)
    .map((item) => item.trim())
    .filter((item) => !!item.length);
};

const resolveCorsOrigins = () => {
  const origins = parseList(env.CORS_ORIGINS, { allowWildcard: true });
  return origins.length ? origins : ['*'];
};

const resolveSocketOrigins = () => {
  const origins = parseList(env.SOCKET_ALLOW_ORIGINS);
  return origins.length ? origins : resolveCorsOrigins();
};

const resolveFirebasePrivateKey = () => {
  if (env.FCM_PRIVATE_KEY_BASE64) {
    return Buffer.from(env.FCM_PRIVATE_KEY_BASE64, 'base64').toString('utf8');
  }
  if (env.FCM_PRIVATE_KEY) {
    try {
      const decoded = Buffer.from(env.FCM_PRIVATE_KEY, 'base64').toString('utf8');
      if (decoded.includes('BEGIN PRIVATE KEY')) {
        return decoded;
      }
    } catch (error) {
      // ignore decode failure and fall back to raw string replacement
    }
    return env.FCM_PRIVATE_KEY.replace(/\\n/g, '\n');
  }
  return undefined;
};

const resolveLogLevel = () => {
  if (env.NODE_ENV === 'production') {
    return 'combined';
  }
  return env.LOG_LEVEL || 'dev';
};

const config = {
  app: {
    nodeEnv: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isRender: env.RENDER,
    port: Number(env.PORT)
  },
  db: {
    uri: env.MONGODB_URI
  },
  auth: {
    jwtSecret: env.JWT_SECRET,
    tokenExpiry: env.TOKEN_EXPIRY
  },
  cors: {
    origins: resolveCorsOrigins()
  },
  logging: {
    level: resolveLogLevel(),
    logtailToken: env.LOGTAIL_SOURCE_TOKEN
  },
  cluster: {
    enabled: env.ENABLE_CLUSTER !== 'false',
    workers: env.CLUSTER_WORKERS ? Number(env.CLUSTER_WORKERS) : undefined
  },
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX
  },
  socket: {
    namespaces: {
      orders: '/orders',
      riders: '/riders'
    },
    allowOrigins: resolveSocketOrigins(),
    redisUrl: env.REDIS_URL
  },
  notifications: {
    firebase: {
      projectId: env.FCM_PROJECT_ID,
      clientEmail: env.FCM_CLIENT_EMAIL,
      privateKey: resolveFirebasePrivateKey()
    },
    topics: {
      admin: 'tifto-admin',
      seller: 'tifto-seller',
      rider: 'tifto-rider',
      customer: 'tifto-customer'
    }
  },
  docs: {
    route: env.DOCS_ROUTE
  },
  api: {
    baseUrl: env.API_BASE_URL
  },
  build: {
    commitSha: env.GIT_COMMIT_SHA
  },
  analytics: {
    measurementId: env.GA_MEASUREMENT_ID,
    apiSecret: env.GA_API_SECRET
  },
  monitoring: {
    grafanaPushUrl: env.GRAFANA_PUSH_URL,
    grafanaApiKey: env.GRAFANA_API_KEY,
    latencyAlertThreshold: 2,
    latencyAlertCooldownMs: 60_000
  },
  maintenance: {
    defaultMessage: env.MAINTENANCE_MESSAGE,
    readOnlyByDefault: env.MAINTENANCE_READ_ONLY !== 'false',
    redisKey: env.MAINTENANCE_REDIS_KEY,
    cacheTtlMs: Number.isFinite(env.MAINTENANCE_CACHE_TTL_MS) ? env.MAINTENANCE_CACHE_TTL_MS : 5000
  },
  backups: {
    bucket: env.AWS_S3_BUCKET,
    endpoint: env.AWS_S3_ENDPOINT,
    region: env.AWS_S3_REGION,
    accessKeyId: env.AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
    prefix: env.BACKUP_PREFIX,
    retention: Number.isFinite(env.BACKUP_RETENTION) ? env.BACKUP_RETENTION : 7,
    verifyUri: env.BACKUP_VERIFY_URI
  },
  secrets: {
    useSecretsManager: env.USE_SECRETS_MANAGER === 'true',
    provider: (env.SECRETS_PROVIDER || 'aws').toLowerCase(),
    aws: {
      region: env.AWS_SECRETS_REGION,
      secretIds: parseList(env.AWS_SECRETS_IDS)
    },
    vault: {
      address: env.VAULT_ADDR,
      token: env.VAULT_TOKEN,
      paths: parseList(env.VAULT_SECRETS_PATHS)
    }
  },
  payments: {
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET,
      defaultCurrency: 'usd'
    }
  },
  oauth: {
    redirectUri: env.OAUTH_REDIRECT_URI,
    providers: {
      google: {
        clientId: env.OAUTH_GOOGLE_CLIENT_ID,
        clientSecret: env.OAUTH_GOOGLE_CLIENT_SECRET,
        scope: 'openid email profile'
      },
      github: {
        clientId: env.OAUTH_GITHUB_CLIENT_ID,
        clientSecret: env.OAUTH_GITHUB_CLIENT_SECRET,
        scope: 'read:user user:email'
      }
    }
  },
  dataRetention: {
    days: Number.isFinite(env.DATA_RETENTION_DAYS) ? env.DATA_RETENTION_DAYS : 365,
    s3Prefix: env.DATA_RETENTION_S3_PREFIX
  },
  sentry: {
    dsn: env.SENTRY_DSN,
    tracesSampleRate: Number(env.SENTRY_TRACES_SAMPLE_RATE) || 0
  },
  alerts: {
    slackWebhookUrl: env.SLACK_WEBHOOK_URL,
    discordWebhookUrl: env.DISCORD_WEBHOOK_URL
  }
};

module.exports = config;

