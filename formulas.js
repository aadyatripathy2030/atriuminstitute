// Formula sheet. A searchable, categorised reference of common formulas,
// typeset with the site's MathJax. Self-contained; a failure here can't affect
// the app.
(function () {
  function el(id) { return document.getElementById(id); }

  var DATA = [
    ['Algebra', 'Quadratic formula', 'x = \\dfrac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'],
    ['Algebra', 'Slope of a line', 'm = \\dfrac{y_2 - y_1}{x_2 - x_1}'],
    ['Algebra', 'Slope-intercept form', 'y = mx + b'],
    ['Algebra', 'Point-slope form', 'y - y_1 = m(x - x_1)'],
    ['Algebra', 'Difference of squares', 'a^2 - b^2 = (a+b)(a-b)'],
    ['Algebra', 'Distance formula', 'd = \\sqrt{(x_2-x_1)^2 + (y_2-y_1)^2}'],
    ['Algebra', 'Midpoint formula', 'M = \\left(\\dfrac{x_1+x_2}{2},\\ \\dfrac{y_1+y_2}{2}\\right)'],
    ['Algebra', 'Product of powers', 'a^m \\cdot a^n = a^{m+n}'],
    ['Algebra', 'Logarithm product rule', '\\log_b(xy) = \\log_b x + \\log_b y'],
    ['Geometry', 'Area of a circle', 'A = \\pi r^2'],
    ['Geometry', 'Circumference of a circle', 'C = 2\\pi r'],
    ['Geometry', 'Area of a triangle', 'A = \\tfrac{1}{2} b h'],
    ['Geometry', 'Area of a rectangle', 'A = l w'],
    ['Geometry', 'Pythagorean theorem', 'a^2 + b^2 = c^2'],
    ['Geometry', 'Volume of a sphere', 'V = \\tfrac{4}{3}\\pi r^3'],
    ['Geometry', 'Volume of a cylinder', 'V = \\pi r^2 h'],
    ['Geometry', 'Volume of a cone', 'V = \\tfrac{1}{3}\\pi r^2 h'],
    ['Trigonometry', 'Sine ratio', '\\sin\\theta = \\dfrac{\\text{opposite}}{\\text{hypotenuse}}'],
    ['Trigonometry', 'Pythagorean identity', '\\sin^2\\theta + \\cos^2\\theta = 1'],
    ['Trigonometry', 'Tangent identity', '\\tan\\theta = \\dfrac{\\sin\\theta}{\\cos\\theta}'],
    ['Trigonometry', 'Law of sines', '\\dfrac{a}{\\sin A} = \\dfrac{b}{\\sin B} = \\dfrac{c}{\\sin C}'],
    ['Trigonometry', 'Law of cosines', 'c^2 = a^2 + b^2 - 2ab\\cos C'],
    ['Calculus', 'Power rule (derivative)', '\\dfrac{d}{dx}x^n = n x^{n-1}'],
    ['Calculus', 'Product rule', '(fg)\' = f\'g + fg\''],
    ['Calculus', 'Quotient rule', '\\left(\\dfrac{f}{g}\\right)\' = \\dfrac{f\'g - fg\'}{g^2}'],
    ['Calculus', 'Chain rule', '\\dfrac{d}{dx}f(g(x)) = f\'(g(x))\\,g\'(x)'],
    ['Calculus', 'Power rule (integral)', '\\displaystyle\\int x^n\\,dx = \\dfrac{x^{n+1}}{n+1} + C'],
    ['Calculus', 'Fundamental theorem', '\\displaystyle\\int_a^b f\'(x)\\,dx = f(b) - f(a)'],
    ['Statistics', 'Mean', '\\bar{x} = \\dfrac{1}{n}\\sum_{i=1}^{n} x_i'],
    ['Statistics', 'Variance', '\\sigma^2 = \\dfrac{1}{n}\\sum (x_i - \\mu)^2'],
    ['Statistics', 'Standard deviation', '\\sigma = \\sqrt{\\sigma^2}']
  ];

  var built = false;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function build() {
    var list = el('fmList');
    if (!list) return;
    var html = '', cat = null;
    DATA.forEach(function (row, i) {
      if (row[0] !== cat) { cat = row[0]; html += '<div class="fm-cat" data-cat="' + esc(cat) + '">' + esc(cat) + '</div>'; }
      html += '<div class="fm-row" data-search="' + esc((row[1] + ' ' + row[0]).toLowerCase()) + '">' +
        '<span class="fm-name">' + esc(row[1]) + '</span>' +
        '<span class="fm-math">\\(' + row[2] + '\\)</span>' +
      '</div>';
    });
    list.innerHTML = html;
    built = true;
    typeset(list);
  }

  function typeset(node, tries) {
    tries = tries || 0;
    if (window.MathJax && typeof window.MathJax.typesetPromise === 'function') {
      try { window.MathJax.typesetPromise([node]).catch(function () {}); } catch (_) {}
    } else if (tries < 40) {
      setTimeout(function () { typeset(node, tries + 1); }, 150);
    }
  }

  function filter() {
    var q = (el('fmSearch').value || '').trim().toLowerCase();
    var rows = el('fmList').querySelectorAll('.fm-row');
    var shownCats = {};
    var anyShown = false;
    rows.forEach(function (r) {
      var match = !q || r.dataset.search.indexOf(q) !== -1;
      r.style.display = match ? '' : 'none';
      if (match) { anyShown = true; }
    });
    // Hide category headers whose rows are all hidden.
    el('fmList').querySelectorAll('.fm-cat').forEach(function (c) {
      var sib = c.nextElementSibling, visible = false;
      while (sib && !sib.classList.contains('fm-cat')) {
        if (sib.classList.contains('fm-row') && sib.style.display !== 'none') { visible = true; break; }
        sib = sib.nextElementSibling;
      }
      c.style.display = visible ? '' : 'none';
    });
    el('fmEmpty').classList.toggle('hidden', anyShown);
  }

  function open() {
    var ov = el('fmOverlay');
    if (!ov) return;
    if (!built) build();
    ov.classList.remove('hidden');
    var s = el('fmSearch');
    if (s) s.focus();
  }
  function close() { var ov = el('fmOverlay'); if (ov) ov.classList.add('hidden'); }
  window.openFormulaSheet = open;

  function init() {
    var navBtn = el('formulasNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('fmClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('fmOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('fmOverlay') || el('fmOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    var s = el('fmSearch');
    if (s) s.addEventListener('input', filter);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
