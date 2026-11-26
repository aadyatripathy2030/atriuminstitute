// Startup curriculum sync: imports a subject when its JSON changed, skips
// it when the stored hash matches, and rolls back on failure.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { syncCurriculum, curriculumFiles, loadFile } = require('../curriculum-import-lib');

function fakePool({ failOn, existing = [] } = {}) {
  const hashes = new Map();
  const log = [];
  const deletes = [];
  const client = {
    async query(sql, params = []) {
      log.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
      if (failOn && sql.includes(failOn)) throw new Error('boom');
      if (/^select content_hash/.test(sql.trim())) {
        const h = hashes.get(params[0]);
        return { rows: h ? [{ content_hash: h }] : [] };
      }
      if (/^insert into curriculum_sync/.test(sql.trim())) hashes.set(params[0], params[1]);
      if (/from curriculum_lessons cl join/.test(sql)) return { rows: existing };
      if (/^delete from (curriculum_lesson_quizzes|cached_lessons)/.test(sql.trim())) deletes.push([sql.trim().split(/\s+/)[2], ...params]);
      return { rows: [] };
    },
    release() {},
  };
  return { hashes, log, deletes, pool: { query: client.query, connect: async () => client } };
}

const quiet = { log() {} };

test('every curriculum file is valid and lesson totals match', () => {
  const files = curriculumFiles();
  assert.ok(files.length >= 2);
  for (const f of files) {
    const data = loadFile(f);
    for (const c of data.courses) {
      const n = c.units.reduce((s, u) => s + u.lessons.length, 0);
      assert.strictEqual(c.total_lessons, n, `${c.id} total_lessons`);
      if (data.subject.id === 'language_arts') assert.ok(c.id.startsWith('la-'), `${c.id} needs la- prefix`);
      const nums = c.units.flatMap(u => u.lessons.map(l => l.lesson_number));
      assert.strictEqual(new Set(nums).size, nums.length, `${c.id} duplicate lesson numbers`);
    }
  }
});

test('first sync imports every subject, second sync is a no-op', async () => {
  const { pool, log } = fakePool();
  const first = await syncCurriculum(pool, quiet);
  assert.ok(first.length >= 2 && first.every(r => r.changed));
  const inserts = log.filter(l => l.startsWith('insert into curriculum_courses')).length;
  assert.ok(inserts > 0);
  log.length = 0;
  const second = await syncCurriculum(pool, quiet);
  assert.ok(second.every(r => !r.changed));
  assert.strictEqual(log.filter(l => l.startsWith('delete')).length, 0);
});

test('a failed import rolls back and does not record the hash', async () => {
  const { pool, log, hashes } = fakePool({ failOn: 'insert into curriculum_lessons' });
  await assert.rejects(syncCurriculum(pool, quiet), /boom/);
  assert.ok(log.includes('rollback'));
  assert.strictEqual(hashes.size, 0);
});

test('the server runs the sync at startup', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(src, /syncCurriculum\(db\._pool\)/);
});

test('units list in display order but keep their stable unit numbers', async () => {
  const dbj = require('../db-jsonfile');
  const full = await dbj.getCurriculumCourseFull('algebra1');
  const firstTwo = full.units.slice(0, 2).map(u => [u.position, u.unit_number]);
  assert.deepStrictEqual(firstTwo, [[1, 2], [2, 10]]);
  const listed = (await dbj.listCurriculumCourses({ subject: 'math', withUnits: true })).find(c => c.id === 'algebra1');
  assert.deepStrictEqual(listed.units.map(u => u.unit_number), full.units.map(u => u.unit_number));
  for (const u of full.units) assert.ok(u.lessons.every(l => l.lesson_number.startsWith(u.unit_number + '.')));
});

test('a re-import clears cached quizzes and lessons only for edited lessons', async () => {
  const data = loadFile(curriculumFiles().find(f => f.endsWith('math.json')));
  const course = data.courses.find(c => c.id === 'algebra1');
  const unit = course.units.find(u => u.unit_number === 2);
  const fields = ['lesson_title', 'learning_objective', 'ccss_code', 'key_concepts', 'prerequisites',
    'key_vocabulary', 'common_misconceptions', 'real_world_hook', 'practices'];
  const row = (l, patch = {}) => ({ course_id: 'algebra1', unit_number: 2, ...Object.fromEntries(fields.map(f => [f, l[f]])), lesson_number: l.lesson_number, ...patch });
  const existing = [row(unit.lessons[0]), row(unit.lessons[1], { key_concepts: 'old wording' })];
  const { pool, deletes } = fakePool({ existing });
  await syncCurriculum(pool, quiet);
  assert.deepStrictEqual(deletes, [
    ['curriculum_lesson_quizzes', 'algebra1', unit.lessons[1].lesson_number],
    ['cached_lessons', 'curr:algebra1', 'curr:algebra1:u2', 1],
  ]);
});
