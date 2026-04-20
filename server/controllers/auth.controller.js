const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { sendOtpEmail } = require('../utils/mailer');
const {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  generateOtp,
} = require('../utils/tokens');

const OTP_TTL_MS = (Number(process.env.OTP_TTL_MIN) || 10) * 60 * 1000;
const OTP_MAX_ATTEMPTS = Number(process.env.OTP_MAX_ATTEMPTS) || 3;
const LOCK_AFTER = 8;
const LOCK_MS = 15 * 60 * 1000;

function badReq(res, errors) {
  return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
}

// Generic message to avoid user-enumeration
const ENUM_SAFE = { ok: true, message: 'If the request is valid, an OTP has been sent.' };

exports.register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    const { email, password } = req.body;

    const existing = await User.findOne({ email }).select('+isVerified');
    if (existing && existing.isVerified) {
      // Don't reveal — return generic
      return res.json(ENUM_SAFE);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const otp = generateOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);

    if (existing && !existing.isVerified) {
      existing.passwordHash = passwordHash;
      existing.otpHash = otpHash;
      existing.otpExpiresAt = otpExpiresAt;
      existing.otpAttempts = 0;
      await existing.save();
    } else {
      await User.create({
        email,
        passwordHash,
        isVerified: false,
        otpHash,
        otpExpiresAt,
        otpAttempts: 0,
      });
    }

    try { await sendOtpEmail(email, otp); } catch (e) { console.error('mail err', e.message); }
    return res.json(ENUM_SAFE);
  } catch (e) { next(e); }
};

exports.resendOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    const { email } = req.body;
    const user = await User.findOne({ email }).select('+isVerified');
    // Always respond same to avoid enumeration
    if (!user || user.isVerified) return res.json(ENUM_SAFE);

    const otp = generateOtp();
    user.otpHash = await bcrypt.hash(otp, 10);
    user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
    user.otpAttempts = 0;
    await user.save();

    try { await sendOtpEmail(email, otp); } catch (e) { console.error('mail err', e.message); }
    return res.json(ENUM_SAFE);
  } catch (e) { next(e); }
};

exports.verifyOtp = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select(
      '+otpHash +otpExpiresAt +otpAttempts +isVerified'
    );
    if (!user) return res.status(400).json({ error: 'Invalid code' });
    if (user.isVerified) return res.json({ ok: true, message: 'Already verified' });

    if (!user.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Code expired. Request a new one.' });
    }
    if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
      return res.status(429).json({ error: 'Too many attempts. Request a new code.' });
    }

    const ok = await bcrypt.compare(otp, user.otpHash);
    if (!ok) {
      user.otpAttempts += 1;
      await user.save();
      return res.status(400).json({ error: 'Invalid code' });
    }

    user.isVerified = true;
    user.otpHash = undefined;
    user.otpExpiresAt = undefined;
    user.otpAttempts = 0;
    await user.save();

    return res.json({ ok: true, message: 'Email verified. You can log in now.' });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return badReq(res, errors);

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select(
      '+passwordHash +isVerified +failedLoginAttempts +lockUntil'
    );
    // Constant-time-ish: always do a bcrypt compare even if user missing
    const dummyHash = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8.O5V8yV3u9iYFq1qZ7nW9b1vLQz9C';
    const hashToCompare = user?.passwordHash || dummyHash;
    const passOk = await bcrypt.compare(password, hashToCompare);

    if (!user || !passOk) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= LOCK_AFTER) {
          user.lockUntil = new Date(Date.now() + LOCK_MS);
          user.failedLoginAttempts = 0;
        }
        await user.save();
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked. Try later.' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ error: 'Email not verified', code: 'NOT_VERIFIED' });
    }

    // Success: reset counters, rotate refresh token
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIp = req.ip;

    const access = signAccessToken(user);
    const { raw: refresh, hash: refreshHash } = signRefreshToken(user);
    user.refreshTokenHash = refreshHash;
    await user.save();

    setAuthCookies(res, access, refresh);
    return res.json({ ok: true, user: { id: user._id, email: user.email } });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const refresh = req.cookies?.refresh_token;
    if (!refresh) return res.status(401).json({ error: 'No refresh token' });

    // Find user whose stored hash matches — we need to scan candidates by cookie
    // Simpler: store userId alongside (we'll embed via separate cookie? No — keep stateless).
    // For simplicity we look up by refreshTokenHash bcrypt compare across active sessions.
    // Better approach: store userId in a signed cookie too.
    const uid = req.cookies?.uid;
    if (!uid) return res.status(401).json({ error: 'No session' });

    const user = await User.findById(uid).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) return res.status(401).json({ error: 'Invalid session' });

    const ok = await bcrypt.compare(refresh, user.refreshTokenHash);
    if (!ok) return res.status(401).json({ error: 'Invalid refresh token' });

    // Rotate
    const access = signAccessToken(user);
    const { raw: newRefresh, hash: newHash } = signRefreshToken(user);
    user.refreshTokenHash = newHash;
    await user.save();
    setAuthCookies(res, access, newRefresh);
    return res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const uid = req.cookies?.uid;
    if (uid) {
      await User.findByIdAndUpdate(uid, { $unset: { refreshTokenHash: '' } });
    }
    clearAuthCookies(res);
    res.clearCookie('uid', { path: '/' });
    return res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.me = async (req, res) => {
  return res.json({ user: req.user });
};
