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
const shopLib = require('./shop-lib');
const refLib = require('./referral-lib');

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

// Emails that are always granted admin on successful login. The owner account
// is baked in so admin access survives even if the ADMIN_EMAILS env var is
// unset in a given environment; ADMIN_EMAILS can add more, comma-separated.
const BUILTIN_ADMIN_EMAILS = ['atriuminstitutereal@gmail.com'];
const ADMIN_EMAILS = [
  ...BUILTIN_ADMIN_EMAILS,
  ...(process.env.ADMIN_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean),
].map(s => s.toLowerCase());
function _isAdminEmail(emailStr) {
  return !!emailStr && ADMIN_EMAILS.includes(String(emailStr).trim().toLowerCase());
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
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8'
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
  const mode = body.mode === 'signin' ? 'signin' : 'signup';
  // Detect "already exists" before the upsert so we can:
  //  - Tell sign-up users we found their existing account and switch
  //    them to Sign-in mode (gentle, not a hard error).
  //  - Block sign-in attempts when no account exists for that email
  //    (otherwise the upsert would silently create one and the user
  //    would never notice the typo).
  const existingBefore = await db.findUser(body.email);
  if (mode === 'signin' && !existingBefore) {
    return json(res, 404, {
      error: 'No account found for this email. Switch to "Create account" to sign up.',
      no_account: true,
    });
  }
  const user = await db.upsertUser(body.email, role);
  const wasExisting = !!existingBefore;

  // Stash optional first-signup metadata for /verify to apply atomically.
  cleanupPendingMeta();
  pendingSignupMeta.set(user.email, {
    age: typeof body.age === 'number' ? body.age : null,
    gradeLevel: (typeof body.gradeLevel === 'number' && body.gradeLevel >= 1 && body.gradeLevel <= 12)
      ? Math.floor(body.gradeLevel) : null,
    country: typeof body.country === 'string' ? body.country : (typeof body.state === 'string' ? body.state : null),
    linkCode: typeof body.linkCode === 'string' ? body.linkCode : null,
    referralCode: typeof body.referralCode === 'string' ? body.referralCode.slice(0, 32) : null,
    schoolName: typeof body.schoolName === 'string' ? body.schoolName.slice(0, 200) : null,
    schoolDistrict: typeof body.schoolDistrict === 'string' ? body.schoolDistrict.slice(0, 200) : null,
    isPrivateSchool: typeof body.isPrivateSchool === 'boolean' ? body.isPrivateSchool : null,
    stateCode: (typeof body.stateCode === 'string' && /^[A-Za-z]{2}$/.test(body.stateCode)) ? body.stateCode.toUpperCase() : null,
    expiresAt: Date.now() + PENDING_META_TTL_MS,
  });

  const code = await db.createCode(user.email);
  try {
    await email.sendVerificationCode(user.email, code);
  } catch (e) {
    console.error('Email send failed:', e.message);
    return json(res, 502, { error: 'Could not send verification email. Try again.' });
  }
  json(res, 200, {
    ok: true,
    existing: wasExisting,
    role: user.role,
    message: wasExisting
      ? 'We found an existing account for this email. Check your inbox for the sign-in code.'
      : 'Check your email for a 6-digit code.',
  });
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
    school_name: u.school_name || null,
    school_district: u.school_district || null,
    is_private_school: !!u.is_private_school,
    state_code: u.state_code || null,
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

  // Grant admin to designated owner email(s) once the login is actually
  // confirmed (i.e. here, after the code check) — never merely on signup, so
  // someone can't claim admin just by entering the address. The owner account
  // is also never a parent: if it was signed up as one, drop it back to a
  // normal learner role so it's treated as an admin, not a parent.
  if (_isAdminEmail(user.email)) {
    const adminFixes = {};
    if (!user.is_admin) adminFixes.is_admin = true;
    if (user.role === 'parent') adminFixes.role = 'student';
    if (Object.keys(adminFixes).length) {
      user = await db.adminUpdateUser(user.id, adminFixes) || user;
    }
  }

  // Apply any first-signup metadata that the user sent on /signup. Done after
  // verification so an attacker who guesses an email can't poison a real
  // user's age / state / link.
  const meta = pendingSignupMeta.get(user.email);
  if (meta) {
    pendingSignupMeta.delete(user.email);
    if (meta.age != null || meta.country != null || meta.gradeLevel != null
        || meta.schoolName != null || meta.schoolDistrict != null || meta.isPrivateSchool != null
        || meta.stateCode != null) {
      user = await db.updateUserProfile(user.id, {
        age: meta.age,
        country: meta.country,
        gradeLevel: meta.gradeLevel,
        schoolName: meta.schoolName,
        schoolDistrict: meta.schoolDistrict,
        isPrivateSchool: meta.isPrivateSchool,
        stateCode: meta.stateCode,
      }) || user;
    }
    if (meta.linkCode) {
      const linked = await db.createLinkFromCode(user.id, meta.linkCode);
      if (linked && linked.ok) {
        user = await db.getUser(user.id) || user;
      }
    }
    // Referral attribution: first-signup only, idempotent, no self-referral.
    // Stored in the generic KV store (no schema change). The referral code is
    // the referrer's public link_code (looked up via findUserByLinkCode).
    if (meta.referralCode) {
      try {
        const already = await db.getProgress(user.id, REFERRAL_KEY);
        if (!already || !already.referredBy) {
          const referrer = await db.findUserByLinkCode(meta.referralCode);
          if (referrer && referrer.id !== user.id) {
            await db.setProgress(user.id, REFERRAL_KEY, { referredBy: referrer.id, at: Date.now() });
            const rref = (await db.getProgress(referrer.id, REFERRAL_KEY)) || {};
            const referees = Array.isArray(rref.referees) ? rref.referees : [];
            if (referees.indexOf(user.id) === -1) referees.push(user.id);
            await db.setProgress(referrer.id, REFERRAL_KEY, Object.assign({}, rref, { referees: referees, count: referees.length }));
          }
        }
      } catch (e) { console.warn('referral record failed:', e && e.message); }
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
    user: {
      email: u.email,
      age: u.age == null ? null : Number(u.age),
      country: u.country || null,
      state_code: u.state_code || null,
      grade_level: u.grade_level == null ? null : Number(u.grade_level),
      school_name: u.school_name || null,
      school_district: u.school_district || null,
      is_private_school: !!u.is_private_school,
    },
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
  if (typeof body.schoolName === 'string') {
    userUpdates.schoolName = body.schoolName.trim().slice(0, 200);
  }
  if (typeof body.schoolDistrict === 'string') {
    userUpdates.schoolDistrict = body.schoolDistrict.trim().slice(0, 200);
  }
  if (typeof body.isPrivateSchool === 'boolean') {
    userUpdates.isPrivateSchool = body.isPrivateSchool;
  }
  if (typeof body.stateCode === 'string' && /^[A-Za-z]{2}$/.test(body.stateCode)) {
    userUpdates.stateCode = body.stateCode.toUpperCase();
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

// Self-serve account deletion. Three layers of validation on the
// server side mirror the three-stage prompt on the client so a
// malicious script can't bypass the dialog and delete the account
// with a single fetch:
//   1. Caller must acknowledge all four risk statements (boolean
//      flags in the body).
//   2. Caller must POST their email address — must exactly match the
//      signed-in user's email (case-insensitive, trimmed).
//   3. Caller must POST confirmation_phrase === "DELETE MY ACCOUNT"
//      (exact match, including capitals).
// Any failure returns 400 and the account is not touched.
async function handleDeleteAccount(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  if (!body) return json(res, 400, { error: 'Bad payload.' });
  const ack = body.acknowledgements || {};
  const REQUIRED_ACKS = ['lose_progress', 'lose_activity', 'lose_links', 'irreversible'];
  for (const key of REQUIRED_ACKS) {
    if (ack[key] !== true) {
      return json(res, 400, { error: 'Please acknowledge every warning before continuing.' });
    }
  }
  const emailConfirm = String(body.email_confirmation || '').trim().toLowerCase();
  if (emailConfirm !== String(u.email || '').trim().toLowerCase()) {
    return json(res, 400, { error: 'The email you typed does not match the account email.' });
  }
  if (body.confirmation_phrase !== 'DELETE MY ACCOUNT') {
    return json(res, 400, { error: 'Type DELETE MY ACCOUNT exactly (capitals included) to confirm.' });
  }
  // Best-effort activity log BEFORE the row vanishes; useful if we
  // ever need to investigate complaints about wrongful deletion.
  try { await db.logActivity(u.id, 'account_deleted', { email: u.email }); } catch (_e) {}
  // If the paywall is live and this user has a Stripe subscription,
  // cancel it before tearing down the account so they don't keep
  // getting billed. Non-fatal if Stripe rejects (already cancelled,
  // unknown subscription, etc.) -- we still proceed with the local
  // delete because keeping a half-billed half-deleted account is
  // worse than a stuck subscription that gets flagged by the user.
  if (stripeLib.isConfigured() && u.stripe_subscription_id) {
    try { await stripeLib.cancelSubscriptionForUser(u); } catch (_e) {}
  }
  const ok = await db.deleteUserAccount(u.id);
  if (!ok) return json(res, 500, { error: 'Account not deleted. Try again or contact support.' });
  // Revoke the session cookie now that the user is gone.
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Set-Cookie': clearCookieHeader(),
  });
  res.end(JSON.stringify({ ok: true }));
}

// ---------- PhotoAtrium ----------

// Allow-list of subjects matches the DB CHECK constraint approximation.
const PHOTO_ALLOWED_SUBJECTS = new Set([
  'arithmetic', 'prealgebra', 'algebra', 'geometry', 'trigonometry',
  'precalculus', 'calculus', 'statistics', 'linear_algebra',
  'differential_equations', 'other',
]);

// Parse the structured Photomath-style response from Claude. The model is
// instructed to emit <problem>, <subject>, <answer>, <methods>, optionally
// <illustration> and <note>. We return them in a JSON shape the client can
// render directly.
function parsePhotoSolveResponse(text) {
  if (typeof text !== 'string') text = '';
  const grab = (tag) => {
    const m = text.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
    return m ? m[1].trim() : '';
  };
  const problem = grab('problem');
  const subject = (grab('subject') || 'other').toLowerCase().trim();
  const answer = grab('answer');
  const hint = grab('hint');
  const illustration = grab('illustration');
  const note = grab('note');

  // Methods can contain multiple <method> blocks each with <step> children.
  const methods = [];
  const methodsBlock = grab('methods');
  const methodRe = /<method\b([^>]*)>([\s\S]*?)<\/method>/gi;
  let mm;
  while ((mm = methodRe.exec(methodsBlock)) !== null) {
    const attrs = mm[1] || '';
    const nameMatch = attrs.match(/name=["']([^"']+)["']/i);
    const name = nameMatch ? nameMatch[1].trim() : 'Solution';
    const body = mm[2] || '';
    const steps = [];
    const stepRe = /<step\b([^>]*)>([\s\S]*?)<\/step>/gi;
    let sm;
    while ((sm = stepRe.exec(body)) !== null) {
      const stepAttrs = sm[1] || '';
      const nMatch = stepAttrs.match(/n=["']?(\d+)["']?/);
      const n = nMatch ? parseInt(nMatch[1], 10) : (steps.length + 1);
      const stepBody = sm[2] || '';
      const eqMatch = stepBody.match(/<eq\b[^>]*>([\s\S]*?)<\/eq>/i);
      const whyMatch = stepBody.match(/<why\b[^>]*>([\s\S]*?)<\/why>/i);
      const eq = (eqMatch ? eqMatch[1] : '').trim();
      const why = (whyMatch ? whyMatch[1] : '').trim();
      steps.push({ n, eq, why });
    }
    methods.push({ name, steps });
  }

  return {
    problem,
    subject: PHOTO_ALLOWED_SUBJECTS.has(subject) ? subject : 'other',
    answer,
    hint,
    methods,
    illustration,
    note,
  };
}

// POST /api/photo-atrium/solve
// Body: { imageBase64: 'data:image/jpeg;base64,...', imageMediaType?: 'image/jpeg' }
// Calls Claude vision, parses structured response, auto-saves to DB.
// Returns the parsed solve + DB row id.
async function handlePhotoSolve(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in to use PhotoAtrium.' });
  if (!API_KEY) return json(res, 503, { error: 'Photo solve unavailable: server has no ANTHROPIC_API_KEY.' });
  const body = await readJSON(req);
  if (!body || typeof body.imageBase64 !== 'string') {
    return json(res, 400, { error: 'imageBase64 required.' });
  }
  // The client sends a data URL: data:image/jpeg;base64,<payload>.
  // Strip the prefix and validate the media type.
  let media = 'image/jpeg';
  let b64 = body.imageBase64;
  const dataUrlMatch = b64.match(/^data:(image\/(?:jpeg|jpg|png|webp));base64,(.+)$/);
  if (dataUrlMatch) {
    media = dataUrlMatch[1] === 'image/jpg' ? 'image/jpeg' : dataUrlMatch[1];
    b64 = dataUrlMatch[2];
  } else if (typeof body.imageMediaType === 'string' && /^image\/(jpeg|png|webp)$/i.test(body.imageMediaType)) {
    media = body.imageMediaType.toLowerCase();
  }
  // Cap upload size at ~6MB raw base64 (~4.5MB binary) — well below
  // Anthropic's image limit. The client compresses to <200KB normally.
  if (b64.length > 6 * 1024 * 1024) {
    return json(res, 413, { error: 'Image too large. Compress and retry.' });
  }

  const thumbnail = typeof body.thumbnailDataUrl === 'string' && body.thumbnailDataUrl.length < 200000
    ? body.thumbnailDataUrl : null;

  const model = 'claude-sonnet-4-5-20250929';
  let result;
  try {
    result = await callClaudeDirect({
      model,
      system: prompts.buildSystem('photo-solve'),
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: media, data: b64 } },
          { type: 'text', text: 'Solve this math problem using the structured format described in the system prompt.' },
        ],
      }],
      max_tokens: 4000,
      temperature: 0.3,
    });
  } catch (e) {
    return json(res, 502, { error: 'Could not reach the math solver. Try again in a moment.', detail: e.message });
  }

  if (result.usage) {
    const cost = computeCost(model, result.usage);
    db.recordAiUsage({
      userId: u.id,
      userEmail: u.email,
      intent: 'photo-solve',
      model,
      inputTokens: result.usage.input_tokens || 0,
      outputTokens: result.usage.output_tokens || 0,
      cacheReadTokens: result.usage.cache_read_input_tokens || 0,
      cacheCreationTokens: result.usage.cache_creation_input_tokens || 0,
      costUsd: cost,
    }).catch(err => console.error('recordAiUsage failed:', err.message));
  }

  // Sanitise SVG / scripty content the same way lesson content is scrubbed.
  const safe = sanitizeLessonContent(result.text);
  const parsed = parsePhotoSolveResponse(safe);

  // Refuse to save a clearly-failed solve. Tell the client.
  if (!parsed.problem || parsed.problem === 'unreadable' || !parsed.methods.length) {
    return json(res, 200, {
      ok: false,
      reason: 'unreadable',
      message: 'I could not read this image clearly. Try again with better lighting, no glare, and the whole problem in the frame.',
      parsed,
    });
  }

  // Auto-save the solve (Photomath-style: every scan goes to history).
  const row = await db.savePhotoSolve(u.id, {
    thumbnailData: thumbnail,
    detectedProblem: parsed.problem,
    solutionContent: safe,
    subject: parsed.subject,
    model,
  });

  // Activity + points.
  await db.logActivity(u.id, 'photo_solve', { id: row.id, subject: parsed.subject });
  _awardPointsAsync(u.id, 10);

  json(res, 200, {
    ok: true,
    id: row.id,
    created_at: row.created_at,
    parsed,
    model,
  });
}

