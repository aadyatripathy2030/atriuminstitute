// Gamification glue: streak chip in nav, Problem of the Day card on
// the home page, the My Achievements page, and the Leaderboard page.
// Each piece is self-contained and falls back gracefully if endpoints
// fail (so the rest of the app keeps working).

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  async function fetchJSON(url, opts) {
    const res = await fetch(url, Object.assign({ credentials: 'same-origin' }, opts || {}));
    let data = {};
    try { data = await res.json(); } catch (_) {}
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  // ----- Streak chip -----
  async function refreshStreakChip() {
    const chip = el('streakChip');
    const count = el('streakChipCount');
    if (!chip || !count) return;
    try {
      const s = await fetchJSON('/api/me/streaks');
      if (s && s.current_streak > 0) {
        count.textContent = String(s.current_streak);
        show(chip);
      } else {
        hide(chip);
      }
    } catch (_) { hide(chip); }
  }
  window.refreshStreakChip = refreshStreakChip;

  // ----- Achievements page -----
  let _achPageWired = false;
  async function openAchievements() {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('achievementsPage'));
    if (!_achPageWired) {
      _achPageWired = true;
      const back = el('achievementsBack');
      if (back) back.addEventListener('click', () => {
        hide(el('achievementsPage'));
        if (typeof window.goHome === 'function') window.goHome();
      });
    }
    const grid = el('achievementsGrid');
    const sub = el('achievementsSub');
    if (!grid) return;
    grid.innerHTML = '<div class="parent-empty">Loading…</div>';
    try {
      const r = await fetchJSON('/api/me/achievements');
      const badges = r.badges || [];
      if (sub) sub.textContent = `${r.earned || 0} of ${r.total || 0} badges earned`;
      if (!badges.length) {
        grid.innerHTML = '<div class="parent-empty">No badges defined yet.</div>';
        return;
      }
      grid.innerHTML = badges.map(b => `
        <div class="badge ${b.earned ? 'earned' : 'locked'}">
          <div class="badge-icon">${esc(b.icon || '🏅')}</div>
          <div class="badge-title">${esc(b.title)}</div>
          <div class="badge-desc">${esc(b.description || '')}</div>
          <div class="badge-points">${esc(String(b.points || 0))} pts</div>
          <div class="badge-status">${b.earned ? 'Earned' : 'Locked'}</div>
        </div>
      `).join('');
    } catch (e) {
      grid.innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
    }
  }
  window.openAchievements = openAchievements;

  // ----- Leaderboard page -----
  let _lbWired = false;
  let _lbRange = 'weekly';
  async function openLeaderboard() {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('leaderboardPage'));
    if (!_lbWired) {
      _lbWired = true;
      const back = el('leaderboardBack');
      if (back) back.addEventListener('click', () => {
        hide(el('leaderboardPage'));
        if (typeof window.goHome === 'function') window.goHome();
      });
      document.querySelectorAll('#leaderboardTabs .summary-tab').forEach(b => {
        b.addEventListener('click', () => {
          document.querySelectorAll('#leaderboardTabs .summary-tab').forEach(x => x.classList.remove('active'));
          b.classList.add('active');
          _lbRange = b.dataset.range || 'weekly';
          loadLeaderboard();
        });
      });
    }
    loadLeaderboard();
  }
  async function loadLeaderboard() {
    const tbody = document.querySelector('#leaderboardTable tbody');
    const myRank = el('leaderboardMyRank');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3" class="empty">Loading…</td></tr>';
    if (myRank) myRank.textContent = '';
    try {
      const r = await fetchJSON('/api/leaderboard?range=' + encodeURIComponent(_lbRange));
      const top = r.top || [];
      const me = r.me || {};
      if (myRank) {
        if (me.points > 0 && me.rank) {
          myRank.innerHTML = `Your rank: <strong>#${me.rank}</strong> of ${me.total || top.length} · <strong>${me.points}</strong> points`;
        } else {
          myRank.textContent = 'Earn some points to land on the board — pass a quiz, finish a lesson, or solve today\'s Problem of the Day.';
        }
      }
      if (!top.length) {
        tbody.innerHTML = '<tr><td colspan="3" class="empty">No points awarded in this window yet.</td></tr>';
        return;
      }
      tbody.innerHTML = top.map((u, i) => {
        const name = (u.display_name || '').toString();
        // First initial only for privacy.
        const shown = name ? (name[0].toUpperCase() + (name.length > 1 ? name.slice(1, 2).toLowerCase() + '.' : '')) : '—';
        return `<tr><td>${i + 1}</td><td>${esc(shown)}</td><td class="num">${u.points}</td></tr>`;
      }).join('');
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="3" class="empty err">Could not load: ${esc(e.message)}</td></tr>`;
    }
  }
  window.openLeaderboard = openLeaderboard;

  // ----- Problem of the Day card -----
  async function renderPODCard() {
    const box = el('podBox');
    if (!box) return;
    let r;
    try { r = await fetchJSON('/api/problem-of-day'); }
    catch (_) { box.innerHTML = ''; return; }
    const pod = r.pod;
    const my = r.my_attempt;
    const stats = r.stats || {};
    if (!pod) { box.innerHTML = ''; return; }
    const solvedToday = stats.solved || 0;
    const solvedByYou = my && my.correct;
    const subjectBadge = pod.subject === 'language_arts' ? '📚 Language Arts' : '🧮 Math';
    box.innerHTML = `
      <div class="pod-card ${solvedByYou ? 'solved' : ''}">
        <div class="pod-head">
          <div>
            <div class="pod-eyebrow">⭐ Problem of the Day</div>
            <div class="pod-subject">${subjectBadge} · ${esc(pod.difficulty || 'medium')}</div>
          </div>
          <div class="pod-stats">${solvedToday} solved today</div>
        </div>
        <div class="pod-question">${esc(pod.question_text)}</div>
        ${solvedByYou ? `
          <div class="pod-result ok">✓ You solved this today. Worth 20 points.</div>
        ` : (my ? `
          <div class="pod-result err">Not quite. Try again tomorrow.</div>
          <div class="pod-correct"><strong>Answer:</strong> ${esc(my.user_answer || '')}</div>
        ` : `
          <div class="pod-input-row">
            <input type="text" class="pod-input" id="podInput" placeholder="Your answer…">
            <button class="cta" type="button" id="podSubmit">Submit →</button>
          </div>
          <div class="pod-hint muted">One answer per day. Worth 20 points if correct.</div>
        `)}
      </div>
    `;
    const submitBtn = el('podSubmit');
    const input = el('podInput');
    if (submitBtn && input) {
      submitBtn.addEventListener('click', async () => {
        const answer = input.value.trim();
        if (!answer) return;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Submitting…';
        try {
          await fetchJSON('/api/problem-of-day/attempt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answer }),
          });
          // Re-render with the new state.
          renderPODCard();
          // Streak / leaderboard probably moved.
          if (typeof refreshStreakChip === 'function') refreshStreakChip();
        } catch (e) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit →';
          alert(e.message);
        }
      });
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); submitBtn.click(); }
      });
    }
  }
  window.renderPODCard = renderPODCard;

  // ----- Wire nav buttons + initial loads -----
  function wireOnce() {
    const ach = el('achievementsNavBtn');
    if (ach) ach.addEventListener('click', openAchievements);
    const lb = el('leaderboardNavBtn');
    if (lb) lb.addEventListener('click', openLeaderboard);
    const chip = el('streakChip');
    if (chip) chip.addEventListener('click', openAchievements);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else { wireOnce(); }

  // Refresh streak + render POD when the user signs in.
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (typeof window.getCurrentUser === 'function' && window.getCurrentUser()) {
        refreshStreakChip();
        renderPODCard();
      }
    }, 1500);
  });
})();
