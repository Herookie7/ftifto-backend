const express = require('express');
const router = express.Router();
const controller = require('../controllers/addressController');

router.get('/address/:userId', controller.getAddress);
router.post('/address', controller.addAddress);

module.exports = router;