// POST /api/photo-atrium/re-solve
// Body: { problemText: '\\frac{x^2-9}{x-3} = ?' }
// Used when the user edits the auto-transcribed LaTeX and wants to re-solve
// the corrected version. Text-only, no vision tokens.
async function handlePhotoReSolve(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in to use PhotoAtrium.' });
  if (!API_KEY) return json(res, 503, { error: 'Photo solve unavailable.' });
  const body = await readJSON(req);
  if (!body || typeof body.problemText !== 'string' || !body.problemText.trim()) {
    return json(res, 400, { error: 'problemText required.' });
  }
  const text = body.problemText.trim().slice(0, 2000);
  const model = 'claude-sonnet-4-5-20250929';
  let result;
  try {
    result = await callClaudeDirect({
      model,
      system: prompts.buildSystem('photo-solve'),
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `The student typed this problem manually. Solve it using the structured format described in the system prompt. There is no image — treat the text below as the transcription.\n\nProblem:\n${text}` },
        ],
      }],
      max_tokens: 4000,
      temperature: 0.3,
    });
  } catch (e) {
    return json(res, 502, { error: 'Solver unavailable. Try again.', detail: e.message });
  }
  if (result.usage) {
    const cost = computeCost(model, result.usage);
    db.recordAiUsage({
      userId: u.id, userEmail: u.email,
      intent: 'photo-resolve', model,
      inputTokens: result.usage.input_tokens || 0,
      outputTokens: result.usage.output_tokens || 0,
      cacheReadTokens: result.usage.cache_read_input_tokens || 0,
      cacheCreationTokens: result.usage.cache_creation_input_tokens || 0,
      costUsd: cost,
    }).catch(err => console.error('recordAiUsage failed:', err.message));
  }
  const safe = sanitizeLessonContent(result.text);
  const parsed = parsePhotoSolveResponse(safe);
  if (!parsed.problem || !parsed.methods.length) {
    return json(res, 200, { ok: false, reason: 'parse-failed', parsed });
  }
  const row = await db.savePhotoSolve(u.id, {
    thumbnailData: null, // text-only re-solve has no image
    detectedProblem: parsed.problem,
    solutionContent: safe,
    subject: parsed.subject,
    model,
  });
  await db.logActivity(u.id, 'photo_solve', { id: row.id, subject: parsed.subject, retyped: true });
  _awardPointsAsync(u.id, 10);
  json(res, 200, { ok: true, id: row.id, created_at: row.created_at, parsed, model });
}

