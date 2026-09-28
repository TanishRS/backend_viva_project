const Donation = require('../models/Donation');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

// POST /api/donations
const createDonation = asyncHandler(async (req, res) => {
  if (![ROLES.DONOR, ROLES.ADMIN].includes(req.user.role)) {
    throw new ApiError(403, 'Only donors can contribute donations');
  }

  const donation = await Donation.create({ ...req.body, donor: req.user._id });

  const io = req.app.get('io');
  io.to('admin').emit('donation:new', donation);

  res.status(201).json({ success: true, message: 'Donation recorded', data: donation });
});

// GET /api/donations
const getDonations = asyncHandler(async (req, res) => {
  const { type, status, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (status) filter.status = status;

  const donations = await Donation.find(filter)
    .populate('donor', 'name email')
    .populate('relatedNeed', 'title category')
    .populate('reliefCamp', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Donation.countDocuments(filter);

  res.json({ success: true, count: donations.length, total, page: Number(page), data: donations });
});

// GET /api/donations/user/:id
const getDonationsByUser = asyncHandler(async (req, res) => {
  const isOwner = req.params.id === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Not authorized to view another user\'s donations');
  }

  const donations = await Donation.find({ donor: req.params.id })
    .populate('relatedNeed', 'title category')
    .populate('reliefCamp', 'name')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: donations.length, data: donations });
});

module.exports = { createDonation, getDonations, getDonationsByUser };
