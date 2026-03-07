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
    const mt = String(file.mimetype || '').toLowerCase();
    const name = String(file.originalname || '').toLowerCase();

    const isHeicExt = name.endsWith('.heic') || name.endsWith('.heif');
    const isImageMime = mt.startsWith('image/');
    const isHeicMime = mt === 'image/heic' || mt === 'image/heif';

    if (isImageMime || isHeicMime || isHeicExt) return cb(null, true);

    // IMPORTANT: don't hard-error here if you want other form errors to show too (see #3)
    cb(null, false);
    req._fileErrors = req._fileErrors || [];
    req._fileErrors.push(`"${file.originalname}" is not an accepted image type.`);
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
    const { name, email, vehicle, message, company, formStart } = req.body;
    
    if (company && company.trim() !== "") {
      console.warn("Spam bot caught:", {
        ip: req.ip,
        email: req.body.email
      });
      return res.redirect('/contact?sent=1'); 
    }

    const elapsed = Date.now() - Number(formStart || 0);

    if (!formStart || elapsed < 3000) {  // less than 3 seconds
      console.warn("Spam bot caught by time trap:", {
        ip: req.ip,
        email
      });

  return res.redirect('/contact?sent=1');
}
    
    const errors = [];

    // collect multer errors (DON'T return yet)
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') errors.push('One of your images is too large.');
      else if (err.code === 'LIMIT_FILE_COUNT') errors.push(`Please upload at most ${MAX_FILES} images.`);
      else errors.push(err.message || 'Upload failed.');
    }

    // collect fileFilter “soft” errors
    if (req._fileErrors?.length) errors.push(...req._fileErrors);

    // normal validation
    if (!name || name.trim().length < 2) errors.push('Name is required and must be at least 2 characters.');
    if (!email || !email.includes('@')) errors.push('A valid email is required.');
    if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');

    const files = Array.isArray(req.files) ? req.files : [];

    const totalBytes = files.reduce((sum, f) => sum + (f.size || 0), 0);
    if (totalBytes > MAX_TOTAL_BYTES) errors.push('Total image size must be 25MB or less. Please remove a photo or use smaller files.');

    if (errors.length) {
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
      from: `"Hernandez Hot Rods" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: `Contact Form: ${vehicle || 'No vehicle info provided'}`,
      text:
        `Name: ${name}
        Email: ${email}
        Vehicle: ${vehicle || 'n/a'}
        Message: ${message}`, attachments};

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
