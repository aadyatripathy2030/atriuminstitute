const STORAGE_KEY = 'mathcourse_scores_v2';
const PROFILE_KEY = 'mathcourse_profile_v1';
const EXTRA_SECTIONS_KEY = 'mathcourse_extra_sections_v1';
const EXTRA_CUM_KEY = 'mathcourse_extra_cum_v1';
const TARGET_SECTIONS_PER_TOPIC = 15;
const TARGET_CUMULATIVE_QUESTIONS = 30;

function loadExtraSecs() {
  try { return JSON.parse(localStorage.getItem(EXTRA_SECTIONS_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveExtraSecs(e) { localStorage.setItem(EXTRA_SECTIONS_KEY, JSON.stringify(e)); }
function secsKey(courseId, bookId) { return `${courseId}:${bookId}`; }

function loadExtraCum() {
  try { return JSON.parse(localStorage.getItem(EXTRA_CUM_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveExtraCum(e) { localStorage.setItem(EXTRA_CUM_KEY, JSON.stringify(e)); }

// Return a book with cached AI-generated extra sections appended.
function getAugmentedBook(book) {
  const all = loadExtraSecs();
  const cached = all[secsKey(COURSE.id, book.id)] || [];
  if (cached.length === 0) return book;
  return { ...book, sections: [...book.sections, ...cached] };
}

// Mutate the live COURSE book in place so subsequent reads see the new sections.
function mergeExtrasIntoLiveBook(book, newSections) {
  if (!newSections || newSections.length === 0) return;
  book.sections = [...book.sections, ...newSections];
}

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)); }
  catch (e) { return null; }
}
function saveProfile(p) { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
function clearProfile() { localStorage.removeItem(PROFILE_KEY); }

function loadScores() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveScores(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function sKey(bookId, sIdx) { return `${bookId}:${sIdx}`; }

// ================= LOCAL FALLBACK NORMALIZER =================
function normalizeAns(s) {
  if (s == null) return '';
  s = String(s).toLowerCase();
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\\\(|\\\)|\\\[|\\\]|\$/g, '');
  s = s.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
  s = s.replace(/\\pm/g, '+-').replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
  s = s.replace(/\\neq/g, '!=').replace(/\\leq/g, '<=').replace(/\\geq/g, '>=');
  s = s.replace(/\\infty/g, 'inf').replace(/\\pi/g, 'pi');
  s = s.replace(/\\overline\s*\{([^{}]*)\}/g, '$1');
  s = s.replace(/\\[a-z]+\s*/gi, '');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/±/g, '+-').replace(/×/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt');
  s = s.replace(/\bunits?\b|\bft\b|\bin\.?\b|\bcm\b|\bmph\b|\b°f?\b/g, '');
  s = s.replace(/\band\b|\bor\b/g, ',');
  s = s.replace(/[^\w\d/=+\-*.,()!<>]/g, ' ').replace(/\s+/g, '').replace(/\.$/, '');
  return s;
}
function extractNumbers(s) {
  return (s.match(/-?\d+(?:\.\d+)?(?:\/\d+)?/g) || []).map(n => {
    if (n.includes('/')) { const [a,b] = n.split('/').map(Number); return b===0 ? n : (a/b).toFixed(4); }
    return parseFloat(n).toFixed(4);
  });
}
function localCheck(user, correct) {
  if (!user || !user.trim()) return false;
  const u = normalizeAns(user), c = normalizeAns(correct);
  if (!u) return false;
  if (u === c) return true;
  const un = extractNumbers(u), cn = extractNumbers(c);
  if (cn.length > 0 && un.length === cn.length) {
    const a = un.slice().sort(), b = cn.slice().sort();
    if (a.every((n,i) => n === b[i])) return true;
  }
  const strip = x => x.replace(/[^a-z0-9]/g, '');
  const us = strip(u), cs = strip(c);
  if (us.length >= 2) {
    if (cs.includes(us) && us.length >= Math.min(cs.length * 0.5, 8)) return true;
    if (us.includes(cs) && cs.length >= 2) return true;
  }
  return false;
}

// ================= MARKDOWN (minimal) =================
function mdToHtml(md) {
  if (!md) return '';
  let h = md;
  // Code blocks first (skip latex in them is not a concern here)
  h = h.replace(/```([\s\S]*?)```/g, (_, c) => `<pre><code>${escapeHtml(c)}</code></pre>`);
  h = h.replace(/`([^`]+)`/g, (_, c) => `<code>${escapeHtml(c)}</code>`);
  // Headings
  h = h.replace(/^### (.+)$/gm, '<h4>$1</h4>');
  h = h.replace(/^## (.+)$/gm, '<h3>$1</h3>');
  h = h.replace(/^# (.+)$/gm, '<h2>$1</h2>');
  // Bold / italic
  h = h.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  h = h.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  // Ordered lists
  h = h.replace(/(?:^|\n)((?:\d+\.\s+.+(?:\n|$))+)/g, (m, blk) => {
    const items = blk.trim().split(/\n/).map(l => l.replace(/^\d+\.\s+/, '').trim());
    return '\n<ol>' + items.map(i => `<li>${i}</li>`).join('') + '</ol>';
  });
  // Unordered lists
  h = h.replace(/(?:^|\n)((?:[-*]\s+.+(?:\n|$))+)/g, (m, blk) => {
    const items = blk.trim().split(/\n/).map(l => l.replace(/^[-*]\s+/, '').trim());
    return '\n<ul>' + items.map(i => `<li>${i}</li>`).join('') + '</ul>';
  });
  // Paragraphs: split on blank lines
  h = h.split(/\n{2,}/).map(chunk => {
    if (/^\s*<(h\d|ul|ol|pre|blockquote)/.test(chunk)) return chunk;
    return `<p>${chunk.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');
  return h;
}
function escapeHtml(s) { return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }

// ================= RENDER HOME =================
function totalSectionsAcrossCourses() {
  let n = 0;
  Object.values(COURSES).forEach(c => c.books.forEach(b => {
    n += b.sections.length;
    if (b.cumulativeTest) n += 1;
  }));
  return n;
}
function passedAcrossCourses(scores) {
  return Object.values(scores).filter(x => x && x.passed).length;
}
function renderProgressPill() {
  const s = loadScores();
  const total = totalSectionsAcrossCourses();
  const passed = passedAcrossCourses(s);
  const pct = total ? Math.round(100 * passed / total) : 0;
  document.getElementById('progressPill').textContent = `${passed}/${total} quizzes passed · ${pct}%`;
}

function courseStats(courseId, scores) {
  const c = COURSES[courseId];
  // Pull in any cached extras so progress denominators match what the user sees.
  const extras = loadExtraSecs();
  let total = 0, passed = 0;
  c.books.forEach(b => {
    const key = secsKey(courseId, b.id);
    const extraCount = (extras[key] || []).length;
    const liveCount = b.sections.length + (b._extrasMerged ? 0 : extraCount);
    const effective = Math.max(liveCount, b.sections.length);
    for (let si = 0; si < effective; si++) {
      total++;
      if (scores[sKey(b.id, si)]?.passed) passed++;
    }
    if (b.cumulativeTest) {
      total++;
      if (scores[sKey(b.id, 'cum')]?.passed) passed++;
    }
  });
  return { passed, total };
}

let SUBJECT_FILTER = null; // 'math' | 'english' | 'all'

function renderCourses() {
  const scores = loadScores();
  const grid = document.getElementById('coursesGrid');
  if (!grid) return;

  // Pick subject filter: manual override, or from profile.
  const profile = loadProfile();
  if (!SUBJECT_FILTER || SUBJECT_FILTER === 'all') {
    const s = (profile?.subject || '').toLowerCase();
    SUBJECT_FILTER = s === 'english' ? 'english' : 'math';
  }

  // Render toggle
  const toggle = document.getElementById('subjectToggle');
  if (toggle) {
    toggle.innerHTML = ['math', 'english'].map(s => `
      <button class="subj-btn ${SUBJECT_FILTER === s ? 'active' : ''}" data-s="${s}">
        ${s === 'math' ? '🧮 Math' : '📚 English'}
      </button>
    `).join('');
    toggle.querySelectorAll('.subj-btn').forEach(b => {
      b.onclick = () => { SUBJECT_FILTER = b.dataset.s; renderCourses(); };
    });
  }

  grid.innerHTML = '';
  const filtered = Object.values(COURSES).filter(c => SUBJECT_FILTER === 'all' || c.subject === SUBJECT_FILTER);
  filtered.forEach(c => {
    const { passed, total } = courseStats(c.id, scores);
    const pct = total ? (100 * passed / total) : 0;
    const card = document.createElement('div');
    card.className = 'course-card';
    card.style.setProperty('--a1', c.accent);
    card.style.setProperty('--a2', c.accent2);
    card.innerHTML = `
      <div class="course-emoji">${c.emoji}</div>
      <div class="course-title">${c.title}</div>
      <div class="course-subtitle">${c.subtitle}</div>
      <div class="course-desc">${c.description}</div>
      <div class="course-meta">
        <span>${c.books.length} topics · ${total} quizzes</span>
        <span>${passed}/${total} passed</span>
      </div>
      <div class="book-progress-bar"><div style="width:${pct}%"></div></div>
      <div class="course-cta">Enter ${c.title} →</div>
    `;
    card.onclick = () => openCourse(c.id);
    grid.appendChild(card);
  });

  // Render AI recommendation card (non-blocking, only once per visit)
  maybeRenderRecommendation();
}

let _recShown = false;
async function maybeRenderRecommendation() {
  if (_recShown) return;
  _recShown = true;
  const profile = loadProfile();
  if (!profile?.name) return;
  const box = document.getElementById('recBox');
  if (!box) return;
  box.innerHTML = `
    <div class="rec-card">
      <div class="rec-avatar">🧙</div>
      <div class="rec-body">
        <div class="rec-name">Diego's suggestion for you, ${escapeHtml(profile.name)}</div>
        <div class="rec-text" id="recText"><div class="typing"><span></span><span></span><span></span></div></div>
      </div>
    </div>
  `;
  const out = document.getElementById('recText');
  let buf = '';
  const ctx = `Student name: ${profile.name}. Age: ${profile.age || 'unknown'}. Grade: ${profile.grade || 'unknown'}. Current class: ${profile.currentClass || 'unknown'}. Confidence: ${profile.confidence || 'unknown'}/5. Goal: ${profile.goal || 'unknown'}. Subject focus: ${profile.subject || 'unknown'}. Available courses: ${Object.values(COURSES).map(c => c.title).join(', ')}. Recommend 1-2 courses to start with and why, in 2-3 short sentences. Use their name. Be warm, not preachy.`;
  try {
    for await (const chunk of AI.streamChat([{ role: 'user', content: ctx }], '')) {
      buf += chunk;
      out.innerHTML = mdToHtml(buf);
    }
  } catch (e) {
    box.innerHTML = '';
  }
}

function openCourse(courseId) {
  setCourse(courseId);
  document.getElementById('courses-home').classList.add('hidden');
  document.getElementById('home').classList.remove('hidden');
  document.getElementById('detail').classList.add('hidden');

  const hdr = document.getElementById('courseHeader');
  hdr.innerHTML = `
    <button class="back-btn" onclick="goToCourses()">← All Courses</button>
    <div class="course-header-inner" style="--a1:${COURSE.accent};--a2:${COURSE.accent2}">
      <div class="course-emoji-big">${COURSE.emoji}</div>
      <div>
        <h1>${COURSE.title}</h1>
        <p>${COURSE.subtitle}</p>
      </div>
    </div>
  `;
  renderBooks();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToBooks() {
  document.getElementById('detail').classList.add('hidden');
  document.getElementById('home').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToCourses() {
  document.getElementById('home').classList.add('hidden');
  document.getElementById('detail').classList.add('hidden');
  document.getElementById('courses-home').classList.remove('hidden');
  renderCourses();
  renderProgressPill();
  CHAT_CONTEXT = null;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function bookStats(bookId, scores) {
  const book = COURSE.books.find(b => b.id === bookId);
  let passed = 0, total = book.sections.length;
  book.sections.forEach((_, si) => { if (scores[sKey(bookId, si)]?.passed) passed++; });
  if (book.cumulativeTest) {
    total++;
    if (scores[sKey(bookId, 'cum')]?.passed) passed++;
  }
  return { passed, total };
}

function renderBooks() {
  const scores = loadScores();
  const grid = document.getElementById('books');
  grid.innerHTML = '';
  COURSE.books.forEach(book => {
    const { passed, total } = bookStats(book.id, scores);
    const pct = total ? (100 * passed / total) : 0;
    const card = document.createElement('div');
    card.className = 'book-card';
    card.style.setProperty('--a1', book.accent);
    card.style.setProperty('--a2', book.accent2);
    card.innerHTML = `
      <div>
        <div class="book-emoji">${book.emoji}</div>
        <div class="book-title">${book.title}</div>
        <div class="book-subtitle">${book.subtitle}</div>
      </div>
      <div>
        <div class="book-meta"><span>${book.sections.length} quizzes</span><span>${passed}/${total} passed</span></div>
        <div class="book-progress-bar"><div style="width:${pct}%"></div></div>
      </div>
    `;
    card.onclick = () => openBook(book.id);
    grid.appendChild(card);
  });

  // Course-wide Final Exam card (covers every topic in the course).
  const finalQs = buildCourseFinalQuestions();
  if (finalQs.length > 0) {
    const finalScore = scores[sKey('__final__', 'cum')];
    const finalCard = document.createElement('div');
    finalCard.className = 'book-card final-card';
    finalCard.innerHTML = `
      <div>
        <div class="book-emoji">🏁</div>
        <div class="book-title">${COURSE.title} Final Exam</div>
        <div class="book-subtitle">A comprehensive test pulling questions from every topic in this course.</div>
      </div>
      <div>
        <div class="book-meta"><span>${finalQs.length} questions</span><span>${finalScore ? (finalScore.passed ? '✓ passed' : '✗ retake') : 'all topics'}</span></div>
        <div class="book-progress-bar"><div style="width:${finalScore?.passed ? 100 : 0}%"></div></div>
      </div>
    `;
    finalCard.onclick = () => startCourseFinal();
    grid.appendChild(finalCard);
  }
}

function buildCourseFinalQuestions(perBook = 3) {
  const out = [];
  COURSE.books.forEach(book => {
    if (!book.cumulativeTest || !book.cumulativeTest.questions.length) return;
    const pool = book.cumulativeTest.questions.slice();
    // Sample `perBook` questions without replacement.
    for (let i = 0; i < perBook && pool.length > 0; i++) {
      const j = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(j, 1)[0]);
    }
  });
  return out;
}

function startCourseFinal() {
  const questions = buildCourseFinalQuestions();
  if (!questions.length) return;
  const fakeBook = {
    id: '__final__',
    title: `${COURSE.title} Final`,
    accent: COURSE.accent,
    accent2: COURSE.accent2,
    sections: [],
    cumulativeTest: { title: `${COURSE.title} — Final Exam`, questions }
  };
  QUIZ = {
    book: fakeBook, sIdx: 'cum',
    section: { title: fakeBook.cumulativeTest.title, questions },
    idx: 0,
    answers: questions.map(() => ({ user: '', correct: null, aiNote: '' })),
    isCumulative: true
  };
  document.getElementById('home').classList.add('hidden');
  const detail = document.getElementById('detail');
  detail.classList.remove('hidden');
  detail.style.setProperty('--a1', fakeBook.accent);
  detail.style.setProperty('--a2', fakeBook.accent2);
  renderQuizQuestion();
}

function openBook(bookId) {
  const book = COURSE.books.find(b => b.id === bookId);
  const scores = loadScores();
  document.getElementById('home').classList.add('hidden');
  const detail = document.getElementById('detail');
  detail.classList.remove('hidden');
  detail.style.setProperty('--a1', book.accent);
  detail.style.setProperty('--a2', book.accent2);

  // Merge cached AI-generated extras into the live book on first view.
  const cached = loadExtraSecs()[secsKey(COURSE.id, book.id)] || [];
  if (cached.length > 0 && !book._extrasMerged) {
    book.sections = [...book.sections, ...cached];
    book._extrasMerged = true;
  }

  // Merge cached cumulative extras too.
  const cumCached = loadExtraCum()[secsKey(COURSE.id, book.id)] || [];
  if (book.cumulativeTest && cumCached.length > 0 && !book._cumExtrasMerged) {
    book.cumulativeTest.questions = [...book.cumulativeTest.questions, ...cumCached];
    book._cumExtrasMerged = true;
  }

  const genBanner = '';

  detail.innerHTML = `
    <button class="back-btn" onclick="backToBooks()">← All ${COURSE.title} Topics</button>
    <div class="detail-header" style="--a1:${book.accent};--a2:${book.accent2}">
      <h1>${book.emoji} ${book.title}</h1>
      <div class="subtitle">${book.subtitle}</div>
    </div>
    ${genBanner}
    <div id="sections"></div>
  `;

  const sectionsEl = detail.querySelector('#sections');

  book.sections.forEach((s, si) => {
    const score = scores[sKey(book.id, si)];
    const badge = score
      ? (score.passed
          ? `<span class="status-badge pass">✓ ${score.correct}/${score.total}</span>`
          : `<span class="status-badge fail">✗ ${score.correct}/${score.total}</span>`)
      : `<span class="status-badge new">New</span>`;

    const sCard = document.createElement('div');
    sCard.className = 'section-card';
    sCard.style.setProperty('--a1', book.accent);
    sCard.style.setProperty('--a2', book.accent2);
    sCard.innerHTML = `
      <div class="section-row">
        <div class="num">${si + 1}</div>
        <div class="title">${s.title}</div>
        ${badge}
        <button class="learn-btn">📖 Learn</button>
        <button class="start-btn">${score ? 'Retake' : 'Start Quiz'} →</button>
      </div>
      <div class="lesson-panel hidden"></div>
    `;
    sCard.querySelector('.start-btn').onclick = () => startQuiz(book.id, si);
    sCard.querySelector('.learn-btn').onclick = () => toggleLesson(sCard, book, s);
    sectionsEl.appendChild(sCard);
  });

  // Cumulative test card at the end
  if (book.cumulativeTest) {
    const ct = book.cumulativeTest;
    const cumScore = scores[sKey(book.id, 'cum')];
    const badge = cumScore
      ? (cumScore.passed
          ? `<span class="status-badge pass">✓ ${cumScore.correct}/${cumScore.total}</span>`
          : `<span class="status-badge fail">✗ ${cumScore.correct}/${cumScore.total}</span>`)
      : `<span class="status-badge final">FINAL</span>`;
    const cCard = document.createElement('div');
    cCard.className = 'section-card cumulative-card';
    cCard.style.setProperty('--a1', book.accent);
    cCard.style.setProperty('--a2', book.accent2);
    cCard.innerHTML = `
      <div class="section-row">
        <div class="num cum-star">★</div>
        <div class="title">${ct.title || 'Cumulative Test'}
          <div class="cum-sub">${ct.questions.length} questions covering this whole topic</div>
        </div>
        ${badge}
        <button class="start-btn cum-btn">${cumScore ? 'Retake' : 'Take Test'} →</button>
      </div>
    `;
    cCard.querySelector('.start-btn').onclick = () => startCumulative(book.id);
    sectionsEl.appendChild(cCard);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (window.MathJax) MathJax.typesetPromise([detail]);
}

async function ensureSectionsFor(book) {
  if (book._generating) return;
  const need = TARGET_SECTIONS_PER_TOPIC - book.sections.length;
  if (need <= 0) return;
  book._generating = true;

  const banner = document.getElementById('genBanner');

  try {
    const generated = await AI.generateSections(COURSE.title, book, need);
    if (!Array.isArray(generated) || generated.length === 0) {
      if (banner) banner.innerHTML = `<span class="ai-err-inline">✗ Generation failed. You can retake existing quizzes.</span>`;
      book._generating = false;
      return;
    }

    // Persist.
    const store = loadExtraSecs();
    const key = secsKey(COURSE.id, book.id);
    store[key] = [...(store[key] || []), ...generated];
    saveExtraSecs(store);

    // Merge into live book.
    book.sections = [...book.sections, ...generated];
    book._generating = false;

    // If still showing this book, re-render to include the new sections.
    const currentDetailHeader = document.querySelector('.detail-header h1');
    if (currentDetailHeader && currentDetailHeader.textContent.includes(book.title)) {
      // Save scroll position
      const y = window.scrollY;
      openBook(book.id);
      window.scrollTo({ top: y });
    }
  } catch (e) {
    console.warn('section generation failed:', e.message);
    if (banner) banner.innerHTML = `<span class="ai-err-inline">✗ ${escapeHtml(e.message)}</span>`;
    book._generating = false;
  }
}

async function ensureCumulativeFor(book) {
  if (!book.cumulativeTest || book._cumGenerating) return;
  const need = TARGET_CUMULATIVE_QUESTIONS - book.cumulativeTest.questions.length;
  if (need <= 0) return;
  book._cumGenerating = true;

  try {
    const generated = await AI.generateCumulativeQuestions(COURSE.title, book, need);
    if (!Array.isArray(generated) || generated.length === 0) {
      book._cumGenerating = false;
      return;
    }

    const store = loadExtraCum();
    const key = secsKey(COURSE.id, book.id);
    store[key] = [...(store[key] || []), ...generated];
    saveExtraCum(store);

    book.cumulativeTest.questions = [...book.cumulativeTest.questions, ...generated];
    book._cumGenerating = false;

    // Refresh the card's question-count label if still on this book.
    const cumSub = document.querySelector('.cumulative-card .cum-sub');
    if (cumSub) {
      cumSub.textContent = `${book.cumulativeTest.questions.length} questions covering this whole topic`;
    }
  } catch (e) {
    console.warn('cumulative generation failed:', e.message);
    book._cumGenerating = false;
  }
}

async function toggleLesson(card, book, section) {
  const panel = card.querySelector('.lesson-panel');
  const btn = card.querySelector('.learn-btn');
  if (!panel.classList.contains('hidden')) {
    panel.classList.add('hidden');
    btn.textContent = '📖 Learn';
    return;
  }
  panel.classList.remove('hidden');
  btn.textContent = '▲ Hide';

  // If we've already rendered, skip
  if (panel.dataset.loaded) return;
  panel.dataset.loaded = '1';

  const prewritten = section.lesson ? `<div class="lesson-written">${mdToHtml(section.lesson)}</div>` : '';
  panel.innerHTML = `
    ${prewritten}
    <div class="lesson-ai">
      <div class="lesson-ai-head">✨ Diego's lesson on <em>${section.title}</em></div>
      <div class="lesson-ai-body" id="lessonBody-${book.id}-${section.title.replace(/\W+/g,'')}">
        <div class="typing"><span></span><span></span><span></span></div>
      </div>
    </div>
  `;

  const body = panel.querySelector('.lesson-ai-body');
  const profile = loadProfile() || {};
  const studentLine = profile.name
    ? `Student: ${profile.name}, grade ${profile.grade || '?'}, confidence ${profile.confidence || '?'}/5, pace: ${profile.pace || '?'}.`
    : '';
  const prompt = `${studentLine}

Teach the student this section concisely as a mini-lesson they can read in under 90 seconds: **${section.title}** (from the ${book.title} topic in the ${COURSE.title} course).

Format:
- Start with the core idea in one sentence.
- Give 2-3 numbered steps or key ideas they need.
- Give one small worked example.
- End with a one-sentence "try the quiz when you're ready" nudge using their name.

Use Markdown (headings with ###, bold, lists) and LaTeX (\\( \\) / \\[ \\]) for any math. Keep it around 150-200 words.`;

  let buf = '';
  try {
    for await (const chunk of AI.streamChat([{ role: 'user', content: prompt }], '')) {
      buf += chunk;
      body.innerHTML = mdToHtml(buf);
      if (window.MathJax) MathJax.typesetPromise([body]);
    }
  } catch (e) {
    body.innerHTML = `<div class="ai-err">Lesson unavailable: ${escapeHtml(e.message)}.${section.lesson ? ' Use the written lesson above.' : ''}</div>`;
  }
}

function startCumulative(bookId) {
  const book = COURSE.books.find(b => b.id === bookId);
  const test = book.cumulativeTest;
  QUIZ = {
    book, sIdx: 'cum',
    section: { title: test.title || 'Cumulative Test', questions: test.questions },
    idx: 0,
    answers: test.questions.map(() => ({ user: '', correct: null, aiNote: '' })),
    isCumulative: true
  };
  renderQuizQuestion();
}

function goHome() {
  // "Home" now means the course picker.
  goToCourses();
}

// ================= QUIZ =================
let QUIZ = null;
let CHAT_CONTEXT = null;

function startQuiz(bookId, sIdx) {
  const book = COURSE.books.find(b => b.id === bookId);
  const section = book.sections[sIdx];
  QUIZ = {
    book, sIdx, section,
    idx: 0,
    answers: section.questions.map(() => ({ user: '', correct: null, aiNote: '' }))
  };
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const { book, section, idx, answers } = QUIZ;
  const q = section.questions[idx];
  const detail = document.getElementById('detail');
  detail.style.setProperty('--a1', book.accent);
  detail.style.setProperty('--a2', book.accent2);

  CHAT_CONTEXT = {
    topic: `${book.title} → ${section.title}`,
    question: q.q,
    correctAnswer: q.answer
  };

  detail.innerHTML = `
    <button class="back-btn" onclick="openBook('${book.id}')">← Back to ${book.title}</button>
    <div class="quiz-shell">
      <div class="quiz-top">
        <div class="quiz-meta">
          <div class="quiz-section-name">${section.title}</div>
          <div class="quiz-progress-text">Question ${idx + 1} of ${section.questions.length}</div>
        </div>
        <div class="quiz-progress-bar">
          <div style="width:${100 * idx / section.questions.length}%"></div>
        </div>
      </div>
      <div class="quiz-card">
        <div class="q-type ${q.type}">${q.type === 'word' ? '📘 Word Problem' : '📐 Problem'}</div>
        <div class="quiz-q">${q.q}</div>
        <label class="quiz-label">Your answer</label>
        <textarea class="quiz-input" id="qInput" rows="2" placeholder="Type your answer here…">${answers[idx].user || ''}</textarea>
        <div id="revealBox"></div>
        <div class="quiz-actions" id="quizActions">
          <button class="cta submit-btn" id="submitBtn">Submit Answer</button>
          <button class="q-btn ask-inline" onclick="openChat()">💬 Ask Diego</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('submitBtn').onclick = submitAnswer;
  const input = document.getElementById('qInput');
  input.focus();
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); submitAnswer(); }
  });

  if (window.MathJax) MathJax.typesetPromise([detail]);
}

async function submitAnswer() {
  const { section, idx, answers } = QUIZ;
  const q = section.questions[idx];
  const input = document.getElementById('qInput');
  const user = input.value.trim();
  answers[idx].user = user;
  input.disabled = true;

  const actions = document.getElementById('quizActions');
  actions.innerHTML = `<div class="grading-spinner"><div class="spinner"></div><span>Grading…</span></div>`;

  const reveal = document.getElementById('revealBox');
  reveal.innerHTML = '';

  let isCorrect = false;
  let aiNote = '';
  let usedAI = false;

  if (user) {
    try {
      const graded = await AI.gradeAnswer(q.q, user, q.answer);
      isCorrect = graded.correct;
      aiNote = graded.note || '';
      usedAI = true;
    } catch (e) {
      console.warn('AI grading failed, using local check:', e.message);
      isCorrect = localCheck(user, q.answer);
    }
  }

  answers[idx].correct = isCorrect;
  answers[idx].aiNote = aiNote;

  reveal.innerHTML = `
    <div class="reveal-block ${isCorrect ? 'good' : 'bad'}">
      <div class="verdict ${isCorrect ? 'good' : 'bad'}">
        ${isCorrect ? '✓ Correct!' : '✗ Not quite.'}
        ${usedAI ? '<span class="ai-tag">✨ AI-graded</span>' : ''}
      </div>
      <div class="reveal-row"><span class="lbl">Your answer</span><span class="val">${user || '<em>(blank)</em>'}</span></div>
      <div class="reveal-row"><span class="lbl">Correct answer</span><span class="val correct">${q.answer}</span></div>
      ${aiNote ? `<div class="ai-note">💡 ${aiNote}</div>` : ''}
      ${!isCorrect ? `<button class="override-btn" id="overrideBtn">I actually had it right — count it →</button>` : ''}
    </div>
  `;

  const isLast = idx === section.questions.length - 1;
  actions.innerHTML = `
    <button class="cta next-btn">${isLast ? 'Finish Test →' : 'Next Question →'}</button>
    <button class="q-btn ask-inline" onclick="openChat()">💬 Ask Diego</button>
  `;
  actions.querySelector('.next-btn').onclick = nextQuestion;

  const overrideBtn = document.getElementById('overrideBtn');
  if (overrideBtn) {
    overrideBtn.onclick = () => {
      answers[idx].correct = true;
      reveal.classList.remove('bad'); reveal.classList.add('good');
      const v = reveal.querySelector('.verdict');
      v.classList.remove('bad'); v.classList.add('good');
      v.innerHTML = '✓ Correct!';
      overrideBtn.remove();
    };
  }

  if (window.MathJax) MathJax.typesetPromise([reveal]);
}

function nextQuestion() {
  if (QUIZ.idx < QUIZ.section.questions.length - 1) {
    QUIZ.idx++;
    renderQuizQuestion();
  } else {
    finishQuiz();
  }
}

function finishQuiz() {
  const { book, sIdx, section, answers } = QUIZ;
  const correct = answers.filter(a => a.correct).length;
  const total = section.questions.length;
  const passed = correct / total >= 0.7;
  const scores = loadScores();
  scores[sKey(book.id, sIdx)] = { correct, total, passed, when: Date.now() };
  saveScores(scores);
  const missedIdx = answers.map((a, i) => a.correct ? -1 : i).filter(i => i >= 0);

  const detail = document.getElementById('detail');
  const pct = Math.round(100 * correct / total);
  const grade = pct >= 90 ? 'A' : pct >= 80 ? 'B' : pct >= 70 ? 'C' : pct >= 60 ? 'D' : 'F';

  detail.innerHTML = `
    <button class="back-btn" onclick="openBook('${book.id}')">← Back to ${book.title}</button>
    <div class="results-card ${passed ? 'pass' : 'fail'}">
      <div class="grade-big">${grade}</div>
      <div class="results-score">${correct} / ${total}</div>
      <div class="results-pct">${pct}% correct</div>
      <div class="results-title">${section.title}</div>
      <div class="results-msg">${passed ? '🎉 Nice work! You passed this quiz.' : '💪 Keep pushing — let\'s look at what you missed and fix it together.'}</div>
      <div class="results-actions">
        ${missedIdx.length ? `<button class="cta help-btn" id="helpBtn">Review my mistakes (${missedIdx.length})</button>` : ''}
        <button class="q-btn" onclick="startQuiz('${book.id}', ${sIdx})">Retake Quiz</button>
        <button class="q-btn" onclick="openBook('${book.id}')">Back to Sections</button>
      </div>
    </div>
  `;
  if (window.MathJax) MathJax.typesetPromise([detail]);
  renderProgressPill();
  if (missedIdx.length) {
    document.getElementById('helpBtn').onclick = () => openHelpPopup(missedIdx);
    setTimeout(() => openHelpPopup(missedIdx), 600);
  }
}

// ================= HELP POPUP =================
const FALLBACK_FIX = {
  concept: { headline: "Let's nail the concept.", steps: ["Read the walkthrough slowly.", "Reproduce each step on paper.", "Redo earlier sections if shaky."] },
  algebra: { headline: "An algebra slip.", steps: ["Watch signs when moving terms.", "Distribute into every term.", "\\((a+b)^2 = a^2+2ab+b^2\\).", "Write every step — don't skip."] },
  read: { headline: "Careful reading is half the battle.", steps: ["Underline what's given.", "Circle what's asked.", "Translate each sentence into math."] },
  blank: { headline: "Here's how to start.", steps: ["Name variables.", "Write one equation per condition.", "Pick the simplest method."] }
};

function openHelpPopup(missedIdx) {
  const { section, answers, book } = QUIZ;
  const modal = document.getElementById('modal');
  const backdrop = document.getElementById('modalBackdrop');
  modal.classList.remove('hidden');
  backdrop.classList.remove('hidden');

  let step = 0;
  const renderStep = () => {
    if (step >= missedIdx.length) {
      modal.innerHTML = `
        <button class="modal-close" onclick="closeModal()">✕</button>
        <div class="modal-content">
          <div class="tutor-avatar big">🧙‍♂️</div>
          <h2>You're ready for round two.</h2>
          <p class="tutor-text">You walked through every mistake. Retake the quiz and lock it in.</p>
          <div class="modal-actions">
            <button class="cta" onclick="closeModal(); startQuiz('${QUIZ.book.id}', ${QUIZ.sIdx})">Retake Quiz</button>
            <button class="q-btn" onclick="closeModal()">Close</button>
          </div>
        </div>
      `;
      if (window.MathJax) MathJax.typesetPromise([modal]);
      return;
    }

    const qi = missedIdx[step];
    const q = section.questions[qi];
    const user = answers[qi].user;

    modal.innerHTML = `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div class="modal-content">
        <div class="tutor-row">
          <div class="tutor-avatar">🧙‍♂️</div>
          <div>
            <div class="tutor-name">Diego, your tutor</div>
            <div class="tutor-sub">Reviewing mistake ${step + 1} of ${missedIdx.length}</div>
          </div>
        </div>
        <div class="modal-qblock"><div class="lbl">The question</div><div class="modal-q">${q.q}</div></div>
        <div class="modal-qblock two-col">
          <div><div class="lbl">You wrote</div><div class="modal-you">${user || '<em>(blank)</em>'}</div></div>
          <div><div class="lbl">Correct answer</div><div class="modal-correct">${q.answer}</div></div>
        </div>
        <div class="modal-step" id="modalStep">
          <div class="tutor-bubble">
            <p>In your own words, what do you think went wrong here?</p>
            <textarea id="whyInput" class="why-input" rows="3" placeholder="e.g. I forgot to flip the inequality when dividing by a negative, or I wasn't sure what the question was asking…"></textarea>
            <div class="why-actions">
              <button class="cta why-submit" id="whySubmitBtn">Tell me →</button>
              <button class="q-btn why-skip" id="whySkipBtn">Skip and show me</button>
            </div>
          </div>
        </div>
        <div class="modal-actions" id="modalActions"></div>
      </div>
    `;
    const input = document.getElementById('whyInput');
    input.focus();
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        document.getElementById('whySubmitBtn').click();
      }
    });
    document.getElementById('whySubmitBtn').onclick = () => {
      const reason = input.value.trim() || '(student did not describe)';
      showFix(reason, q, user);
    };
    document.getElementById('whySkipBtn').onclick = () => {
      showFix('(student skipped describing — go straight to the walkthrough)', q, user);
    };
    if (window.MathJax) MathJax.typesetPromise([modal]);
  };

  const showFix = async (why, q, user) => {
    const step_el = document.getElementById('modalStep');
    const topic = `${book.title} → ${section.title}`;

    step_el.innerHTML = `
      <div class="tutor-bubble ai-bubble">
        <div class="ai-tag-row">✨ Diego is thinking…</div>
        <div class="ai-output" id="aiOutput"><div class="typing"><span></span><span></span><span></span></div></div>
      </div>
    `;
    const out = document.getElementById('aiOutput');
    let buf = '';
    try {
      for await (const chunk of AI.streamExplainMistake(q.q, user, q.answer, why, topic)) {
        buf += chunk;
        out.innerHTML = mdToHtml(buf);
        if (window.MathJax) MathJax.typesetPromise([out]);
        out.scrollIntoView({ block: 'nearest' });
      }
      step_el.querySelector('.ai-tag-row').textContent = '✨ Personalized by Diego';
    } catch (e) {
      step_el.innerHTML = renderFallbackFix(q) + `<div class="ai-err">AI unavailable: ${e.message}. Showing offline guide.</div>`;
    }

    document.getElementById('modalActions').innerHTML = `
      <button class="cta next-help">Got it — next ✓</button>
      <button class="q-btn" onclick="closeModal(); openChat();">💬 Ask a follow-up</button>
    `;
    document.querySelector('.next-help').onclick = () => { step++; renderStep(); };
    if (window.MathJax) MathJax.typesetPromise([step_el]);
  };

  const renderFallbackFix = (q) => {
    return `
      <div class="tutor-bubble">
        <p><strong>Here's the walkthrough:</strong></p>
        <div class="fix-section">
          <div class="fix-heading">📖 The walkthrough</div>
          <div class="walkthrough">${q.solution}</div>
        </div>
        <div class="final-line"><span class="lbl">Final answer:</span> ${q.answer}</div>
      </div>
    `;
  };

  renderStep();
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  document.getElementById('modalBackdrop').classList.add('hidden');
}

// ================= CHAT =================
let CHAT_HISTORY = [];

function openChat() {
  document.getElementById('chat').classList.add('open');
  document.getElementById('chatInput').focus();
  if (CHAT_HISTORY.length === 0) {
    const p = loadProfile();
    const name = p?.name ? p.name : 'there';
    const ctxLine = CHAT_CONTEXT
      ? `Hi ${escapeHtml(name)}! You're working on **${CHAT_CONTEXT.topic}**. I can explain the concept or talk through the technique — but I can't just hand you the answer while you're taking the quiz. Ask away!`
      : `Hey ${escapeHtml(name)}! I'm Diego. Ask me anything about Algebra 2 — functions, quadratics, radicals, systems, whatever's on your mind.`;
    appendChat('assistant', ctxLine);
  }
}
function closeChat() { document.getElementById('chat').classList.remove('open'); }

function appendChat(role, text) {
  const log = document.getElementById('chatLog');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.innerHTML = role === 'assistant'
    ? `<div class="chat-avatar">🧙</div><div class="chat-bubble">${mdToHtml(text)}</div>`
    : `<div class="chat-bubble">${escapeHtml(text)}</div>`;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
  if (window.MathJax) MathJax.typesetPromise([div]);
  return div.querySelector('.chat-bubble');
}

async function sendChat() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  input.style.height = 'auto';
  appendChat('user', text);

  CHAT_HISTORY.push({ role: 'user', content: text });

  const bubble = appendChat('assistant', '');
  bubble.innerHTML = `<div class="typing"><span></span><span></span><span></span></div>`;

  const p = loadProfile() || {};
  const studentBlurb = p.name ? `Student profile: name=${p.name}, age=${p.age || '?'}, grade=${p.grade || '?'}, current class=${p.currentClass || '?'}, confidence=${p.confidence || '?'}/5, goal=${p.goal || '?'}, pace=${p.pace || '?'}, hardest topics=${(p.hardest || []).join(', ') || 'none listed'}` : '';

  const ctxBlurb = CHAT_CONTEXT
    ? `${studentBlurb}\n\nTopic: ${CHAT_CONTEXT.topic}\nCurrent question: ${CHAT_CONTEXT.question}\nCorrect answer: ${CHAT_CONTEXT.correctAnswer}`
    : studentBlurb;

  let buf = '';
  try {
    for await (const chunk of AI.streamChat(CHAT_HISTORY, ctxBlurb)) {
      buf += chunk;
      bubble.innerHTML = mdToHtml(buf);
      if (window.MathJax) MathJax.typesetPromise([bubble]);
      document.getElementById('chatLog').scrollTop = document.getElementById('chatLog').scrollHeight;
    }
    CHAT_HISTORY.push({ role: 'assistant', content: buf });
  } catch (e) {
    bubble.innerHTML = `<span class="ai-err">Error: ${e.message}</span>`;
  }
}

function clearChat() {
  CHAT_HISTORY = [];
  document.getElementById('chatLog').innerHTML = '';
  openChat();
}

// ================= ONBOARDING =================
const ONBOARD_QUESTIONS = [
  {
    id: 'name', kind: 'text', required: true,
    title: "First, what should we call you?",
    hint: "Just your first name is fine. We'll use it throughout.",
    placeholder: "e.g. Alex"
  },
  {
    id: 'subject', kind: 'choice', required: true,
    title: (p) => `Nice to meet you, ${p.name}. What are you here to study?`,
    hint: "This sets what shows up on your course picker. You can switch anytime.",
    options: ["Math", "English", "Both"]
  },
  {
    id: 'age', kind: 'choice',
    title: "What's your age range?",
    hint: "This helps us tune the tone and explanations.",
    options: ["Under 13", "13–14", "15–16", "17–18", "19+"]
  },
  {
    id: 'grade', kind: 'choice',
    title: "What grade are you in?",
    options: ["6th", "7th", "8th", "9th", "10th", "11th", "12th", "College", "Other"]
  },
  {
    id: 'currentClass', kind: 'choice',
    title: (p) => {
      const s = (p.subject || '').toLowerCase();
      if (s === 'english') return "Which English class are you in right now?";
      if (s === 'both') return "Which class are you in right now? (math or English, whatever fits)";
      return "Which math class are you in right now?";
    },
    options: (p) => {
      const s = (p.subject || '').toLowerCase();
      if (s === 'english') return ["6th Grade English", "7th Grade English", "8th Grade English", "9th Grade English", "10th Grade English", "AP Literature", "AP Language", "Other"];
      if (s === 'both') return ["Pre-Algebra", "Algebra 1", "Geometry", "Algebra 2", "Pre-Calculus", "Calculus", "6th Grade English", "7th Grade English", "8th Grade English", "Other"];
      return ["Pre-Algebra", "Algebra 1", "Geometry", "Algebra 2", "Pre-Calculus", "Calculus", "Other"];
    }
  },
  {
    id: 'confidence', kind: 'scale',
    title: (p) => {
      const s = (p.subject || '').toLowerCase();
      if (s === 'english') return "How confident do you feel in English?";
      if (s === 'both') return "How confident do you feel overall?";
      return "How confident do you feel in math?";
    },
    hint: "1 = shaky · 5 = solid",
    min: 1, max: 5
  },
  {
    id: 'hardest', kind: 'multi',
    title: "Which topics feel toughest right now?",
    hint: "Pick any that apply — you can also skip.",
    options: (p) => {
      const s = (p.subject || '').toLowerCase();
      const mathTopics = ["Functions", "Linear equations", "Quadratics", "Rational expressions", "Systems of equations", "Radicals", "Word problems"];
      const engTopics = ["Grammar", "Punctuation", "Vocabulary", "Reading comprehension", "Writing essays", "Poetry & literary analysis", "Figurative language"];
      if (s === 'english') return engTopics;
      if (s === 'both') return [...mathTopics, ...engTopics];
      return mathTopics;
    }
  },
  {
    id: 'goal', kind: 'choice',
    title: "Why are you here?",
    options: ["Homework help", "Preparing for a test", "Catching up on things I missed", "Getting ahead", "Just curious"]
  },
  {
    id: 'pace', kind: 'choice',
    title: "How do you like to learn?",
    options: ["Quick and to the point", "Moderate pace with examples", "Slow, thorough walk-throughs"]
  },
  {
    id: 'frequency', kind: 'choice',
    title: "How often do you think you'll practice?",
    options: ["Every day", "A few times a week", "About once a week", "Whenever I feel like it"]
  }
];

let ONBOARD = null;

function startOnboarding() {
  ONBOARD = { idx: 0, answers: {} };
  document.getElementById('home').classList.add('hidden');
  document.getElementById('detail').classList.add('hidden');
  document.getElementById('courses-home').classList.add('hidden');
  document.getElementById('onboard').classList.remove('hidden');
  document.getElementById('askFab').classList.add('hidden');
  renderOnboardStep();
}

function renderOnboardStep() {
  const { idx, answers } = ONBOARD;
  const q = ONBOARD_QUESTIONS[idx];
  const total = ONBOARD_QUESTIONS.length;
  const pct = (idx / total) * 100;
  const title = typeof q.title === 'function' ? q.title(answers) : q.title;
  const host = document.getElementById('onboard');

  host.innerHTML = `
    <div class="onboard-shell">
      <div class="onboard-top">
        <div class="logo-small">
          <div class="logo-dot">∑</div>
          <span>Atrium Math</span>
        </div>
        <button class="skip-btn" onclick="skipOnboarding()">Skip for now</button>
      </div>
      <div class="onboard-progress">
        <div class="onboard-progress-bar"><div style="width:${pct}%"></div></div>
        <div class="onboard-step-text">Step ${idx + 1} of ${total}</div>
      </div>
      <div class="onboard-card">
        <div class="onboard-q-label">Getting to know you</div>
        <h1 class="onboard-title">${title}</h1>
        ${q.hint ? `<p class="onboard-hint">${q.hint}</p>` : ''}
        <div id="onboardBody"></div>
      </div>
      <div class="onboard-actions">
        ${idx > 0 ? `<button class="q-btn" id="backStep">← Back</button>` : `<span></span>`}
        <button class="cta" id="nextStep">${idx === total - 1 ? 'Finish →' : 'Continue →'}</button>
      </div>
    </div>
  `;

  const body = document.getElementById('onboardBody');
  const current = answers[q.id];

  if (q.kind === 'text') {
    body.innerHTML = `<input type="text" class="onboard-input" id="onboardField" placeholder="${q.placeholder || ''}" value="${current || ''}" autocomplete="given-name" />`;
    const input = document.getElementById('onboardField');
    input.focus();
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commitOnboardStep(); }
    });
  } else if (q.kind === 'choice') {
    const opts = typeof q.options === 'function' ? q.options(answers) : q.options;
    body.innerHTML = `<div class="onboard-options">
      ${opts.map(o => `
        <button class="onboard-option ${current === o ? 'selected' : ''}" data-val="${o}">${o}</button>
      `).join('')}
    </div>`;
    body.querySelectorAll('.onboard-option').forEach(btn => {
      btn.onclick = () => {
        body.querySelectorAll('.onboard-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        answers[q.id] = btn.dataset.val;
      };
    });
  } else if (q.kind === 'multi') {
    const selected = current || [];
    const opts = typeof q.options === 'function' ? q.options(answers) : q.options;
    body.innerHTML = `<div class="onboard-options">
      ${opts.map(o => `
        <button class="onboard-option ${selected.includes(o) ? 'selected' : ''}" data-val="${o}">${o}</button>
      `).join('')}
    </div>`;
    body.querySelectorAll('.onboard-option').forEach(btn => {
      btn.onclick = () => {
        btn.classList.toggle('selected');
        const vals = Array.from(body.querySelectorAll('.onboard-option.selected')).map(b => b.dataset.val);
        answers[q.id] = vals;
      };
    });
  } else if (q.kind === 'scale') {
    const sel = current || 0;
    body.innerHTML = `<div class="onboard-scale">
      ${Array.from({length: q.max - q.min + 1}, (_, i) => {
        const v = q.min + i;
        return `<button class="scale-pt ${sel === v ? 'selected' : ''}" data-val="${v}">${v}</button>`;
      }).join('')}
    </div>`;
    body.querySelectorAll('.scale-pt').forEach(btn => {
      btn.onclick = () => {
        body.querySelectorAll('.scale-pt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        answers[q.id] = parseInt(btn.dataset.val);
      };
    });
  }

  document.getElementById('nextStep').onclick = commitOnboardStep;
  const back = document.getElementById('backStep');
  if (back) back.onclick = () => { ONBOARD.idx--; renderOnboardStep(); };
}

function commitOnboardStep() {
  const { idx, answers } = ONBOARD;
  const q = ONBOARD_QUESTIONS[idx];

  if (q.kind === 'text') {
    const val = document.getElementById('onboardField').value.trim();
    if (q.required && !val) {
      document.getElementById('onboardField').classList.add('error');
      document.getElementById('onboardField').focus();
      return;
    }
    answers[q.id] = val;
  }
  if (q.required && !answers[q.id] && q.kind !== 'multi') {
    alert('Pick an option to continue, or skip this onboarding.');
    return;
  }

  if (idx === ONBOARD_QUESTIONS.length - 1) {
    finishOnboarding();
  } else {
    ONBOARD.idx++;
    renderOnboardStep();
  }
}

function finishOnboarding() {
  const profile = { ...ONBOARD.answers, completedAt: Date.now() };
  saveProfile(profile);
  document.getElementById('onboard').classList.add('hidden');
  document.getElementById('askFab').classList.remove('hidden');
  goHome();
  showWelcome(profile);
}

function skipOnboarding() {
  saveProfile({ skipped: true, completedAt: Date.now() });
  document.getElementById('onboard').classList.add('hidden');
  document.getElementById('askFab').classList.remove('hidden');
  goHome();
}

function showWelcome(profile) {
  if (!profile.name) return;
  const toast = document.createElement('div');
  toast.className = 'welcome-toast';
  toast.innerHTML = `<span class="welcome-wave">👋</span> Welcome, <strong>${escapeHtml(profile.name)}</strong>! Let's get started.`;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}

function editProfile() {
  startOnboarding();
  // Preload existing answers
  const p = loadProfile();
  if (p) ONBOARD.answers = { ...p };
  renderOnboardStep();
}

function renderGreeting() {
  const p = loadProfile();
  const greet = document.getElementById('greeting');
  if (!greet) return;
  if (p && p.name) {
    greet.innerHTML = `Hi, <strong>${escapeHtml(p.name)}</strong>`;
    greet.classList.remove('hidden');
    greet.onclick = editProfile;
    greet.title = 'Click to update your profile';
  } else {
    greet.classList.add('hidden');
  }

  // Personalize hero
  const hero = document.querySelector('.hero h1');
  if (hero && p && p.name) {
    hero.innerHTML = `Welcome back, <em>${escapeHtml(p.name)}</em>.`;
  }
  const heroP = document.querySelector('.hero p');
  if (heroP && p && p.name) {
    heroP.textContent = `Pick a course, take a quiz, and I'll walk you through anything that trips you up.`;
  }
}

// ================= INIT =================
document.addEventListener('DOMContentLoaded', () => {
  const profile = loadProfile();
  if (!profile) {
    startOnboarding();
  } else {
    renderGreeting();
  }

  renderCourses();
  renderProgressPill();
  const sb = document.getElementById('startBtn');
  if (sb) sb.onclick = () => document.getElementById('coursesGrid').scrollIntoView({ behavior: 'smooth' });
  document.getElementById('askFab').onclick = () => openChat();
  document.getElementById('chatClose').onclick = closeChat;
  document.getElementById('chatClear').onclick = clearChat;
  const chatForm = document.getElementById('chatForm');
  chatForm.onsubmit = (e) => { e.preventDefault(); sendChat(); };
  const ci = document.getElementById('chatInput');
  ci.addEventListener('input', () => {
    ci.style.height = 'auto';
    ci.style.height = Math.min(ci.scrollHeight, 140) + 'px';
  });
  ci.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  });
});
