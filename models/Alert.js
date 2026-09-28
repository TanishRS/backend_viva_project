const mongoose = require('mongoose');
const { ALERT_SEVERITY } = require('../config/constants');

const alertSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    severity: { type: String, enum: Object.values(ALERT_SEVERITY), default: ALERT_SEVERITY.INFO },
    isEmergency: { type: Boolean, default: false },
    affectedArea: {
      zoneName: { type: String, trim: true },
      coordinates: { type: [Number], default: undefined }, // [lng, lat], optional
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // admin
    sentViaPush: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Alert', alertSchema);
