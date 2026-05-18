// Profile page. Same nav button for students and parents; the form is
// rebuilt per-role from the current user's role on the server.

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function tzGuess() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Los_Angeles'; }
    catch { return 'America/Los_Angeles'; }
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, opts || {}));
    let data = {};
    try { data = await res.json(); } catch { /* tolerate */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  // ---------- Common helpers ----------

  // 50-state list rendered server-side at signup; reuse a short list here for
  // timezone selection. Browser tz is the right default; the dropdown is a
  // safety net.
  const COMMON_TIMEZONES = [
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Phoenix',
    'America/Los_Angeles', 'America/Anchorage', 'Pacific/Honolulu',
    'America/Toronto', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Kolkata',
    'Australia/Sydney',
  ];

  function tzOptions(selected) {
    const set = new Set(COMMON_TIMEZONES);
    if (selected) set.add(selected);
    return Array.from(set).sort().map(tz =>
      `<option value="${esc(tz)}"${tz === selected ? ' selected' : ''}>${esc(tz)}</option>`
    ).join('');
  }

  // ---------- Student form ----------

  const FREQUENCIES = [
    ['daily', 'Every day'],
    ['weekdays', 'Weekdays only'],
    ['mwf', 'Mon / Wed / Fri'],
    ['twr', 'Tue / Thu'],
    ['weekly', 'Once a week (Mondays)'],
    ['biweekly', 'Every other week'],
  ];
  const CONTENT_TYPES = [
    ['generic', 'A simple nudge'],
    ['continuation', 'Pick up where I left off'],
    ['weak_topics', 'Focus on what I missed'],
  ];

  function countryOptions(selected) {
    const list = Array.isArray(window.ATRIUM_COUNTRIES) ? window.ATRIUM_COUNTRIES : [];
    return list.map(c => {
      if (c === '— — —') return `<option disabled>─────────────</option>`;
      return `<option value="${esc(c)}"${c === selected ? ' selected' : ''}>${esc(c)}</option>`;
    }).join('');
  }

  function stateOptions(selected) {
    const list = Array.isArray(window.ATRIUM_US_STATES) ? window.ATRIUM_US_STATES : [];
    return list.map(([code, name]) =>
      `<option value="${esc(code)}"${code === selected ? ' selected' : ''}>${esc(name)}</option>`
    ).join('');
  }

  function accountFieldset(userInfo) {
    const age = (userInfo && userInfo.age != null) ? userInfo.age : null;
    const country = (userInfo && userInfo.country) || '';
    const stateCode = (userInfo && userInfo.state_code) || '';
    const schoolName = (userInfo && userInfo.school_name) || '';
    const schoolDistrict = (userInfo && userInfo.school_district) || '';
    const isPrivate = !!(userInfo && userInfo.is_private_school);
    const isUS = country === 'United States';
    return `
      <fieldset>
        <legend>Account</legend>
        <label>Age
          ${age != null
            ? `<input type="text" value="${esc(age)}" disabled> <small class="profile-hint">Set at signup. Contact us to change.</small>`
            : `<input type="text" value="(not set)" disabled> <small class="profile-hint">If you signed up before we asked, contact us to add it.</small>`}
        </label>
        <label>Country
          <select name="country" id="profileCountry">
            <option value="">${country ? 'Keep current value' : 'Select country…'}</option>
            ${countryOptions(country)}
          </select>
          ${country ? `<small class="profile-hint">Current: ${esc(country)}</small>` : ''}
        </label>
        <label class="profile-us-only${isUS ? '' : ' hidden'}" id="profileStateLabel">
          State
          <select name="stateCode" id="profileState">
            <option value="">Select state…</option>
            ${stateOptions(stateCode)}
          </select>
        </label>
        <label>School name
          <input type="text" name="schoolName" id="profileSchoolName" value="${esc(schoolName)}" maxlength="200" placeholder="e.g. Lincoln Middle School" required>
        </label>
        <label class="profile-private-check${isUS ? '' : ' hidden'}" id="profilePrivateWrap">
          <input type="checkbox" name="isPrivateSchool" id="profilePrivate"${isPrivate ? ' checked' : ''}>
          This is a private school (no district)
        </label>
        <label class="profile-us-only${isUS && !isPrivate ? '' : ' hidden'}" id="profileDistrictLabel">
          School district
          <input type="text" name="schoolDistrict" id="profileDistrict" value="${esc(schoolDistrict)}" maxlength="200" placeholder="Start typing your district…" autocomplete="off">
          <div id="profileDistrictSuggest" class="auth-suggest hidden" role="listbox"></div>
        </label>
      </fieldset>
    `;
  }

  function studentForm(profile, courses, isUnder13, userInfo) {
    const p = profile || {};
    const tz = p.timezone || tzGuess();
    const subjects = p.subjects || [];
    const studyCourses = p.study_plan_courses || [];

    const subjectSet = new Set();
    for (const c of courses) subjectSet.add(c.subject || 'math');
    const subjectOpts = Array.from(subjectSet).sort().map(s =>
      `<label class="profile-check">
        <input type="checkbox" name="subjects" value="${esc(s)}"${subjects.includes(s) ? ' checked' : ''}>
        ${esc(s.charAt(0).toUpperCase() + s.slice(1))}
      </label>`
    ).join('');

    const courseOpts = courses.map(c =>
      `<label class="profile-check">
        <input type="checkbox" name="studyPlanCourses" value="${esc(c.id)}"${studyCourses.includes(c.id) ? ' checked' : ''}>
        ${esc(c.emoji || '')} ${esc(c.title)}
      </label>`
    ).join('');

    const freqOpts = FREQUENCIES.map(([k, label]) =>
      `<option value="${k}"${p.reminder_frequency === k ? ' selected' : ''}>${label}</option>`
    ).join('');
    const contentOpts = CONTENT_TYPES.map(([k, label]) =>
      `<option value="${k}"${p.reminder_content === k ? ' selected' : ''}>${label}</option>`
    ).join('');

    return `
      ${accountFieldset(userInfo)}

      <fieldset>
        <legend>About you</legend>
        <label>Display name <input type="text" name="displayName" value="${esc(p.display_name || '')}" maxlength="200"></label>
        <label>Grade level
          <select name="gradeLevel">
            <option value="">Choose grade</option>
            ${[6,7,8,9,10,11,12].map(g => {
              const sel = (Number(userInfo && userInfo.grade_level) === g) ? ' selected' : '';
              return `<option value="${g}"${sel}>Grade ${g}</option>`;
            }).join('')}
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>What you're focusing on</legend>
        <div class="profile-label">Subjects</div>
        <div class="profile-checks">${subjectOpts || '<span class="muted">No courses loaded yet.</span>'}</div>
        <div class="profile-label">Specific courses I want to focus on</div>
        <div class="profile-checks">${courseOpts || '<span class="muted">No courses loaded yet.</span>'}</div>
        <label>My goal in my own words
          <textarea name="studyGoal" rows="3" maxlength="2000" placeholder="e.g. Pass Algebra 2 with a B+ by June.">${esc(p.study_goal || '')}</textarea>
        </label>
      </fieldset>

      <fieldset>
        <legend>Email reminders</legend>
        ${isUnder13 ? `
          <div class="profile-notice">${p.parent_authorised_reminders
            ? 'Your parent has allowed reminder emails for your account.'
            : 'A linked parent needs to allow reminder emails before yours will turn on. The toggle below stays off until they do.'}
          </div>` : ''}
        <label class="profile-toggle">
          <input type="checkbox" name="reminderEnabled"${p.reminder_enabled ? ' checked' : ''}${isUnder13 && !p.parent_authorised_reminders ? ' disabled' : ''}>
          Send me study reminders
        </label>
        <label>Timezone <select name="timezone">${tzOptions(tz)}</select></label>
        <label>How often <select name="reminderFrequency">${freqOpts}</select></label>
        <label>What time (local) <input type="time" name="reminderTimeLocal" value="${esc((p.reminder_time_local || '17:00').slice(0, 5))}"></label>
        <label>Content <select name="reminderContent">${contentOpts}</select></label>
      </fieldset>

      ${dangerZoneFieldset(userInfo)}
    `;
  }

  // ---------- Parent form ----------

  function parentForm(profile, students, userInfo) {
    const p = profile || {};
    const tz = p.timezone || tzGuess();
    const relOpts = ['parent', 'guardian', 'tutor', 'other'].map(r =>
      `<option value="${r}"${(p.relationship || 'parent') === r ? ' selected' : ''}>${r}</option>`
    ).join('');
    const dayOpts = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d, i) =>
      `<option value="${i}"${(p.weekly_digest_day ?? 0) === i ? ' selected' : ''}>${d}</option>`
    ).join('');

    const studentToggles = (students || []).map(s => `
      <div class="profile-student-row">
        <div class="profile-student-email">${esc(s.email)}</div>
        <label class="profile-toggle">
          <input type="checkbox" data-student-id="${esc(s.id)}" class="js-student-reminder-toggle"${s.parent_authorised_reminders ? ' checked' : ''}>
          Allow reminder emails for this student
        </label>
      </div>
    `).join('');

    return `
      ${accountFieldset(userInfo)}

      <fieldset>
        <legend>About you</legend>
        <label>Display name <input type="text" name="displayName" value="${esc(p.display_name || '')}" maxlength="200"></label>
        <label>Relationship <select name="relationship">${relOpts}</select></label>
        <label>Timezone <select name="timezone">${tzOptions(tz)}</select></label>
      </fieldset>

      <fieldset>
        <legend>Weekly digest</legend>
        <label class="profile-toggle">
          <input type="checkbox" name="weeklyDigestEnabled"${p.weekly_digest_enabled !== false ? ' checked' : ''}>
          Email me a weekly summary of my students' activity
        </label>
        <label>Day <select name="weeklyDigestDay">${dayOpts}</select></label>
        <label>Time (local) <input type="time" name="weeklyDigestTimeLocal" value="${esc((p.weekly_digest_time_local || '09:00').slice(0, 5))}"></label>
      </fieldset>

      ${studentToggles ? `
        <fieldset>
          <legend>Reminder authorisation for your students</legend>
          <p class="profile-label">Email reminders to under-13 students stay off until you allow them here.</p>
          ${studentToggles}
        </fieldset>` : ''}

      ${dangerZoneFieldset(userInfo)}
    `;
  }

  function dangerZoneFieldset(userInfo) {
    const email = (userInfo && userInfo.email) || '';
    return `
      <fieldset class="profile-danger-zone">
        <legend>Danger zone</legend>
        <div class="profile-danger-row">
          <div class="profile-danger-text">
            <strong>Delete this account.</strong>
            <p>Permanently removes your profile, progress, badges, activity history, link to any parent or student, and (if you have one) cancels your paid subscription. This cannot be undone.</p>
          </div>
          <button type="button" id="profileDeleteBtn" class="profile-danger-btn"${email ? '' : ' disabled'}>Delete account…</button>
        </div>
      </fieldset>
    `;
  }

  // ---------- Page control ----------

  let lastRole = null;
  let prevView = null;

  function captureCurrentView() {
    // Remember which view was visible before so Back returns there.
    const views = ['parentHome', 'parentStudentDetail', 'courses-home', 'home', 'detail', 'landing', 'consentGate'];
    for (const id of views) {
      const v = el(id);
      if (v && !v.classList.contains('hidden')) {
        prevView = id;
        return;
      }
    }
    prevView = null;
  }

  function hideAllTopLevel() {
    if (typeof window.hideAllTopLevel === 'function' && window.hideAllTopLevel !== hideAllTopLevel) {
      window.hideAllTopLevel();
      return;
    }
    ['landing', 'authGate', 'consentGate', 'parentHome', 'parentStudentDetail',
     'courses-home', 'home', 'detail', 'activityPage', 'tokenUsagePage',
     'about', 'contact', 'privacy', 'terms'].forEach(id => hide(el(id)));
  }

  function goBack() {
    hide(el('profilePage'));
    if (prevView && el(prevView)) {
      show(el(prevView));
    } else if (lastRole === 'parent') {
      show(el('parentHome'));
    } else {
      show(el('courses-home'));
    }
  }

  async function openProfile() {
    captureCurrentView();
    hideAllTopLevel();
    show(el('profilePage'));
    const form = el('profileForm');
    form.innerHTML = '<div class="profile-loading">Loading…</div>';
    setStatus('');

    try {
      const { role, profile, user: userInfo } = await fetchJSON('/api/me/rich-profile');
      lastRole = role;
      const courses = (typeof COURSES !== 'undefined') ? Object.values(COURSES) : [];
      if (role === 'parent') {
        const { students } = await fetchJSON('/api/parent/students');
        form.innerHTML = parentForm(profile, students || [], userInfo);
        wireStudentReminderToggles();
        el('profileTitle').textContent = 'Parent profile';
      } else {
        const me = await fetchJSON('/api/auth/me').catch(() => ({ user: {} }));
        const isUnder13 = !!(me.user && me.user.consent_required);
        form.innerHTML = studentForm(profile, courses, isUnder13, userInfo);
        el('profileTitle').textContent = 'Your profile';
      }
      wireSchoolFields();
      wireDeleteAccountButton(userInfo);
    } catch (e) {
      form.innerHTML = `<div class="profile-loading err">Could not load: ${esc(e.message)}</div>`;
    }
  }

  // Country -> state -> district behaviour on the profile page. Mirrors
  // the signup form. Only the visible fields are submitted; collectFormValues
  // already picks them up by name.
  function wireSchoolFields() {
    const countrySel = el('profileCountry');
    const stateLabel = el('profileStateLabel');
    const districtLabel = el('profileDistrictLabel');
    const privateWrap = el('profilePrivateWrap');
    const stateSel = el('profileState');
    const districtInput = el('profileDistrict');
    const privBox = el('profilePrivate');
    if (!countrySel) return;
    function refreshVisibility() {
      const isUS = countrySel.value === 'United States';
      if (stateLabel) stateLabel.classList.toggle('hidden', !isUS);
      if (privateWrap) privateWrap.classList.toggle('hidden', !isUS);
      const showDistrict = isUS && !(privBox && privBox.checked);
      if (districtLabel) districtLabel.classList.toggle('hidden', !showDistrict);
    }
    countrySel.addEventListener('change', refreshVisibility);
    if (privBox) privBox.addEventListener('change', refreshVisibility);
    if (stateSel) stateSel.addEventListener('change', () => {
      if (districtInput) districtInput.value = '';
      hideProfileDistrictSuggest();
    });
    if (districtInput) {
      let timer = null;
      districtInput.addEventListener('input', () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(refreshProfileDistrictSuggest, 180);
      });
      districtInput.addEventListener('focus', refreshProfileDistrictSuggest);
      districtInput.addEventListener('blur', () => setTimeout(hideProfileDistrictSuggest, 200));
    }
    refreshVisibility();
  }

  // ---------- Account deletion (four-step confirmation) ----------

  function wireDeleteAccountButton(userInfo) {
    const btn = el('profileDeleteBtn');
    if (!btn) return;
    btn.onclick = () => openDeleteFlow(userInfo);
  }

  function openDeleteFlow(userInfo) {
    const overlay = el('deleteAccountOverlay');
    if (!overlay) return;
    resetDeleteFlow();
    const expectedEmail = (userInfo && userInfo.email) || '';
    const expectEl = el('deleteExpectedEmail');
    if (expectEl) expectEl.textContent = expectedEmail ? `Expected: ${expectedEmail}` : '';
    overlay._email = expectedEmail;
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('hidden');
    document.body.classList.add('survey-open');
    wireDeleteFlowOnce();
  }

  function closeDeleteFlow() {
    const overlay = el('deleteAccountOverlay');
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.add('hidden');
    document.body.classList.remove('survey-open');
    resetDeleteFlow();
  }

  function resetDeleteFlow() {
    const overlay = el('deleteAccountOverlay');
    if (!overlay) return;
    overlay.querySelectorAll('.delete-pane').forEach((p, idx) =>
      p.classList.toggle('is-active', idx === 0));
    overlay.querySelectorAll('.delete-step-dot').forEach((d, idx) =>
      d.classList.toggle('is-active', idx === 0));
    ['ackProgress', 'ackActivity', 'ackLinks', 'ackIrrev'].forEach(id => {
      const c = el(id); if (c) c.checked = false;
    });
    ['deleteEmailInput', 'deletePhraseInput'].forEach(id => {
      const i = el(id); if (i) i.value = '';
    });
    const err = el('deleteError'); if (err) hide(err);
    ['deleteNext2', 'deleteNext3', 'deleteFinalBtn'].forEach(id => {
      const b = el(id); if (b) b.disabled = true;
    });
  }

  function goToDeleteStep(n) {
    const overlay = el('deleteAccountOverlay');
    if (!overlay) return;
    overlay.querySelectorAll('.delete-pane').forEach(p =>
      p.classList.toggle('is-active', Number(p.dataset.pane) === n));
    overlay.querySelectorAll('.delete-step-dot').forEach(d =>
      d.classList.toggle('is-active', Number(d.dataset.step) <= n));
    // Focus the first interactive element in the new pane.
    const active = overlay.querySelector(`.delete-pane[data-pane="${n}"]`);
    if (active) {
      const focusable = active.querySelector('input, button:not([disabled])');
      if (focusable) setTimeout(() => focusable.focus(), 60);
    }
  }

  function wireDeleteFlowOnce() {
    if (wireDeleteFlowOnce._done) return;
    wireDeleteFlowOnce._done = true;
    el('deleteCloseBtn').addEventListener('click', closeDeleteFlow);
    el('deleteCancelBtn1').addEventListener('click', closeDeleteFlow);
    el('deleteNext1').addEventListener('click', () => goToDeleteStep(2));
    el('deleteBack2').addEventListener('click', () => goToDeleteStep(1));
    el('deleteBack3').addEventListener('click', () => goToDeleteStep(2));
    el('deleteBack4').addEventListener('click', () => goToDeleteStep(3));

    // Step 2: enable Continue only when all four boxes are ticked.
    const acks = ['ackProgress', 'ackActivity', 'ackLinks', 'ackIrrev'].map(id => el(id));
    function refreshAcks() {
      const allChecked = acks.every(b => b && b.checked);
      const btn = el('deleteNext2');
      if (btn) btn.disabled = !allChecked;
    }
    acks.forEach(b => b && b.addEventListener('change', refreshAcks));
    el('deleteNext2').addEventListener('click', () => {
      if (!el('deleteNext2').disabled) goToDeleteStep(3);
    });

    // Step 3: enable Continue only when email matches exactly.
    const emailIn = el('deleteEmailInput');
    function refreshEmail() {
      const overlay = el('deleteAccountOverlay');
      const expected = (overlay && overlay._email || '').trim().toLowerCase();
      const typed = (emailIn.value || '').trim().toLowerCase();
      el('deleteNext3').disabled = !(expected && typed && expected === typed);
    }
    emailIn.addEventListener('input', refreshEmail);
    el('deleteNext3').addEventListener('click', () => {
      if (!el('deleteNext3').disabled) goToDeleteStep(4);
    });

    // Step 4: enable final button only when phrase matches exactly.
    const phrase = el('deletePhraseInput');
    function refreshPhrase() {
      el('deleteFinalBtn').disabled = phrase.value !== 'DELETE MY ACCOUNT';
    }
    phrase.addEventListener('input', refreshPhrase);
    el('deleteFinalBtn').addEventListener('click', runFinalDelete);

    // Escape closes the overlay.
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !el('deleteAccountOverlay').classList.contains('hidden')) {
        closeDeleteFlow();
      }
    });
  }

  async function runFinalDelete() {
    const overlay = el('deleteAccountOverlay');
    const err = el('deleteError');
    const finalBtn = el('deleteFinalBtn');
    if (finalBtn) { finalBtn.disabled = true; finalBtn.textContent = 'Deleting…'; }
    try {
      const body = {
        acknowledgements: {
          lose_progress: el('ackProgress').checked,
          lose_activity: el('ackActivity').checked,
          lose_links: el('ackLinks').checked,
          irreversible: el('ackIrrev').checked,
        },
        email_confirmation: (el('deleteEmailInput').value || '').trim(),
        confirmation_phrase: el('deletePhraseInput').value || '',
      };
      const r = await fetch('/api/me/account/delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      // Bye. Force a reload onto the landing page; the session cookie
      // has already been cleared by the server.
      window.location.href = '/?account=deleted';
    } catch (e) {
      if (err) { err.textContent = e.message || 'Could not delete account.'; show(err); }
      if (finalBtn) { finalBtn.disabled = false; finalBtn.textContent = 'Delete my account permanently'; }
    }
    // Avoid unused-var warning when overlay isn't needed:
    void overlay;
  }

  function hideProfileDistrictSuggest() {
    const box = el('profileDistrictSuggest');
    if (box) { box.innerHTML = ''; box.classList.add('hidden'); }
  }

  async function refreshProfileDistrictSuggest() {
    const input = el('profileDistrict');
    const box = el('profileDistrictSuggest');
    const stateSel = el('profileState');
    if (!input || !box) return;
    const q = (input.value || '').trim();
    const stateCode = (stateSel && stateSel.value) || '';
    if (q.length < 2 || !stateCode) { hideProfileDistrictSuggest(); return; }
    try {
      const r = await fetch(`/api/school-districts/search?q=${encodeURIComponent(q)}&state=${encodeURIComponent(stateCode)}`, { credentials: 'same-origin' });
      if (!r.ok) { hideProfileDistrictSuggest(); return; }
      const data = await r.json();
      const list = (data && data.results) || [];
      if (!list.length) {
        box.innerHTML = '<div class="auth-suggest-empty">No match. Your entry will be saved so others in your district can find it.</div>';
        box.classList.remove('hidden');
        return;
      }
      box.innerHTML = list.map(r => `<button type="button" class="auth-suggest-item" data-name="${(r.name || '').replace(/"/g, '&quot;')}">${esc(r.name)}</button>`).join('');
      box.classList.remove('hidden');
      box.querySelectorAll('.auth-suggest-item').forEach(btn => {
        btn.addEventListener('mousedown', (e) => {
          e.preventDefault();
          input.value = btn.dataset.name || '';
          hideProfileDistrictSuggest();
        });
      });
    } catch (_e) { hideProfileDistrictSuggest(); }
  }

  function wireStudentReminderToggles() {
    const inputs = document.querySelectorAll('.js-student-reminder-toggle');
    inputs.forEach(input => {
      input.addEventListener('change', async () => {
        const id = input.dataset.studentId;
        try {
          await fetchJSON(`/api/parent/students/${id}/authorise-reminders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ allow: input.checked }),
          });
        } catch (e) {
          input.checked = !input.checked; // revert
          setStatus(`Could not update: ${e.message}`, 'err');
        }
      });
    });
  }

  function setStatus(msg, kind) {
    const node = el('profileSaveStatus');
    if (!node) return;
    node.textContent = msg || '';
    node.classList.remove('ok', 'err');
    if (kind) node.classList.add(kind);
  }

  function collectFormValues(form) {
    const out = {};
    for (const elem of form.querySelectorAll('input, select, textarea')) {
      const name = elem.name;
      if (!name) continue;
      if (elem.type === 'checkbox') {
        if (elem.name === 'subjects' || elem.name === 'studyPlanCourses') {
          if (!Array.isArray(out[name])) out[name] = [];
          if (elem.checked) out[name].push(elem.value);
        } else {
          out[name] = elem.checked;
        }
      } else if (elem.tagName === 'SELECT' && elem.name === 'weeklyDigestDay') {
        out[name] = parseInt(elem.value, 10);
      } else if (elem.tagName === 'SELECT' && elem.name === 'gradeLevel') {
        // Send as integer so the server gates on 1..12 cleanly.
        if (elem.value !== '') out[name] = parseInt(elem.value, 10);
      } else if (elem.value !== '') {
        out[name] = elem.value;
      }
    }
    return out;
  }

  async function saveProfile() {
    const form = el('profileForm');
    if (!form) return;
    const values = collectFormValues(form);
    setStatus('Saving…');
    try {
      const result = await fetchJSON('/api/me/rich-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      // Push the fresh user back into auth's cache so things that read
      // window.getCurrentUser() (curriculum browser, course filter) see
      // the new grade_level / country right away.
      if (result && result.user && typeof window.setCurrentUser === 'function') {
        window.setCurrentUser(result.user);
      }
      setStatus('Saved.', 'ok');
    } catch (e) {
      setStatus(e.message || 'Could not save.', 'err');
    }
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const back = el('profileBack');
    if (back) back.addEventListener('click', goBack);
    const saveBtn = el('profileSaveBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveProfile);
    const navBtn = el('profileNavBtn');
    if (navBtn) navBtn.addEventListener('click', openProfile);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else {
    wireOnce();
  }

  window.openProfile = openProfile;
})();
