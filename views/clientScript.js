// Shared browser-side helpers, generated as a JS string and inlined into every
// page by views/shell.js. This replaces the old static js/api.js + js/layout.js
// files - all frontend logic now lives inside the backend as JS.
module.exports = `
// ---- session helpers ----
function getToken() { return localStorage.getItem('lims_token'); }
function getUser() {
  try { return JSON.parse(localStorage.getItem('lims_user') || 'null'); }
  catch (e) { return null; }
}
function setSession(token, user) {
  localStorage.setItem('lims_token', token);
  localStorage.setItem('lims_user', JSON.stringify(user));
}
function clearSession() {
  localStorage.removeItem('lims_token');
  localStorage.removeItem('lims_user');
  localStorage.removeItem('lims_acting_lab');
}
function requireLogin() {
  if (!getToken()) window.location.href = '/index.html';
}
function requireSuperadmin() {
  if (!getToken()) { window.location.href = '/index.html'; return; }
  const user = getUser();
  if (!user || user.role !== 'superadmin') { window.location.href = '/dashboard.html'; }
}
function logout() {
  clearSession();
  window.location.href = '/index.html';
}

// ---- superadmin "acting as lab" helpers ----
// Superadmin accounts have no lab of their own, so lab-scoped routes
// (patients, results, etc.) need to know which lab to act on behalf of.
// This is stored separately from the session so it survives independently
// of login/logout, and is only ever read/sent for superadmin users.
function getActingLab() {
  try { return JSON.parse(localStorage.getItem('lims_acting_lab') || 'null'); }
  catch (e) { return null; }
}
function setActingLab(lab) {
  if (lab) localStorage.setItem('lims_acting_lab', JSON.stringify(lab));
  else localStorage.removeItem('lims_acting_lab');
}

// ---- API wrapper ----
async function api(path, options = {}) {
  const user = getUser();
  const actingLab = user && user.role === 'superadmin' ? getActingLab() : null;
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    getToken() ? { Authorization: 'Bearer ' + getToken() } : {},
    actingLab ? { 'x-lab-id': actingLab._id } : {},
    options.headers || {}
  );
  const res = await fetch('/api' + path, Object.assign({}, options, { headers }));
  let data = null;
  try { data = await res.json(); } catch (e) { /* no body */ }
  if (!res.ok) {
    if (res.status === 401) { clearSession(); window.location.href = '/index.html'; }
    throw new Error((data && data.message) || ('Request failed (' + res.status + ')'));
  }
  return data;
}

// ---- layout / navigation ----
const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/dashboard.html' },
  { key: 'registration', label: 'Sample Registration', href: '/registration.html' },
  { key: 'results', label: 'Test Results', href: '/results.html' },
  { key: 'catalog', label: 'Test Catalog', href: '/catalog.html' },
];

function renderSidebar(activeKey) {
  const user = getUser();
  const el = document.getElementById('sidebar');
  if (!el) return;
  const links = NAV_ITEMS.map(
    (item) => '<a href="' + item.href + '" class="' + (item.key === activeKey ? 'active' : '') + '">' + item.label + '</a>'
  ).join('');
  el.innerHTML =
    '<div class="brand">RKH LIMS' +
    (user ? '<div style="font-weight:400;font-size:11px;color:#9fb0b0;margin-top:4px;">' + user.name + ' &middot; ' + user.role + '</div>' : '') +
    '</div>' +
    (user && user.role === 'superadmin' ? '<div id="actingLabBox" style="padding:10px 16px;"></div>' : '') +
    links +
    '<a href="#" class="logout" onclick="logout();return false;">Log out</a>';

  if (user && user.role === 'superadmin') {
    renderActingLabPicker();
  }
}

async function renderActingLabPicker() {
  const box = document.getElementById('actingLabBox');
  if (!box) return;
  box.innerHTML = '<div style="font-size:11px;color:#9fb0b0;margin-bottom:4px;">Acting as lab</div><select id="actingLabSelect" style="width:100%;font-size:12px;padding:4px;"><option value="">— none —</option></select>';
  try {
    const labs = await api('/labs');
    const select = document.getElementById('actingLabSelect');
    if (!select) return;
    const current = getActingLab();
    labs.forEach((lab) => {
      const opt = document.createElement('option');
      opt.value = lab._id;
      opt.textContent = lab.name;
      if (current && current._id === lab._id) opt.selected = true;
      select.appendChild(opt);
    });
    select.addEventListener('change', () => {
      const lab = labs.find((l) => l._id === select.value);
      setActingLab(lab || null);
      window.location.reload();
    });
  } catch (err) {
    box.innerHTML = '<div style="font-size:11px;color:#e57373;">Could not load labs.</div>';
  }
}

// ---- small UI helpers shared across pages ----
function statusBadgeClass(status) {
  return {
    'Pending': 'badge-pending',
    'Tested': 'badge-tested',
    'Partial Approved': 'badge-partial',
    'Approved': 'badge-approved',
  }[status] || 'badge-pending';
}

function fmtDateTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

let toastTimer = null;
function showToast(message, type = '') {
  let el = document.getElementById('toastEl');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toastEl';
    document.body.appendChild(el);
  }
  el.className = 'toast show ' + type;
  el.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}
`;