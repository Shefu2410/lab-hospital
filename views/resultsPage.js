const { renderPage } = require('./shell');

function resultsPage() {
  const extraStyle = `
.split{display:grid;grid-template-columns:380px 1fr;gap:18px;align-items:start;}
@media (max-width:1000px){.split{grid-template-columns:1fr;}}
.report-list .card{padding:0;overflow:hidden;}
.report-list table td, .report-list table th{padding:10px;}
.test-block{border:1px solid var(--border);border-radius:8px;margin-bottom:14px;overflow:hidden;}
.test-block-head{background:#f4f6f7;padding:10px 14px;font-weight:700;font-size:13px;}
.param-head{display:grid;grid-template-columns:4px 1.6fr 1fr 1fr 1fr;gap:14px;padding:8px 14px 8px 10px;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:var(--ink-soft);}
#printArea{
  display:none;
}

@media print{

  .sidebar,
  .topbar,
  .content{
      display:none !important;
  }

  #printArea{
      display:block !important;
      position:absolute;
      top:0;
      left:0;
      width:100%;
      background:#fff;
  }
}

@page{
    margin:10mm;
}`;

  const body = `
<div class="app-shell">
  <nav class="sidebar" id="sidebar"></nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Test Results</h1>
        <div class="crumb">Enter values, review AI flagging, and approve reports</div>
      </div>
    </div>

    <div class="content">
      <div class="split">
        <div class="report-list">
          <div class="toolbar">
            <input class="search-input" id="searchBox" placeholder="Search report ID, patient, test..." />
            <select class="select-input" id="statusFilter">
              <option value="">All statuses</option>
              <option>Pending</option>
              <option>Tested</option>
              <option>Partial Approved</option>
              <option>Approved</option>
            </select>
          </div>
          <div class="card">
            <table>
              <thead><tr><th>Report</th><th>Status</th></tr></thead>
              <tbody id="listBody"><tr><td colspan="2" class="empty-state">Loading…</td></tr></tbody>
            </table>
          </div>
        </div>

        <div id="detailPane">
          <div class="card">
            <div class="empty-state">
              <h4>No report selected</h4>
              Choose a report from the list to enter or review results.
              <div id="printArea">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


  const pageScript = `
requireLogin();
renderSidebar('results');
const currentUser = getUser();
const canApprove = currentUser && ['admin', 'pathologist'].includes(currentUser.role);

const listBody = document.getElementById('listBody');
const detailPane = document.getElementById('detailPane');
let activeReport = null;

async function loadList() {
  const search = document.getElementById('searchBox').value.trim();
  const status = document.getElementById('statusFilter').value;
  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (status) qs.set('status', status);

  try {
    const reports = await api('/results?' + qs.toString());
    if (!reports.length) {
      listBody.innerHTML = '<tr><td colspan="2"><div class="empty-state">No reports found.</div></td></tr>';
      return;
    }
    listBody.innerHTML = reports.map((r) =>
      '<tr class="clickable" onclick="openReport(\\'' + r._id + '\\')">' +
      '<td><div class="id-cell">' + r.reportId + '</div>' +
      '<div style="font-weight:600;">' + (r.patient ? r.patient.name : '—') + '</div>' +
      '<div style="font-size:11.5px;color:var(--ink-soft);">' + r.testNames + '</div></td>' +
      '<td><span class="badge ' + statusBadgeClass(r.status) + '">' + r.status + '</span></td>' +
      '</tr>'
    ).join('');
  } catch (err) {
    listBody.innerHTML = '<tr><td colspan="2"><div class="empty-state">' + err.message + '</div></td></tr>';
  }
}

function flagClass(flag) {
  return { High: 'flag-High', Low: 'flag-Low', Normal: 'flag-Normal' }[flag] || 'flag-NA';
}

async function openReport(id) {
  detailPane.innerHTML = '<div class="card"><div class="empty-state">Loading report…</div></div>';
  try {
    activeReport = await api('/results/' + id);
    renderDetail();
  } catch (err) {
    detailPane.innerHTML = '<div class="card"><div class="empty-state">' + err.message + '</div></div>';
  }
}

function renderDetail() {
  const r = activeReport;

  const testBlocks = r.tests.map((t, ti) =>
    '<div class="test-block" data-test="' + ti + '" data-catalog="' + t.testCatalog + '">' +
    '<div class="test-block-head">' + t.testName + '</div>' +
    '<div class="param-head"><div></div><div>Parameter</div><div>Normal Range</div><div style="text-align:right;">Value</div><div>Flag</div></div>' +
    t.values.map((v, vi) =>
      '<div class="param-row">' +
      '<div class="param-rail ' + flagClass(v.flag) + '"></div>' +
      '<div class="param-name">' + v.name + '</div>' +
      '<div class="param-range">' + (v.normalText ? v.normalText : (v.normalMin ?? '') + ' – ' + (v.normalMax ?? '') + ' ' + v.unit) + '</div>' +
      '<div><input data-test="' + ti + '" data-idx="' + vi + '" class="value-input" value="' + (v.value || '') + '" placeholder="value" /></div>' +
      '<div><span class="flag-chip ' + flagClass(v.flag) + '">' + v.flag + '</span></div>' +
      '</div>'
    ).join('') +
    '</div>'
  ).join('');

  const statusFlow = ['Pending', 'Tested', 'Partial Approved', 'Approved'];
  const nextStatus = statusFlow[Math.min(statusFlow.indexOf(r.status) + 1, statusFlow.length - 1)];

  detailPane.innerHTML =
    '<div class="card">' +
    '<div class="card-head"><div>' +
    '<h3>' + r.reportId + ' <span class="badge ' + statusBadgeClass(r.status) + '" style="margin-left:8px;">' + r.status + '</span></h3>' +
    '<div class="hint">' + r.testNames + ' &middot; ' + r.patient.name + ' &middot; ' + r.patient.patientId + ' &middot; ' + r.patient.age + ' ' + r.patient.ageUnit + ' &middot; ' + r.patient.gender + '</div>' +
    '</div><button class="btn btn-ghost btn-sm" onclick="window.print2()">Print Report</button></div>' +
    '<div id="testBlocks">' + testBlocks + '</div>' +
    '<div class="section-title">AI Insight</div>' +
    '<div class="ai-panel"><span class="ai-tag"><span class="pulse"></span> AI ANALYSIS</span>' +
    '<p id="aiSummaryText">' + (r.aiSummary || 'Save values to generate an AI-assisted summary of this report.') + '</p></div>' +
    '<div class="detail-actions">' +
    '<button class="btn btn-primary" id="saveValuesBtn">Save Values &amp; Run AI Check</button>' +
    (canApprove ? '<button class="btn btn-outline" id="advanceBtn">Mark as "' + nextStatus + '"</button>' : '') +
    (canApprove && r.status !== 'Approved' ? '<button class="btn btn-danger" id="approveBtn">Approve &amp; Print</button>' : '') +
    '</div></div>';

  document.getElementById('saveValuesBtn').addEventListener('click', saveValues);
  const advanceBtn = document.getElementById('advanceBtn');
  if (advanceBtn) advanceBtn.addEventListener('click', () => setStatus(nextStatus));
  const approveBtn = document.getElementById('approveBtn');
  if (approveBtn) approveBtn.addEventListener('click', async () => { await setStatus('Approved'); window.print2(); });
}

async function saveValues() {
  const tests = activeReport.tests.map((t, ti) => {
    const inputs = document.querySelectorAll('.value-input[data-test="' + ti + '"]');
    const values = t.values.map((v, vi) => Object.assign({}, v, { value: inputs[vi].value }));
    return { testCatalog: t.testCatalog, values };
  });

  const btn = document.getElementById('saveValuesBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Saving &amp; analyzing...';
  document.getElementById('aiSummaryText').innerHTML = '<span class="ai-loading">Generating AI insight…</span>';

  try {
    activeReport = await api('/results/' + activeReport._id + '/values', { method: 'PUT', body: JSON.stringify({ tests }) });
    renderDetail();
    loadList();
    showToast('Values saved and AI insight updated.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Save Values & Run AI Check';
  }
}

async function setStatus(status) {
  try {
    activeReport = await api('/results/' + activeReport._id + '/status', { method: 'PUT', body: JSON.stringify({ status }) });
    renderDetail();
    loadList();
    showToast('Report marked ' + status + '.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

window.print2 = function () {
  const r = activeReport;
  const testTables = r.tests.map((t) =>
    '<h4 style="margin:16px 0 6px;">' + t.testName + '</h4>' +
    '<table style="width:100%; border-collapse:collapse;" border="1" cellpadding="6">' +
    '<thead><tr><th>Parameter</th><th>Value</th><th>Normal Range</th><th>Flag</th></tr></thead><tbody>' +
    t.values.map((v) =>
      '<tr><td>' + v.name + '</td><td>' + v.value + ' ' + v.unit + '</td>' +
      '<td>' + (v.normalText || (v.normalMin ?? '') + ' - ' + (v.normalMax ?? '') + ' ' + v.unit) + '</td>' +
      '<td>' + v.flag + '</td></tr>'
    ).join('') +
    '</tbody></table>'
  ).join('');

  document.getElementById('printArea').innerHTML =
    '<div style="font-family: Arial, sans-serif; padding: 30px;">' +
    '<div style="display:flex; justify-content:space-between; border-bottom:2px solid #0c7c7c; padding-bottom:12px; margin-bottom:16px;">' +
    '<div><h2 style="margin:0;">RKH Cross LIMS</h2><div>Hospital &amp; AI Lab Suite</div></div>' +
    '<div style="text-align:right;"><div><b>Report:</b> ' + r.reportId + '</div><div><b>Status:</b> ' + r.status + '</div></div></div>' +
    '<p><b>Patient:</b> ' + r.patient.name + ' (' + r.patient.patientId + ') &nbsp; <b>Age/Sex:</b> ' + r.patient.age + ' ' + r.patient.ageUnit + ' / ' + r.patient.gender + '</p>' +
    testTables +
    '<p style="margin-top:16px;"><b>AI Insight:</b> ' + (r.aiSummary || '-') + '</p></div>';
  window.print();
};

document.getElementById('searchBox').addEventListener('input', () => loadList());
document.getElementById('statusFilter').addEventListener('change', () => loadList());

loadList().then(() => {
  const params = new URLSearchParams(window.location.search);
  const openId = params.get('open');
  if (openId) openReport(openId);
});`;

  return renderPage({ title: 'Test Results', body, pageScript, extraStyle });
}

module.exports = resultsPage;
