const { renderPage } = require('./shell');

function ownerPage() {
  const body = `
<div class="page-container">

  <!-- Owner Login -->
  <div class="card" style="max-width:520px;margin:0 auto 24px;">
    
    <h1>Owner Panel</h1>

    <p class="subtitle">
      Enter the owner secret key to manage registered laboratories.
    </p>

    <div class="field">
      <label for="ownerKeyInput">
        Owner Secret Key
      </label>

      <input
        type="password"
        id="ownerKeyInput"
        placeholder="Enter owner secret key"
        autocomplete="off"
      />
    </div>

    <div
      id="keyError"
      class="form-error"
      style="display:none;"
    ></div>

    <button
      type="button"
      id="loadLabsBtn"
      class="btn btn-primary btn-block"
    >
      Access Owner Panel
    </button>

  </div>


  <!-- Labs Management -->
  <div
    class="card"
    id="labsCard"
    style="display:none;max-width:1100px;margin:0 auto;"
  >

    <div
      style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:15px;
        margin-bottom:20px;
      "
    >

      <div>
        <h2 style="margin:0;">
          Laboratory Management
        </h2>

        <p
          class="subtitle"
          style="margin-top:6px;"
        >
          Review and manage laboratory registrations.
        </p>
      </div>

      <div style="display:flex;gap:8px;">

        <button
          type="button"
          id="refreshBtn"
          class="btn btn-secondary"
        >
          Refresh
        </button>

        <button
          type="button"
          id="forgetKeyBtn"
          class="btn btn-secondary"
        >
          Logout Owner
        </button>

      </div>

    </div>


    <!-- Message -->
    <div
      id="labsMessage"
      style="
        display:none;
        padding:12px 14px;
        border-radius:8px;
        margin-bottom:16px;
        font-size:14px;
      "
    ></div>


    <!-- Labs Table -->
    <div style="overflow-x:auto;">

      <table
        style="
          width:100%;
          border-collapse:collapse;
          min-width:800px;
        "
      >

        <thead>

          <tr
            style="
              text-align:left;
              border-bottom:2px solid #e2e8e8;
            "
          >

            <th style="padding:12px;">
              Lab Code
            </th>

            <th style="padding:12px;">
              Lab Name
            </th>

            <th style="padding:12px;">
              Email
            </th>

            <th style="padding:12px;">
              Admin
            </th>

            <th style="padding:12px;">
              Status
            </th>

            <th style="padding:12px;">
              Action
            </th>

          </tr>

        </thead>

        <tbody id="labsTbody">

        </tbody>

      </table>

    </div>

  </div>

</div>
`;


  const pageScript = `

const keyInput = document.getElementById('ownerKeyInput');

const keyError = document.getElementById('keyError');

const loadBtn = document.getElementById('loadLabsBtn');

const refreshBtn = document.getElementById('refreshBtn');

const forgetBtn = document.getElementById('forgetKeyBtn');

const labsCard = document.getElementById('labsCard');

const labsTbody = document.getElementById('labsTbody');

const labsMessage = document.getElementById('labsMessage');


// ============================================================
// OWNER KEY
// ============================================================

function getOwnerKey() {
  return sessionStorage.getItem('owner_key') || '';
}


function setOwnerKey(key) {
  sessionStorage.setItem('owner_key', key);
}


function clearOwnerKey() {
  sessionStorage.removeItem('owner_key');
}


// ============================================================
// SHOW ERROR
// ============================================================

function showKeyError(message) {

  keyError.textContent = message;

  keyError.style.display = 'block';

}


// ============================================================
// HIDE ERROR
// ============================================================

function hideKeyError() {

  keyError.textContent = '';

  keyError.style.display = 'none';

}


// ============================================================
// SHOW MESSAGE
// ============================================================

function showMessage(message, success = true) {

  labsMessage.textContent = message;

  labsMessage.style.display = 'block';

  if (success) {

    labsMessage.style.background = '#e3f6ec';

    labsMessage.style.color = '#087443';

  } else {

    labsMessage.style.background = '#fdecec';

    labsMessage.style.color = '#b42318';

  }

}


// ============================================================
// OWNER API REQUEST
// ============================================================

async function ownerFetch(path, options = {}) {

  const key = getOwnerKey();

  const headers = {

    'Content-Type': 'application/json',

    'x-owner-key': key,

    ...(options.headers || {})

  };


  const response = await fetch(

    '/api' + path,

    {
      ...options,
      headers
    }

  );


  let data = null;


  try {

    data = await response.json();

  } catch (error) {

    data = null;

  }


  if (!response.ok) {

    throw new Error(

      data?.message ||

      'Request failed. Please check your owner key.'

    );

  }


  return data;

}


// ============================================================
// RENDER LABS
// ============================================================

function renderLabs(labs) {

  if (!labs || labs.length === 0) {

    labsTbody.innerHTML = \`
      <tr>
        <td
          colspan="6"
          style="
            padding:30px;
            text-align:center;
            color:var(--ink-soft);
          "
        >
          No laboratories registered yet.
        </td>
      </tr>
    \`;

    return;

  }


  labsTbody.innerHTML = labs.map((lab) => {

    let statusHtml = '';

    let actionHtml = '';


    // --------------------------------------------------------
    // PENDING
    // --------------------------------------------------------

    if (lab.status === 'pending') {

      statusHtml = \`
        <span
          style="
            color:#c47b00;
            font-weight:600;
          "
        >
          Pending
        </span>
      \`;


      actionHtml = \`
        <button
          type="button"
          class="btn btn-primary approveBtn"
          data-code="\${lab.code}"
        >
          Approve
        </button>

        <button
          type="button"
          class="btn btn-secondary rejectBtn"
          data-code="\${lab.code}"
          style="margin-left:6px;"
        >
          Reject
        </button>
      \`;

    }


    // --------------------------------------------------------
    // APPROVED
    // --------------------------------------------------------

    else if (lab.status === 'approved') {

      statusHtml = \`
        <span
          style="
            color:#087443;
            font-weight:600;
          "
        >
          Approved
        </span>
      \`;


      actionHtml = \`
        <button
          type="button"
          class="btn btn-secondary revokeBtn"
          data-code="\${lab.code}"
        >
          Revoke
        </button>
      \`;

    }


    // --------------------------------------------------------
    // REJECTED
    // --------------------------------------------------------

    else if (lab.status === 'rejected') {

      statusHtml = \`
        <span
          style="
            color:#b42318;
            font-weight:600;
          "
        >
          Rejected
        </span>
      \`;


      actionHtml = \`
        <button
          type="button"
          class="btn btn-primary approveBtn"
          data-code="\${lab.code}"
        >
          Approve
        </button>
      \`;

    }


    // --------------------------------------------------------
    // UNKNOWN STATUS
    // --------------------------------------------------------

    else {

      statusHtml = \`
        <span style="font-weight:600;">
          \${lab.status || 'Unknown'}
        </span>
      \`;

    }


    return \`

      <tr
        style="
          border-bottom:1px solid #eee;
        "
      >

        <td
          style="
            padding:12px;
            font-weight:600;
          "
        >
          \${lab.code || 'Not assigned'}
        </td>


        <td style="padding:12px;">
          \${lab.labName || '—'}
        </td>


        <td style="padding:12px;">
          \${lab.email || '—'}
        </td>


        <td style="padding:12px;">
          \${lab.adminName || '—'}
        </td>


        <td style="padding:12px;">
          \${statusHtml}
        </td>


        <td style="padding:12px;">
          \${actionHtml}
        </td>

      </tr>

    \`;

  }).join('');


  // ==========================================================
  // APPROVE BUTTONS
  // ==========================================================

  document
    .querySelectorAll('.approveBtn')
    .forEach((button) => {

      button.addEventListener('click', () => {

        handleLabAction(
          button.dataset.code,
          'approve'
        );

      });

    });


  // ==========================================================
  // REJECT BUTTONS
  // ==========================================================

  document
    .querySelectorAll('.rejectBtn')
    .forEach((button) => {

      button.addEventListener('click', () => {

        handleLabAction(
          button.dataset.code,
          'reject'
        );

      });

    });


  // ==========================================================
  // REVOKE BUTTONS
  // ==========================================================

  document
    .querySelectorAll('.revokeBtn')
    .forEach((button) => {

      button.addEventListener('click', () => {

        handleLabAction(
          button.dataset.code,
          'revoke'
        );

      });

    });

}


// ============================================================
// APPROVE / REJECT / REVOKE
// ============================================================

async function handleLabAction(code, action) {

  let message = '';

  if (action === 'approve') {

    message =
      'Are you sure you want to approve this laboratory?';

  }

  if (action === 'reject') {

    message =
      'Are you sure you want to reject this laboratory?';

  }

  if (action === 'revoke') {

    message =
      'Are you sure you want to revoke this laboratory approval?';

  }


  if (!confirm(message)) {

    return;

  }


  try {

    showMessage(
      'Processing request...',
      true
    );


    await ownerFetch(

      '/labs/owner/' +
      encodeURIComponent(code) +
      '/' +
      action,

      {
        method: 'PUT'
      }

    );


    if (action === 'approve') {

      showMessage(
        'Lab approved successfully.',
        true
      );

    }

    else if (action === 'reject') {

      showMessage(
        'Lab rejected successfully.',
        true
      );

    }

    else {

      showMessage(
        'Lab approval revoked.',
        true
      );

    }


    await loadLabs();


  } catch (error) {

    showMessage(
      error.message ||
      'Unable to complete the request.',
      false
    );

  }

}


// ============================================================
// LOAD LABS
// ============================================================

async function loadLabs() {

  try {

    loadBtn.disabled = true;

    loadBtn.textContent = 'Loading...';


    const labs = await ownerFetch(
      '/labs/owner/all'
    );


    labsCard.style.display = 'block';

    renderLabs(labs);


    loadBtn.style.display = 'none';

    keyInput.disabled = true;


  } catch (error) {

    labsCard.style.display = 'none';

    showKeyError(
      error.message ||
      'Could not load laboratories.'
    );


    clearOwnerKey();

  }

  finally {

    loadBtn.disabled = false;

    loadBtn.textContent = 'Access Owner Panel';

  }

}


// ============================================================
// ACCESS OWNER PANEL
// ============================================================

loadBtn.addEventListener(
  'click',
  async () => {

    hideKeyError();

    const key = keyInput.value.trim();


    if (!key) {

      showKeyError(
        'Please enter the owner secret key.'
      );

      return;

    }


    setOwnerKey(key);

    await loadLabs();

  }
);


// ============================================================
// ENTER KEY SUPPORT
// ============================================================

keyInput.addEventListener(
  'keydown',
  (event) => {

    if (event.key === 'Enter') {

      loadBtn.click();

    }

  }
);


// ============================================================
// REFRESH
// ============================================================

refreshBtn.addEventListener(
  'click',
  async () => {

    hideKeyError();

    await loadLabs();

  }
);


// ============================================================
// LOGOUT / FORGET KEY
// ============================================================

forgetBtn.addEventListener(
  'click',
  () => {

    clearOwnerKey();

    labsCard.style.display = 'none';

    keyInput.disabled = false;

    keyInput.value = '';

    loadBtn.style.display = 'block';

    hideKeyError();

    labsMessage.style.display = 'none';

  }
);


// ============================================================
// AUTO LOAD
// ============================================================

if (getOwnerKey()) {

  keyInput.value = getOwnerKey();

  loadLabs();

}

`;


  return renderPage({
    title: 'Owner — Approve Labs',
    body,
    pageScript
  });
}


module.exports = ownerPage;