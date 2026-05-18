// Import every subject curriculum under curriculum/*.json into Postgres.
// Multi-subject by design: drop a new file for Language Arts, Science,
// or anything else and re-run — the script discovers it automatically.
//
// Each JSON file declares ONE subject and its data:
//   {
//     "subject": { "id": "math", "title": "Mathematics", "display_order": 1 },
//     "courses": [ { id, title, grade_levels[], units: [ { ..., lessons: [...] } ] }, ... ],
//     "practices": [ { code, practice, what_students_do, implications, display_order } ],
//     "misconceptions": [...],
//     "real_world_contexts": [...],
//     "glossary": [...]
//   }
//
// Usage:
//   $env:DATABASE_URL = "postgresql://..."
//   node tools/import-curriculum.js                    # load all subjects
//   node tools/import-curriculum.js --only math        # one subject only
//   node tools/import-curriculum.js --dry              # show counts, no writes
//   node tools/import-curriculum.js --file path.json   # explicit file
//
// Idempotent: wipes only the subjects we're loading (and their cascaded
// courses/units/lessons), then reloads inside a single transaction.

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseArgs(argv) {
  const args = { dry: false, file: null, only: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry') args.dry = true;
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--only') args.only = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node tools/import-curriculum.js [--dry] [--only <subject_id>] [--file path]');
      process.exit(0);
    }
  }
  return args;
}

function discoverFiles(args) {
  if (args.file) return [args.file];
  const dir = path.join(__dirname, '..', 'curriculum');
  if (!fs.existsSync(dir)) {
    console.error(`No curriculum/ directory at ${dir}`);
    process.exit(1);
  }
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .sort()
    .map(f => path.join(dir, f));
}

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
         (id, subject_id, title, grade_levels, display_order, total_weeks, total_lessons, updated_at)
       values ($1, $2, $3, $4, $5, $6, $7, now())`,
      [c.id, subjectId, c.title, c.grade_levels || [], c.display_order || 0,
       c.total_weeks || null, c.total_lessons || 0]
    );
    let lessonOrder = 0;
    for (const u of (c.units || [])) {
      await client.query(
        `insert into curriculum_units (course_id, unit_number, unit_title, weeks)
         values ($1, $2, $3, $4)`,
        [c.id, u.unit_number, u.unit_title, u.weeks || null]
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

async function main() {
  const args = parseArgs(process.argv);
  const files = discoverFiles(args);
  if (files.length === 0) {
    console.error('No curriculum JSON files found.');
    process.exit(1);
  }

  // Load + validate each before doing any DB work.
  const subjects = [];
  for (const f of files) {
    const data = loadFile(f);
    if (args.only && data.subject.id !== args.only) continue;
    subjects.push({ file: f, data });
  }
  if (subjects.length === 0) {
    console.error(args.only ? `No subject file matched --only ${args.only}` : 'No subjects to load.');
    process.exit(1);
  }

  console.log('Will load:');
  for (const { file, data } of subjects) {
    const s = summarise(data);
    console.log(`  ${path.basename(file)} -> ${s.subject}`);
    console.log(`    courses=${s.courses} units=${s.units} lessons=${s.lessons} practices=${s.practices} misconceptions=${s.misconceptions} real_world=${s.real_world_contexts} glossary=${s.glossary}`);
  }

  if (args.dry) {
    console.log('\nDry run — no changes written.');
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error('\nDATABASE_URL is not set. Set it to your Render Postgres external URL:');
    console.error('  $env:DATABASE_URL = "postgresql://user:pass@host/db"');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
  });
  await client.connect();

  console.log('\nConnected. Starting transaction…');
  try {
    await client.query('begin');
    for (const { data } of subjects) {
      const r = await importSubject(client, data);
      console.log(`  loaded ${data.subject.id}: ${r.lessons} lessons, ${r.glossaryInserted} glossary terms`);
    }
    await client.query('commit');
    console.log('\nDone.');
  } catch (e) {
    await client.query('rollback').catch(() => {});
    console.error('\nImport failed, rolled back:', e.message);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
