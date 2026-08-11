const crypto = require('crypto');

// Reversible encryption for the one field in the whole app that intentionally
// needs to be read back in plain text: the lab admin's initial password, so
// the owner can hand it to a new lab from the Owner page. Everything else
// (login passwords generally) stays one-way hashed via bcrypt - see models/User.js.
//
// Key comes from OWNER_SECRET_KEY in .env. It must stay secret: anyone with
// this key + a database copy could recover every stored password.

const ALGO = 'aes-256-gcm';

function getKey() {
  const raw = process.env.OWNER_SECRET_KEY || '';
  if (!raw) {
    throw new Error(
      'OWNER_SECRET_KEY is not set in .env - required to store/reveal lab admin passwords on the Owner page.'
    );
  }
  // Accept any string; derive a stable 32-byte key from it.
  return crypto.createHash('sha256').update(raw).digest();
}

function encryptSecret(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv, authTag, ciphertext together, base64, colon-separated.
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':');
}

function decryptSecret(stored) {
  if (!stored) return '';
  try {
    const key = getKey();
    const [ivB64, tagB64, dataB64] = stored.split(':');
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');
    const encrypted = Buffer.from(dataB64, 'base64');
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (err) {
    return ''; // stale/corrupt/missing key - fail closed, never throw a raw password into an error page
  }
}

module.exports = { encryptSecret, decryptSecret };
