// Expands every section quiz to TARGET_PER_SECTION questions and every
// cumulative test to TARGET_PER_CUMULATIVE by calling the Claude API.
// Writes results to ../expansions.js (loaded after extras.js in index.html).
// Resumable via tools/.expand-cache.json — re-running picks up where it left off.
//
// Smart mode: batches each book into a single API call (sections + cumulative).
// ~65 calls total instead of ~283. Drastically fewer rate-limit hits.
//
// Run:   cd course-site && node tools/expand-quizzes.js
// Env:   ANTHROPIC_API_KEY (or ./.apikey)
//        CONCURRENCY=3  TARGET_PER_SECTION=20  TARGET_PER_CUMULATIVE=30
//        MODEL=claude-haiku-4-5-20251001

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const CACHE_PATH = path.join(__dirname, '.expand-cache.json');
const OUT_PATH = path.join(ROOT, 'expansions.js');

const TARGET_PER_SECTION = +process.env.TARGET_PER_SECTION || 20;
const TARGET_PER_CUMULATIVE = +process.env.TARGET_PER_CUMULATIVE || 30;
const CONCURRENCY = +process.env.CONCURRENCY || 3;
const MODEL = process.env.MODEL || 'claude-haiku-4-5-20251001';

const API_KEY = process.env.ANTHROPIC_API_KEY
  || (fs.existsSync(path.join(ROOT, '.apikey')) && fs.readFileSync(path.join(ROOT, '.apikey'), 'utf8').trim())
  || (fs.existsSync(path.join(process.env.HOME || '', '.anthropic_api_key')) && fs.readFileSync(path.join(process.env.HOME, '.anthropic_api_key'), 'utf8').trim());

if (!API_KEY) {
  console.error('No API key. Set ANTHROPIC_API_KEY or create ./.apikey');
  process.exit(1);
}

// ---------- Load all course data via vm sandbox ----------
function loadCourses() {
  const sandbox = { console, Object, Array };
  vm.createContext(sandbox);
  const files = [
    'arithmetic-data.js',
    'prealgebra-data.js','algebra-data.js','algebra2-data.js','geometry-data.js',
    'trigonometry-data.js',
    'precalc-data.js','calculus-data.js',
    'statistics-data.js','finitemath-data.js','linearalg-data.js',
    'diffeq-data.js','abstractalg-data.js','realanalysis-data.js',
    'english-data.js','english-hs-data.js',
    'courses.js','extras.js','english-extras.js'
  ];
  for (const f of files) {
    let src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    src = src.replace(/^(const|let)\s+([A-Z_][A-Z_0-9]*)\s*=/gm, 'this.$2 =');
    src = src.replace(/^(const|let)\s+COURSE\s*=/gm, 'this.COURSE =');
    src = src.replace(/^function\s+setCourse/gm, 'this.setCourse = function');
    src = src.replace(/^function\s+_addQ/gm, 'this._addQ = function');
    src = src.replace(/^function\s+_setCum/gm, 'this._setCum = function');
    src = src.replace(/^const\s+R\s*=/gm, 'this.R =');
    src = src.replace(/^const\s+W\s*=/gm, 'this.W =');
    vm.runInContext(src, sandbox, { filename: f });
  }
  return sandbox.COURSES;
}

