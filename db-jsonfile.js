// JSON-file backend for db.js. Used when SUPABASE_URL is not set (e.g. local
// development without spinning up a Supabase project). All functions are
// async so the public db interface is uniform across backends.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.json');

let state = null;

function load() {
  if (state) return state;
  try {
    state = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  } catch (_) {
    state = { users: [], codes: [], sessions: [], progress: {}, links: [], quizAttempts: [], activity: [] };
  }
  // Backfill new collections for older state files.
  if (!Array.isArray(state.links)) state.links = [];
  if (!Array.isArray(state.quizAttempts)) state.quizAttempts = [];
  if (!Array.isArray(state.activity)) state.activity = [];
  if (!state.studentProfiles) state.studentProfiles = {};
  if (!state.parentProfiles) state.parentProfiles = {};
  if (!Array.isArray(state.aiUsage)) state.aiUsage = [];
  if (!state.cachedLessons) state.cachedLessons = {};
  if (!state.studyPlans) state.studyPlans = {};
  return state;
}

function lessonKey(courseId, bookId, sectionIdx, sectionKind) {
  return `${courseId}|${bookId}|${sectionIdx}|${sectionKind || 'section'}`;
}

function save() {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, DB_PATH);
}

function now() { return Date.now(); }

function normalizeEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function normalizeRole(r) {
  return r === 'parent' ? 'parent' : 'student';
}

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

// Loose validation only — country comes from a curated dropdown on the client.
// We just want to keep it sane-sized and not arbitrary garbage.
function isValidCountry(s) {
  return typeof s === 'string' && s.trim().length >= 2 && s.trim().length <= 80;
}

function consentRequiredForAge(age) {
  if (typeof age !== 'number' || isNaN(age)) return false;
  return age < 13;
}

function freshLinkCodeFor() {
  for (let i = 0; i < 5; i++) {
    const c = newLinkCode();
    if (!state.users.some(u => u.link_code === c)) return c;
  }
  throw new Error('Could not allocate a unique link_code after several attempts');
}

// ---------- Users ----------
async function findUser(email) {
  load();
  email = normalizeEmail(email);
  return state.users.find(u => u.email === email) || null;
}

async function getUser(id) {
  load();
  return state.users.find(u => u.id === id) || null;
}

async function findUserByLinkCode(code) {
  load();
  code = normaliseLinkCode(code);
  if (code.length !== 8) return null;
  return state.users.find(u => u.link_code === code) || null;
}

async function upsertUser(email, role) {
  load();
  email = normalizeEmail(email);
  let u = state.users.find(x => x.email === email);
  if (!u) {
    u = {
      id: crypto.randomUUID(),
      email,
      role: normalizeRole(role),
      verified: false,
      createdAt: now(),
      link_code: freshLinkCodeFor(),
      age: null,
      country: null,
      consent_required: false,
      consent_granted_at: null,
      // Stripe subscription state (null until the user starts a checkout)
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,        // 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | ...
      subscription_plan: null,          // 'monthly' | 'yearly'
      current_period_end: null,         // ISO string
    };
    state.users.push(u);
    save();
  }
  // Backfill the columns on older user records.
  if (!('stripe_customer_id' in u)) u.stripe_customer_id = null;
  if (!('stripe_subscription_id' in u)) u.stripe_subscription_id = null;
  if (!('subscription_status' in u)) u.subscription_status = null;
  if (!('subscription_plan' in u)) u.subscription_plan = null;
  if (!('current_period_end' in u)) u.current_period_end = null;
  return u;
}

async function setStripeCustomerId(userId, customerId) {
  load();
  const u = state.users.find(x => x.id === userId);
  if (!u) return null;
  u.stripe_customer_id = customerId;
  save();
  return u;
}

async function findUserByStripeCustomerId(customerId) {
  load();
  return state.users.find(u => u.stripe_customer_id === customerId) || null;
}

async function updateSubscription(userId, fields) {
  load();
  const u = state.users.find(x => x.id === userId);
  if (!u) return null;
  if ('stripe_subscription_id' in fields) u.stripe_subscription_id = fields.stripe_subscription_id;
  if ('subscription_status' in fields) u.subscription_status = fields.subscription_status;
  if ('current_period_end' in fields) u.current_period_end = fields.current_period_end;
  if ('plan' in fields) u.subscription_plan = fields.plan;
  save();
  return u;
}

