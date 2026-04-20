const router = require('express').Router();
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimit');
const ctrl = require('../controllers/upload.controller');

const MAX_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1, fields: 5 },
  fileFilter: (_req, file, cb) => {
    // Pre-filter on declared mimetype; real check via magic bytes later
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});

router.use(requireAuth);

router.post('/', uploadLimiter, upload.single('file'), ctrl.upload);
router.get('/', ctrl.list);

router.delete('/:id', ctrl.remove);

module.exports = router;
