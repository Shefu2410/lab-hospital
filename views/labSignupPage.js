    const { renderPage } = require('./shell');

function labSignupPage() {
  const body = `
<div class="auth-screen">
  <div class="auth-visual">
    <div class="auth-brand">
      <div class="mark">RKH</div>
      <div>
        <div class="name">RKH LIMS</div>
        <div class="sub">HOSPITAL &amp; AI LAB SUITE</div>
      </div>
    </div>
    <div class="auth-quote">
      <div class="big">Register your lab in a couple of minutes.</div>
      <div class="meta">An owner reviews and approves every new lab before it can sign in - you'll get an email once it's approved.</div>
    </div>
  </div>

  <div class="auth-form-wrap">
    <form class="auth-form" id="signupForm">
      <h1>Register your lab</h1>
      <p class="lead">Fill in your lab's details and create the first admin login.</p>
      <div class="form-error" id="signupError"></div>
      <div class="form-success" id="signupSuccess" style="display:none;"></div>

      <div class="field">
        <label for="labName">Lab Name *</label>
        <input type="text" id="labName" placeholder="e.g. Rajkot Hospital" required />
      </div>
      <div class="field">
        <label for="labEmail">Lab Email *</label>
        <input type="email" id="labEmail" placeholder="lab@example.com" required />
      </div>
      <div class="field">
        <label for="labPhone">Lab Phone</label>
        <input type="text" id="labPhone" placeholder="Optional" />
      </div>
      <div class="field">
        <label for="labAddress">Lab Address</label>
        <input type="text" id="labAddress" placeholder="Optional" />
      </div>
      <hr style="border:none;border-top:1px solid var(--border);margin:14px 0;" />
      <div class="field">
        <label for="adminName">Your Name *</label>
        <input type="text" id="adminName" required />
      </div>
      <div class="field">
        <label for="adminUsername">Admin Username *</label>
        <input type="text" id="adminUsername" placeholder="e.g. admin" required />
      </div>
      <div class="field">
        <label for="adminPassword">Admin Password *</label>
        <input type="password" id="adminPassword" required minlength="6" />
      </div>

      <button type="submit" class="btn btn-primary btn-block" id="signupBtn">Register Lab</button>
      <p class="lead" style="margin-top:14px;">Already registered? <a href="/index.html" style="color:var(--teal);font-weight:600;">Sign in</a></p>
    </form>
  </div>
</div>`;

  const pageScript = `
const form = document.getElementById('signupForm');
const errorBox = document.getElementById('signupError');
const successBox = document.getElementById('signupSuccess');
const btn = document.getElementById('signupBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  successBox.style.display = 'none';
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Registering...';

  const payload = {
    labName: document.getElementById('labName').value.trim(),
    labEmail: document.getElementById('labEmail').value.trim(),
    labPhone: document.getElementById('labPhone').value.trim(),
    labAddress: document.getElementById('labAddress').value.trim(),
    adminName: document.getElementById('adminName').value.trim(),
    adminUsername: document.getElementById('adminUsername').value.trim(),
    adminPassword: document.getElementById('adminPassword').value,
  };

  try {
    const res = await fetch('/api/labs/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed.');

    form.style.display = 'none';
    successBox.style.display = 'block';
    successBox.innerHTML =
      '<b>Registered!</b> Your lab code is <b>' + data.lab.code + '</b>. ' +
      'It is pending approval - you will get an email once an owner approves it, then you can log in with this code.';
  } catch (err) {
    errorBox.textContent = err.message || 'Registration failed.';
    errorBox.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Register Lab';
  }
});`;

  return renderPage({ title: 'Register Your Lab', body, pageScript });
}

module.exports = labSignupPage;