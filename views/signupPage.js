const { renderPage } = require('./shell');

function signupPage() {
  const body = `
<div class="auth-screen">

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
        Create your laboratory account and submit it for
        owner approval. Once approved, you will receive a
        unique Lab Code and can sign in to the system.
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


  <div class="auth-form-wrap">

    <form class="auth-form" id="signupForm">

      <h1>Register Your Lab</h1>

      <p class="lead">
        Create your laboratory account.
      </p>

      <div class="form-error" id="signupError"></div>

      <div class="form-success" id="signupSuccess"></div>


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
          placeholder="e.g. RKH Diagnostic Laboratory"
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
          required
        />

      </div>


      <!-- ADMIN ACCOUNT -->

      <div class="section-title">
        Admin Account
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

        <label for="adminName">
          Admin Name *
        </label>

        <input
          type="text"
          id="adminName"
          placeholder="e.g. John Patel"
          required
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
          minlength="6"
          required
        />

      </div>


      <div class="field">

        <label for="confirmPassword">
          Confirm Password *
        </label>

        <input
          type="password"
          id="confirmPassword"
          placeholder="Re-enter password"
          autocomplete="new-password"
          minlength="6"
          required
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
        Already registered?

        <a
          href="/index.html"
          style="color:var(--teal-dark);font-weight:600;"
        >
          Sign in
        </a>

      </p>

    </form>

  </div>

</div>
`;


  const extraStyle = `

.form-success {
  display: none;
  background: #e3f6ec;
  color: #087f5b;
  padding: 16px;
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

`;


  const pageScript = `

const form = document.getElementById('signupForm');

const errorBox =
  document.getElementById('signupError');

const successBox =
  document.getElementById('signupSuccess');

const btn =
  document.getElementById('signupBtn');


form.addEventListener('submit', async function(e) {

  e.preventDefault();


  errorBox.classList.remove('show');
  successBox.classList.remove('show');


  const labName =
    document.getElementById('labName').value.trim();

  const email =
    document.getElementById('labEmail').value.trim();

  const username =
    document.getElementById('username').value.trim();

  const adminName =
    document.getElementById('adminName').value.trim();

  const password =
    document.getElementById('password').value;

  const confirmPassword =
    document.getElementById('confirmPassword').value;


  if (password !== confirmPassword) {

    errorBox.textContent =
      'Passwords do not match.';

    errorBox.classList.add('show');

    return;
  }


  if (password.length < 6) {

    errorBox.textContent =
      'Password must contain at least 6 characters.';

    errorBox.classList.add('show');

    return;
  }


  btn.disabled = true;

  btn.innerHTML =
    '<span class="spinner"></span> Registering...';


  try {

    const data = await api(
      '/labs/register',
      {
        method: 'POST',

        body: JSON.stringify({

          labName,
          email,
          username,
          adminName,
          password

        })
      }
    );


    form.style.display = 'none';


    successBox.innerHTML =

      '<strong>Registration submitted successfully.</strong>' +

      '<br><br>' +

      'Your laboratory has been registered successfully and is ' +
      'currently waiting for owner approval.' +

      '<br><br>' +

      'After approval, your unique Lab Code will be generated. ' +
      'You can then sign in using your Lab Code, username and password.' +

      '<br><br>' +

      '<a href="/index.html" ' +
      'style="color:var(--teal-dark);font-weight:600;">' +
      'Go to Sign In' +
      '</a>';


    successBox.classList.add('show');


  } catch (err) {

    console.error('Signup error:', err);


    errorBox.textContent =
      err.message ||
      'Registration failed. Please try again.';

    errorBox.classList.add('show');


    btn.disabled = false;

    btn.textContent =
      'Register Lab';

  }

});

`;

  return renderPage({
    title: 'Register Lab',
    body,
    pageScript,
    extraStyle
  });
}

module.exports = signupPage;