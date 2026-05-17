// Tiny helper to POST to /api/cron/send-reminders with the secret header.
// Used by the Render Cron Job (or anywhere else that schedules calls).
//
// Env:
//   CRON_SECRET — must match the value on the web service. Required.
//   SITE_URL    — defaults to https://atriuminstitute.ai. Override for staging.

const https = require('https');

const secret = process.env.CRON_SECRET;
if (!secret) {
  console.error('CRON_SECRET is not set. Aborting.');
  process.exit(1);
}

const base = (process.env.SITE_URL || 'https://atriuminstitute.ai').replace(/\/+$/, '');
const target = `${base}/api/cron/send-reminders`;

const url = new URL(target);
const req = https.request({
  method: 'POST',
  hostname: url.hostname,
  port: url.port || 443,
  path: url.pathname + (url.search || ''),
  headers: { 'X-Cron-Secret': secret, 'Content-Length': '0' },
}, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    console.log(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});
req.on('error', err => {
  console.error('Request failed:', err.message);
  process.exit(1);
});
req.end();
