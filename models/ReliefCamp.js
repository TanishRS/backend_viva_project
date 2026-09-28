const mongoose = require('mongoose');
const { CAMP_STATUS } = require('../config/constants');

const reliefCampSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin/NGO
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, trim: true },
    },
    capacity: { type: Number, default: 0 },
    currentOccupancy: { type: Number, default: 0 },
    resources: [
      {
        name: String,
        quantity: Number,
        unit: { type: String, default: 'units' },
      },
    ],
    status: { type: String, enum: Object.values(CAMP_STATUS), default: CAMP_STATUS.ACTIVE },
    contactPhone: { type: String, trim: true },
  },
  { timestamps: true }
);

reliefCampSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ReliefCamp', reliefCampSchema);
