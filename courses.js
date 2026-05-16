// Aggregates all courses and exposes the current selection.
const COURSES = {
  prealgebra: PREALGEBRA_COURSE,
  algebra: ALGEBRA_COURSE,
  algebra2: ALGEBRA2_COURSE,
  geometry: GEOMETRY_COURSE,
  precalc: PRECALC_COURSE,
  calculus: CALCULUS_COURSE,
  eng6: ENGLISH_G6_COURSE,
  eng7: ENGLISH_G7_COURSE,
  eng8: ENGLISH_G8_COURSE,
  eng9: ENGLISH_G9_COURSE,
  eng10: ENGLISH_G10_COURSE,
  eng11: ENGLISH_G11_COURSE,
  eng12: ENGLISH_G12_COURSE
};

// Tag each course with a subject so filtering works.
Object.values(COURSES).forEach(c => {
  if (!c.subject) c.subject = c.id.startsWith('eng') ? 'english' : 'math';
});

// Note: section-count cap (15 per course) is applied at the end of extras.js
// so it runs AFTER base-data extras have been appended.

// COURSE is a live alias for the currently selected course's content.
// It's mutated by setCourse() so existing code that reads COURSE.books keeps working.
let COURSE = COURSES.prealgebra;

function setCourse(id) {
  if (!COURSES[id]) return false;
  COURSE = COURSES[id];
  return true;
}
