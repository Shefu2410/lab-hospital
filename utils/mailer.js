const { Resend } = require('resend');

// ======================================================
// LAZY RESEND CLIENT
//
// We do NOT construct `new Resend(...)` at the top level.
// If RESEND_API_KEY is missing, doing so throws immediately
// at require-time and crashes the entire server before it
// can even bind to a port. Instead we create the client on
// first use, only if the key exists.
// ======================================================

let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}


// ======================================================
// SEND "NEW LAB REGISTERED" EMAIL
//
// Fire-and-forget style: caller should NOT let a failed
// email block or fail the registration request itself.
//
// Uses Resend's HTTPS API instead of raw SMTP, since
// Render's outbound SMTP connections were timing out.
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

  const client = getResendClient();

  if (!client) {

    console.error(
      'sendNewLabRegisteredEmail: RESEND_API_KEY not set, skipping email.'
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

    const { data, error } = await client.emails.send({
      // While testing on a free Resend account (no verified domain yet),
      // this MUST stay exactly as below — Resend only allows sending
      // from onboarding@resend.dev until you verify your own domain.
      from: 'Lab System <onboarding@resend.dev>',
      to: ownerEmail,
      subject: `New Lab Registration: ${lab.labName}`,
      html
    });

    if (error) {
      console.error(
        'Failed to send new-lab-registered email:',
        error
      );
    }

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