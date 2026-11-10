// Local answer checker, used only when the AI grader can't be reached.
//
// It is deliberately strict: an answer counts only when it says the same
// thing as the key, allowing for formatting (LaTeX, spacing, units, "x = "),
// equivalent numbers (1/2 = 0.5) and a different order for a list of
// answers. A wrong answer must never pass just because it contains, or is
// contained in, the right one ("12" for "123", "x>3" for "x<3").
//
// Loaded in the browser as a plain script (defines window.GradeLib and a
// global localCheck) and required by the tests in Node.
(function (root) {
  'use strict';

  function normalizeAns(s) {
    if (s == null) return '';
    s = String(s).toLowerCase();
    // 3,990 is one number, not a list.
    s = s.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');
    s = s.replace(/<[^>]+>/g, '');
    s = s.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, '');
    s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\\pm/g, '+-').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
    s = s.replace(/\\neq/g, '!=').replace(/\\leq?(?![a-z])/g, '<=').replace(/\\geq?(?![a-z])/g, '>=');
    s = s.replace(/\\lt\b/g, '<').replace(/\\gt\b/g, '>');
    s = s.replace(/\\infty/g, 'inf').replace(/\\pi/g, 'pi');
    s = s.replace(/\\overline\s*\{([^{}]*)\}/g, '$1');
    // Layout-only commands go; the rest keep their name (\sin\theta -> sintheta).
    s = s.replace(/\\(left|right|big|bigg|displaystyle|text|mathrm|mathbf|operatorname|quad|qquad)(?![a-z])\s*/gi, '');
    s = s.replace(/\\[,;:! ]/g, '');
    s = s.replace(/\\([a-z]+)\s*/gi, '$1');
    s = s.replace(/[{}]/g, '');
    s = s.replace(/±/g, '+-').replace(/×/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt');
    s = s.replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=').replace(/[−–]/g, '-');
    // Units only count as units right after a number ("12 sq in", "72°").
    s = s.replace(/(\d)\s*(?:sq\.?\s*|square\s+)?(?:units?|ft|in\.?|cm|mph|°f?)(?![a-z])/g, '$1');
    s = s.replace(/°/g, '');
    s = s.replace(/\band\b|\bor\b/g, ',');
    // (1)/(2) from \frac{1}{2} is just the number 1/2.
    s = s.replace(/\((-?\d+(?:\.\d+)?)\)\s*\/\s*\((\d+(?:\.\d+)?)\)/g, '$1/$2');
    s = s.replace(/[^\p{L}\p{N}_/=+\-*.,()!<>]/gu, ' ').replace(/\s+/g, '').replace(/\.$/, '');
    // "x=5" means the same as "5" (and "x=5,x=-3" the same as "5,-3").
    s = s.replace(/(^|,)[a-z]=(?![=<>])/g, '$1');
    s = s.replace(/^,+|,+$/g, '');
    return s;
  }

  const NUM = /-?\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?/g;

  function extractNumbers(s) {
    return (s.match(NUM) || []).map(n => {
      if (n.includes('/')) {
        const [a, b] = n.split('/').map(Number);
        return b === 0 ? n : (a / b).toFixed(6);
      }
      return parseFloat(n).toFixed(6);
    });
  }

  // The answer with every number replaced by #, so "x>3" and "x<3" differ.
  function skeleton(s) { return s.replace(NUM, '#'); }

  const SHORT_UNITS = new Set(['m', 'km', 'cm', 'mm', 'g', 'kg', 'mg', 'l', 'ml', 's', 'h', 'hr', 'yd', 'mi', 'oz', 'lb', 'ft', 'in']);

  // "399 apples" means 399 here; a lone variable like "5x" is left alone.
  function dropUnit(s) {
    const m = /^(-?\d[\d./]*)([a-z]+)$/.exec(s);
    if (!m) return s;
    const word = m[2];
    if (word === 'pi' || word === 'inf' || word.startsWith('sqrt')) return s;
    return word.length >= 3 || SHORT_UNITS.has(word) ? m[1] : s;
  }

  function sameItem(a, b) {
    if (a === b) return true;
    a = dropUnit(a); b = dropUnit(b);
    if (a === b) return true;
    if (skeleton(a) !== skeleton(b)) return false;
    const an = extractNumbers(a), bn = extractNumbers(b);
    return an.length > 0 && an.length === bn.length && an.every((n, i) => n === bn[i]);
  }

  function localCheck(user, correct) {
    if (user == null || !String(user).trim()) return false;
    const u = normalizeAns(user), c = normalizeAns(correct);
    if (!u || !c) return false;
    if (sameItem(u, c)) return true;
    // A list of answers ("2, 3" or "x = 2 or x = 3") may come in any order,
    // but must have exactly the same items.
    const ul = u.split(',').filter(Boolean), cl = c.split(',').filter(Boolean);
    if (cl.length < 2 || ul.length !== cl.length) return false;
    const left = cl.slice();
    for (const item of ul) {
      const i = left.findIndex(x => sameItem(item, x));
      if (i < 0) return false;
      left.splice(i, 1);
    }
    return true;
  }

  const api = { normalizeAns, extractNumbers, localCheck };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else { root.GradeLib = api; root.localCheck = localCheck; }
})(globalThis); // window, in a browser
