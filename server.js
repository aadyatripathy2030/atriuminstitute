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
const { loadCourses } = require('./curriculum-loader');
const stripeLib = require('./stripe-lib');

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
    grade_level: u.grade_level == null ? null : Number(u.grade_level),
    country: u.country || u.state || null,
    consent_required: !!u.consent_required,
    consent_granted_at: u.consent_granted_at || null,
    is_admin: !!u.is_admin,
    subscription_status: u.subscription_status || null,
    subscription_plan: u.subscription_plan || null,
    current_period_end: u.current_period_end || null,
    // When the paywall kill switch is on (isConfigured() returns false),
    // every signed-in user has full access — is_pro is true regardless of
    // subscription_status. Once the paywall is re-enabled this collapses
    // back to "active or trialing means pro".
    is_pro: !stripeLib.isConfigured() || stripeLib.isActiveStatus(u.subscription_status),
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

// Public site config. Anonymous-readable. Currently just exposes whether
// the Stripe paywall is live so the landing page can hide the pricing
// card and the upgrade modal when the kill switch is on.
async function handleGetConfig(req, res) {
  json(res, 200, { paywall_active: stripeLib.isConfigured() });
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
  //
  // gradeLevel is the new typed grade column on users (1..12). The legacy
  // student_profiles.grade_level text field stays in the row too via
  // upsertStudentProfile below, for backward compat, but the canonical
  // value the curriculum browser and home filter read from is
  // users.grade_level.
  const userUpdates = {};
  if (typeof body.country === 'string' && body.country.trim()) userUpdates.country = body.country.trim();
  if (typeof body.gradeLevel === 'number' && body.gradeLevel >= 1 && body.gradeLevel <= 12) {
    userUpdates.gradeLevel = Math.floor(body.gradeLevel);
  } else if (typeof body.gradeLevel === 'string' && body.gradeLevel) {
    const n = parseInt(body.gradeLevel, 10);
    if (Number.isInteger(n) && n >= 1 && n <= 12) userUpdates.gradeLevel = n;
  }
  if (Object.keys(userUpdates).length) {
    await db.updateUserProfile(u.id, userUpdates);
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
    user: userPublic(fresh),
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

async function generateLesson({ courseTitle, bookTitle, sectionTitle, sectionKind, sampleQuestions, studentName, curriculumLesson }) {
  const seedLines = (sampleQuestions || []).slice(0, 6)
    .map((q, i) => `${i + 1}. (${q.type || 'regular'}) ${q.q} → ${q.answer}`)
    .join('\n');
  // Curriculum-driven sections include a learning_objective, key
  // vocabulary, common misconceptions, and a real-world hook from the
  // master scope and sequence. Inject that so the AI lesson is
  // calibrated to the curriculum rather than guessing from the title.
  let curriculumBlock = '';
  if (curriculumLesson) {
    const parts = [];
    if (curriculumLesson.learning_objective) parts.push(`Learning objective: ${curriculumLesson.learning_objective}`);
    if (curriculumLesson.key_concepts) parts.push(`Key concepts: ${curriculumLesson.key_concepts}`);
    if (curriculumLesson.prerequisites) parts.push(`Prerequisites: ${curriculumLesson.prerequisites}`);
    if (curriculumLesson.key_vocabulary) parts.push(`Key vocabulary: ${curriculumLesson.key_vocabulary}`);
    if (curriculumLesson.common_misconceptions) parts.push(`Common misconceptions to address: ${curriculumLesson.common_misconceptions}`);
    if (curriculumLesson.real_world_hook) parts.push(`Real-world hook (use in The simple idea): ${curriculumLesson.real_world_hook}`);
    if (curriculumLesson.ccss_code) parts.push(`Standards: ${curriculumLesson.ccss_code}`);
    if (parts.length) {
      curriculumBlock = '\n\nCurriculum context for this lesson (use it):\n' + parts.join('\n') + '\n';
    }
  }
  const userMsg = `Course: ${courseTitle || 'Unknown course'}
Topic / chapter: ${bookTitle || 'Unknown chapter'}
Section title: ${sectionTitle || 'Unknown section'}
Section kind: ${sectionKind || 'section'}
${studentName ? `Student name: ${studentName}` : ''}${curriculumBlock}
Sample seed questions for this section (use to calibrate difficulty + style of your examples):
${seedLines || '(no seed questions available — use your judgement based on the section title)'}

Write the lesson now, following the headings and rules in the system prompt exactly.`;

  const model = 'claude-sonnet-4-5-20250929';
  const system = prompts.buildSystem('lesson');
  const result = await callClaudeDirect({
    model,
    system,
    messages: [{ role: 'user', content: userMsg }],
    // Bumped from 1500 -> 3000 so the slowest-student-friendly version
    // of the lesson (600-900 words + two worked examples + watch-out
    // callouts + a visual) actually fits in the response. Sonnet
    // pricing makes the extra tokens negligible per lesson.
    max_tokens: 3000,
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
      curriculumLesson: body.curriculumLesson || null,
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

// ---------- Curriculum quiz generation (cache + on-demand AI) ----------
async function generateCurriculumQuiz(meta) {
  // meta: { courseTitle, unitTitle, lessonTitle, learningObjective, keyConcepts, keyVocabulary, ccssCode }
  const userMsg = `Course: ${meta.courseTitle || 'Unknown course'}
Unit / chapter: ${meta.unitTitle || 'Unknown unit'}
Section title: ${meta.lessonTitle || 'Unknown lesson'}
Existing questions in this section:
(none — generate a fresh quiz)

How many new questions to add: 5
Learning objective: ${meta.learningObjective || '(not provided)'}
Key concepts: ${meta.keyConcepts || '(not provided)'}
Key vocabulary: ${meta.keyVocabulary || '(not provided)'}
${meta.ccssCode ? 'Standards: ' + meta.ccssCode : ''}

Generate exactly 5 quiz questions covering this lesson. Output ONLY a JSON array.`;
  const model = 'claude-sonnet-4-5-20250929';
  const system = prompts.buildSystem('gen-questions');
  // Retry transient Anthropic errors (429/529/5xx). Mirrors the
  // prebuild worker's retry policy.
  let result;
  let lastErr = null;
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      result = await callClaudeDirect({
        model, system,
        messages: [{ role: 'user', content: userMsg }],
        max_tokens: 1500,
        temperature: 0.5,
      });
      break;
    } catch (e) {
      lastErr = e;
      const m = (e && e.message) || '';
      const codeMatch = m.match(/^Anthropic (\d+)/);
      const code = codeMatch ? Number(codeMatch[1]) : 0;
      const transient = code === 429 || code === 529 || (code >= 500 && code <= 599);
      if (!transient || attempt === 4) throw e;
      const backoff = [2000, 5000, 12000][attempt - 1] || 12000;
      await new Promise(r => setTimeout(r, backoff + Math.floor(Math.random() * 1000)));
    }
  }
  if (!result) throw lastErr || new Error('Quiz generation failed.');
  // Record usage.
  if (result.usage) {
    const usage = result.usage;
    db.recordAiUsage({
      userId: null, userEmail: '(curriculum-quiz-gen)', intent: 'gen-questions', model,
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheCreationTokens: usage.cache_creation_input_tokens || 0,
      costUsd: computeCost(model, usage),
    }).catch(err => console.error('recordAiUsage failed:', err.message));
  }
  // Parse Claude's JSON output. Tolerate stray code fences + leading
  // prose by extracting the first [...] block.
  let text = (result.text || '').trim();
  text = text.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '');
  // If Claude wrapped the array in prose, isolate from first '[' to last ']'.
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    text = text.slice(firstBracket, lastBracket + 1);
  }
  let questions;
  try { questions = JSON.parse(text); }
  catch (e) {
    console.error('quiz parse failed. raw response:', (result.text || '').slice(0, 500));
    throw new Error('Could not parse AI quiz output: ' + e.message);
  }
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('AI returned no questions.');
  }
  // Normalise shape.
  questions = questions.map(q => ({
    type: q.type === 'word' ? 'word' : 'regular',
    q: String(q.q || ''),
    answer: String(q.answer || ''),
    solution: String(q.solution || ''),
  })).filter(q => q.q && q.answer);
  if (questions.length === 0) throw new Error('AI returned malformed questions.');
  return { questions, model };
}

