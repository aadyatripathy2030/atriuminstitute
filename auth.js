// Frontend auth flow. Email + 6-digit code via /api/auth/*. Signed-in state is
// driven by an HttpOnly cookie set server-side, so nothing sensitive lives in
// localStorage. Role (student / parent) is captured at first sign-up and
// returned on /api/auth/me.

(function () {
  const ROLES = ['student', 'parent'];
  const RESEND_COOLDOWN_SECONDS = 30;
  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];
  let selectedRole = 'student';
  let pendingEmail = null;
  let pendingAge = null;
  let pendingState = null;
  let pendingLinkCode = null;
  let currentUser = null;
  let resendCooldownTimer = null;

  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }

  function showLanding() {
    show(el('landing'));
    hide(el('authGate'));
    hide(el('courses-home'));
    hide(el('home'));
    hide(el('detail'));
    hide(el('about'));
  }

  function showAuthGate() {
    hide(el('landing'));
    hide(el('courses-home'));
    hide(el('home'));
    hide(el('detail'));
    hide(el('about'));
    hide(el('consentGate'));
    hide(el('parentHome'));
    hide(el('parentStudentDetail'));
    show(el('authGate'));
    renderRoleToggle();
    populateStateOptions();
    // Reset to email form.
    show(el('authEmailForm'));
    hide(el('authCodeForm'));
    hide(el('authError'));
    setTimeout(() => el('authEmail') && el('authEmail').focus(), 30);
  }

  function populateStateOptions() {
    const sel = el('authState');
    if (!sel || sel.options.length > 1) return;
    for (const st of US_STATES) {
      const opt = document.createElement('option');
      opt.value = st;
      opt.textContent = st;
      sel.appendChild(opt);
    }
  }

  function showApp() {
    hide(el('landing'));
    hide(el('authGate'));
    show(el('courses-home'));
    if (typeof renderCourses === 'function') renderCourses();
    if (typeof renderProgressPill === 'function') renderProgressPill();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setNavSignedIn(user) {
    currentUser = user;
    const signInBtn = el('navSignInBtn');
    const navUser = el('navUser');
    const navEmail = el('navUserEmail');
    if (signInBtn) hide(signInBtn);
    if (navUser) show(navUser);
    if (navEmail) {
      const label = user.role === 'parent' ? `👪 ${user.email}` : user.email;
      navEmail.textContent = label;
    }
  }

  function setNavSignedOut() {
    currentUser = null;
    const signInBtn = el('navSignInBtn');
    const navUser = el('navUser');
    if (signInBtn) show(signInBtn);
    if (navUser) hide(navUser);
  }

  // Role toggle is injected once into the auth card. The HTML in index.html
  // doesn't ship it, so we add it programmatically the first time we open
  // the gate; that keeps the markup change minimal.
  function renderRoleToggle() {
    if (el('authRoleToggle')) {
      updateRoleToggleUI();
      return;
    }
    const card = document.querySelector('.auth-card');
    const sub = el('authSub');
    if (!card || !sub) return;
    const wrap = document.createElement('div');
    wrap.id = 'authRoleToggle';
    wrap.className = 'auth-role-toggle';
    wrap.innerHTML = `
      <div class="auth-role-label">I'm signing in as a…</div>
      <div class="auth-role-buttons" role="radiogroup" aria-label="Account type">
        <button type="button" class="auth-role-btn" data-role="student" role="radio" aria-checked="true">🎓 Student</button>
        <button type="button" class="auth-role-btn" data-role="parent" role="radio" aria-checked="false">👪 Parent</button>
      </div>
      <div class="auth-role-hint">Pick "Student" if you'll be taking quizzes. Pick "Parent" if you'll be tracking a student.</div>
    `;
    sub.after(wrap);
    wrap.querySelectorAll('.auth-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const role = btn.dataset.role;
        if (!ROLES.includes(role)) return;
        selectedRole = role;
        updateRoleToggleUI();
      });
    });
    updateRoleToggleUI();
  }

  function updateRoleToggleUI() {
    const wrap = el('authRoleToggle');
    if (!wrap) return;
    wrap.querySelectorAll('.auth-role-btn').forEach(btn => {
      const active = btn.dataset.role === selectedRole;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });
  }

  function showError(msg) {
    const e = el('authError');
    if (!e) return;
    e.textContent = msg;
    show(e);
  }
  function clearError() { hide(el('authError')); }

  function setResendStatus(msg, kind) {
    const node = el('authResendStatus');
    if (!node) return;
    if (!msg) {
      node.textContent = '';
      hide(node);
      return;
    }
    node.textContent = msg;
    node.classList.remove('ok', 'err');
    if (kind) node.classList.add(kind);
    show(node);
  }

  function clearResendCooldown() {
    if (resendCooldownTimer) {
      clearInterval(resendCooldownTimer);
      resendCooldownTimer = null;
    }
    const btn = el('authResendCode');
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Send a new code';
    }
  }

  function startResendCooldown() {
    const btn = el('authResendCode');
    if (!btn) return;
    let remaining = RESEND_COOLDOWN_SECONDS;
    btn.disabled = true;
    btn.textContent = `Send a new code (${remaining}s)`;
    if (resendCooldownTimer) clearInterval(resendCooldownTimer);
    resendCooldownTimer = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        clearResendCooldown();
        return;
      }
      btn.textContent = `Send a new code (${remaining}s)`;
    }, 1000);
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      credentials: 'same-origin',
    });
    let data = {};
    try { data = await res.json(); } catch (_) { /* tolerate empty */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  async function checkSession() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch (_) {
      return null;
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault();
    clearError();
    setResendStatus(null);
    const email = (el('authEmail').value || '').trim();
    if (!email) return showError('Enter your email.');
    const ageRaw = (el('authAge').value || '').trim();
    const ageNum = ageRaw ? parseInt(ageRaw, 10) : null;
    if (!ageNum || ageNum < 4 || ageNum > 120) return showError('Enter a valid age between 4 and 120.');
    const stateVal = (el('authState').value || '').trim();
    if (!stateVal) return showError('Pick your state.');
    const linkCodeRaw = (el('authLinkCode').value || '').trim();
    const linkCode = linkCodeRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || null;
    if (linkCode && linkCode.length !== 8) {
      return showError('Link codes are 8 characters (e.g. ABCD-EFGH).');
    }

    const btn = el('authEmailBtn');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';

    try {
      await postJSON('/api/auth/signup', {
        email,
        role: selectedRole,
        age: ageNum,
        state: stateVal,
        linkCode,
      });
      pendingEmail = email;
      pendingAge = ageNum;
      pendingState = stateVal;
      pendingLinkCode = linkCode;
      const show2 = el('authEmailShow');
      if (show2) show2.textContent = `Code sent to ${email}.`;
      hide(el('authEmailForm'));
      show(el('authCodeForm'));
      startResendCooldown();
      setTimeout(() => el('authCode') && el('authCode').focus(), 30);
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  async function handleResendCode() {
    if (!pendingEmail) return;
    clearError();
    setResendStatus(null);
    const btn = el('authResendCode');
    if (btn && btn.disabled) return; // still in cooldown
    try {
      await postJSON('/api/auth/signup', {
        email: pendingEmail,
        role: selectedRole,
        age: pendingAge,
        state: pendingState,
        linkCode: pendingLinkCode,
      });
      setResendStatus(`A new code has been sent to ${pendingEmail}. Check your inbox (and spam).`, 'ok');
      startResendCooldown();
    } catch (err) {
      setResendStatus(err.message || 'Could not resend the code.', 'err');
    }
  }

  async function handleCodeSubmit(e) {
    e.preventDefault();
    clearError();
    const code = (el('authCode').value || '').trim();
    if (!/^\d{6}$/.test(code)) return showError('Code must be 6 digits.');
    if (!pendingEmail) return showError('Please request a code first.');

    const btn = el('authCodeBtn');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Verifying…';

    try {
      const { user } = await postJSON('/api/auth/verify', { email: pendingEmail, code });
      clearResendCooldown();
      setResendStatus(null);
      setNavSignedIn(user);
      enterAppAfterAuth(user);
    } catch (err) {
      showError(err.message);
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  function handleResendDifferentEmail() {
    pendingEmail = null;
    el('authCode').value = '';
    clearError();
    setResendStatus(null);
    clearResendCooldown();
    hide(el('authCodeForm'));
    show(el('authEmailForm'));
    el('authEmail').focus();
  }

  function showConsentGate(user) {
    hide(el('landing'));
    hide(el('authGate'));
    hide(el('courses-home'));
    hide(el('home'));
    hide(el('detail'));
    hide(el('parentHome'));
    hide(el('parentStudentDetail'));
    show(el('consentGate'));
    const codeEl = el('consentLinkCode');
    if (codeEl) {
      const c = (user && user.link_code) || '';
      codeEl.textContent = c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : '————————';
    }
    const nameEl = el('consentName');
    if (nameEl) nameEl.textContent = (user && user.email) ? user.email.split('@')[0] : 'friend';
  }

  function enterAppAfterAuth(user) {
    if (user.role === 'parent') {
      if (typeof window.showParentDashboard === 'function') {
        window.showParentDashboard(user);
      } else {
        showApp();
      }
      return;
    }
    if (user.consent_required && !user.consent_granted_at) {
      showConsentGate(user);
      return;
    }
    const profile = (typeof loadProfile === 'function') ? loadProfile() : null;
    if (!profile && typeof startOnboarding === 'function') {
      hide(el('authGate'));
      hide(el('landing'));
      startOnboarding();
      return;
    }
    showApp();
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (_) { /* ignore */ }
    setNavSignedOut();
    pendingEmail = null;
    showLanding();
  }

  // Landing CTAs call openAuth(). If already signed in, jump straight in.
  window.openAuth = function () {
    if (currentUser) {
      enterAppAfterAuth(currentUser);
    } else {
      showAuthGate();
    }
  };

  // Exposed so other code (e.g. app.js) can ask who the user is.
  window.getCurrentUser = function () { return currentUser; };

  async function handleConsentRefresh() {
    const user = await checkSession();
    if (!user) return;
    setNavSignedIn(user);
    if (user.consent_granted_at) {
      enterAppAfterAuth(user);
    }
  }

  async function init() {
    // Wire static buttons.
    const emailForm = el('authEmailForm');
    if (emailForm) emailForm.addEventListener('submit', handleEmailSubmit);
    const codeForm = el('authCodeForm');
    if (codeForm) codeForm.addEventListener('submit', handleCodeSubmit);
    const resend = el('authResend');
    if (resend) resend.addEventListener('click', handleResendDifferentEmail);
    const resendCode = el('authResendCode');
    if (resendCode) resendCode.addEventListener('click', handleResendCode);
    const signInBtn = el('navSignInBtn');
    if (signInBtn) signInBtn.addEventListener('click', () => window.openAuth());
    const signOutBtn = el('signOutBtn');
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    // Consent gate buttons
    const consentRefresh = el('consentRefreshBtn');
    if (consentRefresh) consentRefresh.addEventListener('click', handleConsentRefresh);
    const consentSignOut = el('consentSignOut');
    if (consentSignOut) consentSignOut.addEventListener('click', handleSignOut);
    const consentCopy = el('consentCopyBtn');
    if (consentCopy) consentCopy.addEventListener('click', () => {
      const code = (el('consentLinkCode').textContent || '').replace('-', '');
      if (code && code !== '————————') {
        try { navigator.clipboard.writeText(code); } catch (_) { /* ignore */ }
      }
    });

    showLanding();
    const user = await checkSession();
    if (user) {
      setNavSignedIn(user);
      // If the user is mid-flow (parent or consent-gated), drop them on the
      // right view immediately rather than waiting for a CTA click.
      if (user.role === 'parent') {
        enterAppAfterAuth(user);
      } else if (user.consent_required && !user.consent_granted_at) {
        showConsentGate(user);
      }
    } else {
      setNavSignedOut();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
