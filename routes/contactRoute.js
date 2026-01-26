const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');

const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 25 * 1024 * 1024; // 25MB total (Gmail-safe target)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: MAX_FILES,
    // Allow a single file up to 25MB. The REAL cap is total size below.
    fileSize: MAX_TOTAL_BYTES
  },
  fileFilter: (req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  }
});

// GET /contact
router.get('/', (req, res) => {
  const { sent } = req.query; // ?sent=1 after success
  res.render('contact', {
    title: 'Contact Us',
    errors: null,
    success: sent ? 'Your message has been sent!' : null,
    formData: {}
  });
});

// POST /contact with uploads (wrapped so we can catch multer errors cleanly)
router.post('/', (req, res) => {
  upload.array('photos', MAX_FILES)(req, res, async (err) => {
    const { name, email, vehicle, message } = req.body;
    const errors = [];

    // ----- Handle Multer / upload errors nicely -----
    if (err) {
      // Multer uses codes for standard limit errors
      if (err.code === 'LIMIT_FILE_SIZE') {
        errors.push('One of your images is too large.');
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        errors.push(`Please upload at most ${MAX_FILES} images.`);
      } else {
        errors.push(err.message || 'Upload failed.');
      }

      return res.render('contact', {
        title: 'Contact Us',
        errors,
        success: null,
        formData: { name, email, vehicle, message }
      });
    }

    // ----- Basic validation -----
    if (!name || name.trim().length < 2) errors.push('Name is required and must be at least 2 characters.');
    if (!email || !email.includes('@')) errors.push('A valid email is required.');
    if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');

    const files = Array.isArray(req.files) ? req.files : [];

    // Enforce max file count (extra safety)
    if (files.length > MAX_FILES) errors.push(`Please upload at most ${MAX_FILES} images.`);

    // Enforce TOTAL upload size cap (this is what you asked for)
    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      errors.push('Total image size must be 25MB or less. Please remove a photo or use smaller files.');
    }

    // Sanity check mimetype (multer already does this, but keep it explicit)
    for (const f of files) {
      if (!String(f.mimetype).startsWith('image/')) {
        errors.push(`"${f.originalname}" is not an image.`);
      }
    }

    if (errors.length > 0) {
      return res.render('contact', {
        title: 'Contact Us',
        errors,
        success: null,
        formData: { name, email, vehicle, message }
      });
    }

    // ----- Nodemailer transport -----
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    // Attachments from memory buffers
    const attachments = files.map((f, i) => ({
      filename: f.originalname || `photo-${i + 1}.jpg`,
      content: f.buffer,
      contentType: f.mimetype
    }));

    const mailOptions = {
      from: process.env.EMAIL_USER,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${vehicle || 'No vehicle info provided'}`,
      text:
`Name: ${name}
Email: ${email}
Vehicle: ${vehicle || 'n/a'}

Message:
${message}`,
      attachments
    };

    try {
      await transporter.sendMail(mailOptions);
      return res.redirect('/contact?sent=1');
    } catch (sendErr) {
      console.error('Error sending email:', sendErr);
      return res.render('contact', {
        title: 'Contact Us',
        errors: ['Failed to send message. Please try again later.'],
        success: null,
        formData: { name, email, vehicle, message }
      });
    }
  });
});

module.exports = router;
