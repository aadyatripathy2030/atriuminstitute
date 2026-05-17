// Prints all rows in the users table. Sanity-check after sign-ups.
// Usage:
//   $env:DATABASE_URL = "..."
//   node tools/list-users.js

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const db = require('../db-postgres');

(async () => {
  try {
    const { rows } = await db._pool.query(
      'select id, email, role, verified, created_at from users order by created_at desc'
    );
    if (rows.length === 0) {
      console.log('No users yet.');
    } else {
      console.table(rows);
    }
  } catch (e) {
    console.error('Query failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db._pool.end();
  }
})();
