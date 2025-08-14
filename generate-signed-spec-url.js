// generate-signed-spec-url.js
const crypto = require('crypto');

const base = process.argv[2]; // e.g. https://.../spec/import.yaml
if (!base) {
  console.error('Usage: node generate-signed-spec-url.js <base-url> [minutes]');
  process.exit(1);
}

// minutes to live (default 10)
const minutes = Number(process.argv[3] || 10);
const exp = Date.now() + minutes * 60 * 1000;

const secret = process.env.SPEC_IMPORT_SECRET;
if (!secret) {
  console.error('❌ SPEC_IMPORT_SECRET is not set in your environment.');
  process.exit(1);
}

const raw = `exp=${exp}`;
const sig = crypto.createHmac('sha256', secret).update(raw).digest('hex');

console.log(`${base}?exp=${exp}&sig=${sig}`);
