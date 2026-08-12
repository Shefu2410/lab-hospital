const { Resend } = require('resend');
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

let resend = null;

function getClient() {
  if (resend) return resend;
  if (!process.env.RESEND_API_KEY) return null;
  resend = new Resend(process.env.RESEND_API_KEY.trim());
  return resend;
}

(function logConfigStatusOnBoot() {
  if (!process.env.RESEND_API_KEY) {
    const msg = '[mailer] RESEND_API_KEY not set - email notifications are DISABLED.';
    console.log(msg);
    logToFile(msg);
    return;
  }
  if (!process.env.EMAIL_FROM) {
    const msg = '[mailer] RESEND_API_KEY is set, but EMAIL_FROM is missing - sends will fail.';
    console.log(msg);
    logToFile(msg);
  }
  if (!process.env.OWNER_EMAIL) {
    const msg = '[mailer] RESEND_API_KEY is set, but OWNER_EMAIL is missing - "new lab" emails will be skipped.';
    console.log(msg);
    logToFile(msg);
  } else {
    const msg = `[mailer] Configured. Sending as ${process.env.EMAIL_FROM || '(EMAIL_FROM not set)'}, owner notifications go to ${process.env.OWNER_EMAIL}.`;
    console.log(msg);
    logToFile(msg);
  }
})();

async function sendMail({ to, subject, text }) {
  const client = getClient();
  if (!client) {
    const msg = `[mailer] Skipped (RESEND_API_KEY not set in .env). Would have sent to ${to}: ${subject}`;
    console.log(msg);
    logToFile(msg);
    return;
  }
  if (!process.env.EMAIL_FROM) {
    const msg = `[mailer] Skipped (EMAIL_FROM not set in .env). Would have sent to ${to}: ${subject}`;
    console.log(msg);
    logToFile(msg);
    return;
  }
  try {
    const { data, error } = await client.emails.send({
      from: `RKH LIMS <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      text,
    });
    if (error) {
      const msg = `[mailer] FAILED to send "${subject}" to ${to}: ${error.message}`;
      console.error(msg);
      logToFile(msg);
      return;
    }
    const msg = `[mailer] SENT "${subject}" to ${to} | id: ${data.id}`;
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