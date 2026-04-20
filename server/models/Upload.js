const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 255 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    // caption: { type: String, maxlength: 500 },
    url: { type: String, required: true },
    public_id: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Upload', uploadSchema);
