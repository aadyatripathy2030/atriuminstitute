// Quick "is my DB caught up?" check. Lists public tables and the columns
// on student_profiles so we can verify the latest schema migrations
// actually landed.
//
// Usage:
//   $env:DATABASE_URL = "external-url"
//   node tools/check-schema.js

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const db = require('../db-postgres');

(async () => {
  try {
    const tables = await db._pool.query(
      "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
    );
    const cols = await db._pool.query(
      "select column_name from information_schema.columns where table_name = 'student_profiles' order by column_name",
    );

    console.log('\n--- public tables ---');
    console.table(tables.rows);

    console.log('\n--- student_profiles columns ---');
    console.table(cols.rows);

    const hasCached = tables.rows.some(r => r.table_name === 'cached_lessons');
    const hasPref = cols.rows.some(r => r.column_name === 'ai_model_preference');
    console.log('\nchecks:');
    console.log(`  cached_lessons table:                 ${hasCached ? 'YES ✓' : 'NO ✗'}`);
    console.log(`  student_profiles.ai_model_preference: ${hasPref ? 'YES ✓' : 'NO ✗'}`);
  } catch (e) {
    console.error('Query failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db._pool.end();
  }
})();
