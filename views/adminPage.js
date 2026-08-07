const { renderPage } = require('./shell');

function adminPage() {
  const body = `
<div class="app-shell">
  <nav class="sidebar" id="adminSidebar">
    <div class="brand">RKH LIMS<div style="font-weight:400;font-size:11px;color:#9fb0b0;margin-top:4px;">Platform Admin</div></div>
    <a href="/admin.html" class="active">Lab Approvals</a>
    <a href="#" class="logout" onclick="logout();return false;">Log out</a>
  </nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Lab Approvals</h1>
        <div class="crumb">Review new lab registrations and manage lab access</div>
      </div>
    </div>

    <div class="content">
      <div class="stat-grid" id="statGrid"></div>

      <div class="card">
        <div class="card-head">
          <h3>Labs</h3>
          <span class="hint">Click a status tab to filter</span>
        </div>
        <div class="toolbar">
          <div id="statusTabs" style="display:flex;gap:8px;flex-wrap:wrap;"></div>
        </div>
        <table>
          <thead>
            <tr><th>Lab</th><th>Code</th><th>Contact</th><th>Registered</th><th>Status</th><th></th></tr>
          </thead>
          <tbody id="labsBody"><tr><td colspan="6" class="empty-state">Loading labs...</td></tr></tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;

  const extraStyle = `
.badge-rejected{background:#fde3e3;color:var(--danger);}
.badge-suspended{background:#fdf1da;color:var(--warn);}
.status-tab{padding:7px 14px;border-radius:99px;font-size:12.5px;font-weight:600;border:1px solid var(--border);background:#fff;cursor:pointer;color:var(--ink-soft);}
.status-tab.active{background:var(--ink);color:#fff;border-color:var(--ink);}
`;

  const pageScript = `
requireSuperadmin();

const STATUS_TABS = [
  { key: '', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'suspended', label: 'Suspended' },
];
let activeStatus = '';

function labBadgeClass(status) {
  return { pending: 'badge-pending', approved: 'badge-approved', rejected: 'badge-rejected', suspended: 'badge-suspended' }[status] || 'badge-pending';
}

async function loadStats() {
  try {
    const stats = await api('/admin/stats');
    const grid = document.getElementById('statGrid');
    grid.innerHTML =
      '<div class="stat-card"><div class="label">Total Labs</div><div class="value">' + stats.totalLabs + '</div></div>' +
      '<div class="stat-card warn"><div class="label">Pending</div><div class="value">' + stats.pendingLabs + '</div></div>' +
      '<div class="stat-card accent"><div class="label">Approved</div><div class="value">' + stats.approvedLabs + '</div></div>' +
      '<div class="stat-card danger"><div class="label">Rejected</div><div class="value">' + stats.rejectedLabs + '</div></div>' +
      '<div class="stat-card"><div class="label">Suspended</div><div class="value">' + stats.suspendedLabs + '</div></div>';
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderTabs() {
  const el = document.getElementById('statusTabs');
  el.innerHTML = STATUS_TABS.map((t) =>
    '<button type="button" class="status-tab ' + (t.key === activeStatus ? 'active' : '') + '" data-status="' + t.key + '">' + t.label + '</button>'
  ).join('');
  el.querySelectorAll('[data-status]').forEach((b) => {
    b.addEventListener('click', () => {
      activeStatus = b.getAttribute('data-status');
      renderTabs();
      loadLabs();
    });
  });
}

async function loadLabs() {
  const body = document.getElementById('labsBody');
  body.innerHTML = '<tr><td colspan="6" class="empty-state">Loading labs...</td></tr>';
  try {
    const qs = activeStatus ? '?status=' + activeStatus : '';
    const labs = await api('/admin/labs' + qs);
    if (!labs.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state"><h4>No labs here</h4>Nothing matches this filter yet.</div></td></tr>';
      return;
    }
    body.innerHTML = labs.map((lab) => {
      const actions = [];
      if (lab.status === 'pending') {
        actions.push('<button type="button" class="btn btn-sm btn-primary" data-approve="' + lab._id + '">Approve</button>');
        actions.push('<button type="button" class="btn btn-sm btn-danger" data-reject="' + lab._id + '">Reject</button>');
      }
      if (lab.status === 'approved') {
        actions.push('<button type="button" class="btn btn-sm btn-outline" data-suspend="' + lab._id + '">Suspend</button>');
      }
      if (lab.status === 'suspended' || lab.status === 'rejected') {
        actions.push('<button type="button" class="btn btn-sm btn-primary" data-approve="' + lab._id + '">' + (lab.status === 'suspended' ? 'Reactivate' : 'Approve') + '</button>');
      }
      actions.push('<button type="button" class="btn btn-sm btn-ghost" data-delete="' + lab._id + '" title="Permanently delete">Delete</button>');
      return '<tr>' +
        '<td><strong>' + lab.name + '</strong>' + (lab.rejectionReason ? '<div class="hint">Reason: ' + lab.rejectionReason + '</div>' : '') + '</td>' +
        '<td class="id-cell">' + lab.code + '</td>' +
        '<td>' + lab.email + (lab.phone ? '<div class="hint">' + lab.phone + '</div>' : '') + '</td>' +
        '<td>' + fmtDateTime(lab.createdAt) + '</td>' +
        '<td><span class="badge ' + labBadgeClass(lab.status) + '">' + lab.status + '</span></td>' +
        '<td style="display:flex;gap:6px;flex-wrap:wrap;">' + actions.join('') + '</td>' +
        '</tr>';
    }).join('');

    body.querySelectorAll('[data-approve]').forEach((b) => b.addEventListener('click', () => approveLab(b.getAttribute('data-approve'))));
    body.querySelectorAll('[data-reject]').forEach((b) => b.addEventListener('click', () => rejectLab(b.getAttribute('data-reject'))));
    body.querySelectorAll('[data-suspend]').forEach((b) => b.addEventListener('click', () => suspendLab(b.getAttribute('data-suspend'))));
    body.querySelectorAll('[data-delete]').forEach((b) => b.addEventListener('click', () => deleteLab(b.getAttribute('data-delete'))));
  } catch (err) {
    body.innerHTML = '<tr><td colspan="6"><div class="empty-state">' + err.message + '</div></td></tr>';
  }
}

async function approveLab(id) {
  try {
    const lab = await api('/admin/labs/' + id + '/approve', { method: 'PUT' });
    showToast(lab.name + ' is now approved.', 'success');
    loadStats();
    loadLabs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function rejectLab(id) {
  const reason = prompt('Reason for rejecting this lab (optional):') || '';
  try {
    const lab = await api('/admin/labs/' + id + '/reject', { method: 'PUT', body: JSON.stringify({ reason }) });
    showToast(lab.name + ' was rejected.', 'success');
    loadStats();
    loadLabs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function suspendLab(id) {
  if (!confirm('Suspend this lab? Its users will be locked out until reactivated.')) return;
  try {
    const lab = await api('/admin/labs/' + id + '/suspend', { method: 'PUT' });
    showToast(lab.name + ' was suspended.', 'success');
    loadStats();
    loadLabs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteLab(id) {
  if (!confirm('Permanently delete this lab and ALL of its data? This cannot be undone.')) return;
  try {
    const data = await api('/admin/labs/' + id, { method: 'DELETE' });
    showToast(data.message, 'success');
    loadStats();
    loadLabs();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

renderTabs();
loadStats();
loadLabs();`;

  return renderPage({ title: 'Lab Approvals', body, pageScript, extraStyle });
}

module.exports = adminPage;
