// Flip the users.is_admin flag for one or more emails. Idempotent — if a
// user with that email doesn't exist yet, the row count for them is 0
// and the script reports it cleanly so you can fix the typo or get them
// to sign up first.
//
// Usage:
//   $env:DATABASE_URL = "external-render-postgres-url"
//   node tools/set-admin.js you@example.com someone-else@example.com
//
// Optional flag to REVOKE admin instead of granting it:
//   node tools/set-admin.js --revoke you@example.com
//
// Optional flag to list all current admins instead of changing anything:
//   node tools/set-admin.js --list

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const db = require('../db-postgres');

const args = process.argv.slice(2);
const revoke = args.includes('--revoke');
const list = args.includes('--list');
const emails = args.filter(a => !a.startsWith('--')).map(s => s.trim().toLowerCase()).filter(Boolean);

(async () => {
  try {
    if (list) {
      const { rows } = await db._pool.query(
        "select email, role, is_admin, verified, created_at from users where is_admin = true order by email"
      );
      if (!rows.length) {
        console.log('No admins currently configured.');
      } else {
        console.log(`Current admins (${rows.length}):`);
        console.table(rows);
      }
      return;
    }

    if (!emails.length) {
      console.error('No emails provided.');
      console.error('Usage: node tools/set-admin.js [--revoke] email@example.com [email2@example.com ...]');
      console.error('       node tools/set-admin.js --list');
      process.exitCode = 1;
      return;
    }

    const action = revoke ? 'REVOKING admin from' : 'GRANTING admin to';
    console.log(`${action}: ${emails.join(', ')}\n`);

    let updated = 0;
    let notFound = [];
    for (const email of emails) {
      const r = await db._pool.query(
        'update users set is_admin = $1 where lower(email) = $2 returning email, is_admin, role, verified',
        [!revoke, email],
      );
      if (r.rows.length === 0) {
        notFound.push(email);
        console.log(`  ✗ ${email}  — no user with that email`);
      } else {
        updated++;
        const u = r.rows[0];
        console.log(`  ✓ ${u.email}  (role=${u.role}, is_admin=${u.is_admin}, verified=${u.verified})`);
      }
    }

    console.log('');
    console.log(`Updated ${updated} of ${emails.length} requested.`);
    if (notFound.length) {
      console.log('');
      console.log('Not found (have they signed up at least once?):');
      for (const e of notFound) console.log(`  - ${e}`);
      console.log('');
      console.log('Have them request a sign-in code at https://atriuminstitute.ai once, then re-run this script.');
    }

    // Show the resulting admin list so the operator can confirm.
    console.log('');
    const all = await db._pool.query(
      "select email, role, is_admin from users where is_admin = true order by email"
    );
    if (all.rows.length === 0) {
      console.log('Note: there are now zero admins on this database.');
    } else {
      console.log(`Current admins (${all.rows.length}):`);
      console.table(all.rows);
    }
  } catch (e) {
    console.error('Query failed:', e.message);
    process.exitCode = 1;
  } finally {
    await db._pool.end();
  }
})();
