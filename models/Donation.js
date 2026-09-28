const mongoose = require('mongoose');
const { DONATION_TYPE, DONATION_STATUS } = require('../config/constants');

const donationSchema = new mongoose.Schema(
  {
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: Object.values(DONATION_TYPE), required: true },
    amount: { type: Number, min: 0, default: 0 }, // used when type === 'funds' (INR)
    items: [
      {
        name: { type: String },
        quantity: { type: Number, min: 0 },
        unit: { type: String, default: 'units' },
      },
    ],
    relatedNeed: { type: mongoose.Schema.Types.ObjectId, ref: 'Need', default: null },
    reliefCamp: { type: mongoose.Schema.Types.ObjectId, ref: 'ReliefCamp', default: null },
    status: { type: String, enum: Object.values(DONATION_STATUS), default: DONATION_STATUS.PENDING },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
