// The admin panel must be reachable by the owner account only, and only
// after an emailed step-up code. These tests attack it from every side we
// can think of: another account carrying the is_admin flag, missing CSRF
// header, cross-site origin, stolen admin cookie on another session,
// brute-forced codes, self-granting admin through the API.
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { createGuard, isOwner, isOwnerEmail, OWNER_EMAIL, IDLE_MS } = require('../admin-guard');

const ROOT = path.join(__dirname, '..');
const { fetch } = globalThis;

test('only the exact, verified owner email counts as the owner', () => {
  assert.strictEqual(OWNER_EMAIL, 'atriuminstitutereal@gmail.com');
  assert.ok(isOwner({ email: 'atriuminstitutereal@gmail.com', verified: true }));
  assert.ok(isOwner({ email: ' AtriumInstituteReal@Gmail.com ', verified: true }));
  assert.ok(!isOwner({ email: 'atriuminstitutereal@gmail.com', verified: false }));
  for (const e of ['atrium.institutereal@gmail.com', 'atriuminstitutereal+x@gmail.com', 'atriuminstitutereal@gmail.co',
    'xatriuminstitutereal@gmail.com', 'atriuminstitutereal@googlemail.com', 'аtriuminstitutereal@gmail.com', '', null]) {
    assert.ok(!isOwnerEmail(e), String(e));
  }
  assert.ok(!isOwner({ email: 'someone@example.com', verified: true, is_admin: true }));
});

test('step-up codes: wrong guesses burn the code and lock the panel', () => {
  let t = 0;
  const g = createGuard({ now: () => t, log: { warn() {}, error() {} } });
  const first = g.issueCode('u1', 'sess');
  assert.ok(first.ok && /^\d{6}$/.test(first.code));
  const wrong = first.code === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) assert.strictEqual(g.verifyCode('u1', 'sess', wrong).reason, 'invalid');
  assert.strictEqual(g.verifyCode('u1', 'sess', wrong).reason, 'invalid'); // 5th guess burns the code
  assert.strictEqual(g.verifyCode('u1', 'sess', first.code).reason, 'expired');
  const second = g.issueCode('u1', 'sess');
  assert.ok(second.ok);
  g.verifyCode('u1', 'sess', wrong); g.verifyCode('u1', 'sess', wrong);
  assert.strictEqual(g.verifyCode('u1', 'sess', wrong).reason, 'locked'); // 8 failures in total
  assert.strictEqual(g.verifyCode('u1', 'sess', second.code).reason, 'locked');
  assert.strictEqual(g.issueCode('u1', 'sess').reason, 'locked');
  t += 31 * 60 * 1000;
  assert.ok(g.issueCode('u1', 'sess').ok);
});

test('step-up codes are bound to the session, expire, and are rate limited', () => {
  let t = 0;
  const g = createGuard({ now: () => t, log: { warn() {}, error() {} } });
  const c = g.issueCode('u1', 'sessA');
  assert.strictEqual(g.verifyCode('u1', 'sessB', c.code).reason, 'expired');
  t += 11 * 60 * 1000;
  assert.strictEqual(g.verifyCode('u1', 'sessA', c.code).reason, 'expired');
  assert.ok(g.issueCode('u1', 'sessA').ok);
  assert.ok(g.issueCode('u1', 'sessA').ok);
  assert.strictEqual(g.issueCode('u1', 'sessA').reason, 'rate');
});