async function markVerified(userId) {
  load();
  const u = state.users.find(x => x.id === userId);
  if (u && !u.verified) {
    u.verified = true;
    save();
  }
  return u;
}

async function updateUserProfile(userId, { age, country, gradeLevel, schoolName, schoolDistrict, isPrivateSchool, stateCode }) {
  load();
  const u = state.users.find(x => x.id === userId);
  if (!u) return null;
  if (typeof age === 'number' && age >= 4 && age <= 120) {
    u.age = Math.floor(age);
    if (consentRequiredForAge(u.age)) u.consent_required = true;
  }
  if (isValidCountry(country)) {
    u.country = country.trim();
  }
  if (typeof gradeLevel === 'number' && gradeLevel >= 1 && gradeLevel <= 12) {
    u.grade_level = Math.floor(gradeLevel);
  }
  if (typeof schoolName === 'string' && schoolName.trim()) {
    u.school_name = schoolName.trim().slice(0, 200);
  }
  if (typeof schoolDistrict === 'string' && schoolDistrict.trim()) {
    u.school_district = schoolDistrict.trim().slice(0, 200);
  }
  if (typeof isPrivateSchool === 'boolean') {
    u.is_private_school = isPrivateSchool;
  }
  if (typeof stateCode === 'string' && /^[A-Za-z]{2}$/.test(stateCode)) {
    u.state_code = stateCode.toUpperCase();
  }
  save();
  return u;
}

async function grantConsent(studentUserId) {
  load();
  const u = state.users.find(x => x.id === studentUserId);
  if (!u) return null;
  if (!u.consent_granted_at) {
    u.consent_granted_at = new Date().toISOString();
    save();
  }
  return u;
}

// ---------- Verification codes ----------
const CODE_TTL_MS = 15 * 60 * 1000;

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createCode(email) {
  load();
  email = normalizeEmail(email);
  state.codes = state.codes.filter(c => c.email !== email);
  const code = generateCode();
  state.codes.push({
    email,
    code,
    expiresAt: now() + CODE_TTL_MS,
    used: false,
  });
  save();
  return code;
}

async function verifyCode(email, code) {
  load();
  email = normalizeEmail(email);
  code = String(code).trim();
  const c = state.codes.find(x => x.email === email && x.code === code);
  if (!c) return { ok: false, reason: 'invalid' };
  if (c.used) return { ok: false, reason: 'used' };
  if (c.expiresAt < now()) return { ok: false, reason: 'expired' };
  c.used = true;
  save();
  return { ok: true };
}

// ---------- Sessions ----------
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

async function createSession(userId) {
  load();
  const token = crypto.randomBytes(32).toString('hex');
  state.sessions.push({
    token,
    userId,
    createdAt: now(),
    expiresAt: now() + SESSION_TTL_MS,
  });
  save();
  return token;
}

async function getSession(token) {
  load();
  if (!token) return null;
  const s = state.sessions.find(x => x.token === token);
  if (!s) return null;
  if (s.expiresAt < now()) {
    state.sessions = state.sessions.filter(x => x.token !== token);
    save();
    return null;
  }
  return s;
}

async function deleteSession(token) {
  load();
  state.sessions = state.sessions.filter(x => x.token !== token);
  save();
}

// ---------- Per-user progress ----------
async function getProgress(userId, key) {
  load();
  const u = state.progress[userId];
  if (!u) return null;
  return u[key] ?? null;
}

async function getAllProgress(userId) {
  load();
  return state.progress[userId] || {};
}

async function setProgress(userId, key, value) {
  load();
  if (!state.progress[userId]) state.progress[userId] = {};
  state.progress[userId][key] = value;
  state.progress[userId].__updatedAt = now();
  save();
}

