const { renderPage } = require('./shell');

function dashboardPage() {
  const extraStyle = `
.expand-row td{background:#fafcfc;padding:14px 18px;}
.expand-test{margin-bottom:12px;}
.expand-test h5{margin:0 0 6px;font-size:12.5px;color:var(--teal-dark);}
.expand-param{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:10px;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--border);}
.expand-param.hd{color:var(--ink-soft);text-transform:uppercase;font-size:10.5px;border-bottom:1px solid var(--border);}
`;

  const body = `
<div class="app-shell">
  <nav class="sidebar" id="sidebar"></nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Dashboard</h1>
        <div class="crumb">Today's lab activity at a glance</div>
      </div>
      <a href="/registration.html" class="btn btn-primary">+ New Sample</a>
    </div>

    <div class="content">
      <div class="stat-grid" id="statGrid">
        <div class="stat-card"><div class="label">Samples Today</div><div class="value">—</div></div>
        <div class="stat-card"><div class="label">Pending Entry</div><div class="value">—</div></div>
        <div class="stat-card"><div class="label">Awaiting Approval</div><div class="value">—</div></div>
        <div class="stat-card"><div class="label">Approved Reports</div><div class="value">—</div></div>
        <div class="stat-card"><div class="label">Flagged Abnormal</div><div class="value">—</div></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Find &amp; Manage Reports</h3>
          <span class="hint">Search by patient name or report ID · click a row to see values &amp; normal ranges</span>
        </div>
        <div class="toolbar">
          <input class="search-input" id="dashSearchBox" placeholder="Search patient name or report ID..." />
        </div>
        <table>
          <thead><tr><th>Report</th><th>Status</th><th></th></tr></thead>
          <tbody id="searchBody"><tr><td colspan="3" class="empty-state">Start typing a patient name to search.</td></tr></tbody>
        </table>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Recent Reports</h3>
          <span class="hint">Latest 8 across all statuses</span>
        </div>
        <table>
          <thead>
            <tr><th>Report ID</th><th>Patient</th><th>Tests</th><th>Status</th><th>Updated</th></tr>
          </thead>
          <tbody id="recentBody">
            <tr><td colspan="5" class="empty-state">Loading…</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>`;

  const pageScript = `
requireLogin();
renderSidebar('dashboard');
const currentUser = getUser();
const canDelete = currentUser && currentUser.role === 'admin';

async function loadStats() {
  try {
    const s = await api('/dashboard/stats');
    const cards = document.querySelectorAll('#statGrid .stat-card');
    const map = [
      { el: cards[0], label: 'Samples Today', value: s.patientsToday, foot: s.totalPatients + ' total patients' },
      { el: cards[1], label: 'Pending Entry', value: s.pending, cls: '' },
      { el: cards[2], label: 'Awaiting Approval', value: s.tested + s.partialApproved, cls: 'warn' },
      { el: cards[3], label: 'Approved Reports', value: s.approved, cls: 'accent' },
      { el: cards[4], label: 'Flagged Abnormal', value: s.abnormalReports, cls: 'danger' },
    ];
    map.forEach((m) => {
      m.el.className = 'stat-card ' + (m.cls || '');
      m.el.innerHTML = '<div class="label">' + m.label + '</div><div class="value">' + m.value + '</div>' + (m.foot ? '<div class="foot">' + m.foot + '</div>' : '');
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadRecent() {
  const body = document.getElementById('recentBody');
  try {
    const reports = await api('/dashboard/recent');
    if (!reports.length) {
      body.innerHTML = '<tr><td colspan="5"><div class="empty-state"><h4>No reports yet</h4>Register a sample to get started.</div></td></tr>';
      return;
    }
    body.innerHTML = reports.map((r) =>
      '<tr class="clickable" onclick="window.location.href=\\'/results.html?open=' + r._id + '\\'">' +
      '<td class="id-cell">' + r.reportId + '</td>' +
      '<td>' + (r.patient ? r.patient.name : '—') + '</td>' +
      '<td>' + r.testNames + '</td>' +
      '<td><span class="badge ' + statusBadgeClass(r.status) + '">' + r.status + '</span></td>' +
      '<td>' + fmtDateTime(r.updatedAt) + '</td>' +
      '</tr>'
    ).join('');
  } catch (err) {
    body.innerHTML = '<tr><td colspan="5"><div class="empty-state">Failed to load: ' + err.message + '</div></td></tr>';
  }
}

function flagClass(flag) {
  return { High: 'flag-High', Low: 'flag-Low', Normal: 'flag-Normal' }[flag] || 'flag-NA';
}

function renderExpandInner(report) {
  return report.tests.map((t) =>
    '<div class="expand-test"><h5>' + t.testName + '</h5>' +
    '<div class="expand-param hd"><div>Parameter</div><div>Value</div><div>Normal Range</div><div>Flag</div></div>' +
    t.values.map((v) =>
      '<div class="expand-param">' +
      '<div>' + v.name + '</div>' +
      '<div>' + (v.value || '—') + ' ' + (v.unit || '') + '</div>' +
      '<div>' + (v.normalText ? v.normalText : (v.normalMin ?? '') + ' – ' + (v.normalMax ?? '') + ' ' + v.unit) + '</div>' +
      '<div><span class="flag-chip ' + flagClass(v.flag) + '">' + v.flag + '</span></div>' +
      '</div>'
    ).join('') +
    '</div>'
  ).join('');
}

let expandedId = null;

async function toggleExpand(id, rowEl) {
  const existing = document.getElementById('expand-' + id);
  if (existing) {
    existing.remove();
    expandedId = null;
    return;
  }
  document.querySelectorAll('.expand-row').forEach((e) => e.remove());
  try {
    const report = await api('/results/' + id);
    const tr = document.createElement('tr');
    tr.id = 'expand-' + id;
    tr.className = 'expand-row';
    const td = document.createElement('td');
    td.colSpan = 3;
    td.innerHTML = renderExpandInner(report);
    tr.appendChild(td);
    rowEl.after(tr);
    expandedId = id;
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteReport(id, reportId) {
  if (!window.confirm('Are you sure you want to delete report ' + reportId + '? This cannot be undone.')) {
    return; // user clicked Cancel - nothing changes
  }
  try {
    await api('/results/' + id, { method: 'DELETE' });
    showToast('Report ' + reportId + ' deleted.', 'success');
    runSearch();
    loadRecent();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.deleteReport = deleteReport;
window.toggleExpand = toggleExpand;

let searchTimer = null;
function scheduleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 250);
}

async function runSearch() {
  const term = document.getElementById('dashSearchBox').value.trim();
  const body = document.getElementById('searchBody');
  if (!term) {
    body.innerHTML = '<tr><td colspan="3" class="empty-state">Start typing a patient name to search.</td></tr>';
    return;
  }
  try {
    const reports = await api('/results?search=' + encodeURIComponent(term));
    if (!reports.length) {
      body.innerHTML = '<tr><td colspan="3"><div class="empty-state">No reports match "' + term + '".</div></td></tr>';
      return;
    }
    body.innerHTML = reports.map((r) =>
      '<tr class="clickable" data-id="' + r._id + '" onclick="toggleExpand(\\'' + r._id + '\\', this)">' +
      '<td><div class="id-cell">' + r.reportId + '</div>' +
      '<div style="font-weight:600;">' + (r.patient ? r.patient.name : '—') + '</div>' +
      '<div style="font-size:11.5px;color:var(--ink-soft);">' + r.testNames + '</div></td>' +
      '<td><span class="badge ' + statusBadgeClass(r.status) + '">' + r.status + '</span></td>' +
      '<td>' + (canDelete ? '<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteReport(\\'' + r._id + '\\', \\'' + r.reportId + '\\')">Delete</button>' : '') + '</td>' +
      '</tr>'
    ).join('');
  } catch (err) {
    body.innerHTML = '<tr><td colspan="3"><div class="empty-state">' + err.message + '</div></td></tr>';
  }
}

document.getElementById('dashSearchBox').addEventListener('input', scheduleSearch);

loadStats();
loadRecent();`;

  return renderPage({ title: 'Dashboard', body, pageScript, extraStyle });
}

module.exports = dashboardPage;
