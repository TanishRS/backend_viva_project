const ReliefCamp = require('../models/ReliefCamp');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/relief-camps
const getReliefCamps = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const camps = await ReliefCamp.find(filter)
    .populate('managedBy', 'name email role')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await ReliefCamp.countDocuments(filter);

  res.json({ success: true, count: camps.length, total, page: Number(page), data: camps });
});

// GET /api/relief-camps/:id
const getReliefCampById = asyncHandler(async (req, res) => {
  const camp = await ReliefCamp.findById(req.params.id).populate('managedBy', 'name email role');
  if (!camp) throw new ApiError(404, 'Relief camp not found');
  res.json({ success: true, data: camp });
});

// POST /api/relief-camps (admin)
const createReliefCamp = asyncHandler(async (req, res) => {
  const camp = await ReliefCamp.create({ ...req.body, managedBy: req.user._id });

  const io = req.app.get('io');
  io.to('map').emit('camp:new', camp);
  io.to('map').emit('map:update', { type: 'camp:new', camp });

  res.status(201).json({ success: true, message: 'Relief camp created', data: camp });
});

// PUT /api/relief-camps/:id
const updateReliefCamp = asyncHandler(async (req, res) => {
  const camp = await ReliefCamp.findById(req.params.id);
  if (!camp) throw new ApiError(404, 'Relief camp not found');

  const allowedFields = ['name', 'location', 'capacity', 'currentOccupancy', 'resources', 'status', 'contactPhone'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) camp[field] = req.body[field];
  });

  await camp.save();

  const io = req.app.get('io');
  io.to('map').emit('camp:updated', camp);
  io.to('map').emit('map:update', { type: 'camp:updated', camp });

  res.json({ success: true, message: 'Relief camp updated', data: camp });
});

module.exports = { getReliefCamps, getReliefCampById, createReliefCamp, updateReliefCamp };
