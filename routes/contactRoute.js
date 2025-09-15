const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5 * 1024 * 1024
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
    formData: {} // clear the form after success
  });
});

// POST /contact with uploads
router.post('/', upload.array('photos', 5), async (req, res) => {
  const { name, email, vehicle, message } = req.body;
  const errors = [];

  // Basic validation
  if (!name || name.trim().length < 2) errors.push('Name is required and must be at least 2 characters.');
  if (!email || !email.includes('@')) errors.push('A valid email is required.');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');

  // Multer errors arrive via req.fileValidationError or thrown exceptions;
  // but we’ll also do a quick sanity check here.
  const files = Array.isArray(req.files) ? req.files : [];
  if (files.length > 5) errors.push('Please upload at most 5 images.');
  // (mimetype + size already checked by multer, but we can be explicit:)
  for (const f of files) {
    if (!String(f.mimetype).startsWith('image/')) {
      errors.push(`"${f.originalname}" is not an image.`);
    }
    if (f.size > 5 * 1024 * 1024) {
      errors.push(`"${f.originalname}" is larger than 5MB.`);
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

  // Nodemailer transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
  });

  // Build attachments from memory buffers
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
  } catch (err) {
    console.error('Error sending email:', err);
    return res.render('contact', {
      title: 'Contact Us',
      errors: ['Failed to send message. Please try again later.'],
      success: null,
      formData: { name, email, vehicle, message }
    });
  }
});

module.exports = router;