// ---------- Anthropic API call ----------
function callAPI(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      method: 'POST',
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          if (res.statusCode === 429) {
            const retryAfter = parseInt(res.headers['retry-after'] || '60', 10);
            const err = new Error(`API 429 rate-limited; retry-after=${retryAfter}s`);
            err.retryAfter = retryAfter;
            err.status = 429;
            return reject(err);
          }
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) return reject(new Error(`API ${res.statusCode}: ${parsed.error?.message || data.slice(0,200)}`));
          resolve(parsed.content?.[0]?.text || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------- Batched per-book prompt ----------
function buildBookPrompt(courseTitle, book, sectionsNeeding, cumNeed) {
  const sectionsBlock = sectionsNeeding.map(({ sIdx, sec, need }) => {
    const existing = sec.questions.map((q, i) => `  ${i+1}. ${q.q} → ${q.answer}`).join('\n');
    return `SECTION sIdx=${sIdx} title="${sec.title}" — need ${need} NEW questions
Existing (do NOT duplicate):
${existing}`;
  }).join('\n\n');

  const cumBlock = cumNeed > 0
    ? `\n\nCUMULATIVE TEST — need ${cumNeed} NEW cumulative questions covering all sub-sections in this book.
Existing cumulative (do NOT duplicate):
${(book.cumulativeTest?.questions || []).map((q,i)=>`  ${i+1}. ${q.q} → ${q.answer}`).join('\n')}`
    : '';

  const system = `You generate practice quiz questions for a student. Return ONLY a single JSON object — no prose, no code fences, no markdown wrapping. The structure has keys "sections" (an object keyed by sIdx) and "cumulative" (an array). Each question object has keys: type ("regular" or "word"), q (the question text), answer (concise correct answer), solution (one short sentence explaining how to get it).`;

  const user = `Course: ${courseTitle}
Topic/Book: ${book.title}

I need additional questions for several sections of this book and (optionally) for the cumulative test.

${sectionsBlock}${cumBlock}

For each section: generate the requested number of NEW practice questions at the same difficulty level as the existing ones. Roughly 60% "regular" problems and 40% "word" problems per section.

Cumulative questions (if requested): mix questions that span ALL the sub-sections, ~60% regular and ~40% word problems.

Rules:
- Math: use LaTeX with \\( ... \\) for inline math. Keep answers concise and checkable.
- English: keep answers short and checkable (a word, a phrase, "True/False", or a brief sample sentence).
- Avoid copy-pasting existing questions — vary numbers, names, scenarios.
- Every question must have a single, clearly correct answer.

Output EXACTLY this JSON shape (no extra keys, no prose):
{
  "sections": {
    "<sIdx>": [{"type":"regular","q":"...","answer":"...","solution":"..."}, ...],
    "<sIdx>": [...]
  },
  "cumulative": [{"type":"word","q":"...","answer":"...","solution":"..."}, ...]
}

If no cumulative was requested, omit the "cumulative" key or set it to []. Return ONLY the JSON object.`;

  return { system, user };
}

function sanitizeQ(q) {
  if (!q || !q.q || !q.answer) return null;
  return {
    type: q.type === 'word' ? 'word' : 'regular',
    q: String(q.q),
    answer: String(q.answer),
    solution: String(q.solution || '')
  };
}

// ---------- Generate for a whole book with retries ----------
async function generateBook(courseTitle, book, sectionsNeeding, cumNeed, attempt = 1) {
  const prompt = buildBookPrompt(courseTitle, book, sectionsNeeding, cumNeed);

  // Budget: ~80 tokens per question + 500 overhead
  const totalQs = sectionsNeeding.reduce((s, x) => s + x.need, 0) + cumNeed;
  const maxTokens = Math.min(16000, Math.max(2000, totalQs * 110 + 500));

  try {
    const text = await callAPI({
      model: MODEL,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      max_tokens: maxTokens,
      temperature: 0.6
    });
    // Try to find a JSON object
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON object in response');
    const parsed = JSON.parse(match[0]);
    const out = { sections: {}, cumulative: [] };
    if (parsed.sections && typeof parsed.sections === 'object') {
      for (const [sIdx, arr] of Object.entries(parsed.sections)) {
        if (!Array.isArray(arr)) continue;
        out.sections[sIdx] = arr.map(sanitizeQ).filter(Boolean);
      }
    }
    if (Array.isArray(parsed.cumulative)) {
      out.cumulative = parsed.cumulative.map(sanitizeQ).filter(Boolean);
    }
    return out;
  } catch (e) {
    if (attempt < 6) {
      let wait;
      if (e.status === 429) wait = (e.retryAfter || 60) * 1000 + Math.random() * 5000;
      else wait = attempt * 3000;
      await new Promise(r => setTimeout(r, wait));
      return generateBook(courseTitle, book, sectionsNeeding, cumNeed, attempt + 1);
    }
    throw e;
  }
}

// ---------- Cache ----------
function loadCache() {
  try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { return {}; }
}
function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
}

// ---------- Build book tasks ----------
function buildBookTasks(courses, cache) {
  const tasks = [];
  for (const [courseId, course] of Object.entries(courses)) {
    course.books.forEach((book) => {
      const sectionsNeeding = [];
      book.sections.forEach((sec, sIdx) => {
        const key = `${courseId}|${book.id}|s${sIdx}`;
        if (cache[key] && Array.isArray(cache[key])) return;  // already done
        const need = TARGET_PER_SECTION - (sec.questions || []).length;
        if (need > 0) sectionsNeeding.push({ sIdx, sec, need });
      });
      let cumNeed = 0;
      const cumKey = `${courseId}|${book.id}|cum`;
      if (book.cumulativeTest && !(cache[cumKey] && Array.isArray(cache[cumKey]))) {
        cumNeed = TARGET_PER_CUMULATIVE - (book.cumulativeTest.questions || []).length;
        if (cumNeed < 0) cumNeed = 0;
      }
      if (sectionsNeeding.length === 0 && cumNeed === 0) return;
      tasks.push({
        courseId, courseTitle: course.title,
        bookId: book.id, book,
        sectionsNeeding, cumNeed
      });
    });
  }
  return tasks;
}

