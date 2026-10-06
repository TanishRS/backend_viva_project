const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../config/constants');
const { verifyFirebaseIdToken } = require('../utils/firebaseService');

// Stores a device token (for Firebase push) on the user, once, if one was sent.
async function saveFcmToken(user, fcmToken) {
  if (!fcmToken) return;
  await User.updateOne({ _id: user._id }, { $addToSet: { fcmTokens: fcmToken } });
}

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, firebaseIdToken, fcmToken, adminKey } = req.body;

  // Admin accounts can't be self-registered by anyone: they need the secret
  // ADMIN_SIGNUP_KEY from the server's environment (or use `npm run seed`).
  if (role === ROLES.ADMIN) {
    if (!process.env.ADMIN_SIGNUP_KEY || adminKey !== process.env.ADMIN_SIGNUP_KEY) {
      throw new ApiError(403, 'Admin registration requires a valid adminKey');
    }
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  let firebaseUid = null;
  if (firebaseIdToken) {
    const decoded = await verifyFirebaseIdToken(firebaseIdToken);
    firebaseUid = decoded.uid;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || ROLES.VOLUNTEER,
    phone,
    firebaseUid,
  });

  await saveFcmToken(user, fcmToken);

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user: user.toSafeObject(), token },
  });
});

// POST /api/auth/login
// Two ways in: email + password, or a Firebase ID token (Firebase Auth).
// Either way the response is our own JWT, used for all other endpoints.
const login = asyncHandler(async (req, res) => {
  const { email, password, firebaseIdToken, fcmToken } = req.body;

  let user;
  if (firebaseIdToken) {
    const decoded = await verifyFirebaseIdToken(firebaseIdToken);
    user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      throw new ApiError(401, 'No account is linked to this Firebase user');
    }
  } else {
    user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
  }

  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  await saveFcmToken(user, fcmToken);

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeObject(), token },
  });
});

module.exports = { register, login };
