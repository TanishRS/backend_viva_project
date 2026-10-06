const Need = require('../models/Need');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES, NEED_STATUS } = require('../config/constants');

// GET /api/needs
const getNeeds = asyncHandler(async (req, res) => {
  const { category, status, urgency, zoneName, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (urgency) filter.urgency = urgency;
  if (zoneName) filter['location.zoneName'] = { $regex: zoneName, $options: 'i' };

  const needs = await Need.find(filter)
    .populate('postedBy', 'name email role')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Need.countDocuments(filter);

  res.json({ success: true, count: needs.length, total, page: Number(page), data: needs });
});

// GET /api/needs/:id
const getNeedById = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id).populate('postedBy', 'name email role');
  if (!need) throw new ApiError(404, 'Need not found');
  res.json({ success: true, data: need });
});

// POST /api/needs (NGO only)
const createNeed = asyncHandler(async (req, res) => {
  if (![ROLES.NGO, ROLES.ADMIN].includes(req.user.role)) {
    throw new ApiError(403, 'Only NGOs can post relief needs');
  }

  const need = await Need.create({ ...req.body, postedBy: req.user._id });

  const io = req.app.get('io');
  io.to('map').to('admin').emit('need:new', need);

  res.status(201).json({ success: true, message: 'Need posted', data: need });
});

// PUT /api/needs/:id
const updateNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id);
  if (!need) throw new ApiError(404, 'Need not found');

  const isOwner = need.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Not authorized to update this need');
  }

  // Only admins can verify/reject a need - otherwise an NGO could approve its own post.
  const adminOnlyStatuses = [NEED_STATUS.VERIFIED, NEED_STATUS.REJECTED];
  if (req.user.role !== ROLES.ADMIN && adminOnlyStatuses.includes(req.body.status)) {
    throw new ApiError(403, `Only an admin can set a need to '${req.body.status}'`);
  }

  const allowedFields = ['title', 'description', 'category', 'items', 'urgency', 'status', 'location'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) need[field] = req.body[field];
  });

  // Admin verifying a need
  if (req.body.status === NEED_STATUS.VERIFIED && req.user.role === ROLES.ADMIN) {
    need.verifiedBy = req.user._id;
    need.verifiedAt = new Date();
  }

  await need.save();

  const io = req.app.get('io');
  io.to('map').to('admin').emit('need:updated', need);

  res.json({ success: true, message: 'Need updated', data: need });
});

// DELETE /api/needs/:id
const deleteNeed = asyncHandler(async (req, res) => {
  const need = await Need.findById(req.params.id);
  if (!need) throw new ApiError(404, 'Need not found');

  const isOwner = need.postedBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Not authorized to delete this need');
  }

  await need.deleteOne();

  const io = req.app.get('io');
  io.to('map').to('admin').emit('need:deleted', { id: req.params.id });

  res.json({ success: true, message: 'Need deleted' });
});

module.exports = { getNeeds, getNeedById, createNeed, updateNeed, deleteNeed };
