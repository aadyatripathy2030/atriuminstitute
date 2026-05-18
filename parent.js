// Parent dashboard. Called from auth.js when a verified parent user lands.
// Renders the family overview, the per-student detail view, and the
// "link another student" form. All data is fetched from /api/parent/*
// endpoints which authorise on the server (parent can only see their
// own students).

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleString(); } catch { return s; }
  }
  function fmtLinkCode(code) {
    if (!code) return '————————';
    return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
  }

  function describe(a) {
    if (typeof window.describeActivity === 'function') return window.describeActivity(a);
    return { icon: '•', title: a.kind, detail: '', when: a.created_at || '' };
  }
  function activityRow(a) {
    const d = describe(a);
    return `
      <div class="activity-event">
        <div class="activity-icon">${d.icon}</div>
        <div class="activity-body">
          <div class="activity-title">${escapeHTML(d.title)}</div>
          ${d.detail ? `<div class="activity-detail">${escapeHTML(d.detail)}</div>` : ''}
        </div>
        <div class="activity-when">${escapeHTML(d.when)}</div>
      </div>
    `;
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  function setLinkError(msg, kind) {
    const n = el('parentLinkError');
    if (!n) return;
    n.classList.remove('ok', 'err');
    if (!msg) { hide(n); n.textContent = ''; return; }
    n.textContent = msg;
    if (kind) n.classList.add(kind);
    show(n);
  }

  function _fmtMin(seconds) {
    const m = Math.round((seconds || 0) / 60);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), mm = m % 60;
    return mm === 0 ? h + ' hr' : `${h}h ${mm}m`;
  }

  async function renderStudentList() {
    const wrap = el('parentStudentList');
    if (!wrap) return;
    wrap.innerHTML = '<div class="parent-empty">Loading…</div>';
    try {
      const { students } = await fetchJSON('/api/parent/students');
      if (!students || students.length === 0) {
        wrap.innerHTML = '<div class="parent-empty">No students linked yet. Use the form below to add one with their code.</div>';
        return;
      }
      // Multi-child summary cards: fetch this week's activity for each
      // student in parallel so the parent gets a one-glance view of all
      // their kids before drilling into any single one.
      wrap.innerHTML = `<div class="multi-child-grid" id="parentMultiChildGrid"></div>`;
      const grid = el('parentMultiChildGrid');
      // Render placeholder cards first so the page paints fast.
      for (const s of students) {
        const card = document.createElement('div');
        card.className = 'multi-child-card';
        card.dataset.studentId = s.id;
        const initial = (s.email || '?').trim()[0].toUpperCase();
        const consentBadge = s.consent_required
          ? (s.consent_granted_at ? '<span class="badge ok">Consent granted</span>' : '<span class="badge warn">Awaiting consent</span>')
          : '';
        card.innerHTML = `
          <div class="multi-child-head">
            <div class="multi-child-avatar">${escapeHTML(initial)}</div>
            <div>
              <div class="multi-child-email">${escapeHTML(s.email)}</div>
              <div class="multi-child-meta">
                ${s.age ? `Age ${s.age}` : ''}${s.country || s.state ? ` · ${escapeHTML(s.country || s.state)}` : ''}
                ${consentBadge ? ` · ${consentBadge}` : ''}
              </div>
            </div>
          </div>
          <div class="multi-child-stats">
            <div class="mc-stat"><div class="mc-stat-num" data-stat="quizzes">…</div><div class="mc-stat-label">Quizzes this week</div></div>
            <div class="mc-stat"><div class="mc-stat-num" data-stat="lessons">…</div><div class="mc-stat-label">Lessons</div></div>
            <div class="mc-stat"><div class="mc-stat-num" data-stat="time">…</div><div class="mc-stat-label">Time</div></div>
          </div>
          <button class="cta-secondary cta-full mc-view-btn" type="button">View progress →</button>
        `;
        card.querySelector('.mc-view-btn').addEventListener('click', () => openStudentDetail(s));
        grid.appendChild(card);
      }
      // Hydrate each card's stats in parallel.
      await Promise.all(students.map(async (s) => {
        const card = grid.querySelector(`.multi-child-card[data-student-id="${s.id}"]`);
        if (!card) return;
        try {
          const summary = await fetchJSON(`/api/parent/students/${s.id}/activity-summary?range=weekly`);
          const subjects = summary.subjects || [];
          const totals = subjects.reduce((a, x) => ({
            q: a.q + (x.quizzes_started || 0),
            l: a.l + (x.lessons_started || 0),
            t: a.t + (x.time_spent_seconds || 0),
          }), { q: 0, l: 0, t: 0 });
          card.querySelector('[data-stat="quizzes"]').textContent = totals.q;
          card.querySelector('[data-stat="lessons"]').textContent = totals.l;
          card.querySelector('[data-stat="time"]').textContent = _fmtMin(totals.t);
        } catch (e) {
          card.querySelector('[data-stat="quizzes"]').textContent = '—';
          card.querySelector('[data-stat="lessons"]').textContent = '—';
          card.querySelector('[data-stat="time"]').textContent = '—';
        }
      }));
    } catch (e) {
      wrap.innerHTML = `<div class="parent-empty err">Could not load students: ${escapeHTML(e.message)}</div>`;
    }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  // Activity-rollup helpers for the parent detail page.
  let _parentSummaryRange = 'daily';
  let _parentSummaryWired = null;

  function _fmtMinutes(seconds) {
    const m = Math.round((seconds || 0) / 60);
    if (m < 60) return m + ' min';
    const h = Math.floor(m / 60), mm = m % 60;
    return mm === 0 ? h + ' hr' : `${h}h ${mm}m`;
  }

  function _fmtRangeLabel(range, from, to) {
    const r = (range || 'daily').toLowerCase();
    const label = { daily: 'Today', weekly: 'Last 7 days', monthly: 'Last 30 days', quarterly: 'Last 90 days' }[r] || 'Today';
    if (!from || !to) return label;
    return `${label} (${from} → ${to})`;
  }

  async function _reloadParentSummary(studentId) {
    const tbody = document.querySelector('#parentSummaryTable tbody');
    const rangeNote = el('parentSummaryRange');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="9" class="empty">Loading…</td></tr>';
    try {
      const data = await fetchJSON(`/api/parent/students/${encodeURIComponent(studentId)}/activity-summary?range=${_parentSummaryRange}`);
      if (rangeNote) rangeNote.textContent = _fmtRangeLabel(data.range, data.from, data.to);
      const subjects = data.subjects || [];
      const tot = subjects.reduce((a, s) => ({
        signins: a.signins + s.signins,
        lessons_started: a.lessons_started + s.lessons_started,
        quizzes_started: a.quizzes_started + s.quizzes_started,
        quizzes_passed: a.quizzes_passed + s.quizzes_passed,
        quizzes_failed: a.quizzes_failed + s.quizzes_failed,
        hints_used: a.hints_used + s.hints_used,
        time_spent_seconds: a.time_spent_seconds + s.time_spent_seconds,
      }), { signins: 0, lessons_started: 0, quizzes_started: 0, quizzes_passed: 0, quizzes_failed: 0, hints_used: 0, time_spent_seconds: 0 });
      const avg = subjects.length ? Math.round(subjects.reduce((a, s) => a + (s.avg_score_pct || 0), 0) / subjects.length) : 0;
      tbody.innerHTML = subjects.map(s => `
        <tr>
          <td>${esc(s.subject_title)}</td>
          <td class="num">${s.signins}</td>
          <td class="num">${s.lessons_started}</td>
          <td class="num">${s.quizzes_started}</td>
          <td class="num ok">${s.quizzes_passed}</td>
          <td class="num warn">${s.quizzes_failed}</td>
          <td class="num">${s.avg_score_pct || 0}%</td>
          <td class="num">${s.hints_used}</td>
          <td class="num">${_fmtMinutes(s.time_spent_seconds)}</td>
        </tr>
      `).join('') + `
        <tr class="summary-total">
          <td><strong>Total</strong></td>
          <td class="num"><strong>${tot.signins}</strong></td>
          <td class="num"><strong>${tot.lessons_started}</strong></td>
          <td class="num"><strong>${tot.quizzes_started}</strong></td>
          <td class="num ok"><strong>${tot.quizzes_passed}</strong></td>
          <td class="num warn"><strong>${tot.quizzes_failed}</strong></td>
          <td class="num"><strong>${avg}%</strong></td>
          <td class="num"><strong>${tot.hints_used}</strong></td>
          <td class="num"><strong>${_fmtMinutes(tot.time_spent_seconds)}</strong></td>
        </tr>
      `;
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="9" class="empty err">Could not load: ${esc(e.message)}</td></tr>`;
    }
  }

  function _wireParentSummaryTabs(studentId) {
    // Re-wire if a different student is opened (we keep a single set of
    // tab DOM elements but the click handlers point at a specific id).
    if (_parentSummaryWired === studentId) return;
    _parentSummaryWired = studentId;
    document.querySelectorAll('#parentSummaryTabs .summary-tab').forEach(b => {
      b.onclick = () => {
        document.querySelectorAll('#parentSummaryTabs .summary-tab').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        _parentSummaryRange = b.dataset.range || 'daily';
        _reloadParentSummary(studentId);
      };
    });
  }

  async function openStudentDetail(student) {
    hide(el('parentHome'));
    show(el('parentStudentDetail'));
    el('parentDetailName').textContent = student.email;
    const meta = [];
    if (student.age) meta.push(`Age ${student.age}`);
    if (student.country || student.state) meta.push(student.country || student.state);
    if (student.consent_required) {
      meta.push(student.consent_granted_at ? 'Consent granted' : 'Awaiting consent');
    }
    el('parentDetailMeta').textContent = meta.join(' · ');
    // Wire + load the activity rollup for this student.
    _parentSummaryRange = 'daily';
    document.querySelectorAll('#parentSummaryTabs .summary-tab').forEach(b => b.classList.toggle('active', b.dataset.range === 'daily'));
    _wireParentSummaryTabs(student.id);
    _reloadParentSummary(student.id);

    // Make sure there's a summary container at the top of the detail
    // view. Re-uses the existing parentStudentDetail layout.
    const detailRoot = el('parentStudentDetail');
    let summaryEl = el('parentDetailSummary');
    if (!summaryEl) {
      summaryEl = document.createElement('section');
      summaryEl.id = 'parentDetailSummary';
      summaryEl.className = 'parent-section parent-360-summary';
      // Insert just after the hero, before "Weak topics".
      const firstSection = detailRoot.querySelector('.parent-section');
      if (firstSection) detailRoot.insertBefore(summaryEl, firstSection);
      else detailRoot.appendChild(summaryEl);
    }
    summaryEl.innerHTML = '<div class="parent-empty">Loading…</div>';

    const weakEl = el('parentDetailWeak');
    const quizEl = el('parentDetailQuizzes');
    const activityEl = el('parentDetailActivity');
    weakEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    quizEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    activityEl.innerHTML = '<div class="parent-empty">Loading…</div>';

    try {
      const [profileR, sectionsR, attemptsR, activityR, planR] = await Promise.all([
        fetchJSON(`/api/parent/students/${student.id}/profile`).catch(() => ({})),
        fetchJSON(`/api/parent/students/${student.id}/weak-sections`),
        fetchJSON(`/api/parent/students/${student.id}/quiz-attempts`),
        fetchJSON(`/api/parent/students/${student.id}/activity`),
        fetchJSON(`/api/parent/students/${student.id}/study-plan`).catch(() => ({})),
      ]);
      const profile = profileR.profile || {};
      const userInfo = profileR.user || {};
      const sections = sectionsR.sections || [];
      const attempts = attemptsR.attempts || [];
      const activity = activityR.activity || [];
      const plan = planR.plan || null;

      // ---------- 360 summary at top ----------
      const totalQuizzes = attempts.length;
      const passed = attempts.filter(a => a.passed).length;
      const passRate = totalQuizzes ? Math.round((passed / totalQuizzes) * 100) : null;
      const lastActivity = activity[0] ? activity[0].created_at : (attempts[0] ? attempts[0].completed_at : null);
      const lessonsStarted = activity.filter(a => a.kind === 'lesson_started').length;
      const studySessions = activity.filter(a => a.kind === 'study_started').length;
      const hintsUsed = activity.filter(a => a.kind === 'hint_used').length;
      const signins = activity.filter(a => a.kind === 'signin').length;

      const profileLines = [];
      if (profile.display_name) profileLines.push(`<strong>${escapeHTML(profile.display_name)}</strong>`);
      if (profile.school_name) profileLines.push(`School: ${escapeHTML(profile.school_name)}`);
      if (profile.grade_level) profileLines.push(`Grade: ${escapeHTML(profile.grade_level)}`);
      if (userInfo.age) profileLines.push(`Age: ${userInfo.age}`);
      if (userInfo.country) profileLines.push(`Country: ${escapeHTML(userInfo.country)}`);
      if (profile.subjects && profile.subjects.length) profileLines.push(`Subjects: ${profile.subjects.map(escapeHTML).join(', ')}`);
      if (profile.study_goal) profileLines.push(`Goal (own words): "${escapeHTML(profile.study_goal)}"`);

      const planLine = plan
        ? `<div class="parent-summary-plan">📋 <strong>Study plan:</strong> ${escapeHTML(plan.goal_text || '')}${plan.target_date ? ` · target ${new Date(plan.target_date).toLocaleDateString()}` : ''}</div>`
        : '';

      summaryEl.innerHTML = `
        <h2>At a glance</h2>
        <div class="parent-summary-grid">
          <div class="parent-summary-card">
            <div class="parent-summary-label">Quizzes taken</div>
            <div class="parent-summary-value">${totalQuizzes}</div>
            <div class="parent-summary-sub">${passed} passed${passRate != null ? ` · ${passRate}% pass rate` : ''}</div>
          </div>
          <div class="parent-summary-card">
            <div class="parent-summary-label">Max lessons</div>
            <div class="parent-summary-value">${lessonsStarted}</div>
            <div class="parent-summary-sub">${studySessions} full Study sessions</div>
          </div>
          <div class="parent-summary-card">
            <div class="parent-summary-label">Hints used</div>
            <div class="parent-summary-value">${hintsUsed}</div>
            <div class="parent-summary-sub">Times asked Max for a nudge</div>
          </div>
          <div class="parent-summary-card">
            <div class="parent-summary-label">Sign-ins</div>
            <div class="parent-summary-value">${signins}</div>
            <div class="parent-summary-sub">Last active: ${lastActivity ? fmtDate(lastActivity) : '—'}</div>
          </div>
        </div>
        ${profileLines.length ? `<div class="parent-summary-profile">${profileLines.join(' · ')}</div>` : ''}
        ${planLine}
      `;

      // ---------- Existing detail sections ----------
      weakEl.innerHTML = sections.length
        ? sections.map(s => `
            <div class="parent-detail-row">
              <div>${escapeHTML(s.course_id)} · ${escapeHTML(s.book_id)} · section ${s.section_idx + 1}</div>
              <div class="muted">${s.failures} failed ${s.failures === 1 ? 'attempt' : 'attempts'}</div>
            </div>
          `).join('')
        : '<div class="parent-empty">No weak topics yet. Either they haven\'t failed anything twice, or they haven\'t taken many quizzes.</div>';

      quizEl.innerHTML = attempts.length
        ? attempts.slice(0, 25).map(a => `
            <div class="parent-detail-row">
              <div>${escapeHTML(a.course_id)} · ${escapeHTML(a.book_id)} · section ${a.section_idx + 1}${a.section_kind !== 'section' ? ` (${escapeHTML(a.section_kind)})` : ''}${a.attempt_number > 1 ? ` · attempt ${a.attempt_number}` : ''}</div>
              <div class="${a.passed ? 'ok' : 'warn'}">${a.score}/${a.total} · ${a.passed ? 'passed' : 'did not pass'}${a.duration_seconds ? ` · ${Math.round(a.duration_seconds / 60)} min` : ''}</div>
              <div class="muted">${fmtDate(a.completed_at)}</div>
            </div>
          `).join('')
        : '<div class="parent-empty">No quiz attempts yet.</div>';

      activityEl.innerHTML = activity.length
        ? activity.slice(0, 50).map(activityRow).join('')
        : '<div class="parent-empty">No activity yet for this student.</div>';
    } catch (e) {
      const msg = `<div class="parent-empty err">Could not load: ${escapeHTML(e.message)}</div>`;
      summaryEl.innerHTML = msg;
      weakEl.innerHTML = msg; quizEl.innerHTML = msg; activityEl.innerHTML = msg;
    }
  }

  function closeStudentDetail() {
    hide(el('parentStudentDetail'));
    show(el('parentHome'));
  }

  async function handleLinkSubmit(e) {
    e.preventDefault();
    setLinkError('');
    const code = (el('parentLinkInput').value || '').trim();
    if (!code) return;
    try {
      const r = await postJSON('/api/me/links', { linkCode: code });
      el('parentLinkInput').value = '';
      if (r && r.pending) {
        // Two-sided approval: link is created in pending state. The
        // student now needs to approve it from their own dashboard.
        setLinkError(r.message || 'Invitation sent. The link goes live once the student approves.', 'ok');
      }
      await renderPendingForMe();
      await renderStudentList();
    } catch (err) {
      setLinkError(err.message);
    }
  }

  async function renderPendingForMe() {
    const wrap = el('parentPendingInvites');
    if (!wrap) return;
    try {
      const { pending } = await fetchJSON('/api/me/links/pending');
      if (!pending || !pending.length) {
        wrap.innerHTML = '';
        return;
      }
      wrap.innerHTML = `
        <div class="pending-invites">
          <h3>Pending invitations</h3>
          <p class="pending-invites-help">A student typed your link code. Approve only if you recognise the email.</p>
          ${pending.map(p => `
            <div class="pending-invite-row" data-id="${escapeHTML(p.id)}">
              <div class="pending-invite-email"><strong>${escapeHTML(p.initiated_by_email)}</strong> wants to link with you as your ${escapeHTML(p.initiated_by_role)}.</div>
              <div class="pending-invite-actions">
                <button class="btn-primary" data-action="approve">Approve</button>
                <button class="btn-secondary" data-action="reject">Reject</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      wrap.querySelectorAll('.pending-invite-row').forEach(row => {
        const id = row.dataset.id;
        row.querySelector('[data-action="approve"]').addEventListener('click', () => handleApproveInvite(id));
        row.querySelector('[data-action="reject"]').addEventListener('click', () => handleRejectInvite(id));
      });
    } catch (_e) {
      // Don't blow up the dashboard if pending fetch fails.
      wrap.innerHTML = '';
    }
  }

  async function handleApproveInvite(id) {
    try {
      await postJSON(`/api/me/links/${encodeURIComponent(id)}/approve`, {});
      await renderPendingForMe();
      await renderStudentList();
    } catch (err) {
      setLinkError(err.message);
    }
  }

  async function handleRejectInvite(id) {
    try {
      await postJSON(`/api/me/links/${encodeURIComponent(id)}/reject`, {});
      await renderPendingForMe();
    } catch (err) {
      setLinkError(err.message);
    }
  }

  async function initParentHome(user) {
    if (typeof window.hideAllTopLevel === 'function') {
      window.hideAllTopLevel();
    } else {
      // Fallback if auth.js hasn't loaded yet.
      ['landing', 'courses-home', 'home', 'detail', 'consentGate', 'authGate',
       'profilePage', 'activityPage', 'tokenUsagePage', 'parentStudentDetail',
       'about', 'contact', 'privacy', 'terms'].forEach(id => hide(el(id)));
    }
    show(el('parentHome'));
    el('parentOwnLinkCode').textContent = fmtLinkCode(user && user.link_code);
    await renderPendingForMe();
    await renderStudentList();
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const form = el('parentLinkForm');
    if (form) form.addEventListener('submit', handleLinkSubmit);
    const back = el('parentDetailBack');
    if (back) back.addEventListener('click', closeStudentDetail);
    const copy = el('parentCopyBtn');
    if (copy) copy.addEventListener('click', () => {
      const code = (el('parentOwnLinkCode').textContent || '').replace('-', '');
      if (code && code !== '————————') copyToClipboard(code);
    });
  }

  window.showParentDashboard = async function (user) {
    wireOnce();
    await initParentHome(user);
  };
})();
