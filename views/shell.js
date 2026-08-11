const buildStatic = require('./buildStatic');

// app.css / app.js are written to /public once when the server boots (not on
// every request) and served with long-lived cache headers via express.static
// in server.js. The version hash busts the cache automatically if the CSS/JS
// source ever changes. This is what used to be inlined into every page's
// HTML - moving it to real cacheable files is the main fix for pages feeling
// slow to load, especially the first sign-in of a session.
const { cssVersion, jsVersion } = buildStatic();

// Wraps page-specific body/script content in a full HTML document.
// `extraStyle` and `pageScript` let a page add its own CSS/JS on top of the
// shared ones (mirrors the old per-page <style>/<script> blocks).
function renderPage({ title, body, pageScript = '', extraStyle = '' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} — RKH LIMS</title>
<link rel="stylesheet" href="/static/app.css?v=${cssVersion}" />
${extraStyle ? `<style>${extraStyle}</style>` : ''}
</head>
<body>
${body}
<script src="/static/app.js?v=${jsVersion}"></script>
<script>${pageScript}</script>
</body>
</html>`;
}

module.exports = { renderPage };
