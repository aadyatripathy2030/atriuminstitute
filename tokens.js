// Token Cost page. Per-user — each signed-in account sees only their own
// AI usage. Pulls /api/me/token-usage/summary for the aggregates and
// /api/me/token-usage for the recent-calls table.

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
    const ids = ['courses-home', 'home', 'detail', 'profilePage', 'parentHome', 'parentStudentDetail', 'activityPage', 'landing'];
    for (const id of ids) {
      const v = el(id);
      if (v && !v.classList.contains('hidden')) { prevView = id; return; }
    }
    prevView = null;
  }

  function hideAllTopLevel() {
    ['landing', 'authGate', 'consentGate', 'parentHome', 'parentStudentDetail',
     'courses-home', 'home', 'detail', 'profilePage', 'activityPage', 'about', 'contact', 'privacy', 'terms'].forEach(id => hide(el(id)));
  }

  function goBack() {
    hide(el('tokenUsagePage'));
    if (prevView && el(prevView)) show(el(prevView));
    else show(el('courses-home'));
  }

  function todayKey(d) {
    return new Date(d).toISOString().slice(0, 10);
  }

  function thisMonthKey(d) {
    return new Date(d).toISOString().slice(0, 7);
  }

  function computeRollups(rows) {
    const today = todayKey(new Date());
    const month = thisMonthKey(new Date());
    let todayCost = 0, todayCalls = 0;
    let monthCost = 0, monthCalls = 0;
    let allCost = 0, allCalls = 0;
    for (const r of rows) {
      const cost = Number(r.cost_usd) || 0;
      allCost += cost; allCalls += 1;
      const day = r.created_at.slice(0, 10);
      if (day === today) { todayCost += cost; todayCalls += 1; }
      if (day.slice(0, 7) === month) { monthCost += cost; monthCalls += 1; }
    }
    return { todayCost, todayCalls, monthCost, monthCalls, allCost, allCalls };
  }

  function renderCards(summary, rollups) {
    el('tokTodayCost').textContent = money(rollups.todayCost);
    el('tokTodayCalls').textContent = `${rollups.todayCalls} call${rollups.todayCalls === 1 ? '' : 's'}`;
    el('tokMonthCost').textContent = money(rollups.monthCost);
    el('tokMonthCalls').textContent = `${rollups.monthCalls} call${rollups.monthCalls === 1 ? '' : 's'}`;
    el('tokAllCost').textContent = money(summary.totals.cost);
    el('tokAllCalls').textContent = `${num(summary.totals.calls)} call${Number(summary.totals.calls) === 1 ? '' : 's'} · ${num(summary.totals.input_tokens)} in / ${num(summary.totals.output_tokens)} out`;
  }

  function renderByIntent(rows) {
    const tbody = el('tokByIntent').querySelector('tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty">No usage yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${esc(r.intent)}</td>
        <td class="num">${num(r.calls)}</td>
        <td class="num">${money(r.cost)}</td>
      </tr>
    `).join('');
  }

  function renderByModel(rows) {
    const tbody = el('tokByModel').querySelector('tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty">No usage yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${esc(r.model)}</td>
        <td class="num">${num(r.calls)}</td>
        <td class="num">${num(r.input_tokens)}</td>
        <td class="num">${num(r.output_tokens)}</td>
        <td class="num">${money(r.cost)}</td>
      </tr>
    `).join('');
  }

  function renderByDay(rows) {
    const tbody = el('tokByDay').querySelector('tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="3" class="empty">No usage yet.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td>${esc(r.day)}</td>
        <td class="num">${num(r.calls)}</td>
        <td class="num">${money(r.cost)}</td>
      </tr>
    `).join('');
  }

  function renderRecent(rows) {
    const tbody = el('tokRecent').querySelector('tbody');
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No usage yet. Use Max in a quiz or chat, then come back.</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map((r, i) => {
      const cachedTotal = (Number(r.cache_read_tokens) || 0) + (Number(r.cache_creation_tokens) || 0);
      return `
        <tr class="token-row" data-i="${i}">
          <td>${esc(fmtDate(r.created_at))}</td>
          <td>${esc(r.intent || '—')}</td>
          <td><span class="token-model">${esc(r.model)}</span></td>
          <td class="num">${num(r.input_tokens)}</td>
          <td class="num">${num(cachedTotal)}</td>
          <td class="num">${num(r.output_tokens)}</td>
          <td class="num">${money(r.cost_usd)}</td>
        </tr>
        <tr class="token-detail hidden" data-detail-for="${i}">
          <td colspan="7">
            <div class="token-detail-grid">
              <div><strong>Input (uncached):</strong> ${num((Number(r.input_tokens) || 0) - (Number(r.cache_read_tokens) || 0) - (Number(r.cache_creation_tokens) || 0))}</div>
              <div><strong>Cache read:</strong> ${num(r.cache_read_tokens)}</div>
              <div><strong>Cache write:</strong> ${num(r.cache_creation_tokens)}</div>
              <div><strong>Output:</strong> ${num(r.output_tokens)}</div>
              <div><strong>Cost:</strong> ${money(r.cost_usd)}</div>
              <div><strong>Model:</strong> ${esc(r.model)}</div>
              <div><strong>Intent:</strong> ${esc(r.intent || '—')}</div>
              <div><strong>Recorded:</strong> ${esc(fmtDate(r.created_at))}</div>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    tbody.querySelectorAll('.token-row').forEach(tr => {
      tr.addEventListener('click', () => {
        const i = tr.getAttribute('data-i');
        const detail = tbody.querySelector(`.token-detail[data-detail-for="${i}"]`);
        if (detail) detail.classList.toggle('hidden');
      });
    });
  }

  async function openTokenUsage() {
    captureCurrentView();
    hideAllTopLevel();
    show(el('tokenUsagePage'));

    // Reset cards while loading.
    ['tokTodayCost', 'tokMonthCost', 'tokAllCost'].forEach(id => el(id) && (el(id).textContent = 'Loading…'));
    ['tokTodayCalls', 'tokMonthCalls', 'tokAllCalls'].forEach(id => el(id) && (el(id).textContent = ''));

    try {
      const [summary, recent] = await Promise.all([
        fetchJSON('/api/me/token-usage/summary'),
        fetchJSON('/api/me/token-usage'),
      ]);
      const rollups = computeRollups(recent.rows || []);
      renderCards(summary, rollups);
      renderByIntent(summary.byIntent || []);
      renderByModel(summary.byModel || []);
      renderByDay(summary.byDay || []);
      renderRecent(recent.rows || []);
    } catch (e) {
      ['tokTodayCost', 'tokMonthCost', 'tokAllCost'].forEach(id => el(id) && (el(id).textContent = '—'));
      const tbody = el('tokRecent').querySelector('tbody');
      tbody.innerHTML = `<tr><td colspan="7" class="empty err">Could not load usage: ${esc(e.message)}</td></tr>`;
    }
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const navBtn = el('tokenUsageNavBtn');
    if (navBtn) navBtn.addEventListener('click', openTokenUsage);
    const back = el('tokenUsageBack');
    if (back) back.addEventListener('click', goBack);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else {
    wireOnce();
  }

  window.openTokenUsage = openTokenUsage;
})();
