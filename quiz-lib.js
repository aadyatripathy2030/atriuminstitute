// How many points a submitted quiz attempt earns. Pure, so it can be tested.
//
// The browser grades the quiz, so the server can't fully trust what it
// sends. These rules bound what a tampered or replayed submission can earn:
//   - A pass is recomputed from the per-question answers (70%, answers the
//     student marked "I actually had it right" don't count) and has to agree
//     with the score and total sent.
//   - A section's pass pays out once per day; later passes earn attempt points.
//   - Attempt points stop after MAX_ATTEMPT_AWARDS_PER_DAY attempts a day.

const PASS_RATIO = 0.7;
const MAX_ATTEMPT_AWARDS_PER_DAY = 20;

function sameDay(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

function sectionKey(a) {
  return [a.courseId ?? a.course_id, a.bookId ?? a.book_id,
    a.sectionKind ?? a.section_kind ?? 'section', a.sectionIdx ?? a.section_idx].join('|');
}

// True if the attempt really is a pass on its own answers.
function earnedPass(attempt) {
  const answers = Array.isArray(attempt.answers) ? attempt.answers : [];
  const total = attempt.total;
  if (!Number.isInteger(total) || total <= 0 || answers.length !== total) return false;
  const counted = answers.filter(a => a && a.correct && !a.overridden).length;
  const claimed = answers.filter(a => a && a.correct).length;
  if (attempt.score !== claimed) return false; // score and answers disagree
  return attempt.passed === true && counted / total >= PASS_RATIO;
}

// earlier: this user's previous attempts (newest first is fine), rows as the
// DB returns them: { course_id, book_id, section_kind, section_idx, completed_at,
// points_awarded? }. Returns { points, kind }.
function pointsForAttempt(attempt, earlier, values, now = new Date()) {
  const today = (earlier || []).filter(r => r && r.completed_at && sameDay(new Date(r.completed_at), now));
  if (today.length >= MAX_ATTEMPT_AWARDS_PER_DAY) return { points: 0, kind: 'capped' };
  if (earnedPass(attempt)) {
    const key = sectionKey(attempt);
    const alreadyPassedToday = today.some(r => r.passed && sectionKey(r) === key);
    if (!alreadyPassedToday) return { points: values.quiz_passed, kind: 'passed' };
  }
  return { points: values.quiz_attempted, kind: 'attempted' };
}

module.exports = { PASS_RATIO, MAX_ATTEMPT_AWARDS_PER_DAY, earnedPass, pointsForAttempt };
