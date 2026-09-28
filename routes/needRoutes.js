const express = require('express');
const router = express.Router();
const {
  getNeeds,
  getNeedById,
  createNeed,
  updateNeed,
  deleteNeed,
} = require('../controllers/needController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { needValidator, mongoIdParam } = require('../utils/validators');

router.get('/', getNeeds); // public: anyone can browse needs
router.get('/:id', mongoIdParam(), validate, getNeedById);
router.post('/', protect, authorize('ngo', 'admin'), needValidator, validate, createNeed);
router.put('/:id', protect, mongoIdParam(), validate, updateNeed);
router.delete('/:id', protect, mongoIdParam(), validate, deleteNeed);

module.exports = router;
