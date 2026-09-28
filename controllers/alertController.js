const Alert = require('../models/Alert');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { ALERT_SEVERITY } = require('../config/constants');
const { sendPushNotification } = require('../utils/firebaseService');

// GET /api/alerts
const getAlerts = asyncHandler(async (req, res) => {
  const { severity, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (severity) filter.severity = severity;

  const alerts = await Alert.find(filter)
    .populate('createdBy', 'name role')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Alert.countDocuments(filter);

  res.json({ success: true, count: alerts.length, total, page: Number(page), data: alerts });
});

// GET /api/alerts/emergency
const getEmergencyAlerts = asyncHandler(async (req, res) => {
  const alerts = await Alert.find({ isEmergency: true })
    .populate('createdBy', 'name role')
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({ success: true, count: alerts.length, data: alerts });
});

// POST /api/alerts (admin)
const createAlert = asyncHandler(async (req, res) => {
  const isEmergency = req.body.severity === ALERT_SEVERITY.EMERGENCY || req.body.isEmergency === true;

  const alert = await Alert.create({
    ...req.body,
    isEmergency,
    createdBy: req.user._id,
  });

  // Real-time broadcast via Socket.io
  const io = req.app.get('io');
  io.to('alerts').emit('alert:new', alert);

  // Firebase push notification for emergency alerts
  if (isEmergency) {
    const usersWithTokens = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }).select(
      'fcmTokens'
    );
    const allTokens = usersWithTokens.flatMap((u) => u.fcmTokens);
    await sendPushNotification(allTokens, {
      title: alert.title,
      body: alert.message,
      data: { alertId: alert._id.toString(), severity: alert.severity },
    });
    alert.sentViaPush = true;
    await alert.save();
  }

  res.status(201).json({ success: true, message: 'Alert created', data: alert });
});

module.exports = { getAlerts, getEmergencyAlerts, createAlert };
