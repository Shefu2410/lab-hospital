const { renderPage } = require('./shell');

function loginPage() {
  const body = `
<div class="auth-screen">

  <div class="auth-visual">

    <div class="auth-brand">
      <div class="mark">RKH</div>

      <div>
        <div class="name">RKH LIMS</div>
        <div class="sub">HOSPITAL &amp; AI LAB SUITE</div>
      </div>
    </div>

    <div class="auth-quote">
      <div class="big">
        Every sample, tracked from tube to report.
      </div>

      <div class="meta">
        Registration, result entry, result approval,
        and laboratory management in one workspace.
      </div>
    </div>

    <div class="auth-readout">

      <div>
        <span id="statPanels">5</span>
        test panels
      </div>

      <div>
        <span>24&times;7</span>
        result entry
      </div>

      <div>
        <span>LIMS</span>
        laboratory management
      </div>

    </div>

  </div>


  <div class="auth-form-wrap">

    <form class="auth-form" id="loginForm">

      <h1>Sign in</h1>

      <p class="lead">
        Enter your approved laboratory credentials to continue.
      </p>


      <div class="form-error" id="loginError"></div>


      <!-- LAB CODE -->

      <div class="field">

        <label for="labCode">
          Lab Code *
        </label>

        <input
          type="text"
          id="labCode"
          placeholder="e.g. RKHABC"
          style="text-transform:uppercase;"
          required
        />

      </div>


      <!-- PASSWORD -->

      <div class="field">

        <label for="password">
          Password *
        </label>

        <input
          type="password"
          id="password"
          autocomplete="current-password"
          placeholder="••••••••"
          required
        />

      </div>


      <button
        type="submit"
        class="btn btn-primary btn-block"
        id="loginBtn"
      >
        Login
      </button>


      <p
        class="lead"
        style="margin-top:16px;text-align:center;"
      >
        New lab?

        <a
          href="/signup.html"
          style="color:var(--teal-dark);font-weight:600;"
        >
          Register here
        </a>

      </p>

    </form>

  </div>

</div>
`;


  const pageScript = `

if (getToken()) {
  window.location.href = '/dashboard.html';
}


const form = document.getElementById('loginForm');

const errorBox = document.getElementById('loginError');

const btn = document.getElementById('loginBtn');


form.addEventListener('submit', async (e) => {

  e.preventDefault();


  errorBox.classList.remove('show');

  btn.disabled = true;

  btn.innerHTML =
    '<span class="spinner"></span> Signing in...';


  try {

    const labCode =
      document
        .getElementById('labCode')
        .value
        .trim()
        .toUpperCase();


    const password =
      document
        .getElementById('password')
        .value;


    if (!labCode || !password) {

      throw new Error(
        'Lab Code and Password are required.'
      );

    }


    /*
      IMPORTANT:

      Lab login uses:

      POST /api/labs/login

      NOT:

      /api/auth/login
    */

    const data = await api(
      '/labs/login',
      {
        method: 'POST',

        body: JSON.stringify({
          labCode,
          password
        })
      }
    );


    /*
      Save the lab login session
    */

    setSession(
      data.token,
      {
        ...data.lab,
        role: 'lab'
      }
    );


    /*
      Login successful
    */

    window.location.href =
      '/dashboard.html';


  } catch (err) {

    console.error(
      'Lab login error:',
      err
    );


    errorBox.textContent =
      err.message ||
      'Login failed. Check your Lab Code and Password.';


    errorBox.classList.add('show');


    btn.disabled = false;

    btn.textContent = 'Login';

  }

});


`;

  return renderPage({
    title: 'Login',
    body,
    pageScript
  });
}


module.exports = loginPage;