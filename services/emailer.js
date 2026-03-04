const nodemailer = require("nodemailer");

function makeTransport() {
  const user = process.env.ALERT_EMAIL_FROM;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) throw new Error("Missing ALERT_EMAIL_FROM or GMAIL_APP_PASSWORD");

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
  });
}

async function sendAlert({ subject, text }) {
  const to = process.env.ALERT_EMAIL_TO || process.env.ALERT_EMAIL_FROM;
  const from = process.env.ALERT_EMAIL_FROM;

  const transporter = makeTransport();
  await transporter.sendMail({ from, to, subject, text });
}

module.exports = { sendAlert };
