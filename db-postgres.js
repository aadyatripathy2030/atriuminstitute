// Postgres backend for db.js. Used when DATABASE_URL is set. Targets Render
// Postgres but works against any standard Postgres 13+ (gen_random_uuid is
// built-in from 13).

const crypto = require('crypto');
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('db-postgres.js loaded but DATABASE_URL is not set');

// Render's internal database URLs do not require SSL; external ones do.
// PG_SSL=1 forces SSL on; PG_SSL=0 forces it off; otherwise we infer from
// the host (Render external hostnames contain ".render.com").
function shouldUseSsl() {
  if (process.env.PG_SSL === '1') return true;
  if (process.env.PG_SSL === '0') return false;
  return /\.render\.com/.test(DATABASE_URL);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: shouldUseSsl() ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.PG_POOL_MAX, 10) || 10,
});

pool.on('error', (err) => {
  console.error('Postgres pool error:', err.message);
});

async function q(text, params) {
  const result = await pool.query(text, params);
  return result.rows;
}

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function normalizeRole(r) {
  return r === 'parent' ? 'parent' : 'student';
}

// ---------- Users ----------
async function findUser(email) {
  email = normalizeEmail(email);
  const rows = await q('select id, email, role, verified, created_at from users where email = $1 limit 1', [email]);
  return rows[0] || null;
}

async function getUser(id) {
  const rows = await q('select id, email, role, verified, created_at from users where id = $1 limit 1', [id]);
  return rows[0] || null;
}

async function upsertUser(email, role) {
  email = normalizeEmail(email);
  role = normalizeRole(role);
  // Insert if new; if existing, leave the existing role intact (we don't let
  // a re-signup change a user's role).
  const rows = await q(
    `insert into users (email, role)
     values ($1, $2)
     on conflict (email) do update set email = excluded.email
     returning id, email, role, verified, created_at`,
    [email, role],
  );
  return rows[0];
}

async function markVerified(userId) {
  const rows = await q(
    'update users set verified = true where id = $1 and verified = false returning id, email, role, verified, created_at',
    [userId],
  );
  if (rows[0]) return rows[0];
  // Already verified or doesn't exist; return whatever's there.
  return getUser(userId);
}

// ---------- Verification codes ----------
const CODE_TTL_MS = 15 * 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createCode(email) {
  email = normalizeEmail(email);
  await q('delete from verification_codes where email = $1', [email]);
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MS);
  await q(
    'insert into verification_codes (email, code, expires_at) values ($1, $2, $3)',
    [email, code, expiresAt],
  );
  return code;
}

async function verifyCode(email, code) {
  email = normalizeEmail(email);
  code = String(code).trim();
  const rows = await q(
    'select id, used, expires_at from verification_codes where email = $1 and code = $2 limit 1',
    [email, code],
  );
  const c = rows[0];
  if (!c) return { ok: false, reason: 'invalid' };
  if (c.used) return { ok: false, reason: 'used' };
  if (new Date(c.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };
  await q('update verification_codes set used = true where id = $1', [c.id]);
  return { ok: true };
}

// ---------- Sessions ----------
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await q(
    'insert into sessions (token, user_id, expires_at) values ($1, $2, $3)',
    [token, userId, expiresAt],
  );
  return token;
}

async function getSession(token) {
  if (!token) return null;
  const rows = await q('select token, user_id, expires_at from sessions where token = $1 limit 1', [token]);
  const s = rows[0];
  if (!s) return null;
  if (new Date(s.expires_at).getTime() < Date.now()) {
    await q('delete from sessions where token = $1', [token]);
    return null;
  }
  // Match the legacy field name used elsewhere in the code.
  return { token: s.token, userId: s.user_id, expiresAt: new Date(s.expires_at).getTime() };
}

async function deleteSession(token) {
  if (!token) return;
  await q('delete from sessions where token = $1', [token]);
}

// ---------- Per-user progress ----------
async function getProgress(userId, key) {
  const rows = await q('select data from progress where user_id = $1 and key = $2 limit 1', [userId, key]);
  return rows[0] ? rows[0].data : null;
}

async function getAllProgress(userId) {
  const rows = await q('select key, data, updated_at from progress where user_id = $1', [userId]);
  const out = {};
  let latest = 0;
  for (const r of rows) {
    out[r.key] = r.data;
    const t = new Date(r.updated_at).getTime();
    if (t > latest) latest = t;
  }
  if (latest) out.__updatedAt = latest;
  return out;
}

async function setProgress(userId, key, value) {
  await q(
    `insert into progress (user_id, key, data, updated_at)
     values ($1, $2, $3::jsonb, now())
     on conflict (user_id, key) do update set data = excluded.data, updated_at = excluded.updated_at`,
    [userId, key, JSON.stringify(value)],
  );
}

// ---------- Maintenance ----------
async function cleanup() {
  await q('delete from verification_codes where expires_at < now() or used = true');
  await q('delete from sessions where expires_at < now()');
}

module.exports = {
  backend: 'postgres',
  findUser, getUser, upsertUser, markVerified,
  createCode, verifyCode,
  createSession, getSession, deleteSession,
  getProgress, getAllProgress, setProgress,
  cleanup,
  // Exposed for the migration tool.
  _pool: pool,
};
