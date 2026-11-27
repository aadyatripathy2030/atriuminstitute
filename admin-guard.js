// Admin access control. The admin panel belongs to exactly one account:
// OWNER_EMAIL. Every /api/admin request passes all of these checks:
//
//   1. A custom request header (X-Atrium-Admin: 1) and, for writes, an
//      Origin/Referer from this site. Browsers can't send either from
//      another site without a CORS preflight, which we never grant, so
//      cross-site request forgery can't reach an admin endpoint.
//   2. A signed-in, verified session whose email is exactly OWNER_EMAIL.
//      The users.is_admin flag is NOT trusted on its own, and no env var,
//      database row or admin action can add another admin.
//   3. A step-up unlock: a fresh 6-digit code emailed to OWNER_EMAIL,
//      exchanged for a separate admin cookie (HttpOnly, SameSite=Strict,
//      Secure in production) that is bound to the current login session
//      and expires after 30 idle minutes or 2 hours in total.
//   4. Rate limits on the panel, on code sends and on code guesses, with a
//      lockout after repeated wrong codes.
//
// Everything the panel does, and every denied attempt, is written to an
// audit log, and the owner gets an email each time the panel is unlocked.

const crypto = require('crypto');

const OWNER_EMAIL = 'atriuminstitutereal@gmail.com';

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_SENDS_PER_WINDOW = 3;
const SEND_WINDOW_MS = 15 * 60 * 1000;
const MAX_GUESSES_PER_CODE = 5;
const LOCKOUT_FAILURES = 8;
const LOCKOUT_MS = 30 * 60 * 1000;
const IDLE_MS = 30 * 60 * 1000;
const ABSOLUTE_MS = 2 * 60 * 60 * 1000;
const REQUESTS_PER_WINDOW = 600;
const REQUEST_WINDOW_MS = 10 * 60 * 1000;
const ADMIN_COOKIE = 'atrium_admin';