// ---------- Parent / student linking ----------
async function createLinkFromCode(initiatedByUserId, otherLinkCode) {
  load();
  const me = state.users.find(u => u.id === initiatedByUserId);
  if (!me) return { ok: false, reason: 'not-signed-in' };
  const other = await findUserByLinkCode(otherLinkCode);
  if (!other) return { ok: false, reason: 'invalid-code' };
  if (other.id === me.id) return { ok: false, reason: 'self' };
  if (me.role === other.role) return { ok: false, reason: 'same-role' };

  const parentId = me.role === 'parent' ? me.id : other.id;
  const studentId = me.role === 'student' ? me.id : other.id;

  let link = state.links.find(l => l.parent_user_id === parentId && l.student_user_id === studentId);
  if (link) {
    link.status = 'active';
    link.confirmed_at = link.confirmed_at || new Date().toISOString();
  } else {
    link = {
      id: crypto.randomUUID(),
      parent_user_id: parentId,
      student_user_id: studentId,
      status: 'active',
      initiated_by_user_id: initiatedByUserId,
      created_at: new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
    };
    state.links.push(link);
  }
  save();
  await grantConsent(studentId);
  return { ok: true, link };
}

async function listLinkedStudents(parentUserId) {
  load();
  return state.links
    .filter(l => l.parent_user_id === parentUserId)
    .map(l => {
      const u = state.users.find(x => x.id === l.student_user_id);
      if (!u) return null;
      return {
        ...u,
        link_status: l.status,
        linked_at: l.created_at,
      };
    })
    .filter(Boolean);
}

async function listLinkedParents(studentUserId) {
  load();
  return state.links
    .filter(l => l.student_user_id === studentUserId)
    .map(l => {
      const u = state.users.find(x => x.id === l.parent_user_id);
      if (!u) return null;
      return {
        ...u,
        link_status: l.status,
        linked_at: l.created_at,
      };
    })
    .filter(Boolean);
}

async function isParentOfStudent(parentUserId, studentUserId) {
  load();
  return state.links.some(l =>
    l.parent_user_id === parentUserId &&
    l.student_user_id === studentUserId &&
    l.status === 'active'
  );
}

async function deleteLink(linkId, requestingUserId) {
  load();
  const before = state.links.length;
  state.links = state.links.filter(l =>
    !(l.id === linkId && (l.parent_user_id === requestingUserId || l.student_user_id === requestingUserId))
  );
  const removed = state.links.length !== before;
  if (removed) save();
  return removed;
}

// ---------- Quiz attempts ----------
async function logQuizAttempt(userId, attempt) {
  load();
  const sectionKind = attempt.sectionKind || 'section';
  const priorAttempts = state.quizAttempts.filter(a =>
    a.user_id === userId && a.course_id === attempt.courseId &&
    a.book_id === attempt.bookId && a.section_idx === attempt.sectionIdx &&
    a.section_kind === sectionKind,
  );
  const attemptNumber = priorAttempts.length + 1;
  const startedTs = attempt.startedAt ? new Date(attempt.startedAt).getTime() : null;
  const durationSeconds = startedTs ? Math.max(0, Math.round((Date.now() - startedTs) / 1000)) : null;
  const row = {
    id: crypto.randomUUID(),
    user_id: userId,
    course_id: attempt.courseId,
    book_id: attempt.bookId,
    section_idx: attempt.sectionIdx,
    section_kind: sectionKind,
    score: attempt.score,
    total: attempt.total,
    passed: !!attempt.passed,
    started_at: attempt.startedAt || null,
    completed_at: new Date().toISOString(),
    attempt_number: attemptNumber,
    duration_seconds: durationSeconds,
    answers: Array.isArray(attempt.answers) ? attempt.answers : [],
  };
  state.quizAttempts.push(row);
  save();
  await logActivity(userId, attempt.passed ? 'quiz_pass' : 'quiz_fail', {
    courseId: attempt.courseId,
    bookId: attempt.bookId,
    sectionIdx: attempt.sectionIdx,
    sectionKind,
    score: attempt.score,
    total: attempt.total,
    attemptNumber,
    durationSeconds,
  });
  return { id: row.id, completed_at: row.completed_at, attempt_number: attemptNumber, duration_seconds: durationSeconds };
}

async function listQuizAttempts(userId, opts = {}) {
  load();
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  return state.quizAttempts
    .filter(a => a.user_id === userId)
    .sort((a, b) => b.completed_at.localeCompare(a.completed_at))
    .slice(0, limit);
}

