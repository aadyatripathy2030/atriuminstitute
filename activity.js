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
    ['landing', 'authGate', 'consentGate', 'parentHome', 'parentStudentDetail',
     'courses-home', 'home', 'detail', 'profilePage'].forEach(id => hide(el(id)));
  }

  function goBack() {
    hide(el('activityPage'));
    if (prevView && el(prevView)) show(el(prevView));
    else show(el('courses-home'));
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

    try {
      const [{ sections }, { attempts }, { activity }] = await Promise.all([
        fetchJSON('/api/me/weak-sections'),
        fetchJSON('/api/me/quiz-attempts'),
        fetchJSON('/api/me/activity'),
      ]);

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

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const navBtn = el('activityNavBtn');
    if (navBtn) navBtn.addEventListener('click', openActivity);
    const back = el('activityBack');
    if (back) back.addEventListener('click', goBack);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else {
    wireOnce();
  }

  window.openActivity = openActivity;
})();
