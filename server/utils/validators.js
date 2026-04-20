const { body } = require('express-validator');
const validator = require('validator');

// Strong password: 8+, upper, lower, number, special
const STRONG_PW = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/;

const emailRule = body('email')
  .isString().trim().toLowerCase()
  .isEmail().withMessage('Invalid email')
  .isLength({ max: 254 })
  .normalizeEmail();

const passwordRule = body('password')
  .isString().isLength({ min: 8, max: 128 })
  .matches(STRONG_PW)
  .withMessage('Password must be 8+ chars with upper, lower, number & special');

const otpRule = body('otp')
  .isString().trim()
  .isLength({ min: 6, max: 6 })
  .matches(/^\d{6}$/).withMessage('OTP must be 6 digits');

module.exports = { emailRule, passwordRule, otpRule, STRONG_PW, validator };
