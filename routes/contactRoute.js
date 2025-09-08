const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

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

// POST /contact
router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  const errors = [];

  // Server-side validation
  if (!name || name.trim().length < 2) errors.push('Name is required and must be at least 2 characters.');
  if (!email || !email.includes('@')) errors.push('A valid email is required.');
  if (!subject || subject.trim().length < 3) errors.push('Subject is required and must be at least 3 characters.');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');

  // If validation fails, render (no redirect) so the user sees errors and form values
  if (errors.length > 0) {
    return res.render('contact', {
      title: 'Contact Us',
      errors,
      success: null,
      formData: { name, email, subject, message }
    });
  }

  // Nodemailer transport (Gmail)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // IMPORTANT: Gmail prefers "from" to be your authenticated address.
  // Use user's email in replyTo so you can hit Reply and reach them.
  const mailOptions = {
    from: process.env.EMAIL_USER,
    replyTo: email,
    to: process.env.EMAIL_USER,
    subject: `Contact Form: ${subject}`,
    text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\nMessage:\n${message}`
  };

  try {
    await transporter.sendMail(mailOptions);
    // ✅ PRG: redirect to GET with a success flag so refresh won't resend
    return res.redirect('/contact?sent=1');
  } catch (err) {
    console.error('Error sending email:', err);
    // Show a friendly error and keep their form data
    return res.render('contact', {
      title: 'Contact Us',
      errors: ['Failed to send message. Please try again later.'],
      success: null,
      formData: { name, email, subject, message }
    });
  }
});

module.exports = router;
