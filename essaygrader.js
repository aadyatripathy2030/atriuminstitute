// AI essay grader. Sends an essay (and optional assignment prompt) through the
// AI proxy (AI.gradeEssay -> /api/claude intent:essay-grade) and renders rubric
// scores, strengths, next steps, and grammar/mechanics fixes. Self-contained
// and decoupled; a failure here cannot affect the rest of the app.
(function () {
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function scoreClass(n) { return n >= 80 ? 'good' : n >= 60 ? 'mid' : 'low'; }

  function open() {
    var ov = el('egOverlay');
    if (!ov) return;
    show(ov); show(el('egInput')); hide(el('egResults')); hide(el('egError'));
    var essay = el('egEssay');
    if (essay) essay.focus();
  }
  function close() { hide(el('egOverlay')); }
  window.openEssayGrader = open;

  function countWords() {
    var essay = el('egEssay');
    var wc = el('egWordcount');
    if (!essay || !wc) return;
    var n = essay.value.trim() ? essay.value.trim().split(/\s+/).length : 0;
    wc.textContent = n + (n === 1 ? ' word' : ' words');
  }

  function render(r) {
    var score = Math.round((r.overall && r.overall.score) || 0);
    el('egOverallScore').textContent = score;
    var ring = el('egOverallRing');
    ring.className = 'eg-score-ring ' + scoreClass(score);
    ring.style.setProperty('--pct', score + '%');
    el('egBand').textContent = (r.overall && r.overall.band) || '';
    el('egSummary').textContent = (r.overall && r.overall.summary) || '';

    // Rubric bars
    el('egRubric').innerHTML = (r.rubric || []).map(function (row) {
      var s = Math.round(row.score || 0);
      return '<div class="eg-rubric-row">' +
        '<div class="eg-rubric-top"><span>' + esc(row.name || '') + '</span><span class="eg-rubric-score">' + s + '</span></div>' +
        '<div class="eg-bar"><div class="eg-bar-fill ' + scoreClass(s) + '" style="width:' + s + '%"></div></div>' +
        '<div class="eg-rubric-comment">' + esc(row.comment || '') + '</div>' +
      '</div>';
    }).join('');

    el('egStrengths').innerHTML = (r.strengths || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') || '<li class="eg-empty">—</li>';
    el('egImprovements').innerHTML = (r.improvements || []).map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') || '<li class="eg-empty">—</li>';

    var mech = r.mechanics || [];
    if (!mech.length) {
      el('egMechanics').innerHTML = '<p class="eg-clean">No grammar or mechanics issues flagged — nice and clean. ✨</p>';
    } else {
      el('egMechanics').innerHTML = mech.map(function (m) {
        return '<div class="eg-mech-row">' +
          '<span class="eg-mech-quote">“' + esc(m.quote || '') + '”</span>' +
          '<span class="eg-mech-issue">' + esc(m.issue || '') + '</span>' +
          '<span class="eg-mech-fix">→ ' + esc(m.fix || '') + '</span>' +
        '</div>';
      }).join('');
    }

    hide(el('egInput')); show(el('egResults'));
    el('egResults').scrollTop = 0;
  }

  async function grade() {
    var essayEl = el('egEssay'), promptEl = el('egPrompt'), btn = el('egGradeBtn'), errEl = el('egError');
    hide(errEl);
    var essay = essayEl ? essayEl.value.trim() : '';
    if (!essay) { if (errEl) { errEl.textContent = 'Paste an essay first.'; show(errEl); } return; }
    if (essay.split(/\s+/).length < 20) { if (errEl) { errEl.textContent = 'That is quite short — paste at least a paragraph or two for useful feedback.'; show(errEl); } return; }
    if (typeof AI === 'undefined' || !AI.gradeEssay) { if (errEl) { errEl.textContent = 'The tutor is unavailable right now.'; show(errEl); } return; }

    var old = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Grading…'; }
    try {
      var result = await AI.gradeEssay(essay, promptEl ? promptEl.value : '');
      render(result);
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) ? e.message : 'Something went wrong. Try again.'; show(errEl); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = old || 'Grade my essay'; }
    }
  }

  function init() {
    var navBtn = el('essayNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('egClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('egOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('egOverlay') || el('egOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    var gradeBtn = el('egGradeBtn');
    if (gradeBtn) gradeBtn.addEventListener('click', grade);
    var essay = el('egEssay');
    if (essay) essay.addEventListener('input', countWords);
    var again = el('egAgain');
    if (again) again.addEventListener('click', function () { show(el('egInput')); hide(el('egResults')); if (essay) essay.focus(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
