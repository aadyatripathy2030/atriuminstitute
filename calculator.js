// Scientific calculator. Button-driven; expression is kept as a token array and
// evaluated by a small recursive-descent parser (no eval / Function). Trig
// respects the DEG/RAD toggle. Self-contained; a failure here can't affect the app.
(function () {
  function el(id) { return document.getElementById(id); }

  // ---------- Evaluator ----------
  var FUNCS = { sin:1, cos:1, tan:1, asin:1, acos:1, atan:1, sqrt:1, ln:1, log:1, exp:1, abs:1 };

  function tokenize(s) {
    var t = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (c === ' ') { i++; continue; }
      if ((c >= '0' && c <= '9') || c === '.') {
        var num = '';
        while (i < s.length && ((s[i] >= '0' && s[i] <= '9') || s[i] === '.')) { num += s[i++]; }
        t.push({ t: 'num', v: parseFloat(num) });
        continue;
      }
      if (c >= 'a' && c <= 'z') {
        var id = '';
        while (i < s.length && s[i] >= 'a' && s[i] <= 'z') { id += s[i++]; }
        if (id === 'pi') t.push({ t: 'num', v: Math.PI });
        else if (id === 'e') t.push({ t: 'num', v: Math.E });
        else if (FUNCS[id]) t.push({ t: 'func', v: id });
        else throw new Error('Unknown: ' + id);
        continue;
      }
      if ('+-*/^!()'.indexOf(c) !== -1) { t.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('Bad char: ' + c);
    }
    return t;
  }

  function parse(tokens, deg) {
    var pos = 0;
    function peek() { return tokens[pos]; }
    function eat(v) {
      var tk = tokens[pos];
      if (!tk || (v && tk.v !== v)) throw new Error('Syntax error');
      pos++; return tk;
    }
    function toRad(x) { return deg ? x * Math.PI / 180 : x; }
    function fromRad(x) { return deg ? x * 180 / Math.PI : x; }
    function applyFunc(name, x) {
      switch (name) {
        case 'sin': return Math.sin(toRad(x));
        case 'cos': return Math.cos(toRad(x));
        case 'tan': return Math.tan(toRad(x));
        case 'asin': return fromRad(Math.asin(x));
        case 'acos': return fromRad(Math.acos(x));
        case 'atan': return fromRad(Math.atan(x));
        case 'sqrt': return Math.sqrt(x);
        case 'ln': return Math.log(x);
        case 'log': return Math.log10(x);
        case 'exp': return Math.exp(x);
        case 'abs': return Math.abs(x);
      }
      throw new Error('fn');
    }
    function factorial(n) {
      if (n < 0 || Math.floor(n) !== n) throw new Error('factorial needs a non-negative integer');
      if (n > 170) return Infinity;
      var r = 1; for (var k = 2; k <= n; k++) r *= k; return r;
    }

    function parseExpr() {
      var v = parseTerm();
      while (peek() && peek().t === 'op' && (peek().v === '+' || peek().v === '-')) {
        var o = eat().v;
        var r = parseTerm();
        v = o === '+' ? v + r : v - r;
      }
      return v;
    }
    function parseTerm() {
      var v = parsePower();
      while (peek() && peek().t === 'op' && (peek().v === '*' || peek().v === '/')) {
        var o = eat().v;
        var r = parsePower();
        v = o === '*' ? v * r : v / r;
      }
      return v;
    }
    function parsePower() {
      var v = parseUnary();
      if (peek() && peek().t === 'op' && peek().v === '^') {
        eat('^');
        var r = parsePower(); // right-associative
        v = Math.pow(v, r);
      }
      return v;
    }
    function parseUnary() {
      if (peek() && peek().t === 'op' && (peek().v === '-' || peek().v === '+')) {
        var o = eat().v;
        var v = parseUnary();
        return o === '-' ? -v : v;
      }
      return parsePostfix();
    }
    function parsePostfix() {
      var v = parseAtom();
      while (peek() && peek().t === 'op' && peek().v === '!') { eat('!'); v = factorial(v); }
      return v;
    }
    function parseAtom() {
      var tk = peek();
      if (!tk) throw new Error('Unexpected end');
      if (tk.t === 'num') { eat(); return tk.v; }
      if (tk.t === 'func') { eat(); eat('('); var a = parseExpr(); eat(')'); return applyFunc(tk.v, a); }
      if (tk.t === 'op' && tk.v === '(') { eat('('); var e = parseExpr(); eat(')'); return e; }
      throw new Error('Unexpected: ' + tk.v);
    }

    var result = parseExpr();
    if (pos !== tokens.length) throw new Error('Syntax error');
    return result;
  }

  function evaluate(str, deg) {
    if (!str || !str.trim()) return 0;
    var v = parse(tokenize(str), deg);
    if (typeof v !== 'number' || isNaN(v)) throw new Error('Not a number');
    return v;
  }
  window.__calcEvaluate = evaluate; // exposed for tests

  // ---------- UI ----------
  var tokens = [];      // display/eval token strings
  var ans = 0;
  var deg = true;
  var justEval = false;

  function pretty(arr) {
    return arr.map(function (t) {
      return t.replace(/\*/g, '×').replace(/\//g, '÷').replace(/(?<![a-z])-/g, '−')
              .replace(/pi/g, 'π').replace(/sqrt\(/g, '√(');
    }).join('');
  }
  function paint(result) {
    var ex = el('calcExpr'), rs = el('calcResult');
    if (ex) ex.textContent = pretty(tokens) || '0';
    if (rs && result !== undefined) rs.textContent = result;
    var dg = el('calcDeg');
    if (dg) { dg.textContent = deg ? 'DEG' : 'RAD'; dg.setAttribute('aria-pressed', String(deg)); }
  }
  function insert(str) {
    var toks = str.split(' ');
    if (justEval) {
      // Continue from the answer if an operator/postfix comes next; else start fresh.
      if (/^[+\-*/^!]$/.test(toks[0])) tokens = [String(ans)];
      else tokens = [];
      justEval = false;
    }
    toks.forEach(function (t) { if (t) tokens.push(t); });
    paint('');
  }
  function equals() {
    try {
      var r = evaluate(tokens.join(''), deg);
      ans = r;
      // Trim floating fuzz.
      var out = Math.abs(r) < 1e-12 ? 0 : parseFloat(r.toPrecision(12));
      paint(String(out));
      justEval = true;
    } catch (e) {
      paint('Error');
      justEval = true;
      tokens = [];
    }
  }

  function onKey(action, ins) {
    if (action === 'clear') { tokens = []; ans = 0; justEval = false; paint('0'); }
    else if (action === 'back') { if (justEval) { tokens = []; justEval = false; } else tokens.pop(); paint(''); }
    else if (action === 'equals') equals();
    else if (action === 'deg') { deg = !deg; paint(''); }
    else if (ins) insert(ins);
  }

  function init() {
    var navBtn = el('calculatorNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('calcClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('calcOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('calcOverlay') || el('calcOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    var pad = el('calcPad');
    if (pad) pad.addEventListener('click', function (e) {
      var b = e.target.closest('.calc-btn');
      if (!b) return;
      onKey(b.dataset.act, b.dataset.ins);
    });
    paint('0');
  }
  function open() { var ov = el('calcOverlay'); if (ov) { ov.classList.remove('hidden'); paint(''); } }
  function close() { var ov = el('calcOverlay'); if (ov) ov.classList.add('hidden'); }
  window.openCalculator = open;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
