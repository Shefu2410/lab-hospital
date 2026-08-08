const { renderPage } = require('./shell');

function signupPage() {
  const body = `
<div class="auth-screen">

  <!-- LEFT SIDE -->
  <div class="auth-visual">

    <div class="auth-brand">
      <div class="mark">RKH</div>

      <div>
        <div class="name">RKH LIMS</div>
        <div class="sub">HOSPITAL &amp; LAB MANAGEMENT SYSTEM</div>
      </div>
    </div>

    <div class="auth-quote">
      <div class="big">
        Register your laboratory.
      </div>

      <div class="meta">
        Create your laboratory account and first administrator.
        Your registration will be reviewed by the platform owner.
        After approval, your laboratory will receive a unique Lab Code
        which you can use to sign in.
      </div>
    </div>

    <div class="auth-readout">
      <div>
        <span>1</span>
        Lab registration
      </div>

      <div>
        <span>1</span>
        Admin account
      </div>

      <div>
        <span>&#10003;</span>
        Owner approval
      </div>
    </div>

  </div>


  <!-- RIGHT SIDE -->
  <div class="auth-form-wrap">

    <form class="auth-form" id="signupForm">

      <h1>Register Your Lab</h1>

      <p class="lead">
        Create an account for your laboratory.
      </p>

      <p class="lead">
        Already registered?
        <a
          href="/index.html"
          style="color:var(--teal-dark);font-weight:600;"
        >
          Sign in
        </a>
      </p>


      <!-- ERROR -->
      <div
        class="form-error"
        id="signupError"
        style="display:none;"
      ></div>


      <!-- SUCCESS -->
      <div
        class="form-success"
        id="signupSuccess"
        style="display:none;"
      ></div>


      <!-- LAB INFORMATION -->
      <div class="section-title">
        Laboratory Information
      </div>


      <div class="field">

        <label for="labName">
          Laboratory Name *
        </label>

        <input
          type="text"
          id="labName"
          placeholder="e.g. RKH Diagnostic Laboratory"
          required
        />

      </div>


      <div class="field">

        <label for="labEmail">
          Laboratory Email *
        </label>

        <input
          type="email"
          id="labEmail"
          placeholder="lab@example.com"
          required
        />

      </div>


      <!-- ADMIN INFORMATION -->
      <div class="section-title">
        Administrator Account
      </div>


      <div class="field">

        <label for="adminName">
          Administrator Name *
        </label>

        <input
          type="text"
          id="adminName"
          placeholder="Enter administrator name"
          required
        />

      </div>


      <div class="field">

        <label for="adminUsername">
          Username *
        </label>

        <input
          type="text"
          id="adminUsername"
          placeholder="e.g. admin"
          autocomplete="username"
          required
          minlength="3"
        />

        <small>
          This username will be used to sign in to your laboratory.
        </small>

      </div>


      <div class="field">

        <label for="adminPassword">
          Password *
        </label>

        <input
          type="password"
          id="adminPassword"
          placeholder="Create a password"
          autocomplete="new-password"
          required
          minlength="6"
        />

      </div>


      <div class="field">

        <label for="confirmPassword">
          Confirm Password *
        </label>

        <input
          type="password"
          id="confirmPassword"
          placeholder="Confirm your password"
          autocomplete="new-password"
          required
          minlength="6"
        />

      </div>


      <!-- INFORMATION -->
      <div class="signup-info">

        <strong>Important</strong>

        <p>
          After registration, your laboratory will remain
          <strong>Pending</strong> until the platform owner approves it.
        </p>

        <p>
          Once approved, a unique Lab Code will be assigned to your
          laboratory. You will use the Lab Code, username and password
          to sign in.
        </p>

      </div>


      <button
        type="submit"
        class="btn btn-primary btn-block"
        id="signupBtn"
      >
        Register Laboratory
      </button>

    </form>

  </div>

</div>
`;


  const extraStyle = `

.signup-info {
  background: #f0f8f7;
  border: 1px solid #d5ebe8;
  border-radius: 10px;
  padding: 14px 16px;
  margin: 16px 0;
  font-size: 13px;
  line-height: 1.6;
  color: #345;
}

.signup-info strong {
  color: var(--teal-dark);
}

.signup-info p {
  margin: 6px 0;
}

.form-success {
  display: none;
  background: #e3f6ec;
  color: #087443;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.6;
}

.form-success.show {
  display: block;
}

.form-error {
  display: none;
}

.form-error.show {
  display: block;
}

.field small {
  display: block;
  margin-top: 5px;
  font-size: 12px;
  color: #718096;
}

`;


  const pageScript = `

if (getToken()) {
  window.location.href = '/dashboard.html';
}


const form = document.getElementById('signupForm');

const errorBox =
  document.getElementById('signupError');

const successBox =
  document.getElementById('signupSuccess');

const btn =
  document.getElementById('signupBtn');


form.addEventListener('submit', async (e) => {

  e.preventDefault();


  errorBox.textContent = '';
  errorBox.classList.remove('show');

  successBox.innerHTML = '';
  successBox.classList.remove('show');


  const labName =
    document.getElementById('labName')
      .value
      .trim();

  const labEmail =
    document.getElementById('labEmail')
      .value
      .trim();

  const adminName =
    document.getElementById('adminName')
      .value
      .trim();

  const adminUsername =
    document.getElementById('adminUsername')
      .value
      .trim()
      .toLowerCase();

  const password =
    document.getElementById('adminPassword')
      .value;

  const confirmPassword =
    document.getElementById('confirmPassword')
      .value;


  // Password validation
  if (password.length < 6) {

    errorBox.textContent =
      'Password must contain at least 6 characters.';

    errorBox.classList.add('show');

    return;
  }


  // Confirm password
  if (password !== confirmPassword) {

    errorBox.textContent =
      'Passwords do not match.';

    errorBox.classList.add('show');

    return;
  }


  // Username validation
  if (adminUsername.length < 3) {

    errorBox.textContent =
      'Username must contain at least 3 characters.';

    errorBox.classList.add('show');

    return;
  }


  btn.disabled = true;

  btn.innerHTML =
    '<span class="spinner"></span> Registering...';


  try {

    const payload = {

      labName: labName,

      email: labEmail,

      adminName: adminName,

      username: adminUsername,

      password: password

    };


    console.log('Lab Registration:', payload);


    const data = await api(
      '/labs/register',
      {
        method: 'POST',

        body: JSON.stringify(payload)
      }
    );


    form.reset();


    let message =

      '<strong>Registration submitted successfully.</strong><br><br>' +

      'Your laboratory is currently <strong>pending approval</strong>.' +

      '<br><br>' +

      'The platform owner will review your registration. ' +

      'After approval, you will receive your unique Lab Code.' +

      '<br><br>';


    if (data.labCode) {

      message +=

        '<strong>Your Lab Code:</strong> ' +

        '<span style="font-size:18px;font-weight:700;">' +

        data.labCode +

        '</span><br><br>';

    }


    message +=

      'You can sign in after your laboratory has been approved.' +

      '<br><br>' +

      '<a href="/index.html" ' +

      'style="color:var(--teal-dark);font-weight:700;">' +

      'Go to Sign In' +

      '</a>';


    form.style.display = 'none';

    successBox.innerHTML = message;

    successBox.classList.add('show');


  } catch (err) {

    console.error('Registration error:', err);


    errorBox.textContent =
      err.message ||
      'Registration failed. Please try again.';

    errorBox.classList.add('show');


    btn.disabled = false;

    btn.textContent =
      'Register Laboratory';

  }

});

`;

  return renderPage({
    title: 'Register Laboratory',
    body,
    pageScript,
    extraStyle
  });
}

module.exports = signupPage;