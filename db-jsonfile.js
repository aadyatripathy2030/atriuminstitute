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
    state = { users: [], codes: [], sessions: [], progress: {} };
  }
  return state;
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

module.exports = {
  backend: 'jsonfile',
  findUser, getUser, upsertUser, markVerified,
  createCode, verifyCode,
  createSession, getSession, deleteSession,
  getProgress, getAllProgress, setProgress,
  cleanup,
};
