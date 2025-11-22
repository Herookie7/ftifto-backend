#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const config = require('../src/config');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXPORT_DIR = path.join(PROJECT_ROOT, '..', 'monitoring', 'exports');

dotenv.config({ path: path.join(PROJECT_ROOT, '.env') });

const fetch =
  typeof globalThis.fetch === 'function'
    ? globalThis.fetch.bind(globalThis)
    : (...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args));

const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const timestamp = () => new Date().toISOString().replace(/[:.]/g, '-');

const fetchMetrics = async () => {
  const baseApiUrl = config.api.baseUrl?.replace(/\/$/, '') || 'http://localhost:8001/api';
  const serviceOrigin = baseApiUrl.replace(/\/api$/, '');

  const response = await fetch(`${serviceOrigin}/metrics`);
  if (!response.ok) {
    throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

const writeSnapshot = async () => {
  const payload = await fetchMetrics();
  const filename = path.join(EXPORT_DIR, `metrics-${timestamp()}.prom`);
  fs.writeFileSync(filename, payload, 'utf8');
  console.log(`📡 Prometheus snapshot written to ${filename}`);
};

const main = async () => {
  ensureDir(EXPORT_DIR);

  const intervalMs = Number(process.env.METRICS_EXPORT_INTERVAL_MS || 300_000);
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
    throw new Error('METRICS_EXPORT_INTERVAL_MS must be a positive number (milliseconds).');
  }

  try {
    await writeSnapshot();
  } catch (error) {
    console.error(`Initial metrics export failed: ${error.message}`);
  }

  const timer = setInterval(async () => {
    try {
      await writeSnapshot();
    } catch (error) {
      console.error(`Metrics export failed: ${error.message}`);
    }
  }, intervalMs);

  const shutdown = () => {
    console.log('Stopping metrics exporter…');
    clearInterval(timer);
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
};

main().catch((error) => {
  console.error(`Metrics exporter terminated: ${error.message}`);
  process.exit(1);
});

