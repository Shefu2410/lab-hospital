const nodemailer = require('nodemailer');


// How to get a Gmail App Password:
//   1. Turn on 2-Step Verification on the Google account:
//      https://myaccount.google.com/security
//   2. Go to https://myaccount.google.com/apppasswords
//   3. Create an app password for "Mail" and copy the
//      16-character code (no spaces) into GMAIL_APP_PASS.
// ======================================================
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,          // false for 587 (STARTTLS), true for 465
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASS
    },
    family: 4,               // force IPv4, avoids ENETUNREACH on IPv6-only routes

    // Fail fast instead of hanging on a flaky network path.
    connectionTimeout: 10000,   // time to establish the TCP connection
    greetingTimeout: 10000,     // time to receive the SMTP greeting after connecting
    socketTimeout: 10000        // time before an idle connection is killed
});


// ======================================================
// SEND "NEW LAB REGISTERED" EMAIL
//
// Fire-and-forget style: caller should NOT let a failed
// email block or fail the registration request itself.
// ======================================================

async function sendNewLabRegisteredEmail(lab) {

  const ownerEmail =
    process.env.OWNER_EMAIL ||
    process.env.GMAIL_USER;

  if (!ownerEmail) {

    console.error(
      'sendNewLabRegisteredEmail: OWNER_EMAIL / GMAIL_USER not set, skipping email.'
    );

    return;

  }


  const html = `
    <div style="font-family:Arial,sans-serif;font-size:14px;color:#222;">
      <h2 style="margin-bottom:4px;">New Laboratory Registration</h2>
      <p style="color:#666;margin-top:0;">A new lab has registered and is waiting for your approval.</p>

      <table style="border-collapse:collapse;margin-top:12px;">
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;">Lab Name</td>
          <td style="padding:6px 0;">${escapeHtml(lab.labName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;">Admin Name</td>
          <td style="padding:6px 0;">${escapeHtml(lab.adminName)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;">Email</td>
          <td style="padding:6px 0;">${escapeHtml(lab.email)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;">Username</td>
          <td style="padding:6px 0;">${escapeHtml(lab.username)}</td>
        </tr>
        <tr>
          <td style="padding:6px 12px 6px 0;font-weight:bold;">Status</td>
          <td style="padding:6px 0;">Pending Approval</td>
        </tr>
      </table>

      <p style="margin-top:20px;">
        Log in to the Owner Panel to approve or reject this registration.
      </p>
    </div>
  `;


  try {

    await transporter.sendMail({
      from: `"Lab System" <${process.env.GMAIL_USER}>`,
      to: ownerEmail,
      subject: `New Lab Registration: ${lab.labName}`,
      html
    });

  } catch (err) {

    // Never throw - a broken mailer must not break registration.
    console.error(
      'Failed to send new-lab-registered email:',
      err.message
    );

  }

}


// ======================================================
// ESCAPE HTML (avoid breaking the email markup)
// ======================================================

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


module.exports = {
  sendNewLabRegisteredEmail
};