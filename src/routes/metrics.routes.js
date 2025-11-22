const express = require('express');
const metrics = require('../metrics');

const router = express.Router();

router.get('/', async (req, res) => {
  const metricsPayload = await metrics.getMetrics();
  res.set('Content-Type', metrics.register.contentType);
  res.send(metricsPayload);
});

module.exports = router;

