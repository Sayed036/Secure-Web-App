require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const path = require('path');

const connectDB = require('./config/db');
const { globalLimiter } = require('./middleware/rateLimit');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const noteRoutes = require('./routes/note.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();

// Trust proxy (needed if behind nginx/ALB for correct rate-limit IPs)
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
}));

// CORS — strict origin whitelist + cookies
const allowedOrigins = (process.env.CLIENT_ORIGIN || '').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // allow same-origin / curl
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS blocked'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

// Body parsers with size limit (DoS protection)
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: true, limit: '20kb' }));
app.use(cookieParser());

// NoSQL injection sanitizer
app.use(mongoSanitize());
// XSS payload sanitizer (basic)
app.use(xss());
// HTTP parameter pollution
app.use(hpp());

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('combined'));

// Global rate limit
app.use(globalLimiter);

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/uploads', uploadRoutes);

// Serve uploaded files (private bucket pattern: served via signed route, not statically)
// We do NOT use express.static on uploads — files are streamed via authenticated controller.

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// Centralized error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`✅ Server on http://localhost:${PORT}`));
});
