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

const USER_COLS = 'id, email, role, verified, created_at, link_code, age, country, grade_level, consent_required, consent_granted_at, is_admin, stripe_customer_id, stripe_subscription_id, subscription_status, subscription_plan, current_period_end';

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

// Loose validation for country name strings. The client picks from a curated
// dropdown; here we just guard against absurd input.
function isValidCountry(s) {
  return typeof s === 'string' && s.trim().length >= 2 && s.trim().length <= 80;
}

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

async function updateUserProfile(userId, { age, country, gradeLevel }) {
  const cleanAge = (typeof age === 'number' && age >= 4 && age <= 120) ? Math.floor(age) : null;
  const cleanCountry = isValidCountry(country) ? country.trim() : null;
  const cleanGrade = (typeof gradeLevel === 'number' && gradeLevel >= 1 && gradeLevel <= 12) ? Math.floor(gradeLevel) : null;
  const consentRequired = consentRequiredForAge(cleanAge);
  const rows = await q(
    `update users
     set age = coalesce($2, age),
         country = coalesce($3, country),
         grade_level = coalesce($4, grade_level),
         consent_required = case when $5::boolean then true else consent_required end
     where id = $1
     returning ${USER_COLS}`,
    [userId, cleanAge, cleanCountry, cleanGrade, consentRequired],
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

async function setStripeCustomerId(userId, customerId) {
  const rows = await q(
    `update users set stripe_customer_id = $2 where id = $1 returning ${USER_COLS}`,
    [userId, customerId],
  );
  return rows[0] || null;
}

async function findUserByStripeCustomerId(customerId) {
  const rows = await q(
    `select ${USER_COLS} from users where stripe_customer_id = $1 limit 1`,
    [customerId],
  );
  return rows[0] || null;
}

async function updateSubscription(userId, fields) {
  const rows = await q(
    `update users
       set stripe_subscription_id = coalesce($2, stripe_subscription_id),
           subscription_status   = coalesce($3, subscription_status),
           current_period_end    = coalesce($4, current_period_end),
           subscription_plan     = coalesce($5, subscription_plan)
     where id = $1
     returning ${USER_COLS}`,
    [
      userId,
      fields.stripe_subscription_id ?? null,
      fields.subscription_status ?? null,
      fields.current_period_end ?? null,
      fields.plan ?? null,
    ],
  );
  return rows[0] || null;
}

async function listLinkedStudents(parentUserId) {
  return q(
    `select u.id, u.email, u.role, u.link_code, u.age, u.country, u.consent_required, u.consent_granted_at, u.created_at,
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
    answers = [],
  } = attempt;
  // attempt_number is computed atomically inside the INSERT so concurrent
  // submissions don't collide on the same number.
  // duration_seconds is computed if both started_at and now are known.
  const startedTs = startedAt ? new Date(startedAt) : null;
  const duration = startedTs ? Math.max(0, Math.round((Date.now() - startedTs.getTime()) / 1000)) : null;
  const rows = await q(
    `insert into quiz_attempts (
       user_id, course_id, book_id, section_idx, section_kind,
       score, total, passed, started_at, answers, attempt_number, duration_seconds
     )
     values (
       $1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb,
       (select coalesce(max(attempt_number), 0) + 1 from quiz_attempts
         where user_id = $1 and course_id = $2 and book_id = $3
           and section_idx = $4 and section_kind = $5),
       $11
     )
     returning id, completed_at, attempt_number, duration_seconds`,
    [userId, courseId, bookId, sectionIdx, sectionKind, score, total, passed, startedAt, JSON.stringify(answers), duration],
  );
  await logActivity(userId, passed ? 'quiz_pass' : 'quiz_fail', {
    courseId, bookId, sectionIdx, sectionKind, score, total,
    attemptNumber: rows[0].attempt_number,
    durationSeconds: rows[0].duration_seconds,
  });
  return rows[0];
}

async function listQuizAttempts(userId, opts = {}) {
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  return q(
    `select id, course_id, book_id, section_idx, section_kind, score, total, passed,
            started_at, completed_at, attempt_number, duration_seconds, answers
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

// ---------- Profiles ----------
const STUDENT_PROFILE_COLS = 'user_id, display_name, school_name, grade_level, subjects, study_plan_courses, study_goal, timezone, reminder_enabled, reminder_frequency, reminder_time_local, reminder_content, parent_authorised_reminders, last_reminder_sent_at, ai_model_preference, updated_at';
const PARENT_PROFILE_COLS = 'user_id, display_name, relationship, timezone, weekly_digest_enabled, weekly_digest_day, weekly_digest_time_local, last_digest_sent_at, updated_at';

async function getStudentProfile(userId) {
  const rows = await q(`select ${STUDENT_PROFILE_COLS} from student_profiles where user_id = $1`, [userId]);
  return rows[0] || null;
}

async function getParentProfile(userId) {
  const rows = await q(`select ${PARENT_PROFILE_COLS} from parent_profiles where user_id = $1`, [userId]);
  return rows[0] || null;
}

// COALESCE-based upsert: only updates fields the caller passed. Validation /
// allow-listing happens in the server handler, not here.
async function upsertStudentProfile(userId, fields) {
  const f = fields || {};
  const arr = (v) => Array.isArray(v) ? v : (v == null ? null : [v]);
  const rows = await q(
    `insert into student_profiles (
       user_id, display_name, school_name, grade_level, subjects, study_plan_courses,
       study_goal, timezone, reminder_enabled, reminder_frequency, reminder_time_local,
       reminder_content, parent_authorised_reminders, ai_model_preference
     ) values ($1,$2,$3,$4,coalesce($5::text[],'{}'),coalesce($6::text[],'{}'),
               $7,$8,coalesce($9,false),coalesce($10,'weekly'),coalesce($11::time,'17:00'),
               coalesce($12,'generic'),coalesce($13,false),coalesce($14,'balanced'))
     on conflict (user_id) do update set
       display_name = coalesce($2, student_profiles.display_name),
       school_name = coalesce($3, student_profiles.school_name),
       grade_level = coalesce($4, student_profiles.grade_level),
       subjects = coalesce($5::text[], student_profiles.subjects),
       study_plan_courses = coalesce($6::text[], student_profiles.study_plan_courses),
       study_goal = coalesce($7, student_profiles.study_goal),
       timezone = coalesce($8, student_profiles.timezone),
       reminder_enabled = coalesce($9, student_profiles.reminder_enabled),
       reminder_frequency = coalesce($10, student_profiles.reminder_frequency),
       reminder_time_local = coalesce($11::time, student_profiles.reminder_time_local),
       reminder_content = coalesce($12, student_profiles.reminder_content),
       parent_authorised_reminders = coalesce($13, student_profiles.parent_authorised_reminders),
       ai_model_preference = coalesce($14, student_profiles.ai_model_preference),
       updated_at = now()
     returning ${STUDENT_PROFILE_COLS}`,
    [
      userId,
      f.displayName ?? null,
      f.schoolName ?? null,
      f.gradeLevel ?? null,
      arr(f.subjects),
      arr(f.studyPlanCourses),
      f.studyGoal ?? null,
      f.timezone ?? null,
      f.reminderEnabled ?? null,
      f.reminderFrequency ?? null,
      f.reminderTimeLocal ?? null,
      f.reminderContent ?? null,
      f.parentAuthorisedReminders ?? null,
      f.aiModelPreference ?? null,
    ],
  );
  return rows[0];
}

async function upsertParentProfile(userId, fields) {
  const f = fields || {};
  const rows = await q(
    `insert into parent_profiles (
       user_id, display_name, relationship, timezone,
       weekly_digest_enabled, weekly_digest_day, weekly_digest_time_local
     ) values ($1,$2,coalesce($3,'parent'),$4,coalesce($5,true),coalesce($6,0),coalesce($7::time,'09:00'))
     on conflict (user_id) do update set
       display_name = coalesce($2, parent_profiles.display_name),
       relationship = coalesce($3, parent_profiles.relationship),
       timezone = coalesce($4, parent_profiles.timezone),
       weekly_digest_enabled = coalesce($5, parent_profiles.weekly_digest_enabled),
       weekly_digest_day = coalesce($6, parent_profiles.weekly_digest_day),
       weekly_digest_time_local = coalesce($7::time, parent_profiles.weekly_digest_time_local),
       updated_at = now()
     returning ${PARENT_PROFILE_COLS}`,
    [
      userId,
      f.displayName ?? null,
      f.relationship ?? null,
      f.timezone ?? null,
      f.weeklyDigestEnabled ?? null,
      f.weeklyDigestDay ?? null,
      f.weeklyDigestTimeLocal ?? null,
    ],
  );
  return rows[0];
}

// Called by a parent for one of their linked students: turn the under-13
// reminder allow-flag on or off. Authorisation is checked server-side.
async function setParentAuthorisedReminders(studentUserId, allow) {
  const rows = await q(
    `insert into student_profiles (user_id, parent_authorised_reminders)
     values ($1, $2)
     on conflict (user_id) do update set parent_authorised_reminders = excluded.parent_authorised_reminders, updated_at = now()
     returning ${STUDENT_PROFILE_COLS}`,
    [studentUserId, !!allow],
  );
  return rows[0];
}

// Mark a reminder / digest as just sent. Used by the cron endpoint.
async function markReminderSent(studentUserId) {
  await q('update student_profiles set last_reminder_sent_at = now() where user_id = $1', [studentUserId]);
}
async function markDigestSent(parentUserId) {
  await q('update parent_profiles set last_digest_sent_at = now() where user_id = $1', [parentUserId]);
}

// All students whose reminder *could* fire now. The caller filters by
// local-time-of-day, day-of-week, and the under-13 parent-authorisation
// rule — we don't try to express that in SQL.
async function listReminderCandidates() {
  return q(
    `select u.id as user_id, u.email, u.age, u.consent_required,
            sp.display_name, sp.timezone, sp.reminder_enabled, sp.reminder_frequency,
            sp.reminder_time_local, sp.reminder_content,
            sp.parent_authorised_reminders, sp.last_reminder_sent_at
     from student_profiles sp
     join users u on u.id = sp.user_id
     where sp.reminder_enabled = true
       and sp.timezone is not null`,
    [],
  );
}

async function listDigestCandidates() {
  return q(
    `select u.id as user_id, u.email,
            pp.display_name, pp.timezone, pp.weekly_digest_enabled,
            pp.weekly_digest_day, pp.weekly_digest_time_local, pp.last_digest_sent_at
     from parent_profiles pp
     join users u on u.id = pp.user_id
     where pp.weekly_digest_enabled = true
       and pp.timezone is not null`,
    [],
  );
}

// ---------- AI usage tracking ----------
async function recordAiUsage(rec) {
  await q(
    `insert into ai_usage (user_id, user_email, intent, model, input_tokens, output_tokens,
                           cache_read_tokens, cache_creation_tokens, cost_usd)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      rec.userId || null,
      rec.userEmail || null,
      rec.intent || null,
      rec.model || 'unknown',
      rec.inputTokens | 0,
      rec.outputTokens | 0,
      rec.cacheReadTokens | 0,
      rec.cacheCreationTokens | 0,
      Number(rec.costUsd) || 0,
    ],
  );
}

async function listAiUsage(opts = {}) {
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  const params = [];
  let where = '';
  if (opts.userId) {
    params.push(opts.userId);
    where = `where user_id = $${params.length}`;
  }
  params.push(limit);
  return q(
    `select id, user_id, user_email, intent, model, input_tokens, output_tokens,
            cache_read_tokens, cache_creation_tokens, cost_usd, created_at
     from ai_usage ${where} order by created_at desc limit $${params.length}`,
    params,
  );
}

async function summariseAiUsage(opts = {}) {
  const params = [];
  let where = '';
  if (opts.userId) {
    params.push(opts.userId);
    where = `where user_id = $${params.length}`;
  }
  const totalsRow = await q(
    `select coalesce(sum(cost_usd),0) as cost,
            coalesce(sum(input_tokens),0) as input_tokens,
            coalesce(sum(output_tokens),0) as output_tokens,
            coalesce(sum(cache_read_tokens),0) as cache_read_tokens,
            coalesce(sum(cache_creation_tokens),0) as cache_creation_tokens,
            count(*) as calls
     from ai_usage ${where}`,
    params,
  );
  const byIntent = await q(
    `select coalesce(intent,'(none)') as intent,
            count(*) as calls,
            sum(cost_usd) as cost
     from ai_usage ${where} group by intent order by cost desc nulls last`,
    params,
  );
  const byModel = await q(
    `select model, count(*) as calls, sum(cost_usd) as cost,
            sum(input_tokens) as input_tokens,
            sum(output_tokens) as output_tokens
     from ai_usage ${where} group by model order by cost desc`,
    params,
  );
  const byDay = await q(
    `select date_trunc('day', created_at)::date as day,
            count(*) as calls,
            sum(cost_usd) as cost
     from ai_usage ${where}
     group by day order by day desc limit 30`,
    params,
  );
  return {
    totals: totalsRow[0] || {},
    byIntent,
    byModel,
    byDay,
  };
}

// ---------- Cached lessons ----------
async function getCachedLesson(courseId, bookId, sectionIdx, sectionKind = 'section') {
  const rows = await q(
    `select content, model, updated_at from cached_lessons
     where course_id = $1 and book_id = $2 and section_idx = $3 and section_kind = $4 limit 1`,
    [courseId, bookId, sectionIdx, sectionKind],
  );
  return rows[0] || null;
}

async function saveCachedLesson(courseId, bookId, sectionIdx, sectionKind, content, model) {
  await q(
    `insert into cached_lessons (course_id, book_id, section_idx, section_kind, content, model)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (course_id, book_id, section_idx, section_kind) do update
     set content = excluded.content, model = excluded.model, updated_at = now()`,
    [courseId, bookId, sectionIdx, sectionKind || 'section', content, model || null],
  );
}

async function clearCachedLesson(courseId, bookId, sectionIdx, sectionKind = 'section') {
  await q(
    `delete from cached_lessons
     where course_id = $1 and book_id = $2 and section_idx = $3 and section_kind = $4`,
    [courseId, bookId, sectionIdx, sectionKind],
  );
}

// ---------- Study plan ----------
async function getStudyPlan(userId) {
  const rows = await q(
    'select user_id, goal_text, target_date, course_id, plan_json, created_at, updated_at from study_plans where user_id = $1 limit 1',
    [userId],
  );
  return rows[0] || null;
}

async function upsertStudyPlan(userId, fields) {
  const rows = await q(
    `insert into study_plans (user_id, goal_text, target_date, course_id, plan_json)
     values ($1, $2, $3::date, $4, $5::jsonb)
     on conflict (user_id) do update set
       goal_text = excluded.goal_text,
       target_date = excluded.target_date,
       course_id = excluded.course_id,
       plan_json = excluded.plan_json,
       updated_at = now()
     returning user_id, goal_text, target_date, course_id, plan_json, created_at, updated_at`,
    [userId, fields.goalText || '', fields.targetDate || null, fields.courseId || null, JSON.stringify(fields.planJson || {})],
  );
  return rows[0];
}

async function deleteStudyPlan(userId) {
  await q('delete from study_plans where user_id = $1', [userId]);
}

// ---------- Admin: cross-user summaries ----------

async function adminListUsers(opts = {}) {
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  return q(
    `select u.id, u.email, u.role, u.verified, u.created_at, u.age, u.country,
            u.consent_required, u.consent_granted_at, u.is_admin,
            (select count(*) from quiz_attempts qa where qa.user_id = u.id) as quiz_attempts,
            (select count(*) from quiz_attempts qa where qa.user_id = u.id and qa.passed) as quiz_passed,
            (select count(*) from activity_log a where a.user_id = u.id) as activity_count,
            (select coalesce(sum(au.cost_usd), 0) from ai_usage au where au.user_id = u.id) as cost_usd
     from users u
     order by u.created_at desc
     limit $1`,
    [limit],
  );
}

async function adminStats() {
  const rows = await q(
    `select
       (select count(*) from users) as users_total,
       (select count(*) from users where role = 'student') as students_total,
       (select count(*) from users where role = 'parent') as parents_total,
       (select count(*) from users where verified) as users_verified,
       (select count(*) from users where consent_required) as students_consent_required,
       (select count(*) from users where consent_required and consent_granted_at is not null) as students_consent_granted,
       (select count(*) from parent_student_links) as links_total,
       (select count(*) from quiz_attempts) as quiz_attempts_total,
       (select count(*) from quiz_attempts where passed) as quiz_attempts_passed,
       (select count(*) from sessions where expires_at > now()) as active_sessions,
       (select count(*) from cached_lessons) as cached_lessons_total,
       (select count(*) from study_plans) as study_plans_total,
       (select coalesce(sum(cost_usd), 0) from ai_usage) as cost_all_time,
       (select coalesce(sum(cost_usd), 0) from ai_usage where created_at >= now() - interval '24 hours') as cost_24h,
       (select coalesce(sum(cost_usd), 0) from ai_usage where created_at >= now() - interval '30 days') as cost_30d`,
  );
  return rows[0] || {};
}

async function adminRecentActivity(limit = 50) {
  return q(
    `select a.id, a.user_id, u.email, a.kind, a.meta, a.created_at
     from activity_log a
     left join users u on u.id = a.user_id
     order by a.created_at desc
     limit $1`,
    [Math.min(parseInt(limit, 10) || 50, 500)],
  );
}

async function adminUserDetail(userId) {
  const userRows = await q(`select ${USER_COLS} from users where id = $1 limit 1`, [userId]);
  if (!userRows[0]) return null;
  const user = userRows[0];
  const studentProfile = await getStudentProfile(userId);
  const parentProfile = await getParentProfile(userId);
  const links = user.role === 'parent' ? await listLinkedStudents(userId) : await listLinkedParents(userId);
  const attempts = await q(
    `select course_id, book_id, section_idx, section_kind, score, total, passed, attempt_number, completed_at
     from quiz_attempts where user_id = $1 order by completed_at desc limit 50`,
    [userId],
  );
  const activity = await q(
    `select kind, meta, created_at from activity_log where user_id = $1 order by created_at desc limit 50`,
    [userId],
  );
  const usage = await q(
    `select coalesce(sum(cost_usd),0) as cost,
            count(*) as calls,
            coalesce(sum(input_tokens),0) as input_tokens,
            coalesce(sum(output_tokens),0) as output_tokens
     from ai_usage where user_id = $1`,
    [userId],
  );
  return {
    user,
    studentProfile,
    parentProfile,
    links,
    attempts,
    activity,
    usage: usage[0] || {},
  };
}

async function adminUpdateUser(userId, fields) {
  const sets = [];
  const params = [userId];
  let i = 2;
  if (typeof fields.is_admin === 'boolean') { sets.push(`is_admin = $${i++}`); params.push(fields.is_admin); }
  if (typeof fields.verified === 'boolean') { sets.push(`verified = $${i++}`); params.push(fields.verified); }
  if (typeof fields.role === 'string' && ['student', 'parent'].includes(fields.role)) {
    sets.push(`role = $${i++}`); params.push(fields.role);
  }
  if (!sets.length) return null;
  const rows = await q(
    `update users set ${sets.join(', ')} where id = $1 returning ${USER_COLS}`,
    params,
  );
  return rows[0] || null;
}

async function adminDeleteUser(userId) {
  await q('delete from users where id = $1', [userId]);
}

async function adminQuizAnalytics() {
  const hardestQuestions = await q(
    `select course_id, book_id, section_idx,
            jsonb_array_elements(answers)->>'q' as question,
            count(*) filter (where (jsonb_array_elements(answers)->>'correct')::boolean = false) as wrong,
            count(*) as total
     from quiz_attempts
     where jsonb_array_length(answers) > 0
     group by course_id, book_id, section_idx, question
     having count(*) >= 3
     order by 1.0 * count(*) filter (where (jsonb_array_elements(answers)->>'correct')::boolean = false) / count(*) desc
     limit 20`,
  ).catch(() => []);
  const failedSections = await q(
    `select course_id, book_id, section_idx,
            count(*) as attempts,
            count(*) filter (where passed) as passes,
            count(*) filter (where not passed) as fails
     from quiz_attempts
     group by course_id, book_id, section_idx
     having count(*) filter (where not passed) >= 2
     order by fails desc
     limit 20`,
  );
  const courseStats = await q(
    `select course_id, count(*) as attempts, count(*) filter (where passed) as passes, count(distinct user_id) as students
     from quiz_attempts group by course_id order by attempts desc`,
  );
  return { hardestQuestions, failedSections, courseStats };
}

async function adminCostChart() {
  const byDay = await q(
    `select date_trunc('day', created_at)::date as day, sum(cost_usd) as cost, count(*) as calls
     from ai_usage
     where created_at > now() - interval '30 days'
     group by day order by day asc`,
  );
  const topUsers = await q(
    `select au.user_id, u.email, sum(au.cost_usd) as cost, count(*) as calls
     from ai_usage au
     left join users u on u.id = au.user_id
     where au.user_id is not null
     group by au.user_id, u.email
     order by cost desc
     limit 10`,
  );
  const byIntent = await q(
    `select coalesce(intent, '(none)') as intent, count(*) as calls, sum(cost_usd) as cost
     from ai_usage group by intent order by cost desc`,
  );
  return { byDay, topUsers, byIntent };
}

async function adminListSessions() {
  return q(
    `select s.token, s.user_id, u.email, s.created_at, s.expires_at
     from sessions s
     left join users u on u.id = s.user_id
     where s.expires_at > now()
     order by s.created_at desc
     limit 200`,
  );
}

async function adminRevokeSession(token) {
  await q('delete from sessions where token = $1', [token]);
}

async function adminAllLinks() {
  return q(
    `select l.id, l.parent_user_id, p.email as parent_email,
            l.student_user_id, s.email as student_email,
            s.consent_required, s.consent_granted_at, s.age, l.status,
            l.created_at, l.confirmed_at
     from parent_student_links l
     left join users p on p.id = l.parent_user_id
     left join users s on s.id = l.student_user_id
     order by l.created_at desc
     limit 200`,
  );
}

async function adminLessonStats() {
  return q(
    `select course_id, count(*) as cached_count, max(updated_at) as latest_at
     from cached_lessons group by course_id order by course_id`,
  );
}

// ---------- Curriculum (reference data from xlsx imports) ----------
async function listCurriculumSubjects() {
  return q(
    `select id, title, display_order
     from curriculum_subjects
     order by display_order, id`
  );
}

// Filtered course list. opts.subject / opts.grade are both optional.
// grade matches the grade_levels array containing that integer.
async function listCurriculumCourses(opts) {
  opts = opts || {};
  const where = [];
  const params = [];
  if (opts.subject) { params.push(opts.subject); where.push(`subject_id = $${params.length}`); }
  if (opts.grade != null) {
    params.push(opts.grade);
    where.push(`$${params.length}::integer = any(grade_levels)`);
  }
  const sql = `select id, subject_id, title, grade_levels, display_order, total_weeks, total_lessons, legacy_course_id
              from curriculum_courses
              ${where.length ? 'where ' + where.join(' and ') : ''}
              order by display_order, id`;
  return q(sql, params);
}

// Full course detail: course row + its units (each with its lessons).
async function getCurriculumCourseFull(courseId) {
  const courseRows = await q(
    `select id, subject_id, title, grade_levels, display_order, total_weeks, total_lessons, legacy_course_id
     from curriculum_courses where id = $1`,
    [courseId]
  );
  if (!courseRows.length) return null;
  const course = courseRows[0];
  const units = await q(
    `select unit_number, unit_title, weeks
     from curriculum_units where course_id = $1
     order by unit_number`,
    [courseId]
  );
  const lessons = await q(
    `select unit_number, lesson_number, lesson_title, learning_objective,
            ccss_code, key_concepts, prerequisites, key_vocabulary,
            common_misconceptions, real_world_hook, practices, meta, display_order
     from curriculum_lessons where course_id = $1
     order by display_order, lesson_number`,
    [courseId]
  );
  // Group lessons under their unit.
  const byUnit = new Map();
  for (const l of lessons) {
    if (!byUnit.has(l.unit_number)) byUnit.set(l.unit_number, []);
    byUnit.get(l.unit_number).push(l);
  }
  course.units = units.map(u => ({ ...u, lessons: byUnit.get(u.unit_number) || [] }));
  return course;
}

// ---------- User favorites (legacy course + book ids) ----------
async function listFavorites(userId) {
  return q(
    `select course_id, book_id, created_at
     from user_favorites
     where user_id = $1
     order by created_at desc`,
    [userId]
  );
}

async function addFavorite(userId, courseId, bookId) {
  await q(
    `insert into user_favorites (user_id, course_id, book_id)
     values ($1, $2, $3)
     on conflict (user_id, course_id, book_id) do nothing`,
    [userId, courseId, bookId]
  );
}

async function removeFavorite(userId, courseId, bookId) {
  await q(
    `delete from user_favorites
     where user_id = $1 and course_id = $2 and book_id = $3`,
    [userId, courseId, bookId]
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
  setStripeCustomerId, findUserByStripeCustomerId, updateSubscription,
  createCode, verifyCode,
  createSession, getSession, deleteSession,
  getProgress, getAllProgress, setProgress,
  createLinkFromCode, listLinkedStudents, listLinkedParents, isParentOfStudent, deleteLink,
  logQuizAttempt, listQuizAttempts, listWeakSections,
  logActivity, listActivity,
  getStudentProfile, getParentProfile, upsertStudentProfile, upsertParentProfile,
  setParentAuthorisedReminders, markReminderSent, markDigestSent,
  listReminderCandidates, listDigestCandidates,
  recordAiUsage, listAiUsage, summariseAiUsage,
  getCachedLesson, saveCachedLesson, clearCachedLesson,
  getStudyPlan, upsertStudyPlan, deleteStudyPlan,
  adminListUsers, adminStats, adminRecentActivity,
  adminUserDetail, adminUpdateUser, adminDeleteUser,
  adminQuizAnalytics, adminCostChart, adminListSessions, adminRevokeSession,
  adminAllLinks, adminLessonStats,
  listCurriculumSubjects, listCurriculumCourses, getCurriculumCourseFull,
  listFavorites, addFavorite, removeFavorite,
  cleanup,
  // Internals exposed for the migration tool and (rarely) tests.
  _pool: pool,
  _consentRequiredForAge: consentRequiredForAge,
  _newLinkCode: newLinkCode,
  _normaliseLinkCode: normaliseLinkCode,
  _isValidCountry: isValidCountry,
};
