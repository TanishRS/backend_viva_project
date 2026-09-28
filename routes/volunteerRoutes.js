const express = require('express');
const router = express.Router();
const {
  getVolunteers,
  getVolunteerById,
  createVolunteer,
  updateVolunteer,
} = require('../controllers/volunteerController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { volunteerValidator, mongoIdParam } = require('../utils/validators');

router.get('/', protect, getVolunteers);
router.get('/:id', protect, mongoIdParam(), validate, getVolunteerById);
router.post('/', protect, volunteerValidator, validate, createVolunteer);
router.put('/:id', protect, mongoIdParam(), volunteerValidator, validate, updateVolunteer);

module.exports = router;
