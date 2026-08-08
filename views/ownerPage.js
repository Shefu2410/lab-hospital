const { renderPage } = require('./shell');

function ownerPage() {

  const body = `
<div class="page-container">

  <!-- ======================================================
       OWNER LOGIN
       ====================================================== -->

  <div class="card" style="max-width:600px;margin:0 auto 24px;">

    <h1 style="margin-bottom:8px;">
      Owner Panel
    </h1>

    <p class="subtitle">
      Enter your owner secret key to manage registered laboratories.
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
      Open Owner Panel
    </button>

  </div>


  <!-- ======================================================
       LAB MANAGEMENT
       ====================================================== -->

  <div
    class="card"
    id="labsCard"
    style="display:none;"
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
        <h2 style="margin:0 0 5px;">
          Laboratory Management
        </h2>

        <p class="subtitle" style="margin:0;">
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


    <!-- ====================================================
         MESSAGE
         ==================================================== -->

    <div
      id="actionMessage"
      style="
        display:none;
        padding:12px 15px;
        border-radius:8px;
        margin-bottom:15px;
        font-size:14px;
      "
    ></div>


    <!-- ====================================================
         LAB TABLE
         ==================================================== -->

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
              LAB CODE
            </th>

            <th style="padding:12px;">
              LAB NAME
            </th>

            <th style="padding:12px;">
              EMAIL
            </th>

            <th style="padding:12px;">
              ADMIN
            </th>

            <th style="padding:12px;">
              STATUS
            </th>

            <th style="padding:12px;">
              ACTION
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


  // ==========================================================
  // JAVASCRIPT
  // ==========================================================

  const pageScript = `

const keyInput = document.getElementById('ownerKeyInput');
const keyError = document.getElementById('keyError');

const loadBtn = document.getElementById('loadLabsBtn');
const refreshBtn = document.getElementById('refreshBtn');
const forgetBtn = document.getElementById('forgetKeyBtn');

const labsCard = document.getElementById('labsCard');
const tbody = document.getElementById('labsTbody');

const actionMessage = document.getElementById('actionMessage');


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
// ESCAPE HTML
// ============================================================
// Prevents lab names/emails from breaking the HTML.
// ============================================================

function escapeHtml(value) {

  if (value === null || value === undefined) {
    return '';
  }

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

}


// ============================================================
// OWNER API REQUEST
// ============================================================

async function ownerFetch(path, options = {}) {

  const key = getOwnerKey();

  const headers = Object.assign(
    {
      'Content-Type': 'application/json',
      'x-owner-key': key
    },
    options.headers || {}
  );

  const response = await fetch(
    '/api' + path,
    Object.assign(
      {},
      options,
      {
        headers
      }
    )
  );

  let data = null;

  try {

    data = await response.json();

  } catch (error) {

    data = null;

  }


  if (!response.ok) {

    throw new Error(
      (data && data.message)
        ? data.message
        : 'Request failed (' + response.status + ')'
    );

  }

  return data;

}


// ============================================================
// MESSAGE
// ============================================================

function showMessage(message, type) {

  actionMessage.textContent = message;

  actionMessage.style.display = 'block';

  if (type === 'success') {

    actionMessage.style.background = '#e3f6ec';
    actionMessage.style.color = '#087443';

  } else {

    actionMessage.style.background = '#fde8e8';
    actionMessage.style.color = '#b42318';

  }

}


function hideMessage() {

  actionMessage.style.display = 'none';

}


// ============================================================
// RENDER LABS
// ============================================================

function renderLabs(labs) {

  if (!Array.isArray(labs) || labs.length === 0) {

    tbody.innerHTML = \`
      <tr>
        <td
          colspan="6"
          style="
            padding:30px;
            text-align:center;
            color:#64748b;
          "
        >
          No laboratories registered yet.
        </td>
      </tr>
    \`;

    return;

  }


  tbody.innerHTML = labs.map(function(lab) {

    // --------------------------------------------------------
    // IMPORTANT:
    // Use the record's unique id for approval/rejection/revoke.
    //
    // Do NOT use labCode here because pending labs don't
    // have a lab code yet.
    //
    // Support multiple possible id field names, since the
    // backend may serialize Mongo's "_id" as "_id", "id",
    // or a custom "labId" depending on the schema/toJSON setup.
    // --------------------------------------------------------

    const labId =
      lab._id ||
      lab.id ||
      lab.labId ||
      lab.uuid ||
      '';


    // --------------------------------------------------------
    // Support both possible field names.
    // --------------------------------------------------------

    const labCode =
      lab.labCode ||
      lab.code ||
      'Not assigned';


    const labName =
      lab.labName ||
      lab.name ||
      '—';


    const email =
      lab.email ||
      '—';


    const adminName =
      lab.adminName ||
      lab.ownerName ||
      '—';


    const status =
      (lab.status || 'pending').toLowerCase();


    // --------------------------------------------------------
    // STATUS
    // --------------------------------------------------------

    let statusHtml = '';


    if (status === 'approved') {

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

    } else if (status === 'rejected') {

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

    } else {

      statusHtml = \`
        <span
          style="
            color:#c27a00;
            font-weight:600;
          "
        >
          Pending
        </span>
      \`;

    }


    // --------------------------------------------------------
    // ACTION BUTTON
    // --------------------------------------------------------

    let actionHtml = '';


    if (!labId) {

      // No usable id came back from the backend for this
      // record at all - don't render a button that can only
      // ever fail, show a clear message instead.

      actionHtml = \`
        <span style="color:#b42318;">
          Missing lab ID (check API response)
        </span>
      \`;

    } else if (status === 'pending') {

      actionHtml = \`

        <button
          type="button"
          class="btn btn-primary approveBtn"
          data-id="\${escapeHtml(labId)}"
        >
          Approve
        </button>

        <button
          type="button"
          class="btn btn-secondary rejectBtn"
          data-id="\${escapeHtml(labId)}"
          style="margin-left:5px;"
        >
          Reject
        </button>

      \`;

    } else if (status === 'approved') {

      actionHtml = \`

        <button
          type="button"
          class="btn btn-secondary revokeBtn"
          data-id="\${escapeHtml(labId)}"
        >
          Revoke
        </button>

      \`;

    } else {

      actionHtml = \`
        <span style="color:#64748b;">
          No action
        </span>
      \`;

    }


    // --------------------------------------------------------
    // TABLE ROW
    // --------------------------------------------------------

    return \`

      <tr
        style="
          border-bottom:1px solid #e5e7eb;
        "
      >

        <td
          style="
            padding:12px;
            font-weight:600;
            color:#087f7f;
          "
        >
          \${escapeHtml(labCode)}
        </td>

        <td style="padding:12px;">
          \${escapeHtml(labName)}
        </td>

        <td style="padding:12px;">
          \${escapeHtml(email)}
        </td>

        <td style="padding:12px;">
          \${escapeHtml(adminName)}
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

  tbody
    .querySelectorAll('.approveBtn')
    .forEach(function(button) {

      button.addEventListener('click', async function() {

        const id = button.dataset.id;

        if (!id) {

          alert('Lab ID is missing.');

          return;

        }


        const confirmed = confirm(
          'Approve this laboratory?\\\\n\\\\n' +
          'A unique lab code will be generated automatically.'
        );


        if (!confirmed) {
          return;
        }


        button.disabled = true;
        button.textContent = 'Approving...';


        await handleAction(id, 'approve');

      });

    });


  // ==========================================================
  // REJECT BUTTONS
  // ==========================================================

  tbody
    .querySelectorAll('.rejectBtn')
    .forEach(function(button) {

      button.addEventListener('click', async function() {

        const id = button.dataset.id;

        if (!id) {

          alert('Lab ID is missing.');

          return;

        }


        const confirmed = confirm(
          'Reject this laboratory registration?'
        );


        if (!confirmed) {
          return;
        }


        button.disabled = true;
        button.textContent = 'Rejecting...';


        await handleAction(id, 'reject');

      });

    });


  // ==========================================================
  // REVOKE BUTTONS
  // ==========================================================

  tbody
    .querySelectorAll('.revokeBtn')
    .forEach(function(button) {

      button.addEventListener('click', async function() {

        const id = button.dataset.id;

        if (!id) {

          alert('Lab ID is missing.');

          return;

        }


        const confirmed = confirm(
          'Revoke this laboratory access?'
        );


        if (!confirmed) {
          return;
        }


        button.disabled = true;
        button.textContent = 'Revoking...';


        await handleAction(id, 'revoke');

      });

    });

}


// ============================================================
// APPROVE / REJECT / REVOKE
// ============================================================

async function handleAction(id, action) {

  try {

    hideMessage();


    await ownerFetch(
      '/labs/owner/' + id + '/' + action,
      {
        method: 'PUT'
      }
    );


    if (action === 'approve') {

      showMessage(
        'Laboratory approved successfully. Lab code has been generated.',
        'success'
      );

    } else if (action === 'reject') {

      showMessage(
        'Laboratory registration rejected.',
        'success'
      );

    } else if (action === 'revoke') {

      showMessage(
        'Laboratory access revoked.',
        'success'
      );

    }


    await loadLabs();


  } catch (error) {

    showMessage(
      error.message || 'Action failed.',
      'error'
    );

    await loadLabs();

  }

}


// ============================================================
// LOAD LABORATORIES
// ============================================================

async function loadLabs() {

  try {

    hideMessage();


    const labs = await ownerFetch(
      '/labs/owner/all'
    );


    labsCard.style.display = 'block';


    renderLabs(labs);


  } catch (error) {

    labsCard.style.display = 'none';


    keyError.textContent =
      error.message ||
      'Could not load laboratories. Check your owner key.';


    keyError.style.display = 'block';

  }

}


// ============================================================
// OPEN OWNER PANEL
// ============================================================

loadBtn.addEventListener(
  'click',
  async function() {

    keyError.style.display = 'none';


    const key = keyInput.value.trim();


    if (!key) {

      keyError.textContent =
        'Please enter your owner secret key.';

      keyError.style.display = 'block';

      return;

    }


    loadBtn.disabled = true;
    loadBtn.textContent = 'Checking...';


    setOwnerKey(key);


    await loadLabs();


    loadBtn.disabled = false;
    loadBtn.textContent = 'Open Owner Panel';

  }
);


// ============================================================
// REFRESH
// ============================================================

refreshBtn.addEventListener(
  'click',
  async function() {

    refreshBtn.disabled = true;
    refreshBtn.textContent = 'Refreshing...';


    await loadLabs();


    refreshBtn.disabled = false;
    refreshBtn.textContent = 'Refresh';

  }
);


// ============================================================
// LOGOUT OWNER
// ============================================================

forgetBtn.addEventListener(
  'click',
  function() {

    clearOwnerKey();


    labsCard.style.display = 'none';

    keyInput.value = '';

    hideMessage();

    keyError.style.display = 'none';


    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });

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


  // ==========================================================
  // EXTRA STYLE
  // ==========================================================

  const extraStyle = `

.page-container {
  padding: 30px;
}

.card {
  background: #ffffff;
  border: 1px solid #e2e8e8;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.04);
}

.subtitle {
  color: #64748b;
  font-size: 14px;
}

.field {
  margin-top: 16px;
}

.field label {
  display: block;
  margin-bottom: 7px;
  font-weight: 600;
}

.field input {
  width: 100%;
  box-sizing: border-box;
}

.form-error {
  background: #fde8e8;
  color: #b42318;
  padding: 12px 14px;
  border-radius: 8px;
  margin: 14px 0;
  font-size: 14px;
}

.btn {
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

`;


  return renderPage({
    title: 'Owner Panel',
    body,
    pageScript,
    extraStyle
  });
}


module.exports = ownerPage;