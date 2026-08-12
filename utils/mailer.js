const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');



const LOG_FILE = path.join(__dirname, '..', 'mail-log.txt');

function logToFile(line) {
  const stamped = `[${new Date().toISOString()}] ${line}\n`;
  try {
    fs.appendFileSync(LOG_FILE, stamped);
  } catch (e) {
    // if even file logging fails, at least still show it in the console
    console.error('[mailer] Could not write to mail-log.txt:', e.message);
  }
}

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;

  // Explicit host/port instead of `service: 'gmail'` - more reliable, and
  // avoids some quirks newer nodemailer versions have with the shorthand.
  transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for port 465, false for 587
    family: 4,// force IPv4 - Render's network can't route Gmail's IPv6 address
    auth: {
      user: process.env.EMAIL_USER.trim(),
      pass: process.env.EMAIL_APP_PASSWORD.trim().replace(/\s+/g, ''), // app passwords are sometimes copied with spaces
    },
  });
  return transporter;
}

(function logConfigStatusOnBoot() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    const msg = '[mailer] EMAIL_USER / EMAIL_APP_PASSWORD not set - email notifications are DISABLED.';
    console.log(msg);
    logToFile(msg);
    return;
  }
  if (!process.env.OWNER_EMAIL) {
    const msg = '[mailer] EMAIL_USER/EMAIL_APP_PASSWORD are set, but OWNER_EMAIL is missing - "new lab" emails will be skipped.';
    console.log(msg);
    logToFile(msg);
  } else {
    const msg = `[mailer] Configured. Sending as ${process.env.EMAIL_USER}, owner notifications go to ${process.env.OWNER_EMAIL}.`;
    console.log(msg);
    logToFile(msg);
  }

  const t = getTransporter();
  if (t) {
    t.verify((err) => {
      if (err) {
        const msg = '[mailer] SMTP verification FAILED: ' + err.message;
        console.error(msg);
        logToFile(msg);
      } else {
        const msg = '[mailer] SMTP connection verified OK.';
        console.log(msg);
        logToFile(msg);
      }
    });
  }
})();

async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    const msg = `[mailer] Skipped (EMAIL_USER/EMAIL_APP_PASSWORD not set in .env). Would have sent to ${to}: ${subject}`;
    console.log(msg);
    logToFile(msg);
    return;
  }
  try {
    const info = await t.sendMail({ from: `"RKH LIMS" <${process.env.EMAIL_USER}>`, to, subject, text });
    const msg = `[mailer] SENT "${subject}" to ${to} | messageId: ${info.messageId} | response: ${info.response}`;
    console.log(msg);
    logToFile(msg);
  } catch (err) {
    const msg = `[mailer] FAILED to send "${subject}" to ${to}: ${err.message}`;
    console.error(msg);
    logToFile(msg);
  }
}

function notifyOwnerNewLabPending(lab) {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    const msg = '[mailer] OWNER_EMAIL not set - skipping new-lab-pending notification.';
    console.log(msg);
    logToFile(msg);
    return Promise.resolve();
  }
  return sendMail({
    to: ownerEmail,
    subject: `New lab pending approval: ${lab.name}`,
    text:
      `A new lab has registered and is waiting for approval.\n\n` +
      `Lab name: ${lab.name}\n` +
      `Lab code: ${lab.code}\n` +
      `Lab email: ${lab.email}\n` +
      `Phone: ${lab.phone || '-'}\n\n` +
      `Approve or reject it from the Owner page: /owner.html`,
  });
}

function notifyLabStatusChanged(lab) {
  const statusText = {
    approved: 'has been approved. You can now log in with your lab code.',
    rejected: `was rejected.${lab.rejectionReason ? ' Reason: ' + lab.rejectionReason : ''}`,
    suspended: 'has been suspended. Please contact support.',
    pending: 'is pending approval.',
  }[lab.status] || `status changed to ${lab.status}.`;

  return sendMail({
    to: lab.email,
    subject: `RKH LIMS: your lab "${lab.name}" ${lab.status}`,
    text: `Your lab "${lab.name}" (code ${lab.code}) ${statusText}`,
  });
}

module.exports = { sendMail, notifyOwnerNewLabPending, notifyLabStatusChanged };