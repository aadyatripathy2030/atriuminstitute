// Second-pass dollar-LaTeX converter. The first pass (convert-dollar-latex.js)
// was confused by adjacent JSON string boundaries: when a question said
// "...$15 budget..." in question text and "$x + y \le 15$" in the answer
// field, the regex saw both $ signs as one outer pair and skipped the inner
// real-math.
//
// This pass walks each JSON string literal in the file independently — so
// the question text and answer text are processed as separate units — and
// runs the same heuristic conversion within each.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

const SKIP = new Set([
  'ai.js','app.js','auth.js','activity.js','activity-labels.js','admin.js',
  'courses.js','curriculum.js','curriculum-loader.js',
  'db.js','db-jsonfile.js','db-postgres.js','email.js',
  'eslint.config.js','favorites.js','gamification.js',
  'parent.js','payments.js','profile.js','prompts.js',
  'server.js','stripe-lib.js','study.js','survey.js','tokens.js',
]);
const files = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.js') && !SKIP.has(f))
  .map(f => path.join(ROOT, f));

const MATH_MARKERS = /\\[a-zA-Z]+|\^[\w{]|_\{|°|π|∑|∫|∞|≤|≥|≠|≈|→|←|⇒/;
function looksLikeMath(inner) {
  if (!inner || inner.length === 0) return false;
  if (/["']\s*[,:}]|[,:{]\s*["']/.test(inner)) return false;
  const stripped = inner.replace(/^\d[\d,.]*\s*/, '');
  return MATH_MARKERS.test(inner) || MATH_MARKERS.test(stripped);
}

// Walk the source and find double-quoted string literals (the kind used by
// JSON-stringified questions). Inside each, apply $-conversion. We skip
// template literals and single-quoted strings — those are code, not data.
function convertString(content) {
  let fixed = 0;
  // Display first.
  content = content.replace(/\$\$([^\$\n]+?)\$\$/g, (m, inner) => {
    if (looksLikeMath(inner)) { fixed++; return `\\\\[${inner}\\\\]`; }
    return m;
  });
  // Inline.
  content = content.replace(/\$([^\$\n]{1,400}?)\$/g, (m, inner) => {
    if (looksLikeMath(inner)) { fixed++; return `\\\\(${inner}\\\\)`; }
    return m;
  });
  return { content, fixed };
}

// Tokenise the file into "string literal" vs "everything else" so we never
// run $-conversion across a string boundary.
function processFile(src) {
  let out = '';
  let i = 0;
  let totalFixed = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"') {
      // Walk to the end of this double-quoted string, honouring \" escapes.
      let j = i + 1;
      while (j < src.length) {
        const ch = src[j];
        if (ch === '\\' && j + 1 < src.length) { j += 2; continue; }
        if (ch === '"') break;
        if (ch === '\n') break; // unterminated; bail.
        j++;
      }
      // src.slice(i, j+1) is "..." including the surrounding quotes.
      const literal = src.slice(i, j + 1);
      const inner = literal.slice(1, -1);
      const { content, fixed } = convertString(inner);
      totalFixed += fixed;
      out += '"' + content + (literal.endsWith('"') ? '"' : '');
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return { out, fixed: totalFixed };
}

let total = 0, filesChanged = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const { out, fixed } = processFile(src);
  if (fixed === 0 || out === src) continue;
  total += fixed; filesChanged++;
  const rel = path.relative(ROOT, f);
  console.log(`${rel}:  +${fixed}`);
  if (!DRY) fs.writeFileSync(f, out);
}
console.log('---');
console.log(`${filesChanged} files ${DRY ? 'would change' : 'changed'}; ${total} additional conversions`);