async function listWeakSections(userId, minFailures = 2) {
  load();
  const buckets = new Map();
  for (const a of state.quizAttempts) {
    if (a.user_id !== userId || a.passed) continue;
    const k = `${a.course_id}|${a.book_id}|${a.section_idx}|${a.section_kind}`;
    buckets.set(k, (buckets.get(k) || 0) + 1);
  }
  const out = [];
  for (const [k, count] of buckets) {
    if (count < minFailures) continue;
    const [course_id, book_id, section_idx, section_kind] = k.split('|');
    out.push({
      course_id, book_id, section_idx: Number(section_idx), section_kind, failures: count,
    });
  }
  out.sort((a, b) => b.failures - a.failures);
  return out;
}

// ---------- Activity log ----------
async function logActivity(userId, kind, meta) {
  load();
  state.activity.push({
    id: crypto.randomUUID(),
    user_id: userId,
    kind,
    meta: meta || {},
    created_at: new Date().toISOString(),
  });
  save();
}

async function listActivity(userId, opts = {}) {
  load();
  const limit = Math.min(parseInt(opts.limit, 10) || 50, 500);
  return state.activity
    .filter(a => a.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, limit);
}

// ---------- Profiles ----------
function defaultStudentProfile(userId) {
  return {
    user_id: userId,
    display_name: null,
    school_name: null,
    grade_level: null,
    subjects: [],
    study_plan_courses: [],
    study_goal: null,
    timezone: null,
    reminder_enabled: false,
    reminder_frequency: 'weekly',
    reminder_time_local: '17:00',
    reminder_content: 'generic',
    parent_authorised_reminders: false,
    last_reminder_sent_at: null,
    ai_model_preference: 'balanced',
    updated_at: new Date().toISOString(),
  };
}

function defaultParentProfile(userId) {
  return {
    user_id: userId,
    display_name: null,
    relationship: 'parent',
    timezone: null,
    weekly_digest_enabled: true,
    weekly_digest_day: 0,
    weekly_digest_time_local: '09:00',
    last_digest_sent_at: null,
    updated_at: new Date().toISOString(),
  };
}

async function getStudentProfile(userId) {
  load();
  return state.studentProfiles[userId] || null;
}

async function getParentProfile(userId) {
  load();
  return state.parentProfiles[userId] || null;
}

async function upsertStudentProfile(userId, fields) {
  load();
  const existing = state.studentProfiles[userId] || defaultStudentProfile(userId);
  const f = fields || {};
  const merged = {
    ...existing,
    display_name: f.displayName ?? existing.display_name,
    school_name: f.schoolName ?? existing.school_name,
    grade_level: f.gradeLevel ?? existing.grade_level,
    subjects: Array.isArray(f.subjects) ? f.subjects : existing.subjects,
    study_plan_courses: Array.isArray(f.studyPlanCourses) ? f.studyPlanCourses : existing.study_plan_courses,
    study_goal: f.studyGoal ?? existing.study_goal,
    timezone: f.timezone ?? existing.timezone,
    reminder_enabled: f.reminderEnabled ?? existing.reminder_enabled,
    reminder_frequency: f.reminderFrequency ?? existing.reminder_frequency,
    reminder_time_local: f.reminderTimeLocal ?? existing.reminder_time_local,
    reminder_content: f.reminderContent ?? existing.reminder_content,
    parent_authorised_reminders: f.parentAuthorisedReminders ?? existing.parent_authorised_reminders,
    ai_model_preference: f.aiModelPreference ?? existing.ai_model_preference ?? 'balanced',
    updated_at: new Date().toISOString(),
  };
  state.studentProfiles[userId] = merged;
  save();
  return merged;
}

async function upsertParentProfile(userId, fields) {
  load();
  const existing = state.parentProfiles[userId] || defaultParentProfile(userId);
  const f = fields || {};
  const merged = {
    ...existing,
    display_name: f.displayName ?? existing.display_name,
    relationship: f.relationship ?? existing.relationship,
    timezone: f.timezone ?? existing.timezone,
    weekly_digest_enabled: f.weeklyDigestEnabled ?? existing.weekly_digest_enabled,
    weekly_digest_day: f.weeklyDigestDay ?? existing.weekly_digest_day,
    weekly_digest_time_local: f.weeklyDigestTimeLocal ?? existing.weekly_digest_time_local,
    updated_at: new Date().toISOString(),
  };
  state.parentProfiles[userId] = merged;
  save();
  return merged;
}

