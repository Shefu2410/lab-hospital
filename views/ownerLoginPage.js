const { renderPage } = require('./shell');

function ownerLoginPage() {
  const body = `
<div class="auth-screen">
  <div class="auth-visual">
    <div class="auth-brand">
      <div class="mark">RKH</div>
      <div>
        <div class="name">RKH LIMS</div>
        <div class="sub">OWNER CONSOLE</div>
      </div>
    </div>
    <div class="auth-quote">
      <div class="big">Approve labs. See who's waiting. Keep the platform tidy.</div>
      <div class="meta">This is a separate, platform-level login - not a lab account.</div>
    </div>
  </div>

  <div class="auth-form-wrap">
    <form class="auth-form" id="ownerLoginForm">
      <h1>Owner sign in</h1>
      <p class="lead">Enter the owner credentials to continue.</p>
      <div class="form-error" id="loginError"></div>
      <div class="field">
        <label for="username">Username</label>
        <input type="text" id="username" autocomplete="username" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" autocomplete="current-password" required />
      </div>
      <button type="submit" class="btn btn-primary btn-block" id="loginBtn">Sign in</button>
    </form>
  </div>
</div>`;

  const pageScript = `
if (localStorage.getItem('owner_token')) window.location.href = '/owner.html';

const form = document.getElementById('ownerLoginForm');
const errorBox = document.getElementById('loginError');
const btn = document.getElementById('loginBtn');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.classList.remove('show');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Signing in...';

  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const res = await fetch('/api/owner/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed.');

    localStorage.setItem('owner_token', data.token);
    window.location.href = '/owner.html';
  } catch (err) {
    errorBox.textContent = err.message || 'Login failed.';
    errorBox.classList.add('show');
    btn.disabled = false;
    btn.textContent = 'Sign in';
  }
});`;

  return renderPage({ title: 'Owner Sign In', body, pageScript });
}

module.exports = ownerLoginPage;
