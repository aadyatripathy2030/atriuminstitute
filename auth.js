// Frontend auth flow. Email + 6-digit code via /api/auth/*. Signed-in state is
// driven by an HttpOnly cookie set server-side, so nothing sensitive lives in
// localStorage. Role (student / parent) is captured at first sign-up and
// returned on /api/auth/me.

(function () {
  const ROLES = ['student', 'parent'];
  const RESEND_COOLDOWN_SECONDS = 30;
  // Curated list of countries. Common picks at the top, then the rest alphabetical.
  // Spelled out in full (no ISO codes, no abbreviations).
  const COUNTRIES = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'India',
    '— — —',
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Austria', 'Azerbaijan',
    'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
    'Cambodia', 'Cameroon', 'Cape Verde', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
    'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
    'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
    'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
    'Haiti', 'Honduras', 'Hungary',
    'Iceland', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
    'Jamaica', 'Japan', 'Jordan',
    'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
    'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
    'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar',
    'Romania', 'Russia', 'Rwanda',
    'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'Uruguay', 'Uzbekistan',
    'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
    'Yemen',
    'Zambia', 'Zimbabwe',
  ];
  // Surface the country list so profile.js can offer the same dropdown.
  window.ATRIUM_COUNTRIES = COUNTRIES;

  // US state postal codes (50 states + DC). Used when country = United States
  // so the school-district autocomplete can filter to one state.
  const US_STATES = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'],
    ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'],
    ['DC', 'District of Columbia'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'],
    ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'],
    ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
    ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'],
    ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'],
    ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'],
    ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'],
    ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
    ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'],
    ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'],
    ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming'],
  ];
  window.ATRIUM_US_STATES = US_STATES;

  let selectedRole = 'student';
  let authMode = 'signin'; // 'signin' | 'signup' — only signup collects age/country/role/linkCode
  let pendingEmail = null;
  let pendingAge = null;
  let pendingGrade = null;
  let pendingCountry = null;
  let pendingLinkCode = null;
  let pendingSchool = null;
  let pendingDistrict = null;
  let pendingIsPrivate = null;
  let pendingState = null;
  let currentUser = null;
  let resendCooldownTimer = null;
  let districtSuggestTimer = null;

  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }

  // Every top-level "page" we can show. Listing them here lets every
  // navigation entry point (logo click, showApp, showLanding, parent
  // dashboard, etc.) cleanly hide everything else without each handler
  // needing its own list.
  const TOP_LEVEL_IDS = [
    'landing', 'authGate', 'consentGate',
    'courses-home', 'home', 'detail', 'study', 'onboard',
    'about', 'whyAtrium', 'faq', 'contact', 'privacy', 'terms',
    'parentHome', 'parentStudentDetail',
    'profilePage', 'activityPage', 'tokenUsagePage', 'adminPage',
    'curriculumPage', 'favoritesPage', 'achievementsPage', 'leaderboardPage',
    'photoAtriumScannerPage', 'photoAtriumResultPage', 'photoAtriumListPage',
  ];
  function hideAllTopLevel() {
    for (const id of TOP_LEVEL_IDS) hide(el(id));
  }
  // Exposed so parent.js / activity.js / profile.js / tokens.js can all
  // share the same single source of truth for "what counts as a top-level
  // view that should be hidden when we navigate".
  window.hideAllTopLevel = hideAllTopLevel;

  function showLanding() {
    hideAllTopLevel();
    show(el('landing'));
  }

  function showAuthGate(initialMode) {
    hide(el('landing'));
    hide(el('courses-home'));
    hide(el('home'));
    hide(el('detail'));
    hide(el('about'));
    hide(el('consentGate'));
    hide(el('parentHome'));
    hide(el('parentStudentDetail'));
    show(el('authGate'));
    if (initialMode === 'signin' || initialMode === 'signup') authMode = initialMode;
    renderModeToggle();
    renderRoleToggle();
    populateCountryOptions();
    applyModeVisibility();
    // Reset to email form.
    show(el('authEmailForm'));
    hide(el('authCodeForm'));
    hide(el('authError'));
    setTimeout(() => el('authEmail') && el('authEmail').focus(), 30);
  }

  // Tabs at the top of the auth card: Sign in (default, just email) vs
  // Create account (asks role, age — student only — country, link code).
  function renderModeToggle() {
    if (el('authModeToggle')) {
      updateModeToggleUI();
      return;
    }
    const card = document.querySelector('.auth-card');
    const sub = el('authSub');
    if (!card || !sub) return;
    const wrap = document.createElement('div');
    wrap.id = 'authModeToggle';
    wrap.className = 'auth-mode-toggle';
    wrap.innerHTML = `
      <div class="auth-mode-buttons" role="tablist">
        <button type="button" class="auth-mode-btn" data-mode="signin" role="tab" aria-selected="true">Sign in</button>
        <button type="button" class="auth-mode-btn" data-mode="signup" role="tab" aria-selected="false">Create account</button>
      </div>
    `;
    sub.before(wrap);
    wrap.querySelectorAll('.auth-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const m = btn.dataset.mode;
        if (m !== 'signin' && m !== 'signup') return;
        authMode = m;
        updateModeToggleUI();
        applyModeVisibility();
      });
    });
    updateModeToggleUI();
  }

  function updateModeToggleUI() {
    const wrap = el('authModeToggle');
    if (!wrap) return;
    wrap.querySelectorAll('.auth-mode-btn').forEach(btn => {
      const active = btn.dataset.mode === authMode;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    const sub = el('authSub');
    if (sub) {
      sub.textContent = authMode === 'signup'
        ? "We'll send you a 6-digit code by email. No password to remember."
        : 'Enter your email — we\'ll send you a 6-digit code to sign in.';
    }
    const submitBtn = el('authEmailBtn');
    if (submitBtn) submitBtn.textContent = authMode === 'signup' ? 'Create account' : 'Send sign-in code';
  }

  // Show / hide signup-only fields and the role-specific age field based on
  // the current mode and selected role.
  function applyModeVisibility() {
    const isSignup = authMode === 'signup';
    const roleToggle = el('authRoleToggle');
    const fieldRow = document.querySelector('#authEmailForm .auth-field-row');
    const linkWrap = document.querySelector('#authEmailForm .auth-linkcode-wrap');
    const schoolRow = document.querySelector('#authEmailForm .auth-school-row');
    const ageInput = el('authAge');
    const gradeInput = el('authGrade');
    const countryInput = el('authCountry');
    const schoolInput = el('authSchool');
    const ageLabel = ageInput && ageInput.closest('label');
    const gradeLabel = gradeInput && gradeInput.closest('label');
    const countryLabel = countryInput && countryInput.closest('label');

    // Grade, age, country, and state are student-only demographic fields. A
    // parent signs up just to link to a student, so hide the whole demographic
    // row (and the state field, handled in applyUsOnlyVisibility) when the
    // selected role isn't "student".
    const showStudentFields = isSignup && selectedRole === 'student';

    if (roleToggle) roleToggle.style.display = isSignup ? '' : 'none';
    if (fieldRow) fieldRow.style.display = showStudentFields ? '' : 'none';
    if (linkWrap) linkWrap.style.display = isSignup ? '' : 'none';
    if (schoolRow) schoolRow.style.display = isSignup ? '' : 'none';

    if (ageLabel) ageLabel.style.display = showStudentFields ? '' : 'none';
    if (ageInput) ageInput.required = showStudentFields;
    if (gradeLabel) gradeLabel.style.display = showStudentFields ? '' : 'none';
    if (countryLabel) countryLabel.style.display = showStudentFields ? '' : 'none';
    if (countryInput) countryInput.required = showStudentFields;
    if (schoolInput) schoolInput.required = isSignup;

    // Word the school question for whoever is signing up: a parent is
    // answering on behalf of their child, a student for themselves.
    const schoolLabel = el('authSchoolLabel');
    if (schoolLabel) {
      schoolLabel.textContent = selectedRole === 'parent'
        ? 'What school does your child go to?'
        : 'School name';
    }

    applyUsOnlyVisibility();
  }

  // State + district fields only apply when country is United States.
  // Private-school checkbox + district share visibility because the
  // district field is only mandatory when the user is in a US public
  // school. Private school hides the district picker entirely.
  function applyUsOnlyVisibility() {
    const countrySel = el('authCountry');
    const stateLabel = document.querySelector('#authEmailForm .auth-field-state');
    const districtLabel = document.querySelector('#authEmailForm .auth-field-district');
    const privateWrap = el('authPrivateCheckWrap');
    const stateSel = el('authState');
    const districtInput = el('authDistrict');
    const privateBox = el('authPrivate');
    // Country/state only apply to students, so a leftover "United States"
    // value must never re-show the state or district fields for a parent.
    const isStudent = selectedRole === 'student';
    const isUS = isStudent && countrySel && countrySel.value === 'United States';
    const isSignup = authMode === 'signup';
    if (stateLabel) stateLabel.classList.toggle('hidden', !(isSignup && isUS));
    if (privateWrap) privateWrap.classList.toggle('hidden', !(isSignup && isUS));
    // Populate state dropdown lazily.
    if (isSignup && isUS && stateSel && stateSel.options.length <= 1) {
      for (const [code, name] of US_STATES) {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = name;
        stateSel.appendChild(opt);
      }
    }
    // District visibility depends on country = US AND not private school.
    const showDistrict = isSignup && isUS && !(privateBox && privateBox.checked);
    if (districtLabel) districtLabel.classList.toggle('hidden', !showDistrict);
    if (stateSel) stateSel.required = isSignup && isUS;
    if (districtInput) districtInput.required = showDistrict;
  }

  function hideDistrictSuggest() {
    const box = el('authDistrictSuggest');
    if (box) { box.innerHTML = ''; box.classList.add('hidden'); }
  }

  async function refreshDistrictSuggest() {
    const input = el('authDistrict');
    const box = el('authDistrictSuggest');
    const stateSel = el('authState');
    if (!input || !box) return;
    const q = (input.value || '').trim();
    const stateCode = (stateSel && stateSel.value) || '';
    if (q.length < 2 || !stateCode) { hideDistrictSuggest(); return; }
    try {
      const r = await fetch(`/api/school-districts/search?q=${encodeURIComponent(q)}&state=${encodeURIComponent(stateCode)}`, { credentials: 'same-origin' });
      if (!r.ok) { hideDistrictSuggest(); return; }
      const data = await r.json();
      const list = (data && data.results) || [];
      if (!list.length) {
        box.innerHTML = '<div class="auth-suggest-empty">No match. We\'ll save your entry to help the next family in your district.</div>';
        box.classList.remove('hidden');
        return;
      }
      box.innerHTML = list.map(r => `<button type="button" class="auth-suggest-item" data-name="${(r.name || '').replace(/"/g, '&quot;')}">${escapeHTML(r.name)}</button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('.auth-suggest-item').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = btn.dataset.name || '';
          hideDistrictSuggest();
        });
      });
    } catch (_e) { hideDistrictSuggest(); }
  }

  function escapeHTML(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function populateCountryOptions() {
    const sel = el('authCountry');
    if (!sel || sel.options.length > 1) return;
    for (const c of COUNTRIES) {
      const opt = document.createElement('option');
      if (c === '— — —') {
        opt.disabled = true;
        opt.textContent = '─────────────';
      } else {
        opt.value = c;
        opt.textContent = c;
      }
      sel.appendChild(opt);
    }
  }

  function showApp() {
    console.log('[showApp] entry');
    hideAllTopLevel();
    const ch = el('courses-home');
    if (!ch) {
      console.warn('[showApp] #courses-home not in DOM');
      return;
    }
    show(ch);
    if (typeof renderCourses === 'function') {
      try {
        const r = renderCourses();
        if (r && typeof r.then === 'function') r.catch(e => console.warn('[showApp] renderCourses (async) threw:', e && e.message));
      } catch (e) { console.warn('[showApp] renderCourses threw:', e && e.message); }
    } else {
      console.warn('[showApp] renderCourses is not a function');
    }
    if (typeof renderProgressPill === 'function') renderProgressPill();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('[showApp] done. courses-home hidden?', ch.classList.contains('hidden'));
  }

  // Render any pending parent-link invitations the signed-in user can
  // approve or reject. Two-sided approval: another account entered this
  // user's link code and the user must explicitly accept before the
  // link goes active.
  async function renderStudentPendingInvites() {
    const wrap = el('studentPendingInvites');
    if (!wrap) return;
    try {
      const r = await fetch('/api/me/links/pending', { credentials: 'same-origin' });
      if (!r.ok) { wrap.innerHTML = ''; return; }
      const { pending } = await r.json();
      if (!pending || !pending.length) { wrap.innerHTML = ''; return; }
      const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
      wrap.innerHTML = `
        <div class="student-pending-card">
          <div class="student-pending-title">🔔 ${pending.length} link request${pending.length > 1 ? 's' : ''} waiting</div>
          <p class="student-pending-help">Someone typed your link code. Approve only if you recognise the email.</p>
          ${pending.map(p => `
            <div class="student-pending-row" data-id="${esc(p.id)}">
              <div class="student-pending-from"><strong>${esc(p.initiated_by_email)}</strong> · ${esc(p.initiated_by_role)}</div>
              <div class="student-pending-actions">
                <button class="btn-primary" data-action="approve">Approve</button>
                <button class="btn-secondary" data-action="reject">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      wrap.querySelectorAll('.student-pending-row').forEach(row => {
        const id = row.dataset.id;
        row.querySelector('[data-action="approve"]').addEventListener('click', async () => {
          try {
            await fetch(`/api/me/links/${encodeURIComponent(id)}/approve`, { method: 'POST', credentials: 'same-origin' });
            await renderStudentPendingInvites();
          } catch (_e) {}
        });
        row.querySelector('[data-action="reject"]').addEventListener('click', async () => {
          try {
            await fetch(`/api/me/links/${encodeURIComponent(id)}/reject`, { method: 'POST', credentials: 'same-origin' });
            await renderStudentPendingInvites();
          } catch (_e) {}
        });
      });
    } catch (_e) {
      wrap.innerHTML = '';
    }
  }
  window.renderStudentPendingInvites = renderStudentPendingInvites;

  function setNavSignedIn(user) {
    currentUser = user;
    _startHeartbeat();
    // Background-fetch any pending invites; non-blocking.
    if (user && user.role !== 'parent') renderStudentPendingInvites();
    // Offer the post-signup survey for new students. Idempotent on the
    // server side (survey_completed_at / survey_skipped gate the prompt).
    if (user && user.role === 'student' && typeof window.maybeShowSurvey === 'function') {
      setTimeout(() => window.maybeShowSurvey(user), 800);
    }
    const signInBtn = el('navSignInBtn');
    const navUser = el('navUser');
    const navEmail = el('navUserEmail');
    const activityBtn = el('activityNavBtn');
    const studyFab = el('studyFab');
    const signUpBtn = el('navSignUpBtn');
    if (signInBtn) hide(signInBtn);
    if (signUpBtn) hide(signUpBtn);
    if (navUser) show(navUser);
    if (navEmail) {
      const label = user.role === 'parent' ? `👪 ${user.email}` : user.email;
      navEmail.textContent = label;
    }
    // Admin menu item: shown only to admins (server also enforces is_admin on
    // every admin endpoint, so this is a convenience entry point, not the gate).
    const adminBtn = el('adminNavBtn');
    if (adminBtn) {
      if (user.is_admin) {
        show(adminBtn);
        if (!adminBtn._wired) {
          adminBtn._wired = true;
          adminBtn.addEventListener('click', () => {
            if (window.location.hash !== '#admin') window.location.hash = '#admin';
            else if (typeof window.openAdmin === 'function') window.openAdmin();
          });
        }
      } else {
        hide(adminBtn);
      }
    }
    // Parents have activity views per-student inside the dashboard; the
    // student-self "Activity" button only makes sense for student accounts.
    if (activityBtn) {
      if (user.role === 'parent') hide(activityBtn); else show(activityBtn);
    }
    // Study Methods is a learner tool — only show after sign-in.
    if (studyFab) {
      if (user.role === 'parent') hide(studyFab); else show(studyFab);
    }
    // PhotoAtrium scanner FAB: students only, hidden for parents.
    const photoFab = el('photoAtriumFab');
    if (photoFab) {
      if (user.role === 'parent') hide(photoFab); else show(photoFab);
    }
    // Swap the landing hero's CTAs from "Sign up / Sign in" to
    // "Continue learning →" so a signed-in user who lands here never sees
    // the public-visitor buttons.
    hide(el('landingCtaSignedOut'));
    hide(el('landingCtaSubSignedOut'));
    show(el('landingCtaSignedIn'));
  }

  function setNavSignedOut() {
    _stopHeartbeat();
    currentUser = null;
    const signInBtn = el('navSignInBtn');
    const signUpBtn = el('navSignUpBtn');
    const navUser = el('navUser');
    const studyFab = el('studyFab');
    const menu = el('myDetailsMenu');
    if (signInBtn) show(signInBtn);
    if (signUpBtn) show(signUpBtn);
    if (navUser) hide(navUser);
    if (studyFab) hide(studyFab);
    const photoFab = el('photoAtriumFab');
    if (photoFab) hide(photoFab);
    if (menu) hide(menu);
    // Restore the public CTAs for signed-out visitors.
    show(el('landingCtaSignedOut'));
    show(el('landingCtaSubSignedOut'));
    hide(el('landingCtaSignedIn'));
  }

  function toggleMyDetailsMenu(force) {
    const btn = el('myDetailsBtn');
    const menu = el('myDetailsMenu');
    if (!btn || !menu) return;
    const willShow = (typeof force === 'boolean') ? force : menu.classList.contains('hidden');
    if (willShow) {
      menu.classList.remove('hidden');
      btn.setAttribute('aria-expanded', 'true');
    } else {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
    }
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
      <div class="auth-role-label">I'm signing up as a…</div>
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
        applyModeVisibility();
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
    if (!res.ok) {
      const err = new Error(data.error || `Request failed (${res.status})`);
      // Attach the full response body so callers can read structured
      // flags (no_account, existing, etc.) without re-parsing.
      err.responseData = data;
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // Switch authMode + reflect it in the UI. Used both by user clicks
  // on the Sign-in/Create-account tabs AND by the existing-account
  // auto-switch when the server tells us to flip from signup to signin.
  function setAuthMode(m) {
    if (m !== 'signin' && m !== 'signup') return;
    authMode = m;
    updateModeToggleUI();
    applyModeVisibility();
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

    // Only validate / send signup-extras when actually signing up.
    let ageNum = null;
    let gradeNum = null;
    let countryVal = null;
    let linkCode = null;
    if (authMode === 'signup') {
      if (selectedRole === 'student') {
        // Age is optional. If the student types something, parse it
        // and store; otherwise leave null. We accept any positive int
        // here -- no upper or lower bound that could block sign-up.
        const ageRaw = (el('authAge').value || '').trim();
        if (ageRaw) {
          const parsed = parseInt(ageRaw, 10);
          if (Number.isFinite(parsed) && parsed > 0) ageNum = parsed;
        }
        // Grade. Optional but recommended; defaults the home page
        // filter so the student sees grade-appropriate topics right
        // after signin without having to set anything.
        const gradeEl = el('authGrade');
        if (gradeEl && gradeEl.value) {
          const gp = parseInt(gradeEl.value, 10);
          if (Number.isInteger(gp) && gp >= 1 && gp <= 12) gradeNum = gp;
        }
        // Country is a student-only field; parents don't provide one.
        countryVal = (el('authCountry').value || '').trim();
        if (!countryVal) return showError('Pick your country.');
      }
      const linkCodeRaw = (el('authLinkCode').value || '').trim();
      linkCode = linkCodeRaw.replace(/[^A-Za-z0-9]/g, '').toUpperCase() || null;
      if (linkCode && linkCode.length !== 8) {
        return showError('Link codes are 8 characters (e.g. ABCD-EFGH).');
      }
    }
    // School fields (added 2026-05-18). Mandatory school name for all
    // signups; state + district are mandatory for US users who aren't
    // marking themselves as private school.
    let schoolName = null;
    let schoolDistrict = null;
    let isPrivate = null;
    let stateVal = null;
    if (authMode === 'signup') {
      schoolName = (el('authSchool').value || '').trim();
      if (!schoolName) return showError('Enter your school name.');
      if (schoolName.length > 200) schoolName = schoolName.slice(0, 200);
      if (countryVal === 'United States') {
        stateVal = (el('authState').value || '').trim().toUpperCase();
        if (!stateVal) return showError('Pick your state.');
        isPrivate = !!(el('authPrivate') && el('authPrivate').checked);
        if (!isPrivate) {
          schoolDistrict = (el('authDistrict').value || '').trim();
          if (!schoolDistrict) return showError('Enter your school district, or tick "Private school" if you don\'t have one.');
        }
      }
    }

    const btn = el('authEmailBtn');
    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'Sending…';

    try {
      const body = { email, mode: authMode };
      if (authMode === 'signup') {
        body.role = selectedRole;
        if (ageNum != null) body.age = ageNum;
        if (gradeNum != null) body.gradeLevel = gradeNum;
        if (countryVal) body.country = countryVal;
        if (linkCode) body.linkCode = linkCode;
        if (schoolName) body.schoolName = schoolName;
        if (schoolDistrict) body.schoolDistrict = schoolDistrict;
        if (isPrivate !== null) body.isPrivateSchool = isPrivate;
        if (stateVal) body.stateCode = stateVal;
        if (typeof window.getReferralCode === 'function' && window.getReferralCode()) body.referralCode = window.getReferralCode();
      }
      const result = await postJSON('/api/auth/signup', body);
      pendingEmail = email;
      pendingAge = ageNum;
      pendingGrade = gradeNum;
      pendingCountry = countryVal;
      pendingLinkCode = linkCode;
      pendingSchool = schoolName;
      pendingDistrict = schoolDistrict;
      pendingIsPrivate = isPrivate;
      pendingState = stateVal;
      const show2 = el('authEmailShow');
      // If the user picked "Create account" but the email already
      // exists, the server still sent a sign-in code. Flip the UI
      // to Sign-in mode and tell the user gently what happened.
      if (result && result.existing && authMode === 'signup') {
        setAuthMode('signin');
        if (show2) show2.innerHTML = `📬 You already have an account. A sign-in code was sent to <strong>${email}</strong>.`;
      } else if (show2) {
        show2.textContent = `Code sent to ${email}.`;
      }
      hide(el('authEmailForm'));
      show(el('authCodeForm'));
      startResendCooldown();
      setTimeout(() => el('authCode') && el('authCode').focus(), 30);
    } catch (err) {
      // Server uses 404 + no_account: true when sign-in is attempted
      // on an unknown email. Suggest switching to "Create account".
      if (err && err.responseData && err.responseData.no_account) {
        showError(`${err.message} `);
        const errBox = el('authError');
        if (errBox) {
          const switchBtn = document.createElement('button');
          switchBtn.type = 'button';
          switchBtn.className = 'auth-link';
          switchBtn.textContent = 'Switch to Create account →';
          switchBtn.style.marginLeft = '6px';
          switchBtn.addEventListener('click', () => {
            clearError();
            setAuthMode('signup');
          });
          errBox.appendChild(switchBtn);
        }
      } else {
        showError(err.message);
      }
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
      const body = { email: pendingEmail, mode: authMode };
      if (authMode === 'signup') {
        body.role = selectedRole;
        if (pendingAge != null) body.age = pendingAge;
        if (pendingGrade != null) body.gradeLevel = pendingGrade;
        if (pendingCountry) body.country = pendingCountry;
        if (pendingLinkCode) body.linkCode = pendingLinkCode;
        if (pendingSchool) body.schoolName = pendingSchool;
        if (pendingDistrict) body.schoolDistrict = pendingDistrict;
        if (pendingIsPrivate !== null) body.isPrivateSchool = pendingIsPrivate;
        if (pendingState) body.stateCode = pendingState;
        if (typeof window.getReferralCode === 'function' && window.getReferralCode()) body.referralCode = window.getReferralCode();
      }
      await postJSON('/api/auth/signup', body);
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

  // -------- Per-user progress sync --------
  // Mirror these localStorage keys to/from the server so a user's profile
  // (name, age, grade) and quiz scores survive across devices and reloads.
  const PROGRESS_KEYS = [
    'mathcourse_scores_v2',
    'mathcourse_profile_v1',
    'mathcourse_extra_sections_v1',
    'mathcourse_extra_cum_v1',
    'atrium_theme_v1',
  ];
  window.__atriumSignedIn = false;

  async function pullProgress() {
    try {
      const res = await fetch('/api/progress', { credentials: 'same-origin' });
      if (!res.ok) return false;
      const data = await res.json();
      const p = (data && data.progress) || {};
      for (const key of PROGRESS_KEYS) {
        if (p[key] !== undefined && p[key] !== null) {
          // Use the original setItem to avoid re-triggering the sync hook.
          try {
            const value = (typeof p[key] === 'string') ? p[key] : JSON.stringify(p[key]);
            _origSetItem.call(localStorage, key, value);
          } catch (_) { /* ignore individual key failures */ }
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  function pushProgress(key, value) {
    if (!window.__atriumSignedIn) return;
    try {
      let payload = value;
      // The server stores any JSON value. If the localStorage value is a
      // JSON string, parse it so the server has structured data.
      if (typeof value === 'string') {
        try { payload = JSON.parse(value); }
        catch (_) { payload = value; }
      }
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ key, data: payload }),
      }).catch(() => {});
    } catch (_) { /* best effort */ }
  }

  // Wrap localStorage.setItem so any save the rest of the app does
  // (saveProfile / saveScores / etc.) automatically mirrors to the server
  // — no need to touch every callsite.
  const _origSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function (key, value) {
    _origSetItem.call(this, key, value);
    if (PROGRESS_KEYS.includes(key)) pushProgress(key, value);
  };

  // Expose so other code (e.g. profile.js) can force a re-pull if needed.
  window.AtriumProgress = { pullProgress, pushProgress, PROGRESS_KEYS };

  async function enterAppAfterAuth(user) {
    if (user.role === 'parent') {
      // Pull progress in the background — parents don't need it for their dashboard,
      // but it doesn't hurt to keep their copy fresh.
      pullProgress();
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
    // Pull server-side progress BEFORE deciding whether to onboard. Otherwise
    // a returning user on a new device would get re-onboarded because their
    // profile only lives in the other device's localStorage.
    window.__atriumSignedIn = true;
    await pullProgress();
    const profile = (typeof loadProfile === 'function') ? loadProfile() : null;
    if (!profile && typeof startOnboarding === 'function') {
      hide(el('authGate'));
      hide(el('landing'));
      startOnboarding();
      return;
    }
    showApp();
    // Tell the rest of the app to repaint with the freshly-loaded data.
    if (typeof renderProgressPill === 'function') renderProgressPill();
    if (typeof renderGreeting === 'function') renderGreeting();
    if (typeof renderCourses === 'function') renderCourses();
  }

  async function handleSignOut() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    } catch (_) { /* ignore */ }
    window.__atriumSignedIn = false;
    setNavSignedOut();
    pendingEmail = null;
    // Clear the local cached copy of progress so the next user on this
    // browser doesn't inherit it. Server-side data is untouched.
    for (const k of PROGRESS_KEYS) {
      try { _origSetItem.call(localStorage, k, JSON.stringify(null)); localStorage.removeItem(k); }
      catch (_) {}
    }
    showLanding();
  }

  // Landing CTAs call openAuth(). If already signed in, jump straight in.
  window.openAuth = function (mode) {
    if (currentUser) {
      enterAppAfterAuth(currentUser);
    } else {
      showAuthGate(mode);
    }
  };

  // Clicking the nav logo. Routes to the right home view based on session +
  // role. If the in-memory currentUser isn't set yet (init still racing,
  // or this is the very first interaction), re-check the session before
  // falling through to the landing — keeps the logo click from silently
  // doing nothing on a slow page load. Doesn't bypass the consent gate.
  window.goHome = async function () {
    console.log('[goHome] entry. currentUser?', currentUser ? currentUser.email : null);
    let u = currentUser;
    if (!u) {
      console.log('[goHome] no cached user, calling checkSession');
      try { u = await checkSession(); } catch (e) { console.log('[goHome] checkSession threw:', e && e.message); u = null; }
      console.log('[goHome] checkSession result:', u ? u.email : null);
      if (u) setNavSignedIn(u);
    }
    if (u) {
      console.log('[goHome] calling enterAppAfterAuth');
      try { enterAppAfterAuth(u); }
      catch (e) { console.log('[goHome] enterAppAfterAuth threw:', e && e.message); }
    } else {
      console.log('[goHome] no user, showing landing');
      showLanding();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('[goHome] done');
  };

  // ----- Time-on-site heartbeat -----
  // Every 60s while the tab is visible AND the user is signed in,
  // POST /api/me/heartbeat with the current subject inferred from
  // location / current course. Server adds 60s to the day's bucket.
  let _heartbeatTimer = null;
  let _currentSubject = 'math';
  window.setCurrentSubject = function (s) {
    _currentSubject = (s === 'language_arts' || s === 'english') ? 'language_arts' : 'math';
  };
  function _sendHeartbeat() {
    if (!currentUser) return;
    if (document.visibilityState !== 'visible') return;
    if (!navigator.onLine) return;
    fetch('/api/me/heartbeat', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: _currentSubject, seconds: 60 }),
      keepalive: true,
    }).catch(() => { /* swallow; transient errors are fine */ });
  }
  function _startHeartbeat() {
    if (_heartbeatTimer) return;
    _heartbeatTimer = setInterval(_sendHeartbeat, 60 * 1000);
    // Fire once immediately so a quick visit (< 60s) still counts.
    setTimeout(_sendHeartbeat, 5 * 1000);
  }
  function _stopHeartbeat() {
    if (_heartbeatTimer) { clearInterval(_heartbeatTimer); _heartbeatTimer = null; }
  }

  // Exposed so other code (e.g. app.js) can ask who the user is.
  window.getCurrentUser = function () { return currentUser; };
  // Exposed so the profile page (or anything else that updates the
  // user) can push the fresh user back into the auth cache without a
  // full /me round-trip. Pass null to clear.
  window.setCurrentUser = function (u) {
    currentUser = u || null;
    if (currentUser) setNavSignedIn(currentUser);
  };

  async function handleConsentRefresh() {
    const user = await checkSession();
    if (!user) return;
    setNavSignedIn(user);
    if (user.consent_granted_at) {
      enterAppAfterAuth(user);
    }
  }

  // If the user arrives back at the site after deleting their account,
  // show a small thank-you banner so they know it worked. The query
  // string is stripped after the banner is displayed so a refresh
  // doesn't show it again.
  function maybeShowAccountDeletedBanner() {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('account') === 'deleted') {
        const banner = document.createElement('div');
        banner.className = 'account-deleted-banner';
        banner.innerHTML = `
          <div>Your Atrium account has been deleted. Thank you for trying us. If you change your mind, you're welcome to sign up again any time.</div>
          <button type="button" aria-label="Dismiss">×</button>
        `;
        document.body.appendChild(banner);
        banner.querySelector('button').addEventListener('click', () => banner.remove());
        setTimeout(() => banner.remove(), 12000);
        const url = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', url);
      }
    } catch (_e) {}
  }

  async function init() {
    maybeShowAccountDeletedBanner();
    // Wire static buttons.
    const emailForm = el('authEmailForm');
    if (emailForm) emailForm.addEventListener('submit', handleEmailSubmit);
    const codeForm = el('authCodeForm');
    if (codeForm) codeForm.addEventListener('submit', handleCodeSubmit);
    // Country picks drive whether state + district fields appear.
    const countrySel = el('authCountry');
    if (countrySel) countrySel.addEventListener('change', () => {
      applyUsOnlyVisibility();
      // Clear district when state changes / country swaps off US.
      const di = el('authDistrict');
      if (di) di.value = '';
      hideDistrictSuggest();
    });
    const stateSel = el('authState');
    if (stateSel) stateSel.addEventListener('change', () => {
      const di = el('authDistrict');
      if (di) di.value = '';
      hideDistrictSuggest();
    });
    const privBox = el('authPrivate');
    if (privBox) privBox.addEventListener('change', applyUsOnlyVisibility);
    // District autocomplete: debounced fetch as the user types.
    const districtInput = el('authDistrict');
    if (districtInput) {
      districtInput.addEventListener('input', () => {
        if (districtSuggestTimer) clearTimeout(districtSuggestTimer);
        districtSuggestTimer = setTimeout(refreshDistrictSuggest, 180);
      });
      districtInput.addEventListener('focus', refreshDistrictSuggest);
      districtInput.addEventListener('blur', () => setTimeout(hideDistrictSuggest, 200));
    }
    const resend = el('authResend');
    if (resend) resend.addEventListener('click', handleResendDifferentEmail);
    const resendCode = el('authResendCode');
    if (resendCode) resendCode.addEventListener('click', handleResendCode);
    const signInBtn = el('navSignInBtn');
    if (signInBtn) signInBtn.addEventListener('click', () => window.openAuth('signin'));
    const signUpBtn = el('navSignUpBtn');
    if (signUpBtn) signUpBtn.addEventListener('click', () => window.openAuth('signup'));
    const signOutBtn = el('signOutBtn');
    if (signOutBtn) signOutBtn.addEventListener('click', handleSignOut);
    const logoBtn = el('logoHome');
    if (logoBtn) {
      logoBtn.addEventListener('click', () => {
        console.log('[logo] click. typeof window.goHome=', typeof window.goHome);
        if (typeof window.goHome === 'function') {
          window.goHome();
        } else {
          console.warn('[logo] window.goHome is not a function — something overwrote it.');
        }
      });
    } else {
      console.warn('[logo] #logoHome button not found in DOM at wireOnce time.');
    }
    const myDetailsBtn = el('myDetailsBtn');
    if (myDetailsBtn) {
      myDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleMyDetailsMenu();
      });
    }
    // Mobile hamburger: toggles the right-side cluster as a slide-down
    // drawer at phone widths. Desktop layout ignores it (the CSS hides
    // the hamburger over 720px).
    const hamburger = el('navHamburger');
    if (hamburger) {
      const closeNavDrawer = () => {
        document.body.classList.remove('nav-open');
        hamburger.setAttribute('aria-expanded', 'false');
      };
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = !document.body.classList.contains('nav-open');
        document.body.classList.toggle('nav-open', willOpen);
        hamburger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
      // Any nav action inside the drawer should close it after firing.
      const navRight = el('navRight');
      if (navRight) {
        navRight.addEventListener('click', (e) => {
          const t = e.target;
          if (!t || t.tagName !== 'BUTTON') return;
          // The nested "About Atrium" / "My Details" toggle buttons
          // need to keep the drawer open so the submenu can expand.
          if (t.id === 'aboutAtriumBtn' || t.id === 'myDetailsBtn' || t.id === 'studyToolsBtn') return;
          closeNavDrawer();
        });
      }
      // Outside click and Escape close the drawer.
      document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('nav-open')) return;
        if (e.target === hamburger || hamburger.contains(e.target)) return;
        const navRightEl = el('navRight');
        if (navRightEl && navRightEl.contains(e.target)) return;
        closeNavDrawer();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeNavDrawer();
      });
      // Resizing back to desktop should clear the open state so the
      // drawer styles don't leak onto a wide screen.
      window.addEventListener('resize', () => {
        if (window.innerWidth > 720) closeNavDrawer();
      });
    }

    // "About Atrium" dropdown: Why Atrium, FAQ, About us. Always
    // visible (signed-in or not).
    const aboutBtn = el('aboutAtriumBtn');
    const aboutMenu = el('aboutAtriumMenu');
    if (aboutBtn && aboutMenu) {
      aboutBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willShow = aboutMenu.classList.contains('hidden');
        aboutMenu.classList.toggle('hidden', !willShow);
        aboutBtn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
      });
      // Close on item click or outside click.
      aboutMenu.querySelectorAll('.nav-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          aboutMenu.classList.add('hidden');
          aboutBtn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', (e) => {
        if (!aboutMenu.classList.contains('hidden')
            && !aboutMenu.contains(e.target)
            && e.target !== aboutBtn) {
          aboutMenu.classList.add('hidden');
          aboutBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // "Study Tools" dropdown: flashcards, essay grader, notebook, snap & solve,
    // curriculum, favorites, activity, achievements, leaderboard. Signed-in only
    // (lives inside #navUser). Same open/close pattern as About Atrium.
    const studyToolsBtn = el('studyToolsBtn');
    const studyToolsMenu = el('studyToolsMenu');
    if (studyToolsBtn && studyToolsMenu) {
      studyToolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willShow = studyToolsMenu.classList.contains('hidden');
        studyToolsMenu.classList.toggle('hidden', !willShow);
        studyToolsBtn.setAttribute('aria-expanded', willShow ? 'true' : 'false');
      });
      studyToolsMenu.querySelectorAll('.nav-menu-item').forEach(item => {
        item.addEventListener('click', () => {
          studyToolsMenu.classList.add('hidden');
          studyToolsBtn.setAttribute('aria-expanded', 'false');
        });
      });
      document.addEventListener('click', (e) => {
        if (!studyToolsMenu.classList.contains('hidden')
            && !studyToolsMenu.contains(e.target)
            && e.target !== studyToolsBtn) {
          studyToolsMenu.classList.add('hidden');
          studyToolsBtn.setAttribute('aria-expanded', 'false');
        }
      });
    }

    const myDetailsMenu = el('myDetailsMenu');
    if (myDetailsMenu) {
      myDetailsMenu.addEventListener('click', (e) => {
        // Close the menu when an item is picked. The item's own handler
        // (in profile.js / activity.js) still runs.
        if (e.target && e.target.tagName === 'BUTTON') toggleMyDetailsMenu(false);
      });
    }
    // Close the dropdown on outside click + Escape.
    document.addEventListener('click', () => toggleMyDetailsMenu(false));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') toggleMyDetailsMenu(false);
    });
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
      // Special case: if the URL is the admin route AND the user is an
      // admin, let admin.js handle routing into the admin view rather
      // than yanking them to courses-home first.
      const onAdminRoute = window.location.pathname === '/admin' || window.location.hash === '#admin';
      if (onAdminRoute && user.is_admin) {
        // admin.js's checkRoute / retry loop will open the admin page.
        return;
      }
      // Signed-in users get routed straight to their app home rather than
      // staring at a marketing landing. Role-aware: parents → dashboard,
      // gated minors → consent gate, everyone else → courses home (or
      // onboarding if no profile yet).
      enterAppAfterAuth(user);
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
