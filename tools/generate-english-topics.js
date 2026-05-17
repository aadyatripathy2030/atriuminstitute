// Generates new English topics (books) for each English grade.
// Each new topic: title, subtitle, emoji, accents, 3 sub-section quizzes
// (seed questions only — expand-quizzes.js fills them out to 20 each).
//
// Output: ../english-extras.js (loaded after extras.js, before expansions.js).
// Resumable via tools/.english-topics-cache.json.
//
// Run:   cd course-site && node tools/generate-english-topics.js
// Env:   ANTHROPIC_API_KEY (or ./.apikey)
//        TOPICS_PER_GRADE=5  MODEL=claude-haiku-4-5-20251001  CONCURRENCY=2

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const https = require('https');

const ROOT = path.resolve(__dirname, '..');
const CACHE_PATH = path.join(__dirname, '.english-topics-cache.json');
const OUT_PATH = path.join(ROOT, 'english-extras.js');

const TOPICS_PER_GRADE = +process.env.TOPICS_PER_GRADE || 5;
const CONCURRENCY = +process.env.CONCURRENCY || 2;
const MODEL = process.env.MODEL || 'claude-haiku-4-5-20251001';

const API_KEY = process.env.ANTHROPIC_API_KEY
  || (fs.existsSync(path.join(ROOT, '.apikey')) && fs.readFileSync(path.join(ROOT, '.apikey'), 'utf8').trim())
  || (fs.existsSync(path.join(process.env.HOME || '', '.anthropic_api_key')) && fs.readFileSync(path.join(process.env.HOME, '.anthropic_api_key'), 'utf8').trim());

if (!API_KEY) { console.error('No API key.'); process.exit(1); }

