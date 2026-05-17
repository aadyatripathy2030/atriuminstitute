// Walks every (course, book, section) and pre-generates the "Learn"
// mini-lesson into the cached_lessons table. Skips any (course, book,
// section) that already has a cached lesson, so the script is resumable
// — re-run it any time to fill in newly added sections without
// re-paying for the existing ones.
//
// Run:
//   $env:DATABASE_URL = "external-render-postgres-url"
//   $env:ANTHROPIC_API_KEY = "sk-ant-..."
//   node tools/prebuild-lessons.js
//
// Env knobs:
//   CONCURRENCY=3   How many sections to generate in parallel.
//   ONLY_COURSE=algebra  Only do one course (handy for testing).
//   FORCE=1         Regenerate every section, even cached ones.
//   DRY=1           Print the plan but don't call the API or write to DB.

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Aborting.');
  process.exit(1);
}
const API_KEY = process.env.ANTHROPIC_API_KEY
  || (fs.existsSync(path.resolve(__dirname, '..', '.apikey')) && fs.readFileSync(path.resolve(__dirname, '..', '.apikey'), 'utf8').trim());
if (!API_KEY && !process.env.DRY) {
  console.error('ANTHROPIC_API_KEY is not set (or .apikey file is missing). Aborting.');
  process.exit(1);
}

const CONCURRENCY = parseInt(process.env.CONCURRENCY, 10) || 3;
const ONLY_COURSE = process.env.ONLY_COURSE || null;
const FORCE = process.env.FORCE === '1';
const DRY = process.env.DRY === '1';
const MODEL = 'claude-sonnet-4-5-20250929';

const ROOT = path.resolve(__dirname, '..');
const db = require('../db-postgres');
const prompts = require('../prompts');

// Load all curriculum data files into a sandbox so we can read COURSES /
// books / sections without booting the full server.
function loadCourses() {
  const sandbox = { console, Object, Array };
  vm.createContext(sandbox);
  const files = fs.readdirSync(ROOT)
    .filter(f => f.endsWith('-data.js') || ['courses.js', 'extras.js', 'english-extras.js'].includes(f));
  // Order: per-course data first, then courses.js, then extras.
  const ordered = [
    ...files.filter(f => f.endsWith('-data.js')),
    'courses.js',
    'extras.js',
    'english-extras.js',
  ].filter(f => files.includes(f));
  for (const f of ordered) {
    let src = fs.readFileSync(path.join(ROOT, f), 'utf8');
    src = src.replace(/^(const|let)\s+([A-Z_][A-Z_0-9]*)\s*=/gm, 'this.$2 =');
    src = src.replace(/^(const|let)\s+COURSE\s*=/gm, 'this.COURSE =');
    src = src.replace(/^function\s+setCourse/gm, 'this.setCourse = function');
    src = src.replace(/^function\s+_addQ/gm, 'this._addQ = function');
    src = src.replace(/^function\s+_setCum/gm, 'this._setCum = function');
    src = src.replace(/^const\s+R\s*=/gm, 'this.R =');
    src = src.replace(/^const\s+W\s*=/gm, 'this.W =');
    try { vm.runInContext(src, sandbox, { filename: f }); }
    catch (e) { console.warn(`could not load ${f}: ${e.message}`); }
  }
  return sandbox.COURSES;
}

