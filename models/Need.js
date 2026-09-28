const mongoose = require('mongoose');
const { NEED_STATUS, NEED_CATEGORY, URGENCY } = require('../config/constants');

const needSchema = new mongoose.Schema(
  {
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // NGO
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    category: { type: String, enum: Object.values(NEED_CATEGORY), required: true },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, default: 'units' },
      },
    ],
    urgency: { type: String, enum: Object.values(URGENCY), default: URGENCY.MEDIUM },
    status: { type: String, enum: Object.values(NEED_STATUS), default: NEED_STATUS.PENDING },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      zoneName: { type: String, trim: true }, // e.g. "Flood Zone A"
      address: { type: String, trim: true },
    },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

needSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Need', needSchema);
