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

// ---------- Linking ----------

test('every new user gets a unique 8-char link_code', async () => {
  const a = await db.upsertUser('linktest1@example.com');
  const b = await db.upsertUser('linktest2@example.com');
  assert.match(a.link_code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.match(b.link_code, /^[A-HJ-NP-Z2-9]{8}$/);
  assert.notEqual(a.link_code, b.link_code);
});

test('createLinkFromCode connects a parent to a student and grants consent', async () => {
  const student = await db.upsertUser('kid1@example.com', 'student');
  await db.updateUserProfile(student.id, { age: 10, country: 'United States' });
  const refreshed = await db.getUser(student.id);
  assert.equal(refreshed.consent_required, true);
  assert.equal(refreshed.consent_granted_at, null);

  const parent = await db.upsertUser('mom1@example.com', 'parent');
  const result = await db.createLinkFromCode(parent.id, student.link_code);
  assert.equal(result.ok, true);

  const after = await db.getUser(student.id);
  assert.ok(after.consent_granted_at, 'consent should be granted once a parent links');

  const linked = await db.listLinkedStudents(parent.id);
  assert.equal(linked.length, 1);
  assert.equal(linked[0].id, student.id);
});

test('createLinkFromCode rejects same-role and self links', async () => {
  const studentA = await db.upsertUser('studentA@example.com', 'student');
  const studentB = await db.upsertUser('studentB@example.com', 'student');
  const same = await db.createLinkFromCode(studentA.id, studentB.link_code);
  assert.equal(same.ok, false);
  assert.equal(same.reason, 'same-role');

  const self = await db.createLinkFromCode(studentA.id, studentA.link_code);
  assert.equal(self.ok, false);
  assert.equal(self.reason, 'self');
});

test('isParentOfStudent enforces authorisation correctly', async () => {
  const student = await db.upsertUser('iso-student@example.com', 'student');
  const parent = await db.upsertUser('iso-parent@example.com', 'parent');
  const stranger = await db.upsertUser('iso-stranger@example.com', 'parent');
  await db.createLinkFromCode(parent.id, student.link_code);
  assert.equal(await db.isParentOfStudent(parent.id, student.id), true);
  assert.equal(await db.isParentOfStudent(stranger.id, student.id), false);
});

// ---------- Activity log + quiz attempts ----------

test('logQuizAttempt records the attempt and an activity entry', async () => {
  const u = await db.upsertUser('quizzer1@example.com', 'student');
  await db.logQuizAttempt(u.id, {
    courseId: 'algebra', bookId: 'b1', sectionIdx: 0,
    score: 8, total: 10, passed: true,
  });
  const attempts = await db.listQuizAttempts(u.id);
  assert.equal(attempts.length, 1);
  assert.equal(attempts[0].score, 8);
  assert.equal(attempts[0].passed, true);

  const activity = await db.listActivity(u.id);
  assert.ok(activity.some(a => a.kind === 'quiz_pass'));
});

test('listWeakSections surfaces sections failed >= the threshold', async () => {
  const u = await db.upsertUser('weakstudent@example.com', 'student');
  // Two failures on the same section; one on another.
  for (let i = 0; i < 2; i++) {
    await db.logQuizAttempt(u.id, { courseId: 'algebra', bookId: 'b1', sectionIdx: 0, score: 4, total: 10, passed: false });
  }
  await db.logQuizAttempt(u.id, { courseId: 'algebra', bookId: 'b2', sectionIdx: 1, score: 5, total: 10, passed: false });

  const weak = await db.listWeakSections(u.id, 2);
  assert.equal(weak.length, 1);
  assert.equal(weak[0].book_id, 'b1');
  assert.equal(Number(weak[0].failures), 2);
});

// ---------- Profile / consent helper ----------

test('consent helper returns true for ages under 13 and false otherwise', () => {
  const fn = require('../db-jsonfile')._consentRequiredForAge;
  assert.equal(fn(8), true);
  assert.equal(fn(12), true);
  assert.equal(fn(13), false);
  assert.equal(fn(45), false);
  assert.equal(fn(null), false);
});

// ---------- Profiles ----------

test('upsertStudentProfile defaults sensibly and saves partial updates', async () => {
  const u = await db.upsertUser('profile1@example.com', 'student');
  const p1 = await db.upsertStudentProfile(u.id, {
    displayName: 'Test Student', schoolName: 'Atrium HS', gradeLevel: '9th',
    subjects: ['math'], studyPlanCourses: ['algebra', 'geometry'],
    studyGoal: 'Ace Algebra 1', timezone: 'America/Los_Angeles',
    reminderEnabled: true, reminderFrequency: 'mwf', reminderTimeLocal: '17:30',
    reminderContent: 'continuation',
  });
  assert.equal(p1.display_name, 'Test Student');
  assert.equal(p1.timezone, 'America/Los_Angeles');
  assert.deepEqual(p1.subjects, ['math']);
  assert.equal(p1.reminder_frequency, 'mwf');

  // Partial update preserves untouched fields.
  const p2 = await db.upsertStudentProfile(u.id, { reminderEnabled: false });
  assert.equal(p2.reminder_enabled, false);
  assert.equal(p2.display_name, 'Test Student');
  assert.equal(p2.school_name, 'Atrium HS');
});

test('upsertParentProfile saves preferences', async () => {
  const u = await db.upsertUser('profile-parent@example.com', 'parent');
  const p = await db.upsertParentProfile(u.id, {
    displayName: 'Test Parent', relationship: 'guardian',
    timezone: 'America/New_York',
    weeklyDigestEnabled: true, weeklyDigestDay: 1, weeklyDigestTimeLocal: '08:30',
  });
  assert.equal(p.relationship, 'guardian');
  assert.equal(p.weekly_digest_day, 1);
});

test('setParentAuthorisedReminders toggles the student-side flag', async () => {
  const u = await db.upsertUser('auth-target@example.com', 'student');
  let p = await db.setParentAuthorisedReminders(u.id, true);
  assert.equal(p.parent_authorised_reminders, true);
  p = await db.setParentAuthorisedReminders(u.id, false);
  assert.equal(p.parent_authorised_reminders, false);
});
