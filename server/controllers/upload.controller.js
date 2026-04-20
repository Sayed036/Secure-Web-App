const { fileTypeFromBuffer } = require('file-type');
const sanitizeHtml = require('sanitize-html');
const Upload = require('../models/Upload');
const cloudinary = require('../config/cloudinary')


const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
// const ALLOWED_EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_BYTES = (Number(process.env.MAX_FILE_SIZE_MB) || 5) * 1024 * 1024;

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });

    const detected = await fileTypeFromBuffer(req.file.buffer);
    if (!detected || !ALLOWED_MIME.has(detected.mime)) {
      return res.status(415).json({ error: 'Only JPG/PNG/WEBP images allowed' });
    }

    const originalName = sanitizeHtml(String(req.file.originalname || '').slice(0, 255), {
      allowedTags: [], allowedAttributes: {},
    });

    const title = sanitizeHtml(String(req.body.title || '').slice(0, 100), {
      allowedTags: [],
      allowedAttributes: {},
    });

    // const caption = sanitizeHtml(String(req.body.caption || '').slice(0, 500), {
    //   allowedTags: [], allowedAttributes: {},
    // });

    // Promise wrap
    const uploadToCloudinary = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'mern_uploads',
            resource_type: 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        stream.end(req.file.buffer);
      });

    const result = await uploadToCloudinary();

    const doc = await Upload.create({
      user: req.user.id,
      originalName,
      title,
      mimeType: detected.mime,
      size: req.file.size,
      // caption,
      url: result.secure_url,
      public_id: result.public_id,
    });

    res.status(201).json({ upload: doc });

  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({ error: 'Bad id' });
    }

    const doc = await Upload.findOneAndDelete({ _id: id, user: req.user.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });

    await cloudinary.uploader.destroy(doc.public_id);

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const items = await Upload.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ uploads: items });
  } catch (e) { next(e); }
};


