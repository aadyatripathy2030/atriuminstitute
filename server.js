// Atrium Institute — static site + Claude proxy + email auth + per-user progress.
//
// Env vars:
//   PORT                  Port (default 8765; Render sets this)
//   ANTHROPIC_API_KEY     Required for Max (the AI tutor)
//   RESEND_API_KEY        Optional. If unset, verification codes print to server console.
//   EMAIL_FROM            Optional. Default: "Atrium Institute <onboarding@resend.dev>"
//   RATE_LIMIT_PER_HOUR   Claude requests per IP per hour (default 30)
//   DAILY_REQUEST_CAP     Total Claude requests per day (default 1000)
//   DB_PATH               Where to store data.json (default ./data.json)

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const db = require('./db');
const email = require('./email');
const prompts = require('./prompts');

// Anthropic pricing per million tokens (USD), as of mid-2026. If a model
// is not listed we charge using Sonnet rates (conservative). Update when
// Anthropic publishes new pricing.
const MODEL_PRICING = {
  'claude-sonnet-4-5-20250929': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.30 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.10 },
  'claude-opus-4-7': { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.50 },
};
function pricingFor(model) { return MODEL_PRICING[model] || MODEL_PRICING['claude-sonnet-4-5-20250929']; }
function computeCost(model, usage) {
  const p = pricingFor(model);
  const inT = (usage.input_tokens || 0) - (usage.cache_read_input_tokens || 0) - (usage.cache_creation_input_tokens || 0);
  const cost = (Math.max(0, inT) * p.input
              + (usage.cache_creation_input_tokens || 0) * p.cacheWrite
              + (usage.cache_read_input_tokens || 0) * p.cacheRead
              + (usage.output_tokens || 0) * p.output) / 1_000_000;
  return cost;
}

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
function _isAdminEmail(emailStr) {
  return emailStr && ADMIN_EMAILS.includes(String(emailStr).toLowerCase());
}

const PORT = process.env.PORT || 8765;
const ROOT = __dirname;
const RATE_LIMIT_PER_HOUR = parseInt(process.env.RATE_LIMIT_PER_HOUR, 10) || 30;
const DAILY_REQUEST_CAP = parseInt(process.env.DAILY_REQUEST_CAP, 10) || 1000;

// Anthropic key
let API_KEY = process.env.ANTHROPIC_API_KEY || '';
if (!API_KEY) {
  try { API_KEY = fs.readFileSync(path.join(ROOT, '.apikey'), 'utf8').trim(); } catch (_) {}
}
if (!API_KEY) {
  try {
    const home = process.env.HOME || '';
    API_KEY = fs.readFileSync(path.join(home, '.anthropic_api_key'), 'utf8').trim();
  } catch (_) {}
}
if (!API_KEY) console.warn('⚠️  No ANTHROPIC_API_KEY found.');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// ---------- Helpers ----------
function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, v] = part.trim().split('=');
    if (k === name) return v;
  }
  return null;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => { data += c; if (data.length > 1_000_000) { reject(new Error('too big')); req.destroy(); }});
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

async function readJSON(req) {
  const body = await readBody(req);
  try { return JSON.parse(body); } catch { return null; }
}

function json(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(obj));
}

function sessionCookieHeader(token) {
  // 30 days, HttpOnly, SameSite=Lax
  return `atrium_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60*60*24*30}`;
}

