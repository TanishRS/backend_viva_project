const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendPushNotification } = require('../utils/firebaseService');

// POST /api/notifications/send  (admin: send a custom push notification)
const sendNotification = asyncHandler(async (req, res) => {
  const { title, body, userIds, tokens: explicitTokens } = req.body;

  if (!title || !body) {
    throw new ApiError(400, 'title and body are required');
  }

  let tokens = explicitTokens || [];

  if (userIds && userIds.length) {
    const users = await User.find({ _id: { $in: userIds } }).select('fcmTokens');
    tokens = tokens.concat(users.flatMap((u) => u.fcmTokens));
  }

  if (!explicitTokens && !userIds) {
    // Broadcast to all users with a registered device token
    const allUsers = await User.find({ fcmTokens: { $exists: true, $not: { $size: 0 } } }).select(
      'fcmTokens'
    );
    tokens = allUsers.flatMap((u) => u.fcmTokens);
  }

  const result = await sendPushNotification(tokens, { title, body, data: req.body.data || {} });

  res.json({ success: true, message: 'Notification dispatched', data: result });
});

module.exports = { sendNotification };
