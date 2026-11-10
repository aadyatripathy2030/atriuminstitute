// Quiz points rules (quiz-lib.js): one pass payout per section per day,
// a daily cap, and a pass has to hold up on its own answers.
const test = require('node:test');
const assert = require('node:assert');
const { pointsForAttempt, earnedPass, MAX_ATTEMPT_AWARDS_PER_DAY } = require('../quiz-lib');

const VALUES = { quiz_passed: 50, quiz_attempted: 10 };
const now = new Date('2026-11-10T15:00:00Z');
const ans = (n, correct, overridden = 0) => Array.from({ length: n }, (_, i) => ({
  correct: i < correct, overridden: i < overridden,
}));
const attempt = (extra) => ({ courseId: 'algebra', bookId: 'b1', sectionIdx: 0, sectionKind: 'section', total: 10, score: 8, passed: true, answers: ans(10, 8), ...extra });
const row = (extra) => ({ course_id: 'algebra', book_id: 'b1', section_idx: 0, section_kind: 'section', passed: true, completed_at: '2026-11-10T09:00:00Z', ...extra });

test('a real pass earns pass points the first time that day', () => {
  assert.deepStrictEqual(pointsForAttempt(attempt(), [], VALUES, now), { points: 50, kind: 'passed' });
});

test('passing the same section again that day earns attempt points only', () => {
  assert.strictEqual(pointsForAttempt(attempt(), [row()], VALUES, now).points, 10);
  // ...but a pass from yesterday doesn't block today's.
  assert.strictEqual(pointsForAttempt(attempt(), [row({ completed_at: '2026-11-09T20:00:00Z' })], VALUES, now).points, 50);
  // ...and a different section still pays.
  assert.strictEqual(pointsForAttempt(attempt({ sectionIdx: 1 }), [row()], VALUES, now).points, 50);
});

test('a claimed pass that the answers do not support earns attempt points', () => {
  assert.strictEqual(earnedPass(attempt({ answers: ans(10, 3), score: 3 })), false); // 30%
  assert.strictEqual(earnedPass(attempt({ score: 10 })), false);                   // score disagrees with answers
  assert.strictEqual(earnedPass(attempt({ answers: ans(4, 4), score: 4 })), false); // answers missing
  assert.strictEqual(earnedPass(attempt({ answers: ans(10, 8, 3) })), false);       // pass only via "count it"
  assert.strictEqual(pointsForAttempt(attempt({ answers: ans(10, 8, 3) }), [], VALUES, now).points, 10);
});

test('attempt points stop after the daily cap', () => {
  const many = Array.from({ length: MAX_ATTEMPT_AWARDS_PER_DAY }, (_, i) => row({ section_idx: i, passed: false }));
  assert.deepStrictEqual(pointsForAttempt(attempt({ sectionIdx: 99 }), many, VALUES, now), { points: 0, kind: 'capped' });
});
