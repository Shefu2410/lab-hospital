const { renderPage } = require('./shell');

function registrationPage() {
  const body = `
<div class="app-shell">
  <nav class="sidebar" id="sidebar"></nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Sample Registration</h1>
        <div class="crumb">Register a patient once, then order all their tests together in a single report</div>
      </div>
    </div>

    <div class="content">
      <div class="card">
        <div class="card-head"><h3>Existing Patient — New Report</h3><span class="hint">Already registered? Find them here instead of re-registering</span></div>
        <input class="search-input" id="existingSearchBox" placeholder="Search by name, patient ID or phone..." />
        <table style="margin-top:10px;">
          <thead><tr><th>Patient</th><th>Phone</th><th></th></tr></thead>
          <tbody id="existingResultsBody"><tr><td colspan="3" class="empty-state">Start typing to find a returning patient.</td></tr></tbody>
        </table>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><h3>Patient Details</h3><span class="hint">Stored in the patients collection</span></div>
          <div class="hint" style="margin-bottom:10px;">Each phone number can only be registered once — re-entering the same number will be rejected instead of creating a duplicate.</div>
          <form id="patientForm">
            <div class="field-row">
              <div class="field"><label>Full Name *</label><input id="p_name" required /></div>
            </div>
            <div class="field-row">
              <div class="field"><label>Age *</label><input id="p_age" type="number" min="0" required /></div>
              <div class="field">
                <label>Unit</label>
                <select id="p_ageUnit"><option>Years</option><option>Months</option><option>Days</option></select>
              </div>
              <div class="field">
                <label>Gender *</label>
                <select id="p_gender" required><option>Male</option><option>Female</option><option>Other</option></select>
              </div>
            </div>
            <div class="field-row">
              <div class="field"><label>Phone *</label><input id="p_phone" type="tel" placeholder="10-digit mobile number" required /></div>
              <div class="field"><label>Email</label><input id="p_email" type="email" /></div>
            </div>
            <div class="field"><label>Address</label><input id="p_address" /></div>
            <div class="field"><label>Referred By (Doctor / Clinic)</label><input id="p_referredBy" /></div>
            <button class="btn btn-primary btn-block" type="submit" id="registerBtn">Register Patient</button>
          </form>
        </div>

        <div class="card" id="orderCard" style="display:none;">
          <div class="card-head"><h3>Order Tests</h3><span class="hint">For <span id="orderPatientName"></span></span></div>
          <div class="hint" style="margin-bottom:10px;">Tick every panel this visit needs, enter a Report ID, then click below once — nothing is created until you do.</div>
          <div class="field"><label>Report ID *</label><input id="reportIdInput" placeholder="e.g. RPT-000008" /></div>
          <div id="testCheckList"></div>
          <button class="btn btn-outline btn-block" id="addTestBtn" style="margin-top:14px;">Create Report for Selected Tests</button>

          <div class="section-title">Reports created this visit</div>
          <table>
            <thead><tr><th>Report ID</th><th>Tests</th><th>Status</th><th></th></tr></thead>
            <tbody id="orderedBody"><tr><td colspan="4" class="empty-state">No report created yet.</td></tr></tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</div>`;

  const pageScript = `
requireLogin();
renderSidebar('registration');

let currentPatientId = null;
let testCatalog = [];

function selectPatient(patient) {
  currentPatientId = patient._id;
  document.getElementById('orderPatientName').textContent = patient.name + ' (' + patient.patientId + ')';
  document.getElementById('orderCard').style.display = 'block';
  document.getElementById('orderCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  showToast('Selected ' + patient.name + ' (' + patient.patientId + ') — choose tests below, nothing is created yet.', 'success');
}

let existingSearchTimer = null;
document.getElementById('existingSearchBox').addEventListener('input', () => {
  clearTimeout(existingSearchTimer);
  existingSearchTimer = setTimeout(runExistingSearch, 250);
});

async function runExistingSearch() {
  const term = document.getElementById('existingSearchBox').value.trim();
  const body = document.getElementById('existingResultsBody');
  if (!term) {
    body.innerHTML = '<tr><td colspan="3" class="empty-state">Start typing to find a returning patient.</td></tr>';
    return;
  }
  try {
    const patients = await api('/patients?search=' + encodeURIComponent(term));
    if (!patients.length) {
      body.innerHTML = '<tr><td colspan="3"><div class="empty-state">No patient matches "' + term + '".</div></td></tr>';
      return;
    }
    body.innerHTML = patients.map((p) =>
      '<tr><td><span class="id-cell">' + p.patientId + '</span> &nbsp; ' + p.name + ' &middot; ' + p.age + ' ' + p.ageUnit + ' / ' + p.gender + '</td>' +
      '<td>' + (p.phone || '—') + '</td>' +
      '<td><button type="button" class="btn btn-sm btn-outline" data-select="' + p._id + '">Use this patient</button></td></tr>'
    ).join('');
    body.querySelectorAll('[data-select]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const p = patients.find((x) => x._id === btn.getAttribute('data-select'));
        if (p) selectPatient(p);
      });
    });
  } catch (err) {
    body.innerHTML = '<tr><td colspan="3"><div class="empty-state">' + err.message + '</div></td></tr>';
  }
}

async function loadCatalog() {
  testCatalog = await api('/tests');
  const list = document.getElementById('testCheckList');
  list.innerHTML = testCatalog.map((t) =>
    '<label style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);cursor:pointer;">' +
    '<input type="checkbox" class="testCheck" value="' + t._id + '" style="width:auto;" />' +
    '<span style="flex:1;">' + t.name + ' (' + t.code + ')</span>' +
    '<span class="hint">\u20b9' + t.price + '</span>' +
    '</label>'
  ).join('');
}

document.getElementById('patientForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Registering...';

  try {
    const payload = {
      name: document.getElementById('p_name').value.trim(),
      age: Number(document.getElementById('p_age').value),
      ageUnit: document.getElementById('p_ageUnit').value,
      gender: document.getElementById('p_gender').value,
      phone: document.getElementById('p_phone').value.trim(),
      email: document.getElementById('p_email').value.trim(),
      address: document.getElementById('p_address').value.trim(),
      referredBy: document.getElementById('p_referredBy').value.trim(),
    };
    const patient = await api('/patients', { method: 'POST', body: JSON.stringify(payload) });
    selectPatient(patient);
    showToast('Patient registered: ' + patient.patientId, 'success');
    btn.disabled = false;
    btn.textContent = 'Register Another Patient';
  } catch (err) {
    showToast(err.message, 'error');
    btn.disabled = false;
    btn.textContent = 'Register Patient';
  }
});

document.getElementById('addTestBtn').addEventListener('click', async () => {
  if (!currentPatientId) return;
  const reportId = document.getElementById('reportIdInput').value.trim();
  const testCatalogIds = Array.from(document.querySelectorAll('.testCheck:checked')).map((c) => c.value);
  if (!reportId) {
    showToast('Enter a Report ID.', 'error');
    return;
  }
  if (!testCatalogIds.length) {
    showToast('Select at least one test panel.', 'error');
    return;
  }
  try {
    const report = await api('/results', { method: 'POST', body: JSON.stringify({ reportId, patientId: currentPatientId, testCatalogIds }) });
    const row = document.createElement('tr');
    row.innerHTML = '<td class="id-cell">' + report.reportId + '</td><td>' + report.testNames + '</td>' +
      '<td><span class="badge ' + statusBadgeClass(report.status) + '">' + report.status + '</span></td>' +
      '<td><a class="btn btn-sm btn-outline" href="/results.html?open=' + report._id + '">Enter Values</a></td>';
    const body = document.getElementById('orderedBody');
    if (body.querySelector('.empty-state')) body.innerHTML = '';
    body.prepend(row);
    document.getElementById('reportIdInput').value = '';
    document.querySelectorAll('.testCheck:checked').forEach((c) => (c.checked = false));
    showToast('Report ' + report.reportId + ' created with ' + testCatalogIds.length + ' test(s)', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadCatalog();`;

  return renderPage({ title: 'Sample Registration', body, pageScript });
}

module.exports = registrationPage;