// GET /api/photo-atrium/list
async function handlePhotoList(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in.' });
  const url = new URL(req.url, 'http://localhost');
  const limit = url.searchParams.get('limit');
  const rows = await db.listPhotoSolves(u.id, limit);
  json(res, 200, { items: rows });
}

// GET /api/photo-atrium/:id  (full solution)
async function handlePhotoGet(req, res, id) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in.' });
  if (!id) return json(res, 400, { error: 'id required.' });
  const row = await db.getPhotoSolve(u.id, id);
  if (!row) return json(res, 404, { error: 'Not found.' });
  const parsed = parsePhotoSolveResponse(row.solution_content || '');
  json(res, 200, { item: row, parsed });
}

// DELETE /api/photo-atrium/:id
async function handlePhotoDelete(req, res, id) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in.' });
  if (!id) return json(res, 400, { error: 'id required.' });
  const ok = await db.deletePhotoSolve(u.id, id);
  if (!ok) return json(res, 404, { error: 'Not found.' });
  await db.logActivity(u.id, 'photo_delete', { id });
  json(res, 200, { ok: true });
}

async function handleSaveSurvey(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  if (u.role !== 'student') return json(res, 400, { error: 'Survey is for students.' });
  const body = await readJSON(req);
  if (!body) return json(res, 400, { error: 'Bad payload.' });
  const profile = await db.saveStudentSurvey(u.id, body);
  await db.logActivity(u.id, 'survey_completed', {});
  json(res, 200, { ok: true, profile });
}

async function handleSkipSurvey(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  if (u.role !== 'student') return json(res, 400, { error: 'Survey is for students.' });
  const profile = await db.markSurveySkipped(u.id);
  await db.logActivity(u.id, 'survey_skipped', {});
  json(res, 200, { ok: true, profile });
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
  await db.logActivity(u.id, 'link_invited', { linkId: result.link.id });
  // Notify the other party so they can approve from their inbox / dashboard.
  // Best-effort: if email fails, the in-app pending list still works.
  if (result.other && result.other.email) {
    try {
      await email.sendLinkApprovalRequest(result.other.email, {
        inviterEmail: u.email,
        inviterRole: u.role,
        approverRole: result.other.role,
      });
    } catch (e) {
      console.warn('Link approval email failed:', e.message);
    }
  }
  json(res, 200, {
    ok: true,
    link: result.link,
    pending: result.link.status === 'pending',
    message: result.link.status === 'pending'
      ? `Invitation sent to ${result.other.email}. The link goes live once they approve it.`
      : 'Link created.',
  });
}

async function handleApproveLink(req, res, linkId) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const result = await db.approveLink(linkId, u.id);
  if (!result.ok) {
    const msg = result.reason === 'not-found' ? 'Invitation not found.'
              : result.reason === 'rejected' ? 'This invitation was already rejected. Ask the other person to try again.'
              : result.reason === 'cannot-self-approve' ? 'The person who sent the invitation cannot also approve it. The other party needs to approve.'
              : result.reason === 'not-allowed' ? 'You can only approve invitations addressed to you.'
              : 'Could not approve the link.';
    return json(res, 400, { error: msg });
  }
  await db.logActivity(u.id, 'link_approved', { linkId });
  json(res, 200, { ok: true, link: result.link });
}

async function handleRejectLink(req, res, linkId) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const result = await db.rejectLink(linkId, u.id);
  if (!result.ok) return json(res, 400, { error: 'Invitation not found or already resolved.' });
  await db.logActivity(u.id, 'link_rejected', { linkId });
  json(res, 200, { ok: true });
}

