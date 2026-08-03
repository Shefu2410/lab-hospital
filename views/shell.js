const styles = require('./styles');
const clientScript = require('./clientScript');

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
<style>${styles}${extraStyle}</style>
</head>
<body>
${body}
<script>${clientScript}</script>
<script>${pageScript}</script>
</body>
</html>`;
}

module.exports = { renderPage };
