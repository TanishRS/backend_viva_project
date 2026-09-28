const express = require('express');
const router = express.Router();
const { getAffectedAreas, getReliefCampMap } = require('../controllers/mapController');

router.get('/affected-areas', getAffectedAreas);
router.get('/relief-camps', getReliefCampMap);

module.exports = router;
