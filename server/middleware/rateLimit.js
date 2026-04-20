const rateLimit = require('express-rate-limit');

// 300 requests / 15 min per IP — global safety net
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

// Login: 5 attempts / 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts. Try again later.' },
});

// Register: 5 / hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Too many accounts created from this IP.' },
});

// OTP send: 3 / 10 min per IP
const otpSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { error: 'Too many OTP requests. Wait a bit.' },
});

// OTP verify: 10 / 15 min per IP
const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many OTP verification attempts.' },
});

// Upload: 20 / hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { error: 'Upload limit reached.' },
});

module.exports = {
  globalLimiter,
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  uploadLimiter,
};
