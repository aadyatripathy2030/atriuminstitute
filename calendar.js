// Study calendar. Renders a month heatmap of the student's real activity
// (from /api/me/activity) plus their real streak (from /api/me/streaks) — no
// separate streak counter. Self-contained; a failure here can't affect the app.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }

  // Activity kinds that are system noise, not studying.
  var IGNORE = { digest_sent: 1, reminder_sent: 1, link_invited: 1, link_approved: 1,
                 link_rejected: 1, link_removed: 1, account_deleted: 1 };

  var byDay = {};          // 'YYYY-MM-DD' -> count
  var view = null;         // {y, m} month being shown (m is 0-based)
  var loaded = false;

  function localKey(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function tier(n) { return n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 6 ? 3 : 4; }

  function bucket(activity) {
    byDay = {};
    (activity || []).forEach(function (a) {
      if (!a || !a.created_at || IGNORE[a.kind]) return;
      var d = new Date(a.created_at);
      if (isNaN(d)) return;
      var k = localKey(d);
      byDay[k] = (byDay[k] || 0) + 1;
    });
  }

  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function renderWeekdays() {
    var wd = el('calWeekdays');
    if (wd && !wd.childNodes.length) {
      wd.innerHTML = WEEKDAYS.map(function (d) { return '<span class="cal-wd">' + d + '</span>'; }).join('');
    }
  }

  function render() {
    if (!view) { var t = new Date(); view = { y: t.getFullYear(), m: t.getMonth() }; }
    renderWeekdays();
    el('calMonth').textContent = MONTHS[view.m] + ' ' + view.y;

    var first = new Date(view.y, view.m, 1);
    var startDow = first.getDay();
    var daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
    var todayKey = localKey(new Date());

    var cells = [];
    for (var i = 0; i < startDow; i++) cells.push('<span class="cal-cell cal-empty"></span>');
    var daysStudied = 0, actsMonth = 0;
    for (var day = 1; day <= daysInMonth; day++) {
      var key = view.y + '-' + String(view.m + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
      var n = byDay[key] || 0;
      if (n > 0) { daysStudied++; actsMonth += n; }
      var cls = 'cal-cell cal-day cal-l' + tier(n) + (key === todayKey ? ' cal-today' : '');
      var title = n > 0 ? (n + (n === 1 ? ' activity' : ' activities') + ' on ' + MONTHS[view.m] + ' ' + day) : ('No activity on ' + MONTHS[view.m] + ' ' + day);
      cells.push('<span class="' + cls + '" title="' + title + '"><span class="cal-daynum">' + day + '</span></span>');
    }
    el('calDays').innerHTML = cells.join('');
    el('calDaysMonth').textContent = String(daysStudied);
    el('calActsMonth').textContent = String(actsMonth);
  }

  async function loadData() {
    var errEl = el('calError');
    hide(errEl);
    try {
      var aRes = await fetch('/api/me/activity?limit=500', { credentials: 'same-origin' });
      if (aRes.status === 401) { throw new Error('Sign in to see your study calendar.'); }
      var aData = await aRes.json();
      bucket(aData.activity || []);
      loaded = true;
      render();
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) ? e.message : 'Could not load your activity.'; show(errEl); }
    }
    // Streak is a separate, non-blocking call.
    try {
      var sRes = await fetch('/api/me/streaks', { credentials: 'same-origin' });
      if (sRes.ok) {
        var s = await sRes.json();
        el('calStreak').textContent = String((s && s.current_streak) || 0);
      }
    } catch (_) {}
  }

  function open() {
    var ov = el('calOverlay');
    if (!ov) return;
    view = null; // reset to current month each open
    show(ov);
    render();    // paint the empty grid immediately
    loadData();  // then fill in real data
  }
  function close() { hide(el('calOverlay')); }
  window.openStudyCalendar = open;

  function shift(delta) {
    if (!view) { var t = new Date(); view = { y: t.getFullYear(), m: t.getMonth() }; }
    var m = view.m + delta, y = view.y;
    if (m < 0) { m = 11; y--; } else if (m > 11) { m = 0; y++; }
    view = { y: y, m: m };
    render();
  }

  function init() {
    var navBtn = el('calendarNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('calClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('calOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('calOverlay') || el('calOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') shift(-1);
      else if (e.key === 'ArrowRight') shift(1);
    });
    var prev = el('calPrev'), next = el('calNext');
    if (prev) prev.addEventListener('click', function () { shift(-1); });
    if (next) next.addEventListener('click', function () { shift(1); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
