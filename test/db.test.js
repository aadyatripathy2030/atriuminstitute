// Tests for db.js. Uses a temp DB_PATH so the real ./data.json is never touched.
//
// All tests in this file share the same module state (db.js caches it), so
// each test uses a unique email/userId to stay independent.

const fs = require('fs');
const os = require('os');
const path = require('path');
const test = require('node:test');
const assert = require('node:assert/strict');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'atrium-db-'));
process.env.DB_PATH = path.join(tmpDir, 'data.json');

const db = require('../db');

test.after(() => {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }
});

test('upsertUser creates a new user when email is unknown', () => {
  const u = db.upsertUser('alice@example.com');
  assert.equal(u.email, 'alice@example.com');
  assert.equal(u.verified, false);
  assert.ok(u.id, 'user should have an id');
  assert.ok(typeof u.createdAt === 'number');
});

test('upsertUser returns the same user on case-insensitive lookup', () => {
  const u1 = db.upsertUser('bob@example.com');
  const u2 = db.upsertUser('BOB@example.com');
  assert.equal(u1.id, u2.id);
});

test('createCode produces a 6-digit numeric code', () => {
  db.upsertUser('carol@example.com');
  const code = db.createCode('carol@example.com');
  assert.match(code, /^\d{6}$/);
});

test('verifyCode succeeds with the right code, exactly once', () => {
  db.upsertUser('dave@example.com');
  const code = db.createCode('dave@example.com');
  assert.deepEqual(db.verifyCode('dave@example.com', code), { ok: true });
  // Second attempt with the same code must fail as "used".
  const second = db.verifyCode('dave@example.com', code);
  assert.equal(second.ok, false);
  assert.equal(second.reason, 'used');
});

test('verifyCode rejects wrong codes as invalid', () => {
  db.upsertUser('eve@example.com');
  db.createCode('eve@example.com');
  const result = db.verifyCode('eve@example.com', '000000');
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'invalid');
});

test('createCode invalidates the previous code for the same email', () => {
  db.upsertUser('frank@example.com');
  const code1 = db.createCode('frank@example.com');
  const code2 = db.createCode('frank@example.com');
  // Very rarely the two random codes collide; the test only makes sense when they differ.
  if (code1 === code2) return;
  assert.equal(db.verifyCode('frank@example.com', code1).ok, false);
  assert.equal(db.verifyCode('frank@example.com', code2).ok, true);
});

test('createSession produces a 64-char hex token that getSession resolves', () => {
  const u = db.upsertUser('gina@example.com');
  const token = db.createSession(u.id);
  assert.match(token, /^[0-9a-f]{64}$/);
  const session = db.getSession(token);
  assert.equal(session.userId, u.id);
});

test('deleteSession makes getSession return null', () => {
  const u = db.upsertUser('hank@example.com');
  const token = db.createSession(u.id);
  db.deleteSession(token);
  assert.equal(db.getSession(token), null);
});

test('getSession returns null for unknown / empty tokens', () => {
  assert.equal(db.getSession(null), null);
  assert.equal(db.getSession(''), null);
  assert.equal(db.getSession('not-a-real-token'), null);
});

test('setProgress and getAllProgress round-trip per-user', () => {
  const u = db.upsertUser('iris@example.com');
  db.setProgress(u.id, 'algebra:b1:s0', { passed: true, score: 5 });
  db.setProgress(u.id, 'algebra:b1:s1', { passed: false });
  const all = db.getAllProgress(u.id);
  assert.deepEqual(all['algebra:b1:s0'], { passed: true, score: 5 });
  assert.deepEqual(all['algebra:b1:s1'], { passed: false });
  assert.ok(typeof all.__updatedAt === 'number');
});

test('getAllProgress returns {} for a user with no progress', () => {
  const u = db.upsertUser('jane@example.com');
  assert.deepEqual(db.getAllProgress(u.id), {});
});

test('markVerified flips the verified flag', () => {
  const u = db.upsertUser('kyle@example.com');
  assert.equal(u.verified, false);
  db.markVerified(u.id);
  assert.equal(db.getUser(u.id).verified, true);
});
