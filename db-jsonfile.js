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
    };
    state.users.push(u);
    save();
  }
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

async function updateUserProfile(userId, { age, country }) {
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

module.exports = {
  backend: 'jsonfile',
  findUser, getUser, findUserByLinkCode, upsertUser, markVerified,
  updateUserProfile, grantConsent,
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
  cleanup,
  _consentRequiredForAge: consentRequiredForAge,
  _newLinkCode: newLinkCode,
  _normaliseLinkCode: normaliseLinkCode,
  _isValidCountry: isValidCountry,
};
