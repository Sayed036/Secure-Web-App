const sanitizeHtml = require('sanitize-html');
const { validationResult } = require('express-validator');
const Note = require('../models/Note');

const sanitizeOpts = { allowedTags: [], allowedAttributes: {} };

exports.create = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });

    const title = sanitizeHtml(String(req.body.title || ''), sanitizeOpts).trim();
    const description = sanitizeHtml(String(req.body.description || ''), sanitizeOpts).trim();
    if (!title || !description) return res.status(400).json({ error: 'Title and description required' });

    const note = await Note.create({ user: req.user.id, title, description });
    res.status(201).json({ note });
  } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ notes });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[a-f\d]{24}$/i.test(id)) return res.status(400).json({ error: 'Bad id' });
    const r = await Note.findOneAndDelete({ _id: id, user: req.user.id });
    if (!r) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};
