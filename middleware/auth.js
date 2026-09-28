const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * Verifies the JWT sent in the Authorization: Bearer <token> header
 * and attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new ApiError(401, 'Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    throw new ApiError(401, 'Not authorized, user not found or deactivated');
  }

  req.user = user;
  next();
});

/**
 * Role-based authorization. Usage: authorize('admin'), authorize('ngo', 'admin')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authorized');
  }
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, `Role '${req.user.role}' is not permitted to perform this action`);
  }
  next();
};

module.exports = { protect, authorize };
