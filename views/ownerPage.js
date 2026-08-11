const { renderPage } = require('./shell');

function ownerPage() {
  const extraStyle = `
.owner-shell{max-width:1180px;margin:0 auto;padding:26px 22px 60px;}
.owner-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
.owner-top h1{margin:0 0 4px;}
.pw-cell{font-family:'Courier New',monospace;font-size:13px;white-space:nowrap;}
.pw-btn{padding:4px 9px;font-size:12px;}
.status-pending{background:#fdf3dd;color:#9a6b0c;}
.status-approved{background:#e2f6ec;color:#1f9d6b;}
.status-rejected{background:#fbe7e7;color:#c94040;}
.status-suspended{background:#eee;color:#666;}
.status-pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;text-transform:capitalize;}
.action-btns{display:flex;gap:6px;flex-wrap:wrap;}
`;

  const body = `
<div class="owner-shell">
  <div class="owner-top">
    <div>
      <h1>Owner Console</h1>
      <div class="crumb">Every lab on the platform &middot; approve new signups, manage status, view initial credentials</div>
    </div>
    <a href="#" onclick="ownerLogout();return false;" class="btn btn-ghost">Log out</a>
  </div>

  <div class="stat-grid" id="statGrid">
    <div class="stat-card"><div class="label">Total Labs</div><div class="value" id="statTotal">—</div></div>
    <div class="stat-card"><div class="label">Pending Approval</div><div class="value" id="statPending">—</div></div>
    <div class="stat-card"><div class="label">Approved</div><div class="value" id="statApproved">—</div></div>
    <div class="stat-card"><div class="label">Rejected</div><div class="value" id="statRejected">—</div></div>
    <div class="stat-card"><div class="label">Suspended</div><div class="value" id="statSuspended">—</div></div>
  </div>

  <div class="card">
    <div class="card-head">
      <h3>Labs</h3>
      <span class="hint">Click "Show" to reveal a lab's initial admin password (only visible here)</span>
    </div>
    <div class="toolbar">
      <select class="select-input" id="statusFilter" style="max-width:220px;">
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="approved">Approved</option>
        <option value="rejected">Rejected</option>
        <option value="suspended">Suspended</option>
      </select>
    </div>
    <table>
      <thead>
        <tr><th>Lab</th><th>Code</th><th>Email</th><th>Password</th><th>Status</th><th>Registered</th><th>Actions</th></tr>
      </thead>
      <tbody id="labBody"><tr><td colspan="7" class="empty-state">Loading…</td></tr></tbody>
    </table>
  </div>
</div>`;

  const pageScript = `
// ---- owner-only session (separate from lab-user session) ----
function ownerToken() { return localStorage.getItem('owner_token'); }
function ownerLogout() { localStorage.removeItem('owner_token'); window.location.href = '/owner-login.html'; }
if (!ownerToken()) window.location.href = '/owner-login.html';

async function ownerApi(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    { Authorization: 'Bearer ' + ownerToken() },
    options.headers || {}
  );
  const res = await fetch('/api' + path, Object.assign({}, options, { headers }));
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) { ownerLogout(); }
    throw new Error((data && data.message) || ('Request failed (' + res.status + ')'));
  }
  return data;
}

const labBody = document.getElementById('labBody');
const statusFilter = document.getElementById('statusFilter');
let labsCache = [];

async function loadStats() {
  try {
    const stats = await ownerApi('/admin/stats');
    document.getElementById('statTotal').textContent = stats.totalLabs;
    document.getElementById('statPending').textContent = stats.pendingLabs;
    document.getElementById('statApproved').textContent = stats.approvedLabs;
    document.getElementById('statRejected').textContent = stats.rejectedLabs;
    document.getElementById('statSuspended').textContent = stats.suspendedLabs;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function actionButtonsHtml(lab) {
  const btns = [];
  if (lab.status === 'pending') {
    btns.push('<button class="btn btn-primary btn-sm" onclick="approveLab(\\'' + lab._id + '\\')">Approve</button>');
    btns.push('<button class="btn btn-ghost btn-sm" onclick="rejectLab(\\'' + lab._id + '\\')">Reject</button>');
  }
  if (lab.status === 'approved') {
    btns.push('<button class="btn btn-ghost btn-sm" onclick="suspendLab(\\'' + lab._id + '\\')">Suspend</button>');
  }
  if (lab.status === 'suspended' || lab.status === 'rejected') {
    btns.push('<button class="btn btn-primary btn-sm" onclick="approveLab(\\'' + lab._id + '\\')">Approve</button>');
  }
  btns.push('<button class="btn btn-danger btn-sm" onclick="deleteLab(\\'' + lab._id + '\\', \\'' + lab.name.replace(/'/g, "\\\\'") + '\\')">Delete</button>');
  return '<div class="action-btns">' + btns.join('') + '</div>';
}

function labRowHtml(lab) {
  return \`
    <tr>
      <td><b>\${lab.name}</b><div style="font-size:11px;color:var(--ink-soft);">\${lab.phone || ''}</div></td>
      <td class="id-cell">\${lab.code}</td>
      <td>\${lab.email}</td>
      <td class="pw-cell" id="pwCell-\${lab._id}">
        <button class="btn btn-ghost pw-btn" onclick="revealPassword('\${lab._id}')">Show</button>
      </td>
      <td><span class="status-pill status-\${lab.status}">\${lab.status}</span></td>
      <td>\${fmtDateTime(lab.createdAt)}</td>
      <td>\${actionButtonsHtml(lab)}</td>
    </tr>
  \`;
}

function renderLabs(labs) {
  if (!labs.length) {
    labBody.innerHTML = '<tr><td colspan="7"><div class="empty-state">No labs match this filter.</div></td></tr>';
    return;
  }
  labBody.innerHTML = labs.map(labRowHtml).join('');
}

async function loadLabs() {
  try {
    const q = statusFilter.value ? '?status=' + statusFilter.value : '';
    labsCache = await ownerApi('/admin/labs' + q);
    renderLabs(labsCache);
  } catch (err) {
    labBody.innerHTML = '<tr><td colspan="7"><div class="empty-state">' + err.message + '</div></td></tr>';
  }
}

async function revealPassword(id) {
  const cell = document.getElementById('pwCell-' + id);
  try {
    const { password } = await ownerApi('/admin/labs/' + id + '/password');
    cell.innerHTML = '<span>' + password + '</span> <button class="btn btn-ghost pw-btn" onclick="hidePassword(\\'' + id + '\\')">Hide</button>';
  } catch (err) {
    cell.innerHTML = '<span style="color:var(--danger);font-family:inherit;font-size:12px;">' + err.message + '</span>';
  }
}
window.revealPassword = revealPassword;

function hidePassword(id) {
  const cell = document.getElementById('pwCell-' + id);
  cell.innerHTML = '<button class="btn btn-ghost pw-btn" onclick="revealPassword(\\'' + id + '\\')">Show</button>';
}
window.hidePassword = hidePassword;

async function approveLab(id) {
  try {
    await ownerApi('/admin/labs/' + id + '/approve', { method: 'PUT' });
    showToast('Lab approved.', 'success');
    loadLabs(); loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}
window.approveLab = approveLab;

async function rejectLab(id) {
  const reason = window.prompt('Reason for rejecting this lab (optional):', '') || '';
  try {
    await ownerApi('/admin/labs/' + id + '/reject', { method: 'PUT', body: JSON.stringify({ reason }) });
    showToast('Lab rejected.', 'success');
    loadLabs(); loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}
window.rejectLab = rejectLab;

async function suspendLab(id) {
  if (!window.confirm('Suspend this lab? Its users will be logged out and unable to sign in.')) return;
  try {
    await ownerApi('/admin/labs/' + id + '/suspend', { method: 'PUT' });
    showToast('Lab suspended.', 'success');
    loadLabs(); loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}
window.suspendLab = suspendLab;

async function deleteLab(id, name) {
  if (!window.confirm('Permanently delete "' + name + '" and ALL of its patients/reports? This cannot be undone.')) return;
  try {
    const result = await ownerApi('/admin/labs/' + id, { method: 'DELETE' });
    showToast(result.message, 'success');
    loadLabs(); loadStats();
  } catch (err) { showToast(err.message, 'error'); }
}
window.deleteLab = deleteLab;

statusFilter.addEventListener('change', loadLabs);

loadStats();
loadLabs();`;

  return renderPage({ title: 'Owner Console', body, pageScript, extraStyle });
}

module.exports = ownerPage;
