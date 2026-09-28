const Volunteer = require('../models/Volunteer');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');

// GET /api/volunteers
const getVolunteers = asyncHandler(async (req, res) => {
  const { skill, availability, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (skill) filter.skills = { $regex: skill, $options: 'i' };
  if (availability) filter.availability = availability;

  const volunteers = await Volunteer.find(filter)
    .populate('user', 'name email phone role')
    .populate('assignedCamp', 'name')
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .sort({ createdAt: -1 });

  const total = await Volunteer.countDocuments(filter);

  res.json({ success: true, count: volunteers.length, total, page: Number(page), data: volunteers });
});

// GET /api/volunteers/:id
const getVolunteerById = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id)
    .populate('user', 'name email phone role')
    .populate('assignedCamp', 'name location');
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');
  res.json({ success: true, data: volunteer });
});

// POST /api/volunteers  (register skills/availability for the logged-in user)
const createVolunteer = asyncHandler(async (req, res) => {
  if (req.user.role !== ROLES.VOLUNTEER && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Only volunteers can register a volunteer profile');
  }

  const existing = await Volunteer.findOne({ user: req.user._id });
  if (existing) {
    throw new ApiError(409, 'Volunteer profile already exists for this user. Use PUT to update it.');
  }

  const { skills, availability, availabilityNote, location } = req.body;

  const volunteer = await Volunteer.create({
    user: req.user._id,
    skills,
    availability,
    availabilityNote,
    location,
  });

  const io = req.app.get('io');
  io.to('admin').emit('volunteer:new', volunteer);

  res.status(201).json({ success: true, message: 'Volunteer registered', data: volunteer });
});

// PUT /api/volunteers/:id
const updateVolunteer = asyncHandler(async (req, res) => {
  const volunteer = await Volunteer.findById(req.params.id);
  if (!volunteer) throw new ApiError(404, 'Volunteer not found');

  const isOwner = volunteer.user.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    throw new ApiError(403, 'Not authorized to update this volunteer profile');
  }

  const allowedFields = ['skills', 'availability', 'availabilityNote', 'location', 'assignedCamp', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) volunteer[field] = req.body[field];
  });

  await volunteer.save();

  res.json({ success: true, message: 'Volunteer updated', data: volunteer });
});

module.exports = { getVolunteers, getVolunteerById, createVolunteer, updateVolunteer };
