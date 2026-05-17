// One-shot schema runner. Reads db/schema.sql and executes it against
// DATABASE_URL. Idempotent (the SQL uses `create table if not exists`).
//
// Local: set DATABASE_URL to your Render Postgres EXTERNAL URL and run
//        `node tools/migrate.js`. SSL is automatic for Render hostnames.

const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const db = require('../db-postgres');
const SCHEMA_PATH = path.resolve(__dirname, '..', 'db', 'schema.sql');

(async () => {
  const sql = fs.readFileSync(SCHEMA_PATH, 'utf8');
  console.log(`Running schema (${sql.length} bytes) against the configured database...`);
  try {
    await db._pool.query(sql);
    console.log('Schema applied successfully.');
  } catch (e) {
    console.error('Schema migration failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db._pool.end();
  }
})();
