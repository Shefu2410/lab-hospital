const { renderPage } = require('./shell');

// ---------------------------------------------------------------------------
// Owner Approval Page (private — not linked from anywhere in the site nav)
// Lets the platform owner enter their OWNER_SECRET_KEY once, then view every
// registered lab and Approve/Revoke it. Talks to /api/labs/owner/* routes
// using the x-owner-key header (see middleware/ownerAuth.js + labRoutes.js).
// ---------------------------------------------------------------------------

function ownerPage() {
  const body = `
<div class="page-container">
  <div class="card" style="max-width:480px;margin:0 auto 20px;">
    <h1>Owner Access</h1>
    <p class="subtitle">Enter your owner key to view and approve labs.</p>
    <div class="field">
      <label for="ownerKeyInput">Owner Secret Key</label>
      <input type="password" id="ownerKeyInput" placeholder="OWNER_SECRET_KEY" />
    </div>
    <div id="keyError" class="error-text" style="display:none;"></div>
    <button id="loadLabsBtn" class="btn btn-primary btn-block">Load Labs</button>
  </div>

  <div class="card" id="labsCard" style="display:none;max-width:900px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <h2 style="margin:0;">Labs</h2>
      <div>
        <button id="refreshBtn" class="btn btn-secondary">Refresh</button>
        <button id="forgetKeyBtn" class="btn btn-secondary">Forget Key</button>
      </div>
    </div>
    <table style="width:100%;margin-top:16px;border-collapse:collapse;" id="labsTable">
      <thead>
        <tr style="text-align:left;border-bottom:2px solid #e2e8e8;">
          <th style="padding:8px;">Code</th>
          <th style="padding:8px;">Name</th>
          <th style="padding:8px;">Email</th>
          <th style="padding:8px;">Status</th>
          <th style="padding:8px;">Action</th>
        </tr>
      </thead>
      <tbody id="labsTbody"></tbody>
    </table>
  </div>
</div>`;

  const pageScript = `
const keyInput = document.getElementById('ownerKeyInput');
const keyError = document.getElementById('keyError');
const loadBtn = document.getElementById('loadLabsBtn');
const refreshBtn = document.getElementById('refreshBtn');
const forgetBtn = document.getElementById('forgetKeyBtn');
const labsCard = document.getElementById('labsCard');
const tbody = document.getElementById('labsTbody');

function getOwnerKey() { return sessionStorage.getItem('owner_key') || ''; }
function setOwnerKey(k) { sessionStorage.setItem('owner_key', k); }
function clearOwnerKey() { sessionStorage.removeItem('owner_key'); }

async function ownerFetch(path, options = {}) {
  const key = getOwnerKey();
  const headers = Object.assign({ 'Content-Type': 'application/json', 'x-owner-key': key }, options.headers || {});
  const res = await fetch('/api' + path, Object.assign({}, options, { headers }));
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new Error((data && data.message) || ('Request failed (' + res.status + ')'));
  return data;
}

function renderLabs(labs) {
  tbody.innerHTML = labs.map((lab) => {
    const statusHtml = lab.active
      ? '<span style="color:#0a8;font-weight:600;">Active</span>'
      : '<span style="color:#c60;font-weight:600;">Pending</span>';
    const actionBtn = lab.active
      ? '<button class="btn btn-secondary revokeBtn" data-code="' + lab.code + '">Revoke</button>'
      : '<button class="btn btn-primary approveBtn" data-code="' + lab.code + '">Approve</button>';
    return '<tr style="border-bottom:1px solid #eee;">' +
      '<td style="padding:8px;font-weight:600;">' + lab.code + '</td>' +
      '<td style="padding:8px;">' + lab.name + '</td>' +
      '<td style="padding:8px;">' + lab.email + '</td>' +
      '<td style="padding:8px;">' + statusHtml + '</td>' +
      '<td style="padding:8px;">' + actionBtn + '</td>' +
      '</tr>';
  }).join('');

  tbody.querySelectorAll('.approveBtn').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.code, 'approve'));
  });
  tbody.querySelectorAll('.revokeBtn').forEach((btn) => {
    btn.addEventListener('click', () => handleAction(btn.dataset.code, 'revoke'));
  });
}

async function handleAction(code, action) {
  try {
    await ownerFetch('/labs/owner/' + code + '/' + action, { method: 'PUT' });
    await loadLabs();
  } catch (err) {
    alert(err.message);
  }
}

async function loadLabs() {
  try {
    const labs = await ownerFetch('/labs/owner/all');
    labsCard.style.display = 'block';
    renderLabs(labs);
  } catch (err) {
    keyError.textContent = err.message || 'Could not load labs. Check your key.';
    keyError.style.display = 'block';
    labsCard.style.display = 'none';
  }
}

loadBtn.addEventListener('click', async () => {
  keyError.style.display = 'none';
  const key = keyInput.value.trim();
  if (!key) { keyError.textContent = 'Enter your owner key.'; keyError.style.display = 'block'; return; }
  setOwnerKey(key);
  await loadLabs();
});

refreshBtn.addEventListener('click', loadLabs);

forgetBtn.addEventListener('click', () => {
  clearOwnerKey();
  labsCard.style.display = 'none';
  keyInput.value = '';
});

// auto-load if key already saved this session
if (getOwnerKey()) {
  keyInput.value = getOwnerKey();
  loadLabs();
}`;

  return renderPage({ title: 'Owner — Approve Labs', body, pageScript });
}

module.exports = ownerPage;