// ---------- Load courses ----------
function loadCourses() {
  const sandbox = { console, Object, Array };
  vm.createContext(sandbox);
  for (const f of [
    'prealgebra-data.js','algebra-data.js','algebra2-data.js','geometry-data.js',
    'precalc-data.js','calculus-data.js','english-data.js','english-hs-data.js',
    'courses.js','extras.js'
  ]) {
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

// ---------- API ----------
function callAPI(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request({
      method: 'POST', hostname: 'api.anthropic.com', path: '/v1/messages',
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
            const err = new Error(`429 retry-after=${retryAfter}s`);
            err.retryAfter = retryAfter; err.status = 429;
            return reject(err);
          }
          const parsed = JSON.parse(data);
          if (res.statusCode !== 200) return reject(new Error(`API ${res.statusCode}: ${parsed.error?.message || data.slice(0,200)}`));
          resolve(parsed.content?.[0]?.text || '');
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

const ENGLISH_GRADES = {
  eng6: { grade: 6, name: 'Grade 6 English' },
  eng7: { grade: 7, name: 'Grade 7 English' },
  eng8: { grade: 8, name: 'Grade 8 English' },
  eng9: { grade: 9, name: 'Grade 9 English' },
  eng10: { grade: 10, name: 'Grade 10 English' },
  eng11: { grade: 11, name: 'Grade 11 English' },
  eng12: { grade: 12, name: 'Grade 12 English' }
};

const EMOJIS = ['📖','✍️','📝','🎭','📜','🔤','💬','📚','🪶','📰','🎨','📕','📗','📘','📙'];
const ACCENTS = [
  ['#ff6b9d','#feca57'],['#48dbfb','#ff9ff3'],['#1dd1a1','#feca57'],['#5f27cd','#48dbfb'],
  ['#ff9f43','#ee5253'],['#0abde3','#54a0ff'],['#10ac84','#feca57'],['#222f3e','#ff6b6b'],
  ['#ee5a6f','#f1c40f'],['#9b59b6','#3498db']
];

function buildPrompt(courseId, existingTitles) {
  const { grade, name } = ENGLISH_GRADES[courseId];
  return {
    system: `You design English Language Arts curriculum topics for middle and high school students. Return ONLY a JSON array — no prose, no code fences. Each topic object has the shape: {"title": str, "subtitle": str, "sections": [{"title": str, "questions": [3 seed questions]}, ...3 sections]}. Each seed question has keys: type ("regular" or "word"), q, answer, solution. Sections cover sub-skills within the topic.`,
    user: `Course: ${name} (US grade ${grade})
Existing topics already in this course (do NOT duplicate or overlap significantly):
${existingTitles.map(t => `- ${t}`).join('\n')}

Design ${TOPICS_PER_GRADE} NEW major topics for this grade level. Each topic should be a substantial unit of study (e.g., "Persuasive Writing & Rhetoric", "Greek & Latin Roots", "Short Story Analysis"). Match the academic rigor and developmental stage of US grade ${grade}.

For EACH topic, produce:
- "title": short topic name
- "subtitle": one-line description (under 80 chars)
- "sections": exactly 3 sub-section quiz titles, each with 3 SEED practice questions (mix of "regular" and "word" types)

Rules:
- Topics must NOT duplicate the existing topics listed above.
- Seed questions should be checkable with a short answer (a word, phrase, "True/False", a literary term, a corrected sentence, a brief sample).
- Each question has exactly one clearly-correct answer; the "solution" field is one short explanation sentence.
- Output ONLY the JSON array of ${TOPICS_PER_GRADE} topic objects.

Output format:
[
  {
    "title": "Topic Title",
    "subtitle": "Short description",
    "sections": [
      {
        "title": "Sub-section Title",
        "questions": [
          {"type":"regular","q":"...","answer":"...","solution":"..."},
          {"type":"regular","q":"...","answer":"...","solution":"..."},
          {"type":"word","q":"...","answer":"...","solution":"..."}
        ]
      },
      ... 3 sections total
    ]
  },
  ... ${TOPICS_PER_GRADE} topics total
]`
  };
}

function sanitize(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(t => t && t.title && Array.isArray(t.sections)).map(t => ({
    title: String(t.title),
    subtitle: String(t.subtitle || ''),
    sections: t.sections.filter(s => s && s.title && Array.isArray(s.questions)).map(s => ({
      title: String(s.title),
      questions: s.questions.filter(q => q && q.q && q.answer).map(q => ({
        type: q.type === 'word' ? 'word' : 'regular',
        q: String(q.q),
        answer: String(q.answer),
        solution: String(q.solution || '')
      }))
    })).filter(s => s.questions.length > 0)
  })).filter(t => t.sections.length > 0);
}

async function generateForGrade(courseId, existingTitles, attempt = 1) {
  const prompt = buildPrompt(courseId, existingTitles);
  try {
    const text = await callAPI({
      model: MODEL,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user }],
      max_tokens: 8000,
      temperature: 0.5
    });
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) throw new Error('no JSON array');
    return sanitize(JSON.parse(match[0]));
  } catch (e) {
    if (attempt < 6) {
      let wait = e.status === 429 ? (e.retryAfter || 60) * 1000 + Math.random()*5000 : attempt * 3000;
      await new Promise(r => setTimeout(r, wait));
      return generateForGrade(courseId, existingTitles, attempt + 1);
    }
    throw e;
  }
}

function loadCache() { try { return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')); } catch { return {}; } }
function saveCache(c) { fs.writeFileSync(CACHE_PATH, JSON.stringify(c)); }

function emit(cache, _courses) {
  const lines = [
    '// AUTO-GENERATED by tools/generate-english-topics.js — do not edit by hand.',
    '// Loaded AFTER extras.js, BEFORE expansions.js. Pushes new books into English courses.',
    '',
    '(function() {',
    '  if (typeof COURSES === "undefined") { console.error("english-extras.js: COURSES not loaded"); return; }',
    '  const EMOJIS = ' + JSON.stringify(EMOJIS) + ';',
    '  const ACCENTS = ' + JSON.stringify(ACCENTS) + ';',
    '  function addBooks(courseId, topics) {',
    '    const c = COURSES[courseId]; if (!c) return;',
    '    const startNum = c.books.length + 1;',
    '    topics.forEach((t, i) => {',
    '      const idx = c.books.length;',
    '      const accent = ACCENTS[idx % ACCENTS.length];',
    '      c.books.push({',
    '        id: "x" + (startNum + i),',
    '        num: startNum + i,',
    '        title: t.title,',
    '        subtitle: t.subtitle,',
    '        emoji: EMOJIS[idx % EMOJIS.length],',
    '        accent: accent[0],',
    '        accent2: accent[1],',
    '        sections: t.sections,',
    '        cumulativeTest: { title: "Cumulative Test — " + t.title, questions: [] }',
    '      });',
    '    });',
    '  }',
    ''
  ];
  let totalT = 0, totalS = 0, totalQ = 0;
  for (const courseId of Object.keys(ENGLISH_GRADES)) {
    const r = cache[courseId];
    if (!r || !Array.isArray(r) || r.length === 0) continue;
    totalT += r.length;
    for (const t of r) { totalS += t.sections.length; for (const s of t.sections) totalQ += s.questions.length; }
    lines.push(`  addBooks(${JSON.stringify(courseId)}, ${JSON.stringify(r)});`);
  }
  lines.push('})();');
  fs.writeFileSync(OUT_PATH, lines.join('\n') + '\n');
  console.log(`\nWrote ${OUT_PATH}`);
  console.log(`  New topics: ${totalT}`);
  console.log(`  New sections (quizzes): ${totalS}`);
  console.log(`  Seed questions: ${totalQ} (expand-quizzes.js will grow these to 20 each)`);
}

(async () => {
  console.log('Loading courses...');
  const courses = loadCourses();
  const cache = loadCache();
  const courseIds = Object.keys(ENGLISH_GRADES).filter(id => !cache[id]);
  console.log(`English grades to process: ${courseIds.length} (target ${TOPICS_PER_GRADE} new topics each)`);
  console.log(`Model: ${MODEL}  Concurrency: ${CONCURRENCY}\n`);

  let done = 0, active = 0, cursor = 0;
  const total = courseIds.length;
  const t0 = Date.now();

  await new Promise(resolve => {
    function next() {
      if (cursor >= total && active === 0) return resolve();
      while (active < CONCURRENCY && cursor < total) {
        const courseId = courseIds[cursor++];
        active++;
        const existing = courses[courseId].books.map(b => b.title);
        generateForGrade(courseId, existing).then(topics => {
          cache[courseId] = topics;
          saveCache(cache);
        }).catch(e => {
          console.error(`\n${courseId} failed:`, e.message);
          cache[courseId] = { error: e.message };
          saveCache(cache);
        }).finally(() => {
          active--; done++;
          const elapsed = ((Date.now() - t0)/1000).toFixed(0);
          process.stdout.write(`\r[${done}/${total}] ${elapsed}s elapsed  active=${active}    `);
          next();
        });
      }
    }
    next();
  });

  emit(cache, courses);
})();
