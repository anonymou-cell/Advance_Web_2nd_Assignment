const nodemailer = require('nodemailer');

let transporter = null;

function initTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('⚠️ No EMAIL_USER/EMAIL_PASS in .env — emails disabled');
    return;
  }

  const port = Number(process.env.EMAIL_PORT) || 587;

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
    pool: true,
    maxConnections: 5,
    maxMessages: 10,
    tls: {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    }
  });

  console.log(`✅ SMTP ready: ${process.env.EMAIL_HOST}:${port} (pool: 5 connections)`);
}

const FROM = process.env.EMAIL_FROM || `Service Day <${process.env.EMAIL_USER}>`;

/**
 * Send email — FIRE AND FORGET (non-blocking)
 * Returns immediately, email sends in background.
 * API response is never delayed by email.
 */
function sendEmail(to, subject, text, html) {
  if (!transporter || !to) return;

  // Don't await — fire and forget
  transporter.sendMail({
    from: FROM,
    to,
    subject,
    text,
    html: html || text
  }).then(info => {
    console.log(`📧 ✉️  Sent → ${to}: ${subject}`);
  }).catch(err => {
    console.error(`📧 ❌ Failed → ${to}:`, err.message);
  });
}

/**
 * Send to multiple recipients — FIRE AND FORGET
 */
function sendBulkEmails(recipients, subject, text, html) {
  if (!recipients || recipients.length === 0) return;
  recipients.forEach(email => sendEmail(email, subject, text, html));
}

module.exports = { initTransporter, sendEmail, sendBulkEmails };
