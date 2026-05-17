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

  function accountFieldset(userInfo) {
    const age = (userInfo && userInfo.age != null) ? userInfo.age : null;
    const country = (userInfo && userInfo.country) || '';
    return `
      <fieldset>
        <legend>Account</legend>
        <label>Age
          ${age != null
            ? `<input type="text" value="${esc(age)}" disabled> <small class="profile-hint">Set at signup. Contact us to change.</small>`
            : `<input type="text" value="(not set)" disabled> <small class="profile-hint">If you signed up before we asked, contact us to add it.</small>`}
        </label>
        <label>Country
          <select name="country">
            <option value="">${country ? 'Keep current value' : 'Select country…'}</option>
            ${countryOptions(country)}
          </select>
          ${country ? `<small class="profile-hint">Current: ${esc(country)}</small>` : ''}
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
        <label>School name <input type="text" name="schoolName" value="${esc(p.school_name || '')}" maxlength="200"></label>
        <label>Grade level <input type="text" name="gradeLevel" placeholder="e.g. 9th" value="${esc(p.grade_level || '')}" maxlength="50"></label>
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
    ['landing', 'authGate', 'consentGate', 'parentHome', 'parentStudentDetail', 'courses-home', 'home', 'detail'].forEach(id => hide(el(id)));
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
    } catch (e) {
      form.innerHTML = `<div class="profile-loading err">Could not load: ${esc(e.message)}</div>`;
    }
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
      await fetchJSON('/api/me/rich-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
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
