const { renderPage } = require('./shell');

function catalogPage() {
  const body = `
<div class="app-shell">
  <nav class="sidebar" id="sidebar"></nav>
  <div class="main">
    <div class="topbar">
      <div>
        <h1>Test Catalog</h1>
        <div class="crumb">Panels and reference ranges used across the lab</div>
      </div>
    </div>

    <div class="content">
      <div class="grid-2">
        <div>
          <div class="card">
            <div class="card-head"><h3>Existing Panels</h3><span class="hint">Click Edit to change a panel, including its price</span></div>
            <table>
              <thead><tr><th>Code</th><th>Name</th><th>Department</th><th>Params</th><th>Price</th><th></th></tr></thead>
              <tbody id="catalogBody"><tr><td colspan="6" class="empty-state">Loading…</td></tr></tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-head"><h3 id="formTitle">Add New Panel</h3><span class="hint" id="formHint">Saved directly to MongoDB</span></div>
          <div class="field-row">
            <div class="field"><label>Code *</label><input id="t_code" placeholder="e.g. TFT" required /></div>
            <div class="field"><label>Department</label><input id="t_department" placeholder="Biochemistry" /></div>
          </div>
          <div class="field"><label>Name *</label><input id="t_name" placeholder="e.g. Thyroid Function Test" required /></div>
          <div class="field"><label>Price (₹)</label><input id="t_price" type="number" min="0" value="0" /></div>

          <div class="section-title">Parameters</div>
          <div id="paramList"></div>
          <button class="btn btn-ghost btn-sm" id="addParamRow" type="button">+ Add Parameter</button>
          <button class="btn btn-primary btn-block" style="margin-top:18px;" id="saveTestBtn">Save Panel</button>
          <button class="btn btn-ghost btn-block" style="margin-top:8px;display:none;" id="cancelEditBtn" type="button">Cancel edit</button>
        </div>
      </div>
    </div>
  </div>
</div>`;

  const pageScript = `
requireLogin();
renderSidebar('catalog');

let editingId = null; // set while editing an existing panel, null while adding a new one

function enterEditMode(test) {
  editingId = test._id;
  document.getElementById('formTitle').textContent = 'Edit Panel: ' + test.code;
  document.getElementById('formHint').textContent = 'Editing an existing panel - Save will update it.';
  document.getElementById('saveTestBtn').textContent = 'Update Panel';
  document.getElementById('cancelEditBtn').style.display = 'block';

  document.getElementById('t_code').value = test.code;
  document.getElementById('t_name').value = test.name;
  document.getElementById('t_department').value = test.department;
  document.getElementById('t_price').value = test.price;

  document.getElementById('paramList').innerHTML = '';
  if (test.parameters.length) {
    test.parameters.forEach((p) => addParamRow(p));
  } else {
    addParamRow();
  }

  document.getElementById('formTitle').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function exitEditMode() {
  editingId = null;
  document.getElementById('formTitle').textContent = 'Add New Panel';
  document.getElementById('formHint').textContent = 'Saved directly to MongoDB';
  document.getElementById('saveTestBtn').textContent = 'Save Panel';
  document.getElementById('cancelEditBtn').style.display = 'none';

  document.getElementById('t_code').value = '';
  document.getElementById('t_name').value = '';
  document.getElementById('t_department').value = '';
  document.getElementById('t_price').value = 0;
  document.getElementById('paramList').innerHTML = '';
  addParamRow();
}

document.getElementById('cancelEditBtn').addEventListener('click', exitEditMode);

let catalogCache = [];

async function loadCatalog() {
  const body = document.getElementById('catalogBody');
  try {
    const tests = await api('/tests');
    catalogCache = tests;
    if (!tests.length) {
      body.innerHTML = '<tr><td colspan="6"><div class="empty-state">No panels yet. Run <code>npm run seed</code> or add one.</div></td></tr>';
      return;
    }
    body.innerHTML = tests.map((t) =>
      '<tr><td class="id-cell">' + t.code + '</td><td>' + t.name + '</td><td>' + t.department + '</td><td>' + t.parameters.length + '</td><td>₹' + t.price + '</td>' +
      '<td><button type="button" class="btn btn-ghost btn-sm" onclick="editTest(\\'' + t._id + '\\')">Edit</button></td></tr>'
    ).join('');
  } catch (err) {
    body.innerHTML = '<tr><td colspan="6"><div class="empty-state">' + err.message + '</div></td></tr>';
  }
}

function editTest(id) {
  const test = catalogCache.find((t) => t._id === id);
  if (!test) return;
  enterEditMode(test);
}
window.editTest = editTest;

function addParamRow(vals = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'field-row';
  wrap.style.alignItems = 'flex-end';
  wrap.innerHTML =
    '<div class="field" style="flex:2;"><label>Parameter</label><input class="pn" value="' + (vals.name || '') + '" placeholder="e.g. Urea" /></div>' +
    '<div class="field"><label>Unit</label><input class="pu" value="' + (vals.unit || '') + '" placeholder="mg/dL" /></div>' +
    '<div class="field"><label>Min</label><input class="pmin" type="number" step="any" value="' + (vals.normalMin ?? '') + '" /></div>' +
    '<div class="field"><label>Max</label><input class="pmax" type="number" step="any" value="' + (vals.normalMax ?? '') + '" /></div>' +
    '<button type="button" class="btn btn-ghost btn-sm" onclick="this.parentElement.remove()">✕</button>';
  document.getElementById('paramList').appendChild(wrap);
}

document.getElementById('addParamRow').addEventListener('click', () => addParamRow());
addParamRow();

document.getElementById('saveTestBtn').addEventListener('click', async () => {
  const parameters = Array.from(document.querySelectorAll('#paramList .field-row')).map((row) => ({
    name: row.querySelector('.pn').value.trim(),
    unit: row.querySelector('.pu').value.trim(),
    normalMin: row.querySelector('.pmin').value === '' ? undefined : Number(row.querySelector('.pmin').value),
    normalMax: row.querySelector('.pmax').value === '' ? undefined : Number(row.querySelector('.pmax').value),
  })).filter((p) => p.name);

  const payload = {
    code: document.getElementById('t_code').value.trim(),
    name: document.getElementById('t_name').value.trim(),
    department: document.getElementById('t_department').value.trim() || 'Biochemistry',
    price: Number(document.getElementById('t_price').value) || 0,
    parameters,
  };

  if (!payload.code || !payload.name || !parameters.length) {
    showToast('Code, name and at least one parameter are required.', 'error');
    return;
  }

  try {
    if (editingId) {
      await api('/tests/' + editingId, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Test panel updated.', 'success');
    } else {
      await api('/tests', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Test panel saved.', 'success');
    }
    exitEditMode();
    loadCatalog();
  } catch (err) {
    showToast(err.message, 'error');
  }
});

loadCatalog();`;

  return renderPage({ title: 'Test Catalog', body, pageScript });
}

module.exports = catalogPage;