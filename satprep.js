// SAT / ACT practice mode. Generates authentic-style multiple-choice questions
// via the AI proxy (AI.generateSatPractice), runs a timed quiz, then scores and
// shows a per-question review. Self-contained; a failure here can't affect the app.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  var LETTERS = ['A', 'B', 'C', 'D'];
  var SUBJECTS = { SAT: ['Math', 'Reading & Writing'], ACT: ['Math', 'English', 'Reading', 'Science'] };

  var test = 'SAT', count = 5;
  var questions = [], selected = [], current = 0;
  var startMs = 0, timer = null;

  function fillSubjects() {
    var sel = el('satSubject');
    if (!sel) return;
    sel.innerHTML = SUBJECTS[test].map(function (s) { return '<option value="' + esc(s) + '">' + esc(s) + '</option>'; }).join('');
  }

  // ---------- Timer ----------
  function fmt(ms) {
    var s = Math.floor(ms / 1000), m = Math.floor(s / 60);
    return m + ':' + String(s % 60).padStart(2, '0');
  }
  function startTimer() {
    startMs = Date.now();
    stopTimer();
    timer = setInterval(function () { var t = el('satTimer'); if (t) t.textContent = fmt(Date.now() - startMs); }, 500);
  }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

  // ---------- Quiz ----------
  function renderQuestion() {
    var q = questions[current];
    if (!q) return;
    el('satProg').textContent = 'Q ' + (current + 1) + ' / ' + questions.length;
    el('satTopic').textContent = q.topic || '';
    el('satQText').textContent = q.question;
    var sel = selected[current];
    el('satChoices').innerHTML = q.choices.map(function (c, i) {
      return '<button class="sat-choice' + (sel === i ? ' selected' : '') + '" data-i="' + i + '" type="button">' +
        '<span class="sat-letter">' + LETTERS[i] + '</span><span class="sat-choice-text">' + esc(c) + '</span></button>';
    }).join('');
    el('satChoices').querySelectorAll('.sat-choice').forEach(function (b) {
      b.addEventListener('click', function () { selected[current] = parseInt(b.dataset.i, 10); renderQuestion(); });
    });
    el('satPrev').style.visibility = current === 0 ? 'hidden' : 'visible';
    el('satNext').textContent = current === questions.length - 1 ? 'Finish ✓' : 'Next →';
  }

  function finish() {
    stopTimer();
    var correct = 0;
    questions.forEach(function (q, i) { if (selected[i] === q.answer) correct++; });
    var n = questions.length;
    var pct = Math.round(100 * correct / n);
    el('satScore').textContent = String(correct);
    el('satScoreOf').textContent = '/' + n;
    var ring = el('satScoreRing');
    ring.style.setProperty('--pct', pct + '%');
    ring.className = 'sat-score-ring ' + (pct >= 80 ? 'good' : pct >= 50 ? 'mid' : 'low');
    el('satScorePct').textContent = pct + '% correct';
    el('satScoreTime').textContent = 'Time: ' + fmt(Date.now() - startMs);

    el('satReview').innerHTML = questions.map(function (q, i) {
      var your = selected[i], ok = your === q.answer;
      var choices = q.choices.map(function (c, ci) {
        var cls = 'sat-rev-choice';
        if (ci === q.answer) cls += ' correct';
        else if (ci === your) cls += ' wrong';
        return '<div class="' + cls + '"><span class="sat-letter">' + LETTERS[ci] + '</span>' + esc(c) +
          (ci === q.answer ? ' <span class="sat-tag">✓ correct</span>' : (ci === your ? ' <span class="sat-tag sat-tag-x">your answer</span>' : '')) + '</div>';
      }).join('');
      return '<div class="sat-rev' + (ok ? ' ok' : ' no') + '">' +
        '<div class="sat-rev-q">' + (i + 1) + '. ' + esc(q.question) + (q.topic ? ' <span class="sat-rev-topic">' + esc(q.topic) + '</span>' : '') + '</div>' +
        choices +
        (q.explanation ? '<div class="sat-rev-exp">' + esc(q.explanation) + '</div>' : '') +
      '</div>';
    }).join('');

    hide(el('satQuiz')); show(el('satResults'));
    el('satResults').scrollTop = 0;
  }

  function go(delta) {
    var nc = current + delta;
    if (nc < 0) return;
    if (nc >= questions.length) { finish(); return; }
    current = nc; renderQuestion();
  }

  // ---------- Start ----------
  async function start() {
    var errEl = el('satError');
    hide(errEl);
    var subject = el('satSubject').value;
    if (typeof AI === 'undefined' || !AI.generateSatPractice) {
      if (errEl) { errEl.textContent = 'The tutor is unavailable right now.'; show(errEl); }
      return;
    }
    var btn = el('satStart');
    var old = btn.textContent;
    btn.disabled = true; btn.textContent = 'Building your set…';
    try {
      var qs = await AI.generateSatPractice(test, subject, count);
      if (!qs.length) throw new Error('Could not build questions. Try again.');
      questions = qs; selected = qs.map(function () { return -1; }); current = 0;
      hide(el('satSetup')); show(el('satQuiz'));
      renderQuestion(); startTimer();
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) ? e.message : 'Something went wrong.'; show(errEl); }
    } finally {
      btn.disabled = false; btn.textContent = old || 'Start practice';
    }
  }

  function reset() {
    stopTimer();
    show(el('satSetup')); hide(el('satQuiz')); hide(el('satResults'));
  }
  function open() { var ov = el('satOverlay'); if (!ov) return; reset(); show(ov); }
  function close() { stopTimer(); hide(el('satOverlay')); }
  window.openSatPrep = open;

  function init() {
    fillSubjects();
    var navBtn = el('satNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('satClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('satOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('satOverlay') || el('satOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    el('satTest').addEventListener('click', function (e) {
      var b = e.target.closest('.sat-seg-btn'); if (!b) return;
      test = b.dataset.test;
      el('satTest').querySelectorAll('.sat-seg-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
      fillSubjects();
    });
    el('satCount').addEventListener('click', function (e) {
      var b = e.target.closest('.sat-seg-btn'); if (!b) return;
      count = parseInt(b.dataset.count, 10);
      el('satCount').querySelectorAll('.sat-seg-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
    });
    el('satStart').addEventListener('click', start);
    el('satPrev').addEventListener('click', function () { go(-1); });
    el('satNext').addEventListener('click', function () { go(1); });
    el('satAgain').addEventListener('click', reset);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