test('unlock tokens are bound to user and session and expire when idle or old', () => {
  let t = 0;
  const g = createGuard({ now: () => t, log: { warn() {}, error() {} } });
  const { code } = g.issueCode('u1', 'sess');
  const { token } = g.verifyCode('u1', 'sess', code);
  assert.ok(g.checkUnlock('u1', 'sess', token));
  assert.strictEqual(g.checkUnlock('u2', 'sess', token), null); // other user: also revokes it
  const again = g.verifyCode('u1', 'sess', g.issueCode('u1', 'sess').code).token;
  assert.strictEqual(g.checkUnlock('u1', 'otherSession', again), null);
  const t3 = g.verifyCode('u1', 'sess', g.issueCode('u1', 'sess').code).token;
  t += IDLE_MS + 1;
  assert.strictEqual(g.checkUnlock('u1', 'sess', t3), null);
  t += 60 * 60 * 1000; // new send window
  const t4 = g.verifyCode('u1', 'sess', g.issueCode('u1', 'sess').code).token;
  for (let i = 0; i < 4; i++) { t += 25 * 60 * 1000; assert.ok(g.checkUnlock('u1', 'sess', t4), 'active use keeps it'); }
  t += 25 * 60 * 1000; // now past the 2-hour absolute limit
  assert.strictEqual(g.checkUnlock('u1', 'sess', t4), null);
});

