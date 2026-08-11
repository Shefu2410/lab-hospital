const nodemailer = require('nodemailer');

// Sends the two emails the approval workflow needs:
//  - to the OWNER when a new lab registers and needs approval
//  - to the LAB when the owner approves / rejects / suspends them
//
// Configure in .env:
//   EMAIL_USER            - the Gmail address to send from
//   EMAIL_APP_PASSWORD    - a Gmail "App Password" (NOT your normal Gmail password -
//                            create one at https://myaccount.google.com/apppasswords,
//                            requires 2-Step Verification to be on)
//   OWNER_EMAIL            - where "new lab pending approval" emails go
//
// If these are not set, mail sending is silently skipped (logged to console)
// so the rest of the app keeps working without email configured.

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) return null;

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
  return transporter;
}

// Runs once, as soon as this file is first required (i.e. at server startup),
// so you see immediately in the server console whether email is configured -
// no need to run a separate test script.
(function logConfigStatusOnBoot() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.log('[mailer] EMAIL_USER / EMAIL_APP_PASSWORD not set - email notifications are DISABLED.');
    return;
  }
  if (!process.env.OWNER_EMAIL) {
    console.log('[mailer] EMAIL_USER/EMAIL_APP_PASSWORD are set, but OWNER_EMAIL is missing - "new lab" emails will be skipped.');
  } else {
    console.log(`[mailer] Configured. Sending as ${process.env.EMAIL_USER}, owner notifications go to ${process.env.OWNER_EMAIL}.`);
  }

  // Verifies the SMTP login actually works (catches a bad/stale app password
  // immediately at boot, instead of only finding out when a real email is sent).
  const t = getTransporter();
  if (t) {
    t.verify((err) => {
      if (err) {
        console.error('[mailer] SMTP verification FAILED - check EMAIL_USER/EMAIL_APP_PASSWORD:', err.message);
      } else {
        console.log('[mailer] SMTP connection verified OK.');
      }
    });
  }
})();

async function sendMail({ to, subject, text }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[mailer] Skipped (EMAIL_USER/EMAIL_APP_PASSWORD not set in .env). Would have sent to ${to}: ${subject}`);
    return;
  }
  try {
    const info = await t.sendMail({ from: `"RKH LIMS" <${process.env.EMAIL_USER}>`, to, subject, text });
    console.log(`[mailer] Sent "${subject}" to ${to} (messageId: ${info.messageId})`);
  } catch (err) {
    // Never let a mail failure break an API request - just log it.
    console.error('[mailer] Failed to send email:', err.message);
  }
}

function notifyOwnerNewLabPending(lab) {
  const ownerEmail = process.env.OWNER_EMAIL;
  if (!ownerEmail) {
    console.log('[mailer] OWNER_EMAIL not set - skipping new-lab-pending notification.');
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