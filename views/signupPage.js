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
            Create your laboratory account and submit your
            registration for approval. Your lab can start using
            the system after the owner approves your request.
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

        <div class="signup-card">

          <div class="signup-header">
            <h1>Register Your Lab</h1>

            <p>
              Create an account for your laboratory.
            </p>

            <div class="login-link">
              Already registered?
              <a href="/index.html">
                Sign in
              </a>
            </div>
          </div>


          <!-- ERROR MESSAGE -->
          <div
            class="form-error"
            id="signupError">
          </div>


          <!-- SUCCESS MESSAGE -->
          <div
            class="form-success"
            id="signupSuccess">
          </div>


          <!-- REGISTRATION FORM -->
          <form id="signupForm">

            <!-- LAB DETAILS -->
            <div class="form-section">

              <div class="form-section-title">
                Laboratory Details
              </div>

              <div class="field">
                <label for="labName">
                  Lab Name *
                </label>

                <input
                  id="labName"
                  type="text"
                  placeholder="Enter laboratory name"
                  required
                />
              </div>


              <div class="field">
                <label for="labEmail">
                  Lab Email *
                </label>

                <input
                  id="labEmail"
                  type="email"
                  placeholder="lab@example.com"
                  required
                />
              </div>

            </div>


            <!-- ADMIN DETAILS -->
            <div class="form-section">

              <div class="form-section-title">
                Administrator Details
              </div>

              <div class="field">
                <label for="adminName">
                  Administrator Name *
                </label>

                <input
                  id="adminName"
                  type="text"
                  placeholder="Enter administrator name"
                  required
                />
              </div>


              <div class="field">
                <label for="adminPassword">
                  Password *
                </label>

                <input
                  id="adminPassword"
                  type="password"
                  placeholder="Minimum 6 characters"
                  minlength="6"
                  required
                />
              </div>


              <div class="field">
                <label for="confirmPassword">
                  Confirm Password *
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  minlength="6"
                  required
                />
              </div>

            </div>


            <!-- INFORMATION -->
            <div class="signup-info">

              <strong>Important:</strong>

              Your laboratory will be reviewed before
              activation. You will receive your laboratory
              code after approval.

            </div>


            <!-- SUBMIT -->
            <button
              type="submit"
              class="btn btn-primary btn-block signup-btn"
              id="signupBtn">

              Register Laboratory

            </button>

          </form>

        </div>

      </div>

    </div>
  `;


  const extraStyle = `

    /* Registration card */
    .signup-card {
      width: 100%;
      max-width: 470px;
      background: #fff;
      padding: 32px;
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
    }


    /* Header */
    .signup-header {
      margin-bottom: 24px;
    }

    .signup-header h1 {
      margin: 0;
      font-size: 26px;
      color: var(--ink);
    }

    .signup-header p {
      margin: 7px 0 10px;
      color: var(--ink-soft);
      font-size: 13.5px;
    }


    /* Login link */
    .login-link {
      font-size: 13px;
      color: var(--ink-soft);
    }

    .login-link a {
      color: var(--teal-dark);
      font-weight: 700;
      margin-left: 4px;
    }


    /* Form sections */
    .form-section {
      margin-bottom: 20px;
    }

    .form-section-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--ink-soft);
      letter-spacing: .04em;
      margin-bottom: 12px;
      padding-bottom: 7px;
      border-bottom: 1px solid var(--border);
    }


    /* Fields */
    .field {
      margin-bottom: 14px;
    }

    .field:last-child {
      margin-bottom: 0;
    }

    .field label {
      margin-bottom: 6px;
    }

    .field input {
      height: 44px;
    }


    /* Information box */
    .signup-info {
      background: #f4fbfa;
      border: 1px solid #cce8e5;
      border-radius: 8px;
      padding: 12px 14px;
      margin: 20px 0;
      font-size: 12px;
      line-height: 1.6;
      color: var(--ink-soft);
    }

    .signup-info strong {
      color: var(--teal-dark);
    }


    /* Button */
    .signup-btn {
      height: 44px;
      font-size: 14px;
    }


    /* Error */
    .form-error {
      display: none;
      background: #fde3e3;
      color: var(--danger);
      padding: 11px 13px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .form-error.show {
      display: block;
    }


    /* Success */
    .form-success {
      display: none;
      background: #e3f6ec;
      color: var(--accent);
      padding: 14px;
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 16px;
      line-height: 1.6;
    }

    .form-success.show {
      display: block;
    }


    /* Mobile */
    @media (max-width: 900px) {

      .auth-screen {
        grid-template-columns: 1fr;
      }

      .auth-visual {
        display: none;
      }

      .auth-form-wrap {
        min-height: 100vh;
        padding: 24px;
      }

      .signup-card {
        max-width: 500px;
      }

    }

  `;


  const pageScript = `

    /* If already logged in, go to dashboard */
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


    /* Submit registration */
    form.addEventListener('submit', async (e) => {

      e.preventDefault();

      errorBox.classList.remove('show');
      successBox.classList.remove('show');


      const labName =
        document.getElementById('labName').value.trim();

      const labEmail =
        document.getElementById('labEmail').value.trim();

      const adminName =
        document.getElementById('adminName').value.trim();

      const password =
        document.getElementById('adminPassword').value;

      const confirmPassword =
        document.getElementById('confirmPassword').value;


      /* Check password */
      if (password !== confirmPassword) {

        errorBox.textContent =
          'Passwords do not match.';

        errorBox.classList.add('show');

        return;
      }


      /* Disable button */
      btn.disabled = true;

      btn.innerHTML =
        '<span class="spinner"></span> Registering...';


      try {

        const payload = {
          labName: labName,
          email: labEmail,
          adminName: adminName,
          password: password
        };


        const data = await api(
          '/labs/register',
          {
            method: 'POST',
            body: JSON.stringify(payload)
          }
        );


        /* Clear form */
        form.reset();

        form.style.display = 'none';


        /* Show success */
        successBox.innerHTML =

          '<strong>Registration submitted successfully.</strong><br><br>' +

          (data.message || 'Your laboratory registration has been submitted.') +

          '<br><br>' +

          'Your laboratory is currently waiting for owner approval. ' +

          'You will be able to sign in after your laboratory is approved.' +

          '<br><br>' +

          '<a href="/index.html" ' +
          'style="color:var(--teal-dark);font-weight:700;">' +
          'Go to Sign In' +
          '</a>';


        successBox.classList.add('show');


      } catch (err) {

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
    title: 'Register Lab',
    body,
    pageScript,
    extraStyle
  });
}


module.exports = signupPage;