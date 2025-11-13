#!/usr/bin/env node

const path = require('path');
const dotenv = require('dotenv');
const config = require('../src/config');
const alerts = require('../src/services/alerts.service');

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const fetch =
  globalThis.fetch?.bind(globalThis) ||
  ((...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args)));

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const parsePrometheusSamples = (payload, metricName) => {
  const lines = payload
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith(metricName));

  return lines.map((line) => {
    const match = line.match(/^[^{]+{([^}]*)}\s+([0-9.eE+-]+)$/);
    if (!match) {
      return null;
    }

    const [, rawLabels, rawValue] = match;
    const labels = {};
    rawLabels.split(',').forEach((pair) => {
      const [key, raw] = pair.split('=');
      labels[key] = raw.replace(/^"|"$/g, '');
    });

    return {
      labels,
      value: toNumber(rawValue)
    };
  }).filter(Boolean);
};

const summarizeMetrics = (payload) => {
  const requestSamples = parsePrometheusSamples(payload, 'ftifto_http_requests_total');
  const durationCountSamples = parsePrometheusSamples(
    payload,
    'ftifto_http_request_duration_seconds_count'
  );
  const durationSumSamples = parsePrometheusSamples(
    payload,
    'ftifto_http_request_duration_seconds_sum'
  );

  const totalRequests = requestSamples.reduce((sum, sample) => sum + sample.value, 0);
  const errorRequests = requestSamples
    .filter((sample) => sample.labels.status?.startsWith('4') || sample.labels.status?.startsWith('5'))
    .reduce((sum, sample) => sum + sample.value, 0);

  const routes = new Map();
  requestSamples.forEach((sample) => {
    const key = `${sample.labels.method ?? 'UNKNOWN'} ${sample.labels.route ?? 'unknown'}`;
    routes.set(key, (routes.get(key) ?? 0) + sample.value);
  });

  const topRoute = Array.from(routes.entries()).sort((a, b) => b[1] - a[1])[0];
  const durationCount = durationCountSamples.reduce((sum, sample) => sum + sample.value, 0);
  const durationSum = durationSumSamples.reduce((sum, sample) => sum + sample.value, 0);
  const averageLatency = durationCount > 0 ? durationSum / durationCount : 0;

  const memoryMatch = payload.match(/^process_resident_memory_bytes\s+([0-9.eE+-]+)/m);
  const rssBytes = memoryMatch ? toNumber(memoryMatch[1]) : 0;

  return {
    totalRequests,
    errorRequests,
    averageLatency,
    topRoute: topRoute ? { route: topRoute[0], count: topRoute[1] } : null,
    rssBytes
  };
};

const main = async () => {
  try {
    const baseApiUrl = config.api.baseUrl?.replace(/\/$/, '') ?? 'http://localhost:8001/api';
    const serviceOrigin = baseApiUrl.replace(/\/api$/, '');

    const response = await fetch(`${serviceOrigin}/metrics`);
    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status} ${response.statusText}`);
    }

    const metricsPayload = await response.text();
    const summary = summarizeMetrics(metricsPayload);
    const date = new Date().toISOString().split('T')[0];

    await alerts.notifyEvent('Daily metrics digest', {
      date,
      totalRequests: summary.totalRequests,
      errorRequests: summary.errorRequests,
      errorRate:
        summary.totalRequests === 0
          ? 0
          : Number(((summary.errorRequests / summary.totalRequests) * 100).toFixed(2)),
      averageLatencySeconds: Number(summary.averageLatency.toFixed(3)),
      topRoute: summary.topRoute,
      memoryRssMB: Number((summary.rssBytes / 1024 / 1024).toFixed(1))
    });

    console.log('Metrics digest delivered successfully.');
  } catch (error) {
    console.error('Failed to publish metrics digest:', error.message);
    process.exitCode = 1;
  }
};

main();

