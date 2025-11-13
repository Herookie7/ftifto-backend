#!/usr/bin/env node
/* eslint-disable no-console */
const path = require('path');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const config = require('../src/config');
const fetch =
  globalThis.fetch?.bind(globalThis) ||
  ((...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args)));

const BASE_URL = process.env.API_BASE_URL || config.api.baseUrl || 'http://localhost:8001/api';
const ROOT_URL = BASE_URL.replace(/\/api\/?$/, '');

const endpoints = [
  { path: '/v1/health', expect: 200 },
  { path: '/v1/version', expect: 200 },
  { path: '/docs', expect: 200 }
];

const checkEndpoint = async ({ path: endpointPath, expect }) => {
  const url = endpointPath === '/docs' ? `${ROOT_URL}${endpointPath}` : `${BASE_URL}${endpointPath.replace('/api', '')}`;
  const response = await fetch(url, { method: 'GET', redirect: 'manual' });

  if (response.status !== expect) {
    throw new Error(`${url} responded with status ${response.status}`);
  }

  return url;
};

const verifyMongoConnection = async () => {
  const uri = config.db.uri;
  if (!uri) {
    throw new Error('Missing MongoDB connection URI');
  }

  const connection = await mongoose.createConnection(uri).asPromise();
  await connection.close();
  return uri;
};

(async () => {
  try {
    console.log(`Verifying deployment at ${BASE_URL}`);

    for (const endpoint of endpoints) {
      const url = await checkEndpoint(endpoint);
      console.log(`✔ Endpoint healthy: ${url}`);
    }

    const mongoUri = await verifyMongoConnection();
    console.log(`✔ MongoDB reachable: ${mongoUri}`);

    console.log('Deployment verification completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Deployment verification failed:', error.message);
    process.exit(1);
  }
})();

