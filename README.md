# Hospital LIMS — Backend-Only Build

This is a single Node.js/Express + MongoDB backend. There is **no separate
frontend project anymore** — every page that used to be a static `.html` file
(`index.html`, `dashboard.html`, `registration.html`, `catalog.html`,
`results.html`) has been converted into a JS module under `views/` that
generates the full HTML/CSS/JS for that page. The Express server renders and
serves those pages directly, alongside the JSON API, so the whole app runs
from one process.

## What changed from the original upload

- The `js/api.js` and `js/layout.js` static files (uploaded empty) were
  rewritten as `views/clientScript.js` — a single shared script (session
  handling, the `api()` fetch wrapper, sidebar nav, toasts, formatting
  helpers) that's inlined into every page.
- `css/style.css` (also uploaded empty) was rewritten as `views/styles.js` and
  inlined the same way.
- Each `.html` page became a `views/*Page.js` module (`loginPage.js`,
  `dashboardPage.js`, `registrationPage.js`, `catalogPage.js`,
  `resultsPage.js`) built with `views/shell.js`, which wraps page content with
  the shared styles/script into one HTML document.
- `routes/viewRoutes.js` serves those generated pages at their original URLs
  (`/`, `/dashboard.html`, `/registration.html`, `/catalog.html`,
  `/results.html`), so bookmarks/links in the old app still work.
- `server.js` no longer does `express.static('../frontend')` — there's no
  frontend folder to serve.
- Since the uploaded `middleware/`, `models/`, `routes/`, `utils/`, and
  `config/` folders came through empty, they were rebuilt from scratch based
  on what `server.js`/`seed.js` already expected and what the page scripts
  call (`/api/auth`, `/api/patients`, `/api/tests`, `/api/results`,
  `/api/dashboard`).
- Added `utils/aiAnalysis.js`, matching the filename already referenced in
  your `.env.example` comment — it calls the Anthropic API if
  `ANTHROPIC_API_KEY` is set, otherwise falls back to a built-in rule-based
  analyzer, so AI Insight always works even with no key configured.

## Project layout

```
config/db.js                MongoDB connection
models/                     User, Patient, TestCatalog, Result (Mongoose)
middleware/auth.js          JWT auth (protect) + role guard (requireRole)
middleware/errorHandler.js  Central error handling + 404
utils/idGenerator.js        PT-0001 / RPT-000001 style IDs
utils/flagLogic.js          High / Low / Normal flag calculation
utils/aiAnalysis.js         AI Insight (Anthropic API + rule-based fallback)
routes/authRoutes.js        POST /api/auth/login, GET /api/auth/me
routes/patientRoutes.js     Patients CRUD (list/get/create)
routes/testRoutes.js        Test catalog CRUD
routes/resultRoutes.js      Reports: create, list, detail, save values, status
routes/dashboardRoutes.js   Stats + recent reports
routes/viewRoutes.js        Serves the generated HTML pages
views/*Page.js              Page markup + page-specific browser script
views/shell.js               Wraps a page's body/script in one HTML document
views/styles.js              All CSS (was css/style.css)
views/clientScript.js        Shared browser JS (was js/api.js + js/layout.js)
server.js                   Express app entry point
seed.js                     Seeds demo users + starter test panels
```

## Run it

```bash
npm install
cp .env.example .env   # then fill in MONGO_URI / JWT_SECRET
npm run seed            # creates demo logins + 5 starter test panels
npm run dev              # or: npm start
```

Then open `http://localhost:8000/` (or whatever `PORT` you set) — you're
served straight from the backend; there's no separate frontend server or
build step.

Demo logins created by `npm run seed`:
- `admin / admin123` (admin)
- `pathologist / path123` (pathologist)
- `technician / tech123` (lab-technician)

## Multi-lab additions (new)

The backend is now multi-tenant: each lab's patients, test catalog, and
reports are isolated from every other lab's.

**New files:**
- `models/Lab.js` — a lab/tenant: `code`, `name`, `email`, `phone`, `address`,
  `status` (`pending` / `approved` / `rejected` / `suspended`).
- `routes/labRoutes.js` — public self-registration (`POST /api/labs/register`
  creates a `pending` lab + its first admin user), a public status check
  (`GET /api/labs/status/:code`), and the lab admin's own profile
  (`GET`/`PUT /api/labs/me`).
- `routes/adminRoutes.js` — superadmin-only: list/approve/reject/suspend/
  reactivate/delete labs (`/api/admin/labs...`) and platform stats
  (`GET /api/admin/stats`).
- `middleware/labScope.js` — `requireActiveLab`, used after `protect` on every
  lab-scoped route; re-checks the lab is still `approved` on each request (so
  a suspension takes effect immediately, not just at next login).

**Changed files:**
- `models/User.js` — added a `superadmin` role and a `lab` reference
  (required for every role except `superadmin`); usernames are now unique
  *per lab* rather than globally, so two labs can each have an `admin` user.