function clearCookieHeader() {
  return `atrium_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

async function currentUser(req) {
  const token = getCookie(req, 'atrium_session');
  const sess = await db.getSession(token);
  if (!sess) return null;
  return db.getUser(sess.userId);
}

// ---------- Rate limiting + budget ----------
const ipBuckets = new Map();
function ipOf(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}
function rateLimitCheck(ip) {
  const now = Date.now();
  let b = ipBuckets.get(ip);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + 60*60*1000 };
    ipBuckets.set(ip, b);
  }
  b.count++;
  return b.count <= RATE_LIMIT_PER_HOUR;
}
let dailyCount = 0;
let dailyResetAt = nextUtcMidnight();
function nextUtcMidnight() {
  const d = new Date();
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0);
}
function budgetCheck() {
  if (Date.now() >= dailyResetAt) { dailyCount = 0; dailyResetAt = nextUtcMidnight(); }
  dailyCount++;
  return dailyCount <= DAILY_REQUEST_CAP;
}

// ---------- Auth routes ----------
const VALID_ROLES = ['student', 'parent'];

function isValidEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length < 200;
}

function isValidRole(r) {
  return typeof r === 'string' && VALID_ROLES.includes(r);
}

// Holding-area for signup metadata between /signup and /verify so we can apply
// age/state/link_code at first verification rather than to a fresh-but-unverified
// account. Keyed by normalised email; entries time out with the verification
// code anyway.
const pendingSignupMeta = new Map();
const PENDING_META_TTL_MS = 30 * 60 * 1000;
function cleanupPendingMeta() {
  const now = Date.now();
  for (const [k, v] of pendingSignupMeta) {
    if (v.expiresAt < now) pendingSignupMeta.delete(k);
  }
}

async function handleSignupOrLogin(req, res) {
  const body = await readJSON(req);
  if (!body || !isValidEmail(body.email)) return json(res, 400, { error: 'Invalid email.' });
  const role = isValidRole(body.role) ? body.role : 'student';
  const user = await db.upsertUser(body.email, role);

  // Stash optional first-signup metadata for /verify to apply atomically.
  cleanupPendingMeta();
  pendingSignupMeta.set(user.email, {
    age: typeof body.age === 'number' ? body.age : null,
    country: typeof body.country === 'string' ? body.country : (typeof body.state === 'string' ? body.state : null),
    linkCode: typeof body.linkCode === 'string' ? body.linkCode : null,
    expiresAt: Date.now() + PENDING_META_TTL_MS,
  });

  const code = await db.createCode(user.email);
  try {
    await email.sendVerificationCode(user.email, code);
  } catch (e) {
    console.error('Email send failed:', e.message);
    return json(res, 502, { error: 'Could not send verification email. Try again.' });
  }
  json(res, 200, { ok: true, message: 'Check your email for a 6-digit code.' });
}

function userPublic(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    role: u.role || 'student',
    link_code: u.link_code || null,
    age: u.age == null ? null : Number(u.age),
    country: u.country || u.state || null,
    consent_required: !!u.consent_required,
    consent_granted_at: u.consent_granted_at || null,
    is_admin: !!u.is_admin,
  };
}

async function handleVerify(req, res) {
  const body = await readJSON(req);
  if (!body || !isValidEmail(body.email) || !body.code) {
    return json(res, 400, { error: 'Email and code required.' });
  }
  const result = await db.verifyCode(body.email, body.code);
  if (!result.ok) {
    const msg = result.reason === 'expired' ? 'Code expired. Request a new one.'
              : result.reason === 'used' ? 'Code already used.'
              : 'Invalid code.';
    return json(res, 400, { error: msg });
  }
  let user = await db.findUser(body.email);
  if (!user) return json(res, 500, { error: 'User not found.' });
  await db.markVerified(user.id);

  // Apply any first-signup metadata that the user sent on /signup. Done after
  // verification so an attacker who guesses an email can't poison a real
  // user's age / state / link.
  const meta = pendingSignupMeta.get(user.email);
  if (meta) {
    pendingSignupMeta.delete(user.email);
    if (meta.age != null || meta.country != null) {
      user = await db.updateUserProfile(user.id, { age: meta.age, country: meta.country }) || user;
    }
    if (meta.linkCode) {
      const linked = await db.createLinkFromCode(user.id, meta.linkCode);
      if (linked && linked.ok) {
        user = await db.getUser(user.id) || user;
      }
    }
  }

  const token = await db.createSession(user.id);
  await db.logActivity(user.id, 'signin', {});
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': sessionCookieHeader(token)
  });
  res.end(JSON.stringify({ ok: true, user: userPublic(user) }));
}

async function handleLogout(req, res) {
  const token = getCookie(req, 'atrium_session');
  if (token) await db.deleteSession(token);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': clearCookieHeader()
  });
  res.end(JSON.stringify({ ok: true }));
}

async function handleMe(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  // Add linked parents/students so the client can render the dashboard.
  const links = u.role === 'parent'
    ? await db.listLinkedStudents(u.id)
    : await db.listLinkedParents(u.id);
  json(res, 200, { user: userPublic(u), links: links.map(userPublic) });
}

async function handleUpdateProfile(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body) return json(res, 400, { error: 'Bad payload.' });
  const updated = await db.updateUserProfile(u.id, {
    age: typeof body.age === 'number' ? body.age : null,
    country: typeof body.country === 'string' ? body.country : (typeof body.state === 'string' ? body.state : null),
  });
  json(res, 200, { user: userPublic(updated || u) });
}

// ---------- Rich profile (student + parent) ----------

const REMINDER_FREQUENCIES = new Set(['daily', 'weekdays', 'mwf', 'twr', 'weekly', 'biweekly']);
const REMINDER_CONTENTS = new Set(['generic', 'continuation', 'weak_topics']);
const RELATIONSHIPS = new Set(['parent', 'guardian', 'tutor', 'other']);

function sanitizeStudentProfile(body) {
  const f = {};
  if (typeof body.displayName === 'string') f.displayName = body.displayName.slice(0, 200);
  if (typeof body.schoolName === 'string') f.schoolName = body.schoolName.slice(0, 200);
  if (typeof body.gradeLevel === 'string') f.gradeLevel = body.gradeLevel.slice(0, 50);
  if (Array.isArray(body.subjects)) f.subjects = body.subjects.map(String).slice(0, 20);
  if (Array.isArray(body.studyPlanCourses)) f.studyPlanCourses = body.studyPlanCourses.map(String).slice(0, 20);
  if (typeof body.studyGoal === 'string') f.studyGoal = body.studyGoal.slice(0, 2000);
  if (typeof body.timezone === 'string') f.timezone = body.timezone.slice(0, 100);
  if (typeof body.reminderEnabled === 'boolean') f.reminderEnabled = body.reminderEnabled;
  if (typeof body.reminderFrequency === 'string' && REMINDER_FREQUENCIES.has(body.reminderFrequency)) f.reminderFrequency = body.reminderFrequency;
  if (typeof body.reminderTimeLocal === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(body.reminderTimeLocal)) f.reminderTimeLocal = body.reminderTimeLocal;
  if (typeof body.reminderContent === 'string' && REMINDER_CONTENTS.has(body.reminderContent)) f.reminderContent = body.reminderContent;
  return f;
}

function sanitizeParentProfile(body) {
  const f = {};
  if (typeof body.displayName === 'string') f.displayName = body.displayName.slice(0, 200);
  if (typeof body.relationship === 'string' && RELATIONSHIPS.has(body.relationship)) f.relationship = body.relationship;
  if (typeof body.timezone === 'string') f.timezone = body.timezone.slice(0, 100);
  if (typeof body.weeklyDigestEnabled === 'boolean') f.weeklyDigestEnabled = body.weeklyDigestEnabled;
  if (typeof body.weeklyDigestDay === 'number' && body.weeklyDigestDay >= 0 && body.weeklyDigestDay <= 6) f.weeklyDigestDay = body.weeklyDigestDay | 0;
  if (typeof body.weeklyDigestTimeLocal === 'string' && /^\d{2}:\d{2}(:\d{2})?$/.test(body.weeklyDigestTimeLocal)) f.weeklyDigestTimeLocal = body.weeklyDigestTimeLocal;
  return f;
}

async function handleGetRichProfile(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const profile = u.role === 'parent'
    ? await db.getParentProfile(u.id)
    : await db.getStudentProfile(u.id);
  json(res, 200, {
    role: u.role,
    profile,
    user: { age: u.age == null ? null : Number(u.age), country: u.country || null },
  });
}

async function handleSaveRichProfile(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body) return json(res, 400, { error: 'Bad payload.' });

  // Country edits live on the users table. Age is NOT editable here — it
  // controls consent_required and must stay at whatever was provided at
  // signup. Mistyped ages get fixed via support.
  if (typeof body.country === 'string' && body.country.trim()) {
    await db.updateUserProfile(u.id, { country: body.country.trim() });
  }

  // Under-13 students cannot turn their own reminders on without parent
  // authorisation; silently drop that flag if they try.
  if (u.role === 'student' && u.consent_required && body.reminderEnabled === true) {
    const sp = await db.getStudentProfile(u.id);
    if (!sp || !sp.parent_authorised_reminders) {
      body.reminderEnabled = false;
    }
  }
  const profile = u.role === 'parent'
    ? await db.upsertParentProfile(u.id, sanitizeParentProfile(body))
    : await db.upsertStudentProfile(u.id, sanitizeStudentProfile(body));
  const fresh = await db.getUser(u.id);
  json(res, 200, {
    role: u.role,
    profile,
    user: { age: fresh.age == null ? null : Number(fresh.age), country: fresh.country || null },
  });
}

async function handleParentAuthoriseReminders(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const body = await readJSON(req);
  const allow = body && body.allow === true;
  const profile = await db.setParentAuthorisedReminders(studentId, allow);
  if (!allow) {
    await db.upsertStudentProfile(studentId, { reminderEnabled: false });
  }
  json(res, 200, { profile });
}

async function handleCreateLink(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  const code = body && body.linkCode;
  if (!code) return json(res, 400, { error: 'Link code required.' });
  const result = await db.createLinkFromCode(u.id, code);
  if (!result.ok) {
    const msg = result.reason === 'invalid-code' ? 'That code does not match any account.'
              : result.reason === 'self' ? 'You can’t link to yourself.'
              : result.reason === 'same-role' ? 'Both accounts have the same role. A link must be between a student and a parent.'
              : 'Could not create the link.';
    return json(res, 400, { error: msg });
  }
  await db.logActivity(u.id, 'link_created', { linkId: result.link.id });
  json(res, 200, { ok: true, link: result.link });
}

async function handleDeleteLink(req, res, linkId) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const removed = await db.deleteLink(linkId, u.id);
  if (!removed) return json(res, 404, { error: 'Link not found.' });
  await db.logActivity(u.id, 'link_removed', { linkId });
  json(res, 200, { ok: true });
}

// ---------- Progress routes ----------
async function handleGetAllProgress(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  json(res, 200, { progress: await db.getAllProgress(u.id) });
}

async function handleSaveProgress(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.key !== 'string') return json(res, 400, { error: 'Bad payload.' });
  await db.setProgress(u.id, body.key, body.data);
  json(res, 200, { ok: true });
}

// ---------- Activity & quiz-attempt routes ----------
async function handleLogQuizAttempt(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.courseId !== 'string' || typeof body.bookId !== 'string'
    || typeof body.sectionIdx !== 'number' || typeof body.score !== 'number'
    || typeof body.total !== 'number' || typeof body.passed !== 'boolean') {
    return json(res, 400, { error: 'Bad payload.' });
  }
  // Sanitize the per-question answers array: drop unexpected keys, cap length
  // and string sizes so a malicious client can't bloat the DB row.
  let answers = [];
  if (Array.isArray(body.answers)) {
    answers = body.answers.slice(0, 100).map(a => ({
      q: typeof a.q === 'string' ? a.q.slice(0, 4000) : '',
      type: a.type === 'word' ? 'word' : 'regular',
      userAnswer: a.userAnswer == null ? null : String(a.userAnswer).slice(0, 2000),
      correctAnswer: a.correctAnswer == null ? '' : String(a.correctAnswer).slice(0, 2000),
      correct: !!a.correct,
      note: a.note ? String(a.note).slice(0, 500) : undefined,
    }));
  }
  const row = await db.logQuizAttempt(u.id, { ...body, answers });
  json(res, 200, { ok: true, attempt: row });
}

// Whitelisted client-emitted activity kinds. Server-emitted kinds (signin,
// quiz_pass, etc.) are not accepted here.
const CLIENT_ACTIVITY_KINDS = new Set([
  'lesson_started', 'study_started', 'chat_topic_started',
  'quiz_started', 'quiz_question_answered', 'hint_used',
]);

async function handleLogClientActivity(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.kind !== 'string' || !CLIENT_ACTIVITY_KINDS.has(body.kind)) {
    return json(res, 400, { error: 'Bad payload.' });
  }
  const meta = body.meta && typeof body.meta === 'object' ? body.meta : {};
  // Restrict meta to a small set of known keys so the DB doesn't fill up
  // with arbitrary nested JSON. Strings + numbers are cap-truncated; the
  // `correct` key is the only allowed boolean.
  const safeMeta = {};
  for (const k of ['courseId', 'bookId', 'sectionIdx', 'sectionTitle', 'topic', 'questionNumber', 'questionTotal', 'hintLevel']) {
    if (k in meta && (typeof meta[k] === 'string' || typeof meta[k] === 'number')) {
      const v = meta[k];
      safeMeta[k] = typeof v === 'string' ? v.slice(0, 200) : v;
    }
  }
  if (typeof meta.correct === 'boolean') safeMeta.correct = meta.correct;
  await db.logActivity(u.id, body.kind, safeMeta);
  json(res, 200, { ok: true });
}

async function handleGetMyQuizAttempts(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const attempts = await db.listQuizAttempts(u.id);
  json(res, 200, { attempts });
}

async function handleGetMyActivity(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const activity = await db.listActivity(u.id);
  json(res, 200, { activity });
}

async function handleGetMyWeakSections(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const sections = await db.listWeakSections(u.id);
  json(res, 200, { sections });
}

// Spaced-repetition: pick a few past-failed sections that are "due" for
// review. Simple algorithm — a failed attempt becomes due 24 hours later
// and stays due until the student passes that section again. Returns at
// most 3 entries so the home-page widget stays calm.
async function handleGetReviewQueue(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const attempts = await db.listQuizAttempts(u.id, { limit: 300 });

  // Walk recent → older. For each (course, book, section) note the most
  // recent attempt and whether it was a fail. If the most recent attempt
  // is a fail and is at least 24h old, queue it.
  const seen = new Map();
  for (const a of attempts) {
    const k = `${a.course_id}|${a.book_id}|${a.section_idx}|${a.section_kind}`;
    if (seen.has(k)) continue;
    seen.set(k, a);
  }
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const FOURTEEN_DAYS = 14 * ONE_DAY;
  const due = [];
  for (const [, a] of seen) {
    if (a.passed) continue;
    const last = new Date(a.completed_at).getTime();
    const age = now - last;
    if (age < ONE_DAY) continue; // too recent — let it cool
    if (age > FOURTEEN_DAYS) continue; // too stale — already forgotten, focus elsewhere
    due.push({
      course_id: a.course_id,
      book_id: a.book_id,
      section_idx: a.section_idx,
      section_kind: a.section_kind,
      last_attempted_at: a.completed_at,
      last_score: a.score,
      last_total: a.total,
    });
  }
  // Sort newest-failed first so the widget shows what's freshest in their mind.
  due.sort((a, b) => new Date(b.last_attempted_at) - new Date(a.last_attempted_at));
  json(res, 200, { items: due.slice(0, 3) });
}

// ---------- Parent dashboard ----------
function isParentOnly(u) {
  return u && u.role === 'parent';
}

async function handleListLinkedStudents(req, res) {
  const u = await currentUser(req);
  if (!u || !isParentOnly(u)) return json(res, 403, { error: 'Parent accounts only.' });
  const students = await db.listLinkedStudents(u.id);
  json(res, 200, { students: students.map(s => ({ ...userPublic(s), link_status: s.link_status, linked_at: s.linked_at })) });
}

async function requireLinkedStudent(req, res, studentId) {
  const u = await currentUser(req);
  if (!u || !isParentOnly(u)) { json(res, 403, { error: 'Parent accounts only.' }); return null; }
  const ok = await db.isParentOfStudent(u.id, studentId);
  if (!ok) { json(res, 403, { error: 'Not authorised for this student.' }); return null; }
  return u;
}

async function handleStudentActivity(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const activity = await db.listActivity(studentId);
  json(res, 200, { activity });
}

async function handleStudentQuizAttempts(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const attempts = await db.listQuizAttempts(studentId);
  json(res, 200, { attempts });
}

async function handleStudentWeakSections(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const sections = await db.listWeakSections(studentId);
  json(res, 200, { sections });
}

async function handleStudentProgress(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const progress = await db.getAllProgress(studentId);
  json(res, 200, { progress });
}

async function handleStudentProfile(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const profile = await db.getStudentProfile(studentId);
  const user = await db.getUser(studentId);
  json(res, 200, { profile, user: userPublic(user) });
}

async function handleStudentStudyPlan(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const plan = await db.getStudyPlan(studentId);
  json(res, 200, { plan });
}

// ---------- Goal-based study plan ----------

async function handleGetStudyPlan(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const plan = await db.getStudyPlan(u.id);
  json(res, 200, { plan });
}

async function handleDeleteStudyPlan(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  await db.deleteStudyPlan(u.id);
  json(res, 200, { ok: true });
}

async function handleCreateStudyPlan(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.goalText !== 'string' || !body.targetDate || !Array.isArray(body.sections)) {
    return json(res, 400, { error: 'Bad payload.' });
  }
  const today = new Date().toISOString().slice(0, 10);
  const userMsg = `Student name: ${body.studentName || '(unknown)'}
Goal: ${body.goalText.slice(0, 500)}
Today's date: ${today}
Target date: ${body.targetDate}
Course: ${body.courseTitle || body.courseId || '(unknown)'}

All sections in this course (in order):
${body.sections.map(s => `- bookId=${s.bookId}, sectionIdx=${s.sectionIdx}, title="${s.sectionTitle}"`).join('\n')}

Sections the student has already passed:
${(body.passedSections || []).map(s => `- bookId=${s.bookId}, sectionIdx=${s.sectionIdx}`).join('\n') || '(none)'}

Output the JSON plan now, following the schema in the system prompt exactly.`;

  let planJson;
  try {
    const system = prompts.buildSystem('study_plan');
    const result = await callClaudeDirect({
      model: 'claude-sonnet-4-5-20250929',
      system,
      messages: [{ role: 'user', content: userMsg }],
      max_tokens: 4000,
      temperature: 0.3,
    });
    // Be lenient about extra wrapping.
    const m = result.text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('No JSON object found in AI response.');
    planJson = JSON.parse(m[0]);
    if (result.usage) {
      const cost = computeCost('claude-sonnet-4-5-20250929', result.usage);
      db.recordAiUsage({
        userId: u.id, userEmail: u.email,
        intent: 'study_plan', model: 'claude-sonnet-4-5-20250929',
        inputTokens: result.usage.input_tokens || 0,
        outputTokens: result.usage.output_tokens || 0,
        cacheReadTokens: result.usage.cache_read_input_tokens || 0,
        cacheCreationTokens: result.usage.cache_creation_input_tokens || 0,
        costUsd: cost,
      }).catch(err => console.error('recordAiUsage failed:', err.message));
    }
  } catch (e) {
    console.error('study plan generation failed:', e.message);
    return json(res, 502, { error: 'Could not generate a plan. Try again.' });
  }
  const saved = await db.upsertStudyPlan(u.id, {
    goalText: body.goalText,
    targetDate: body.targetDate,
    courseId: body.courseId || null,
    planJson,
  });
  await db.logActivity(u.id, 'study_plan_created', { courseId: body.courseId || null });
  json(res, 200, { plan: saved });
}

// ---------- Cached lessons ----------

// Server-side direct Claude call (used by the lesson endpoint and any
// other internal generators). Single-shot, non-streaming, returns the
// joined text content plus the model that produced it.
function callClaudeDirect(payload) {
  return new Promise((resolve, reject) => {
    if (!API_KEY) return reject(new Error('Server has no ANTHROPIC_API_KEY.'));
    const body = JSON.stringify(payload);
    const req = https.request({
      method: 'POST',
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`Anthropic ${res.statusCode}: ${data.slice(0, 300)}`));
        }
        try {
          const parsed = JSON.parse(data);
          const text = (parsed.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
          resolve({ text, usage: parsed.usage || null });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Conservative SVG sanitizer: strip script tags, on* event handlers,
// javascript: URLs, and external href / src references. Operates on text;
// never trusts the LLM. Returns the sanitized text. Designed to be safe
// rather than feature-complete — anything weird gets dropped.
function sanitizeLessonContent(content) {
  if (typeof content !== 'string') return '';
  let out = content;
  // Remove <script>...</script> blocks entirely.
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  // Strip on* event handlers like onclick="..." or onmouseover='...'.
  out = out.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  // Strip javascript:, data:text/html, and any href / src that starts with
  // those schemes inside <svg> blocks.
  out = out.replace(/(?:href|xlink:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|"data:text\/html[^"]*"|'data:text\/html[^']*')/gi, '');
  // Strip <foreignObject> — can host arbitrary HTML inside SVG.
  out = out.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  // Strip <iframe>, <object>, <embed>.
  out = out.replace(/<(iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<(iframe|object|embed)[^>]*\/?>/gi, '');
  return out;
}

async function generateLesson({ courseTitle, bookTitle, sectionTitle, sectionKind, sampleQuestions, studentName }) {
  const seedLines = (sampleQuestions || []).slice(0, 6)
    .map((q, i) => `${i + 1}. (${q.type || 'regular'}) ${q.q} → ${q.answer}`)
    .join('\n');
  const userMsg = `Course: ${courseTitle || 'Unknown course'}
Topic / chapter: ${bookTitle || 'Unknown chapter'}
Section title: ${sectionTitle || 'Unknown section'}
Section kind: ${sectionKind || 'section'}
${studentName ? `Student name: ${studentName}` : ''}

Sample seed questions for this section (use to calibrate difficulty + style of your examples):
${seedLines || '(no seed questions available — use your judgement based on the section title)'}

Write the lesson now, following the headings and rules in the system prompt exactly.`;

  const model = 'claude-sonnet-4-5-20250929';
  const system = prompts.buildSystem('lesson');
  const result = await callClaudeDirect({
    model,
    system,
    messages: [{ role: 'user', content: userMsg }],
    max_tokens: 1500,
    temperature: 0.5,
  });

  // Record usage for the operator's Token Cost dashboard.
  if (result.usage) {
    const usage = result.usage;
    const cost = computeCost(model, usage);
    db.recordAiUsage({
      userId: null,
      userEmail: '(lesson-prebuild)',
      intent: 'lesson',
      model,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      costUsd: cost,
    }).catch(err => console.error('recordAiUsage failed:', err.message));
  }

  return { content: result.text, model };
}

async function handleGetLesson(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.courseId !== 'string' || typeof body.bookId !== 'string'
    || typeof body.sectionIdx !== 'number') {
    return json(res, 400, { error: 'Bad payload.' });
  }
  const sectionKind = body.sectionKind || 'section';
  const forceRegenerate = body.regenerate === true;

  if (!forceRegenerate) {
    const cached = await db.getCachedLesson(body.courseId, body.bookId, body.sectionIdx, sectionKind);
    if (cached) {
      return json(res, 200, { content: cached.content, model: cached.model, cached: true });
    }
  }

  let result;
  try {
    result = await generateLesson({
      courseTitle: body.courseTitle,
      bookTitle: body.bookTitle,
      sectionTitle: body.sectionTitle,
      sectionKind,
      sampleQuestions: body.sampleQuestions,
      studentName: body.studentName,
    });
  } catch (e) {
    console.error('lesson generation failed:', e.message);
    return json(res, 502, { error: 'Lesson generation failed. Try again in a moment.' });
  }

  const safeContent = sanitizeLessonContent(result.content);
  await db.saveCachedLesson(body.courseId, body.bookId, body.sectionIdx, sectionKind, safeContent, result.model);
  json(res, 200, { content: safeContent, model: result.model, cached: false });
}

async function handleClearLesson(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.courseId !== 'string' || typeof body.bookId !== 'string'
    || typeof body.sectionIdx !== 'number') {
    return json(res, 400, { error: 'Bad payload.' });
  }
  await db.clearCachedLesson(body.courseId, body.bookId, body.sectionIdx, body.sectionKind || 'section');
  json(res, 200, { ok: true });
}

// ---------- Admin endpoints (only when users.is_admin is true) ----------

async function requireAdmin(req, res) {
  const u = await currentUser(req);
  if (!u) { json(res, 401, { error: 'Not signed in.' }); return null; }
  if (!u.is_admin) { json(res, 403, { error: 'Admin access required.' }); return null; }
  return u;
}

async function handleAdminStats(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const stats = await db.adminStats();
  json(res, 200, { stats });
}

async function handleAdminUsers(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const users = await db.adminListUsers({ limit: 500 });
  json(res, 200, { users });
}

async function handleAdminActivity(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const activity = await db.adminRecentActivity(100);
  json(res, 200, { activity });
}

async function handleAdminUserDetail(req, res, userId) {
  const u = await requireAdmin(req, res); if (!u) return;
  const detail = await db.adminUserDetail(userId);
  if (!detail) return json(res, 404, { error: 'User not found.' });
  json(res, 200, detail);
}

async function handleAdminUpdateUser(req, res, userId) {
  const u = await requireAdmin(req, res); if (!u) return;
  const body = await readJSON(req);
  if (!body) return json(res, 400, { error: 'Bad payload.' });
  // Don't let an admin demote themselves accidentally.
  if (userId === u.id && body.is_admin === false) {
    return json(res, 400, { error: "You can't revoke your own admin access from this UI. Use psql or the set-admin script." });
  }
  const updated = await db.adminUpdateUser(userId, body);
  if (!updated) return json(res, 404, { error: 'Nothing to update.' });
  json(res, 200, { user: updated });
}

async function handleAdminDeleteUser(req, res, userId) {
  const u = await requireAdmin(req, res); if (!u) return;
  if (userId === u.id) return json(res, 400, { error: "You can't delete your own account here." });
  await db.adminDeleteUser(userId);
  json(res, 200, { ok: true });
}

async function handleAdminQuizAnalytics(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const analytics = await db.adminQuizAnalytics();
  json(res, 200, analytics);
}

async function handleAdminCostChart(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const chart = await db.adminCostChart();
  json(res, 200, chart);
}

async function handleAdminSessions(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const sessions = await db.adminListSessions();
  json(res, 200, { sessions });
}

async function handleAdminRevokeSession(req, res, token) {
  const u = await requireAdmin(req, res); if (!u) return;
  await db.adminRevokeSession(token);
  json(res, 200, { ok: true });
}

async function handleAdminLinks(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const links = await db.adminAllLinks();
  json(res, 200, { links });
}

async function handleAdminLessons(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const courses = await db.adminLessonStats();
  json(res, 200, { courses });
}

// ---------- Token usage (own) ----------
async function handleGetMyTokenUsageSummary(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const summary = await db.summariseAiUsage({ userId: u.id });
  json(res, 200, summary);
}

async function handleGetMyTokenUsage(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const rows = await db.listAiUsage({ userId: u.id, limit: 500 });
  json(res, 200, { rows });
}

// ---------- Reminder cron + unsubscribe ----------

const CRON_SECRET = process.env.CRON_SECRET || '';
const REMINDER_BACKOFF_MS = 12 * 60 * 60 * 1000; // never re-send within 12 hours

function localPartsForTimezone(tz, when = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    }).formatToParts(when);
    const get = (t) => (parts.find(p => p.type === t) || {}).value;
    const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { hour: parseInt(get('hour'), 10), minute: parseInt(get('minute'), 10), weekday: dayMap[get('weekday')] };
  } catch { return null; }
}

function reminderDueOnWeekday(frequency, weekday) {
  switch (frequency) {
    case 'daily': return true;
    case 'weekdays': return weekday >= 1 && weekday <= 5;
    case 'mwf': return weekday === 1 || weekday === 3 || weekday === 5;
    case 'twr': return weekday === 2 || weekday === 4;
    case 'weekly': return weekday === 1; // Mondays
    case 'biweekly': return weekday === 1; // (true cadence enforced by 12h backoff + caller)
    default: return false;
  }
}

function isReminderDueNow(candidate, when = new Date()) {
  if (!candidate.timezone || !candidate.reminder_enabled) return false;
  // Under-13 students need explicit parent authorisation.
  if (candidate.consent_required && !candidate.parent_authorised_reminders) return false;
  const lp = localPartsForTimezone(candidate.timezone, when);
  if (!lp) return false;
  if (!reminderDueOnWeekday(candidate.reminder_frequency, lp.weekday)) return false;
  // reminder_time_local is "HH:MM" or "HH:MM:SS"
  const [hh, mm] = String(candidate.reminder_time_local || '17:00').split(':').map(n => parseInt(n, 10));
  const targetMinutes = hh * 60 + mm;
  const localMinutes = lp.hour * 60 + lp.minute;
  // Fire within +/-15 min of target so a 15-min cron has a single hit window.
  if (Math.abs(localMinutes - targetMinutes) > 15) return false;
  // De-dup: don't re-send within REMINDER_BACKOFF_MS.
  if (candidate.last_reminder_sent_at) {
    const last = new Date(candidate.last_reminder_sent_at).getTime();
    if (when.getTime() - last < REMINDER_BACKOFF_MS) return false;
  }
  return true;
}

function isDigestDueNow(candidate, when = new Date()) {
  if (!candidate.timezone || !candidate.weekly_digest_enabled) return false;
  const lp = localPartsForTimezone(candidate.timezone, when);
  if (!lp) return false;
  if (lp.weekday !== candidate.weekly_digest_day) return false;
  const [hh, mm] = String(candidate.weekly_digest_time_local || '09:00').split(':').map(n => parseInt(n, 10));
  if (Math.abs((lp.hour * 60 + lp.minute) - (hh * 60 + mm)) > 15) return false;
  // Don't re-send within ~6 days.
  if (candidate.last_digest_sent_at) {
    const last = new Date(candidate.last_digest_sent_at).getTime();
    if (when.getTime() - last < 6 * 24 * 60 * 60 * 1000) return false;
  }
  return true;
}

async function handleCronSendReminders(req, res) {
  if (!CRON_SECRET) return json(res, 503, { error: 'CRON_SECRET not configured.' });
  const provided = (req.headers['x-cron-secret'] || '').toString();
  if (provided !== CRON_SECRET) return json(res, 403, { error: 'Forbidden.' });

  const now = new Date();
  const sent = { reminders: 0, digests: 0, errors: [] };

  const reminderCandidates = await db.listReminderCandidates();
  for (const c of reminderCandidates) {
    if (!isReminderDueNow(c, now)) continue;
    try {
      await email.sendStudentReminder({ id: c.user_id, email: c.email }, { name: c.display_name, contentType: c.reminder_content });
      await db.markReminderSent(c.user_id);
      await db.logActivity(c.user_id, 'reminder_sent', { content: c.reminder_content });
      sent.reminders++;
    } catch (e) {
      sent.errors.push({ kind: 'reminder', user: c.user_id, msg: e.message });
    }
  }

  const digestCandidates = await db.listDigestCandidates();
  for (const c of digestCandidates) {
    if (!isDigestDueNow(c, now)) continue;
    try {
      const students = await db.listLinkedStudents(c.user_id);
      const summaries = [];
      for (const s of students) {
        const attempts = await db.listQuizAttempts(s.id, { limit: 200 });
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recent = attempts.filter(a => new Date(a.completed_at).getTime() >= sevenDaysAgo);
        const passed = recent.filter(a => a.passed).length;
        const failed = recent.length - passed;
        const weak = await db.listWeakSections(s.id, 2);
        summaries.push({
          name: s.email,
          quizzesPassed: passed,
          quizzesFailed: failed,
          weakTopics: weak.slice(0, 3).map(w => `${w.course_id}/${w.book_id}/section ${Number(w.section_idx) + 1}`),
        });
      }
      await email.sendParentDigest({ id: c.user_id, email: c.email }, summaries, { name: c.display_name });
      await db.markDigestSent(c.user_id);
      await db.logActivity(c.user_id, 'digest_sent', { studentCount: summaries.length });
      sent.digests++;
    } catch (e) {
      sent.errors.push({ kind: 'digest', user: c.user_id, msg: e.message });
    }
  }
  json(res, 200, sent);
}

async function handleUnsubscribe(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const userId = url.searchParams.get('u');
  const kind = url.searchParams.get('k');
  const token = url.searchParams.get('t');
  if (!userId || !kind || !token || !['reminder', 'digest'].includes(kind)) {
    res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>Unsubscribe link is invalid</h1>');
  }
  if (!email.verifyUnsubscribeToken(userId, kind, token)) {
    res.writeHead(403, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<h1>This unsubscribe link is no longer valid</h1>');
  }
  try {
    if (kind === 'reminder') {
      await db.upsertStudentProfile(userId, { reminderEnabled: false });
    } else {
      await db.upsertParentProfile(userId, { weeklyDigestEnabled: false });
    }
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<h1>Could not unsubscribe</h1><p>${e.message}</p>`);
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`<!DOCTYPE html><html><body style="font-family:Inter,system-ui,sans-serif;padding:40px 20px;color:#1e2238;text-align:center">
    <h1>You're unsubscribed</h1>
    <p style="color:#6b7084">We won't send you any more ${kind === 'reminder' ? 'study reminders' : 'weekly digests'}.</p>
    <p><a href="${process.env.SITE_URL || 'https://atriuminstitute.ai'}" style="color:#1e2238">Back to Atrium Institute</a></p>
  </body></html>`);
}

