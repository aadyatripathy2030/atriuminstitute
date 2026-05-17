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

const USER_COLS = 'id, email, role, verified, created_at, link_code, age, state, consent_required, consent_granted_at';

// 8-character link code from an unambiguous alphabet (no 0/O, 1/I/L).
// Formatted as XXXX-XXXX for display; stored without the dash.
const LINK_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newLinkCode() {
  let s = '';
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) s += LINK_CODE_ALPHABET[bytes[i] % LINK_CODE_ALPHABET.length];
  return s;
}
function normaliseLinkCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// US states + DC. Used to validate the `state` field on signup.
const VALID_STATES = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']);

// COPPA federal floor is 13. Some states have stricter rules; encode them here
// when we want to enforce them. For MVP we apply the 13 floor uniformly.
function consentRequiredForAge(age) {
  if (typeof age !== 'number' || isNaN(age)) return false;
  return age < 13;
}

// ---------- Users ----------
async function findUser(email) {
  email = normalizeEmail(email);
  const rows = await q(`select ${USER_COLS} from users where email = $1 limit 1`, [email]);
  return rows[0] || null;
}

async function getUser(id) {
  const rows = await q(`select ${USER_COLS} from users where id = $1 limit 1`, [id]);
  return rows[0] || null;
}

async function findUserByLinkCode(code) {
  code = normaliseLinkCode(code);
  if (code.length !== 8) return null;
  const rows = await q(`select ${USER_COLS} from users where link_code = $1 limit 1`, [code]);
  return rows[0] || null;
}

async function upsertUser(email, role) {
  email = normalizeEmail(email);
  role = normalizeRole(role);
  // Insert if new (with a fresh link_code); if existing, leave role and
  // link_code alone (re-signup must not change either).
  for (let attempt = 0; attempt < 5; attempt++) {
    const linkCode = newLinkCode();
    try {
      const rows = await q(
        `insert into users (email, role, link_code)
         values ($1, $2, $3)
         on conflict (email) do update set email = excluded.email
         returning ${USER_COLS}`,
        [email, role, linkCode],
      );
      return rows[0];
    } catch (e) {
      // Extremely rare: link_code collision. Retry with a new code.
      if (e.code === '23505' && /link_code/.test(e.detail || '')) continue;
      throw e;
    }
  }
  throw new Error('Could not allocate a unique link_code after several attempts');
}

async function markVerified(userId) {
  const rows = await q(
    `update users set verified = true where id = $1 and verified = false returning ${USER_COLS}`,
    [userId],
  );
  if (rows[0]) return rows[0];
  return getUser(userId);
}

async function updateUserProfile(userId, { age, state }) {
  const cleanAge = (typeof age === 'number' && age >= 4 && age <= 120) ? Math.floor(age) : null;
  const cleanState = (typeof state === 'string' && VALID_STATES.has(state.toUpperCase())) ? state.toUpperCase() : null;
  const consentRequired = consentRequiredForAge(cleanAge);
  // Only flip consent_required to true; never silently drop it (e.g. if an
  // older student re-signs up and reports a different age).
  const rows = await q(
    `update users
     set age = coalesce($2, age),
         state = coalesce($3, state),
         consent_required = case when $4::boolean then true else consent_required end
     where id = $1
     returning ${USER_COLS}`,
    [userId, cleanAge, cleanState, consentRequired],
  );
  return rows[0] || null;
}