async function setParentAuthorisedReminders(studentUserId, allow) {
  return upsertStudentProfile(studentUserId, { parentAuthorisedReminders: !!allow });
}

async function markReminderSent(studentUserId) {
  load();
  const p = state.studentProfiles[studentUserId];
  if (p) {
    p.last_reminder_sent_at = new Date().toISOString();
    save();
  }
}
async function markDigestSent(parentUserId) {
  load();
  const p = state.parentProfiles[parentUserId];
  if (p) {
    p.last_digest_sent_at = new Date().toISOString();
    save();
  }
}

async function listReminderCandidates() {
  load();
  const out = [];
  for (const sp of Object.values(state.studentProfiles)) {
    if (!sp.reminder_enabled || !sp.timezone) continue;
    const u = state.users.find(x => x.id === sp.user_id);
    if (!u) continue;
    out.push({
      user_id: u.id,
      email: u.email,
      age: u.age,
      consent_required: u.consent_required,
      display_name: sp.display_name,
      timezone: sp.timezone,
      reminder_enabled: sp.reminder_enabled,
      reminder_frequency: sp.reminder_frequency,
      reminder_time_local: sp.reminder_time_local,
      reminder_content: sp.reminder_content,
      parent_authorised_reminders: sp.parent_authorised_reminders,
      last_reminder_sent_at: sp.last_reminder_sent_at,
    });
  }
  return out;
}

async function listDigestCandidates() {
  load();
  const out = [];
  for (const pp of Object.values(state.parentProfiles)) {
    if (!pp.weekly_digest_enabled || !pp.timezone) continue;
    const u = state.users.find(x => x.id === pp.user_id);
    if (!u) continue;
    out.push({
      user_id: u.id,
      email: u.email,
      display_name: pp.display_name,
      timezone: pp.timezone,
      weekly_digest_enabled: pp.weekly_digest_enabled,
      weekly_digest_day: pp.weekly_digest_day,
      weekly_digest_time_local: pp.weekly_digest_time_local,
      last_digest_sent_at: pp.last_digest_sent_at,
    });
  }
  return out;
}

// ---------- Maintenance ----------
async function cleanup() {
  load();
  const t = now();
  const beforeCodes = state.codes.length;
  const beforeSessions = state.sessions.length;
  state.codes = state.codes.filter(c => c.expiresAt >= t && !c.used);
  state.sessions = state.sessions.filter(s => s.expiresAt >= t);
  if (state.codes.length !== beforeCodes || state.sessions.length !== beforeSessions) save();
}

// ---------- AI usage tracking ----------
async function recordAiUsage(rec) {
  load();
  state.aiUsage.push({
    id: crypto.randomUUID(),
    user_id: rec.userId || null,
    user_email: rec.userEmail || null,
    intent: rec.intent || null,
    model: rec.model || 'unknown',
    input_tokens: rec.inputTokens | 0,
    output_tokens: rec.outputTokens | 0,
    cache_read_tokens: rec.cacheReadTokens | 0,
    cache_creation_tokens: rec.cacheCreationTokens | 0,
    cost_usd: Number(rec.costUsd) || 0,
    created_at: new Date().toISOString(),
  });
  save();
}

async function listAiUsage(opts = {}) {
  load();
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  let rows = state.aiUsage;
  if (opts.userId) rows = rows.filter(r => r.user_id === opts.userId);
  return rows.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
}