- `models/Patient.js`, `models/TestCatalog.js`, `models/Result.js` — each got
  a required `lab` field; their ID fields (`patientId`, `code`, `reportId`)
  are now unique per lab instead of globally.
- `utils/idGenerator.js` — `generatePatientId`/`generateReportId` now take a
  `labId` and count only within that lab; added `generateLabCode(name)` to
  mint a short unique code like `RKHXX23` at registration time.
- `routes/authRoutes.js` — `POST /api/auth/login` now takes an optional
  `labCode`. Omit it to log in as a superadmin; include it to log into that
  lab (blocked with a clear message if the lab is pending/rejected/suspended).
- `routes/patientRoutes.js`, `routes/testRoutes.js`, `routes/resultRoutes.js`,
  `routes/dashboardRoutes.js` — every query now filters/sets `lab:
  req.user.lab`, and each router uses `requireActiveLab`.
- `views/loginPage.js` — added a "Lab Code" field (leave blank for the
  platform admin login).
- `seed.js` — now creates a **superadmin** (`superadmin / super123`, no lab
  code), an **approved demo lab**, and puts the original demo users
  (`admin`/`pathologist`/`technician`) and starter test catalog inside that
  lab. It prints the demo lab's generated code at the end — use that code to
  log into the demo lab logins.
- `server.js` — wired in `labRoutes` at `/api/labs` and `adminRoutes` at
  `/api/admin` (this is the version you pasted; unchanged here).

### Where everything goes

Drop these into your project at the same relative paths shown in the zip —
nothing needs to move:

```
models/Lab.js                 <- new
middleware/labScope.js        <- new
routes/labRoutes.js           <- new
routes/adminRoutes.js         <- new
models/User.js                <- replace
models/Patient.js             <- replace
models/TestCatalog.js         <- replace
models/Result.js              <- replace
utils/idGenerator.js          <- replace
routes/authRoutes.js          <- replace
routes/patientRoutes.js       <- replace
routes/testRoutes.js          <- replace
routes/resultRoutes.js        <- replace
routes/dashboardRoutes.js     <- replace
views/loginPage.js            <- replace
seed.js                       <- replace
server.js                     <- already what you pasted
```

### Multi-lab flow to try locally

```bash
npm install
cp .env.example .env    # fill in MONGO_URI / JWT_SECRET
npm run seed             # prints the demo lab's code at the end, e.g. RKHCR45
npm run dev
```

1. Log in as `superadmin / super123` with the Lab Code field left blank.
2. Register a second lab: `POST /api/labs/register` with `labName`,
   `labEmail`, `adminName`, `adminUsername`, `adminPassword` — it comes back
   `pending`.
3. As superadmin, `PUT /api/admin/labs/:id/approve` to activate it (or
   `/reject`, `/suspend`, `/reactivate`).
4. That lab's admin can now log in on `/` using their Lab Code + username +
   password, and only ever sees their own lab's patients/tests/reports.

## Superadmin removed (latest change)

There is no more platform-level superadmin. `admin` is now the highest role,
scoped to their own lab. Every lab is active the moment it self-registers —
there's no approval step to wait on.

**Removed:**
- `routes/adminRoutes.js` (all the `/api/admin/labs/...` approve/reject/
  suspend endpoints) — deleted, and its `require`/`app.use` removed from
  `server.js`.
- `middleware/labScope.js` (`requireActiveLab`) — deleted. The same "is this
  lab still active" check now lives directly inside `middleware/auth.js`'s
  `protect`, so every protected route still gets it for free with one less
  file to wire up.
- The `superadmin` role — removed from `models/User.js`'s role enum. `lab` is
  now `required: true` on every user (previously optional for superadmins).

**Changed:**
- `models/Lab.js` — dropped `status`/`rejectionReason`/`approvedAt`. Replaced
  with a single `active` boolean (defaults `true`). Nothing sets it to
  `false` right now; it's there so a lab could be deactivated later via a
  direct DB update or an internal tool, without needing a superadmin role.
- `routes/authRoutes.js` — `labCode` is now **required** on login (no more
  "leave blank for superadmin" branch). Login checks `lab.active` and blocks
  with a clear message if it's been deactivated.
- `routes/labRoutes.js` — `POST /api/labs/register` creates the lab
  immediately usable; no more `pending` state to wait on.
- `routes/patientRoutes.js`, `testRoutes.js`, `resultRoutes.js`,
  `dashboardRoutes.js` — simplified back to `router.use(protect)` (the active-
  lab check now happens inside `protect` itself, see above).
- `views/loginPage.js` — Lab Code field is now required, removed the
  superadmin mention from the demo-creds box.
- `seed.js` — no longer creates a superadmin user; only the demo lab + its
  three demo users + starter test catalog.
- `server.js` — `adminRoutes` require/`app.use` removed; `labRoutes` stays.

### Where everything goes

