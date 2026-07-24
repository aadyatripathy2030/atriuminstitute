// Learning Path: a placement test that builds a personalised course, plus a
// mastery loop (score 97.5%+ on a topic quiz to unlock the next topic). Uses the
// AI proxy for generation and the KV store (/api/me/learning-path) for state.
// Self-contained; a failure here can't affect the rest of the app.
(function () {
  var MASTERY = 97.5;
  var LETTERS = ['A', 'B', 'C', 'D'];
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var VIEWS = ['plIntro', 'plLoading', 'plQuiz', 'plResult', 'plCourse', 'plTopicResult'];
  function view(id) { VIEWS.forEach(function (v) { (v === id ? show : hide)(el(v)); }); }
  function loading(msg) { if (el('plLoadingMsg')) el('plLoadingMsg').textContent = msg || 'Working…'; view('plLoading'); }

  var subject = 'Math';
  var path = null;            // saved learning-path state
  var questions = [], answers = [], current = 0;
  var quizMode = 'placement'; // 'placement' | 'topic'
  var quizTopicIndex = -1;    // which course topic this quiz is for

  // ---------- Quiz rendering (shared) ----------
  function renderQuestion() {
    var q = questions[current];
    if (!q) return;
    el('plProg').textContent = 'Q ' + (current + 1) + ' / ' + questions.length;
    el('plQuizLabel').textContent = quizMode === 'placement' ? 'Placement' : 'Mastery quiz';
    el('plQTopic').textContent = q.topic || '';
    el('plQText').textContent = q.question;
    var sel = answers[current];
    el('plChoices').innerHTML = q.choices.map(function (c, i) {
      return '<button class="sat-choice' + (sel === i ? ' selected' : '') + '" data-i="' + i + '" type="button">' +
        '<span class="sat-letter">' + LETTERS[i] + '</span><span class="sat-choice-text">' + esc(c) + '</span></button>';
    }).join('');
    el('plChoices').querySelectorAll('.sat-choice').forEach(function (b) {
      b.addEventListener('click', function () { answers[current] = parseInt(b.dataset.i, 10); renderQuestion(); });
    });
    el('plPrev').style.visibility = current === 0 ? 'hidden' : 'visible';
    el('plNext').textContent = current === questions.length - 1 ? 'Finish ✓' : 'Next →';
  }
  function startQuiz(qs, mode, topicIndex) {
    questions = qs; answers = qs.map(function () { return -1; }); current = 0;
    quizMode = mode; quizTopicIndex = (topicIndex == null ? -1 : topicIndex);
    view('plQuiz'); renderQuestion();
  }
  function scorePct() {
    var correct = 0;
    questions.forEach(function (q, i) { if (answers[i] === q.answer) correct++; });
    return { correct: correct, total: questions.length, pct: Math.round(1000 * correct / questions.length) / 10 };
  }
  function goQuiz(delta) {
    var nc = current + delta;
    if (nc < 0) return;
    if (nc >= questions.length) { finishQuiz(); return; }
    current = nc; renderQuestion();
  }
  function finishQuiz() {
    if (quizMode === 'placement') finishPlacement();
    else finishTopicQuiz();
  }

  // ---------- Placement ----------
  async function startPlacement() {
    hide(el('plError'));
    if (typeof AI === 'undefined' || !AI.generatePlacementTest) { showErr('The tutor is unavailable right now.'); return; }
    loading('Building your ' + subject + ' placement test… this takes a few seconds.');
    try {
      var qs = await AI.generatePlacementTest(subject, 28);
      if (qs.length < 8) throw new Error('Could not build the test. Try again.');
      startQuiz(qs, 'placement');
    } catch (e) { showErr((e && e.message) || 'Something went wrong.'); view('plIntro'); }
  }
  function levelFor(pct) {
    return pct < 40 ? 'Beginner' : pct < 65 ? 'Developing' : pct < 85 ? 'Proficient' : 'Advanced';
  }
  function finishPlacement() {
    var s = scorePct();
    var weak = {};
    questions.forEach(function (q, i) { if (answers[i] !== q.answer && q.topic) weak[q.topic] = (weak[q.topic] || 0) + 1; });
    window.__plWeak = Object.keys(weak).slice(0, 6);
    window.__plScore = s.pct;
    window.__plLevel = levelFor(s.pct);
    el('plScore').textContent = s.pct;
    var ring = el('plScoreRing');
    ring.style.setProperty('--pct', s.pct + '%');
    ring.className = 'sat-score-ring ' + (s.pct >= 85 ? 'good' : s.pct >= 50 ? 'mid' : 'low');
    el('plLevel').textContent = 'Level: ' + window.__plLevel;
    el('plResultSub').textContent = s.correct + ' / ' + s.total + ' correct · we\'ll start you at the right spot';
    view('plResult');
  }

  async function buildCourse() {
    hide(el('plResultError'));
    loading('Building your custom ' + subject + ' course from your results…');
    try {
      var topics = await AI.generateLearningPath(subject, window.__plLevel, window.__plWeak || []);
      if (!topics.length) throw new Error('Could not build your course. Try again.');
      path = {
        subject: subject, level: window.__plLevel, placementScore: window.__plScore,
        topics: topics.map(function (t, i) { return { name: t.name, desc: t.desc, status: i === 0 ? 'current' : 'locked', bestScore: null }; }),
        currentIndex: 0,
      };
      await savePath();
      renderCourse();
    } catch (e) {
      if (el('plResultError')) { el('plResultError').textContent = (e && e.message) || 'Something went wrong.'; show(el('plResultError')); }
      view('plResult');
    }
  }

  // ---------- Course view ----------
  function renderCourse() {
    if (!path) return;
    el('plCourseTitle').textContent = 'Your ' + path.subject + ' course';
    el('plCourseLevel').textContent = path.level || '';
    var mastered = path.topics.filter(function (t) { return t.status === 'mastered'; }).length;
    var pct = path.topics.length ? Math.round(100 * mastered / path.topics.length) : 0;
    el('plCourseProgress').style.width = pct + '%';
    el('plCourseProgressLabel').textContent = mastered + ' of ' + path.topics.length + ' topics mastered';
    el('plTopics').innerHTML = path.topics.map(function (t, i) {
      var icon = t.status === 'mastered' ? '✓' : (t.status === 'current' ? '▶' : '🔒');
      var btn = t.status === 'current'
        ? '<button class="cta-primary pl-topic-btn" data-i="' + i + '" type="button">Take mastery quiz</button>'
        : (t.status === 'mastered' ? '<span class="pl-topic-done">Mastered · ' + (t.bestScore != null ? t.bestScore + '%' : '') + '</span>' : '');
      return '<div class="pl-topic pl-' + t.status + '">' +
        '<div class="pl-topic-icon">' + icon + '</div>' +
        '<div class="pl-topic-body"><div class="pl-topic-name">' + esc(t.name) + '</div>' +
        (t.desc ? '<div class="pl-topic-desc">' + esc(t.desc) + '</div>' : '') + '</div>' +
        '<div class="pl-topic-action">' + btn + '</div>' +
      '</div>';
    }).join('');
    el('plTopics').querySelectorAll('.pl-topic-btn').forEach(function (b) {
      b.addEventListener('click', function () { startTopicQuiz(parseInt(b.dataset.i, 10)); });
    });
    view('plCourse');
  }

  async function startTopicQuiz(idx) {
    var t = path.topics[idx];
    if (!t) return;
    loading('Building your mastery quiz on “' + t.name + '”…');
    try {
      var qs = await AI.generateTopicQuiz(path.subject, t.name, 10);
      if (qs.length < 4) throw new Error('Could not build the quiz. Try again.');
      startQuiz(qs, 'topic', idx);
    } catch (e) { alert((e && e.message) || 'Something went wrong.'); renderCourse(); }
  }

  async function finishTopicQuiz() {
    var s = scorePct();
    var t = path.topics[quizTopicIndex];
    if (t && (t.bestScore == null || s.pct > t.bestScore)) t.bestScore = s.pct;
    var passed = s.pct >= MASTERY;
    if (passed && t) {
      t.status = 'mastered';
      var next = path.topics[quizTopicIndex + 1];
      if (next) { next.status = 'current'; path.currentIndex = quizTopicIndex + 1; }
      else { path.currentIndex = path.topics.length; }
      try { await savePath(); } catch (_) {}
    } else {
      try { await savePath(); } catch (_) {}
    }
    // Render the topic result screen.
    el('plTrEmoji').textContent = passed ? '🎉' : '💪';
    el('plTrTitle').textContent = passed ? 'Topic mastered!' : 'Almost there';
    el('plTrScore').textContent = s.pct + '%  (' + s.correct + '/' + s.total + ')';
    el('plTrScore').className = 'pl-tr-score ' + (passed ? 'good' : 'mid');
    var allDone = path.topics.every(function (x) { return x.status === 'mastered'; });
    el('plTrMsg').textContent = passed
      ? (allDone ? 'You\'ve mastered every topic in this course — incredible work! Retake the placement test to go further.' : 'You scored ' + MASTERY + '%+ — the next topic is unlocked.')
      : 'You need ' + MASTERY + '% or higher to master this topic. Review it and try again — you\'ve got this.';
    var actions = el('plTrActions');
    actions.innerHTML = '';
    if (!passed) {
      var retry = document.createElement('button');
      retry.className = 'cta-primary'; retry.textContent = 'Try again';
      retry.addEventListener('click', function () { startTopicQuiz(quizTopicIndex); });
      actions.appendChild(retry);
    }
    var cont = document.createElement('button');
    cont.className = passed ? 'cta-primary' : 'cta-secondary';
    cont.textContent = 'Back to course';
    cont.addEventListener('click', renderCourse);
    actions.appendChild(cont);
    view('plTopicResult');
  }

  // ---------- Persistence ----------
  async function savePath() {
    var r = await fetch('/api/me/learning-path', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(path)
    });
    if (r.ok) { var d = await r.json(); if (d && d.path) path = d.path; }
  }

  function showErr(m) { if (el('plError')) { el('plError').textContent = m; show(el('plError')); } }

  async function open() {
    var ov = el('plOverlay');
    if (!ov) return;
    show(ov);
    loading('Loading your learning path…');
    try {
      var r = await fetch('/api/me/learning-path', { credentials: 'same-origin' });
      if (r.status === 401) { view('plIntro'); showErr('Sign in to build your learning path.'); return; }
      var d = await r.json();
      if (d && d.path && d.path.topics && d.path.topics.length) { path = d.path; subject = path.subject || 'Math'; renderCourse(); }
      else { view('plIntro'); }
    } catch (_) { view('plIntro'); }
  }
  function close() { hide(el('plOverlay')); }
  window.openLearningPath = open;

  function init() {
    var navBtn = el('pathNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('plClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('plOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('plOverlay') || el('plOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    el('plSubject').addEventListener('click', function (e) {
      var b = e.target.closest('.sat-seg-btn'); if (!b) return;
      subject = b.dataset.subject;
      el('plSubject').querySelectorAll('.sat-seg-btn').forEach(function (x) { x.classList.toggle('active', x === b); });
    });
    el('plStart').addEventListener('click', startPlacement);
    el('plPrev').addEventListener('click', function () { goQuiz(-1); });
    el('plNext').addEventListener('click', function () { goQuiz(1); });
    el('plBuildCourse').addEventListener('click', buildCourse);
    el('plRestart').addEventListener('click', function () {
      if (confirm('Retake the placement test? This replaces your current course.')) { path = null; view('plIntro'); }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
