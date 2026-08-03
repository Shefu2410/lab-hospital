const { renderPage } = require('./shell');

function dashboardPage() {
  const extraStyle = `
.expand-row td{background:#fafcfc;padding:14px 18px;}
.expand-test{margin-bottom:12px;}
.expand-test h5{margin:0 0 6px;font-size:12.5px;color:var(--teal-dark);}
.expand-param{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:10px;font-size:12.5px;padding:5px 0;border-bottom:1px dashed var(--border);}
.expand-param.hd{color:var(--ink-soft);text-transform:uppercase;font-size:10.5px;border-bottom:1px solid var(--border);}
.stat-card{cursor:pointer;transition:.15s;}
.stat-card:hover{border-color:var(--teal);box-shadow:0 2px 10px rgba(12,124,124,.12);}
.filter-bar{display:none;align-items:center;gap:10px;background:#f4fbfa;border:1px dashed var(--teal);border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12.5px;}
.filter-bar.show{display:flex;}
`;

  const body = `
<div class="app-shell">
  <nav class="sidebar" id="sidebar"></nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Dashboard</h1>
        <div class="crumb">Today's lab activity at a glance &middot; click any card below to see its list</div>
      </div>
      <a href="/registration.html" class="btn btn-primary">+ New Sample</a>
    </div>

    <div class="content">
      <div class="stat-grid" id="statGrid">
        <div class="stat-card" data-filter="today"><div class="label">Samples Today</div><div class="value">—</div></div>
        <div class="stat-card" data-filter="pending"><div class="label">Pending Entry</div><div class="value">—</div></div>
        <div class="stat-card" data-filter="awaiting"><div class="label">Awaiting Approval</div><div class="value">—</div></div>
        <div class="stat-card" data-filter="approved"><div class="label">Approved Reports</div><div class="value">—</div></div>
        <div class="stat-card" data-filter="abnormal"><div class="label">Flagged Abnormal</div><div class="value">—</div></div>
      </div>

      <div class="card">
        <div class="card-head">
          <h3>Find &amp; Manage Reports</h3>
          <span class="hint">Search by patient name or report ID &middot; click a card above to filter &middot; click a row to see values &amp; normal ranges</span>
        </div>
        <div class="filter-bar" id="filterBar">
          <span id="filterBarText"></span>
          <button class="btn btn-ghost btn-sm" id="clearFilterBtn" type="button">Clear &amp; search instead</button>
        </div>
        <div class="toolbar">
          <input class="search-input" id="dashSearchBox" placeholder="Search patient name or report ID..." />
        </div>
        <table>
          <thead id="searchHead"><tr><th>Report</th><th>Status</th><th></th></tr></thead>
          <tbody id="searchBody"><tr><td colspan="3" class="empty-state">Start typing a patient name to search, or click a card above.</td></tr></tbody>
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

const statGrid = document.getElementById('statGrid');
const searchHead = document.getElementById('searchHead');
const searchBody = document.getElementById('searchBody');
const dashSearchBox = document.getElementById('dashSearchBox');
const filterBar = document.getElementById('filterBar');
const filterBarText = document.getElementById('filterBarText');

let searchTimer = null;
let activeFilter = null;

const DEFAULT_HEAD = \`<tr><th>Report</th><th>Status</th><th></th></tr>\`;
const DEFAULT_BODY = \`<tr><td colspan="3" class="empty-state">Start typing a patient name to search, or click a card above.</td></tr>\`;

const FILTER_LABELS = {
  today: 'Showing patients registered today',
  pending: 'Showing reports pending entry',
  awaiting: 'Showing reports awaiting approval (Tested + Partial Approved)',
  approved: 'Showing approved reports',
  abnormal: 'Showing reports with at least one abnormal (High/Low) value',
};

// ---------- small helpers ----------

function flagClass(flag) {
  return { High: 'flag-High', Low: 'flag-Low', Normal: 'flag-Normal' }[flag] || 'flag-NA';
}

function normalRangeText(value) {
  if (value.normalText) return value.normalText;
  return \`\${value.normalMin ?? ''} – \${value.normalMax ?? ''} \${value.unit}\`;
}

function resetSearchPanel() {
  searchHead.innerHTML = DEFAULT_HEAD;
  searchBody.innerHTML = DEFAULT_BODY;
}

// ---------- stat cards ----------

function statCardHtml({ label, value, foot }) {
  return \`
    <div class="label">\${label}</div>
    <div class="value">\${value}</div>
    \${foot ? \`<div class="foot">\${foot}</div>\` : ''}
  \`;
}

async function loadStats() {
  try {
    const stats = await api('/dashboard/stats');
    const cards = document.querySelectorAll('#statGrid .stat-card');

    const cardData = [
      { el: cards[0], label: 'Samples Today', value: stats.patientsToday, foot: \`\${stats.totalPatients} total patients\` },
      { el: cards[1], label: 'Pending Entry', value: stats.pending, cls: '' },
      { el: cards[2], label: 'Awaiting Approval', value: stats.tested + stats.partialApproved, cls: 'warn' },
      { el: cards[3], label: 'Approved Reports', value: stats.approved, cls: 'accent' },
      { el: cards[4], label: 'Flagged Abnormal', value: stats.abnormalReports, cls: 'danger' },
    ];

    cardData.forEach((card) => {
      card.el.className = \`stat-card \${card.cls || ''}\`;
      card.el.innerHTML = statCardHtml(card);
    });
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------- recent reports ----------

function recentRowHtml(report) {
  return \`
    <tr class="clickable" onclick="window.location.href='/results.html?open=\${report._id}'">
      <td class="id-cell">\${report.reportId}</td>
      <td>\${report.patient ? report.patient.name : '—'}</td>
      <td>\${report.testNames}</td>
      <td><span class="badge \${statusBadgeClass(report.status)}">\${report.status}</span></td>
      <td>\${fmtDateTime(report.updatedAt)}</td>
    </tr>
  \`;
}

async function loadRecent() {
  const recentBody = document.getElementById('recentBody');
  try {
    const reports = await api('/dashboard/recent');

    if (!reports.length) {
      recentBody.innerHTML = \`<tr><td colspan="5"><div class="empty-state"><h4>No reports yet</h4>Register a sample to get started.</div></td></tr>\`;
      return;
    }

    recentBody.innerHTML = reports.map(recentRowHtml).join('');
  } catch (err) {
    recentBody.innerHTML = \`<tr><td colspan="5"><div class="empty-state">Failed to load: \${err.message}</div></td></tr>\`;
  }
}

// ---------- expandable report rows (search / filter results) ----------

function expandParamHtml(value) {
  return \`
    <div class="expand-param">
      <div>\${value.name}</div>
      <div>\${value.value || '—'} \${value.unit || ''}</div>
      <div>\${normalRangeText(value)}</div>
      <div><span class="flag-chip \${flagClass(value.flag)}">\${value.flag}</span></div>
    </div>
  \`;
}

function expandTestHtml(test) {
  const paramRows = test.values.map(expandParamHtml).join('');
  return \`
    <div class="expand-test">
      <h5>\${test.testName}</h5>
      <div class="expand-param hd">
        <div>Parameter</div><div>Value</div><div>Normal Range</div><div>Flag</div>
      </div>
      \${paramRows}
    </div>
  \`;
}

async function toggleExpand(id, rowEl) {
  const existing = document.getElementById(\`expand-\${id}\`);
  if (existing) {
    existing.remove();
    return;
  }

  document.querySelectorAll('.expand-row').forEach((row) => row.remove());

  try {
    const report = await api(\`/results/\${id}\`);
    const tr = document.createElement('tr');
    tr.id = \`expand-\${id}\`;
    tr.className = 'expand-row';

    const td = document.createElement('td');
    td.colSpan = 3;
    td.innerHTML = report.tests.map(expandTestHtml).join('');

    tr.appendChild(td);
    rowEl.after(tr);
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.toggleExpand = toggleExpand;

// ---------- delete ----------

async function deleteReport(id, reportId) {
  const confirmed = window.confirm(\`Are you sure you want to delete report \${reportId}? This cannot be undone.\`);
  if (!confirmed) return; // user clicked Cancel - nothing changes

  try {
    await api(\`/results/\${id}\`, { method: 'DELETE' });
    showToast(\`Report \${reportId} deleted.\`, 'success');

    if (activeFilter) applyFilter(activeFilter);
    else runSearch();

    loadRecent();
    loadStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
window.deleteReport = deleteReport;

// ---------- rendering the search / filter results table ----------

function reportRowHtml(report) {
  const deleteButton = canDelete
    ? \`<button class="btn btn-danger btn-sm" onclick="event.stopPropagation(); deleteReport('\${report._id}', '\${report.reportId}')">Delete</button>\`
    : '';

  return \`
    <tr class="clickable" data-id="\${report._id}" onclick="toggleExpand('\${report._id}', this)">
      <td>
        <div class="id-cell">\${report.reportId}</div>
        <div style="font-weight:600;">\${report.patient ? report.patient.name : '—'}</div>
        <div style="font-size:11.5px;color:var(--ink-soft);">\${report.testNames}</div>
      </td>
      <td><span class="badge \${statusBadgeClass(report.status)}">\${report.status}</span></td>
      <td>\${deleteButton}</td>
    </tr>
  \`;
}

function renderReportRows(reports, emptyMessage) {
  searchHead.innerHTML = DEFAULT_HEAD;

  if (!reports.length) {
    searchBody.innerHTML = \`<tr><td colspan="3"><div class="empty-state">\${emptyMessage}</div></td></tr>\`;
    return;
  }

  searchBody.innerHTML = reports.map(reportRowHtml).join('');
}

function patientRowHtml(patient) {
  return \`
    <tr>
      <td>
        <span class="id-cell">\${patient.patientId}</span> &nbsp;
        \${patient.name} &middot; \${patient.age} \${patient.ageUnit} / \${patient.gender}
      </td>
      <td>\${patient.phone || '—'}</td>
      <td>\${fmtDateTime(patient.createdAt)}</td>
    </tr>
  \`;
}

function renderPatientRows(patients, emptyMessage) {
  searchHead.innerHTML = \`<tr><th>Patient</th><th>Phone</th><th>Registered</th></tr>\`;

  if (!patients.length) {
    searchBody.innerHTML = \`<tr><td colspan="3"><div class="empty-state">\${emptyMessage}</div></td></tr>\`;
    return;
  }

  searchBody.innerHTML = patients.map(patientRowHtml).join('');
}

// ---------- free-text search ----------

function scheduleSearch() {
  clearFilterUI();
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 250);
}

async function runSearch() {
  const term = dashSearchBox.value.trim();

  if (!term) {
    resetSearchPanel();
    return;
  }

  try {
    const reports = await api(\`/results?search=\${encodeURIComponent(term)}\`);
    renderReportRows(reports, \`No reports match "\${term}".\`);
  } catch (err) {
    searchBody.innerHTML = \`<tr><td colspan="3"><div class="empty-state">\${err.message}</div></td></tr>\`;
  }
}

// ---------- stat-card quick filters ----------

function clearFilterUI() {
  activeFilter = null;
  filterBar.classList.remove('show');
}

function filterQueryString(key) {
  if (key === 'pending') return 'status=Pending';
  if (key === 'awaiting') return \`status=\${encodeURIComponent('Tested,Partial Approved')}\`;
  if (key === 'approved') return 'status=Approved';
  if (key === 'abnormal') return 'abnormal=true';
  return '';
}

async function applyFilter(key) {
  activeFilter = key;
  dashSearchBox.value = '';
  filterBar.classList.add('show');
  filterBarText.textContent = FILTER_LABELS[key] || '';

  try {
    if (key === 'today') {
      const patients = await api('/patients?today=true');
      renderPatientRows(patients, 'No patients registered today yet.');
      return;
    }

    const reports = await api(\`/results?\${filterQueryString(key)}\`);
    renderReportRows(reports, 'Nothing in this category right now.');
  } catch (err) {
    searchBody.innerHTML = \`<tr><td colspan="3"><div class="empty-state">\${err.message}</div></td></tr>\`;
  }
}
window.applyFilter = applyFilter;

// ---------- wire up + initial load ----------

dashSearchBox.addEventListener('input', scheduleSearch);

document.getElementById('clearFilterBtn').addEventListener('click', () => {
  clearFilterUI();
  resetSearchPanel();
});

document.querySelectorAll('#statGrid .stat-card').forEach((card) => {
  card.addEventListener('click', () => applyFilter(card.getAttribute('data-filter')));
});

loadStats();
loadRecent();`;

  return renderPage({ title: 'Dashboard', body, pageScript, extraStyle });
}

module.exports = dashboardPage;