// Shared curriculum import: loads curriculum/*.json into the curriculum_*
// tables. Used by tools/import-curriculum.js (manual) and by the server's
// startup sync (syncCurriculum below), which re-imports a subject only when
// its JSON file has changed since the last sync.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadFile(p) {
  const raw = fs.readFileSync(p, 'utf8');
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { throw new Error(`Bad JSON in ${p}: ${e.message}`); }
  if (!data.subject || !data.subject.id) {
    throw new Error(`Missing subject.id in ${p}`);
  }
  return data;
}

function summarise(data) {
  const courses = data.courses || [];
  const units = courses.reduce((s, c) => s + (c.units || []).length, 0);
  const lessons = courses.reduce((s, c) => s + (c.units || []).reduce((t, u) => t + (u.lessons || []).length, 0), 0);
  return {
    subject: data.subject.id,
    courses: courses.length,
    units,
    lessons,
    practices: (data.practices || []).length,
    misconceptions: (data.misconceptions || []).length,
    real_world_contexts: (data.real_world_contexts || []).length,
    glossary: (data.glossary || []).length,
  };
}

async function importSubject(client, data) {
  const subjectId = data.subject.id;

  // 1) Wipe this subject's existing rows. ON DELETE CASCADE on courses
  // takes their units and lessons; everything else we hit explicitly.
  await client.query('delete from curriculum_courses where subject_id = $1', [subjectId]);
  await client.query('delete from curriculum_practices where subject_id = $1', [subjectId]);
  await client.query('delete from curriculum_misconceptions where subject_id = $1', [subjectId]);
  await client.query('delete from curriculum_real_world_contexts where subject_id = $1', [subjectId]);
  await client.query('delete from curriculum_glossary where subject_id = $1', [subjectId]);
  await client.query('delete from curriculum_subjects where id = $1', [subjectId]);

  // 2) Subject row.
  await client.query(
    `insert into curriculum_subjects (id, title, display_order, updated_at)
     values ($1, $2, $3, now())`,
    [subjectId, data.subject.title || subjectId, data.subject.display_order || 0]
  );

  // 3) Courses + units + lessons.
  let lessonsInserted = 0;
  for (const c of (data.courses || [])) {
    await client.query(
      `insert into curriculum_courses
         (id, subject_id, title, grade_levels, display_order, total_weeks, total_lessons, legacy_course_id, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8, now())`,
      [c.id, subjectId, c.title, c.grade_levels || [], c.display_order || 0,
       c.total_weeks || null, c.total_lessons || 0, c.legacy_course_id || null]
    );
    let lessonOrder = 0;
    for (const u of (c.units || [])) {
      await client.query(
        `insert into curriculum_units (course_id, unit_number, unit_title, weeks, display_order)
         values ($1, $2, $3, $4, $5)`,
        [c.id, u.unit_number, u.unit_title, u.weeks || null, u.display_order ?? null]
      );
      for (const l of (u.lessons || [])) {
        lessonOrder += 1;
        await client.query(
          `insert into curriculum_lessons
             (course_id, unit_number, lesson_number, lesson_title, learning_objective,
              ccss_code, key_concepts, prerequisites, key_vocabulary, common_misconceptions,
              real_world_hook, practices, meta, display_order)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
          [
            c.id, u.unit_number, l.lesson_number, l.lesson_title, l.learning_objective || null,
            l.ccss_code || null, l.key_concepts || null, l.prerequisites || null,
            l.key_vocabulary || null, l.common_misconceptions || null,
            l.real_world_hook || null, l.practices || null,
            JSON.stringify(l.meta || {}), lessonOrder,
          ]
        );
        lessonsInserted += 1;
      }
    }
  }

  // 4) Practices.
  for (const p of (data.practices || [])) {
    await client.query(
      `insert into curriculum_practices
         (subject_id, code, practice, what_students_do, implications, display_order)
       values ($1, $2, $3, $4, $5, $6)`,
      [subjectId, p.code, p.practice, p.what_students_do || null, p.implications || null, p.display_order || 0]
    );
  }

  // 5) Misconceptions.
  for (const m of (data.misconceptions || [])) {
    await client.query(
      `insert into curriculum_misconceptions
         (subject_id, topic_area, misconception, why_it_happens, diagnostic_approach, remediation)
       values ($1, $2, $3, $4, $5, $6)`,
      [subjectId, m.topic_area || null, m.misconception,
       m.why_it_happens || null, m.diagnostic_approach || null, m.remediation || null]
    );
  }

  // 6) Real-world contexts.
  for (const r of (data.real_world_contexts || [])) {
    await client.query(
      `insert into curriculum_real_world_contexts
         (subject_id, theme, context, math_connections)
       values ($1, $2, $3, $4)`,
      [subjectId, r.theme || null, r.context, r.math_connections || null]
    );
  }

  // 7) Glossary (deduped case-insensitively per subject).
  const seen = new Set();
  let glossaryInserted = 0;
  for (const g of (data.glossary || [])) {
    const key = (g.term || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    await client.query(
      `insert into curriculum_glossary (subject_id, term, definition, first_introduced)
       values ($1, $2, $3, $4)`,
      [subjectId, g.term, g.definition || null, g.first_introduced || null]
    );
    glossaryInserted += 1;
  }

  return { lessons: lessonsInserted, glossaryInserted };
}

const CURRICULUM_DIR = path.join(__dirname, 'curriculum');

function curriculumFiles() {
  if (!fs.existsSync(CURRICULUM_DIR)) return [];
  return fs.readdirSync(CURRICULUM_DIR).filter(f => f.endsWith('.json')).sort()
    .map(f => path.join(CURRICULUM_DIR, f));
}

// Content fields that feed the AI lesson and quiz prompts. When any of
// them changes, the cached lesson text and quiz for that lesson are stale.
const LESSON_FIELDS = ['lesson_title', 'learning_objective', 'ccss_code', 'key_concepts', 'prerequisites',
  'key_vocabulary', 'common_misconceptions', 'real_world_hook', 'practices'];
const fingerprint = l => crypto.createHash('sha1').update(JSON.stringify(LESSON_FIELDS.map(f => l[f] || null))).digest('hex');

async function lessonFingerprints(client, subjectId) {
  const { rows } = await client.query(
    `select cl.course_id, cl.unit_number, cl.lesson_number, ${LESSON_FIELDS.map(f => 'cl.' + f).join(', ')}
     from curriculum_lessons cl join curriculum_courses cc on cc.id = cl.course_id
     where cc.subject_id = $1`, [subjectId]);
  const map = new Map();
  for (const r of rows || []) map.set(`${r.course_id}|${r.lesson_number}`, fingerprint(r));
  return map;
}

// Deletes the cached quiz (curriculum_lesson_quizzes) and cached AI lesson
// (cached_lessons, keyed by the synthetic curr:<course> ids and the lesson's
// 0-based position in its unit) for every lesson whose content changed.
// New lessons have nothing cached; removed lessons' rows are left alone.
async function clearStaleLessonCaches(client, before, data) {
  let n = 0;
  for (const c of data.courses || []) for (const u of c.units || []) {
    for (let i = 0; i < (u.lessons || []).length; i++) {
      const l = u.lessons[i];
      const old = before.get(`${c.id}|${l.lesson_number}`);
      if (!old || old === fingerprint(l)) continue;
      await client.query('delete from curriculum_lesson_quizzes where course_id = $1 and lesson_number = $2', [c.id, l.lesson_number]);
      await client.query('delete from cached_lessons where course_id = $1 and book_id = $2 and section_idx = $3',
        ['curr:' + c.id, `curr:${c.id}:u${u.unit_number}`, i]);
      n++;
    }
  }
  return n;
}

// Re-import each subject whose JSON differs from what was last synced.
// Runs in one transaction per subject, under an advisory lock so two
// instances booting together don't import twice. Cached quizzes and AI
// lessons have no foreign key, so they survive a re-import, except for
// lessons whose content changed (clearStaleLessonCaches).
async function syncCurriculum(pool, log = console) {
  await pool.query(`create table if not exists curriculum_sync (
    subject_id text primary key, content_hash text not null, synced_at timestamptz not null default now())`);
  const results = [];
  for (const file of curriculumFiles()) {
    const raw = fs.readFileSync(file, 'utf8');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    const data = loadFile(file);
    const subjectId = data.subject.id;
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query('select pg_advisory_xact_lock(hashtext($1))', ['curriculum_sync:' + subjectId]);
      const { rows } = await client.query('select content_hash from curriculum_sync where subject_id = $1', [subjectId]);
      if (rows[0] && rows[0].content_hash === hash) {
        await client.query('commit');
        results.push({ subject: subjectId, changed: false });
        continue;
      }
      const before = await lessonFingerprints(client, subjectId);
      const r = await importSubject(client, data);
      const stale = await clearStaleLessonCaches(client, before, data);
      await client.query(
        `insert into curriculum_sync (subject_id, content_hash, synced_at) values ($1, $2, now())
         on conflict (subject_id) do update set content_hash = excluded.content_hash, synced_at = now()`,
        [subjectId, hash]);
      await client.query('commit');
      log.log(`📘 Curriculum sync: ${subjectId} re-imported (${summarise(data).courses} courses, ${r.lessons} lessons, ${stale} edited lessons' caches cleared)`);
      results.push({ subject: subjectId, changed: true, lessons: r.lessons, stale });
    } catch (e) {
      await client.query('rollback').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
  return results;
}

module.exports = { loadFile, summarise, importSubject, curriculumFiles, syncCurriculum };
