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
#printArea{display:none;}
@media print{
  .app-shell{display:none !important;}
  #toastEl{display:none !important;}
  #printModalOverlay{display:none !important;}
  #printArea{display:block !important;}
}
#printModalOverlay{display:none;position:fixed;inset:0;background:rgba(20,30,35,.45);z-index:200;align-items:center;justify-content:center;}
#printModalOverlay.show{display:flex;}
.print-modal{background:#fff;border-radius:12px;padding:22px 24px;width:460px;max-width:92vw;max-height:86vh;overflow:auto;}
.print-modal h3{margin:0 0 4px;}
.print-modal .hint{margin-bottom:14px;}
.print-field-row{display:grid;grid-template-columns:1fr 1.4fr auto;gap:8px;margin-bottom:8px;align-items:center;}
.print-field-row input{margin:0;}
.print-modal-actions{display:flex;justify-content:space-between;align-items:center;margin-top:16px;}`;

  const body = `
<div class="app-shell">
  <nav class="sidebar" id="sidebar"></nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Test Results</h1>
        <div class="crumb">Enter values and manage report status</div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
<div id="printArea"></div>

<div id="printModalOverlay">
  <div class="print-modal">
    <h3>Report header</h3>
    <div class="hint">Fill in or edit anything you want to appear at the top of the printed report (name, age, referring doctor, etc). Add more rows for anything else.</div>
    <div id="printFieldList"></div>
    <button type="button" class="btn btn-ghost btn-sm" id="addPrintFieldBtn">+ Add field</button>
    <div class="print-modal-actions">
      <button type="button" class="btn btn-ghost" id="cancelPrintBtn">Cancel</button>
      <button type="button" class="btn btn-primary" id="confirmPrintBtn">Print</button>
    </div>
  </div>
</div>`;

  const pageScript = `
requireLogin();
renderSidebar('results');

const currentUser = getUser();
const canApprove = currentUser && ['admin', 'pathologist'].includes(currentUser.role);

const listBody = document.getElementById('listBody');
const detailPane = document.getElementById('detailPane');
const searchBox = document.getElementById('searchBox');
const statusFilter = document.getElementById('statusFilter');

let activeReport = null;

// ---------- small helpers ----------

function flagClass(flag) {
  return { High: 'flag-High', Low: 'flag-Low', Normal: 'flag-Normal' }[flag] || 'flag-NA';
}

function normalRangeText(value) {
  if (value.normalText) return value.normalText;
  return \`\${value.normalMin ?? ''} – \${value.normalMax ?? ''} \${value.unit}\`;
}

// ---------- report list (left column) ----------

function reportListRowHtml(report) {
  return \`
    <tr class="clickable" onclick="openReport('\${report._id}')">
      <td>
        <div class="id-cell">\${report.reportId}</div>
        <div style="font-weight:600;">\${report.patient ? report.patient.name : '—'}</div>
        <div style="font-size:11.5px;color:var(--ink-soft);">\${report.testNames}</div>
      </td>
      <td><span class="badge \${statusBadgeClass(report.status)}">\${report.status}</span></td>
    </tr>
  \`;
}

async function loadList() {
  const search = searchBox.value.trim();
  const status = statusFilter.value;
  const qs = new URLSearchParams();
  if (search) qs.set('search', search);
  if (status) qs.set('status', status);

  try {
    const reports = await api(\`/results?\${qs.toString()}\`);

    if (!reports.length) {
      listBody.innerHTML = \`<tr><td colspan="2"><div class="empty-state">No reports found.</div></td></tr>\`;
      return;
    }

    listBody.innerHTML = reports.map(reportListRowHtml).join('');
  } catch (err) {
    listBody.innerHTML = \`<tr><td colspan="2"><div class="empty-state">\${err.message}</div></td></tr>\`;
  }
}

// ---------- report detail (right column) ----------

async function openReport(id) {
  detailPane.innerHTML = \`<div class="card"><div class="empty-state">Loading report…</div></div>\`;
  try {
    activeReport = await api(\`/results/\${id}\`);
    renderDetail();
  } catch (err) {
    detailPane.innerHTML = \`<div class="card"><div class="empty-state">\${err.message}</div></div>\`;
  }
}

function paramRowHtml(value, testIndex, valueIndex) {
  return \`
    <div class="param-row">
      <div class="param-rail \${flagClass(value.flag)}"></div>
      <div class="param-name">\${value.name}</div>
      <div class="param-range">\${normalRangeText(value)}</div>
      <div>
        <input
          data-test="\${testIndex}"
          data-idx="\${valueIndex}"
          class="value-input"
          value="\${value.value || ''}"
          placeholder="value"
        />
      </div>
      <div><span class="flag-chip \${flagClass(value.flag)}">\${value.flag}</span></div>
    </div>
  \`;
}

function testBlockHtml(test, testIndex) {
  const paramRows = test.values.map((value, valueIndex) => paramRowHtml(value, testIndex, valueIndex)).join('');

  return \`
    <div class="test-block" data-test="\${testIndex}" data-catalog="\${test.testCatalog}">
      <div class="test-block-head">\${test.testName}</div>
      <div class="param-head">
        <div></div>
        <div>Parameter</div>
        <div>Normal Range</div>
        <div style="text-align:right;">Value</div>
        <div>Flag</div>
      </div>
      \${paramRows}
    </div>
  \`;
}

function renderDetail() {
  const report = activeReport;
  const testBlocks = report.tests.map((test, testIndex) => testBlockHtml(test, testIndex)).join('');

  const statusFlow = ['Pending', 'Tested', 'Partial Approved', 'Approved'];
  const nextStatus = statusFlow[Math.min(statusFlow.indexOf(report.status) + 1, statusFlow.length - 1)];

  detailPane.innerHTML = \`
    <div class="card">
      <div class="card-head">
        <div>
          <h3>
            \${report.reportId}
            <span class="badge \${statusBadgeClass(report.status)}" style="margin-left:8px;">\${report.status}</span>
          </h3>
          <div class="hint">
            \${report.testNames} &middot;
            \${report.patient.name} &middot;
            \${report.patient.patientId} &middot;
            \${report.patient.age} \${report.patient.ageUnit} &middot;
            \${report.patient.gender}
          </div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="window.print2()">Print Report</button>
      </div>

      <div id="testBlocks">\${testBlocks}</div>

      <div class="detail-actions">
        <button class="btn btn-primary" id="saveValuesBtn">Save Values</button>
        \${canApprove ? \`<button class="btn btn-outline" id="advanceBtn">Mark as "\${nextStatus}"</button>\` : ''}
        \${canApprove && report.status !== 'Approved' ? \`<button class="btn btn-danger" id="approveBtn">Approve &amp; Print</button>\` : ''}
      </div>
    </div>
  \`;

  document.getElementById('saveValuesBtn').addEventListener('click', saveValues);

  const advanceBtn = document.getElementById('advanceBtn');
  if (advanceBtn) advanceBtn.addEventListener('click', () => setStatus(nextStatus));

  const approveBtn = document.getElementById('approveBtn');
  if (approveBtn) {
    approveBtn.addEventListener('click', async () => {
      await setStatus('Approved');
      window.print2();
    });
  }
}

// ---------- actions ----------

async function saveValues() {
  const tests = activeReport.tests.map((test, testIndex) => {
    const inputs = document.querySelectorAll(\`.value-input[data-test="\${testIndex}"]\`);
    const values = test.values.map((value, valueIndex) => ({ ...value, value: inputs[valueIndex].value }));
    return { testCatalog: test.testCatalog, values };
  });

  const btn = document.getElementById('saveValuesBtn');
  btn.disabled = true;
  btn.innerHTML = \`<span class="spinner"></span> Saving...\`;

  try {
    activeReport = await api(\`/results/\${activeReport._id}/values\`, {
      method: 'PUT',
      body: JSON.stringify({ tests }),
    });
    renderDetail();
    loadList();
    showToast('Values saved.', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Save Values';
  }
}

async function setStatus(status) {
  try {
    activeReport = await api(\`/results/\${activeReport._id}/status\`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    renderDetail();
    loadList();
    showToast(\`Report marked \${status}.\`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ---------- printing ----------

function printTestTableHtml(test) {
  const rows = test.values.map((value) => \`
    <tr>
      <td>\${value.name}</td>
      <td>\${value.value} \${value.unit}</td>
      <td>\${normalRangeText(value)}</td>
      <td>\${value.flag}</td>
    </tr>
  \`).join('');

  return \`
    <h4 style="margin:16px 0 6px;">\${test.testName}</h4>
    <table style="width:100%; border-collapse:collapse;" border="1" cellpadding="6">
      <thead>
        <tr><th>Parameter</th><th>Value</th><th>Normal Range</th><th>Flag</th></tr>
      </thead>
      <tbody>\${rows}</tbody>
    </table>
  \`;
}

// ---------- print header modal (manually typed/edited fields) ----------

const printModalOverlay = document.getElementById('printModalOverlay');
const printFieldList = document.getElementById('printFieldList');
const addPrintFieldBtn = document.getElementById('addPrintFieldBtn');
const cancelPrintBtn = document.getElementById('cancelPrintBtn');
const confirmPrintBtn = document.getElementById('confirmPrintBtn');

function printFieldRowHtml(label, value) {
  return \`
    <div class="print-field-row">
      <input type="text" class="print-field-label" placeholder="Field name" value="\${label}" />
      <input type="text" class="print-field-value" placeholder="Value" value="\${value}" />
      <button type="button" class="btn btn-ghost btn-sm" onclick="this.closest('.print-field-row').remove()">✕</button>
    </div>
  \`;
}

function openPrintModal() {
  const report = activeReport;
  const p = report.patient;
  const defaultFields = [
    ['Name', p.name || ''],
    ['Age', \`\${p.age || ''} \${p.ageUnit || ''}\`.trim()],
    ['Gender', p.gender || ''],
    ['Referring Doctor', ''],
  ];
  printFieldList.innerHTML = defaultFields.map(([l, v]) => printFieldRowHtml(l, v)).join('');
  printModalOverlay.classList.add('show');
}

addPrintFieldBtn.addEventListener('click', () => {
  printFieldList.insertAdjacentHTML('beforeend', printFieldRowHtml('', ''));
});

cancelPrintBtn.addEventListener('click', () => {
  printModalOverlay.classList.remove('show');
});

confirmPrintBtn.addEventListener('click', () => {
  const rows = [...printFieldList.querySelectorAll('.print-field-row')];
  const fields = rows
    .map((row) => ({
      label: row.querySelector('.print-field-label').value.trim(),
      value: row.querySelector('.print-field-value').value.trim(),
    }))
    .filter((f) => f.label || f.value);

  printModalOverlay.classList.remove('show');
  renderPrintArea(fields);
  window.print();
});

function printHeaderFieldHtml(field) {
  return \`<div><b>\${field.label}:</b> \${field.value}</div>\`;
}

function renderPrintArea(fields) {
  const report = activeReport;
  const testTables = report.tests.map(printTestTableHtml).join('');

  document.getElementById('printArea').innerHTML = \`
    <div style="font-family: Arial, sans-serif; padding: 30px;">
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0c7c7c; padding-bottom:12px; margin-bottom:16px;">
        <div>
          <h2 style="margin:0;">RKH LIMS</h2>
          <div>Hospital &amp; AI Lab Suite</div>
        </div>
        <div style="text-align:right;">
          <div><b>Report:</b> \${report.reportId}</div>
          <div><b>Status:</b> \${report.status}</div>
        </div>
      </div>
      <div style="margin-bottom:16px;">
        \${fields.map(printHeaderFieldHtml).join('')}
      </div>
      \${testTables}
      <div style="margin-top:36px; padding-top:10px; border-top:1px solid #ccc; text-align:center; font-size:11px; color:#8a8a8a;">
        Software by RKH LIMS Hospital &amp; AI Lab Suite
      </div>
    </div>
  \`;
}

window.print2 = function () {
  openPrintModal();
};

// ---------- wire up + initial load ----------

searchBox.addEventListener('input', loadList);
statusFilter.addEventListener('change', loadList);

loadList().then(() => {
  const params = new URLSearchParams(window.location.search);
  const openId = params.get('open');
  if (openId) openReport(openId);
});`;

  return renderPage({ title: 'Test Results', body, pageScript, extraStyle });
}

module.exports = resultsPage;