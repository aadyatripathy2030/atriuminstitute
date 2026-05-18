// Admin page. Reached at /admin (clean URL via SPA fallthrough) or /#admin.
// Server enforces users.is_admin on every endpoint, so this code can be
// inspected freely without leaking access.

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function money(v) {
    const n = Number(v) || 0;
    if (n === 0) return '$0.00';
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(2)}`;
  }
  function num(n) {
    const v = Number(n) || 0;
    return v.toLocaleString();
  }
  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleString(); } catch { return s; }
  }
  function fmtDay(s) {
    if (!s) return '';
    try { return new Date(s).toLocaleDateString(); } catch { return s; }
  }

  async function fetchJSON(url, opts) {
    const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, opts || {}));
    let data = {};
    try { data = await res.json(); } catch { /* tolerate */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }
  function patchJSON(url, body) {
    return fetchJSON(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }
  function deleteJSON(url) { return fetchJSON(url, { method: 'DELETE' }); }

  let prevView = null;
  let allUsers = [];
  let allActivity = [];
  let userSearch = '';
  let userRoleFilter = '';
  let userStatusFilter = '';
  let activityFilter = '';

  function captureCurrentView() {
    const ids = ['courses-home', 'home', 'detail', 'profilePage', 'parentHome', 'parentStudentDetail', 'activityPage', 'tokenUsagePage', 'landing'];
    for (const id of ids) {
      const v = el(id);
      if (v && !v.classList.contains('hidden')) { prevView = id; return; }
    }
    prevView = null;
  }

  function goBack() {
    hide(el('adminPage'));
    if (window.location.pathname === '/admin') {
      try { history.replaceState(null, '', '/'); } catch { /* ignore */ }
    } else if (window.location.hash === '#admin') {
      try { history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
    }
    if (prevView && el(prevView)) show(el(prevView));
    else if (typeof window.goHome === 'function') window.goHome();
  }

  function switchTab(name) {
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === name);
    });
    document.querySelectorAll('.admin-tab-panel').forEach(p => {
      if (p.dataset.panel === name) p.classList.remove('hidden');
      else p.classList.add('hidden');
    });
    // Lazy-load each tab's data the first time it's selected.
    if (name === 'quiz' && !switchTab._loaded.quiz) { switchTab._loaded.quiz = true; loadQuiz(); }
    if (name === 'cost' && !switchTab._loaded.cost) { switchTab._loaded.cost = true; loadCost(); }
    if (name === 'sessions') loadSessions(); // refresh every time
    if (name === 'links' && !switchTab._loaded.links) { switchTab._loaded.links = true; loadLinks(); }
    if (name === 'lessons' && !switchTab._loaded.lessons) { switchTab._loaded.lessons = true; loadLessons(); }
  }
  switchTab._loaded = {};

  // ---------- Overview ----------
  function renderStats(stats) {
    const wrap = el('adminCards');
    if (!wrap) return;
    const cards = [
      { label: 'Total users', value: num(stats.users_total), sub: `${num(stats.students_total)} students · ${num(stats.parents_total)} parents` },
      { label: 'Verified users', value: num(stats.users_verified), sub: `${num(stats.active_sessions)} active sessions` },
      { label: 'Under-13 consent', value: `${num(stats.students_consent_granted)} / ${num(stats.students_consent_required)}`, sub: 'granted / required' },
      { label: 'Parent links', value: num(stats.links_total), sub: 'active student-parent pairs' },
      { label: 'Quiz attempts', value: num(stats.quiz_attempts_total), sub: `${num(stats.quiz_attempts_passed)} passed` },
      { label: 'Cached lessons', value: num(stats.cached_lessons_total), sub: `${num(stats.study_plans_total)} study plans` },
      { label: 'Cost · last 24h', value: money(stats.cost_24h), sub: 'AI tokens' },
      { label: 'Cost · last 30d', value: money(stats.cost_30d), sub: 'AI tokens' },
      { label: 'Cost · all time', value: money(stats.cost_all_time), sub: 'AI tokens' },
    ];
    wrap.innerHTML = cards.map(c => `
      <div class="token-card admin-card">
        <div class="token-card-label">${esc(c.label)}</div>
        <div class="token-card-value">${esc(c.value)}</div>
        <div class="token-card-sub">${esc(c.sub)}</div>
      </div>
    `).join('');
  }

  // ---------- Users ----------
  function userMatchesFilter(u) {
    if (userSearch) {
      const q = userSearch.toLowerCase();
      if (!u.email || !u.email.toLowerCase().includes(q)) return false;
    }
    if (userRoleFilter && u.role !== userRoleFilter) return false;
    if (userStatusFilter === 'verified' && !u.verified) return false;
    if (userStatusFilter === 'unverified' && u.verified) return false;
    if (userStatusFilter === 'admin' && !u.is_admin) return false;
    if (userStatusFilter === 'consent-pending' && !(u.consent_required && !u.consent_granted_at)) return false;
    return true;
  }
  function renderUsers() {
    const tbody = el('adminUsersTable').querySelector('tbody');
    const filtered = allUsers.filter(userMatchesFilter);
    el('adminUserCount').textContent = `${filtered.length} of ${allUsers.length}`;
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty">No users match.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.map(u => {
      const status = [];
      if (u.is_admin) status.push('<span class="admin-badge admin">admin</span>');
      if (!u.verified) status.push('<span class="admin-badge unverif">unverified</span>');
      if (u.consent_required && !u.consent_granted_at) status.push('<span class="admin-badge gated">consent pending</span>');
      if (u.consent_required && u.consent_granted_at) status.push('<span class="admin-badge ok">consent ok</span>');
      return `
        <tr class="admin-user-row" data-id="${esc(u.id)}">
          <td><a href="#" class="admin-user-link">${esc(u.email)}</a></td>
          <td>${esc(u.role)}</td>
          <td>${u.age == null ? '—' : esc(u.age)}</td>
          <td>${u.country ? esc(u.country) : '—'}</td>
          <td>${esc(fmtDay(u.created_at))}</td>
          <td class="num">${num(u.quiz_attempts)}</td>
          <td class="num">${num(u.quiz_passed)}</td>
          <td class="num">${num(u.activity_count)}</td>
          <td class="num">${money(u.cost_usd)}</td>
          <td>${status.join(' ') || '—'}</td>
        </tr>
      `;
    }).join('');
    tbody.querySelectorAll('.admin-user-row').forEach(row => {
      row.addEventListener('click', () => openUserDetail(row.dataset.id));
    });
  }

  // ---------- User detail modal ----------
  async function openUserDetail(userId) {
    const modal = el('modal');
    const backdrop = el('modalBackdrop');
    if (!modal) return;
    show(modal); show(backdrop);
    modal.innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div class="modal-content"><div class="parent-empty">Loading user…</div></div>
    `;
    let detail;
    try { detail = await fetchJSON(`/api/admin/users/${userId}`); }
    catch (e) {
      modal.innerHTML = `<button class="modal-close" onclick="closeModal()">✕</button><div class="modal-content"><div class="parent-empty err">${esc(e.message)}</div></div>`;
      return;
    }
    const u = detail.user;
    const usage = detail.usage || {};
    modal.innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div class="modal-content admin-user-modal">
        <h2>${esc(u.email)}</h2>
        <div class="admin-user-meta">
          ${esc(u.role)} · ${u.is_admin ? 'admin' : 'standard'} · ${u.verified ? 'verified' : 'unverified'}
          ${u.age ? ` · age ${u.age}` : ''}
          ${u.country ? ` · ${esc(u.country)}` : ''}
          ${u.consent_required ? ` · ${u.consent_granted_at ? 'consent granted' : 'CONSENT PENDING'}` : ''}
        </div>
        <div class="admin-user-meta-sub">Joined: ${fmtDate(u.created_at)} · User ID: <code>${esc(u.id)}</code></div>

        <div class="admin-user-stats">
          <div><strong>AI cost:</strong> ${money(usage.cost)} (${num(usage.calls)} calls)</div>
          <div><strong>Tokens:</strong> ${num(usage.input_tokens)} in / ${num(usage.output_tokens)} out</div>
          <div><strong>Recent quizzes:</strong> ${num(detail.attempts.length)} · <strong>activity events:</strong> ${num(detail.activity.length)}</div>
          <div><strong>Links:</strong> ${num(detail.links.length)} ${u.role === 'parent' ? 'students' : 'parents'}</div>
        </div>

        <div class="admin-user-actions">
          <button class="cta" id="admToggleAdmin">${u.is_admin ? 'Revoke admin' : 'Make admin'}</button>
          <button class="q-btn" id="admForceVerify" ${u.verified ? 'disabled' : ''}>Force-verify</button>
          <button class="q-btn" id="admSwapRole">Set role to ${u.role === 'student' ? 'parent' : 'student'}</button>
          <button class="q-btn admin-delete" id="admDeleteUser">Delete account</button>
        </div>

        <details class="admin-user-section" open>
          <summary>Linked accounts (${detail.links.length})</summary>
          ${detail.links.length ? `<ul class="admin-user-list">${detail.links.map(l => `<li>${esc(l.email)} ${l.role ? `(${esc(l.role)})` : ''}</li>`).join('')}</ul>` : '<div class="parent-empty">No links.</div>'}
        </details>

        <details class="admin-user-section">
          <summary>Recent quiz attempts (${detail.attempts.length})</summary>
          ${detail.attempts.length ? `<ul class="admin-user-list">${detail.attempts.map(a => `<li>${esc(a.course_id)} / ${esc(a.book_id)} / sec ${a.section_idx + 1} · ${a.score}/${a.total} · ${a.passed ? 'passed' : 'failed'}${a.attempt_number > 1 ? ` (attempt ${a.attempt_number})` : ''} · ${fmtDate(a.completed_at)}</li>`).join('')}</ul>` : '<div class="parent-empty">No quiz attempts.</div>'}
        </details>

        <details class="admin-user-section">
          <summary>Recent activity (${detail.activity.length})</summary>
          ${detail.activity.length ? `<ul class="admin-user-list">${detail.activity.slice(0, 30).map(a => `<li><code>${esc(a.kind)}</code> · ${fmtDate(a.created_at)}</li>`).join('')}</ul>` : '<div class="parent-empty">No activity.</div>'}
        </details>
      </div>
    `;
    el('admToggleAdmin').onclick = async () => {
      try {
        await patchJSON(`/api/admin/users/${u.id}`, { is_admin: !u.is_admin });
        await refreshUsers();
        closeModalSafe();
      } catch (e) { alert(e.message); }
    };
    el('admForceVerify').onclick = async () => {
      try {
        await patchJSON(`/api/admin/users/${u.id}`, { verified: true });
        await refreshUsers();
        closeModalSafe();
      } catch (e) { alert(e.message); }
    };
    el('admSwapRole').onclick = async () => {
      const newRole = u.role === 'student' ? 'parent' : 'student';
      if (!confirm(`Change role for ${u.email} to ${newRole}? Their existing data stays but the app will treat them as a ${newRole} from now on.`)) return;
      try {
        await patchJSON(`/api/admin/users/${u.id}`, { role: newRole });
        await refreshUsers();
        closeModalSafe();
      } catch (e) { alert(e.message); }
    };
    el('admDeleteUser').onclick = async () => {
      if (!confirm(`Permanently delete ${u.email}? This removes their account, profile, links, quiz attempts, and activity. The action cannot be undone.`)) return;
      if (!confirm(`Really delete? Type yes-delete in the next prompt to confirm.`)) return;
      const phrase = prompt('Type yes-delete to confirm.');
      if (phrase !== 'yes-delete') { alert('Not confirmed — no changes made.'); return; }
      try {
        await deleteJSON(`/api/admin/users/${u.id}`);
        await refreshUsers();
        closeModalSafe();
      } catch (e) { alert(e.message); }
    };
  }
  function closeModalSafe() {
    if (typeof window.closeModal === 'function') window.closeModal();
    else {
      hide(el('modal')); hide(el('modalBackdrop'));
    }
  }

  // ---------- Activity ----------
  function renderActivity() {
    const tbody = el('adminActivityTable').querySelector('tbody');
    const q = activityFilter.toLowerCase();
    const filtered = q
      ? allActivity.filter(a => (a.kind || '').toLowerCase().includes(q) || (a.email || '').toLowerCase().includes(q))
      : allActivity;
    el('adminActivityCount').textContent = `${filtered.length} of ${allActivity.length}`;
    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No activity matches.</td></tr>';
      return;
    }
    tbody.innerHTML = filtered.slice(0, 200).map(a => `
      <tr>
        <td>${esc(fmtDate(a.created_at))}</td>
        <td>${esc(a.email || a.user_id || '—')}</td>
        <td><code>${esc(a.kind)}</code></td>
        <td class="muted">${esc(metaPreview(a.meta))}</td>
      </tr>
    `).join('');
  }
  function metaPreview(meta) {
    if (!meta || typeof meta !== 'object') return '';
    const keys = ['courseId', 'bookId', 'sectionTitle', 'sectionIdx', 'score', 'total', 'passed', 'attemptNumber', 'hintLevel'];
    return keys.filter(k => meta[k] != null).map(k => `${k}=${meta[k]}`).join(', ');
  }

  // ---------- Quiz analytics ----------
  async function loadQuiz() {
    try {
      const data = await fetchJSON('/api/admin/quiz-analytics');
      const failedTbody = el('adminFailedSectionsTable').querySelector('tbody');
      failedTbody.innerHTML = (data.failedSections || []).map(r => `
        <tr><td>${esc(r.course_id)}</td><td>${esc(r.book_id)}</td><td>sec ${r.section_idx + 1}</td>
        <td class="num">${num(r.attempts)}</td><td class="num">${num(r.passes)}</td><td class="num warn">${num(r.fails)}</td></tr>
      `).join('') || '<tr><td colspan="6" class="empty">Not enough data yet.</td></tr>';

      const hardTbody = el('adminHardestQuestionsTable').querySelector('tbody');
      hardTbody.innerHTML = (data.hardestQuestions || []).map(r => `
        <tr><td>${esc(r.course_id)}</td><td>${esc(r.book_id)}</td><td>sec ${r.section_idx + 1}</td>
        <td class="muted">${esc(String(r.question || '').slice(0, 100))}</td>
        <td class="num warn">${num(r.wrong)}</td><td class="num">${num(r.total)}</td></tr>
      `).join('') || '<tr><td colspan="6" class="empty">Not enough graded answers yet.</td></tr>';

      const courseTbody = el('adminCourseStatsTable').querySelector('tbody');
      courseTbody.innerHTML = (data.courseStats || []).map(r => `
        <tr><td>${esc(r.course_id)}</td>
        <td class="num">${num(r.attempts)}</td><td class="num ok">${num(r.passes)}</td><td class="num">${num(r.students)}</td></tr>
      `).join('') || '<tr><td colspan="4" class="empty">No attempts yet.</td></tr>';
    } catch (e) { console.error(e); }
  }

  // ---------- Cost ----------
  async function loadCost() {
    try {
      const data = await fetchJSON('/api/admin/cost-chart');
      // Tiny sparkline-style bar chart.
      const days = data.byDay || [];
      const max = Math.max(0.0001, ...days.map(d => Number(d.cost) || 0));
      el('adminCostChartContainer').innerHTML = days.length
        ? `<div class="cost-bars">${days.map(d => `
            <div class="cost-bar" title="${esc(d.day)}: ${money(d.cost)} (${num(d.calls)} calls)">
              <div class="cost-bar-fill" style="height: ${Math.max(2, 100 * (Number(d.cost) || 0) / max).toFixed(1)}%"></div>
              <div class="cost-bar-label">${esc(String(d.day).slice(5))}</div>
            </div>
          `).join('')}</div>`
        : '<div class="parent-empty">No usage in the last 30 days.</div>';

      const topTbody = el('adminTopSpendersTable').querySelector('tbody');
      topTbody.innerHTML = (data.topUsers || []).map(r => `
        <tr><td>${esc(r.email || r.user_id)}</td><td class="num">${num(r.calls)}</td><td class="num">${money(r.cost)}</td></tr>
      `).join('') || '<tr><td colspan="3" class="empty">No usage yet.</td></tr>';

      const intentTbody = el('adminCostByIntentTable').querySelector('tbody');
      intentTbody.innerHTML = (data.byIntent || []).map(r => `
        <tr><td>${esc(r.intent)}</td><td class="num">${num(r.calls)}</td><td class="num">${money(r.cost)}</td></tr>
      `).join('') || '<tr><td colspan="3" class="empty">No usage yet.</td></tr>';
    } catch (e) { console.error(e); }
  }

  // ---------- Sessions ----------
  async function loadSessions() {
    try {
      const { sessions } = await fetchJSON('/api/admin/sessions');
      const tbody = el('adminSessionsTable').querySelector('tbody');
      tbody.innerHTML = (sessions || []).map(s => `
        <tr><td>${esc(s.email || s.user_id)}</td><td>${esc(fmtDate(s.created_at))}</td><td>${esc(fmtDate(s.expires_at))}</td>
        <td><button class="q-btn admin-revoke" data-token="${esc(s.token)}">Revoke</button></td></tr>
      `).join('') || '<tr><td colspan="4" class="empty">No active sessions.</td></tr>';
      tbody.querySelectorAll('.admin-revoke').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm(`Force sign-out this session?`)) return;
          try {
            await deleteJSON(`/api/admin/sessions/${btn.dataset.token}`);
            loadSessions();
          } catch (e) { alert(e.message); }
        });
      });
    } catch (e) { console.error(e); }
  }

  // ---------- Links ----------
  async function loadLinks() {
    try {
      const { links } = await fetchJSON('/api/admin/links');
      const tbody = el('adminLinksTable').querySelector('tbody');
      tbody.innerHTML = (links || []).map(l => {
        const consent = l.consent_required
          ? (l.consent_granted_at ? '<span class="admin-badge ok">granted</span>' : '<span class="admin-badge gated">pending</span>')
          : '<span class="muted">n/a</span>';
        return `<tr><td>${esc(l.parent_email || l.parent_user_id)}</td>
          <td>${esc(l.student_email || l.student_user_id)}</td>
          <td>${l.age != null ? esc(l.age) : '—'}</td>
          <td>${consent}</td>
          <td><code>${esc(l.status)}</code></td>
          <td>${esc(fmtDate(l.created_at))}</td></tr>`;
      }).join('') || '<tr><td colspan="6" class="empty">No links yet.</td></tr>';
    } catch (e) { console.error(e); }
  }

  // ---------- Lessons ----------
  async function loadLessons() {
    try {
      const { courses } = await fetchJSON('/api/admin/lessons');
      const tbody = el('adminLessonsTable').querySelector('tbody');
      tbody.innerHTML = (courses || []).map(c => `
        <tr><td>${esc(c.course_id)}</td><td class="num">${num(c.cached_count)}</td><td>${c.latest_at ? esc(fmtDate(c.latest_at)) : '—'}</td></tr>
      `).join('') || '<tr><td colspan="3" class="empty">No cached lessons yet — click "Start prebuild" below.</td></tr>';
      populatePrebuildCourseSelect();
      refreshPrebuildStatus();
    } catch (e) { console.error(e); }
  }

  function populatePrebuildCourseSelect() {
    const sel = el('prebuildCourse');
    if (!sel || sel.options.length > 1) return;
    if (typeof COURSES === 'undefined') return;
    for (const [id, c] of Object.entries(COURSES)) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = c.title;
      sel.appendChild(opt);
    }
  }

  // Cascade: course -> topic (book) -> lesson (section). Resets downstream
  // selects whenever an upstream changes, and disables them when the
  // upstream is "all".
  function _resetSelect(sel, placeholder) {
    if (!sel) return;
    sel.innerHTML = '';
    const o = document.createElement('option');
    o.value = '';
    o.textContent = placeholder;
    sel.appendChild(o);
  }

  function refreshPrebuildBookSelect() {
    const bookSel = el('prebuildBook');
    const sectionSel = el('prebuildSection');
    if (!bookSel) return;
    _resetSelect(bookSel, 'All topics');
    _resetSelect(sectionSel, 'All lessons');
    sectionSel.disabled = true;
    const courseId = el('prebuildCourse').value;
    if (!courseId || typeof COURSES === 'undefined' || !COURSES[courseId]) {
      bookSel.disabled = true;
      return;
    }
    bookSel.disabled = false;
    for (const b of (COURSES[courseId].books || [])) {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = b.title;
      bookSel.appendChild(opt);
    }
  }

  function refreshPrebuildSectionSelect() {
    const sectionSel = el('prebuildSection');
    if (!sectionSel) return;
    _resetSelect(sectionSel, 'All lessons');
    const courseId = el('prebuildCourse').value;
    const bookId = el('prebuildBook').value;
    if (!courseId || !bookId || typeof COURSES === 'undefined' || !COURSES[courseId]) {
      sectionSel.disabled = true;
      return;
    }
    const book = (COURSES[courseId].books || []).find(b => b.id === bookId);
    if (!book) { sectionSel.disabled = true; return; }
    sectionSel.disabled = false;
    (book.sections || []).forEach((sec, idx) => {
      const opt = document.createElement('option');
      // Value carries kind + idx so the server can disambiguate.
      opt.value = `s:${idx}`;
      opt.textContent = `${idx + 1}. ${sec.title || 'Lesson ' + (idx + 1)}`;
      sectionSel.appendChild(opt);
    });
    if (book.cumulativeTest) {
      const opt = document.createElement('option');
      opt.value = 'c';
      opt.textContent = 'Cumulative test';
      sectionSel.appendChild(opt);
    }
  }

  let _prebuildPoll = null;
  async function refreshPrebuildStatus() {
    try {
      const { state } = await fetchJSON('/api/admin/prebuild-lessons');
      renderPrebuildState(state);
      if (state.running) {
        if (!_prebuildPoll) _prebuildPoll = setInterval(refreshPrebuildStatus, 2000);
      } else if (_prebuildPoll) {
        clearInterval(_prebuildPoll); _prebuildPoll = null;
        // Refresh the cached-lessons count table once it finishes.
        loadLessons();
      }
    } catch (e) { console.error(e); }
  }

  function renderPrebuildState(state) {
    const box = el('prebuildProgress');
    const startBtn = el('prebuildStartBtn');
    const cancelBtn = el('prebuildCancelBtn');
    if (!box) return;
    if (!state || (!state.running && state.total === 0)) {
      box.classList.add('hidden');
      startBtn.disabled = false;
      cancelBtn.disabled = true;
      return;
    }
    box.classList.remove('hidden');
    const pct = state.total ? Math.round(100 * state.done / state.total) : 0;
    const fill = el('prebuildBarFill');
    if (fill) fill.style.width = pct + '%';
    let statusIcon;
    if (state.running && state.cancelled) statusIcon = '⏹ Cancelling… (waiting for in-flight calls)';
    else if (state.running) statusIcon = '⏳ Running…';
    else if (state.cancelled) statusIcon = '⏹ Cancelled';
    else statusIcon = '✓ Done';
    const lineParts = [
      statusIcon,
      `${state.done}/${state.total} (${pct}%)`,
      `${state.generated} generated`,
      `${state.skipped} skipped`,
      `${state.failed} failed`,
    ];
    if (state.lastSection) lineParts.push(`last: ${state.lastSection}`);
    if (state.startedByEmail) lineParts.push(`started by ${state.startedByEmail}`);
    el('prebuildStatusLine').textContent = lineParts.join(' · ');
    const errBox = el('prebuildErrors');
    if (state.errors && state.errors.length) {
      errBox.innerHTML = '<strong>Errors (first 20):</strong><ul>' +
        state.errors.map(e => `<li><code>${esc(e.section || '?')}</code> · ${esc(e.message)}</li>`).join('') + '</ul>';
    } else {
      errBox.innerHTML = '';
    }
    startBtn.disabled = !!state.running;
    cancelBtn.disabled = !state.running;
  }

  async function startPrebuild() {
    const onlyCourse = el('prebuildCourse').value || null;
    const onlyBook = el('prebuildBook').value || null;
    const sectionRaw = el('prebuildSection').value || '';
    let onlySection = null;
    let onlySectionKind = null;
    if (sectionRaw.startsWith('s:')) {
      onlySection = Number(sectionRaw.slice(2));
      onlySectionKind = 'section';
    } else if (sectionRaw === 'c') {
      onlySection = 0;
      onlySectionKind = 'cumulative';
    }
    const force = el('prebuildForce').checked;
    if (force && !confirm('Regenerate ALREADY-cached lessons too? This costs more — every previously-cached section will be re-billed.')) return;
    try {
      await fetchJSON('/api/admin/prebuild-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyCourse, onlyBook, onlySection, onlySectionKind, force, concurrency: 3 }),
      });
      refreshPrebuildStatus();
    } catch (e) {
      alert(e.message);
    }
  }
  async function cancelPrebuild() {
    // Optimistic UI: flip the button to "Cancelling…" before the request
    // returns, so the click feels acknowledged. In-flight Claude calls
    // (concurrency 3) take 5-15s each to finish; the status line will
    // reflect that explicitly until they drain.
    const cancelBtn = el('prebuildCancelBtn');
    const statusLine = el('prebuildStatusLine');
    if (cancelBtn) {
      cancelBtn.disabled = true;
      cancelBtn.textContent = 'Cancelling…';
    }
    if (statusLine) {
      statusLine.textContent = '⏹ Cancelling… (waiting for in-flight calls to finish)';
    }
    try {
      await fetchJSON('/api/admin/prebuild-lessons/cancel', { method: 'POST' });
      refreshPrebuildStatus();
    } catch (e) {
      if (cancelBtn) { cancelBtn.disabled = false; cancelBtn.textContent = '⏹ Cancel prebuild'; }
      alert(e.message);
    }
  }

  // ---------- Page-level ----------
  async function refreshUsers() {
    try {
      const [statsR, usersR, activityR] = await Promise.all([
        fetchJSON('/api/admin/stats'),
        fetchJSON('/api/admin/users'),
        fetchJSON('/api/admin/activity'),
      ]);
      renderStats(statsR.stats || {});
      allUsers = usersR.users || [];
      allActivity = activityR.activity || [];
      renderUsers();
      renderActivity();
    } catch (e) {
      el('adminCards').innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
    }
  }

  async function openAdmin() {
    const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (!user || !user.is_admin) {
      alert('This page is only available to admins.');
      if (typeof window.goHome === 'function') window.goHome();
      return;
    }
    captureCurrentView();
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('adminPage'));
    switchTab._loaded = {};
    switchTab('overview');
    el('adminCards').innerHTML = '<div class="parent-empty">Loading…</div>';
    await refreshUsers();
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const back = el('adminBack');
    if (back) back.addEventListener('click', goBack);
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.addEventListener('click', () => switchTab(t.dataset.tab));
    });
    const us = el('adminUserSearch');
    if (us) us.addEventListener('input', () => { userSearch = us.value.trim(); renderUsers(); });
    const ur = el('adminUserRoleFilter');
    if (ur) ur.addEventListener('change', () => { userRoleFilter = ur.value; renderUsers(); });
    const usf = el('adminUserStatusFilter');
    if (usf) usf.addEventListener('change', () => { userStatusFilter = usf.value; renderUsers(); });
    const af = el('adminActivityFilter');
    if (af) af.addEventListener('input', () => { activityFilter = af.value.trim(); renderActivity(); });
    const pbStart = el('prebuildStartBtn');
    if (pbStart) pbStart.addEventListener('click', startPrebuild);
    const pbCancel = el('prebuildCancelBtn');
    if (pbCancel) pbCancel.addEventListener('click', cancelPrebuild);
    const pbCourse = el('prebuildCourse');
    if (pbCourse) pbCourse.addEventListener('change', refreshPrebuildBookSelect);
    const pbBook = el('prebuildBook');
    if (pbBook) pbBook.addEventListener('change', refreshPrebuildSectionSelect);
  }

  function isAdminRoute() {
    return window.location.pathname === '/admin' || window.location.hash === '#admin';
  }
  function checkRoute() {
    if (!isAdminRoute()) return;
    const u = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (u && u.is_admin) openAdmin();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { wireOnce(); checkRoute(); });
  } else {
    wireOnce();
    checkRoute();
  }
  window.addEventListener('hashchange', checkRoute);
  window.addEventListener('popstate', checkRoute);

  let retries = 0;
  const retryRoute = setInterval(() => {
    retries++;
    if (!isAdminRoute() || retries > 20) { clearInterval(retryRoute); return; }
    const u = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (u) {
      clearInterval(retryRoute);
      if (u.is_admin && el('adminPage') && el('adminPage').classList.contains('hidden')) openAdmin();
    }
  }, 250);

  window.openAdmin = openAdmin;
})();
