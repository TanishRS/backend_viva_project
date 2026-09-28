const express = require('express');
const router = express.Router();
const { sendNotification } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');

router.post('/send', protect, authorize('admin'), sendNotification);

module.exports = router;
