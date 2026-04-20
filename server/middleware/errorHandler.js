module.exports = function errorHandler(err, _req, res, _next) {
  // Don't leak internals in production
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message || 'Error';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
};
