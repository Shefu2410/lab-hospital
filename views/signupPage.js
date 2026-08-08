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
      <div class="big">Register your laboratory.</div>

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

      <p class="lead" style="margin-top:-8px;">
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


      <!-- LAB DETAILS -->
      <div class="section-title">
        Laboratory Details
      </div>


      <div class="field">

        <label for="labName">
          Lab Name *
        </label>

        <input
          type="text"
          id="labName"
          placeholder="Enter laboratory name"
          autocomplete="organization"
          required
        />

      </div>


      <div class="field">

        <label for="labEmail">
          Lab Email *
        </label>

        <input
          type="email"
          id="labEmail"
          placeholder="lab@example.com"
          autocomplete="email"
          required
        />

      </div>


      <!-- ADMIN ACCOUNT -->
      <div class="section-title">
        Administrator Account
      </div>


      <div class="field">

        <label for="adminName">
          Admin Name *
        </label>

        <input
          type="text"
          id="adminName"
          placeholder="Enter administrator name"
          autocomplete="name"
          required
        />

      </div>


      <div class="field">

        <label for="username">
          Username *
        </label>

        <input
          type="text"
          id="username"
          placeholder="e.g. admin"
          autocomplete="username"
          required
          minlength="3"
        />

      </div>


      <div class="field">

        <label for="password">
          Password *
        </label>

        <input
          type="password"
          id="password"
          placeholder="Minimum 6 characters"
          autocomplete="new-password"
          required
          minlength="6"
        />

      </div>


      <button
        type="submit"
        class="btn btn-primary btn-block"
        id="signupBtn"
      >
        Register Lab
      </button>


      <p
        class="lead"
        style="margin-top:16px;text-align:center;"
      >
        Already have an account?
        <a
          href="/index.html"
          style="color:var(--teal-dark);font-weight:600;"
        >
          Sign in
        </a>
      </p>

    </form>

    <!-- SUCCESS (moved outside the form so hiding the form doesn't hide this too) -->
    <div
      class="form-success"
      id="signupSuccess"
      style="display:none;"
    ></div>

  </div>

</div>
`;


  const extraStyle = `

.form-success {
  display: none;
  background: #e3f6ec;
  color: #087f5b;
  padding: 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.6;
}

.form-success.show {
  display: block;
}

.form-error {
  margin-bottom: 16px;
}

`;


  const pageScript = `

(function () {

  const form = document.getElementById('signupForm');
  const errorBox = document.getElementById('signupError');
  const successBox = document.getElementById('signupSuccess');
  const signupBtn = document.getElementById('signupBtn');

  if (!form) {
    console.error('Signup form not found.');
    return;
  }


  function showError(message) {

    errorBox.textContent = message || 'Registration failed.';

    errorBox.style.display = 'block';

    errorBox.classList.add('show');
  }


  function hideError() {

    errorBox.textContent = '';

    errorBox.style.display = 'none';

    errorBox.classList.remove('show');
  }


  function showSuccess(message) {

    successBox.innerHTML = message;

    successBox.style.display = 'block';

    successBox.classList.add('show');
  }


  form.addEventListener('submit', async function (event) {

    event.preventDefault();

    hideError();

    successBox.style.display = 'none';

    signupBtn.disabled = true;

    signupBtn.textContent = 'Registering...';


    try {

      const labName =
        document.getElementById('labName').value.trim();

      const email =
        document.getElementById('labEmail').value.trim();

      const adminName =
        document.getElementById('adminName').value.trim();

      const username =
        document.getElementById('username').value.trim();

      const password =
        document.getElementById('password').value;


      if (!labName) {
        throw new Error('Please enter the lab name.');
      }


      if (!email) {
        throw new Error('Please enter the lab email.');
      }


      if (!adminName) {
        throw new Error('Please enter the admin name.');
      }


      if (!username) {
        throw new Error('Please enter a username.');
      }


      if (username.length < 3) {
        throw new Error('Username must contain at least 3 characters.');
      }


      if (!password) {
        throw new Error('Please enter a password.');
      }


      if (password.length < 6) {
        throw new Error('Password must contain at least 6 characters.');
      }


      const payload = {
        labName: labName,
        email: email.toLowerCase(),
        adminName: adminName,
        username: username.toLowerCase(),
        password: password
      };


      console.log('Lab Registration:', {
        labName: labName,
        email: email,
        adminName: adminName,
        username: username
      });


      const response = await fetch('/api/labs/register', {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify(payload)
      });


      let data = {};

      try {
        data = await response.json();
      } catch (jsonError) {
        data = {};
      }


      if (!response.ok) {

        throw new Error(
          data.message ||
          'Registration failed. Please try again.'
        );

      }


      form.style.display = 'none';


      const labCodeText =
        data.labCode
          ? '<br><br><strong>Your Lab Code:</strong> ' + data.labCode
          : '';


      showSuccess(
        '<strong>Registration submitted successfully.</strong>' +
        '<br><br>' +
        'Your laboratory is currently waiting for owner approval.' +
        labCodeText +
        '<br><br>' +
        'You will be able to sign in after your laboratory is approved.' +
        '<br><br>' +
        '<a href="/index.html" style="color:var(--teal-dark);font-weight:600;">Go to Sign In</a>'
      );

    } catch (error) {

      console.error('Registration error:', error);

      showError(
        error.message ||
        'Registration failed. Please try again.'
      );

      signupBtn.disabled = false;

      signupBtn.textContent = 'Register Lab';

    }

  });

})();

`;


  return renderPage({
    title: 'Register Laboratory',
    body: body,
    pageScript: pageScript,
    extraStyle: extraStyle
  });
}

module.exports = signupPage;