async function handleGetCurriculumQuiz(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in to start a quiz.' });
  const body = await readJSON(req);
  if (!body || typeof body.courseId !== 'string' || typeof body.lessonNumber !== 'string') {
    return json(res, 400, { error: 'courseId and lessonNumber required.' });
  }
  const courseId = body.courseId.trim();
  const lessonNumber = body.lessonNumber.trim();
  const force = body.regenerate === true;
  if (!force) {
    const cached = await db.getCurriculumQuiz(courseId, lessonNumber);
    if (cached) return json(res, 200, { questions: cached.questions, model: cached.model, cached: true });
  }
  // Need meta to generate. Pull the lesson row.
  const course = await db.getCurriculumCourseFull(courseId);
  if (!course) return json(res, 404, { error: 'Course not found.' });
  let unit = null, lesson = null;
  for (const u2 of (course.units || [])) {
    const l = (u2.lessons || []).find(x => x.lesson_number === lessonNumber);
    if (l) { unit = u2; lesson = l; break; }
  }
  if (!lesson) return json(res, 404, { error: 'Lesson not found.' });
  let result;
  try {
    result = await generateCurriculumQuiz({
      courseTitle: course.title,
      unitTitle: unit.unit_title,
      lessonTitle: lesson.lesson_title,
      learningObjective: lesson.learning_objective,
      keyConcepts: lesson.key_concepts,
      keyVocabulary: lesson.key_vocabulary,
      ccssCode: lesson.ccss_code,
    });
  } catch (e) {
    console.error('curriculum quiz gen failed:', e.message);
    return json(res, 502, { error: 'Quiz generation failed. Try again in a moment.' });
  }
  await db.saveCurriculumQuiz(courseId, lessonNumber, result.questions, result.model);
  json(res, 200, { questions: result.questions, model: result.model, cached: false });
}