async function summariseAiUsage(opts = {}) {
  load();
  let rows = state.aiUsage;
  if (opts.userId) rows = rows.filter(r => r.user_id === opts.userId);
  const totals = rows.reduce((acc, r) => {
    acc.cost += r.cost_usd;
    acc.input_tokens += r.input_tokens;
    acc.output_tokens += r.output_tokens;
    acc.cache_read_tokens += r.cache_read_tokens;
    acc.cache_creation_tokens += r.cache_creation_tokens;
    acc.calls += 1;
    return acc;
  }, { cost: 0, input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_creation_tokens: 0, calls: 0 });
  const byIntent = Object.entries(rows.reduce((acc, r) => {
    const k = r.intent || '(none)';
    if (!acc[k]) acc[k] = { intent: k, calls: 0, cost: 0 };
    acc[k].calls++; acc[k].cost += r.cost_usd;
    return acc;
  }, {})).map(([, v]) => v).sort((a, b) => b.cost - a.cost);
  const byModel = Object.entries(rows.reduce((acc, r) => {
    if (!acc[r.model]) acc[r.model] = { model: r.model, calls: 0, cost: 0, input_tokens: 0, output_tokens: 0 };
    acc[r.model].calls++;
    acc[r.model].cost += r.cost_usd;
    acc[r.model].input_tokens += r.input_tokens;
    acc[r.model].output_tokens += r.output_tokens;
    return acc;
  }, {})).map(([, v]) => v).sort((a, b) => b.cost - a.cost);
  const byDay = Object.entries(rows.reduce((acc, r) => {
    const d = r.created_at.slice(0, 10);
    if (!acc[d]) acc[d] = { day: d, calls: 0, cost: 0 };
    acc[d].calls++; acc[d].cost += r.cost_usd;
    return acc;
  }, {})).map(([, v]) => v).sort((a, b) => b.day.localeCompare(a.day)).slice(0, 30);
  return { totals, byIntent, byModel, byDay };
}

// ---------- Cached lessons ----------
async function getCachedLesson(courseId, bookId, sectionIdx, sectionKind = 'section') {
  load();
  return state.cachedLessons[lessonKey(courseId, bookId, sectionIdx, sectionKind)] || null;
}
async function saveCachedLesson(courseId, bookId, sectionIdx, sectionKind, content, model) {
  load();
  state.cachedLessons[lessonKey(courseId, bookId, sectionIdx, sectionKind)] = {
    content, model: model || null, updated_at: new Date().toISOString(),
  };
  save();
}
async function clearCachedLesson(courseId, bookId, sectionIdx, sectionKind = 'section') {
  load();
  delete state.cachedLessons[lessonKey(courseId, bookId, sectionIdx, sectionKind)];
  save();
}

