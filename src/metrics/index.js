const client = require('prom-client');
const config = require('../config');
const alerts = require('../services/alerts.service');

let totalRequests = 0;
let lastLatencyAlert = 0;

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: 'ftifto_'
});

const requestCounter = new client.Counter({
  name: 'ftifto_http_requests_total',
  help: 'Total number of HTTP requests processed',
  labelNames: ['method', 'route', 'status']
});

register.registerMetric(requestCounter);

const requestDurationHistogram = new client.Histogram({
  name: 'ftifto_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.05, 0.1, 0.25, 0.5, 0.75, 1, 3, 5]
});

register.registerMetric(requestDurationHistogram);

const getRouteLabel = (req) => {
  if (req.route?.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }
  return req.originalUrl || req.url;
};

const requestMetricsMiddleware = (req, res, next) => {
  const routeLabel = getRouteLabel(req);
  const startEpoch = process.hrtime.bigint();

  res.on('finish', () => {
    const diff = Number(process.hrtime.bigint() - startEpoch) / 1e9;
    const labels = {
      method: req.method,
      route: routeLabel,
      status: `${res.statusCode}`
    };
    requestCounter.inc(labels);
    requestDurationHistogram.observe(labels, diff);
    totalRequests += 1;

    if (
      diff > config.monitoring.latencyAlertThreshold &&
      Date.now() - lastLatencyAlert > config.monitoring.latencyAlertCooldownMs
    ) {
      lastLatencyAlert = Date.now();
      alerts.notifyLatency(routeLabel, diff, {
        method: req.method,
        status: res.statusCode
      });
    }
  });

  next();
};

const getMetrics = async () => register.metrics();

const getRequestCount = () => totalRequests;

module.exports = {
  register,
  requestMetricsMiddleware,
  getMetrics,
  getRequestCount
};