async function grantConsent(studentUserId) {
  const rows = await q(
    `update users set consent_granted_at = coalesce(consent_granted_at, now()) where id = $1 returning ${USER_COLS}`,
    [studentUserId],
  );
  return rows[0] || null;
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

// ---------- Parent / student linking ----------

// Either party (student or parent) can enter the OTHER party's link_code to
// establish a connection. We figure out which side is which from each user's
// role, and we set `consent_granted_at` on the student if the new link is
// active and the student was waiting for parental consent.
async function createLinkFromCode(initiatedByUserId, otherLinkCode) {
  const me = await getUser(initiatedByUserId);
  if (!me) return { ok: false, reason: 'not-signed-in' };
  const other = await findUserByLinkCode(otherLinkCode);
  if (!other) return { ok: false, reason: 'invalid-code' };
  if (other.id === me.id) return { ok: false, reason: 'self' };
  if (me.role === other.role) return { ok: false, reason: 'same-role' };

  const parentId = me.role === 'parent' ? me.id : other.id;
  const studentId = me.role === 'student' ? me.id : other.id;

  const rows = await q(
    `insert into parent_student_links (parent_user_id, student_user_id, status, initiated_by_user_id, confirmed_at)
     values ($1, $2, 'active', $3, now())
     on conflict (parent_user_id, student_user_id)
       do update set status = 'active', confirmed_at = coalesce(parent_student_links.confirmed_at, excluded.confirmed_at)
     returning id, parent_user_id, student_user_id, status, created_at, confirmed_at`,
    [parentId, studentId, initiatedByUserId],
  );
  // Parental consent moment: if the student was gated by consent_required,
  // mark consent granted now.
  await grantConsent(studentId);
  return { ok: true, link: rows[0] };
}

async function listLinkedStudents(parentUserId) {
  return q(
    `select u.id, u.email, u.role, u.link_code, u.age, u.state, u.consent_required, u.consent_granted_at, u.created_at,
            l.status as link_status, l.created_at as linked_at
     from parent_student_links l
     join users u on u.id = l.student_user_id
     where l.parent_user_id = $1
     order by l.created_at desc`,
    [parentUserId],
  );
}

async function listLinkedParents(studentUserId) {
  return q(
    `select u.id, u.email, u.role, u.link_code, u.created_at,
            l.status as link_status, l.created_at as linked_at
     from parent_student_links l
     join users u on u.id = l.parent_user_id
     where l.student_user_id = $1
     order by l.created_at desc`,
    [studentUserId],
  );
}

async function isParentOfStudent(parentUserId, studentUserId) {
  const rows = await q(
    `select 1 from parent_student_links
     where parent_user_id = $1 and student_user_id = $2 and status = 'active' limit 1`,
    [parentUserId, studentUserId],
  );
  return rows.length > 0;
}

async function deleteLink(linkId, requestingUserId) {
  const rows = await q(
    `delete from parent_student_links
     where id = $1 and (parent_user_id = $2 or student_user_id = $2)
     returning id`,
    [linkId, requestingUserId],
  );
  return rows.length > 0;
}

// ---------- Quiz attempts ----------

async function logQuizAttempt(userId, attempt) {
  const {
    courseId, bookId, sectionIdx, sectionKind = 'section',
    score, total, passed, startedAt = null,
  } = attempt;
  const rows = await q(
    `insert into quiz_attempts (user_id, course_id, book_id, section_idx, section_kind, score, total, passed, started_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     returning id, completed_at`,
    [userId, courseId, bookId, sectionIdx, sectionKind, score, total, passed, startedAt],
  );
  await logActivity(userId, passed ? 'quiz_pass' : 'quiz_fail', {
    courseId, bookId, sectionIdx, sectionKind, score, total,
  });
  return rows[0];
}

async function listQuizAttempts(userId, opts = {}) {
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  return q(
    `select id, course_id, book_id, section_idx, section_kind, score, total, passed, started_at, completed_at
     from quiz_attempts where user_id = $1 order by completed_at desc limit $2`,
    [userId, limit],
  );
}

// Sections that the student has failed at least N times. Useful for the
// "weak topics" surface on the parent dashboard.
async function listWeakSections(userId, minFailures = 2) {
  return q(
    `select course_id, book_id, section_idx, section_kind, count(*) filter (where not passed) as failures
     from quiz_attempts
     where user_id = $1
     group by course_id, book_id, section_idx, section_kind
     having count(*) filter (where not passed) >= $2
     order by failures desc, course_id, book_id, section_idx`,
    [userId, minFailures],
  );
}

// ---------- Activity log ----------

async function logActivity(userId, kind, meta) {
  await q(
    `insert into activity_log (user_id, kind, meta) values ($1, $2, $3::jsonb)`,
    [userId, kind, JSON.stringify(meta || {})],
  );
}

async function listActivity(userId, opts = {}) {
  const limit = Math.min(parseInt(opts.limit, 10) || 50, 500);
  return q(
    `select id, kind, meta, created_at from activity_log
     where user_id = $1 order by created_at desc limit $2`,
    [userId, limit],
  );
}

// ---------- Maintenance ----------
async function cleanup() {
  await q('delete from verification_codes where expires_at < now() or used = true');
  await q('delete from sessions where expires_at < now()');
}

module.exports = {
  backend: 'postgres',
  findUser, getUser, findUserByLinkCode, upsertUser, markVerified,
  updateUserProfile, grantConsent,
  createCode, verifyCode,
  createSession, getSession, deleteSession,
  getProgress, getAllProgress, setProgress,
  createLinkFromCode, listLinkedStudents, listLinkedParents, isParentOfStudent, deleteLink,
  logQuizAttempt, listQuizAttempts, listWeakSections,
  logActivity, listActivity,
  cleanup,
  // Internals exposed for the migration tool and (rarely) tests.
  _pool: pool,
  _consentRequiredForAge: consentRequiredForAge,
  _newLinkCode: newLinkCode,
  _normaliseLinkCode: normaliseLinkCode,
  _VALID_STATES: VALID_STATES,
};