// ---------- User favorites ----------
async function handleListFavorites(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const favorites = await db.listFavorites(u.id);
  json(res, 200, { favorites });
}

async function handleAddFavorite(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.courseId !== 'string' || typeof body.bookId !== 'string'
      || !body.courseId.trim() || !body.bookId.trim()) {
    return json(res, 400, { error: 'courseId and bookId required.' });
  }
  await db.addFavorite(u.id, body.courseId.trim(), body.bookId.trim());
  json(res, 200, { ok: true });
}

async function handleRemoveFavorite(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body || typeof body.courseId !== 'string' || typeof body.bookId !== 'string') {
    return json(res, 400, { error: 'courseId and bookId required.' });
  }
  await db.removeFavorite(u.id, body.courseId.trim(), body.bookId.trim());
  json(res, 200, { ok: true });
}

// ---------- Curriculum reference (public, read-only) ----------
async function handleGetCurriculumSubjects(req, res) {
  const subjects = await db.listCurriculumSubjects();
  json(res, 200, { subjects });
}

async function handleGetCurriculumCourses(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const subject = url.searchParams.get('subject') || null;
  const gradeRaw = url.searchParams.get('grade');
  const grade = gradeRaw == null || gradeRaw === '' ? null : Number(gradeRaw);
  if (gradeRaw != null && (!Number.isInteger(grade) || grade < 1 || grade > 12)) {
    return json(res, 400, { error: 'Bad grade param (1-12).' });
  }
  const withUnits = url.searchParams.get('with') === 'units';
  const courses = await db.listCurriculumCourses({ subject, grade, withUnits });
  json(res, 200, { courses });
}

async function handleGetCurriculumCourseFull(req, res, courseId) {
  if (!courseId) return json(res, 400, { error: 'Missing course id.' });
  const course = await db.getCurriculumCourseFull(courseId);
  if (!course) return json(res, 404, { error: 'Course not found.' });
  json(res, 200, { course });
}

// ---------- Server-side bulk prebuild for cached lessons ----------
//
// Runs entirely in-process on the Render web service so the operator
// doesn't have to spin it up from a laptop. State lives in memory; one
// job at a time. Restarting the service resets state (acceptable —
// re-running just picks up where it left off because each section is
// idempotent in the cache).

