const Need = require('../models/Need');
const ReliefCamp = require('../models/ReliefCamp');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/map/affected-areas
// Returns active/unresolved needs as map points (affected areas)
const getAffectedAreas = asyncHandler(async (req, res) => {
  const needs = await Need.find({ status: { $ne: 'fulfilled' } })
    .select('title category urgency status location createdAt')
    .populate('postedBy', 'name');

  const geoJson = {
    type: 'FeatureCollection',
    features: needs.map((n) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: n.location.coordinates },
      properties: {
        id: n._id,
        title: n.title,
        category: n.category,
        urgency: n.urgency,
        status: n.status,
        zoneName: n.location.zoneName,
        postedBy: n.postedBy?.name,
      },
    })),
  };

  res.json({ success: true, count: needs.length, data: geoJson });
});

// GET /api/map/relief-camps
// Returns active relief camps as map points
const getReliefCampMap = asyncHandler(async (req, res) => {
  const camps = await ReliefCamp.find({ status: { $ne: 'closed' } }).select(
    'name status capacity currentOccupancy location'
  );

  const geoJson = {
    type: 'FeatureCollection',
    features: camps.map((c) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: c.location.coordinates },
      properties: {
        id: c._id,
        name: c.name,
        status: c.status,
        capacity: c.capacity,
        currentOccupancy: c.currentOccupancy,
        address: c.location.address,
      },
    })),
  };

  res.json({ success: true, count: camps.length, data: geoJson });
});

module.exports = { getAffectedAreas, getReliefCampMap };
