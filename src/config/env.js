const dotenv = require('dotenv');

dotenv.config();

// Require MONGO_URI - app cannot boot without it
// Support both MONGO_URI (preferred) and MONGODB_URI (for backward compatibility with Render secrets)
const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!mongoUri) {
  throw new Error('MONGO_URI environment variable is required. Please set it in your .env file or environment.');
}

// Require JWT_SECRET - app cannot boot without it
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in your .env file or environment.');
}

// Log that MONGO_URI was loaded (but don't print the value)
if (mongoUri) {
  // eslint-disable-next-line no-console
  console.log('Loaded MONGO_URI');
}

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  RENDER: process.env.RENDER === 'true' || process.env.RENDER_SERVICE_NAME !== undefined,
  PORT: process.env.PORT || '8001',
  MONGODB_URI: mongoUri,
  JWT_SECRET: process.env.JWT_SECRET,
  TOKEN_EXPIRY: process.env.TOKEN_EXPIRY || '7d',
  CORS_ORIGINS: process.env.CORS_ORIGINS || '*',
  LOG_LEVEL: process.env.LOG_LEVEL || 'dev',
  SOCKET_ALLOW_ORIGINS: process.env.SOCKET_ALLOW_ORIGINS || '',
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID || '',
  FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL || '',
  FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY || '',
  FCM_PRIVATE_KEY_BASE64: process.env.FCM_PRIVATE_KEY_BASE64 || '',
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  DOCS_ROUTE: process.env.DOCS_ROUTE || '/api/v1/docs',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8001/api',
  LOGTAIL_SOURCE_TOKEN: process.env.LOGTAIL_SOURCE_TOKEN || '',
  GA_MEASUREMENT_ID: process.env.GA_MEASUREMENT_ID || '',
  GA_API_SECRET: process.env.GA_API_SECRET || '',
  ENABLE_CLUSTER: process.env.ENABLE_CLUSTER ?? 'true',
  CLUSTER_WORKERS: process.env.CLUSTER_WORKERS || '',
  REDIS_URL: process.env.REDIS_URL || '',
  GRAFANA_PUSH_URL: process.env.GRAFANA_PUSH_URL || '',
  GRAFANA_API_KEY: process.env.GRAFANA_API_KEY || '',
  SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL || '',
  DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL || '',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  SENTRY_TRACES_SAMPLE_RATE: process.env.SENTRY_TRACES_SAMPLE_RATE || '0',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || '',
  AWS_S3_ENDPOINT: process.env.AWS_S3_ENDPOINT || process.env.S3_ENDPOINT || '',
  AWS_S3_REGION: process.env.AWS_S3_REGION || process.env.AWS_REGION || 'us-east-1',
  AWS_S3_ACCESS_KEY_ID: process.env.AWS_S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID || '',
  AWS_S3_SECRET_ACCESS_KEY: process.env.AWS_S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY || '',
  BACKUP_PREFIX: process.env.BACKUP_PREFIX || 'backups/',
  BACKUP_RETENTION: Number(process.env.BACKUP_RETENTION ?? 7),
  BACKUP_VERIFY_URI: process.env.BACKUP_VERIFY_URI || '',
  MAINTENANCE_READ_ONLY: process.env.MAINTENANCE_READ_ONLY || 'true',
  MAINTENANCE_MESSAGE: process.env.MAINTENANCE_MESSAGE || 'Service temporarily unavailable while we upgrade systems.',
  MAINTENANCE_REDIS_KEY: process.env.MAINTENANCE_REDIS_KEY || 'ftifto:maintenance',
  MAINTENANCE_CACHE_TTL_MS: Number(process.env.MAINTENANCE_CACHE_TTL_MS) || 5000,
  USE_SECRETS_MANAGER: process.env.USE_SECRETS_MANAGER || 'false',
  SECRETS_PROVIDER: process.env.SECRETS_PROVIDER || 'aws',
  AWS_SECRETS_REGION: process.env.AWS_SECRETS_REGION || process.env.AWS_REGION || process.env.AWS_S3_REGION || 'us-east-1',
  AWS_SECRETS_IDS: process.env.AWS_SECRETS_IDS || '',
  VAULT_ADDR: process.env.VAULT_ADDR || '',
  VAULT_TOKEN: process.env.VAULT_TOKEN || '',
  VAULT_SECRETS_PATHS: process.env.VAULT_SECRETS_PATHS || '',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
  OAUTH_REDIRECT_URI: process.env.OAUTH_REDIRECT_URI || '',
  OAUTH_GOOGLE_CLIENT_ID: process.env.OAUTH_GOOGLE_CLIENT_ID || '',
  OAUTH_GOOGLE_CLIENT_SECRET: process.env.OAUTH_GOOGLE_CLIENT_SECRET || '',
  OAUTH_GITHUB_CLIENT_ID: process.env.OAUTH_GITHUB_CLIENT_ID || '',
  OAUTH_GITHUB_CLIENT_SECRET: process.env.OAUTH_GITHUB_CLIENT_SECRET || '',
  DATA_RETENTION_DAYS: Number(process.env.DATA_RETENTION_DAYS) || 365,
  DATA_RETENTION_S3_PREFIX: process.env.DATA_RETENTION_S3_PREFIX || 'retention/',
  GIT_COMMIT_SHA:
    process.env.GIT_COMMIT_SHA ||
    process.env.RENDER_GIT_COMMIT ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    ''
};

module.exports = env;