const prebuildState = {
  running: false,
  startedAt: null,
  finishedAt: null,
  total: 0,
  done: 0,
  skipped: 0,
  generated: 0,
  failed: 0,
  errors: [],
  lastSection: null,
  startedByEmail: null,
  cancelled: false,
};

function buildJobList(courses, opts) {
  const jobs = [];
  // onlySectionIdx is parsed once; treat null as "no filter".
  const onlySectionIdx = (opts.onlySection === null || opts.onlySection === undefined || opts.onlySection === '')
    ? null
    : Number(opts.onlySection);
  const onlySectionKind = opts.onlySectionKind || null; // 'section' or 'cumulative' or null
  for (const [courseId, course] of Object.entries(courses || {})) {
    if (opts.onlyCourse && courseId !== opts.onlyCourse) continue;
    for (const book of (course.books || [])) {
      if (opts.onlyBook && book.id !== opts.onlyBook) continue;
      (book.sections || []).forEach((section, sectionIdx) => {
        if (onlySectionIdx !== null && sectionIdx !== onlySectionIdx) return;
        if (onlySectionKind && onlySectionKind !== 'section') return;
        jobs.push({
          courseId, bookId: book.id, sectionIdx, sectionKind: 'section',
          courseTitle: course.title, bookTitle: book.title,
          sectionTitle: section.title || `Section ${sectionIdx + 1}`,
          sampleQuestions: (section.questions || []).slice(0, 6),
        });
      });
      if (book.cumulativeTest) {
        // Cumulative tests use sectionIdx=0 internally, but in the LOV
        // we represent them as a separate "cumulative" option so the
        // operator can isolate one explicitly.
        const skipCumulative =
          (onlySectionIdx !== null && onlySectionKind !== 'cumulative') ||
          (onlySectionKind === 'section');
        if (!skipCumulative) {
          jobs.push({
            courseId, bookId: book.id, sectionIdx: 0, sectionKind: 'cumulative',
            courseTitle: course.title, bookTitle: book.title,
            sectionTitle: `${book.title} — Cumulative test`,
            sampleQuestions: (book.cumulativeTest.questions || []).slice(0, 6),
          });
        }
      }
    }
  }
  return jobs;
}

// Anthropic occasionally returns transient errors (429 rate-limit, 529
// overloaded, 5xx). For a long bulk job this is normal — we don't want
// to lose dozens of sections to a one-second overload spike. Wrap each
// generation in a small retry-with-backoff. Permanent errors (4xx
// other than 429) fail fast without retry.
function _isTransientAnthropicError(err) {
  const m = err && err.message ? err.message : '';
  if (!m.startsWith('Anthropic ')) return false;
  // Codes 429 (rate limit), 500/502/503/504 (server), 529 (overloaded).
  const codeMatch = m.match(/^Anthropic (\d+)/);
  if (!codeMatch) return false;
  const code = Number(codeMatch[1]);
  return code === 429 || code === 529 || (code >= 500 && code <= 599);
}

async function _generateWithRetry(job, maxAttempts) {
  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (prebuildState.cancelled) throw new Error('cancelled');
    try {
      return await generateLesson({
        courseTitle: job.courseTitle,
        bookTitle: job.bookTitle,
        sectionTitle: job.sectionTitle,
        sectionKind: job.sectionKind,
        sampleQuestions: job.sampleQuestions,
      });
    } catch (e) {
      lastErr = e;
      if (!_isTransientAnthropicError(e) || attempt === maxAttempts) throw e;
      // Exponential backoff with jitter: 2s, 5s, 12s.
      const baseMs = [2000, 5000, 12000][attempt - 1] || 12000;
      const jitter = Math.floor(Math.random() * 1000);
      await new Promise(r => setTimeout(r, baseMs + jitter));
    }
  }
  throw lastErr;
}

