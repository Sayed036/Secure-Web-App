const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
  try {
    const token =
      req.cookies?.access_token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.slice(7)
        : null);
    if (!token) return res.status(401).json({ error: 'Unauthenticated' });

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAuth };
