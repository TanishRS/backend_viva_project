const express = require('express');
const router = express.Router();
const {
  getReliefCamps,
  getReliefCampById,
  createReliefCamp,
  updateReliefCamp,
} = require('../controllers/reliefCampController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { reliefCampValidator, mongoIdParam } = require('../utils/validators');

router.get('/', getReliefCamps); // public
router.get('/:id', mongoIdParam(), validate, getReliefCampById);
router.post('/', protect, authorize('admin'), reliefCampValidator, validate, createReliefCamp);
router.put('/:id', protect, authorize('admin'), mongoIdParam(), validate, updateReliefCamp);

module.exports = router;
