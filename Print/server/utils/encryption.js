const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(
  (process.env.ENCRYPTION_KEY || 'printshield_32char_encryption_key').padEnd(32, '0').slice(0, 32),
  'utf8'
);

/**
 * Encrypt a buffer (file content) 
 * Returns { encryptedData: base64 string, iv: hex string }
 */
const encryptBuffer = (buffer) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    encryptedData: encrypted.toString('base64'),
    iv: iv.toString('hex'),
  };
};

/**
 * Decrypt encrypted base64 data back to buffer
 */
const decryptBuffer = (encryptedData, ivHex) => {
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedData, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
};

module.exports = { encryptBuffer, decryptBuffer };
