const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_ACCESS_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function signRefreshToken(user) {
  // Use a random opaque token; store its hash. JWT not required for refresh.
  const raw = crypto.randomBytes(48).toString('hex');
  const hash = bcrypt.hashSync(raw, 10);
  return { raw, hash };
}

function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';
  const common = {
    httpOnly: true,
    secure: isProd,
    sameSite: "none",
    path: '/',
  };
  res.cookie('access_token', accessToken, { ...common, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...common, maxAge: 7 * 24 * 3600 * 1000, path: '/api/auth' });
}

function clearAuthCookies(res) {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth' });
}

function generateOtp() {
  // 6-digit numeric; cryptographically secure
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, '0');
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  setAuthCookies,
  clearAuthCookies,
  generateOtp,
};
