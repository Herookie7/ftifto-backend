#!/usr/bin/env node

/* eslint-disable no-console */

const path = require('path');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const admin = require('firebase-admin');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const config = require('../src/config');
const swaggerSpec = require('../src/docs/swagger');

const fetch =
  globalThis.fetch?.bind(globalThis) ||
  ((...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args)));

const REQUIRED_ENV_VARS = [
  'NODE_ENV',
  'MONGO_URI',
  'JWT_SECRET',
  'REDIS_URL',
  'FCM_PROJECT_ID',
  'FCM_CLIENT_EMAIL'
];

const BASE_API_URL = config.api.baseUrl?.replace(/\/$/, '') || 'http://localhost:8001/api';
const SERVICE_ORIGIN = BASE_API_URL.replace(/\/api$/, '');

const endpointChecks = [
  { label: 'Health', url: `${BASE_API_URL}/v1/health`, expect: 200 },
  { label: 'Version', url: `${BASE_API_URL}/v1/version`, expect: 200 },
  { label: 'Status', url: `${SERVICE_ORIGIN}/status`, expect: 200 },
  { label: 'Metrics', url: `${SERVICE_ORIGIN}/metrics`, expect: 200 },
  { label: 'Swagger UI', url: `${SERVICE_ORIGIN}${config.docs.route}`, expect: 200 }
];

const results = [];
const failures = [];

const record = (name, status, details) => {
  const entry = { name, status, details };
  results.push(entry);
  if (status === 'FAIL') {
    failures.push(entry);
  }
};

const checkEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  const hasPrivateKey =
    Boolean(process.env.FCM_PRIVATE_KEY && process.env.FCM_PRIVATE_KEY.trim().length > 0) ||
    Boolean(process.env.FCM_PRIVATE_KEY_BASE64 && process.env.FCM_PRIVATE_KEY_BASE64.trim().length > 0);

  if (!hasPrivateKey) {
    missing.push('FCM_PRIVATE_KEY or FCM_PRIVATE_KEY_BASE64');
  }

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

const checkMongo = async () => {
  const connection = await mongoose.createConnection(config.db.uri, {
    serverSelectionTimeoutMS: 5_000
  }).asPromise();
  await connection.db.admin().ping();
  await connection.close();
};

const checkRedis = async () => {
  if (!config.socket.redisUrl) {
    throw new Error('REDIS_URL is not configured');
  }

  const redis = new Redis(config.socket.redisUrl, {
    lazyConnect: true,
    connectTimeout: 5_000
  });

  try {
    await redis.connect();
    await redis.ping();
  } finally {
    redis.disconnect();
  }
};

const checkFcm = async () => {
  const { projectId, clientEmail, privateKey } = config.notifications.firebase;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('FCM credentials incomplete');
  }

  const app = admin.initializeApp(
    {
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey
      })
    },
    `pre-release-${Date.now()}`
  );

  try {
    if (typeof app.options.credential.getAccessToken === 'function') {
      await app.options.credential.getAccessToken();
    } else {
      await admin.messaging(app).app;
    }
  } finally {
    await app.delete();
  }
};

const checkSwagger = () => {
  if (!swaggerSpec?.info?.title || !swaggerSpec?.paths || Object.keys(swaggerSpec.paths).length === 0) {
    throw new Error('Swagger specification appears to be incomplete.');
  }
};

const checkEndpoints = async () => {
  for (const endpoint of endpointChecks) {
    const response = await fetch(endpoint.url, { method: 'GET', redirect: 'manual' });
    if (response.status !== endpoint.expect) {
      throw new Error(`${endpoint.label} (${endpoint.url}) responded with ${response.status}`);
    }
  }
};

const runCheck = async (label, fn) => {
  try {
    await fn();
    record(label, 'PASS');
  } catch (error) {
    record(label, 'FAIL', error.message);
  }
};

(async () => {
  await runCheck('Environment variables', checkEnv);
  await runCheck('MongoDB connectivity', checkMongo);
  await runCheck('Redis connectivity', checkRedis);
  await runCheck('Firebase Cloud Messaging', checkFcm);
  await runCheck('Swagger specification', checkSwagger);
  await runCheck('Key HTTP endpoints', checkEndpoints);

  console.log('\nPre-release checklist results:');
  results.forEach((entry) => {
    console.log(`${entry.status === 'PASS' ? '✔' : '✖'} ${entry.name}${entry.details ? ` – ${entry.details}` : ''}`);
  });

  if (failures.length > 0) {
    console.error(`\n${failures.length} check(s) failed. Resolve the issues above before releasing.`);
    process.exit(1);
  }

  console.log('\nAll checks passed. Ready for release ✅');
  process.exit(0);
})();

