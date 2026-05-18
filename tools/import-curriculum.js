// Import the math curriculum reference data from
// curriculum/curriculum.json into Postgres. Idempotent: deletes the
// existing curriculum_* rows and reloads from JSON inside a single
// transaction so the DB is never half-loaded.
//
// Usage:
//   $env:DATABASE_URL = "postgresql://..."
//   node tools/import-curriculum.js
//
// Flags:
//   --dry           print the row counts that would be loaded and exit
//   --file <path>   override the default curriculum.json path
//
// Requires the curriculum_* tables (see db/schema.sql). Run migrate
// first if the tables don't exist yet:
//   npm run migrate
// then:
//   npm run import-curriculum

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

function parseArgs(argv) {
  const args = { dry: false, file: null };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--dry') args.dry = true;
    else if (a === '--file') args.file = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node tools/import-curriculum.js [--dry] [--file path]');
      process.exit(0);
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const jsonPath = args.file || path.join(__dirname, '..', 'curriculum', 'curriculum.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Curriculum JSON not found at: ${jsonPath}`);
    console.error('Re-extract from the xlsx if needed.');
    process.exit(1);
  }
  const raw = fs.readFileSync(jsonPath, 'utf8');
  let data;
  try { data = JSON.parse(raw); }
  catch (e) { console.error('Bad JSON:', e.message); process.exit(1); }

  const courses = data.courses || [];
  const smps = data.smps || [];
  const misconceptions = data.misconceptions || [];
  const realWorld = data.real_world_contexts || [];
  const glossary = data.glossary || [];
  const totalLessons = courses.reduce((s, c) => s + (c.units || []).reduce((t, u) => t + (u.lessons || []).length, 0), 0);

  console.log('Will load:');
  console.log(`  ${courses.length} courses`);
  console.log(`  ${courses.reduce((s, c) => s + (c.units || []).length, 0)} units`);
  console.log(`  ${totalLessons} lessons`);
  console.log(`  ${smps.length} SMPs`);
  console.log(`  ${misconceptions.length} misconceptions`);
  console.log(`  ${realWorld.length} real-world contexts`);
  console.log(`  ${glossary.length} glossary terms`);

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

    // Wipe in dependency order. ON DELETE CASCADE on units/lessons means
    // deleting courses takes them with it; the standalone tables we wipe
    // explicitly.
    await client.query('delete from curriculum_lessons');
    await client.query('delete from curriculum_units');
    await client.query('delete from curriculum_courses');
    await client.query('delete from curriculum_smps');
    await client.query('delete from curriculum_misconceptions');
    await client.query('delete from curriculum_real_world_contexts');
    await client.query('delete from curriculum_glossary');

    // Courses + units + lessons.
    for (const c of courses) {
      await client.query(
        `insert into curriculum_courses (id, title, grade_levels, display_order, total_weeks, total_lessons, updated_at)
         values ($1,$2,$3,$4,$5,$6, now())`,
        [c.id, c.title, c.grade_levels || [], c.display_order || 0, c.total_weeks || null, c.total_lessons || 0]
      );
      let lessonOrder = 0;
      for (const u of (c.units || [])) {
        await client.query(
          `insert into curriculum_units (course_id, unit_number, unit_title, weeks)
           values ($1,$2,$3,$4)`,
          [c.id, u.unit_number, u.unit_title, u.weeks || null]
        );
        for (const l of (u.lessons || [])) {
          lessonOrder += 1;
          await client.query(
            `insert into curriculum_lessons
               (course_id, unit_number, lesson_number, lesson_title, learning_objective,
                ccss_code, key_concepts, prerequisites, key_vocabulary, common_misconceptions,
                real_world_hook, smps, display_order)
             values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
            [
              c.id, u.unit_number, l.lesson_number, l.lesson_title, l.learning_objective || null,
              l.ccss_code || null, l.key_concepts || null, l.prerequisites || null,
              l.key_vocabulary || null, l.common_misconceptions || null,
              l.real_world_hook || null, l.smps || null, lessonOrder,
            ]
          );
        }
      }
    }
    console.log(`Inserted ${courses.length} courses with ${totalLessons} lessons.`);

    // SMPs
    for (const s of smps) {
      await client.query(
        `insert into curriculum_smps (smp_number, practice, what_students_do, implications)
         values ($1,$2,$3,$4)`,
        [s.smp_number, s.practice, s.what_students_do || null, s.implications || null]
      );
    }
    console.log(`Inserted ${smps.length} SMPs.`);

    // Misconceptions
    for (const m of misconceptions) {
      await client.query(
        `insert into curriculum_misconceptions (topic_area, misconception, why_it_happens, diagnostic_approach, remediation)
         values ($1,$2,$3,$4,$5)`,
        [m.topic_area || null, m.misconception, m.why_it_happens || null, m.diagnostic_approach || null, m.remediation || null]
      );
    }
    console.log(`Inserted ${misconceptions.length} misconceptions.`);

    // Real-world contexts
    for (const r of realWorld) {
      await client.query(
        `insert into curriculum_real_world_contexts (theme, context, math_connections)
         values ($1,$2,$3)`,
        [r.theme || null, r.context, r.math_connections || null]
      );
    }
    console.log(`Inserted ${realWorld.length} real-world contexts.`);

    // Glossary. UNIQUE(term) means duplicate terms in the source would
    // throw; we keep the first by deduping in memory.
    const seenTerms = new Set();
    let glossaryInserted = 0;
    for (const g of glossary) {
      const key = (g.term || '').toLowerCase();
      if (!key || seenTerms.has(key)) continue;
      seenTerms.add(key);
      await client.query(
        `insert into curriculum_glossary (term, definition, first_introduced)
         values ($1,$2,$3)`,
        [g.term, g.definition || null, g.first_introduced || null]
      );
      glossaryInserted += 1;
    }
    console.log(`Inserted ${glossaryInserted} glossary terms.`);

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