async function runPrebuildJob(jobs, opts) {
  const concurrency = Math.min(Math.max(parseInt(opts.concurrency, 10) || 3, 1), 6);
  let i = 0;
  async function worker() {
    while (true) {
      if (prebuildState.cancelled) return;
      const idx = i++;
      if (idx >= jobs.length) return;
      const job = jobs[idx];
      prebuildState.lastSection = `${job.courseId} / ${job.bookId} / s${job.sectionIdx} (${job.sectionKind})`;
      try {
        if (!opts.force) {
          const cached = await db.getCachedLesson(job.courseId, job.bookId, job.sectionIdx, job.sectionKind);
          if (cached) { prebuildState.skipped++; prebuildState.done++; continue; }
        }
        if (prebuildState.cancelled) return;
        const result = await _generateWithRetry(job, 4);
        // If a cancel landed while the Anthropic call was in flight, throw
        // away the result instead of paying the DB write and ticking the
        // generated counter. The API spend is already incurred but at least
        // the visible progress bar stops moving.
        if (prebuildState.cancelled) return;
        const safe = sanitizeLessonContent(result.content);
        await db.saveCachedLesson(job.courseId, job.bookId, job.sectionIdx, job.sectionKind, safe, result.model);
        prebuildState.generated++;
      } catch (e) {
        prebuildState.failed++;
        if (prebuildState.errors.length < 20) {
          prebuildState.errors.push({ section: prebuildState.lastSection, message: e.message });
        }
      } finally {
        prebuildState.done++;
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}

async function handleAdminPrebuildStart(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  if (prebuildState.running) {
    return json(res, 409, { error: 'A prebuild is already running. Wait for it to finish or POST /cancel first.' });
  }
  const body = await readJSON(req) || {};
  let courses;
  try { courses = loadCourses(); }
  catch (e) { return json(res, 500, { error: 'Could not load curriculum: ' + e.message }); }
  const opts = {
    onlyCourse: typeof body.onlyCourse === 'string' && body.onlyCourse ? body.onlyCourse : null,
    onlyBook: typeof body.onlyBook === 'string' && body.onlyBook ? body.onlyBook : null,
    onlySection: (body.onlySection === null || body.onlySection === undefined || body.onlySection === '')
      ? null
      : body.onlySection,
    onlySectionKind: typeof body.onlySectionKind === 'string' && body.onlySectionKind ? body.onlySectionKind : null,
    force: body.force === true,
    concurrency: body.concurrency,
  };
  const jobs = buildJobList(courses, opts);
  if (jobs.length === 0) {
    return json(res, 400, { error: 'No sections matched. Did you pass a valid onlyCourse?' });
  }
  // Reset state and kick off the worker pool.
  Object.assign(prebuildState, {
    running: true, startedAt: new Date().toISOString(), finishedAt: null,
    total: jobs.length, done: 0, skipped: 0, generated: 0, failed: 0,
    errors: [], lastSection: null, startedByEmail: u.email, cancelled: false,
  });
  // Don't await — fire and let the worker run in the background.
  runPrebuildJob(jobs, opts).catch(err => {
    prebuildState.errors.push({ section: '(pool)', message: err.message });
  }).finally(() => {
    prebuildState.running = false;
    prebuildState.finishedAt = new Date().toISOString();
  });
  json(res, 202, { ok: true, total: jobs.length, startedAt: prebuildState.startedAt });
}

async function handleAdminPrebuildStatus(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  json(res, 200, { state: prebuildState });
}

async function handleAdminPrebuildCancel(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  prebuildState.cancelled = true;
  json(res, 200, { ok: true });
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

// ---------- Stripe routes ----------
async function handleStripeCheckout(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in first to subscribe.' });
  if (!stripeLib.isConfigured()) return json(res, 503, { error: 'Stripe is not configured on the server.' });
  const body = await readJSON(req);
  const plan = (body && body.plan === 'yearly') ? 'yearly' : 'monthly';
  try {
    const url = await stripeLib.createCheckoutSession(u, db, plan);
    json(res, 200, { url });
  } catch (e) {
    console.error('Stripe checkout error:', e.message);
    json(res, 502, { error: e.message || 'Could not create checkout session.' });
  }
}

async function handleStripePortal(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in first.' });
  if (!stripeLib.isConfigured()) return json(res, 503, { error: 'Stripe is not configured on the server.' });
  if (!u.stripe_customer_id) return json(res, 400, { error: 'No subscription on file. Start one first.' });
  try {
    const url = await stripeLib.createPortalSession(u, db);
    json(res, 200, { url });
  } catch (e) {
    console.error('Stripe portal error:', e.message);
    json(res, 502, { error: e.message || 'Could not open billing portal.' });
  }
}

// Webhook handler — needs the RAW body for signature verification, so we
// read it ourselves and bypass readJSON.
async function handleStripeWebhook(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  let raw;
  try { raw = await readRawBuffer(req); } catch (_e) { res.writeHead(400); return res.end('bad body'); }
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripeLib.constructWebhookEvent(raw, sig);
  } catch (e) {
    console.warn('Stripe webhook signature failed:', e.message);
    res.writeHead(400); return res.end(`Webhook Error: ${e.message}`);
  }
  try {
    await processStripeEvent(event);
  } catch (e) {
    console.error('Stripe event handler failed:', event.type, e.message);
    res.writeHead(500); return res.end('handler failed');
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end('{"received":true}');
}

async function processStripeEvent(event) {
  const obj = event.data && event.data.object;
  switch (event.type) {
    case 'checkout.session.completed': {
      // Subscription was set up. The customer.subscription.created event
      // usually fires immediately after with the full subscription, so we
      // only persist the customer<->user link here.
      const customerId = obj.customer;
      const userId = (obj.metadata && obj.metadata.atrium_user_id) || obj.client_reference_id;
      if (userId && customerId) await db.setStripeCustomerId(userId, customerId);
      return;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const customerId = obj.customer;
      const userByMeta = obj.metadata && obj.metadata.atrium_user_id;
      let user = null;
      if (userByMeta) user = await db.getUser(userByMeta);
      if (!user) user = await db.findUserByStripeCustomerId(customerId);
      if (!user) {
        console.warn('Stripe subscription event for unknown customer:', customerId);
        return;
      }
      await db.updateSubscription(user.id, stripeLib.subscriptionRow(obj));
      return;
    }
    case 'customer.subscription.deleted': {
      const customerId = obj.customer;
      const user = await db.findUserByStripeCustomerId(customerId);
      if (!user) return;
      await db.updateSubscription(user.id, {
        stripe_subscription_id: obj.id,
        subscription_status: 'canceled',
        current_period_end: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null,
      });
      return;
    }
    case 'invoice.payment_failed': {
      const customerId = obj.customer;
      const user = await db.findUserByStripeCustomerId(customerId);
      if (user) await db.updateSubscription(user.id, { subscription_status: 'past_due' });
      return;
    }
    default:
      // Ignore everything we didn't ask for.
      return;
  }
}

function readRawBuffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', c => {
      total += c.length;
      if (total > 1_000_000) { reject(new Error('too big')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// ---------- Claude proxy ----------
async function proxyClaude(req, res) {
  if (req.method !== 'POST') { res.writeHead(405); return res.end('method'); }
  if (!API_KEY) return json(res, 503, { error: { message: 'Server has no API key configured.' } });

  // Premium gate: Max requires an active subscription (or active trial).
  // If Stripe isn't configured at all, fall back to open access so local
  // development still works.
  if (stripeLib.isConfigured()) {
    const u = await currentUser(req);
    if (!u) return json(res, 401, { error: { message: 'Sign in to use Max.' } });
    if (!stripeLib.isActiveStatus(u.subscription_status)) {
      return json(res, 402, { error: { message: 'Max is a Pro feature. Start a 3-day free trial to chat with Max.', code: 'upgrade_required' } });
    }
  }

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
    if (url === '/api/auth/signup' && req.method === 'POST') return await handleSignupOrLogin(req, res);
    if (url === '/api/auth/verify' && req.method === 'POST') return await handleVerify(req, res);
    if (url === '/api/auth/logout' && req.method === 'POST') return await handleLogout(req, res);
    if (url === '/api/auth/me' && req.method === 'GET') return await handleMe(req, res);
    // Public, unauthenticated config so the landing page can decide
    // whether to show the pricing card without doing a /me round-trip.
    if (url === '/api/config' && req.method === 'GET') return await handleGetConfig(req, res);
    // Curriculum reference (public read).
    if (url === '/api/curriculum/subjects' && req.method === 'GET') return await handleGetCurriculumSubjects(req, res);
    if (url === '/api/curriculum/courses' && req.method === 'GET') return await handleGetCurriculumCourses(req, res);
    if (url.startsWith('/api/curriculum/courses/') && req.method === 'GET') {
      const id = url.slice('/api/curriculum/courses/'.length);
      return await handleGetCurriculumCourseFull(req, res, id);
    }
    // Favorites (signed-in user only).
    if (url === '/api/me/favorites' && req.method === 'GET') return await handleListFavorites(req, res);
    if (url === '/api/me/favorites' && req.method === 'POST') return await handleAddFavorite(req, res);
    if (url === '/api/me/favorites' && req.method === 'DELETE') return await handleRemoveFavorite(req, res);
    // Curriculum quiz (cache + on-demand AI generation).
    if (url === '/api/curriculum/quiz' && req.method === 'POST') return await handleGetCurriculumQuiz(req, res);
    // Profile, links
    if (url === '/api/me/profile' && req.method === 'POST') return await handleUpdateProfile(req, res);
    if (url === '/api/me/rich-profile' && req.method === 'GET') return await handleGetRichProfile(req, res);
    if (url === '/api/me/rich-profile' && req.method === 'POST') return await handleSaveRichProfile(req, res);
    if (url === '/api/me/links' && req.method === 'POST') return await handleCreateLink(req, res);
    if (url.startsWith('/api/me/links/') && req.method === 'DELETE') {
      return await handleDeleteLink(req, res, url.slice('/api/me/links/'.length));
    }
    // Public unsubscribe (no auth — signed token).
    if (url === '/unsubscribe' && req.method === 'GET') return await handleUnsubscribe(req, res);
    // Cron-pingable reminder + digest dispatcher.
    if (url === '/api/cron/send-reminders' && req.method === 'POST') return await handleCronSendReminders(req, res);
    // Progress
    if (url === '/api/progress' && req.method === 'GET') return await handleGetAllProgress(req, res);
    if (url === '/api/progress' && req.method === 'POST') return await handleSaveProgress(req, res);
    // Activity + quiz attempts (own)
    if (url === '/api/me/quiz-attempts' && req.method === 'POST') return await handleLogQuizAttempt(req, res);
    if (url === '/api/me/quiz-attempts' && req.method === 'GET') return await handleGetMyQuizAttempts(req, res);
    if (url === '/api/me/activity' && req.method === 'POST') return await handleLogClientActivity(req, res);
    if (url === '/api/me/activity' && req.method === 'GET') return await handleGetMyActivity(req, res);
    if (url === '/api/me/weak-sections' && req.method === 'GET') return await handleGetMyWeakSections(req, res);
    if (url === '/api/me/review-queue' && req.method === 'GET') return await handleGetReviewQueue(req, res);
    if (url === '/api/me/study-plan' && req.method === 'GET') return await handleGetStudyPlan(req, res);
    if (url === '/api/me/study-plan' && req.method === 'POST') return await handleCreateStudyPlan(req, res);
    if (url === '/api/me/study-plan' && req.method === 'DELETE') return await handleDeleteStudyPlan(req, res);
    // Admin (only for users where is_admin = true).
    if (url === '/api/admin/stats' && req.method === 'GET') return await handleAdminStats(req, res);
    if (url === '/api/admin/users' && req.method === 'GET') return await handleAdminUsers(req, res);
    if (url === '/api/admin/activity' && req.method === 'GET') return await handleAdminActivity(req, res);
    if (url === '/api/admin/quiz-analytics' && req.method === 'GET') return await handleAdminQuizAnalytics(req, res);
    if (url === '/api/admin/cost-chart' && req.method === 'GET') return await handleAdminCostChart(req, res);
    if (url === '/api/admin/sessions' && req.method === 'GET') return await handleAdminSessions(req, res);
    if (url === '/api/admin/links' && req.method === 'GET') return await handleAdminLinks(req, res);
    if (url === '/api/admin/lessons' && req.method === 'GET') return await handleAdminLessons(req, res);
    if (url === '/api/admin/prebuild-lessons' && req.method === 'POST') return await handleAdminPrebuildStart(req, res);
    if (url === '/api/admin/prebuild-lessons' && req.method === 'GET') return await handleAdminPrebuildStatus(req, res);
    if (url === '/api/admin/prebuild-lessons/cancel' && req.method === 'POST') return await handleAdminPrebuildCancel(req, res);
    {
      const mUserDetail = url.match(/^\/api\/admin\/users\/([0-9a-f-]+)$/);
      if (mUserDetail) {
        if (req.method === 'GET') return await handleAdminUserDetail(req, res, mUserDetail[1]);
        if (req.method === 'PATCH' || req.method === 'POST') return await handleAdminUpdateUser(req, res, mUserDetail[1]);
        if (req.method === 'DELETE') return await handleAdminDeleteUser(req, res, mUserDetail[1]);
      }
      const mSession = url.match(/^\/api\/admin\/sessions\/([0-9a-f]+)$/);
      if (mSession && req.method === 'DELETE') return await handleAdminRevokeSession(req, res, mSession[1]);
    }
    if (url === '/api/me/token-usage' && req.method === 'GET') return await handleGetMyTokenUsage(req, res);
    if (url === '/api/me/token-usage/summary' && req.method === 'GET') return await handleGetMyTokenUsageSummary(req, res);
    // Cached lessons: POST returns the cached lesson or generates+caches it; DELETE busts the cache.
    if (url === '/api/lessons' && req.method === 'POST') return await handleGetLesson(req, res);
    if (url === '/api/lessons' && req.method === 'DELETE') return await handleClearLesson(req, res);
    // Parent dashboard
    if (url === '/api/parent/students' && req.method === 'GET') return await handleListLinkedStudents(req, res);
    {
      const m = url.match(/^\/api\/parent\/students\/([0-9a-f-]+)\/(activity|quiz-attempts|weak-sections|progress|profile|study-plan|authorise-reminders)$/);
      if (m) {
        const [, studentId, kind] = m;
        if (req.method === 'GET' && kind === 'activity') return await handleStudentActivity(req, res, studentId);
        if (req.method === 'GET' && kind === 'quiz-attempts') return await handleStudentQuizAttempts(req, res, studentId);
        if (req.method === 'GET' && kind === 'weak-sections') return await handleStudentWeakSections(req, res, studentId);
        if (req.method === 'GET' && kind === 'progress') return await handleStudentProgress(req, res, studentId);
        if (req.method === 'GET' && kind === 'profile') return await handleStudentProfile(req, res, studentId);
        if (req.method === 'GET' && kind === 'study-plan') return await handleStudentStudyPlan(req, res, studentId);
        if (req.method === 'POST' && kind === 'authorise-reminders') return await handleParentAuthoriseReminders(req, res, studentId);
      }
    }
    // Stripe
    if (url === '/api/stripe/checkout' && req.method === 'POST') return await handleStripeCheckout(req, res);
    if (url === '/api/stripe/portal'   && req.method === 'POST') return await handleStripePortal(req, res);
    if (url === '/api/stripe/webhook'  && req.method === 'POST') return await handleStripeWebhook(req, res);
    // Claude proxy
    if (url.startsWith('/api/claude')) return await proxyClaude(req, res);
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

// Defense in depth: any promise rejection that somehow escapes a
// request handler should NOT take the whole Node process down. Log it
// and continue serving. Same for synchronous uncaught exceptions in
// background tasks (the cleanup interval, etc).
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err && err.stack ? err.stack : err);
});

server.listen(PORT, () => {
  console.log(`📚 Atrium Institute running at http://localhost:${PORT}`);
  console.log(`🗄  DB backend: ${db.backend}`);
  console.log(API_KEY ? '✨ Max (AI tutor): enabled' : '⚠️  Max disabled (no ANTHROPIC_API_KEY)');
  console.log(process.env.RESEND_API_KEY ? '📧 Email: Resend' : '📧 Email: console (set RESEND_API_KEY for real email)');
  console.log(`⏱  Rate limit: ${RATE_LIMIT_PER_HOUR} req/hr/IP   💰 Daily cap: ${DAILY_REQUEST_CAP} req/day`);
});