async function handleListPendingLinks(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const rows = await db.listPendingLinksForUser(u.id);
  json(res, 200, { pending: rows });
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
  // Award points (fire-and-forget). Passes are worth more than attempts.
  _awardPointsAsync(u.id, body && body.passed ? POINT_VALUES.quiz_passed : POINT_VALUES.quiz_attempted);
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
  for (const k of ['courseId', 'bookId', 'sectionIdx', 'sectionTitle', 'sectionKind', 'topic', 'questionNumber', 'questionTotal', 'hintLevel']) {
    if (k in meta && (typeof meta[k] === 'string' || typeof meta[k] === 'number')) {
      const v = meta[k];
      safeMeta[k] = typeof v === 'string' ? v.slice(0, 200) : v;
    }
  }
  if (typeof meta.correct === 'boolean') safeMeta.correct = meta.correct;
  await db.logActivity(u.id, body.kind, safeMeta);
  // Gamification points (fire-and-forget).
  if (body.kind === 'lesson_started') _awardPointsAsync(u.id, POINT_VALUES.lesson_started);
  else if (body.kind === 'hint_used') {
    _awardPointsAsync(u.id, POINT_VALUES.hint_used);
    if (safeMeta.courseId && safeMeta.bookId && safeMeta.sectionIdx != null) {
      db.incrementHintUsage(u.id, safeMeta.courseId, safeMeta.bookId, safeMeta.sectionIdx, safeMeta.sectionKind || 'section').catch(() => {});
    }
  }
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
  let limit;
  try { limit = parseInt(new URL(req.url, 'http://localhost').searchParams.get('limit'), 10); } catch (_) {}
  // listActivity clamps to 500; default stays 50 when no valid limit is given.
  const activity = await db.listActivity(u.id, limit ? { limit } : {});
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

// ---------- Student insights + adaptive difficulty ----------

async function handleGetStudentInsights(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const insights = await db.getStudentInsights(u.id);
  json(res, 200, { insights });
}

async function handleGetSectionMastery(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const url = new URL(req.url, 'http://localhost');
  const courseId = url.searchParams.get('course_id') || null;
  let rows;
  if (courseId) {
    rows = await db.listSectionMastery(u.id, courseId);
  } else {
    rows = await db.listSectionMastery(u.id);
  }
  json(res, 200, rows);
}

async function handleGetAdaptiveDifficulty(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const url = new URL(req.url, 'http://localhost');
  const courseId = url.searchParams.get('course_id');
  const bookId = url.searchParams.get('book_id');
  const sectionIdx = url.searchParams.get('section_idx');
  if (!courseId || !bookId || sectionIdx == null) {
    return json(res, 400, { error: 'course_id, book_id, and section_idx are required.' });
  }
  const recommendation = await db.getAdaptiveDifficulty(u.id, courseId, bookId, Number(sectionIdx));
  json(res, 200, { recommendation });
}

// ---------- Behavior tracking ----------

async function handleBehaviorEvents(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readBody(req);
  const { session_id, events } = body;
  if (!session_id || !Array.isArray(events) || !events.length) {
    return json(res, 400, { error: 'session_id and events[] required.' });
  }
  // Validate event types
  const VALID_TYPES = new Set([
    'session_start', 'session_end',
    'lesson_open', 'lesson_close', 'lesson_step_view', 'lesson_regenerate',
    'quiz_start', 'quiz_answer', 'quiz_submit', 'answer_changed',
    'hint_request', 'chat_message', 'study_with_max',
    'section_visit', 'course_visit',
    'tab_blur', 'tab_focus',
  ]);
  const filtered = events.filter(e => e.event_type && VALID_TYPES.has(e.event_type));
  if (!filtered.length) return json(res, 200, { accepted: 0 });

  await db.insertBehaviorEvents(u.id, session_id, filtered);

  // Fire-and-forget: analyze session for behavioral signals
  db.analyzeBehaviorSession(u.id, session_id).catch(() => {});

  json(res, 200, { accepted: filtered.length });
}

async function handleBehaviorSummary(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const summary = await db.getBehaviorSummary(u.id);
  json(res, 200, summary);
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
  out = sanitizeLessonMath(out);
  out = sanitizeLessonSvg(out);
  return out;
}

// Clean up known-bad SVG patterns from Max-generated diagrams. The model has
// shipped lessons where it duplicates labels ("side = √49 = 7" followed by a
// stand-alone "7") and draws stray <line> elements across text. These render
// as orphan numbers and apparent strikethroughs. We can't ask the cache to
// regenerate every old lesson, so we scrub on serve.
function sanitizeLessonSvg(content) {
  if (typeof content !== 'string' || content.indexOf('<svg') === -1) return content;
  return content.replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, (svg) => {
    let body = svg;

    // 1) De-dup labels. Two cases:
    //    (a) literal duplicate: the same trimmed text appears twice → keep the
    //        first, drop the rest.
    //    (b) short-answer echo: a <text> whose entire content is a short
    //        token (e.g. "7", "4", "= 7") and that token already appears as
    //        the tail of a longer label (e.g. "side = √49 = 7"). Max often
    //        emits the final answer twice — once at the end of the equation
    //        and once on its own line beneath. Drop the standalone echo.
    //    We do (a) first by collecting unique labels, then (b) by looking
    //    for short labels whose content is contained in any longer label.
    const labels = []; // {text, full match}
    body.replace(/<text\b[^>]*>([\s\S]*?)<\/text>/gi, (m, inner) => {
      labels.push((inner || '').replace(/\s+/g, ' ').trim());
      return m;
    });
    const seen = new Set();
    const isShortEcho = (norm) => {
      if (!norm || norm.length > 6) return false;
      // Must be purely numeric (digits + optional unit suffix). Single letters
      // like "x" or "y" are axis labels — never strip those.
      const stripped = norm.replace(/^[=\s]+/, '').trim();
      if (!/^-?\d+(?:\.\d+)?(?:°|π)?$/.test(stripped)) return false;
      // Only drop when the SAME number appears as the final answer of a
      // longer label, i.e. preceded by "= " near the end. This avoids
      // false positives like "5" being a coordinate when another label
      // happens to contain "5" mid-expression.
      const tailPat = new RegExp('=\\s*' + stripped.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$');
      return labels.some(other => other !== norm && other.length > norm.length && tailPat.test(other));
    };
    body = body.replace(/<text\b([^>]*)>([\s\S]*?)<\/text>/gi, (m, attrs, inner) => {
      const norm = inner.replace(/\s+/g, ' ').trim();
      if (!norm) return m;
      if (seen.has(norm)) return '';      // literal duplicate
      if (isShortEcho(norm)) return '';   // standalone "answer" echo
      seen.add(norm);
      return m;
    });

    // 2) Drop strikethrough <line> elements — short horizontal lines that
    //    sit at the same y as a <text>. Two guards to avoid killing axes:
    //    (a) line span must be SHORT relative to the viewBox width (axes
    //        typically span the full canvas; strikethroughs are local).
    //    (b) line y must fall within ±6 of a <text>'s y.
    const textYs = [];
    body.replace(/<text\b[^>]*\by\s*=\s*["']?(-?\d+(?:\.\d+)?)["']?/gi, (_m, y) => {
      textYs.push(parseFloat(y));
      return _m;
    });
    const vbMatch = /viewBox\s*=\s*["']\s*-?\d+(?:\.\d+)?\s+-?\d+(?:\.\d+)?\s+(\d+(?:\.\d+)?)\s+\d+(?:\.\d+)?\s*["']/i.exec(body);
    const vbWidth = vbMatch ? parseFloat(vbMatch[1]) : 0;
    if (textYs.length) {
      body = body.replace(/<line\b[^>]*\/?>/gi, (line) => {
        const y1m = /\by1\s*=\s*["']?(-?\d+(?:\.\d+)?)["']?/.exec(line);
        const y2m = /\by2\s*=\s*["']?(-?\d+(?:\.\d+)?)["']?/.exec(line);
        const x1m = /\bx1\s*=\s*["']?(-?\d+(?:\.\d+)?)["']?/.exec(line);
        const x2m = /\bx2\s*=\s*["']?(-?\d+(?:\.\d+)?)["']?/.exec(line);
        if (!y1m || !y2m || !x1m || !x2m) return line;
        const y1 = parseFloat(y1m[1]);
        const y2 = parseFloat(y2m[1]);
        if (Math.abs(y1 - y2) > 1.5) return line;  // not horizontal — keep
        const ymid = (y1 + y2) / 2;
        if (!textYs.some(ty => Math.abs(ty - ymid) <= 6)) return line;
        // Width guard: only drop if line spans less than 60% of viewBox width
        // (real strikethroughs hug their label). If we don't know the viewBox
        // width, be conservative and keep the line.
        if (vbWidth <= 0) return line;
        const span = Math.abs(parseFloat(x2m[1]) - parseFloat(x1m[1]));
        return (span / vbWidth) < 0.6 ? '' : line;
      });
    }

    return body;
  });
}

// Scrub common LaTeX patterns that render badly in our in-house fallback.
// Runs on every lesson before save AND on every cached lesson before serve.
function sanitizeLessonMath(content) {
  if (typeof content !== 'string') return '';
  let out = content;
  // 1. Strip \\ (hard line break) from INSIDE inline math \(...\) — but
  //    ONLY when the inline math doesn't contain a \begin{...}\end{...}
  //    block. Matrices use \\ as a legitimate row separator. Display math
  //    \[...\] always keeps \\ since it's allowed to span multiple lines.
  out = out.replace(/\\\(([\s\S]*?)\\\)/g, (m, inner) => {
    if (/\\begin\{[a-zA-Z*]+\}/.test(inner)) return m; // contains a matrix / env — leave intact
    const cleaned = inner.replace(/\\\\\s*/g, ' ').replace(/\s+/g, ' ');
    return `\\(${cleaned}\\)`;
  });
  // 2. Convert $...$ → \(...\) (legacy LaTeX delimiter the renderer no
  //    longer recognises). Only when the inside looks like math AND
  //    doesn't span a JS string boundary (false-positive guard).
  out = out.replace(/\$([^$\n]{1,200}?)\$/g, (m, inner) => {
    if (/["']\s*[,:}]|[,:{]\s*["']/.test(inner)) return m;  // skip currency-vs-currency spans
    if (/\\[a-zA-Z]+|\^[\w{]|_\{/.test(inner)) return `\\(${inner}\\)`;
    return m;
  });
  // 3. Trim stray dollar signs that occasionally appear right after a
  //    converted block.
  out = out.replace(/\\\(([^)]*)\\\)\s*\$/g, '\\($1\\)');
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
      // Re-sanitise on serve so older cached lessons that were saved before
      // the sanitiser knew about \\ inside \(…\) and stray $…$ delimiters
      // get fixed transparently without needing a full regeneration.
      const cleaned = sanitizeLessonContent(cached.content || '');
      return json(res, 200, { content: cleaned, model: cached.model, cached: true });
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

// ---------- Time tracking + activity summary ----------
function _rangeBounds(range) {
  // Returns [fromISO, toISO] (inclusive) for daily / weekly / monthly /
  // quarterly. Today is included in every range.
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();
  const d = today.getUTCDate();
  const todayStart = new Date(Date.UTC(y, m, d));
  let from;
  switch ((range || 'daily').toLowerCase()) {
    case 'weekly':    from = new Date(todayStart);  from.setUTCDate(d - 6); break;
    case 'monthly':   from = new Date(todayStart);  from.setUTCDate(d - 29); break;
    case 'quarterly': from = new Date(todayStart);  from.setUTCDate(d - 89); break;
    case 'daily':
    default:          from = new Date(todayStart); break;
  }
  const iso = (dt) => dt.toISOString().slice(0, 10);
  return [iso(from), iso(todayStart)];
}

async function handleHeartbeat(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req) || {};
  // Client tells us which subject the user was on; defaults to math.
  const subject = typeof body.subject === 'string' ? body.subject : 'math';
  const seconds = typeof body.seconds === 'number' ? body.seconds : 60;
  try { await db.recordHeartbeat(u.id, subject, seconds); }
  catch (e) { console.error('heartbeat failed:', e.message); }
  json(res, 200, { ok: true });
}

async function handleGetMyActivitySummary(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const url = new URL(req.url, 'http://localhost');
  const range = url.searchParams.get('range') || 'daily';
  const [from, to] = _rangeBounds(range);
  const subjects = await db.getActivitySummary(u.id, from, to);
  json(res, 200, { range, from, to, subjects });
}

async function handleGetAdminActivitySummary(req, res) {
  const u = await requireAdmin(req, res); if (!u) return;
  const url = new URL(req.url, 'http://localhost');
  const range = url.searchParams.get('range') || 'daily';
  const [from, to] = _rangeBounds(range);
  const students = await db.getActivitySummaryAll(from, to);
  json(res, 200, { range, from, to, students });
}

async function handleGetParentStudentSummary(req, res, studentId) {
  if (!await requireLinkedStudent(req, res, studentId)) return;
  const url = new URL(req.url, 'http://localhost');
  const range = url.searchParams.get('range') || 'daily';
  const [from, to] = _rangeBounds(range);
  const subjects = await db.getActivitySummary(studentId, from, to);
  json(res, 200, { range, from, to, subjects });
}

// ---------- Streaks ----------
async function handleGetMyStreaks(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const s = await db.getUserStreaks(u.id);
  json(res, 200, s);
}

// ---------- Achievements ----------
async function handleGetMyAchievements(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const a = await db.getUserAchievements(u.id);
  json(res, 200, a);
}

// ---------- Points + leaderboard ----------
const POINT_VALUES = {
  quiz_passed: 50,
  quiz_attempted: 10,
  lesson_started: 5,
  hint_used: 2,
  pod_solved: 20,
  achievement_earned: 50,
};

// Fire-and-forget point award. Failures are logged but don't propagate.
function _awardPointsAsync(userId, amount) {
  if (!userId || !amount) return;
  db.awardPoints(userId, amount).catch(err => console.warn('awardPoints failed:', err.message));
}

async function handleGetMyPoints(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const summary = await db.getMyPointsSummary(u.id);
  json(res, 200, summary);
}

// ---------- Rewards shop ----------
// Coins are spendable = all-time points earned minus points spent here. Prices
// live in shop-lib on the server; the client can never set them. Shop state is
// stored in the generic per-user KV store (progress table) under 'shop_v1', so
// no schema change is needed.
const SHOP_KEY = 'shop_v1';
const REFERRAL_KEY = 'referral_v1';

// Referral status for the signed-in user. The shareable code IS their public
// link_code; the client builds the full link as <origin>/?ref=<code>.
async function handleGetReferral(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const mine = refLib.normalize(await db.getProgress(u.id, REFERRAL_KEY));
  json(res, 200, {
    code: u.link_code || '',
    count: mine.count,
    rewardMonths: mine.rewardMonths,
    referredBy: mine.referredBy || null,
  });
}
async function _pointsTotal(userId) {
  try { const s = await db.getMyPointsSummary(userId); return (s && Number(s.all_time)) || 0; }
  catch (_) { return 0; }
}
async function handleGetShop(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const saved = await db.getProgress(u.id, SHOP_KEY);
  const total = await _pointsTotal(u.id);
  json(res, 200, shopLib.state(total, saved));
}
async function handleShopBuy(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  const saved = await db.getProgress(u.id, SHOP_KEY);
  const total = await _pointsTotal(u.id);
  const r = shopLib.buy(total, saved, body && body.itemId);
  if (!r.ok) return json(res, 400, { error: r.error });
  await db.setProgress(u.id, SHOP_KEY, r.saved);
  json(res, 200, shopLib.state(total, r.saved));
}
async function handleShopEquip(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Not signed in.' });
  const body = await readJSON(req);
  const saved = await db.getProgress(u.id, SHOP_KEY);
  const total = await _pointsTotal(u.id);
  const r = shopLib.equip(saved, body && body.slot, body && body.itemId);
  if (!r.ok) return json(res, 400, { error: r.error });
  await db.setProgress(u.id, SHOP_KEY, r.saved);
  json(res, 200, shopLib.state(total, r.saved));
}

// US school-district autocomplete. Anonymous-readable because the signup
// form needs it before the user has a session. The dataset is just
// publicly available district names + the names other signups have
// entered, so there is nothing sensitive to gate behind auth.
async function handleSearchSchoolDistricts(req, res) {
  const u = new URL(req.url, 'http://localhost');
  const query = u.searchParams.get('q') || '';
  const stateCode = u.searchParams.get('state') || '';
  if (!query || query.trim().length < 2) {
    return json(res, 200, { results: [] });
  }
  const rows = await db.searchSchoolDistricts(query, stateCode, 12);
  json(res, 200, {
    results: rows.map(r => ({
      state: r.state_code,
      name: r.district_name,
      source: r.source,
      users: r.user_count || 0,
    })),
  });
}

async function handleGetLeaderboard(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in to view the leaderboard.' });
  const url = new URL(req.url, 'http://localhost');
  const range = url.searchParams.get('range') || 'weekly';
  const [from, to] = _rangeBounds(range);
  const [top, me] = await Promise.all([
    db.getLeaderboard(from, to, 25),
    db.getMyLeaderboardRank(u.id, from, to),
  ]);
  json(res, 200, { range, from, to, top, me });
}

// ---------- Problem of the Day (personalised, per-user, per-day) ----------
//
// Each student gets their own POD, picked from a pool filtered by their
// grade level (±1), their subject preferences (math/english), and biased
// by difficulty against their confidence/help subjects. The pick is
// deterministic for (user, local-date) so refresh happens exactly once
// at the user's local midnight.

// Course → typical grade range. Used to filter the question pool to
// grade-appropriate material. The buckets are intentionally wide;
// students above/below get clamped by the ±1 buffer in matching.
const COURSE_GRADE_RANGE = {
  arithmetic: [4, 6],   prealgebra: [6, 8],   algebra: [8, 9],
  geometry:   [9, 10],  algebra2:   [10, 11], trigonometry: [10, 11],
  precalc:    [11, 12], calculus:   [11, 13], statistics:   [11, 13],
  finitemath: [12, 14], linearalg:  [12, 14], diffeq:       [13, 14],
  abstractalg:[14, 16], realanalysis:[14, 16],
  eng6:[6,6], eng7:[7,7], eng8:[8,8], eng9:[9,9], eng10:[10,10], eng11:[11,11], eng12:[12,12],
};

// Today's date in YYYY-MM-DD, computed in the student's local timezone.
// Falls back to UTC if no/invalid tz. en-CA locale yields ISO-formatted
// dates which is what Postgres ::date expects.
function _getUserToday(timezone) {
  const tz = (typeof timezone === 'string' && timezone.length) ? timezone : null;
  if (!tz) return new Date().toISOString().slice(0, 10);
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
  } catch (_) {
    return new Date().toISOString().slice(0, 10);
  }
}

// Build the (filtered + difficulty-tagged) candidate pool for a student.
// difficulty score: 0 = easiest, 1 = medium, 2 = hardest. Derived from
// (a) book index within the course (later book = harder) and
// (b) question type ('word' problems harder than 'regular').
function _buildCandidatePool(profile) {
  let courses;
  try { courses = loadCourses(); } catch (_) { return []; }
  const grade = (profile && Number.isInteger(profile.grade)) ? profile.grade : null;
  const wantsMath = !profile || !profile.subjects || profile.subjects.length === 0
    || profile.subjects.some(s => /math/i.test(s));
  const wantsEng  = !profile || !profile.subjects || profile.subjects.length === 0
    || profile.subjects.some(s => /english|language|reading|writing/i.test(s));
  const pool = [];
  for (const [courseId, course] of Object.entries(courses)) {
    const subjectMath = course.subject !== 'english';
    if (subjectMath && !wantsMath) continue;
    if (!subjectMath && !wantsEng) continue;
    // Grade window: ±1 around user's grade. If user has no grade, allow all.
    if (grade != null) {
      const range = COURSE_GRADE_RANGE[courseId];
      if (range) {
        const [lo, hi] = range;
        if (grade < lo - 1 || grade > hi + 1) continue;
      }
    }
    const books = course.books || [];
    const bookCount = Math.max(books.length, 1);
    books.forEach((book, bookIdx) => {
      // Book position within course → coarse difficulty (0..2).
      const bookFrac = bookIdx / bookCount; // 0 (early) → ~1 (late)
      const bookDiff = bookFrac < 0.33 ? 0 : (bookFrac < 0.66 ? 1 : 2);
      (book.sections || []).forEach((sec, sectionIdx) => {
        (sec.questions || []).forEach(qq => {
          if (!qq || !qq.q || !qq.answer) return;
          const typeDiff = qq.type === 'word' ? 1 : 0;
          // Clamp combined difficulty to 0..2
          const difficulty = Math.min(2, Math.max(0, bookDiff + typeDiff - 1));
          pool.push({
            question_text: qq.q,
            question_type: qq.type || 'regular',
            correct_answer: qq.answer,
            solution: qq.solution || '',
            source_course_id: courseId,
            source_book_id: book.id,
            source_section_idx: sectionIdx,
            subject: subjectMath ? 'math' : 'language_arts',
            _difficulty: difficulty,
          });
        });
      });
    });
  }
  return pool;
}

// Score 0..2 mapped to a label for display.
const _DIFF_LABEL = ['easy', 'medium', 'hard'];

// Does a self-reported subject label match a POD subject bucket?
function _subjectInSet(subject, set) {
  for (const s of set) {
    if (subject === 'math' && /math/i.test(s)) return true;
    if (subject === 'language_arts' && /english|language|reading|writing/i.test(s)) return true;
  }
  return false;
}

// Measured math/English level from recent quiz performance. Returns a target
// difficulty (0 easy, 1 medium, 2 hard) per subject, or null when there isn't
// enough signal yet. This is the "based on your level" input: a student acing
// quizzes gets harder problems; one who's struggling gets easier ones.
function _measuredLevels(attempts) {
  const agg = { math: { p: 0, n: 0 }, language_arts: { p: 0, n: 0 } };
  for (const a of (attempts || [])) {
    const cid = a && (a.course_id || a.courseId);
    if (!cid) continue;
    const subj = /^eng/i.test(cid) ? 'language_arts' : 'math';
    agg[subj].n++;
    if (a.passed) agg[subj].p++;
  }
  const level = (s) => {
    if (s.n < 3) return null;          // too little history to judge
    const rate = s.p / s.n;
    if (rate >= 0.8) return 2;         // acing it → challenge harder
    if (rate <= 0.4) return 0;         // struggling → ease off
    return 1;                          // steady → medium
  };
  return { math: level(agg.math), language_arts: level(agg.language_arts) };
}

// Target difficulty for a subject: prefer the measured level; fall back to the
// student's self-reported confidence/help subjects; default to medium.
function _targetDifficulty(profile, subject) {
  const measured = profile && profile.levels && profile.levels[subject];
  if (measured === 0 || measured === 1 || measured === 2) return measured;
  const help = new Set((profile && profile.help_subjects) || []);
  const confident = new Set((profile && profile.confidence_subjects) || []);
  if (_subjectInSet(subject, help)) return 0;
  if (_subjectInSet(subject, confident)) return 2;
  return 1;
}

// Pick the personalised POD for a user on a specific local date.
// Deterministic: same (user, date) always yields the same pick.
function _pickPersonalisedPOD(profile, dateISO) {
  let pool = _buildCandidatePool(profile);
  if (pool.length === 0) {
    // No grade-matched questions — relax grade filter.
    pool = _buildCandidatePool({ ...profile, grade: null });
  }
  if (pool.length === 0) return null;

  // Weight each candidate toward the student's target difficulty for that
  // subject — from measured quiz performance when available, else self-reported
  // confidence/help subjects (see _targetDifficulty). Closer to target = higher
  // weight. Courses the student is currently working on get a weight boost so
  // the POD reflects their active material, not just anything in their grade band.
  const recentCourses = new Set((profile && profile.recentCourses) || []);
  let totalWeight = 0;
  const weighted = pool.map(q => {
    const target = _targetDifficulty(profile, q.subject);
    // Inverse-distance weighting so on-target gets 3x, ±1 gets 1x, ±2 gets 0.4x.
    const dist = Math.abs(q._difficulty - target);
    let w = dist === 0 ? 3 : (dist === 1 ? 1 : 0.4);
    if (recentCourses.has(q.source_course_id)) w *= 2.5;
    totalWeight += w;
    return { q, w };
  });

  // Deterministic hash of (userId, dateISO) → 0..1
  const key = (profile && profile.userId ? profile.userId : 'anon') + ':' + dateISO;
  let h = 0;
  for (let i = 0; i < key.length; i++) h = ((h << 5) - h + key.charCodeAt(i)) | 0;
  const r = (Math.abs(h) % 100000) / 100000 * totalWeight;
  let acc = 0;
  for (const { q, w } of weighted) {
    acc += w;
    if (acc >= r) {
      return {
        question_text: q.question_text,
        question_type: q.question_type,
        correct_answer: q.correct_answer,
        solution: q.solution,
        source_course_id: q.source_course_id,
        source_book_id: q.source_book_id,
        source_section_idx: q.source_section_idx,
        subject: q.subject,
        difficulty: _DIFF_LABEL[q._difficulty] || 'medium',
        pod_date: dateISO,
      };
    }
  }
  // Fallback (should never hit; guard against floating-point edge).
  const last = weighted[weighted.length - 1].q;
  return {
    question_text: last.question_text, question_type: last.question_type,
    correct_answer: last.correct_answer, solution: last.solution,
    source_course_id: last.source_course_id, source_book_id: last.source_book_id,
    source_section_idx: last.source_section_idx, subject: last.subject,
    difficulty: _DIFF_LABEL[last._difficulty] || 'medium', pod_date: dateISO,
  };
}

// Combine the relevant user info from users + student_profiles into a
// flat object the picker can read.
async function _buildPODProfile(userId) {
  const u = await db.getUser(userId).catch(() => null);
  const sp = await db.getStudentProfile(userId).catch(() => null);
  const grade = (sp && Number.isInteger(sp.grade_level)) ? sp.grade_level
              : (u  && Number.isInteger(u.grade_level))  ? u.grade_level
              : null;
  // Courses the student is actually working on right now, most-recent first,
  // derived from their recent quiz attempts. Used to bias the POD toward their
  // current material (in addition to the grade/subject filtering).
  let recentCourses = [];
  let levels = { math: null, language_arts: null };
  try {
    const attempts = await db.listQuizAttempts(userId, { limit: 40 });
    const seen = new Set();
    for (const a of (attempts || [])) {
      const cid = a && (a.course_id || a.courseId);
      if (cid && !seen.has(cid)) { seen.add(cid); recentCourses.push(cid); }
    }
    // Measured difficulty target per subject from how they're actually doing.
    levels = _measuredLevels(attempts);
  } catch (_) { /* best-effort; personalisation still works without it */ }
  return {
    userId,
    grade,
    age: (u && Number.isInteger(u.age)) ? u.age : null,
    timezone: (sp && sp.timezone) || null,
    subjects: (sp && Array.isArray(sp.subjects)) ? sp.subjects : [],
    confidence_subjects: (sp && Array.isArray(sp.confidence_subjects)) ? sp.confidence_subjects : [],
    help_subjects: (sp && Array.isArray(sp.help_subjects)) ? sp.help_subjects : [],
    recentCourses,
    levels,
  };
}

async function handleGetPOD(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in to see the daily problem.' });
  const profile = await _buildPODProfile(u.id);
  const today = _getUserToday(profile.timezone);
  // Pull the user's cached pick for today, if any.
  let pick = await db.getUserPODPick(u.id, today);
  if (!pick) {
    pick = _pickPersonalisedPOD(profile, today);
    if (!pick) return json(res, 503, { error: 'No problem available today.' });
    try { await db.saveUserPODPick(u.id, today, pick); }
    catch (e) { console.warn('saveUserPODPick failed:', e && e.message); }
  }
  const attempt = await db.getMyPODAttempt(u.id, today);
  const stats = await db.getPODStats(today);
  json(res, 200, {
    pod: {
      pod_date: today,
      question_text: pick.question_text,
      question_type: pick.question_type,
      subject: pick.subject,
      difficulty: pick.difficulty,
    },
    my_attempt: attempt,
    stats,
    personalised: true,
  });
}

// Grade a POD answer with the same AI grader the quizzes use. The stored
// correct answers are LaTeX (e.g. \(\tfrac{1}{3}\)), so the previous
// exact-string comparison marked virtually every correct answer wrong.
// Returns { correct }. Throws if the AI call is unavailable so the caller
// can fall back to a local match.
async function _aiGradePODAnswer(u, question, userAnswer, correctAnswer) {
  const stripped = String(userAnswer == null ? '' : userAnswer).trim()
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, '').trim();
  if (!stripped || /^[\s\p{P}\p{S}]+$/u.test(stripped)) return { correct: false };
  const MODEL = 'claude-haiku-4-5-20251001';
  const result = await callClaudeDirect({
    model: MODEL,
    system: prompts.buildSystem('grade'),
    messages: [{ role: 'user', content:
      `Problem: ${question}\nStudent's answer: ${stripped}\nCorrect answer: ${correctAnswer}` }],
    max_tokens: 200,
    temperature: 0,
  });
  if (result.usage) {
    db.recordAiUsage({
      userId: u.id, userEmail: u.email, intent: 'grade', model: MODEL,
      inputTokens: result.usage.input_tokens || 0,
      outputTokens: result.usage.output_tokens || 0,
      cacheReadTokens: result.usage.cache_read_input_tokens || 0,
      cacheCreationTokens: result.usage.cache_creation_input_tokens || 0,
      costUsd: computeCost(MODEL, result.usage),
    }).catch(err => console.error('recordAiUsage (pod grade) failed:', err && err.message));
  }
  const m = result.text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('grade: no JSON in response');
  return { correct: !!JSON.parse(m[0]).correct };
}

// LaTeX-aware fallback, used only when the AI grader can't be reached. Handles
// the common cases (fractions, wrapper commands) far better than a raw
// exact-string compare, though the AI grader remains the real check.
function _localAnswerMatch(a, b) {
  const norm = s => String(s == null ? '' : s).toLowerCase()
    .replace(/\\[tdc]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '$1/$2') // \frac{1}{3} → 1/3
    .replace(/\\[a-z]+/g, '')                                        // other LaTeX commands
    .replace(/[{}\\$()\s'".,;:%!]/g, '');
  const na = norm(a);
  return na.length > 0 && na === norm(b);
}

async function handlePostPODAttempt(req, res) {
  const u = await currentUser(req);
  if (!u) return json(res, 401, { error: 'Sign in to answer.' });
  const body = await readJSON(req);
  const profile = await _buildPODProfile(u.id);
  const today = _getUserToday(profile.timezone);
  // Grade against the user's pick (created in handleGetPOD). If somehow
  // the client posts before fetching, pick + cache now.
  let pick = await db.getUserPODPick(u.id, today);
  if (!pick) {
    pick = _pickPersonalisedPOD(profile, today);
    if (!pick) return json(res, 404, { error: 'No problem today.' });
    try { await db.saveUserPODPick(u.id, today, pick); }
    catch (_) { /* race with another tab; fine */ }
  }
  const userAnswer = String((body && body.answer) || '').trim();
  if (!userAnswer) return json(res, 400, { error: 'Answer required.' });
  // Grade with the AI grader (LaTeX / equivalent-form aware). Only fall back
  // to a local match if the AI call fails, so a right answer is never wrongly
  // rejected just because the canonical answer is stored as LaTeX.
  let correct;
  try {
    correct = (await _aiGradePODAnswer(u, pick.question_text, userAnswer, pick.correct_answer)).correct;
  } catch (e) {
    console.warn('POD AI grade failed, using local fallback:', e && e.message);
    correct = _localAnswerMatch(userAnswer, pick.correct_answer);
  }
  const previous = await db.getMyPODAttempt(u.id, today);
  await db.recordPODAttempt(u.id, today, userAnswer, correct);
  if (correct && (!previous || !previous.correct)) {
    _awardPointsAsync(u.id, POINT_VALUES.pod_solved);
  }
  const stats = await db.getPODStats(today);
  json(res, 200, {
    correct,
    correct_answer: correct ? null : pick.correct_answer,
    solution: pick.solution || null,
    stats,
  });
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

// Curriculum-driven prebuild jobs. Iterates curriculum_courses +
// units + lessons and produces synthetic legacy-shaped jobs so the
// existing worker pipeline can pre-generate per-lesson AI content
// keyed on the same synthetic ids the runtime UI uses (curr:<id>,
// curr:<id>:u<n>, lessonIdxInUnit). Each job carries the curriculum
// lesson metadata so the lesson prompt is calibrated to the
// learning objective, vocabulary, real-world hook, etc.
async function buildCurriculumJobList(opts) {
  const onlySectionIdx = (opts.onlySection === null || opts.onlySection === undefined || opts.onlySection === '')
    ? null : Number(opts.onlySection);
  const onlySectionKind = opts.onlySectionKind || null;
  // Resolve curriculum-side course id. The dropdown values use a
  // "curr:<id>" prefix to distinguish from legacy course slugs.
  const wantCurrId = (opts.onlyCourse && opts.onlyCourse.startsWith('curr:'))
    ? opts.onlyCourse.slice('curr:'.length)
    : null;

  const jobs = [];
  const courses = await db.listCurriculumCourses({});
  for (const cc of courses) {
    if (wantCurrId && cc.id !== wantCurrId) continue;
    // If onlyCourse points at a LEGACY id, this curriculum course
    // isn't selected (the legacy job builder will pick up that path).
    if (opts.onlyCourse && !opts.onlyCourse.startsWith('curr:')) continue;
    const full = await db.getCurriculumCourseFull(cc.id);
    if (!full) continue;
    const synthCourseId = `curr:${full.id}`;
    for (const u of (full.units || [])) {
      const synthBookId = `${synthCourseId}:u${u.unit_number}`;
      if (opts.onlyBook && opts.onlyBook !== synthBookId) continue;
      const lessons = u.lessons || [];
      lessons.forEach((l, sectionIdx) => {
        if (onlySectionIdx !== null && sectionIdx !== onlySectionIdx) return;
        if (onlySectionKind && onlySectionKind !== 'section') return;
        jobs.push({
          courseId: synthCourseId,
          bookId: synthBookId,
          sectionIdx,
          sectionKind: 'section',
          courseTitle: full.title,
          bookTitle: u.unit_title,
          sectionTitle: l.lesson_title,
          sampleQuestions: [],
          curriculumLesson: {
            learning_objective: l.learning_objective || null,
            key_concepts: l.key_concepts || null,
            prerequisites: l.prerequisites || null,
            key_vocabulary: l.key_vocabulary || null,
            common_misconceptions: l.common_misconceptions || null,
            real_world_hook: l.real_world_hook || null,
            ccss_code: l.ccss_code || null,
            practices: l.practices || null,
          },
        });
      });
    }
  }
  return jobs;
}

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
        curriculumLesson: job.curriculumLesson || null,
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
          // Increment only `skipped`; `done` is incremented in the
          // finally block below. The previous code bumped `done` here
          // AND in finally, producing a 200% progress reading.
          if (cached) { prebuildState.skipped++; continue; }
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
  // Legacy courses (courses.js -> *-data.js) and curriculum courses
  // (curriculum_* tables imported from xlsx) are both eligible for
  // prebuild. The course dropdown values are either a legacy slug
  // ("prealgebra") or "curr:<id>" ("curr:grade6") which lets us tell
  // them apart.
  const legacyJobs = buildJobList(courses, opts);
  const currJobs  = await buildCurriculumJobList(opts);
  const jobs = legacyJobs.concat(currJobs);
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
    // Apply referral perks (referee's free first month + any earned reward
    // months) as extra trial days. Redemption is marked on the webhook once the
    // subscription actually exists, so an abandoned checkout keeps the perk.
    const refState = (await db.getProgress(u.id, REFERRAL_KEY)) || {};
    const perk = refLib.checkoutPerk(refState);
    const url = await stripeLib.createCheckoutSession(u, db, plan, {
      trialDays: perk.trialDays,
      referralMeta: perk.meta,
    });
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
      // Referral settlement — once per subscription (guarded by subscriptionCounted):
      //  • mark the subscriber's applied perks (free first month / reward months) as spent
      //  • credit the referrer one free month for bringing this person in
      if (event.type === 'customer.subscription.created') {
        try {
          const refState = refLib.normalize(await db.getProgress(user.id, REFERRAL_KEY));
          if (!refState.subscriptionCounted) {
            const meta = obj.metadata || {};
            const applied = {
              signupApplied: meta.atrium_ref_signup === '1',
              rewardMonthsApplied: parseInt(meta.atrium_ref_reward_months, 10) || 0,
            };
            let newState = refLib.redeem(refState, applied);
            newState.subscriptionCounted = true;
            if (newState.referredBy) {
              const referrer = await db.getUser(newState.referredBy);
              if (referrer) {
                const rState = await db.getProgress(referrer.id, REFERRAL_KEY);
                await db.setProgress(referrer.id, REFERRAL_KEY, refLib.accrueReward(rState));
              }
            }
            await db.setProgress(user.id, REFERRAL_KEY, newState);
          }
        } catch (e) { console.warn('referral settlement failed:', e && e.message); }
      }
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

  // Enrich personalised intents with the student's mastery profile.
  const PERSONALISED_INTENTS = ['lesson', 'hint', 'mistake', 'chat'];
  if (body && PERSONALISED_INTENTS.includes(body.intent)) {
    try {
      const me2 = await currentUser(req);
      if (me2) {
        const ins = await db.getStudentInsights(me2.id);
        const ov = ins.overview || {};
        const mastered = ov.sectionsMastered || 0;
        const attempted = ov.sectionsAttempted || 0;
        const acc = ov.overallAccuracy || 0;
        const trend = ins.recentTrend || 'steady';
        const hints = ov.totalHintsUsed || 0;

        const strengthLines = (ins.strengths || []).slice(0, 5).map(
          s => `${s.course_id} ${s.section_kind} sec${s.section_idx} (${s.mastery_level}, avg ${Math.round(Number(s.avg_score))}%)`
        );
        const weakLines = (ins.weaknesses || []).slice(0, 5).map(
          w => `${w.course_id} ${w.section_kind} sec${w.section_idx} (${w.mastery_level}, avg ${Math.round(Number(w.avg_score))}%)`
        );

        let ctx = `Student mastery profile:\n- Overall accuracy: ${acc}%. Trend: ${trend}. Sections mastered: ${mastered}/${attempted || mastered}.`;
        if (strengthLines.length) ctx += `\n- Strengths: ${strengthLines.join('; ')}.`;
        if (weakLines.length) ctx += `\n- Struggling with: ${weakLines.join('; ')}.`;
        if (hints > 0) ctx += `\n- Total hints used: ${hints}.`;

        // Behavior signals (rushing, struggling, focused, etc.)
        try {
          const signals = await db.getBehaviorSignals(me2.id, 5);
          if (signals.length) {
            const sigLines = signals.map(s => `${s.signal_type} (confidence ${s.confidence})`);
            ctx += `\n- Recent behavior signals: ${sigLines.join(', ')}.`;
          }
        } catch (_) { /* non-fatal */ }

        // Append to system_extra so it ends up in the non-cached dynamic block.
        body.system_extra = body.system_extra
          ? body.system_extra + '\n\n' + ctx
          : ctx;
      }
    } catch (e) {
      // Non-fatal: mastery enrichment failure must not break the AI call.
      console.warn('proxyClaude: mastery enrichment failed', e.message || e);
    }
  }

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
    // Time tracking + activity rollups.
    if (url === '/api/me/heartbeat' && req.method === 'POST') return await handleHeartbeat(req, res);
    if (url === '/api/me/activity-summary' && req.method === 'GET') return await handleGetMyActivitySummary(req, res);
    // Gamification.
    if (url === '/api/me/streaks' && req.method === 'GET') return await handleGetMyStreaks(req, res);
    if (url === '/api/me/achievements' && req.method === 'GET') return await handleGetMyAchievements(req, res);
    if (url === '/api/me/points' && req.method === 'GET') return await handleGetMyPoints(req, res);
    // Rewards shop.
    if (url === '/api/me/shop' && req.method === 'GET') return await handleGetShop(req, res);
    if (url === '/api/me/shop/buy' && req.method === 'POST') return await handleShopBuy(req, res);
    if (url === '/api/me/shop/equip' && req.method === 'POST') return await handleShopEquip(req, res);
    if (url === '/api/me/referral' && req.method === 'GET') return await handleGetReferral(req, res);
    if (url.startsWith('/api/school-districts/search') && req.method === 'GET') return await handleSearchSchoolDistricts(req, res);
    if (url === '/api/me/survey' && req.method === 'POST') return await handleSaveSurvey(req, res);
    if (url === '/api/me/survey/skip' && req.method === 'POST') return await handleSkipSurvey(req, res);
    if (url === '/api/me/account/delete' && req.method === 'POST') return await handleDeleteAccount(req, res);
    if (url === '/api/photo-atrium/solve' && req.method === 'POST') return await handlePhotoSolve(req, res);
    if (url === '/api/photo-atrium/re-solve' && req.method === 'POST') return await handlePhotoReSolve(req, res);
    if (url === '/api/photo-atrium/list' && req.method === 'GET') return await handlePhotoList(req, res);
    if (url.startsWith('/api/photo-atrium/') && req.method === 'GET') {
      const id = url.slice('/api/photo-atrium/'.length);
      return await handlePhotoGet(req, res, id);
    }
    if (url.startsWith('/api/photo-atrium/') && req.method === 'DELETE') {
      const id = url.slice('/api/photo-atrium/'.length);
      return await handlePhotoDelete(req, res, id);
    }
    if (url === '/api/leaderboard' && req.method === 'GET') return await handleGetLeaderboard(req, res);
    if (url === '/api/problem-of-day' && req.method === 'GET') return await handleGetPOD(req, res);
    if (url === '/api/problem-of-day/attempt' && req.method === 'POST') return await handlePostPODAttempt(req, res);
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
    if (url === '/api/me/links/pending' && req.method === 'GET') return await handleListPendingLinks(req, res);
    if (url.startsWith('/api/me/links/') && url.endsWith('/approve') && req.method === 'POST') {
      const id = url.slice('/api/me/links/'.length, -('/approve'.length));
      return await handleApproveLink(req, res, id);
    }
    if (url.startsWith('/api/me/links/') && url.endsWith('/reject') && req.method === 'POST') {
      const id = url.slice('/api/me/links/'.length, -('/reject'.length));
      return await handleRejectLink(req, res, id);
    }
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
    // Student insights + adaptive difficulty.
    if (url === '/api/student-insights' && req.method === 'GET') return await handleGetStudentInsights(req, res);
    if (url === '/api/section-mastery' && req.method === 'GET') return await handleGetSectionMastery(req, res);
    if (url === '/api/adaptive-difficulty' && req.method === 'GET') return await handleGetAdaptiveDifficulty(req, res);
    // Behavior tracking.
    if (url === '/api/behavior/events' && req.method === 'POST') return await handleBehaviorEvents(req, res);
    if (url === '/api/behavior/summary' && req.method === 'GET') return await handleBehaviorSummary(req, res);
    // Admin (only for users where is_admin = true).
    if (url === '/api/admin/stats' && req.method === 'GET') return await handleAdminStats(req, res);
    if (url === '/api/admin/users' && req.method === 'GET') return await handleAdminUsers(req, res);
    if (url === '/api/admin/activity' && req.method === 'GET') return await handleAdminActivity(req, res);
    if (url === '/api/admin/activity-summary' && req.method === 'GET') return await handleGetAdminActivitySummary(req, res);
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
      const m = url.match(/^\/api\/parent\/students\/([0-9a-f-]+)\/(activity|activity-summary|quiz-attempts|weak-sections|progress|profile|study-plan|authorise-reminders)$/);
      if (m) {
        const [, studentId, kind] = m;
        if (req.method === 'GET' && kind === 'activity') return await handleStudentActivity(req, res, studentId);
        if (req.method === 'GET' && kind === 'activity-summary') return await handleGetParentStudentSummary(req, res, studentId);
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

// Auto-migrate: apply db/schema.sql on startup (Postgres only, idempotent).
(async () => {
  if (db.backend === 'postgres' && db._pool) {
    try {
      const fs = require('fs');
      const path = require('path');
      const sql = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
      await db._pool.query(sql);
      console.log('🗄  Auto-migration: schema.sql applied');
    } catch (e) {
      console.error('⚠️  Auto-migration failed (non-fatal):', e.message);
    }
  }
})();

server.listen(PORT, () => {
  console.log(`📚 Atrium Institute running at http://localhost:${PORT}`);
  console.log(`🗄  DB backend: ${db.backend}`);
  console.log(API_KEY ? '✨ Max (AI tutor): enabled' : '⚠️  Max disabled (no ANTHROPIC_API_KEY)');
  console.log(process.env.RESEND_API_KEY ? '📧 Email: Resend' : '📧 Email: console (set RESEND_API_KEY for real email)');
  console.log(`⏱  Rate limit: ${RATE_LIMIT_PER_HOUR} req/hr/IP   💰 Daily cap: ${DAILY_REQUEST_CAP} req/day`);
});

// Exposed for tests only. Requiring this file also starts the server (harmless
// in tests — they exit after asserting). Not used by the production entrypoint.
module.exports = {
  _measuredLevels, _targetDifficulty, _pickPersonalisedPOD, _buildCandidatePool, _buildPODProfile,
  processStripeEvent,
};
