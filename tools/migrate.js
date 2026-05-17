// Apply db/schema.sql against DATABASE_URL and print a detailed diff of
// what actually changed. Idempotent migrations otherwise look like no-ops
// in the logs, which makes it impossible to spot real problems.
//
// Snapshots: tables, columns (with type / nullable / default), primary keys,
// unique constraints, check constraints, foreign keys, and indexes — both
// BEFORE and AFTER the schema runs — then reports every diff.
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

// A rich snapshot of the schema. Each section is captured as a Map keyed
// by a stable identifier so we can diff before vs after cheaply.
async function snapshot() {
  const tables = await db._pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by table_name",
  );
  const columns = await db._pool.query(
    `select table_name, column_name, data_type, udt_name, is_nullable, column_default
     from information_schema.columns
     where table_schema = 'public'
     order by table_name, ordinal_position`,
  );
  const indexes = await db._pool.query(
    `select schemaname, tablename, indexname, indexdef
     from pg_indexes
     where schemaname = 'public'
     order by tablename, indexname`,
  );
  // Primary keys, uniques, checks via information_schema.
  const constraints = await db._pool.query(
    `select tc.table_name, tc.constraint_name, tc.constraint_type,
            string_agg(kcu.column_name, ',' order by kcu.ordinal_position) as columns
     from information_schema.table_constraints tc
     left join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name
      and tc.table_schema   = kcu.table_schema
     where tc.table_schema = 'public'
       and tc.constraint_type in ('PRIMARY KEY', 'UNIQUE')
     group by tc.table_name, tc.constraint_name, tc.constraint_type
     order by tc.table_name, tc.constraint_name`,
  );
  const checks = await db._pool.query(
    `select tc.table_name, tc.constraint_name, cc.check_clause
     from information_schema.table_constraints tc
     join information_schema.check_constraints cc
       on tc.constraint_name = cc.constraint_name
      and tc.constraint_schema = cc.constraint_schema
     where tc.table_schema = 'public' and tc.constraint_type = 'CHECK'
       and tc.constraint_name not like '%_not_null'
     order by tc.table_name, tc.constraint_name`,
  );
  const fks = await db._pool.query(
    `select tc.table_name as src_table, kcu.column_name as src_col,
            ccu.table_name as dst_table, ccu.column_name as dst_col,
            rc.delete_rule
     from information_schema.table_constraints tc
     join information_schema.key_column_usage kcu
       on tc.constraint_name = kcu.constraint_name and tc.table_schema = kcu.table_schema
     join information_schema.constraint_column_usage ccu
       on tc.constraint_name = ccu.constraint_name and tc.table_schema = ccu.table_schema
     left join information_schema.referential_constraints rc
       on tc.constraint_name = rc.constraint_name and tc.constraint_schema = rc.constraint_schema
     where tc.table_schema = 'public' and tc.constraint_type = 'FOREIGN KEY'
     order by tc.table_name, kcu.column_name`,
  );
  const rowCounts = {};
  for (const t of tables.rows) {
    try {
      const r = await db._pool.query(`select count(*)::int as n from "${t.table_name}"`);
      rowCounts[t.table_name] = r.rows[0].n;
    } catch { rowCounts[t.table_name] = null; }
  }

  const colMap = new Map();
  for (const r of columns.rows) {
    const key = `${r.table_name}.${r.column_name}`;
    colMap.set(key, {
      type: r.udt_name || r.data_type,
      nullable: r.is_nullable === 'YES',
      default: r.column_default,
    });
  }
  const idxMap = new Map();
  for (const r of indexes.rows) idxMap.set(`${r.tablename}.${r.indexname}`, r.indexdef);
  const constraintMap = new Map();
  for (const r of constraints.rows) constraintMap.set(`${r.table_name}.${r.constraint_name}`, { type: r.constraint_type, columns: r.columns });
  const checkMap = new Map();
  for (const r of checks.rows) checkMap.set(`${r.table_name}.${r.constraint_name}`, r.check_clause);
  const fkMap = new Map();
  for (const r of fks.rows) fkMap.set(`${r.src_table}.${r.src_col}`, `${r.dst_table}.${r.dst_col} on delete ${r.delete_rule || 'no action'}`);

  return {
    tables: new Set(tables.rows.map(r => r.table_name)),
    columns: colMap,
    indexes: idxMap,
    constraints: constraintMap,
    checks: checkMap,
    fks: fkMap,
    rowCounts,
  };
}

