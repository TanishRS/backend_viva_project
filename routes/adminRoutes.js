const express = require('express');
const router = express.Router();
const { getAllNeedsForAdmin, verifyNeed } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { mongoIdParam } = require('../utils/validators');

router.use(protect, authorize('admin'));

router.get('/needs', getAllNeedsForAdmin);
router.put('/verify/:id', mongoIdParam(), validate, verifyNeed);

module.exports = router;
