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
const { loadFile, summarise, importSubject } = require('../curriculum-import-lib');

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
