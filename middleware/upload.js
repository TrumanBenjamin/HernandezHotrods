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
    if (!file.mimetype.startsWith('image/')) return cb(null, false);
    cb(null, true);
  }
});

module.exports = upload;
