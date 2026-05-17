// Tests for db.js. Uses a temp DB_PATH so the real ./data.json is never touched.
//
// DATABASE_URL must be unset (it's overridden below in case the developer has
// it in their shell), so db.js picks the JSON-file backend. All tests in this
// file share state, so each one uses a unique email to stay independent.

const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

delete process.env.DATABASE_URL;
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atrium-db-'));
process.env.DB_PATH = path.join(tmpDir, 'data.json');

const db = require('../db');

test.after(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

test('upsertUser creates a new student by default', async () => {
  const u = await db.upsertUser('alice@example.com');
  assert.equal(u.email, 'alice@example.com');
  assert.equal(u.verified, false);
  assert.equal(u.role, 'student');
  assert.ok(u.id, 'user should have an id');
});

test('upsertUser accepts and persists a parent role on creation', async () => {
  const u = await db.upsertUser('parent1@example.com', 'parent');
  assert.equal(u.role, 'parent');
  const again = await db.upsertUser('parent1@example.com', 'student');
  assert.equal(again.role, 'parent', 'role should not change on subsequent signup attempts');
});

test('upsertUser returns the same user on case-insensitive lookup', async () => {
  const u1 = await db.upsertUser('bob@example.com');
  const u2 = await db.upsertUser('BOB@example.com');
  assert.equal(u1.id, u2.id);
});

test('createCode produces a 6-digit numeric code', async () => {
  await db.upsertUser('carol@example.com');
  const code = await db.createCode('carol@example.com');
  assert.match(code, /^\d{6}$/);
});

test('verifyCode succeeds with the right code, exactly once', async () => {
  await db.upsertUser('dave@example.com');
  const code = await db.createCode('dave@example.com');
  assert.deepEqual(await db.verifyCode('dave@example.com', code), { ok: true });
  const second = await db.verifyCode('dave@example.com', code);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'used');
});

test('verifyCode rejects wrong codes as invalid', async () => {
  await db.upsertUser('eve@example.com');
  await db.createCode('eve@example.com');
  const result = await db.verifyCode('eve@example.com', '000000');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'invalid');
});

test('createCode invalidates the previous code for the same email', async () => {
  await db.upsertUser('frank@example.com');
  const code1 = await db.createCode('frank@example.com');
  const code2 = await db.createCode('frank@example.com');
  if (code1 === code2) return; // skip on rare collision
  assert.equal((await db.verifyCode('frank@example.com', code1)).ok, false);
  assert.equal((await db.verifyCode('frank@example.com', code2)).ok, true);
});

test('createSession produces a 64-char hex token that getSession resolves', async () => {
  const u = await db.upsertUser('gina@example.com');
  const token = await db.createSession(u.id);
  assert.match(token, /^[0-9a-f]{64}$/);
  const session = await db.getSession(token);
  assert.equal(session.userId, u.id);
});

test('deleteSession makes getSession return null', async () => {
  const u = await db.upsertUser('hank@example.com');
  const token = await db.createSession(u.id);
  await db.deleteSession(token);
  assert.equal(await db.getSession(token), null);
});

test('getSession returns null for unknown / empty tokens', async () => {
  assert.equal(await db.getSession(null), null);
  assert.equal(await db.getSession(''), null);
  assert.equal(await db.getSession('not-a-real-token'), null);
});

test('setProgress and getAllProgress round-trip per-user', async () => {
  const u = await db.upsertUser('iris@example.com');
  await db.setProgress(u.id, 'algebra:b1:s0', { passed: true, score: 5 });
  await db.setProgress(u.id, 'algebra:b1:s1', { passed: false });
  const all = await db.getAllProgress(u.id);
  assert.deepEqual(all['algebra:b1:s0'], { passed: true, score: 5 });
  assert.deepEqual(all['algebra:b1:s1'], { passed: false });
  assert.ok(typeof all.__updatedAt === 'number');
});

test('getAllProgress returns {} for a user with no progress', async () => {
  const u = await db.upsertUser('jane@example.com');
  assert.deepEqual(await db.getAllProgress(u.id), {});
});

test('markVerified flips the verified flag', async () => {
  const u = await db.upsertUser('kyle@example.com');
  assert.equal(u.verified, false);
  await db.markVerified(u.id);
  const after = await db.getUser(u.id);
  assert.equal(after.verified, true);
});

test('the active db backend is jsonfile (DATABASE_URL is unset for tests)', () => {
  assert.equal(db.backend, 'jsonfile');
});
