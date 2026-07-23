// Certificates. Awards a printable certificate for each course the student has
// fully completed, using the app's real per-course progress (courseStats +
// loadScores) and the student's display name. Self-contained; a failure here
// can't affect the app.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var studentName = 'Student';

  function computeCourses() {
    if (typeof COURSES === 'undefined' || typeof loadScores !== 'function' || typeof courseStats !== 'function') return null;
    var scores = loadScores();
    var out = [];
    Object.keys(COURSES).forEach(function (id) {
      var c = COURSES[id];
      if (!c) return;
      var st;
      try { st = courseStats(id, scores); } catch (_) { return; }
      if (!st || !st.total) return;
      out.push({
        id: id,
        title: c.title || id,
        subject: c.subject || (id.indexOf('eng') === 0 ? 'english' : 'math'),
        passed: st.passed,
        total: st.total,
        pct: Math.round(100 * st.passed / st.total),
        done: st.passed >= st.total
      });
    });
    // Completed first, then by progress.
    out.sort(function (a, b) { return (b.done - a.done) || (b.pct - a.pct); });
    return out;
  }

  function renderList() {
    var list = el('certList');
    if (!list) return;
    var courses = computeCourses();
    if (!courses) { list.innerHTML = '<p class="cert-empty">Course progress is unavailable right now.</p>'; return; }
    var done = courses.filter(function (c) { return c.done; });
    var inProgress = courses.filter(function (c) { return !c.done && c.passed > 0; });

    var html = '';
    if (!done.length) {
      html += '<p class="cert-empty">No certificates yet — finish all the quizzes and tests in a course and it\'ll appear here. Keep going! 💪</p>';
    } else {
      html += '<div class="cert-group-h">Earned</div>';
      done.forEach(function (c) {
        html += '<div class="cert-item cert-done">' +
          '<span class="cert-item-info"><span class="cert-item-title">🎓 ' + esc(c.title) + '</span>' +
          '<span class="cert-item-sub">' + esc(c.subject === 'english' ? 'English' : 'Math') + ' · 100% complete</span></span>' +
          '<button class="cta-primary cert-get" data-id="' + esc(c.id) + '" data-title="' + esc(c.title) + '">View certificate</button>' +
        '</div>';
      });
    }
    if (inProgress.length) {
      html += '<div class="cert-group-h">In progress</div>';
      inProgress.forEach(function (c) {
        html += '<div class="cert-item">' +
          '<span class="cert-item-info"><span class="cert-item-title">' + esc(c.title) + '</span>' +
          '<span class="cert-item-sub">' + c.passed + ' / ' + c.total + ' · ' + c.pct + '%</span>' +
          '<span class="cert-bar"><span class="cert-bar-fill" style="width:' + c.pct + '%"></span></span></span>' +
        '</div>';
      });
    }
    list.innerHTML = html;
    list.querySelectorAll('.cert-get').forEach(function (b) {
      b.addEventListener('click', function () { openCertificate(b.dataset.title); });
    });
  }

  function openCertificate(title) {
    el('certName').textContent = studentName;
    el('certCourse').textContent = title;
    var dt;
    try { dt = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
    catch (_) { dt = ''; }
    el('certDate').textContent = dt;
    hide(el('certListView')); show(el('certView'));
  }
  function backToList() { show(el('certListView')); hide(el('certView')); }

  async function loadName() {
    try {
      var r = await fetch('/api/me/rich-profile', { credentials: 'same-origin' });
      if (r.ok) {
        var d = await r.json();
        var n = d && d.profile && d.profile.display_name;
        if (n && n.trim()) { studentName = n.trim(); return; }
      }
    } catch (_) {}
    // Fallbacks: email local-part, else "Student".
    try {
      var u = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
      if (u && u.email) studentName = u.email.split('@')[0];
    } catch (_) {}
  }

  function open() {
    var ov = el('certOverlay');
    if (!ov) return;
    backToList();
    show(ov);
    renderList();
    loadName().then(function () {
      // If the certificate view is open, refresh the name once it loads.
      var nameEl = el('certName');
      if (nameEl && !el('certView').classList.contains('hidden')) nameEl.textContent = studentName;
    });
  }
  function close() { hide(el('certOverlay')); }
  window.openCertificates = open;

  function init() {
    var navBtn = el('certsNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('certClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('certOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('certOverlay') || el('certOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    var back = el('certBack'); if (back) back.addEventListener('click', backToList);
    var print = el('certPrint'); if (print) print.addEventListener('click', function () { window.print(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
