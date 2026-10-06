const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.VOLUNTEER,
    },
    phone: { type: String, trim: true },
    // Populated when the user signs in / links a Firebase account
    firebaseUid: { type: String, default: null, index: true, sparse: true },
    fcmTokens: [{ type: String }], // device tokens for push notifications
    isVerified: { type: Boolean, default: false }, // admin-verified NGOs/orgs
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Mongoose 9: async hooks don't get a `next` callback - just return/await.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
