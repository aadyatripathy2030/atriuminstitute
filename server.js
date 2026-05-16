// Atrium Math — static site + Claude API proxy with spend protections.
//
// Env vars:
//   PORT                  Port to listen on (default 8765; Render sets this)
//   ANTHROPIC_API_KEY     Required. Anthropic API key.
//   SITE_PASSWORD         Optional. If set, gates the site behind a password.
//   RATE_LIMIT_PER_HOUR   Optional. Max Claude API requests per IP per hour (default 30).
//   DAILY_REQUEST_CAP     Optional. Global daily cap on Claude requests (default 1000). Resets at UTC midnight.

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8765;
const ROOT = __dirname;
const SITE_PASSWORD = process.env.SITE_PASSWORD || '';
const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR, 10) || 30;
const DAILY_REQUEST_CAP = parseInt(process.env.DAILY_REQUEST_CAP, 10) || 1000;

// Load API key
let API_KEY = process.env.ANTHROPIC_API_KEY || '';
if (!API_KEY) {
  try { API_KEY = fs.readFileSync(path.join(ROOT, '.apikey'), 'utf8').trim(); } catch (_) {}
}
if (!API_KEY) {
  try {
    const home = process.env.HOME || '';
    API_KEY = fs.readFileSync(path.join(home, '.anthropic_api_key'), 'utf8').trim();
  } catch (_) {}
}
if (!API_KEY) {
  console.warn('⚠️  No ANTHROPIC_API_KEY found.');
}

// Session token derived from password (so cookies are stable across restarts but unforgeable without the password).
const SESSION_TOKEN = SITE_PASSWORD
  ? crypto.createHash('sha256').update('atrium:' + SITE_PASSWORD).digest('hex').slice(0, 32)
  : '';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// ---------- Password gate ----------
function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name) return v;
  }
  return null;
}

function isAuthed(req) {
  if (!SITE_PASSWORD) return true;
  return getCookie(req, 'atrium_session') === SESSION_TOKEN;
}

function serveLoginPage(res, msg = '') {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Atrium Math — Sign in</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;background:#f7f5f0;color:#1e2238;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#fff;padding:40px;border-radius:14px;box-shadow:0 4px 20px rgba(0,0,0,.06);max-width:360px;width:90%}
h1{font-family:Georgia,serif;font-weight:500;margin:0 0 8px}
p{color:#6b7084;font-size:14px;margin:0 0 20px}
input{width:100%;padding:11px 14px;border:1px solid #d4cfc0;border-radius:8px;font-size:14px;box-sizing:border-box;margin-bottom:12px}
button{width:100%;padding:11px;background:#1e2238;color:#fff;border:0;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer}
button:hover{background:#2a2e46}
.err{color:#b65555;font-size:13px;margin-bottom:12px}
</style></head><body><form class="card" method="POST" action="/login">
<h1>📚 Atrium Math</h1><p>This site is password-protected.</p>
${msg ? `<div class="err">${msg}</div>` : ''}
<input type="password" name="password" placeholder="Password" autofocus required>
<button type="submit">Sign in</button>
</form></body></html>`);
}

async function handleLogin(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  const body = await readBody(req);
  const params = new URLSearchParams(body);
  const password = params.get('password') || '';
  if (password !== SITE_PASSWORD) {
    return serveLoginPage(res, 'Wrong password.');
  }
  res.writeHead(302, {
    'Set-Cookie': `atrium_session=${SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*30}`,
    'Location': '/'
  });
  res.end();
}

// ---------- Rate limiting ----------
const ipBuckets = new Map(); // ip -> { count, resetAt }

function ipOf(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function rateLimitCheck(ip) {
  const now = Date.now();
  let b = ipBuckets.get(ip);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + 60*60*1000 };
    ipBuckets.set(ip, b);
  }
  b.count++;
  return b.count <= RATE_LIMIT_PER_HOUR;
}

// ---------- Daily budget cap ----------
let dailyCount = 0;
let dailyResetAt = nextUtcMidnight();
function nextUtcMidnight() {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0);
}
function budgetCheck() {
  if (Date.now() >= dailyResetAt) {
    dailyCount = 0;
    dailyResetAt = nextUtcMidnight();
  }
  dailyCount++;
  return dailyCount <= DAILY_REQUEST_CAP;
}

// ---------- Static ----------
function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  // Don't expose secrets / tooling
  const base = path.basename(filePath);
  if (base === '.apikey' || base === 'server.js' || base.startsWith('.')) {
    res.writeHead(404); return res.end('404');
  }
  if (filePath.includes(path.sep + 'tools' + path.sep)) {
    res.writeHead(404); return res.end('404');
  }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1_000_000) { reject(new Error('too big')); req.destroy(); }});
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function proxyClaude(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  if (!API_KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'Server has no API key configured.' } }));
  }
  if (!isAuthed(req)) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: 'Not signed in.' } }));
  }
  const ip = ipOf(req);
  if (!rateLimitCheck(ip)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: `Rate limit: ${RATE_LIMIT_PER_HOUR} requests/hour per IP. Try again later.` } }));
  }
  if (!budgetCheck()) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: { message: `Site has hit today's request cap (${DAILY_REQUEST_CAP}). Resets at UTC midnight.` } }));
  }

  let bodyStr;
  try { bodyStr = await readBody(req); } catch (e) { res.writeHead(400); return res.end('bad body'); }
  const opts = {
    method: 'POST',
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };
  const upstream = https.request(opts, up => {
    res.writeHead(up.statusCode, up.headers);
    up.pipe(res);
  });
  upstream.on('error', err => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { message: 'Upstream error: ' + err.message } }));
  });
  upstream.write(bodyStr);
  upstream.end();
}

const server = http.createServer((req, res) => {
  // Routes that don't need auth
  if (req.url === '/login') return handleLogin(req, res);

  // Password gate for everything else
  if (SITE_PASSWORD && !isAuthed(req) && !req.url.startsWith('/api/')) {
    return serveLoginPage(res);
  }

  if (req.url.startsWith('/api/claude')) return proxyClaude(req, res);
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`📚 Atrium Math running at http://localhost:${PORT}`);
  console.log(API_KEY ? '✨ AI tutor: enabled' : '⚠️  AI tutor: disabled (no API key)');
  console.log(`🔒 Password gate: ${SITE_PASSWORD ? 'enabled' : 'disabled (set SITE_PASSWORD env var)'}`);
  console.log(`⏱  Rate limit: ${RATE_LIMIT_PER_HOUR} requests/hour per IP`);
  console.log(`💰 Daily cap: ${DAILY_REQUEST_CAP} requests/day (resets at UTC midnight)`);
});
