// All visual styling for the app, generated as a JS string and injected by
// views/shell.js. This replaces the old static css/style.css file - everything
// now lives inside the backend.
module.exports = `
:root{
  --teal:#0c7c7c; --teal-dark:#095f5f; --ink:#1c2733; --ink-soft:#64748b;
  --bg:#f3f6f7; --card:#ffffff; --border:#e2e8ec; --danger:#d94b4b;
  --warn:#c98a1c; --accent:#1f9d6b;
  --radius:10px;
}
*{box-sizing:border-box;}
body{margin:0;font-family:'Segoe UI',Roboto,Arial,sans-serif;background:var(--bg);color:var(--ink);}
a{color:inherit;text-decoration:none;}
input,select{font-family:inherit;font-size:14px;padding:9px 11px;border:1px solid var(--border);border-radius:8px;width:100%;background:#fff;color:var(--ink);}
input:focus,select:focus{outline:2px solid var(--teal);outline-offset:1px;}
label{font-size:12.5px;font-weight:600;color:var(--ink-soft);display:block;margin-bottom:4px;}

.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 16px;border-radius:8px;border:1px solid transparent;font-size:13.5px;font-weight:600;cursor:pointer;background:#eee;color:var(--ink);}
.btn-primary{background:var(--teal);color:#fff;}
.btn-primary:hover{background:var(--teal-dark);}
.btn-outline{background:#fff;border-color:var(--teal);color:var(--teal);}
.btn-ghost{background:transparent;border-color:var(--border);}
.btn-danger{background:var(--danger);color:#fff;}
.btn-block{width:100%;}
.btn-sm{padding:6px 10px;font-size:12.5px;}
.btn:disabled{opacity:.6;cursor:not-allowed;}

.app-shell{display:flex;min-height:100vh;}
.sidebar{width:220px;background:var(--ink);color:#fff;flex-shrink:0;padding:18px 0;}
.sidebar .brand{padding:0 20px 18px;font-weight:700;font-size:15px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:10px;}
.sidebar a{display:block;padding:11px 20px;font-size:13.5px;color:#cbd5e1;}
.sidebar a.active{background:var(--teal);color:#fff;font-weight:600;}
.sidebar a:hover{color:#fff;}
.sidebar .logout{margin-top:20px;color:#f3a4a4;}

.main{flex:1;min-width:0;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:20px 28px;background:#fff;border-bottom:1px solid var(--border);}
.topbar h1{margin:0;font-size:19px;}
.crumb{color:var(--ink-soft);font-size:12.5px;margin-top:3px;}
.content{padding:24px 28px;}

.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:18px;}
@media (max-width:980px){.grid-2{grid-template-columns:1fr;}}

.card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:18px;margin-bottom:18px;}
.card-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;}
.card-head h3{margin:0;font-size:15px;}
.hint{font-size:11.5px;color:var(--ink-soft);}

.field{margin-bottom:12px;flex:1;}
.field-row{display:flex;gap:12px;}
.section-title{font-size:12px;font-weight:700;text-transform:uppercase;color:var(--ink-soft);margin:16px 0 8px;letter-spacing:.03em;}

table{width:100%;border-collapse:collapse;font-size:13.5px;}
th{text-align:left;color:var(--ink-soft);font-size:11.5px;text-transform:uppercase;padding:8px 10px;border-bottom:1px solid var(--border);}
td{padding:10px;border-bottom:1px solid var(--border);}
tr.clickable{cursor:pointer;}
tr.clickable:hover{background:#f8fafb;}
.id-cell{font-family:monospace;font-weight:700;color:var(--teal-dark);}
.empty-state{padding:24px 10px;text-align:center;color:var(--ink-soft);font-size:13px;}
.empty-state h4{margin:0 0 6px;color:var(--ink);}

.stat-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;margin-bottom:20px;}
@media (max-width:1100px){.stat-grid{grid-template-columns:repeat(2,1fr);}}
.stat-card{background:#fff;border:1px solid var(--border);border-radius:var(--radius);padding:16px;}
.stat-card .label{font-size:11.5px;color:var(--ink-soft);text-transform:uppercase;font-weight:700;}
.stat-card .value{font-size:26px;font-weight:700;margin-top:6px;}
.stat-card .foot{font-size:11px;color:var(--ink-soft);margin-top:4px;}
.stat-card.warn .value{color:var(--warn);}
.stat-card.accent .value{color:var(--accent);}
.stat-card.danger .value{color:var(--danger);}

.badge{padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700;}
.badge-pending{background:#eef1f4;color:#64748b;}
.badge-tested{background:#fff2da;color:var(--warn);}
.badge-partial{background:#e4f3ff;color:#2266aa;}
.badge-approved{background:#e3f6ec;color:var(--accent);}

.toolbar{display:flex;gap:10px;margin-bottom:12px;}
.search-input{flex:2;}
.select-input{flex:1;}

.spinner{display:inline-block;width:12px;height:12px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}

.toast{position:fixed;bottom:22px;right:22px;padding:12px 18px;border-radius:8px;background:var(--ink);color:#fff;font-size:13.5px;box-shadow:0 6px 20px rgba(0,0,0,.18);z-index:999;opacity:0;transform:translateY(10px);transition:.25s;}
.toast.show{opacity:1;transform:translateY(0);}
.toast.error{background:var(--danger);}
.toast.success{background:var(--accent);}

.param-row{display:grid;grid-template-columns:4px 1.6fr 1fr 1fr 1fr;gap:14px;align-items:center;padding:8px 4px;border-bottom:1px solid var(--border);}
.param-rail{width:4px;height:26px;border-radius:2px;background:var(--border);}
.flag-High .param-rail, .param-rail.flag-High{background:var(--danger);}
.flag-Low .param-rail, .param-rail.flag-Low{background:var(--warn);}
.flag-Normal .param-rail, .param-rail.flag-Normal{background:var(--accent);}
.flag-NA .param-rail, .param-rail.flag-NA{background:var(--border);}
.flag-chip{padding:3px 10px;border-radius:99px;font-size:11px;font-weight:700;background:#eee;}
.flag-chip.flag-High{background:#fde3e3;color:var(--danger);}
.flag-chip.flag-Low{background:#fdf1da;color:var(--warn);}
.flag-chip.flag-Normal{background:#e3f6ec;color:var(--accent);}
.flag-chip.flag-NA{background:#eee;color:var(--ink-soft);}
.param-name{font-weight:600;}
.param-range{font-size:12.5px;color:var(--ink-soft);}
.value-input{text-align:right;}

.ai-panel{background:#f4fbfa;border:1px dashed var(--teal);border-radius:8px;padding:14px;font-size:13.5px;}
.ai-tag{display:inline-flex;align-items:center;gap:6px;font-size:10.5px;font-weight:800;color:var(--teal-dark);letter-spacing:.04em;margin-bottom:6px;}
.pulse{width:7px;height:7px;border-radius:50%;background:var(--teal);animation:pulse 1.4s infinite;}
@keyframes pulse{0%,100%{opacity:.4;}50%{opacity:1;}}
.ai-loading{color:var(--ink-soft);font-style:italic;}
.detail-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;}

.auth-screen{display:grid;grid-template-columns:1.1fr 1fr;min-height:100vh;}
@media (max-width:900px){.auth-screen{grid-template-columns:1fr;}}
.auth-visual{background:linear-gradient(160deg,var(--ink),#0f2f2f);color:#fff;padding:48px;display:flex;flex-direction:column;justify-content:space-between;}
.auth-brand{display:flex;align-items:center;gap:12px;}
.auth-brand .mark{width:44px;height:44px;border-radius:10px;background:var(--teal);display:flex;align-items:center;justify-content:center;font-weight:800;}
.auth-brand .name{font-weight:700;font-size:16px;}
.auth-brand .sub{font-size:10.5px;letter-spacing:.08em;color:#9fb3b3;}
.auth-quote .big{font-size:26px;font-weight:700;max-width:420px;line-height:1.35;}
.auth-quote .meta{color:#a8bcbc;margin-top:12px;max-width:420px;font-size:13.5px;}
.auth-readout{display:flex;gap:26px;font-size:12px;color:#a8bcbc;}
.auth-readout span{display:block;font-size:18px;font-weight:800;color:#fff;}
.auth-form-wrap{display:flex;align-items:center;justify-content:center;padding:40px;}
.auth-form{width:100%;max-width:360px;}
.auth-form h1{margin:0 0 6px;}
.auth-form .lead{color:var(--ink-soft);font-size:13.5px;margin-bottom:20px;}
.form-error{display:none;background:#fde3e3;color:var(--danger);padding:10px 12px;border-radius:8px;font-size:13px;margin-bottom:14px;}
.form-error.show{display:block;}
.demo-creds{margin-top:18px;font-size:12px;color:var(--ink-soft);background:#f4f6f7;border-radius:8px;padding:12px;line-height:1.7;}
`;
