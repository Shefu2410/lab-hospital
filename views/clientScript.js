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
}
function requireLogin() {
  if (!getToken()) window.location.href = '/index.html';
}
function logout() {
  clearSession();
  window.location.href = '/index.html';
}

// ---- API wrapper ----
async function api(path, options = {}) {
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    getToken() ? { Authorization: 'Bearer ' + getToken() } : {},
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
    '<div class="brand">RKH Cross LIMS' +
    (user ? '<div style="font-weight:400;font-size:11px;color:#9fb0b0;margin-top:4px;">' + user.name + ' &middot; ' + user.role + '</div>' : '') +
    '</div>' +
    links +
    '<a href="#" class="logout" onclick="logout();return false;">Log out</a>';
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