// ---------- Concurrent runner ----------
async function runConcurrent(tasks, cache) {
  let done = 0;
  let active = 0;
  let cursor = 0;
  const total = tasks.length;
  const t0 = Date.now();

  return new Promise((resolve) => {
    function next() {
      if (cursor >= total && active === 0) return resolve();
      while (active < CONCURRENCY && cursor < total) {
        const task = tasks[cursor++];
        active++;
        runTask(task).then(() => {
          active--;
          done++;
          const elapsed = ((Date.now() - t0) / 1000).toFixed(0);
          const pct = ((done/total)*100).toFixed(1);
          process.stdout.write(`\r[book ${done}/${total}] ${pct}%  ${elapsed}s elapsed  active=${active}    `);
          saveCache(cache);
          next();
        });
      }
    }

    async function runTask(task) {
      try {
        const result = await generateBook(task.courseTitle, task.book, task.sectionsNeeding, task.cumNeed);
        // Distribute into per-section / cumulative cache entries
        for (const { sIdx } of task.sectionsNeeding) {
          const key = `${task.courseId}|${task.bookId}|s${sIdx}`;
          const qs = result.sections[String(sIdx)] || result.sections[sIdx] || [];
          if (qs.length > 0) cache[key] = qs;
          else cache[key] = { error: 'no questions returned for this section' };
        }
        if (task.cumNeed > 0) {
          const cumKey = `${task.courseId}|${task.bookId}|cum`;
          if (result.cumulative.length > 0) cache[cumKey] = result.cumulative;
          else cache[cumKey] = { error: 'no cumulative questions returned' };
        }
      } catch (e) {
        // Mark all targets in this book as errored
        for (const { sIdx } of task.sectionsNeeding) {
          cache[`${task.courseId}|${task.bookId}|s${sIdx}`] = { error: e.message };
        }
        if (task.cumNeed > 0) cache[`${task.courseId}|${task.bookId}|cum`] = { error: e.message };
      }
    }

    next();
  });
}

// ---------- Emit expansions.js ----------
function emit(cache, courses) {
  const lines = [
    '// AUTO-GENERATED by tools/expand-quizzes.js — do not edit by hand.',
    '// Loaded AFTER extras.js. Pushes additional questions into existing sections + cumulative tests.',
    '',
    '(function() {',
    '  if (typeof COURSES === "undefined") { console.error("expansions.js: COURSES not loaded"); return; }',
    '  function add(courseId, bookId, sIdx, qs) {',
    '    const c = COURSES[courseId]; if (!c) return;',
    '    const b = c.books.find(x => x.id === bookId); if (!b) return;',
    '    const s = b.sections[sIdx]; if (!s) return;',
    '    s.questions.push(...qs);',
    '  }',
    '  function addCum(courseId, bookId, qs) {',
    '    const c = COURSES[courseId]; if (!c) return;',
    '    const b = c.books.find(x => x.id === bookId); if (!b || !b.cumulativeTest) return;',
    '    b.cumulativeTest.questions.push(...qs);',
    '  }',
    ''
  ];

  let secOK = 0, cumOK = 0, totalNew = 0, errCount = 0;
  for (const [courseId, course] of Object.entries(courses)) {
    course.books.forEach((book) => {
      book.sections.forEach((sec, sIdx) => {
        const key = `${courseId}|${book.id}|s${sIdx}`;
        const r = cache[key];
        if (!r) return;
        if (r.error) { errCount++; return; }
        if (!Array.isArray(r) || r.length === 0) return;
        secOK++;
        totalNew += r.length;
        lines.push(`  add(${JSON.stringify(courseId)}, ${JSON.stringify(book.id)}, ${sIdx}, ${JSON.stringify(r)});`);
      });
      if (book.cumulativeTest) {
        const r = cache[`${courseId}|${book.id}|cum`];
        if (!r) return;
        if (r.error) { errCount++; return; }
        if (!Array.isArray(r) || r.length === 0) return;
        cumOK++;
        totalNew += r.length;
        lines.push(`  addCum(${JSON.stringify(courseId)}, ${JSON.stringify(book.id)}, ${JSON.stringify(r)});`);
      }
    });
  }
  lines.push('})();');
  fs.writeFileSync(OUT_PATH, lines.join('\n') + '\n');
  console.log(`\n\nWrote ${OUT_PATH}`);
  console.log(`  Sections expanded: ${secOK}`);
  console.log(`  Cumulative tests expanded: ${cumOK}`);
  console.log(`  Total new questions: ${totalNew}`);
  if (errCount) console.log(`  Errored entries (rerun to retry): ${errCount}`);
}

// ---------- Main ----------
(async () => {
  console.log('Loading courses...');
  const courses = loadCourses();

  console.log('Building book-level tasks...');
  const cache = loadCache();
  const tasks = buildBookTasks(courses, cache);

  // Stats
  let totalSecGen = 0, totalCumGen = 0;
  for (const t of tasks) {
    totalSecGen += t.sectionsNeeding.reduce((s,x)=>s+x.need,0);
    totalCumGen += t.cumNeed;
  }
  console.log(`Book tasks: ${tasks.length}`);
  console.log(`Will generate ~${totalSecGen} section questions + ~${totalCumGen} cumulative = ~${totalSecGen + totalCumGen} new questions`);
  console.log(`Model: ${MODEL}   Concurrency: ${CONCURRENCY}\n`);

  if (tasks.length > 0) await runConcurrent(tasks, cache);
  saveCache(cache);
  emit(cache, courses);
})();
