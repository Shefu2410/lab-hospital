const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const styles = require('./styles');
const clientScript = require('./clientScript');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Writes app.css / app.js to disk and returns a short content hash for each,
// used as a cache-busting query string (?v=<hash>) on the <link>/<script>
// tags in shell.js. Because these files rarely change, the browser then
// caches them for 30 days (see the express.static maxAge in server.js)
// instead of re-downloading the same CSS/JS on every single page load.
function buildStatic() {
  if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  fs.writeFileSync(path.join(PUBLIC_DIR, 'app.css'), styles, 'utf8');
  fs.writeFileSync(path.join(PUBLIC_DIR, 'app.js'), clientScript, 'utf8');

  const hash = (content) => crypto.createHash('md5').update(content).digest('hex').slice(0, 8);

  return {
    cssVersion: hash(styles),
    jsVersion: hash(clientScript),
  };
}

module.exports = buildStatic;
