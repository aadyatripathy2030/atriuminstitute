// Student-facing "your activity" page. Mirrors the structure of the parent's
// per-student detail view, but fetches /api/me/* endpoints so a student sees
// their own data.

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleString(); } catch { return s; }
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
          <div class="activity-title">${esc(d.title)}</div>
          ${d.detail ? `<div class="activity-detail">${esc(d.detail)}</div>` : ''}
        </div>
        <div class="activity-when">${esc(d.when)}</div>
      </div>
    `;
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    let data = {};
    try { data = await res.json(); } catch { /* tolerate */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  let prevView = null;
  function captureCurrentView() {
    const ids = ['courses-home', 'home', 'detail', 'profilePage', 'parentHome', 'parentStudentDetail', 'landing'];
    for (const id of ids) {
      const v = el(id);
      if (v && !v.classList.contains('hidden')) { prevView = id; return; }
    }
    prevView = null;
  }

  function hideAllTopLevel() {
    if (typeof window.hideAllTopLevel === 'function' && window.hideAllTopLevel !== hideAllTopLevel) {
      window.hideAllTopLevel();
      return;
    }
    ['landing', 'authGate', 'consentGate', 'parentHome', 'parentStudentDetail',
     'courses-home', 'home', 'detail', 'profilePage', 'tokenUsagePage',
     'about', 'contact', 'privacy', 'terms'].forEach(id => hide(el(id)));
  }

  function goBack() {
    hide(el('activityPage'));
    if (prevView && el(prevView)) show(el(prevView));
    else show(el('courses-home'));
  }

  let lastLoaded = { attempts: [], weak: [], activity: [] };

  // Activity rollup state. Default range is daily; the four tabs flip
  // _summaryRange and reload the table.
  let _summaryRange = 'daily';
  let _summaryWired = false;

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

  async function reloadActivitySummary(target /* 'self' | 'student' */, studentId) {
    const tableBody = document.querySelector('#activitySummaryTable tbody');
    const rangeNote = el('activitySummaryRange');
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="9" class="empty">Loading…</td></tr>';
    let url = target === 'student'
      ? `/api/parent/students/${encodeURIComponent(studentId)}/activity-summary?range=${_summaryRange}`
      : `/api/me/activity-summary?range=${_summaryRange}`;
    try {
      const data = await fetchJSON(url);
      if (rangeNote) rangeNote.textContent = _fmtRangeLabel(data.range, data.from, data.to);
      const subjects = data.subjects || [];
      // Totals row.
      const tot = subjects.reduce((a, s) => ({
        signins: a.signins + s.signins,
        lessons_started: a.lessons_started + s.lessons_started,
        quizzes_started: a.quizzes_started + s.quizzes_started,
        quizzes_passed: a.quizzes_passed + s.quizzes_passed,
        quizzes_failed: a.quizzes_failed + s.quizzes_failed,
        hints_used: a.hints_used + s.hints_used,
        time_spent_seconds: a.time_spent_seconds + s.time_spent_seconds,
      }), { signins: 0, lessons_started: 0, quizzes_started: 0, quizzes_passed: 0, quizzes_failed: 0, hints_used: 0, time_spent_seconds: 0 });
      const avg = subjects.length
        ? Math.round(subjects.reduce((a, s) => a + (s.avg_score_pct || 0), 0) / subjects.length)
        : 0;
      tableBody.innerHTML = subjects.map(s => `
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
      tableBody.innerHTML = `<tr><td colspan="9" class="empty err">Could not load: ${esc(e.message)}</td></tr>`;
    }
  }

  function _wireSummaryTabsOnce(target, studentId) {
    if (_summaryWired) return;
    _summaryWired = true;
    document.querySelectorAll('#activitySummaryTabs .summary-tab').forEach(b => {
      b.addEventListener('click', () => {
        document.querySelectorAll('#activitySummaryTabs .summary-tab').forEach(x => x.classList.remove('active'));
        b.classList.add('active');
        _summaryRange = b.dataset.range || 'daily';
        reloadActivitySummary(target, studentId);
      });
    });
  }

  async function openActivity() {
    captureCurrentView();
    hideAllTopLevel();
    show(el('activityPage'));
    const weakEl = el('activityWeak');
    const quizEl = el('activityQuizzes');
    const timelineEl = el('activityTimeline');
    weakEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    quizEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    timelineEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    resetSummary();
    _wireSummaryTabsOnce('self');
    reloadActivitySummary('self');
    loadInsights();

    try {
      const [{ sections }, { attempts }, { activity }] = await Promise.all([
        fetchJSON('/api/me/weak-sections'),
        fetchJSON('/api/me/quiz-attempts'),
        fetchJSON('/api/me/activity'),
      ]);
      lastLoaded = { attempts, weak: sections, activity };
      // Kick off the AI summary asynchronously; don't block the page render.
      streamSummary({ attempts, weakSections: sections, activity });

      weakEl.innerHTML = sections.length
        ? sections.map(s => `
            <div class="parent-detail-row">
              <div>${esc(s.course_id)} · ${esc(s.book_id)} · section ${s.section_idx + 1}</div>
              <div class="muted">${s.failures} failed ${s.failures === 1 ? 'attempt' : 'attempts'}</div>
            </div>
          `).join('')
        : '<div class="parent-empty">No weak topics — either you haven\'t failed anything twice, or you haven\'t taken many quizzes yet.</div>';

      quizEl.innerHTML = attempts.length
        ? attempts.slice(0, 50).map(a => `
            <div class="parent-detail-row">
              <div>${esc(a.course_id)} · ${esc(a.book_id)} · section ${a.section_idx + 1}${a.section_kind !== 'section' ? ` (${esc(a.section_kind)})` : ''}</div>
              <div class="${a.passed ? 'ok' : 'warn'}">${a.score}/${a.total} · ${a.passed ? 'passed' : 'did not pass'}</div>
              <div class="muted">${fmtDate(a.completed_at)}</div>
            </div>
          `).join('')
        : '<div class="parent-empty">No quiz attempts yet. Once you finish a quiz, it shows up here.</div>';

      timelineEl.innerHTML = activity.length
        ? activity.slice(0, 100).map(activityRow).join('')
        : '<div class="parent-empty">No activity yet. Once you take a quiz or sign in again, it shows up here.</div>';
    } catch (e) {
      const msg = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
      weakEl.innerHTML = msg; quizEl.innerHTML = msg; timelineEl.innerHTML = msg;
    }
  }

  function resetSummary() {
    const body = el('activitySummaryBody');
    if (!body) return;
    body.classList.remove('err');
    body.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
  }

  function resolveCourseBookSection(courseId, bookId, sectionIdx) {
    if (typeof COURSES === 'undefined' || !COURSES) return { course: courseId, book: bookId, section: `Section ${sectionIdx + 1}` };
    const c = COURSES[courseId];
    if (!c) return { course: courseId, book: bookId, section: `Section ${sectionIdx + 1}` };
    const b = (c.books || []).find(x => x.id === bookId);
    return {
      course: c.title,
      book: b ? b.title : bookId,
      section: b && b.sections && b.sections[sectionIdx] ? b.sections[sectionIdx].title : `Section ${sectionIdx + 1}`,
    };
  }

  async function fetchSelfContext() {
    // Pull the rich profile (if any) so Max can use the student's name,
    // study goal, etc. Tolerate a missing profile gracefully.
    try {
      const r = await fetchJSON('/api/me/rich-profile');
      return r.profile || {};
    } catch { return {}; }
  }

  async function streamSummary({ attempts, weakSections, activity }) {
    if (typeof AI === 'undefined' || !AI || typeof AI.streamActivitySummary !== 'function') return;
    const body = el('activitySummaryBody');
    if (!body) return;

    const profile = await fetchSelfContext();
    const courseTitles = (typeof COURSES !== 'undefined' && COURSES)
      ? Object.values(COURSES).map(c => c.title)
      : [];

    const attemptsForAi = attempts.map(a => {
      const { course, book, section } = resolveCourseBookSection(a.course_id, a.book_id, a.section_idx);
      return { course, book, section, score: a.score, total: a.total, passed: a.passed };
    });

    const weakForAi = weakSections.map(w => {
      const { course, book, section } = resolveCourseBookSection(w.course_id, w.book_id, w.section_idx);
      return { course, book, section, failures: Number(w.failures) };
    });

    const recentKinds = (activity || []).slice(0, 12).map(a => a.kind);

    const payload = {
      studentName: profile.display_name || null,
      gradeLevel: profile.grade_level || null,
      subjects: profile.subjects || [],
      studyGoal: profile.study_goal || null,
      studyPlanCourses: profile.study_plan_courses || [],
      attempts: attemptsForAi,
      weakSections: weakForAi,
      recentEvents: recentKinds,
      availableCourses: courseTitles,
    };

    body.innerHTML = '<div class="typing"><span></span><span></span><span></span></div>';
    body.classList.remove('err');
    let buf = '';
    try {
      for await (const chunk of AI.streamActivitySummary(payload)) {
        buf += chunk;
        body.innerHTML = (typeof mdToHtml === 'function') ? mdToHtml(buf) : esc(buf);
      }
      if (!buf.trim()) body.innerHTML = '<p>No summary right now. Take a quiz or two and refresh.</p>';
    } catch (e) {
      body.classList.add('err');
      body.innerHTML = `Couldn't generate a summary just now: ${esc(e.message)}.`;
    }
  }

  // ---- Student Insights rendering ----
  function _renderInsightItem(r) {
    const { course, book, section } = resolveCourseBookSection(r.course_id, r.book_id, r.section_idx);
    const pct = Number(r.avg_score) || 0;
    const lvl = r.mastery_level || 'not_started';
    const badgeCls = { mastered: 'badge-mastered', proficient: 'badge-proficient', developing: 'badge-developing', struggling: 'badge-struggling' };
    return `<div class="insight-item mastery-${lvl}">
      <div class="insight-item-name" title="${esc(course)} · ${esc(book)} · ${esc(section)}">${esc(section)}</div>
      <div class="insight-bar"><div class="insight-bar-fill" style="width:${Math.min(pct, 100)}%"></div></div>
      <div class="insight-item-score">${Math.round(pct)}%</div>
      <span class="insight-badge ${badgeCls[lvl] || ''}">${lvl.replace('_', ' ')}</span>
    </div>`;
  }

  async function loadInsights() {
    try {
      const { insights } = await fetchJSON('/api/student-insights');
      if (!insights) return;
      const o = insights.overview || {};
      const acc = el('insightAccuracy');
      const mast = el('insightMastered');
      const time = el('insightTime');
      const trend = el('insightTrend');
      if (acc) acc.textContent = o.overallAccuracy != null ? o.overallAccuracy + '%' : '—';
      if (mast) mast.textContent = o.sectionsMastered != null ? o.sectionsMastered : '—';
      if (time) time.textContent = o.totalTimeMinutes != null ? (o.totalTimeMinutes >= 60 ? Math.round(o.totalTimeMinutes / 60 * 10) / 10 + 'h' : Math.round(o.totalTimeMinutes) + 'm') : '—';
      if (trend) {
        const t = insights.recentTrend || 'steady';
        const icons = { improving: '📈', steady: '➡️', declining: '📉' };
        trend.textContent = (icons[t] || '') + ' ' + t.charAt(0).toUpperCase() + t.slice(1);
        trend.className = 'insight-stat-value trend-' + t;
      }
      const strEl = el('insightStrengths');
      const weakEl = el('insightWeaknesses');
      const sugEl = el('insightSuggestions');
      if (strEl) strEl.innerHTML = (insights.strengths || []).length
        ? insights.strengths.slice(0, 8).map(_renderInsightItem).join('')
        : '<div class="insights-empty">Complete some quizzes to see your strengths.</div>';
      if (weakEl) weakEl.innerHTML = (insights.weaknesses || []).length
        ? insights.weaknesses.slice(0, 8).map(_renderInsightItem).join('')
        : '<div class="insights-empty">Nothing here yet — keep going!</div>';
      if (sugEl) sugEl.innerHTML = (insights.suggestedNext || []).length
        ? insights.suggestedNext.slice(0, 6).map(_renderInsightItem).join('')
        : '<div class="insights-empty">Take a few quizzes and Max will suggest what to focus on.</div>';
    } catch (e) {
      const sec = el('insightsSection');
      if (sec) sec.style.display = 'none';
    }
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const navBtn = el('activityNavBtn');
    if (navBtn) navBtn.addEventListener('click', openActivity);
    const back = el('activityBack');
    if (back) back.addEventListener('click', goBack);
    const refresh = el('activitySummaryRefresh');
    if (refresh) refresh.addEventListener('click', () => {
      streamSummary({ attempts: lastLoaded.attempts, weakSections: lastLoaded.weak, activity: lastLoaded.activity });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else {
    wireOnce();
  }

  window.openActivity = openActivity;
})();
