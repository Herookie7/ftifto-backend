const express = require('express');
const { version } = require('../../package.json');
const config = require('../config');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    version,
    commit: config.build.commitSha || 'unknown'
  });
});

module.exports = router;

