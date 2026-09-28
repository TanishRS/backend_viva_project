const Need = require('../models/Need');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { NEED_STATUS } = require('../config/constants');

// GET /api/admin/needs  (all needs, including pending/unverified, for admin review)
const getAllNeedsForAdmin = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const needs = await Need.find(filter)
    .populate('postedBy', 'name email role isVerified')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Need.countDocuments(filter);

  res.json({ success: true, count: needs.length, total, page: Number(page), data: needs });
});

// PUT /api/admin/verify/:id  (verify an NGO's posted need / approve supply request)
const verifyNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id);
  if (!need) throw new ApiError(404, 'Need not found');

  need.status = NEED_STATUS.VERIFIED;
  need.verifiedBy = req.user._id;
  need.verifiedAt = new Date();
  await need.save();

  const io = req.app.get('io');
  io.to('map').to('admin').emit('need:verified', need);

  res.json({ success: true, message: 'Need verified', data: need });
});

module.exports = { getAllNeedsForAdmin, verifyNeed };
