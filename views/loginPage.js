const { renderPage } = require('./shell');

function loginPage() {
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
      <div class="big">Every sample, tracked from tube to report.</div>
      <div class="meta">Registration, result entry, AI-assisted flagging and approval, in one workspace backed by MongoDB.</div>
    </div>
    <div class="auth-readout">
      <div><span id="statPanels">5</span>test panels</div>
      <div><span>24&times;7</span>result entry</div>
      <div><span>AI</span>abnormal flagging</div>
    </div>
  </div>

  <div class="auth-form-wrap">
    <form class="auth-form" id="loginForm">
      <h1>Sign in</h1>
      <p class="lead">Enter your lab credentials to continue.</p>
      <div class="form-error" id="loginError"></div>
      <div class="field">
        <label for="labCode">Lab Code *</label>
        <input type="text" id="labCode" placeholder="e.g. RKHXX23" style="text-transform:uppercase;" required />
      </div>
      <div class="field">
        <label for="username">Username</label>
        <input type="text" id="username" autocomplete="username" placeholder="e.g. admin" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" autocomplete="current-password" placeholder="••••••••" required />
      </div>
      <button type="submit" class="btn btn-primary btn-block" id="loginBtn">Login</button>
      <p class="lead" style="margin-top:14px;">New lab? <a href="/lab-signup.html" style="color:var(--teal);font-weight:600;">Register here</a></p>
    </form>
  </div>
</div>`;

  const pageScript = `
if (getToken()) window.location.href = '/dashboard.html';

const form = document.getElementById('loginForm');
const errorBox = document.getElementById('loginError');
const btn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in...';

  try {
    const labCode = document.getElementById('labCode').value.trim();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const data = await api('/auth/login', { method: 'POST', body: JSON.stringify({ labCode, username, password }) });
    setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errorBox.textContent = err.message || 'Login failed. Check your credentials.';
    errorBox.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Login';
  }
});`;

  return renderPage({ title: 'Login', body, pageScript });
}

module.exports = loginPage;