// ---------- Admin: cross-user summaries ----------
async function adminListUsers(opts = {}) {
  load();
  const limit = Math.min(parseInt(opts.limit, 10) || 200, 1000);
  return state.users.slice().sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, limit).map(u => ({
    id: u.id, email: u.email, role: u.role, verified: u.verified,
    created_at: new Date(u.createdAt || Date.now()).toISOString(),
    age: u.age || null, country: u.country || u.state || null,
    consent_required: !!u.consent_required, consent_granted_at: u.consent_granted_at || null,
    is_admin: !!u.is_admin,
    quiz_attempts: state.quizAttempts.filter(a => a.user_id === u.id).length,
    quiz_passed: state.quizAttempts.filter(a => a.user_id === u.id && a.passed).length,
    activity_count: state.activity.filter(a => a.user_id === u.id).length,
    cost_usd: state.aiUsage.filter(a => a.user_id === u.id).reduce((s, a) => s + (a.cost_usd || 0), 0),
  }));
}
async function adminStats() {
  load();
  const now = Date.now();
  const last24 = now - 24 * 60 * 60 * 1000;
  const last30 = now - 30 * 24 * 60 * 60 * 1000;
  return {
    users_total: state.users.length,
    students_total: state.users.filter(u => u.role === 'student').length,
    parents_total: state.users.filter(u => u.role === 'parent').length,
    users_verified: state.users.filter(u => u.verified).length,
    students_consent_required: state.users.filter(u => u.consent_required).length,
    students_consent_granted: state.users.filter(u => u.consent_required && u.consent_granted_at).length,
    links_total: state.links.length,
    quiz_attempts_total: state.quizAttempts.length,
    quiz_attempts_passed: state.quizAttempts.filter(a => a.passed).length,
    active_sessions: state.sessions.filter(s => s.expiresAt > now).length,
    cached_lessons_total: Object.keys(state.cachedLessons).length,
    study_plans_total: Object.keys(state.studyPlans).length,
    cost_all_time: state.aiUsage.reduce((s, a) => s + (a.cost_usd || 0), 0),
    cost_24h: state.aiUsage.filter(a => new Date(a.created_at).getTime() >= last24).reduce((s, a) => s + (a.cost_usd || 0), 0),
    cost_30d: state.aiUsage.filter(a => new Date(a.created_at).getTime() >= last30).reduce((s, a) => s + (a.cost_usd || 0), 0),
  };
}
async function adminRecentActivity(limit = 50) {
  load();
  const lim = Math.min(parseInt(limit, 10) || 50, 500);
  return state.activity.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, lim).map(a => {
    const u = state.users.find(x => x.id === a.user_id);
    return { id: a.id, user_id: a.user_id, email: u ? u.email : null, kind: a.kind, meta: a.meta, created_at: a.created_at };
  });
}
async function adminUserDetail(userId) {
  load();
  const user = state.users.find(u => u.id === userId);
  if (!user) return null;
  return {
    user,
    studentProfile: state.studentProfiles[userId] || null,
    parentProfile: state.parentProfiles[userId] || null,
    links: state.links.filter(l => l.parent_user_id === userId || l.student_user_id === userId),
    attempts: state.quizAttempts.filter(a => a.user_id === userId).slice(0, 50),
    activity: state.activity.filter(a => a.user_id === userId).slice(0, 50),
    usage: state.aiUsage.filter(a => a.user_id === userId).reduce((acc, a) => {
      acc.cost += a.cost_usd || 0;
      acc.calls++;
      acc.input_tokens += a.input_tokens || 0;
      acc.output_tokens += a.output_tokens || 0;
      return acc;
    }, { cost: 0, calls: 0, input_tokens: 0, output_tokens: 0 }),
  };
}
async function adminUpdateUser(userId, fields) {
  load();
  const u = state.users.find(x => x.id === userId);
  if (!u) return null;
  if (typeof fields.is_admin === 'boolean') u.is_admin = fields.is_admin;
  if (typeof fields.verified === 'boolean') u.verified = fields.verified;
  if (typeof fields.role === 'string' && ['student', 'parent'].includes(fields.role)) u.role = fields.role;
  save();
  return u;
}
async function adminDeleteUser(userId) {
  load();
  state.users = state.users.filter(u => u.id !== userId);
  save();
}
async function adminQuizAnalytics() {
  return { hardestQuestions: [], failedSections: [], courseStats: [] };
}
async function adminCostChart() {
  return { byDay: [], topUsers: [], byIntent: [] };
}
async function adminListSessions() {
  load();
  return state.sessions.filter(s => s.expiresAt > Date.now()).map(s => {
    const u = state.users.find(x => x.id === s.userId);
    return { token: s.token, user_id: s.userId, email: u ? u.email : null, created_at: new Date(s.createdAt).toISOString(), expires_at: new Date(s.expiresAt).toISOString() };
  });
}
async function adminRevokeSession(token) {
  load();
  state.sessions = state.sessions.filter(s => s.token !== token);
  save();
}
async function adminAllLinks() {
  load();
  return state.links.map(l => {
    const p = state.users.find(u => u.id === l.parent_user_id);
    const s = state.users.find(u => u.id === l.student_user_id);
    return { ...l, parent_email: p?.email, student_email: s?.email, age: s?.age, consent_required: s?.consent_required, consent_granted_at: s?.consent_granted_at };
  });
}
async function adminLessonStats() {
  load();
  const byCourse = {};
  for (const k of Object.keys(state.cachedLessons)) {
    const courseId = k.split('|')[0];
    byCourse[courseId] = (byCourse[courseId] || 0) + 1;
  }
  return Object.entries(byCourse).map(([course_id, cached_count]) => ({ course_id, cached_count }));
}

