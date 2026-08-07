const { renderPage } = require('./shell');

function signupPage() {
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
      <div class="big">Bring your lab onto the platform.</div>
      <div class="meta">Register your lab and its first admin account below. A platform admin reviews every new lab before it can sign in - you'll get a lab code once your registration is approved.</div>
    </div>
    <div class="auth-readout">
      <div><span>1</span>form to fill</div>
      <div><span>1</span>admin account created</div>
      <div><span>&#10003;</span>reviewed before go-live</div>
    </div>
  </div>

  <div class="auth-form-wrap">
    <form class="auth-form" id="signupForm" style="max-width:420px;">
      <h1>Register your lab</h1>
      <p class="lead">Already registered? <a href="/index.html" style="color:var(--teal-dark);font-weight:600;">Sign in instead</a>.</p>
      <div class="form-error" id="signupError"></div>
      <div class="form-success" id="signupSuccess"></div>

      <div class="section-title" style="margin-top:0;">Lab details</div>
      <div class="field"><label for="labName">Lab Name *</label><input id="labName" required /></div>
      <div class="field"><label for="labEmail">Lab Email *</label><input id="labEmail" type="email" required /></div>

      <div class="section-title">Admin account</div>
      <div class="field"><label for="adminName">Your Name *</label><input id="adminName" required /></div>
      <div class="field"><label for="adminPassword">Password *</label><input id="adminPassword" type="password" required minlength="6" /></div>

      <button type="submit" class="btn btn-primary btn-block" id="signupBtn" style="margin-top:6px;">Register Lab</button>
    </form>
  </div>
</div>`;

  const extraStyle = `
.form-success{display:none;background:#e3f6ec;color:var(--accent);padding:12px 14px;border-radius:8px;font-size:13px;margin-bottom:14px;line-height:1.6;}
.form-success.show{display:block;}
`;

  const pageScript = `
if (getToken()) window.location.href = '/dashboard.html';

const form = document.getElementById('signupForm');
const errorBox = document.getElementById('signupError');
const successBox = document.getElementById('signupSuccess');
const btn = document.getElementById('signupBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  successBox.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Submitting...';

  try {
    const payload = {
      labName: document.getElementById('labName').value.trim(),
      email: document.getElementById('labEmail').value.trim(),
      adminName: document.getElementById('adminName').value.trim(),
      password: document.getElementById('adminPassword').value,
    };
    const data = await api('/labs/register', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    form.style.display = 'none';
    successBox.innerHTML = data.message + '<br><br>You will be able to sign in once a platform admin approves your lab. <a href="/index.html" style="color:var(--teal-dark);font-weight:600;">Go to sign in</a>';
    successBox.classList.add('show');
  } catch (err) {
    errorBox.textContent = err.message || 'Registration failed. Please try again.';
    errorBox.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Register Lab';
  }
});`;

  return renderPage({ title: 'Register Lab', body, pageScript, extraStyle });
}

module.exports = signupPage;