```
routes/adminRoutes.js         <- delete
middleware/labScope.js        <- delete
models/User.js                <- replace
models/Lab.js                 <- replace
middleware/auth.js            <- replace
routes/authRoutes.js          <- replace
routes/labRoutes.js           <- replace
routes/patientRoutes.js       <- replace
routes/testRoutes.js          <- replace
routes/resultRoutes.js        <- replace
routes/dashboardRoutes.js     <- replace
views/loginPage.js            <- replace
seed.js                       <- replace
server.js                     <- replace
```

### Try it locally

```bash
npm install
cp .env.example .env    # fill in MONGO_URI / JWT_SECRET
npm run seed              # prints your lab code, e.g. RKHCR45
npm run dev
```

Open `/`, enter the printed lab code plus `admin`/`admin123` (or
`pathologist`/`path123`, `technician`/`tech123`), and you're in — same as a
single-lab app, except a second lab could self-register via
`POST /api/labs/register` and get its own fully isolated code, patients,
tests and reports with zero setup.

## Multi-lab additions (superseded above, kept for history)

The backend is multi-tenant: each lab's patients, test catalog, and reports
are isolated from every other lab's via a `lab` reference on every record and
per-lab-unique usernames/IDs — that part is unchanged from the previous
version. Only the *superadmin approval layer* on top of it was removed, as
described above.

**New files (still present):**
- `models/Lab.js` — a lab/tenant: `code`, `name`, `email`, `phone`, `address`,
  `active`.
- `routes/labRoutes.js` — public self-registration
  (`POST /api/labs/register`), and the lab admin's own profile
  (`GET`/`PUT /api/labs/me`).

**Changed files (still present):**
- `models/Patient.js`, `models/TestCatalog.js`, `models/Result.js` — each has
  a required `lab` field; their ID fields (`patientId`, `code`, `reportId`)
  are unique per lab instead of globally.
- `utils/idGenerator.js` — `generatePatientId`/`generateReportId` take a
  `labId` and count only within that lab; `generateLabCode(name)` mints a
  short unique code like `RKHXX23` at registration time.

## One report per visit, dashboard search/delete, and value ranges (latest change)

**1. A patient's tests in one visit now share a single report ID.**
Previously, ordering 3 test panels for one patient created 3 separate
`Result` documents, each with its own `reportId`. Now `models/Result.js`
holds a `tests: [...]` array — one report, one `reportId`, containing every
panel ordered in that visit, each with its own parameter values.

- `views/registrationPage.js` — the old "pick one test, click Add" flow
  (which created a new report every click) is now a checklist: tick every
  panel the visit needs, then **Create Report for Selected Tests** once.
  `POST /api/results` now takes `testCatalogIds: [...]` (an array) instead of
  a single `testCatalogId`.
- `routes/resultRoutes.js` — `POST /api/results` builds one `Result` with a
  `tests` array from all the catalog IDs given. `PUT /api/results/:id/values`
  now takes `{ tests: [{ testCatalog, values }, ...] }` and merges each
  panel's values into the matching entry, then regenerates one combined AI
  summary across every panel in the report.
- `utils/aiAnalysis.js` — `generateSummary` now takes the whole `tests` array
  and produces one summary covering all bundled panels (both the Anthropic
  path and the rule-based fallback).
- `views/resultsPage.js` — the detail view renders one collapsible block per
  test panel inside the report, and the printed report lists each panel as
  its own table under one header.

**2. Dashboard: search, delete (with confirmation), and value ranges.**
- `views/dashboardPage.js` — added a **Find & Manage Reports** card above
  Recent Reports: a live search box (by patient name or report ID, reusing
  `GET /api/results?search=`). Click a result row to expand it in place and
  see every parameter's value next to its normal range — no need to leave
  the dashboard. Only **admin** users see a **Delete** button per row; it
  triggers a native "Are you sure you want to delete report RPT-000123?"
  confirmation — OK deletes it, Cancel leaves everything untouched.
- `routes/resultRoutes.js` — added `DELETE /api/results/:id`, restricted to
  the `admin` role.

### Where everything goes

```
models/Result.js               <- replace
utils/aiAnalysis.js            <- replace
routes/resultRoutes.js         <- replace
routes/dashboardRoutes.js      <- replace (field name fix: tests, not values)
views/registrationPage.js      <- replace
views/resultsPage.js           <- replace
views/dashboardPage.js         <- replace
```

### Note on "value range 2000"

I wasn't able to work out what this referred to — a price cap, a specific
test's normal range, something else? I left it out for now. Let me know
exactly what you meant (which field, which screen) and I'll add it.

## Notes

- Your uploaded `.env` had `RAZORPAY_KEY_ID` / `RAZORPAY_SECRET_KEY` values,
  but no payment feature was referenced anywhere in the code you provided, so
  it wasn't wired up. If you want online payment collection at registration
  or report time, let me know and I can add a Razorpay-backed billing flow.
- Only admins/pathologists can move a report to "Partial Approved" or
  "Approved" (enforced both in the UI and in `routes/resultRoutes.js`).