// ---------- Study plan ----------
async function getStudyPlan(userId) {
  load();
  return state.studyPlans[userId] || null;
}
async function upsertStudyPlan(userId, fields) {
  load();
  const existing = state.studyPlans[userId] || { user_id: userId, created_at: new Date().toISOString() };
  const merged = {
    ...existing,
    user_id: userId,
    goal_text: fields.goalText || existing.goal_text || '',
    target_date: fields.targetDate || existing.target_date || null,
    course_id: fields.courseId || existing.course_id || null,
    plan_json: fields.planJson || existing.plan_json || {},
    updated_at: new Date().toISOString(),
  };
  state.studyPlans[userId] = merged;
  save();
  return merged;
}
async function deleteStudyPlan(userId) {
  load();
  delete state.studyPlans[userId];
  save();
}

// Curriculum tables live in Postgres only — the xlsx import script
// writes there directly. Local jsonfile dev returns empty data so the
// API endpoints don't blow up.
async function listCurriculumSubjects() { return []; }
async function listCurriculumCourses() { return []; }
async function getCurriculumCourseFull() { return null; }

// ---------- Cached curriculum lesson quizzes (Postgres-only feature) ----------
async function getCurriculumQuiz() { return null; }
async function saveCurriculumQuiz() { /* no-op in jsonfile dev */ }

// ---------- Time tracking + summary (Postgres-only) ----------
async function recordHeartbeat() { /* no-op in jsonfile dev */ }
async function getActivitySummaryAll() { return []; }
async function getUserStreaks() { return { current_streak: 0, longest_streak: 0, last_active: null }; }
async function getUserAchievements() { return { badges: [], earned: 0, total: 0 }; }
async function awardPoints() { /* no-op */ }
async function getMyPoints() { return 0; }
async function getMyPointsSummary() { return { today: 0, week: 0, month: 0, all_time: 0 }; }
async function getLeaderboard() { return []; }
async function getMyLeaderboardRank() { return { rank: null, points: 0, total: 0 }; }
async function getOrCreatePOD() { return null; }
async function savePOD() { /* no-op */ }
async function getMyPODAttempt() { return null; }
async function recordPODAttempt() { /* no-op */ }
async function getPODStats() { return { total: 0, solved: 0 }; }
async function searchSchoolDistricts() { return []; }
async function recordUserDistrict() { /* no-op */ }
async function getActivitySummary() {
  return [
    { subject: 'math', subject_title: 'Math', signins: 0, lessons_started: 0, quizzes_started: 0, quizzes_passed: 0, quizzes_failed: 0, avg_score_pct: 0, study_sessions: 0, hints_used: 0, time_spent_seconds: 0 },
    { subject: 'language_arts', subject_title: 'Language Arts', signins: 0, lessons_started: 0, quizzes_started: 0, quizzes_passed: 0, quizzes_failed: 0, avg_score_pct: 0, study_sessions: 0, hints_used: 0, time_spent_seconds: 0 },
  ];
}

// ---------- User favorites ----------
async function listFavorites(userId) {
  load();
  state.favorites = state.favorites || [];
  return state.favorites
    .filter(f => f.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

async function addFavorite(userId, courseId, bookId) {
  load();
  state.favorites = state.favorites || [];
  const exists = state.favorites.find(f => f.user_id === userId && f.course_id === courseId && f.book_id === bookId);
  if (exists) return;
  state.favorites.push({
    user_id: userId, course_id: courseId, book_id: bookId,
    created_at: new Date().toISOString(),
  });
  save();
}

async function removeFavorite(userId, courseId, bookId) {
  load();
  state.favorites = state.favorites || [];
  state.favorites = state.favorites.filter(f => !(f.user_id === userId && f.course_id === courseId && f.book_id === bookId));
  save();
}

module.exports = {
  backend: 'jsonfile',
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
  getCurriculumQuiz, saveCurriculumQuiz,
  recordHeartbeat, getActivitySummary, getActivitySummaryAll,
  getUserStreaks, getUserAchievements,
  awardPoints, getMyPoints, getMyPointsSummary, getLeaderboard, getMyLeaderboardRank,
  getOrCreatePOD, savePOD, getMyPODAttempt, recordPODAttempt, getPODStats,
  searchSchoolDistricts, recordUserDistrict,
  cleanup,
  _consentRequiredForAge: consentRequiredForAge,
  _newLinkCode: newLinkCode,
  _normaliseLinkCode: normaliseLinkCode,
  _isValidCountry: isValidCountry,
};
