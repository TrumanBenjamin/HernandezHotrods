// middleware/upload.js
const multer = require('multer');
const os = require('os');
const path = require('path');

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(os.tmpdir())),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
  }),
  limits: {
    files: 200,                // plenty of headroom
    fileSize: 20 * 1024 * 1024 // 20MB per image (adjust)
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const okExt = ['.jpg','.jpeg','.png','.webp','.heic','.heif'].includes(ext);

    const okMime =
      (file.mimetype && file.mimetype.startsWith('image/')) ||
      file.mimetype === 'application/octet-stream';

    if (okExt || okMime) return cb(null, true);

    cb(new Error(`Unsupported upload type: ${file.mimetype} (${ext})`));
  }
});

module.exports = upload;