// ---------- Claude proxy ----------
async function proxyClaude(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  if (!API_KEY) return json(res, 503, { error: { message: 'Server has no API key configured.' } });
  // No auth required — open access. Cost is still bounded by per-IP + daily cap.
  const ip = ipOf(req);
  if (!rateLimitCheck(ip)) return json(res, 429, { error: { message: `Rate limit: ${RATE_LIMIT_PER_HOUR} requests/hour per IP.` } });
  if (!budgetCheck()) return json(res, 429, { error: { message: `Site has hit today's request cap. Resets at UTC midnight.` } });

  let bodyStr;
  try { bodyStr = await readBody(req); } catch (_e) { res.writeHead(400); return res.end('bad body'); }

  let body;
  try { body = JSON.parse(bodyStr); }
  catch (_e) { return json(res, 400, { error: { message: 'Invalid JSON body.' } }); }

  // Capture intent + model BEFORE we strip them, so we can record usage.
  const callIntent = (body && typeof body.intent === 'string') ? body.intent : null;
  const callModel = (body && typeof body.model === 'string') ? body.model : 'unknown';

  if (body && body.intent) {
    if (!prompts.KNOWN_INTENTS.includes(body.intent)) {
      return json(res, 400, { error: { message: `Unknown intent: ${body.intent}` } });
    }
    body.system = prompts.buildSystem(body.intent, body.system_extra);
    delete body.intent;
    delete body.system_extra;
    bodyStr = JSON.stringify(body);
  }

  // Look up the calling user so we can attribute token spend.
  const me = await currentUser(req);
  const callerUserId = me ? me.id : null;
  const callerEmail = me ? me.email : null;

  const opts = {
    method: 'POST', hostname: 'api.anthropic.com', path: '/v1/messages',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(bodyStr)
    }
  };

  const upstream = https.request(opts, up => {
    res.writeHead(up.statusCode, up.headers);
    // We replace the simple `up.pipe(res)` with a chunk-by-chunk forwarder
    // so we can also parse the response for the `usage` field that Anthropic
    // returns (in the JSON body for non-streaming, and in message_start /
    // message_delta SSE events for streaming).
    const isStreaming = String(up.headers['content-type'] || '').includes('text/event-stream');
    let sseBuf = '';
    let bodyBuf = '';
    const usage = { input_tokens: 0, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

    function ingestSseBlock(block) {
      const m = block.match(/^data: (.+)$/m);
      if (!m) return;
      let evt; try { evt = JSON.parse(m[1]); } catch { return; }
      if (evt.type === 'message_start' && evt.message && evt.message.usage) {
        const u = evt.message.usage;
        usage.input_tokens = u.input_tokens || 0;
        usage.cache_read_input_tokens = u.cache_read_input_tokens || 0;
        usage.cache_creation_input_tokens = u.cache_creation_input_tokens || 0;
        usage.output_tokens = u.output_tokens || 0;
      } else if (evt.type === 'message_delta' && evt.usage) {
        if (typeof evt.usage.output_tokens === 'number') usage.output_tokens = evt.usage.output_tokens;
      }
    }

    up.on('data', chunk => {
      res.write(chunk);
      if (up.statusCode >= 400) return;
      if (isStreaming) {
        sseBuf += chunk.toString('utf8');
        let nl;
        while ((nl = sseBuf.indexOf('\n\n')) !== -1) {
          ingestSseBlock(sseBuf.slice(0, nl));
          sseBuf = sseBuf.slice(nl + 2);
        }
      } else {
        bodyBuf += chunk.toString('utf8');
      }
    });

    up.on('end', () => {
      res.end();
      if (up.statusCode >= 400) return;
      if (!isStreaming && bodyBuf) {
        try {
          const parsed = JSON.parse(bodyBuf);
          if (parsed.usage) Object.assign(usage, parsed.usage);
        } catch { /* tolerate */ }
      }
      const totalIn = (usage.input_tokens || 0) + (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
      if (totalIn > 0 || usage.output_tokens > 0) {
        const cost = computeCost(callModel, usage);
        db.recordAiUsage({
          userId: callerUserId,
          userEmail: callerEmail,
          intent: callIntent,
          model: callModel,
          inputTokens: usage.input_tokens || 0,
          outputTokens: usage.output_tokens || 0,
          cacheReadTokens: usage.cache_read_input_tokens || 0,
          cacheCreationTokens: usage.cache_creation_input_tokens || 0,
          costUsd: cost,
        }).catch(err => console.error('recordAiUsage failed:', err.message));
      }
    });
  });

  upstream.on('error', err => {
    try { json(res, 502, { error: { message: 'Upstream error: ' + err.message } }); }
    catch { /* response may already be partly written */ }
  });
  upstream.write(bodyStr); upstream.end();
}

// ---------- Static ----------
// Paths that are handled by the SPA's client-side router. Visiting one
// of these in a fresh tab should serve index.html so the client can
// inspect window.location and route into the right view.
const SPA_ROUTES = new Set(['/admin']);

function serveStatic(req, res) {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';
  // SPA route fallthrough: serve index.html for known client-side routes.
  if (SPA_ROUTES.has(urlPath)) urlPath = '/index.html';
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('403'); }
  const base = path.basename(filePath);
  if (base === '.apikey' || base === 'server.js' || base === 'db.js' || base === 'email.js'
      || base === 'data.json' || base === 'package.json' || base === 'package-lock.json'
      || base.startsWith('.')) {
    res.writeHead(404); return res.end('404');
  }
  if (filePath.includes(path.sep + 'tools' + path.sep)) { res.writeHead(404); return res.end('404'); }
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('404'); }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------- Router ----------
const server = http.createServer(async (req, res) => {
  try {
    const url = req.url.split('?')[0];
    // Auth
    if (url === '/api/auth/signup' && req.method === 'POST') return handleSignupOrLogin(req, res);
    if (url === '/api/auth/verify' && req.method === 'POST') return handleVerify(req, res);
    if (url === '/api/auth/logout' && req.method === 'POST') return handleLogout(req, res);
    if (url === '/api/auth/me' && req.method === 'GET') return handleMe(req, res);
    // Profile, links
    if (url === '/api/me/profile' && req.method === 'POST') return handleUpdateProfile(req, res);
    if (url === '/api/me/rich-profile' && req.method === 'GET') return handleGetRichProfile(req, res);
    if (url === '/api/me/rich-profile' && req.method === 'POST') return handleSaveRichProfile(req, res);
    if (url === '/api/me/links' && req.method === 'POST') return handleCreateLink(req, res);
    if (url.startsWith('/api/me/links/') && req.method === 'DELETE') {
      return handleDeleteLink(req, res, url.slice('/api/me/links/'.length));
    }
    // Public unsubscribe (no auth — signed token).
    if (url === '/unsubscribe' && req.method === 'GET') return handleUnsubscribe(req, res);
    // Cron-pingable reminder + digest dispatcher.
    if (url === '/api/cron/send-reminders' && req.method === 'POST') return handleCronSendReminders(req, res);
    // Progress
    if (url === '/api/progress' && req.method === 'GET') return handleGetAllProgress(req, res);
    if (url === '/api/progress' && req.method === 'POST') return handleSaveProgress(req, res);
    // Activity + quiz attempts (own)
    if (url === '/api/me/quiz-attempts' && req.method === 'POST') return handleLogQuizAttempt(req, res);
    if (url === '/api/me/quiz-attempts' && req.method === 'GET') return handleGetMyQuizAttempts(req, res);
    if (url === '/api/me/activity' && req.method === 'POST') return handleLogClientActivity(req, res);
    if (url === '/api/me/activity' && req.method === 'GET') return handleGetMyActivity(req, res);
    if (url === '/api/me/weak-sections' && req.method === 'GET') return handleGetMyWeakSections(req, res);
    if (url === '/api/me/review-queue' && req.method === 'GET') return handleGetReviewQueue(req, res);
    if (url === '/api/me/study-plan' && req.method === 'GET') return handleGetStudyPlan(req, res);
    if (url === '/api/me/study-plan' && req.method === 'POST') return handleCreateStudyPlan(req, res);
    if (url === '/api/me/study-plan' && req.method === 'DELETE') return handleDeleteStudyPlan(req, res);
    // Admin (only for users where is_admin = true).
    if (url === '/api/admin/stats' && req.method === 'GET') return handleAdminStats(req, res);
    if (url === '/api/admin/users' && req.method === 'GET') return handleAdminUsers(req, res);
    if (url === '/api/admin/activity' && req.method === 'GET') return handleAdminActivity(req, res);
    if (url === '/api/admin/quiz-analytics' && req.method === 'GET') return handleAdminQuizAnalytics(req, res);
    if (url === '/api/admin/cost-chart' && req.method === 'GET') return handleAdminCostChart(req, res);
    if (url === '/api/admin/sessions' && req.method === 'GET') return handleAdminSessions(req, res);
    if (url === '/api/admin/links' && req.method === 'GET') return handleAdminLinks(req, res);
    if (url === '/api/admin/lessons' && req.method === 'GET') return handleAdminLessons(req, res);
    {
      const mUserDetail = url.match(/^\/api\/admin\/users\/([0-9a-f-]+)$/);
      if (mUserDetail) {
        if (req.method === 'GET') return handleAdminUserDetail(req, res, mUserDetail[1]);
        if (req.method === 'PATCH' || req.method === 'POST') return handleAdminUpdateUser(req, res, mUserDetail[1]);
        if (req.method === 'DELETE') return handleAdminDeleteUser(req, res, mUserDetail[1]);
      }
      const mSession = url.match(/^\/api\/admin\/sessions\/([0-9a-f]+)$/);
      if (mSession && req.method === 'DELETE') return handleAdminRevokeSession(req, res, mSession[1]);
    }
    if (url === '/api/me/token-usage' && req.method === 'GET') return handleGetMyTokenUsage(req, res);
    if (url === '/api/me/token-usage/summary' && req.method === 'GET') return handleGetMyTokenUsageSummary(req, res);
    // Cached lessons: POST returns the cached lesson or generates+caches it; DELETE busts the cache.
    if (url === '/api/lessons' && req.method === 'POST') return handleGetLesson(req, res);
    if (url === '/api/lessons' && req.method === 'DELETE') return handleClearLesson(req, res);
    // Parent dashboard
    if (url === '/api/parent/students' && req.method === 'GET') return handleListLinkedStudents(req, res);
    {
      const m = url.match(/^\/api\/parent\/students\/([0-9a-f-]+)\/(activity|quiz-attempts|weak-sections|progress|profile|study-plan|authorise-reminders)$/);
      if (m) {
        const [, studentId, kind] = m;
        if (req.method === 'GET' && kind === 'activity') return handleStudentActivity(req, res, studentId);
        if (req.method === 'GET' && kind === 'quiz-attempts') return handleStudentQuizAttempts(req, res, studentId);
        if (req.method === 'GET' && kind === 'weak-sections') return handleStudentWeakSections(req, res, studentId);
        if (req.method === 'GET' && kind === 'progress') return handleStudentProgress(req, res, studentId);
        if (req.method === 'GET' && kind === 'profile') return handleStudentProfile(req, res, studentId);
        if (req.method === 'GET' && kind === 'study-plan') return handleStudentStudyPlan(req, res, studentId);
        if (req.method === 'POST' && kind === 'authorise-reminders') return handleParentAuthoriseReminders(req, res, studentId);
      }
    }
    // Claude proxy
    if (url.startsWith('/api/claude')) return proxyClaude(req, res);
    // Static
    serveStatic(req, res);
  } catch (e) {
    console.error('Server error:', e);
    json(res, 500, { error: 'Internal error' });
  }
});

// Periodic cleanup of expired codes/sessions
setInterval(() => {
  db.cleanup().catch(err => console.error('cleanup failed:', err.message));
}, 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`📚 Atrium Institute running at http://localhost:${PORT}`);
  console.log(`🗄  DB backend: ${db.backend}`);
  console.log(API_KEY ? '✨ Max (AI tutor): enabled' : '⚠️  Max disabled (no ANTHROPIC_API_KEY)');
  console.log(process.env.RESEND_API_KEY ? '📧 Email: Resend' : '📧 Email: console (set RESEND_API_KEY for real email)');
  console.log(`⏱  Rate limit: ${RATE_LIMIT_PER_HOUR} req/hr/IP   💰 Daily cap: ${DAILY_REQUEST_CAP} req/day`);
});
