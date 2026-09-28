const express = require('express');
const router = express.Router();
const { getAlerts, getEmergencyAlerts, createAlert } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { alertValidator } = require('../utils/validators');

// NOTE: /emergency must be declared before /:id-style routes to avoid collision,
// though this router has no /:id route currently — kept explicit for clarity/order.
router.get('/emergency', getEmergencyAlerts);
router.get('/', getAlerts);
router.post('/', protect, authorize('admin'), alertValidator, validate, createAlert);

module.exports = router;
