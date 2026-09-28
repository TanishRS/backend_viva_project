const express = require('express');
const router = express.Router();
const {
  createDonation,
  getDonations,
  getDonationsByUser,
} = require('../controllers/donationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { donationValidator, mongoIdParam } = require('../utils/validators');

router.post('/', protect, authorize('donor', 'admin'), donationValidator, validate, createDonation);
router.get('/', protect, authorize('admin', 'ngo'), getDonations);
router.get('/user/:id', protect, mongoIdParam(), validate, getDonationsByUser);

module.exports = router;
