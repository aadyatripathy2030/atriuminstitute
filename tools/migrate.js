// Apply db/schema.sql against DATABASE_URL and print a detailed diff of what
// actually changed (idempotent migrations otherwise look like no-ops in the
// logs). Snapshots tables, columns, and indexes before and after, then
// reports added / unchanged sets.
//
// Local:
//   $env:DATABASE_URL = "postgres://...external...render.com/atrium"
//   npm run migrate

const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const db = require('../db-postgres');
const SCHEMA_PATH = path.resolve(__dirname, '..', 'db', 'schema.sql');

function describeTarget() {
  try {
    const u = new URL(process.env.DATABASE_URL);
    const dbName = (u.pathname || '/').slice(1) || '(default)';
    const user = u.username || '(unknown)';
    return { host: u.host, dbName, user };
  } catch {
    return { host: '(unparseable URL)', dbName: '?', user: '?' };
  }
}

async function snapshot() {
  const tables = await db._pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  const columns = await db._pool.query(
    "select table_name, column_name, data_type from information_schema.columns where table_schema = 'public' order by table_name, column_name",
  );
  const indexes = await db._pool.query(
    "select indexname, tablename from pg_indexes where schemaname = 'public' order by tablename, indexname",
  );
  const rowCounts = {};
  for (const t of tables.rows) {
    try {
      const r = await db._pool.query(`select count(*)::int as n from "${t.table_name}"`);
      rowCounts[t.table_name] = r.rows[0].n;
    } catch { rowCounts[t.table_name] = null; }
  }
  return {
    tables: new Set(tables.rows.map(r => r.table_name)),
    columns: new Set(columns.rows.map(r => `${r.table_name}.${r.column_name}`)),
    columnTypes: new Map(columns.rows.map(r => [`${r.table_name}.${r.column_name}`, r.data_type])),
    indexes: new Set(indexes.rows.map(r => `${r.tablename}.${r.indexname}`)),
    rowCounts,
  };
}

function diffSets(before, after) {
  const added = [];
  for (const x of after) if (!before.has(x)) added.push(x);
  added.sort();
  return added;
}

function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function dim(s) { return `\x1b[2m${s}\x1b[0m`; }
function ok(s) { return `\x1b[32m${s}\x1b[0m`; }
function fail(s) { return `\x1b[31m${s}\x1b[0m`; }

(async () => {
  const target = describeTarget();
  console.log('');
  console.log(bold('Atrium Institute — schema migration'));
  console.log(`Target:    ${target.dbName} @ ${target.host}`);
  console.log(`User:      ${target.user}`);
  console.log(`Schema:    db/schema.sql`);

  let sql;
  try { sql = fs.readFileSync(SCHEMA_PATH, 'utf8'); }
  catch (e) {
    console.error(fail(`\nCould not read schema file: ${e.message}`));
    process.exit(1);
  }
  const statementCount = sql.split(/;\s*\n/).filter(s => s.trim().length > 0).length;
  console.log(`Statements: ~${statementCount} (idempotent: 'if not exists' / 'add column if not exists')`);
  console.log('');

  let before;
  try {
    console.log(dim('Snapshotting current schema...'));
    before = await snapshot();
    console.log(dim(`  tables: ${before.tables.size}, columns: ${before.columns.size}, indexes: ${before.indexes.size}`));
  } catch (e) {
    console.error(fail(`\nCould not snapshot existing schema: ${e.message}`));
    console.error(dim('Check that DATABASE_URL points at a reachable Postgres and that the user can read information_schema.'));
    await db._pool.end();
    process.exit(1);
  }

  console.log('');
  console.log(dim('Applying schema...'));
  try {
    await db._pool.query(sql);
  } catch (e) {
    console.error(fail(`\nSchema migration FAILED: ${e.message}`));
    if (e.position) console.error(dim(`  near character position ${e.position}`));
    if (e.detail) console.error(dim(`  detail: ${e.detail}`));
    if (e.hint) console.error(dim(`  hint:   ${e.hint}`));
    await db._pool.end();
    process.exit(1);
  }

  let after;
  try { after = await snapshot(); }
  catch (e) {
    console.error(fail(`\nCould not snapshot post-migration schema: ${e.message}`));
    await db._pool.end();
    process.exit(1);
  }

  const addedTables = diffSets(before.tables, after.tables);
  const addedColumns = diffSets(before.columns, after.columns).filter(c => {
    // If the whole table is new we already mention it above; don't double-list
    // every column of it.
    const tbl = c.split('.')[0];
    return !addedTables.includes(tbl);
  });
  const addedIndexes = diffSets(before.indexes, after.indexes);

  console.log('');
  console.log(ok(bold('✓ Schema applied successfully')));
  console.log('');

  if (addedTables.length === 0 && addedColumns.length === 0 && addedIndexes.length === 0) {
    console.log(dim('No structural changes. Everything in db/schema.sql already existed.'));
  } else {
    if (addedTables.length) {
      console.log(bold(`New tables (${addedTables.length}):`));
      for (const t of addedTables) console.log(`  + ${t}`);
      console.log('');
    }
    if (addedColumns.length) {
      console.log(bold(`New columns on existing tables (${addedColumns.length}):`));
      for (const c of addedColumns) {
        const type = after.columnTypes.get(c);
        console.log(`  + ${c} ${dim(`(${type})`)}`);
      }
      console.log('');
    }
    if (addedIndexes.length) {
      console.log(bold(`New indexes (${addedIndexes.length}):`));
      for (const i of addedIndexes) console.log(`  + ${i}`);
      console.log('');
    }
  }

  console.log(bold('Current tables and row counts:'));
  for (const t of Array.from(after.tables).sort()) {
    const n = after.rowCounts[t];
    const label = n == null ? dim('(unreadable)') : `${n} row${n === 1 ? '' : 's'}`;
    console.log(`  ${t.padEnd(28)} ${label}`);
  }

  const newTableCount = addedTables.length;
  const tip = newTableCount > 0
    ? `${newTableCount} table${newTableCount === 1 ? '' : 's'} created. The app's new features that depended on them should now work.`
    : 'No new tables — the app should already have everything it needs.';
  console.log('');
  console.log(dim(tip));
  console.log('');

  await db._pool.end();
})();
