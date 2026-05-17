// Admin page. Accessible only when the signed-in user has users.is_admin = true,
// and intentionally not linked from any menu — admins reach it by typing
// /#admin in the URL bar (or calling window.openAdmin()).

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

  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    let data = {};
    try { data = await res.json(); } catch { /* tolerate */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  let prevView = null;
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
    if (window.location.hash === '#admin') {
      try { history.replaceState(null, '', window.location.pathname); } catch { /* ignore */ }
    }
    if (prevView && el(prevView)) show(el(prevView));
    else if (typeof window.goHome === 'function') window.goHome();
  }

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

  function renderUsers(users) {
    const tbody = el('adminUsersTable').querySelector('tbody');
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="empty">No users yet.</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => {
      const status = [];
      if (u.is_admin) status.push('<span class="admin-badge admin">admin</span>');
      if (!u.verified) status.push('<span class="admin-badge unverif">unverified</span>');
      if (u.consent_required && !u.consent_granted_at) status.push('<span class="admin-badge gated">consent pending</span>');
      if (u.consent_required && u.consent_granted_at) status.push('<span class="admin-badge ok">consent ok</span>');
      return `
        <tr>
          <td>${esc(u.email)}</td>
          <td>${esc(u.role)}</td>
          <td>${u.age == null ? '—' : esc(u.age)}</td>
          <td>${u.country ? esc(u.country) : '—'}</td>
          <td>${esc(fmtDate(u.created_at))}</td>
          <td class="num">${num(u.quiz_attempts)}</td>
          <td class="num">${num(u.quiz_passed)}</td>
          <td class="num">${num(u.activity_count)}</td>
          <td class="num">${money(u.cost_usd)}</td>
          <td>${status.join(' ') || '—'}</td>
        </tr>
      `;
    }).join('');
  }

  function activityMeta(meta) {
    if (!meta || typeof meta !== 'object') return '';
    const keys = ['courseId', 'bookId', 'sectionTitle', 'sectionIdx', 'score', 'total', 'passed', 'attemptNumber', 'hintLevel'];
    const parts = [];
    for (const k of keys) {
      if (meta[k] != null) parts.push(`${k}=${meta[k]}`);
    }
    return parts.join(', ');
  }

  function renderActivity(rows) {
    const tbody = el('adminActivityTable').querySelector('tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="empty">No activity yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(a => `
      <tr>
        <td>${esc(fmtDate(a.created_at))}</td>
        <td>${esc(a.email || a.user_id || '—')}</td>
        <td><code>${esc(a.kind)}</code></td>
        <td class="muted">${esc(activityMeta(a.meta))}</td>
      </tr>
    `).join('');
  }

  async function openAdmin() {
    const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (!user || !user.is_admin) {
      alert('This page is only available to admins. If you should have access, ask the operator to flip your is_admin flag.');
      if (typeof window.goHome === 'function') window.goHome();
      return;
    }
    captureCurrentView();
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('adminPage'));
    el('adminCards').innerHTML = '<div class="parent-empty">Loading…</div>';

    try {
      const [statsR, usersR, activityR] = await Promise.all([
        fetchJSON('/api/admin/stats'),
        fetchJSON('/api/admin/users'),
        fetchJSON('/api/admin/activity'),
      ]);
      renderStats(statsR.stats || {});
      renderUsers(usersR.users || []);
      renderActivity(activityR.activity || []);
    } catch (e) {
      el('adminCards').innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
    }
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const back = el('adminBack');
    if (back) back.addEventListener('click', goBack);
  }

  // Hash-based URL routing: visiting /#admin opens the page when the user
  // is logged in and is_admin. We respond both to initial load and to
  // later hash changes (e.g. paste #admin into an open tab's URL bar).
  function checkHash() {
    if (window.location.hash === '#admin') {
      const u = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
      if (u && u.is_admin) openAdmin();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { wireOnce(); checkHash(); });
  } else {
    wireOnce();
    checkHash();
  }
  window.addEventListener('hashchange', checkHash);

  // Polled retry: if the page loads with #admin and the session check
  // hasn't populated currentUser yet, retry briefly so we don't fail
  // silently the first time.
  let retries = 0;
  const retryHash = setInterval(() => {
    retries++;
    if (window.location.hash !== '#admin' || retries > 20) { clearInterval(retryHash); return; }
    const u = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (u) {
      clearInterval(retryHash);
      if (u.is_admin && el('adminPage') && el('adminPage').classList.contains('hidden')) {
        openAdmin();
      }
    }
  }, 250);

  window.openAdmin = openAdmin;
})();
