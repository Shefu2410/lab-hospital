const { renderPage } = require('./shell');

function signupPage() {
  const body = `
<div class="auth-screen">
  <div class="auth-visual">
    <div class="auth-brand">
      <div class="mark">GC</div>
      <div>
        <div class="name">RKH Cross LIMS</div>
        <div class="sub">HOSPITAL &amp; AI LAB SUITE</div>
      </div>
    </div>
    <div class="auth-quote">
      <div class="big">Bring your lab online in one step.</div>
      <div class="meta">Your patients, tests and reports stay completely separate from every other lab on this platform — no setup, no shared data.</div>
    </div>
    <div class="auth-readout">
      <div><span>1</span>form to fill</div>
      <div><span>0</span>data shared with other labs</div>
      <div><span>&infin;</span>patients &amp; reports</div>
    </div>
  </div>

  <div class="auth-form-wrap">
    <form class="auth-form" id="signupForm" style="max-width:420px;">
      <h1>Register your lab</h1>
      <p class="lead">Create your lab's own private workspace.</p>
      <div class="form-error" id="signupError"></div>

      <div class="section-title">Lab Details</div>
      <div class="field"><label>Lab Name *</label><input id="labName" required /></div>
      <div class="field-row">
        <div class="field"><label>Lab Email *</label><input id="labEmail" type="email" required /></div>
        <div class="field"><label>Lab Phone</label><input id="labPhone" type="tel" /></div>
      </div>
      <div class="field"><label>Lab Address</label><input id="labAddress" /></div>

      <div class="section-title">Your Admin Login</div>
      <div class="field"><label>Your Name *</label><input id="adminName" required /></div>
      <div class="field"><label>Choose a Username *</label><input id="adminUsername" required /></div>
      <div class="field"><label>Choose a Password *</label><input id="adminPassword" type="password" required /></div>

      <button type="submit" class="btn btn-primary btn-block" id="signupBtn">Create My Lab</button>
      <p style="text-align:center;margin-top:16px;font-size:13px;">
        Already registered? <a href="/index.html" style="color:var(--teal-dark);font-weight:600;">Log in</a>
      </p>
    </form>

    <div class="card" id="successCard" style="display:none;max-width:420px;text-align:center;">
      <h3 style="margin-top:0;">Registration submitted ✅</h3>
      <p class="hint">Save this lab code — you'll need it once your account is approved. Your registration is now pending review; you won't be able to log in until then.</p>
      <div style="font-size:28px;font-weight:800;letter-spacing:.08em;color:var(--teal-dark);background:#f4fbfa;border:1px dashed var(--teal);border-radius:8px;padding:14px;margin:14px 0;" id="labCodeDisplay"></div>
      <button class="btn btn-primary btn-block" id="goToLoginBtn">Go to Login</button>
    </div>
  </div>
</div>`;

  const pageScript = `
if (getToken()) window.location.href = '/dashboard.html';

const form = document.getElementById('signupForm');
const errorBox = document.getElementById('signupError');
const btn = document.getElementById('signupBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Creating your lab...';

  try {
    const payload = {
      labName: document.getElementById('labName').value.trim(),
      labEmail: document.getElementById('labEmail').value.trim(),
      labPhone: document.getElementById('labPhone').value.trim(),
      labAddress: document.getElementById('labAddress').value.trim(),
      adminName: document.getElementById('adminName').value.trim(),
      adminUsername: document.getElementById('adminUsername').value.trim(),
      adminPassword: document.getElementById('adminPassword').value,
    };

    const data = await api('/labs/register', { method: 'POST', body: JSON.stringify(payload) });

    form.style.display = 'none';
    document.getElementById('labCodeDisplay').textContent = data.lab.code;
    document.getElementById('successCard').style.display = 'block';
  } catch (err) {
    errorBox.textContent = err.message || 'Could not register your lab. Please try again.';
    errorBox.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Create My Lab';
  }
});

document.getElementById('goToLoginBtn').addEventListener('click', () => {
  window.location.href = '/index.html';
});`;

  return renderPage({ title: 'Register Your Lab', body, pageScript });
}

module.exports = signupPage;