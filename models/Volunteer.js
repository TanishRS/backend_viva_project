const mongoose = require('mongoose');

const volunteerSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    skills: [{ type: String, trim: true }], // e.g. ["Medical aid", "Driving", "Cooking"]
    availability: {
      type: String,
      enum: ['immediate', 'today', 'tomorrow', 'this_week', 'unavailable'],
      default: 'immediate',
    },
    availabilityNote: { type: String, trim: true }, // free-text e.g. "available tomorrow"
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
      address: { type: String, trim: true },
    },
    assignedCamp: { type: mongoose.Schema.Types.ObjectId, ref: 'ReliefCamp', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

volunteerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Volunteer', volunteerSchema);
