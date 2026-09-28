const User = require('../models/User');
const Volunteer = require('../models/Volunteer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const generateToken = require('../utils/generateToken');
const { ROLES } = require('../config/constants');
const { verifyFirebaseIdToken } = require('../utils/firebaseService');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, firebaseIdToken } = req.body;

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

  // Auto-create a Volunteer profile if role is volunteer
  if (user.role === ROLES.VOLUNTEER) {
    await Volunteer.create({ user: user._id, skills: [], availability: 'immediate' });
  }

  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { user: user.toSafeObject(), token },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const token = generateToken(user);

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: { user: user.toSafeObject(), token },
  });
});

module.exports = { register, login };
