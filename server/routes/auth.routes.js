const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { emailRule, passwordRule, otpRule } = require('../utils/validators');
const {
  loginLimiter,
  registerLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
} = require('../middleware/rateLimit');
const { requireAuth } = require('../middleware/auth');

router.post('/register', registerLimiter, [emailRule, passwordRule], ctrl.register);
router.post('/resend-otp', otpSendLimiter, [emailRule], ctrl.resendOtp);
router.post('/verify-otp', otpVerifyLimiter, [emailRule, otpRule], ctrl.verifyOtp);

// On successful login we also set a `uid` cookie (httpOnly) for refresh lookup.
router.post('/login', loginLimiter, [emailRule, passwordRule], async (req, res, next) => {
  // Wrap to also set uid cookie after login succeeds
  const origJson = res.json.bind(res);
  res.json = (body) => {
    if (body?.ok && body?.user?.id) {
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('uid', body.user.id, {
        httpOnly: true, secure: true, sameSite: 'none', path: '/',
        maxAge: 7 * 24 * 3600 * 1000,
      });
    }
    return origJson(body);
  };
  return ctrl.login(req, res, next);
});

router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);
router.get('/me', requireAuth, ctrl.me);

module.exports = router;
