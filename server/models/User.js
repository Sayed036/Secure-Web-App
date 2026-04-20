const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    isVerified: { type: Boolean, default: false },

    // Email OTP (registration / re-verify)
    otpHash: { type: String, select: false },
    otpExpiresAt: { type: Date, select: false },
    otpAttempts: { type: Number, default: 0, select: false },

    // Account lockout (brute force)
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },

    // Refresh token rotation (store hash only)
    refreshTokenHash: { type: String, select: false },

    lastLoginAt: Date,
    lastLoginIp: String,
  },
  { timestamps: true }
);

userSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > new Date();
};

module.exports = mongoose.model('User', userSchema);
