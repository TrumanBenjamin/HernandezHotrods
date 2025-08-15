const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer')

router.get('/', (req, res) => {
  res.render('contact/form', { title: 'Contact Us', errors: null, success: null, formData: {} });
});

router.post('/', async (req, res) => {
  const { name, email, subject, message } = req.body;
  const errors = [];

  // Server-side validation
  if (!name || name.trim().length < 2) errors.push('Name is required and must be at least 2 characters.');
  if (!email || !email.includes('@')) errors.push('A valid email is required.');
  if (!subject || subject.trim().length < 3) errors.push('Subject is required and must be at least 3 characters.');
  if (!message || message.trim().length < 10) errors.push('Message must be at least 10 characters.');

  if (errors.length > 0) {
    return res.render('contact/form', {
      title: 'Contact Us',
      errors,
      success: null,
      formData: { name, email, subject, message }
    });
  }
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
  })

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Contact Form: ${subject}`,
    text: `
        Name: ${name}
        Email: ${email}
        Subject: ${subject}
        Message: ${message}
        `
  }

  try {
    await transporter.sendMail(mailOptions)
    res.render('contact/form', {
        title: 'Contact Us',
        errors: null,
        success: 'Your message has been sent!',
        formData: {}
    })
  } catch (err) {
    console.error('Error sending email:', err)
    res.render('contact/form', {
        title: 'Contact Us',
        errors: ['Failed to send message. Please try again later.'], 
        success: null,
        formData: { name, email, subject, message}
    })
  }
});

module.exports = router;
