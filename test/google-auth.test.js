// Sign in / sign up with Google, end to end against a local stand-in for
// Google's token endpoint. The "code" the browser brings back is the
// base64url JSON of the claims the stand-in should put in the id_token.
const test = require('node:test');
const assert = require('node:assert');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { OWNER_EMAIL } = require('../admin-guard');

const { fetch } = globalThis;
const ROOT = path.join(__dirname, '..');
const CLIENT_ID = 'test-client.apps.googleusercontent.com';
const b64u = o => Buffer.from(JSON.stringify(o)).toString('base64url');

test('Google sign-in and sign-up', async (t) => {
  const tokenServer = http.createServer((req, res) => {
    let body = ''; req.on('data', c => { body += c; });
    req.on('end', () => {
      const p = new URLSearchParams(body);
      const claims = JSON.parse(Buffer.from(p.get('code'), 'base64url').toString());
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id_token: `${b64u({ alg: 'none' })}.${b64u(claims)}.sig` }));
    });
  });
  await new Promise(r => tokenServer.listen(0, '127.0.0.1', r));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'atrium-google-'));
  const PORT = 20000 + Math.floor(Math.random() * 900);
  const BASE = `http://127.0.0.1:${PORT}`;
  const child = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT: String(PORT),
    DB_PATH: path.join(tmp, 'db.json'), DATABASE_URL: '', RESEND_API_KEY: '', RENDER: '', NODE_ENV: 'test',
    GOOGLE_CLIENT_ID: CLIENT_ID, GOOGLE_CLIENT_SECRET: 'secret',
    // A placeholder so /api/claude reaches its age and consent checks (CI has
    // no real key; those checks answer before anything is sent to Anthropic).
    ANTHROPIC_API_KEY: 'test-placeholder-not-a-real-key',
    GOOGLE_TOKEN_URL_TEST: `http://127.0.0.1:${tokenServer.address().port}/token` } });
  child.stdout.resume(); child.stderr.resume();
  t.after(async () => {
    if (child.exitCode === null) await new Promise(r => { child.once('exit', r); child.kill(); });
    tokenServer.close(); fs.rmSync(tmp, { recursive: true, force: true });
  });
  for (let i = 0; i < 80; i++) { try { await fetch(BASE + '/api/config'); break; } catch { await new Promise(r => setTimeout(r, 100)); } }

  const cfg = await (await fetch(BASE + '/api/config')).json();
  assert.strictEqual(cfg.google_auth, true, 'config reports Google sign-in');

  const claimsFor = (email, extra = {}) => ({ iss: 'https://accounts.google.com', aud: CLIENT_ID, sub: 'g-' + email,
    email, email_verified: true, exp: Math.floor(Date.now() / 1000) + 600, ...extra });
  // Start, then come back from "Google" with the given claims.
  async function google(query, claims, { sendCookie = true } = {}) {
    const s = await fetch(BASE + '/api/auth/google?' + new URLSearchParams(query), { redirect: 'manual' });
    assert.strictEqual(s.status, 302);
    const loc = new URL(s.headers.get('location'), BASE);
    if (loc.hostname !== 'accounts.google.com') return { location: loc };
    const state = loc.searchParams.get('state');
    assert.strictEqual(loc.searchParams.get('scope'), 'openid email');
    assert.strictEqual(loc.searchParams.get('redirect_uri'), BASE + '/api/auth/google/callback');
    const gcookie = (s.headers.get('set-cookie') || '').match(/atrium_gstate=([^;]+)/)[1];
    const cb = await fetch(BASE + '/api/auth/google/callback?' + new URLSearchParams({ state, code: b64u(claims) }),
      { redirect: 'manual', headers: sendCookie ? { cookie: 'atrium_gstate=' + gcookie } : {} });
    const location = new URL(cb.headers.get('location'), BASE);
    const session = ((cb.headers.get('set-cookie') || '').match(/atrium_session=([^;]+)/) || [])[1];
    return { location, session };
  }
  const me = async session => (await (await fetch(BASE + '/api/auth/me', { headers: { cookie: 'atrium_session=' + session } })).json()).user;

  // Sign-up creates the account with the form's details.
  const up = await google({ mode: 'signup', role: 'student', age: '15', grade: '10' }, claimsFor('newkid@example.com'));
  assert.strictEqual(up.location.pathname + up.location.search, '/?google=ok');
  const u = await me(up.session);
  assert.strictEqual(u.email, 'newkid@example.com');
  assert.strictEqual(u.age, 15);
  assert.strictEqual(u.grade_level, 10);

  // Sign-in to that account works; sign-in for an unknown email does not create one.
  const again = await google({ mode: 'signin' }, claimsFor('newkid@example.com'));
  assert.strictEqual((await me(again.session)).email, 'newkid@example.com');
  const nobody = await google({ mode: 'signin' }, claimsFor('nobody@example.com'));
  assert.strictEqual(nobody.location.searchParams.get('google_error'), 'no_account');
  assert.strictEqual(nobody.location.pathname, '/sign-up');
  assert.ok(!nobody.session);

  // A student can sign up without an age (it's the first setup question), but
  // can't use Max until it's answered; an under-13 answer then locks the account.
  const noAge = await google({ mode: 'signup', role: 'student' }, claimsFor('later@example.com'));
  assert.strictEqual((await me(noAge.session)).age ?? null, null);
  const ask = (session) => fetch(BASE + '/api/claude', { method: 'POST', headers: { 'content-type': 'application/json', cookie: 'atrium_session=' + session },
    body: JSON.stringify({ intent: 'chat', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }) });
  const blocked = await ask(noAge.session);
  assert.strictEqual(blocked.status, 403);
  assert.strictEqual((await blocked.json()).error.code, 'age_required');
  const setAge = (session, body) => fetch(BASE + '/api/me/profile', { method: 'POST', headers: { 'content-type': 'application/json', cookie: 'atrium_session=' + session }, body: JSON.stringify(body) });
  const r1 = await (await setAge(noAge.session, { age: 11, gradeLevel: 6 })).json();
  assert.strictEqual(r1.user.age, 11);
  assert.strictEqual(r1.user.consent_required, true);
  assert.strictEqual((await (await ask(noAge.session)).json()).error.code, 'consent_required');
  // ...and the age can't then be changed to get around the lock.
  const r2 = await setAge(noAge.session, { age: 15 });
  assert.strictEqual(r2.status, 400);

  // Under 13: same consent lock as an emailed-code sign-up.
  const kid = await google({ mode: 'signup', role: 'student', age: '10' }, claimsFor('little@example.com'));
  assert.strictEqual((await me(kid.session)).consent_required, true);

  // Parents need no age.
  const parent = await google({ mode: 'signup', role: 'parent' }, claimsFor('mom@example.com'));
  assert.strictEqual((await me(parent.session)).role, 'parent');

  // Refused: an unverified Google email, a token for another app, and a
  // callback without this browser's state cookie (login CSRF).
  const unv = await google({ mode: 'signup', role: 'parent' }, claimsFor('x@example.com', { email_verified: false }));
  assert.strictEqual(unv.location.searchParams.get('google_error'), 'unverified');
  const aud = await google({ mode: 'signup', role: 'parent' }, claimsFor('y@example.com', { aud: 'someone-else' }));
  assert.strictEqual(aud.location.searchParams.get('google_error'), 'failed');
  const csrf = await google({ mode: 'signin' }, claimsFor('newkid@example.com'), { sendCookie: false });
  assert.strictEqual(csrf.location.searchParams.get('google_error'), 'expired');
  assert.ok(!csrf.session);

  // The owner can sign in with Google, but the admin panel still needs its own emailed code.
  const owner = await google({ mode: 'signup', role: 'student', age: '30' }, claimsFor(OWNER_EMAIL));
  assert.strictEqual((await me(owner.session)).is_admin, true);
  const st = await fetch(BASE + '/api/admin/auth/status', { headers: { cookie: 'atrium_session=' + owner.session, 'x-atrium-admin': '1' } });
  assert.strictEqual((await st.json()).unlocked, false);
  const users = await fetch(BASE + '/api/admin/users', { headers: { cookie: 'atrium_session=' + owner.session, 'x-atrium-admin': '1' } });
  assert.strictEqual(users.status, 401);
});
