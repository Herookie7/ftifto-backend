const express = require('express');
const v1Routes = require('./v1');

const router = express.Router();

router.use((req, res, next) => {
  if (req.path === '/v1' || req.path.startsWith('/v1/')) {
    return next();
  }

  if (req.path === '/live' || req.path === '/ready') {
    return next();
  }

  return res.redirect(308, `/api/v1${req.path}`);
});

router.use('/v1', v1Routes);

module.exports = router;

