// Convert `$...$` LaTeX delimiters to `\(...\)` (and `$$...$$` to `\[...\]`)
// in every JS data file. Skips dollar amounts ($5, $1,000.00, etc) — only
// converts spans that contain math markers (\command, ^, _{, etc).
//
// Run:   node tools/convert-dollar-latex.js
//        node tools/convert-dollar-latex.js --dry-run    (preview only)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

// JS file is a "data" file if it has questions/lessons/etc. We scan every
// committed *.js at the top level except known non-data files.
const SKIP = new Set([
  'ai.js','app.js','auth.js','activity.js','activity-labels.js','admin.js',
  'courses.js','curriculum.js','curriculum-loader.js',
  'db.js','db-jsonfile.js','db-postgres.js','email.js',
  'eslint.config.js','favorites.js','gamification.js',
  'parent.js','payments.js','profile.js','prompts.js',
  'server.js','stripe-lib.js','study.js','survey.js','tokens.js',
]);

const files = fs.readdirSync(ROOT)
  .filter(f => f.endsWith('.js') && !SKIP.has(f) && f !== 'expand-cache.js')
  .map(f => path.join(ROOT, f));

// "Looks like math" heuristic — the content between $$ delimiters must
// contain at least one of: a backslash command, a caret/underscore followed
// by content, or a math-only character like π/∑/∫.
const MATH_MARKERS = /\\[a-zA-Z]+|\^[\w{]|_\{|°|π|∑|∫|∞|≤|≥|≠|≈|→|←|⇒/;
// JS source contains many "$5" / "$1,000" style currency amounts in string
// literals. When our $-pair regex spans from a currency $ on the question
// side to an unrelated $ on the answer side, the captured "math" actually
// contains string-literal boundaries like `","`. Drop those — they're not
// real math.
const STRING_BOUNDARY = /["']\s*[,:}]|[,:{]\s*["']/;
function looksLikeMath(inner) {
  if (!inner || inner.length === 0) return false;
  if (STRING_BOUNDARY.test(inner)) return false;
  // Strip leading digits/commas/period/spaces (currency-prefix) and re-check.
  const stripped = inner.replace(/^\d[\d,.]*\s*/, '');
  return MATH_MARKERS.test(inner) || MATH_MARKERS.test(stripped);
}

// Number of `$` chars in a row is significant: `$$...$$` = display, `$...$` = inline.
// We process `$$` first so that `$a$$b$` (rare) doesn't confuse us.
function convert(src) {
  let out = src;
  let inlineFixed = 0, displayFixed = 0;

  // Display math: $$...$$
  out = out.replace(/\$\$([^\$\n]+?)\$\$/g, (match, inner) => {
    if (looksLikeMath(inner)) { displayFixed++; return `\\\\[${inner}\\\\]`; }
    return match;
  });

  // Inline math: $...$ (single $). Must NOT cross newlines. Must NOT match
  // currency like $5 or $1,000.00 — looksLikeMath handles that.
  out = out.replace(/\$([^\$\n]{1,400}?)\$/g, (match, inner) => {
    if (looksLikeMath(inner)) { inlineFixed++; return `\\\\(${inner}\\\\)`; }
    return match;
  });

  return { out, inlineFixed, displayFixed };
}

let totalIn = 0, totalDisp = 0, filesChanged = 0;
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const { out, inlineFixed, displayFixed } = convert(src);
  if (inlineFixed === 0 && displayFixed === 0) continue;
  totalIn += inlineFixed; totalDisp += displayFixed; filesChanged++;
  const rel = path.relative(ROOT, f);
  console.log(`${rel}:  +${inlineFixed} inline, +${displayFixed} display`);
  if (!DRY) fs.writeFileSync(f, out);
}
console.log('---');
console.log(`${filesChanged} files ${DRY ? 'would change' : 'changed'}; ${totalIn} inline + ${totalDisp} display total`);
if (DRY) console.log('(dry run — no files written; re-run without --dry-run to apply)');