function callClaude(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      method: 'POST', hostname: 'api.anthropic.com', path: '/v1/messages',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
        }
        try {
          const parsed = JSON.parse(data);
          const text = (parsed.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n');
          resolve({ text, usage: parsed.usage });
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Same conservative SVG sanitizer the server uses.
function sanitize(content) {
  if (typeof content !== 'string') return '';
  let out = content;
  out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
  out = out.replace(/\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  out = out.replace(/(?:href|xlink:href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*'|"data:text\/html[^"]*"|'data:text\/html[^']*')/gi, '');
  out = out.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
  out = out.replace(/<(iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
  out = out.replace(/<(iframe|object|embed)[^>]*\/?>/gi, '');
  return out;
}

async function generateOne({ courseTitle, bookTitle, sectionTitle, sectionKind, sampleQuestions }) {
  const seedLines = (sampleQuestions || []).slice(0, 6)
    .map((q, i) => `${i + 1}. (${q.type || 'regular'}) ${q.q} → ${q.answer}`).join('\n');
  const userMsg = `Course: ${courseTitle}
Topic / chapter: ${bookTitle}
Section title: ${sectionTitle}
Section kind: ${sectionKind || 'section'}

Sample seed questions for this section (use to calibrate difficulty + style):
${seedLines || '(no seed questions)'}

Write the lesson now, following the headings and rules in the system prompt exactly.`;

  const system = prompts.buildSystem('lesson');
  const result = await callClaude({
    model: MODEL,
    system,
    messages: [{ role: 'user', content: userMsg }],
    max_tokens: 1500,
    temperature: 0.5,
  });
  return { content: sanitize(result.text), usage: result.usage };
}

function collectJobs(COURSES) {
  const jobs = [];
  for (const [courseId, course] of Object.entries(COURSES)) {
    if (ONLY_COURSE && courseId !== ONLY_COURSE) continue;
    for (const book of (course.books || [])) {
      (book.sections || []).forEach((section, sectionIdx) => {
        jobs.push({
          courseId, bookId: book.id, sectionIdx, sectionKind: 'section',
          courseTitle: course.title, bookTitle: book.title,
          sectionTitle: section.title || `Section ${sectionIdx + 1}`,
          sampleQuestions: (section.questions || []).slice(0, 6),
        });
      });
      if (book.cumulativeTest) {
        jobs.push({
          courseId, bookId: book.id, sectionIdx: 0, sectionKind: 'cumulative',
          courseTitle: course.title, bookTitle: book.title,
          sectionTitle: `${book.title} — Cumulative test`,
          sampleQuestions: (book.cumulativeTest.questions || []).slice(0, 6),
        });
      }
    }
  }
  return jobs;
}

async function runJob(job, totals) {
  if (!FORCE) {
    const cached = await db.getCachedLesson(job.courseId, job.bookId, job.sectionIdx, job.sectionKind);
    if (cached) {
      totals.skipped++;
      console.log(`SKIP   ${job.courseId} / ${job.bookId} / s${job.sectionIdx} (${job.sectionKind}) — already cached`);
      return;
    }
  }
  if (DRY) {
    totals.dry++;
    console.log(`DRY    ${job.courseId} / ${job.bookId} / s${job.sectionIdx} (${job.sectionKind}) — ${job.sectionTitle}`);
    return;
  }
  try {
    const { content, usage } = await generateOne(job);
    await db.saveCachedLesson(job.courseId, job.bookId, job.sectionIdx, job.sectionKind, content, MODEL);
    totals.generated++;
    const tokens = usage ? `in ${usage.input_tokens || 0} / out ${usage.output_tokens || 0}` : '';
    console.log(`OK     ${job.courseId} / ${job.bookId} / s${job.sectionIdx} (${job.sectionKind}) — ${job.sectionTitle} [${tokens}]`);
  } catch (e) {
    totals.failed++;
    console.error(`FAIL   ${job.courseId} / ${job.bookId} / s${job.sectionIdx}: ${e.message}`);
  }
}

async function pool(jobs, n, totals) {
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= jobs.length) return;
      await runJob(jobs[idx], totals);
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
}

(async () => {
  console.log('Loading courses...');
  const COURSES = loadCourses();
  if (!COURSES) { console.error('Could not load COURSES.'); process.exit(1); }
  const jobs = collectJobs(COURSES);
  console.log(`Collected ${jobs.length} jobs across ${Object.keys(COURSES).length} courses.`);
  console.log(`Mode: ${DRY ? 'DRY-RUN' : 'WRITE'}, concurrency=${CONCURRENCY}, force=${FORCE}${ONLY_COURSE ? `, only=${ONLY_COURSE}` : ''}`);
  const totals = { generated: 0, skipped: 0, failed: 0, dry: 0 };
  const t0 = Date.now();
  await pool(jobs, CONCURRENCY, totals);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\nDone in ${secs}s. generated=${totals.generated}, skipped=${totals.skipped}, failed=${totals.failed}, dry=${totals.dry}`);
  await db._pool.end();
})();