const sha256 = s => crypto.createHash('sha256').update(String(s)).digest('hex');
function safeEqual(a, b) {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Exact match on the normalised address. Gmail would also deliver
// "atrium.institutereal@" or "+tag" variants to the same inbox, but those
// are different accounts here and deliberately do not match.
function isOwnerEmail(email) {
  return typeof email === 'string' && email.trim().toLowerCase() === OWNER_EMAIL;
}
function isOwner(user) {
  return !!user && isOwnerEmail(user.email) && !!user.verified;
}

function createGuard({ now = () => Date.now(), secureCookies = false, pool = null, log = console } = {}) {
  const codes = new Map();      // sessionHash -> { hash, expires, guesses }
  const sends = new Map();      // userId -> [timestamps]
  const failures = new Map();   // userId -> [timestamps]
  const lockedUntil = new Map(); // userId -> ms
  const unlocks = new Map();    // tokenHash -> { userId, sessionHash, created, lastSeen, ip }
  const hits = new Map();       // userId -> [timestamps]
  const memAudit = [];
  let auditTableReady = null;

  const prune = (arr, windowMs) => { const t = now(); while (arr.length && t - arr[0] > windowMs) arr.shift(); return arr; };
  const bucket = (map, key) => { if (!map.has(key)) map.set(key, []); return map.get(key); };

  // ---- Audit log ----
  async function ensureAuditTable() {
    if (!pool) return false;
    if (!auditTableReady) {
      auditTableReady = pool.query(`create table if not exists admin_audit_log (
        id bigserial primary key, at timestamptz not null default now(), user_id text, email text,
        ip text, user_agent text, action text not null, outcome text not null, detail text)`)
        .then(() => true, e => { auditTableReady = null; log.error('admin audit table:', e.message); return false; });
    }
    return auditTableReady;
  }
  async function audit(entry) {
    const row = { at: new Date(now()).toISOString(), ...entry };
    memAudit.push(row); if (memAudit.length > 500) memAudit.shift();
    if (entry.outcome !== 'ok') log.warn(`[admin-audit] ${entry.outcome} ${entry.action} ${entry.email || '-'} ${entry.ip || '-'}`);
    try {
      if (await ensureAuditTable()) {
        await pool.query(
          'insert into admin_audit_log (user_id, email, ip, user_agent, action, outcome, detail) values ($1,$2,$3,$4,$5,$6,$7)',
          [row.userId || null, row.email || null, row.ip || null, (row.userAgent || '').slice(0, 300) || null,
           row.action, row.outcome, row.detail ? String(row.detail).slice(0, 500) : null]);
      }
    } catch (e) { log.error('admin audit write failed:', e.message); }
  }
  async function recentAudit(limit = 200) {
    if (await ensureAuditTable()) {
      const { rows } = await pool.query(
        'select at, email, ip, user_agent, action, outcome, detail from admin_audit_log order by id desc limit $1', [limit]);
      return rows;
    }
    return memAudit.slice(-limit).reverse();
  }

  // ---- Request shape (CSRF) ----
  function sameOrigin(req) {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const src = req.headers.origin || req.headers.referer;
    if (!src || !host) return false;
    try { return new URL(src).host === host; } catch { return false; }
  }
  function requestShapeOk(req) {
    if (req.headers['x-atrium-admin'] !== '1') return false;
    if (req.method !== 'GET' && req.method !== 'HEAD' && !sameOrigin(req)) return false;
    return true;
  }

  // ---- Step-up codes ----
  function isLocked(userId) {
    const until = lockedUntil.get(userId) || 0;
    if (until > now()) return Math.ceil((until - now()) / 60000);
    return 0;
  }
  // Returns { ok, code } or { ok:false, reason, retryMinutes }.
  function issueCode(userId, sessionToken) {
    const mins = isLocked(userId);
    if (mins) return { ok: false, reason: 'locked', retryMinutes: mins };
    const s = prune(bucket(sends, userId), SEND_WINDOW_MS);
    if (s.length >= CODE_SENDS_PER_WINDOW) return { ok: false, reason: 'rate', retryMinutes: Math.ceil((SEND_WINDOW_MS - (now() - s[0])) / 60000) };
    s.push(now());
    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    codes.set(sha256(sessionToken), { hash: sha256(code), expires: now() + CODE_TTL_MS, guesses: 0 });
    return { ok: true, code };
  }
  // Returns { ok, token } or { ok:false, reason }.
  function verifyCode(userId, sessionToken, code, ip) {
    if (isLocked(userId)) return { ok: false, reason: 'locked' };
    const key = sha256(sessionToken);
    const entry = codes.get(key);
    if (!entry || entry.expires < now()) { codes.delete(key); return { ok: false, reason: 'expired' }; }
    const good = /^\d{6}$/.test(String(code || '')) && safeEqual(sha256(code), entry.hash);
    if (!good) {
      entry.guesses++;
      if (entry.guesses >= MAX_GUESSES_PER_CODE) codes.delete(key);
      const f = prune(bucket(failures, userId), LOCKOUT_MS);
      f.push(now());
      if (f.length >= LOCKOUT_FAILURES) { lockedUntil.set(userId, now() + LOCKOUT_MS); codes.delete(key); return { ok: false, reason: 'locked' }; }
      return { ok: false, reason: 'invalid' };
    }
    codes.delete(key);
    failures.delete(userId);
    const token = crypto.randomBytes(32).toString('hex');
    unlocks.set(sha256(token), { userId, sessionHash: key, created: now(), lastSeen: now(), ip: ip || null });
    return { ok: true, token };
  }

  // ---- Unlock tokens ----
  function checkUnlock(userId, sessionToken, adminToken) {
    if (!adminToken || !sessionToken) return null;
    const key = sha256(adminToken);
    const u = unlocks.get(key);
    if (!u) return null;
    const t = now();
    if (u.userId !== userId || !safeEqual(u.sessionHash, sha256(sessionToken))
        || t - u.lastSeen > IDLE_MS || t - u.created > ABSOLUTE_MS) {
      unlocks.delete(key);
      return null;
    }
    u.lastSeen = t;
    return { expiresAt: new Date(Math.min(u.created + ABSOLUTE_MS, t + IDLE_MS)).toISOString() };
  }
  function lock(adminToken) { if (adminToken) unlocks.delete(sha256(adminToken)); }
  function lockAllFor(userId) { for (const [k, u] of unlocks) if (u.userId === userId) unlocks.delete(k); }

  function rateOk(userId) {
    const h = prune(bucket(hits, userId), REQUEST_WINDOW_MS);
    if (h.length >= REQUESTS_PER_WINDOW) return false;
    h.push(now());
    return true;
  }

  function cookieHeader(token) {
    const maxAge = Math.floor(ABSOLUTE_MS / 1000);
    return `${ADMIN_COOKIE}=${token}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secureCookies ? '; Secure' : ''}`;
  }
  function clearCookieHeader() {
    return `${ADMIN_COOKIE}=; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=0${secureCookies ? '; Secure' : ''}`;
  }

  return {
    audit, recentAudit, requestShapeOk, issueCode, verifyCode, checkUnlock, lock, lockAllFor, rateOk,
    cookieHeader, clearCookieHeader, isLocked,
    _state: { codes, unlocks },
  };
}

module.exports = { OWNER_EMAIL, ADMIN_COOKIE, isOwner, isOwnerEmail, createGuard, IDLE_MS, ABSOLUTE_MS };
