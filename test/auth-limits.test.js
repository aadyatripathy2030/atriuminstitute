// Sign-in codes can't be brute-forced: a few wrong guesses burn the code,
// and codes can only be requested a few times an hour.
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

const ROOT = path.join(__dirname, '..');
const PORT = 19000 + Math.floor(Math.random() * 1000);

test('wrong codes burn the code; code requests are capped', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atrium-auth-'));
  const env = { ...process.env, PORT: String(PORT), DB_PATH: path.join(tmp, 'db.json'), DATABASE_URL: '', RESEND_API_KEY: '' };
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let log = '';
  child.stdout.on('data', d => { log += d; });
  t.after(() => { child.kill(); fs.rmSync(tmp, { recursive: true, force: true }); });

  const post = async (p, body) => {
    const r = await globalThis.fetch(`http://127.0.0.1:${PORT}/api/auth/${p}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    return { status: r.status, body: await r.json() };
  };
  for (let i = 0; i < 50; i++) {
    try { await globalThis.fetch(`http://127.0.0.1:${PORT}/`); break; } catch { await new Promise(r => setTimeout(r, 100)); }
  }
  const email = 'limit-test@example.com';
  const lastCode = () => (log.match(/\b\d{6}\b/g) || []).pop();

  assert.strictEqual((await post('signup', { email, mode: 'signup', role: 'student', age: 14, gradeLevel: 8, country: 'US' })).status, 200);
  const code = lastCode();
  assert.ok(code, 'code printed to the log');
  const wrong = code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) assert.match((await post('verify', { email, code: wrong })).body.error, /Invalid code/);
  assert.match((await post('verify', { email, code: wrong })).body.error, /Too many wrong codes/);
  // The real code no longer works once it's been burned.
  assert.notStrictEqual((await post('verify', { email, code })).status, 200);

  // Five sends an hour per email (one used above), then refused.
  for (let i = 0; i < 4; i++) assert.strictEqual((await post('signup', { email, mode: 'signin' })).status, 200);
  assert.strictEqual((await post('signup', { email, mode: 'signin' })).status, 429);
  // The newest code still signs in.
  const fresh = await post('verify', { email, code: lastCode() });
  assert.strictEqual(fresh.status, 200);
  assert.ok(fresh.body.user);
});
