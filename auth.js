// Email-based auth: signup-or-login → 6-digit verification code → 30-day session.
// Also handles pulling per-user progress from the server on sign-in.

(function() {
  const PROGRESS_KEYS = [
    'mathcourse_scores_v2',
    'mathcourse_profile_v1',
    'mathcourse_extra_sections_v1',
    'mathcourse_extra_cum_v1'
  ];

  let pendingEmail = '';

  // ---------- API helpers ----------
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      credentials: 'same-origin'
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  }

  // ---------- UI ----------
  function showGate(initialError) {
    document.getElementById('authGate').classList.remove('hidden');
    document.getElementById('authEmailForm').classList.remove('hidden');
    document.getElementById('authCodeForm').classList.add('hidden');
    if (initialError) showError(initialError);
    setTimeout(() => document.getElementById('authEmail').focus(), 50);
  }

  function hideGate() {
    document.getElementById('authGate').classList.add('hidden');
  }

  function showError(msg) {
    const el = document.getElementById('authError');
    el.textContent = msg;
    el.classList.remove('hidden');
  }
  function hideError() { document.getElementById('authError').classList.add('hidden'); }

  function showCodeStep(email) {
    pendingEmail = email;
    document.getElementById('authEmailForm').classList.add('hidden');
    document.getElementById('authCodeForm').classList.remove('hidden');
    document.getElementById('authEmailShow').textContent = `Code sent to ${email}`;
    document.getElementById('authSub').textContent = 'Check your inbox (and spam folder). Enter the 6-digit code we just sent.';
    hideError();
    setTimeout(() => document.getElementById('authCode').focus(), 50);
  }

  function showEmailStep() {
    pendingEmail = '';
    document.getElementById('authCodeForm').classList.add('hidden');
    document.getElementById('authEmailForm').classList.remove('hidden');
    document.getElementById('authSub').textContent = "Enter your email to sign in or create an account. We'll send you a 6-digit code — no password to remember.";
    hideError();
    setTimeout(() => document.getElementById('authEmail').focus(), 50);
  }

  function showSignedInChip(email) {
    document.getElementById('navUser').classList.remove('hidden');
    document.getElementById('navUserEmail').textContent = email;
  }
  function hideSignedInChip() {
    document.getElementById('navUser').classList.add('hidden');
  }

  // ---------- Progress sync ----------
  // Pull all server-side progress into localStorage on sign-in.
  async function pullProgress() {
    const { ok, data } = await api('/api/progress');
    if (!ok) return;
    const p = data.progress || {};
    for (const key of PROGRESS_KEYS) {
      if (p[key] !== undefined && p[key] !== null) {
        try { localStorage.setItem(key, JSON.stringify(p[key])); }
        catch (_) {}
      }
    }
  }

  // Best-effort: POST a key/value to /api/progress without blocking.
  function pushProgress(key, value) {
    if (!window.__atriumSignedIn) return;
    fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ key, data: value })
    }).catch(() => {});
  }

  // Wrap localStorage.setItem so any save we already do is mirrored to the server.
  function installSyncHook() {
    const origSet = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      origSet.call(this, key, value);
      if (PROGRESS_KEYS.includes(key)) {
        try { pushProgress(key, JSON.parse(value)); } catch (_) { pushProgress(key, value); }
      }
    };
  }

  // Expose for the rest of the app to use.
  window.AtriumAuth = {
    isSignedIn: () => !!window.__atriumSignedIn,
    pullProgress
  };

  function showLanding() {
    document.getElementById('landing').classList.remove('hidden');
    document.getElementById('courses-home').classList.add('hidden');
    document.getElementById('home').classList.add('hidden');
    document.getElementById('detail').classList.add('hidden');
    document.getElementById('about').classList.add('hidden');
    document.getElementById('navSignInBtn').classList.remove('hidden');
    document.getElementById('progressPill').classList.add('hidden');
  }

  function hideLanding() {
    document.getElementById('landing').classList.add('hidden');
    document.getElementById('navSignInBtn').classList.add('hidden');
    document.getElementById('progressPill').classList.remove('hidden');
  }

  // Expose so onclick handlers in the landing HTML can open the modal.
  window.openAuth = function() {
    document.getElementById('authGate').classList.remove('hidden');
    document.getElementById('authEmailForm').classList.remove('hidden');
    document.getElementById('authCodeForm').classList.add('hidden');
    hideError();
    setTimeout(() => document.getElementById('authEmail').focus(), 50);
  };

  // ---------- Flow ----------
  async function checkSession() {
    const { ok, data } = await api('/api/auth/me');
    if (ok && data.user) {
      window.__atriumSignedIn = true;
      window.__atriumUser = data.user;
      showSignedInChip(data.user.email);
      await pullProgress();
      hideGate();
      hideLanding();
      // Show the courses screen now that we're signed in.
      document.getElementById('courses-home').classList.remove('hidden');
      if (typeof renderCourses === 'function') renderCourses();
      if (typeof renderProgressPill === 'function') renderProgressPill();
    } else {
      window.__atriumSignedIn = false;
      hideSignedInChip();
      showLanding();
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    hideError();
    const btn = document.getElementById('authEmailBtn');
    const email = document.getElementById('authEmail').value.trim();
    btn.disabled = true; btn.textContent = 'Sending…';
    const { ok, data } = await api('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email }) });
    btn.disabled = false; btn.textContent = 'Send code';
    if (!ok) return showError(data.error || 'Could not send code.');
    showCodeStep(email);
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    hideError();
    const btn = document.getElementById('authCodeBtn');
    const code = document.getElementById('authCode').value.trim();
    if (!/^\d{6}$/.test(code)) return showError('Code must be 6 digits.');
    btn.disabled = true; btn.textContent = 'Verifying…';
    const { ok, data } = await api('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ email: pendingEmail, code })
    });
    btn.disabled = false; btn.textContent = 'Verify & sign in';
    if (!ok) return showError(data.error || 'Could not verify.');
    window.__atriumSignedIn = true;
    window.__atriumUser = data.user;
    showSignedInChip(data.user.email);
    await pullProgress();
    hideGate();
    hideLanding();
    document.getElementById('courses-home').classList.remove('hidden');
    if (typeof renderCourses === 'function') renderCourses();
    if (typeof renderProgressPill === 'function') renderProgressPill();
  }

  async function handleSignOut() {
    await api('/api/auth/logout', { method: 'POST' });
    window.__atriumSignedIn = false;
    window.__atriumUser = null;
    // Clear local progress so a different sign-in starts clean.
    for (const k of PROGRESS_KEYS) localStorage.removeItem(k);
    location.reload();
  }

  function init() {
    installSyncHook();
    document.getElementById('authEmailForm').addEventListener('submit', handleEmailSubmit);
    document.getElementById('authCodeForm').addEventListener('submit', handleCodeSubmit);
    document.getElementById('authResend').addEventListener('click', showEmailStep);
    document.getElementById('signOutBtn').addEventListener('click', handleSignOut);
    document.getElementById('navSignInBtn').addEventListener('click', () => window.openAuth());
    // Close the modal if the user clicks outside the card.
    document.getElementById('authGate').addEventListener('click', (e) => {
      if (e.target.id === 'authGate') document.getElementById('authGate').classList.add('hidden');
    });
    checkSession();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