function diffSet(before, after) {
  const added = [], removed = [];
  for (const x of after) if (!before.has(x)) added.push(x);
  for (const x of before) if (!after.has(x)) removed.push(x);
  added.sort(); removed.sort();
  return { added, removed };
}

function diffMap(before, after, sameFn) {
  const added = [], removed = [], changed = [];
  for (const [k, v] of after) {
    if (!before.has(k)) added.push({ key: k, value: v });
    else if (!sameFn(before.get(k), v)) changed.push({ key: k, before: before.get(k), after: v });
  }
  for (const [k] of before) if (!after.has(k)) removed.push({ key: k });
  added.sort((a, b) => a.key.localeCompare(b.key));
  removed.sort((a, b) => a.key.localeCompare(b.key));
  changed.sort((a, b) => a.key.localeCompare(b.key));
  return { added, removed, changed };
}

function bold(s) { return `\x1b[1m${s}\x1b[0m`; }
function dim(s) { return `\x1b[2m${s}\x1b[0m`; }
function ok(s) { return `\x1b[32m${s}\x1b[0m`; }
function warn(s) { return `\x1b[33m${s}\x1b[0m`; }
function fail(s) { return `\x1b[31m${s}\x1b[0m`; }

function fmtColumn(v) {
  if (!v) return '?';
  const parts = [v.type, v.nullable ? 'NULL' : 'NOT NULL'];
  if (v.default != null) parts.push(`default ${v.default}`);
  return parts.join(' ');
}

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
    console.log(dim(`  tables=${before.tables.size} cols=${before.columns.size} idx=${before.indexes.size} pk/unique=${before.constraints.size} checks=${before.checks.size} fks=${before.fks.size}`));
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

  const tDiff = diffSet(before.tables, after.tables);
  const cDiff = diffMap(before.columns, after.columns,
    (a, b) => a.type === b.type && a.nullable === b.nullable && a.default === b.default);
  const iDiff = diffMap(before.indexes, after.indexes, (a, b) => a === b);
  const conDiff = diffMap(before.constraints, after.constraints,
    (a, b) => a.type === b.type && a.columns === b.columns);
  const chkDiff = diffMap(before.checks, after.checks, (a, b) => a === b);
  const fkDiff = diffMap(before.fks, after.fks, (a, b) => a === b);

  // Filter "new columns" so we only mention columns whose whole table is
  // NOT new — table-level adds already cover those.
  const newTableSet = new Set(tDiff.added);
  const addedColsOnExistingTables = cDiff.added.filter(c => !newTableSet.has(c.key.split('.')[0]));
  const addedIdxOnExistingTables = iDiff.added.filter(i => !newTableSet.has(i.key.split('.')[0]));
  const addedConOnExistingTables = conDiff.added.filter(c => !newTableSet.has(c.key.split('.')[0]));
  const addedChkOnExistingTables = chkDiff.added.filter(c => !newTableSet.has(c.key.split('.')[0]));
  const addedFkOnExistingTables = fkDiff.added.filter(f => !newTableSet.has(f.key.split('.')[0]));

  const anyChange = tDiff.added.length || tDiff.removed.length
    || addedColsOnExistingTables.length || cDiff.removed.length || cDiff.changed.length
    || addedIdxOnExistingTables.length || iDiff.removed.length || iDiff.changed.length
    || addedConOnExistingTables.length || conDiff.removed.length || conDiff.changed.length
    || addedChkOnExistingTables.length || chkDiff.removed.length || chkDiff.changed.length
    || addedFkOnExistingTables.length || fkDiff.removed.length || fkDiff.changed.length;

  console.log('');
  console.log(ok(bold('✓ Schema applied successfully')));
  console.log('');

  if (!anyChange) {
    console.log(dim('No structural changes. Everything in db/schema.sql already existed in this database.'));
  } else {
    if (tDiff.added.length) {
      console.log(bold(`New tables (${tDiff.added.length}):`));
      for (const t of tDiff.added) console.log(`  + ${t}`);
      console.log('');
    }
    if (tDiff.removed.length) {
      console.log(warn(bold(`Removed tables (${tDiff.removed.length}):`)));
      for (const t of tDiff.removed) console.log(`  - ${t}`);
      console.log('');
    }
    if (addedColsOnExistingTables.length) {
      console.log(bold(`New columns on existing tables (${addedColsOnExistingTables.length}):`));
      for (const c of addedColsOnExistingTables) {
        console.log(`  + ${c.key}  ${dim(fmtColumn(c.value))}`);
      }
      console.log('');
    }
    if (cDiff.removed.length) {
      console.log(warn(bold(`Removed columns (${cDiff.removed.length}):`)));
      for (const c of cDiff.removed) console.log(`  - ${c.key}`);
      console.log('');
    }
    if (cDiff.changed.length) {
      console.log(warn(bold(`Column changes (${cDiff.changed.length}):`)));
      for (const c of cDiff.changed) {
        console.log(`  ~ ${c.key}`);
        console.log(`      before: ${fmtColumn(c.before)}`);
        console.log(`      after:  ${fmtColumn(c.after)}`);
      }
      console.log('');
    }
    if (addedConOnExistingTables.length) {
      console.log(bold(`New PK / unique constraints (${addedConOnExistingTables.length}):`));
      for (const c of addedConOnExistingTables) {
        console.log(`  + ${c.key}  ${dim(`${c.value.type} (${c.value.columns})`)}`);
      }
      console.log('');
    }
    if (addedChkOnExistingTables.length) {
      console.log(bold(`New check constraints (${addedChkOnExistingTables.length}):`));
      for (const c of addedChkOnExistingTables) {
        console.log(`  + ${c.key}  ${dim(c.value)}`);
      }
      console.log('');
    }
    if (addedFkOnExistingTables.length) {
      console.log(bold(`New foreign keys (${addedFkOnExistingTables.length}):`));
      for (const c of addedFkOnExistingTables) {
        console.log(`  + ${c.key}  →  ${c.value}`);
      }
      console.log('');
    }
    if (addedIdxOnExistingTables.length) {
      console.log(bold(`New indexes (${addedIdxOnExistingTables.length}):`));
      for (const i of addedIdxOnExistingTables) {
        console.log(`  + ${i.key}`);
        console.log(`      ${dim(i.value)}`);
      }
      console.log('');
    }
    if (iDiff.removed.length) {
      console.log(warn(bold(`Removed indexes (${iDiff.removed.length}):`)));
      for (const i of iDiff.removed) console.log(`  - ${i.key}`);
      console.log('');
    }
    if (iDiff.changed.length) {
      console.log(warn(bold(`Index changes (${iDiff.changed.length}):`)));
      for (const i of iDiff.changed) {
        console.log(`  ~ ${i.key}`);
        console.log(`      before: ${i.before}`);
        console.log(`      after:  ${i.after}`);
      }
      console.log('');
    }
  }

  // Always show the final state, so the operator can confirm the table
  // they were expecting actually exists.
  console.log(bold('Current tables and row counts:'));
  for (const t of Array.from(after.tables).sort()) {
    const n = after.rowCounts[t];
    const colCount = Array.from(after.columns.keys()).filter(k => k.startsWith(`${t}.`)).length;
    const label = n == null ? dim('(unreadable)') : `${n} row${n === 1 ? '' : 's'}`;
    console.log(`  ${t.padEnd(28)} ${label.padEnd(14)} ${dim(`${colCount} columns`)}`);
  }

  const newTableCount = tDiff.added.length;
  const tip = newTableCount > 0
    ? `${newTableCount} table${newTableCount === 1 ? '' : 's'} created. The app's new features that depended on them should now work.`
    : (anyChange ? 'Structural updates applied to existing tables.' : 'No new tables — the app should already have everything it needs.');
  console.log('');
  console.log(dim(tip));
  console.log('');

  await db._pool.end();
})();
