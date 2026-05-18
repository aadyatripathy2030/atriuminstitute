// Load US public school districts into the school_districts table.
//
// Default source is db/seed-school-districts.csv (a hand-curated starter
// list of the largest districts per state). Pass --file=path.csv to load
// any other CSV. To load the complete NCES Common Core of Data district
// list, download a CSV from https://nces.ed.gov/ccd/elsi/ with columns
// "State" (postal code) and "Agency Name", and point this script at it:
//
//   $env:DATABASE_URL = "postgres://..."
//   node tools/import-school-districts.js --file=nces-districts.csv
//
// Re-running is safe — the unique (state_code, normalized_name) index
// upserts existing rows without duplicating them. Rows where source is
// already 'user' (entered by a real signup) keep that source so the
// "users have actually picked this" hint stays accurate.

const fs = require('fs');
const path = require('path');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}

const { Pool } = require('pg');

function shouldUseSsl(url) {
  if (process.env.PG_SSL === '1') return true;
  if (process.env.PG_SSL === '0') return false;
  return /\.render\.com/.test(url);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: shouldUseSsl(process.env.DATABASE_URL) ? { rejectUnauthorized: false } : false,
});

function arg(name, dflt) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  return m ? m.slice(name.length + 3) : dflt;
}

function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Minimal CSV parser: assumes no embedded commas inside quoted fields
// for the seed file we ship. NCES CSVs sometimes quote district names
// that contain commas, so handle simple double-quoted fields too.
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { cur += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { out.push(cur); cur = ''; }
      else { cur += c; }
    }
  }
  out.push(cur);
  return out.map(s => s.trim());
}

async function loadCsv(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/\r/g, '');
  const lines = raw.split('\n').filter(Boolean);
  if (!lines.length) return [];
  const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
  const stateIdx = header.findIndex(h => h === 'state_code' || h === 'state' || h === 'state postal code');
  const nameIdx = header.findIndex(h => h === 'district_name' || h === 'agency name' || h === 'name');
  if (stateIdx < 0 || nameIdx < 0) {
    throw new Error(`CSV must have columns "state_code" (or "State") and "district_name" (or "Agency Name"). Found: ${header.join(', ')}`);
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const state = String(cells[stateIdx] || '').trim().toUpperCase();
    const name = String(cells[nameIdx] || '').trim();
    if (!state || !name || state.length !== 2) continue;
    rows.push({ state, name });
  }
  return rows;
}

async function main() {
  const filePath = path.resolve(arg('file', path.join(__dirname, '..', 'db', 'seed-school-districts.csv')));
  console.log(`Loading ${filePath}…`);
  const rows = await loadCsv(filePath);
  console.log(`Parsed ${rows.length} rows. Importing…`);

  let inserted = 0;
  let skipped = 0;
  for (const r of rows) {
    const norm = normalize(r.name);
    if (!norm) { skipped++; continue; }
    const res = await pool.query(
      `insert into school_districts (state_code, district_name, normalized_name, source)
       values ($1, $2, $3, 'seed')
       on conflict (state_code, normalized_name)
       do update set district_name = excluded.district_name
       where school_districts.source = 'seed'
       returning xmax`,
      [r.state, r.name, norm],
    );
    if (res.rows.length) inserted++;
    else skipped++;
  }

  const { rows: counts } = await pool.query(
    `select state_code, count(*)::int as n from school_districts group by state_code order by state_code`,
  );
  console.log(`Done. ${inserted} upserted, ${skipped} skipped.`);
  console.log('Per-state counts:');
  for (const row of counts) console.log(`  ${row.state_code}: ${row.n}`);

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
