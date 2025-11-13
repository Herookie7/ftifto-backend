const config = require('../config');
const metrics = require('../metrics');
const logger = require('../logger');

const fetch =
  globalThis.fetch?.bind(globalThis) ||
  ((...args) => import('node-fetch').then(({ default: fetchModule }) => fetchModule(...args)));

const INTERVAL_MS = 60_000;

const startMetricsPush = () => {
  if (!config.monitoring.grafanaPushUrl || !config.monitoring.grafanaApiKey) {
    return;
  }

  setInterval(async () => {
    try {
      const body = await metrics.getMetrics();
      await fetch(config.monitoring.grafanaPushUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${config.monitoring.grafanaApiKey}`,
          'Content-Type': 'text/plain'
        },
        body
      });
    } catch (error) {
      logger.warn('Failed to push metrics to Grafana', { error: error.message });
    }
  }, INTERVAL_MS).unref();
};

module.exports = startMetricsPush;