test('admin API end to end: owner-only, step-up, CSRF, audit', async (t) => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atrium-admin-'));
  const PORT = 19000 + Math.floor(Math.random() * 900);
  const BASE = `http://127.0.0.1:${PORT}`;
  const dbPath = path.join(tmp, 'db.json');
  let child, out = '';
  const start = async () => {
    out = '';
    child = spawn(process.execPath, ['server.js'], { cwd: ROOT,
      env: { ...process.env, PORT: String(PORT), DB_PATH: dbPath, DATABASE_URL: '', RESEND_API_KEY: '', RENDER: '', NODE_ENV: 'test' } });
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { out += d; });
    for (let i = 0; i < 80; i++) { try { await fetch(BASE + '/api/config'); return; } catch { await new Promise(r => setTimeout(r, 100)); } }
    throw new Error('server did not start');
  };
  const stop = () => new Promise(r => { child.once('exit', r); child.kill(); });
  t.after(async () => { if (child && child.exitCode === null) await stop(); fs.rmSync(tmp, { recursive: true, force: true }); });

  const waitFor = async (re, from) => {
    for (let i = 0; i < 50; i++) { const m = out.slice(from).match(re); if (m) return m[1]; await new Promise(r => setTimeout(r, 50)); }
    throw new Error('no code in server output');
  };
  const login = async (email) => {
    const from = out.length;
    const r = await fetch(BASE + '/api/auth/signup', { method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, role: 'student', age: 30, gradeLevel: 12, country: 'US' }) });
    assert.ok(r.ok, 'signup ' + r.status);
    const code = await waitFor(/VERIFICATION CODE[\s\S]*?→\s+(\d{6})/, from);
    const v = await fetch(BASE + '/api/auth/verify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, code }) });
    return (v.headers.get('set-cookie') || '').match(/atrium_session=([^;]+)/)[1];
  };
  const call = (p, { session, admin, method = 'GET', body, header = true, origin = BASE } = {}) => {
    const headers = { cookie: [session && `atrium_session=${session}`, admin && `atrium_admin=${admin}`].filter(Boolean).join('; ') };
    if (header) headers['x-atrium-admin'] = '1';
    if (origin && method !== 'GET') headers.origin = origin;
    if (body) headers['content-type'] = 'application/json';
    return fetch(BASE + p, { method, headers, body: body ? JSON.stringify(body) : undefined });
  };

  await start();
  const owner = await login(OWNER_EMAIL);
  const intruder = await login('intruder@example.com');
  // Give the intruder the is_admin flag directly in the database.
  await stop();
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const users = Array.isArray(db.users) ? db.users : Object.values(db.users);
  const intruderRow = users.find(u => u.email === 'intruder@example.com');
  intruderRow.is_admin = true;
  fs.writeFileSync(dbPath, JSON.stringify(db));
  await start();

  // 1. Another account with the flag gets nothing, and /me doesn't call it an admin.
  for (const p of ['/api/admin/stats', '/api/admin/users', '/api/admin/audit', '/api/admin/auth/status']) {
    assert.strictEqual((await call(p, { session: intruder })).status, 404, p);
  }
  assert.strictEqual((await call('/api/admin/auth/send', { session: intruder, method: 'POST' })).status, 404);
  const me = await (await fetch(BASE + '/api/auth/me', { headers: { cookie: 'atrium_session=' + intruder } })).json();
  assert.strictEqual((me.user || me).is_admin, false);
  // Signed out: 401. Owner without the admin header: 403.
  assert.strictEqual((await call('/api/admin/stats')).status, 401);
  assert.strictEqual((await call('/api/admin/stats', { session: owner, header: false })).status, 403);

  // 2. Owner must unlock first.
  const locked = await call('/api/admin/stats', { session: owner });
  assert.strictEqual(locked.status, 401);
  assert.strictEqual((await locked.json()).stepUp, true);
  // Cross-site POST is refused even for the owner.
  assert.strictEqual((await call('/api/admin/auth/send', { session: owner, method: 'POST', origin: 'https://evil.example' })).status, 403);
  assert.strictEqual((await call('/api/admin/auth/send', { session: owner, method: 'POST', origin: null })).status, 403);

  const from = out.length;
  assert.strictEqual((await call('/api/admin/auth/send', { session: owner, method: 'POST' })).status, 200);
  const code = await waitFor(/ADMIN PANEL CODE[^→]*→\s+(\d{6})/, from);
  const wrong = code === '000000' ? '111111' : '000000';
  assert.strictEqual((await call('/api/admin/auth/verify', { session: owner, method: 'POST', body: { code: wrong } })).status, 400);
  const ok = await call('/api/admin/auth/verify', { session: owner, method: 'POST', body: { code } });
  assert.strictEqual(ok.status, 200);
  const cookie = ok.headers.get('set-cookie');
  assert.match(cookie, /atrium_admin=[0-9a-f]{64}; Path=\/api\/admin; HttpOnly; SameSite=Strict/);
  const admin = cookie.match(/atrium_admin=([0-9a-f]+)/)[1];

  assert.strictEqual((await call('/api/admin/stats', { session: owner, admin })).status, 200);
  assert.strictEqual((await call('/api/admin/stats', { session: owner, admin })).headers.get('cache-control'), 'no-store');
  // 3. The admin cookie is useless to anyone else, or to a different owner login.
  assert.strictEqual((await call('/api/admin/stats', { session: intruder, admin })).status, 404);
  const owner2 = await login(OWNER_EMAIL);
  assert.strictEqual((await call('/api/admin/stats', { session: owner2, admin })).status, 401);

  // 4. Nobody can be made an admin through the API.
  const unlockAgain = async () => {
    const f = out.length;
    await call('/api/admin/auth/send', { session: owner2, method: 'POST' });
    const c = await waitFor(/ADMIN PANEL CODE[^→]*→\s+(\d{6})/, f);
    const r = await call('/api/admin/auth/verify', { session: owner2, method: 'POST', body: { code: c } });
    return r.headers.get('set-cookie').match(/atrium_admin=([0-9a-f]+)/)[1];
  };
  const admin2 = await unlockAgain();
  const list = await (await call('/api/admin/users', { session: owner2, admin: admin2 })).json();
  const target = list.users.find(u => u.email === 'intruder@example.com');
  const patch = await call(`/api/admin/users/${target.id}`, { session: owner2, admin: admin2, method: 'PATCH', body: { is_admin: true } });
  assert.strictEqual(patch.status, 400);

  // 5. Audit log shows the denied attempts and the unlocks.
  const { entries } = await (await call('/api/admin/audit', { session: owner2, admin: admin2 })).json();
  assert.ok(entries.some(e => e.outcome === 'denied' && e.email === 'intruder@example.com'));
  assert.ok(entries.some(e => e.action === 'unlock admin panel' && e.outcome === 'ok'));
  assert.ok(entries.some(e => e.action === 'unlock admin panel' && e.outcome === 'denied'));

  // 6. Locking or signing out ends the unlock.
  assert.strictEqual((await call('/api/admin/auth/lock', { session: owner2, admin: admin2, method: 'POST' })).status, 200);
  assert.strictEqual((await call('/api/admin/stats', { session: owner2, admin: admin2 })).status, 401);
  assert.match(out, /ADMIN PANEL CODE/);
});
