// Startup curriculum sync: imports a subject when its JSON changed, skips
// it when the stored hash matches, and rolls back on failure.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { syncCurriculum, curriculumFiles, loadFile } = require('../curriculum-import-lib');

function fakePool({ failOn } = {}) {
  const hashes = new Map();
  const log = [];
  const client = {
    async query(sql, params = []) {
      log.push(sql.trim().split(/\s+/).slice(0, 3).join(' '));
      if (failOn && sql.includes(failOn)) throw new Error('boom');
      if (/^select content_hash/.test(sql.trim())) {
        const h = hashes.get(params[0]);
        return { rows: h ? [{ content_hash: h }] : [] };
      }
      if (/^insert into curriculum_sync/.test(sql.trim())) hashes.set(params[0], params[1]);
      return { rows: [] };
    },
    release() {},
  };
  return { hashes, log, pool: { query: client.query, connect: async () => client } };
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
