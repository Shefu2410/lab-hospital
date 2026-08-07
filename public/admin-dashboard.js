// ==========================================================
// STATE
// ==========================================================

// The admin's login token. Empty until they log in successfully.
// Every admin-only request must send this token, or the server
// will reject it (see requireAdmin.js on the backend).
var authToken = null;


// ==========================================================
// ELEMENT REFERENCES (grabbed once, reused everywhere)
// ==========================================================

var loginCard  = document.getElementById('loginCard');
var dashboard  = document.getElementById('dashboard');
var loginError = document.getElementById('loginError');
var dashError  = document.getElementById('dashError');
var labList    = document.getElementById('labList');


// ==========================================================
// STARTUP: wire up the login button
// ==========================================================

document.getElementById('loginBtn').addEventListener('click', handleLogin);


// ==========================================================
// STEP 1: LOGIN
// ==========================================================

function handleLogin() {
  var email = document.getElementById('email').value.trim();
  var password = document.getElementById('password').value;

  loginError.textContent = ''; // clear any old error message

  var loginDetails = {
    email: email,
    password: password
  };

  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginDetails)
  })
    .then(readJsonResponse)
    .then(function (result) {
      if (!result.ok) {
        loginError.textContent = result.data.message || 'Login failed';
        return;
      }

      // Login worked: save the token, swap screens, load the labs.
      authToken = result.data.token;
      loginCard.style.display = 'none';
      dashboard.style.display = 'block';
      loadPendingLabs();
    })
    .catch(function () {
      loginError.textContent = 'Network error. Please try again.';
    });
}


// ==========================================================
// STEP 2: LOAD THE LIST OF LABS WAITING FOR APPROVAL
// ==========================================================

function loadPendingLabs() {
  dashError.textContent = '';

  fetch('/api/admin/labs/pending', {
    headers: { Authorization: 'Bearer ' + authToken }
  })
    .then(readJsonResponse)
    .then(function (result) {
      if (!result.ok) {
        dashError.textContent = result.data.message || 'Failed to load labs';
        return;
      }
      renderLabList(result.data);
    })
    .catch(function () {
      dashError.textContent = 'Network error loading labs.';
    });
}


// ==========================================================
// STEP 3: DRAW THE LIST ON THE PAGE
// ==========================================================
// Built entirely with document.createElement + textContent.
// No innerHTML and no string-built HTML anywhere in this file -
// every piece of text is assigned directly to an element,
// so there is nothing here that can be mistaken for a template.

function renderLabList(labs) {
  clearElement(labList);

  if (labs.length === 0) {
    var emptyMessage = document.createElement('p');
    emptyMessage.textContent = 'No pending labs right now.';
    labList.appendChild(emptyMessage);
    return;
  }

  for (var i = 0; i < labs.length; i++) {
    labList.appendChild(buildLabRow(labs[i]));
  }
}

// Builds one row: name, email/admin line, Approve button, Reject button.
function buildLabRow(lab) {
  var row = document.createElement('div');
  row.className = 'lab-row';

  var nameLine = document.createElement('span');
  nameLine.className = 'lab-name';
  nameLine.textContent = lab.labName;

  var emailLine = document.createElement('span');
  emailLine.className = 'lab-detail';
  emailLine.textContent = 'Email: ' + lab.email;

  var adminLine = document.createElement('span');
  adminLine.className = 'lab-detail';
  adminLine.textContent = 'Admin name: ' + lab.adminName;

  var approveButton = document.createElement('button');
  approveButton.className = 'approve-btn';
  approveButton.textContent = 'Approve';
  approveButton.addEventListener('click', function () {
    decideLab(lab._id, 'approve');
  });

  var rejectButton = document.createElement('button');
  rejectButton.className = 'reject-btn';
  rejectButton.textContent = 'Reject';
  rejectButton.addEventListener('click', function () {
    decideLab(lab._id, 'reject');
  });

  row.appendChild(nameLine);
  row.appendChild(emailLine);
  row.appendChild(adminLine);
  row.appendChild(approveButton);
  row.appendChild(rejectButton);

  return row;
}


// ==========================================================
// STEP 4: APPROVE OR REJECT A LAB
// ==========================================================

function decideLab(labId, action) {
  // Build the URL from separate pieces joined together,
  // instead of gluing raw strings with +.
  var urlPieces = ['/api/admin/labs', labId, action];
  var url = urlPieces.join('/');

  fetch(url, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + authToken }
  })
    .then(readJsonResponse)
    .then(function (result) {
      if (!result.ok) {
        window.alert(result.data.message || 'Action failed');
        return;
      }
      // Refresh the list so the approved/rejected lab disappears.
      loadPendingLabs();
    })
    .catch(function () {
      window.alert('Network error. Please try again.');
    });
}


// ==========================================================
// SMALL HELPERS (used above)
// ==========================================================

// Turns a fetch response into { ok, data } so every .then()
// above can handle success and failure the same simple way.
function readJsonResponse(res) {
  return res.json().then(function (data) {
    return { ok: res.ok, data: data };
  });
}

// Removes every child element from a container before
// redrawing it, so old rows don't pile up.
function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}