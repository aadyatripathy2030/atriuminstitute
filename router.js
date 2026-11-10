// Clean URLs for the single-page app.
//
// Everything a student can open has its own address:
//   /faq, /profile, /shop, /calculator ...          pages and tools
//   /courses/algebra                                 a course
//   /courses/algebra/b1                              a topic (book)
//   /courses/algebra/b1/3/lesson | quiz | study      a section's lesson, quiz, Study with Max
//   /courses/algebra/b1/test/quiz                    a topic's cumulative test
//   /curriculum/<course>  /curriculum/<course>/<unit>[/<n>/lesson|quiz|study]
//   /photo-atrium/scan  /photo-atrium/<id>  /sign-in  /sign-up  /pricing
//
// The URL follows whatever is on screen (watched with a MutationObserver,
// plus a few wrapped openers that record which book/section is open), so
// the navigation code elsewhere doesn't need to know about URLs. Opening
// an address directly shows that thing, and Back/Forward work.
//
// The server serves index.html for these paths (SPA_ROUTES and
// SPA_PREFIXES in server.js). Keep the lists in sync.
(function () {
  'use strict';

  const SITE = 'https://atriuminstitute.ai';
  const BASE_TITLE = document.title;

  // Full-screen pages: one view each.
  const PAGES = [
    { path: '/about',             view: 'about',                  open: 'showAbout',           auth: false, title: 'About' },
    { path: '/why-atrium',        view: 'whyAtrium',              open: 'showWhyAtrium',       auth: false, title: 'Why Atrium' },
    { path: '/faq',               view: 'faq',                    open: 'showFAQ',             auth: false, title: 'FAQ' },
    { path: '/contact',           view: 'contact',                open: 'showContact',         auth: false, title: 'Contact' },
    { path: '/privacy',           view: 'privacy',                open: 'showPrivacy',         auth: false, title: 'Privacy Policy' },
    { path: '/terms',             view: 'terms',                  open: 'showTerms',           auth: false, title: 'Terms of Use' },
    { path: '/courses',           view: 'courses-home',           open: 'goToCourses',         auth: true,  title: 'Courses' },
    { path: '/profile',           view: 'profilePage',            open: 'openProfile',         auth: true,  title: 'Profile' },
    { path: '/activity',          view: 'activityPage',           open: 'openActivity',        auth: true,  title: 'Activity' },
    { path: '/usage',             view: 'tokenUsagePage',         open: 'openTokenUsage',      auth: true,  title: 'Usage' },
    { path: '/favorites',         view: 'favoritesPage',          open: 'openFavorites',       auth: true,  title: 'Favorites' },
    { path: '/achievements',      view: 'achievementsPage',       open: 'openAchievements',    auth: true,  title: 'Achievements' },
    { path: '/leaderboard',       view: 'leaderboardPage',        open: 'openLeaderboard',     auth: true,  title: 'Leaderboard' },
    { path: '/curriculum',        view: 'curriculumPage',         open: 'openCurriculum',      auth: true,  title: 'Curriculum' },
    { path: '/photo-atrium',      view: 'photoAtriumListPage',    open: 'openPhotoAtriumList', auth: true,  title: 'Photo Atrium' },
    { path: '/photo-atrium/scan', view: 'photoAtriumScannerPage', open: 'openPhotoScanner',    auth: true,  title: 'Scan a problem' },
    { path: '/admin',             view: 'adminPage',              open: null,                  auth: true,  title: 'Admin' },
    { path: '/parent',            view: 'parentHome',             open: null,                  auth: true,  title: 'Parent dashboard' },
  ];

  // Pop-up tools that sit on top of whatever page is open.
  const TOOLS = [
    { path: '/shop',          view: 'shopOverlay',    open: 'openShop',          title: 'Shop' },
    { path: '/upgrade',       view: 'upgradeOverlay', open: 'openUpgradeModal',  title: 'Upgrade' },
    { path: '/calculator',    view: 'calcOverlay',    open: 'openCalculator',    title: 'Calculator' },
    { path: '/calendar',      view: 'calOverlay',     open: 'openStudyCalendar', title: 'Study calendar' },
    { path: '/certificates',  view: 'certOverlay',    open: 'openCertificates',  title: 'Certificates' },
    { path: '/essay-grader',  view: 'egOverlay',      open: 'openEssayGrader',   title: 'Essay grader' },
    { path: '/flashcards',    view: 'fcOverlay',      open: 'openFlashcards',    title: 'Flashcards' },
    { path: '/formulas',      view: 'fmOverlay',      open: 'openFormulaSheet',  title: 'Formula sheet' },
    { path: '/notebook',      view: 'nbOverlay',      open: 'openNotebook',      title: 'Notebook' },
    { path: '/learning-path', view: 'plOverlay',      open: 'openLearningPath',  title: 'Learning path' },
    { path: '/referral',      view: 'refOverlay',     open: 'openReferral',      title: 'Invite friends' },
    { path: '/sat-prep',      view: 'satOverlay',     open: 'openSatPrep',       title: 'SAT prep' },
  ];

  // Views whose show/hide should update the URL.
  const WATCH = [
    'landing', 'authGate', 'home', 'detail', 'study', 'modal', 'lessonModal',
    'currCourseDetail', 'photoAtriumResultPage',
  ].concat(PAGES.map(p => p.view), TOOLS.map(t => t.view));

  // What's open, recorded by the wrapped openers below.
  const st = { book: null, lesson: null, study: null, quiz: null, pricing: false };

  const initialPath = normalize(window.location.pathname);
  const initialSearch = window.location.search;
  let ready = false;     // false until auth.js has decided where to land
  let restoring = false; // true while opening a path, so we don't push history
  let pending = null;    // members-only path to open once the visitor signs in

  // ---------- helpers ----------
  function normalize(p) {
    if (!p) return '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p;
  }
  const enc = encodeURIComponent;
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  function vis(id) {
    const n = document.getElementById(id);
    return !!n && !n.classList.contains('hidden');
  }

  function fn(name) {
    const f = window[name];
    return typeof f === 'function' ? f : null;
  }

  async function call(name, ...args) {
    const f = fn(name);
    if (!f) return false;
    try { await f(...args); } catch (e) { console.warn('[router] ' + name + ' threw:', e && e.message); }
    return true;
  }

  function signedIn() {
    return typeof window.getCurrentUser === 'function' && !!window.getCurrentUser();
  }

  // Somewhere a members-only thing may open (not onboarding or the consent gate).
  function inApp() {
    if (!signedIn()) return false;
    return ['courses-home', 'home', 'detail', 'study', 'parentHome'].some(vis) ||
      PAGES.some(p => p.auth && vis(p.view)) || vis('photoAtriumResultPage');
  }

  /* global COURSES, COURSE, QUIZ */
  function courses() { return typeof COURSES !== 'undefined' ? COURSES : {}; }
  function course() { return typeof COURSE !== 'undefined' ? COURSE : null; }

  // ---------- where are we? ----------
  // Path of an open topic (book): a real course or a curriculum unit.
  function bookBase(bookId) {
    const c = course();
    if (!c || !bookId) return null;
    const book = (c.books || []).find(b => b.id === bookId);
    if (!book) return null;
    const m = /^curr:(.+):u(\d+)$/.exec(book.id);
    if (m) return { path: '/curriculum/' + enc(m[1]) + '/' + m[2], title: book.title || c.title, book };
    if (courses()[c.id] !== c) return null;
    return { path: '/courses/' + enc(c.id) + '/' + enc(book.id), title: book.title || c.title, book };
  }

  function sectionTitle(book, i) {
    const s = book && book.sections && book.sections[i];
    return s && s.title ? s.title : null;
  }

  function describe() {
    for (const t of TOOLS) if (vis(t.view)) return { path: t.path, title: t.title };

    // Quizzes render inside the topic view (#detail) until "Back to sections".
    if (vis('detail') && st.quiz) {
      const base = bookBase(st.quiz.bookId);
      if (base) {
        if (st.quiz.sIdx === 'cum') return { path: base.path + '/test/quiz', title: 'Test · ' + base.title };
        return { path: base.path + '/' + (st.quiz.sIdx + 1) + '/quiz', title: 'Quiz · ' + (sectionTitle(base.book, st.quiz.sIdx) || base.title) };
      }
    }
    if (vis('lessonModal') && st.lesson != null && st.lesson >= 0) {
      const base = bookBase(st.book);
      if (base) return { path: base.path + '/' + (st.lesson + 1) + '/lesson', title: sectionTitle(base.book, st.lesson) || base.title };
    }
    if (vis('study') && st.study != null && st.study >= 0) {
      const base = bookBase(st.book);
      if (base) return { path: base.path + '/' + (st.study + 1) + '/study', title: 'Study · ' + (sectionTitle(base.book, st.study) || base.title) };
    }
    if (vis('detail')) {
      const base = bookBase(st.book);
      return base ? { path: base.path, title: base.title } : null; // still loading
    }
    if (vis('home')) {
      const c = course();
      if (c && courses()[c.id] === c && !String(c.id).startsWith('curr:')) return { path: '/courses/' + enc(c.id), title: c.title };
      return null;
    }
    if (vis('curriculumPage') && vis('currCourseDetail') && window.__atriumCurrCourse) {
      return { path: '/curriculum/' + enc(window.__atriumCurrCourse), title: 'Curriculum' };
    }
    if (vis('photoAtriumResultPage') && window.__atriumPhotoId) {
      return { path: '/photo-atrium/' + enc(window.__atriumPhotoId), title: 'Photo Atrium' };
    }
    for (const p of PAGES) if (vis(p.view)) return { path: p.path, title: p.title };
    if (vis('authGate')) {
      return window.__atriumAuthMode === 'signup'
        ? { path: '/sign-up', title: 'Sign up' } : { path: '/sign-in', title: 'Sign in' };
    }
    if (vis('landing')) return st.pricing ? { path: '/pricing', title: 'Pricing' } : { path: '/', title: null };
    return null; // onboarding, the consent gate: no address of their own
  }

  function setMeta(d) {
    document.title = d && d.title ? d.title + ' · Atrium Institute' : BASE_TITLE;
    window.__atriumPageTitle = document.title; // study.js's timer restores this
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = SITE + (d ? d.path : '/');
  }

  function sync(replace) {
    if (!ready || restoring) return;
    if (!vis('detail')) st.quiz = null;
    if (!vis('landing')) st.pricing = false;
    if (pending && signedIn() && vis('courses-home')) {
      // Just signed in after asking for a members-only page: open it now.
      const want = pending; pending = null;
      navigate(want, true);
      return;
    }
    const d = describe();
    if (!d) return;
    setMeta(d);
    if (normalize(window.location.pathname) === d.path && !window.location.search) return;
    // Query strings only matter on the page that received them (Stripe returns, etc).
    if (normalize(window.location.pathname) === d.path) return;
    const url = d.path + window.location.hash;
    try {
      if (replace) history.replaceState({ path: d.path }, '', url);
      else history.pushState({ path: d.path }, '', url);
    } catch (e) { /* ignore */ }
  }

  // ---------- opening a path ----------
  function closeOverlays(keep) {
    for (const t of TOOLS) {
      if (t.path === keep) continue;
      const n = document.getElementById(t.view);
      if (n && !n.classList.contains('hidden')) n.classList.add('hidden');
    }
    if (vis('lessonModal') && !/\/lesson$/.test(keep)) call('closeLessonModal');
    if (vis('modal')) call('closeModal');
  }

  function hideAll() {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
  }

  async function sectionAction(book, sec, action) {
    if (!sec || !action) return true;
    if (sec === 'test') {
      if (action === 'quiz' && book.cumulativeTest) await call('startCumulative', book.id);
      return true;
    }
    const i = parseInt(sec, 10) - 1;
    const s = book.sections && book.sections[i];
    if (!s) return true;
    if (action === 'lesson') {
      const btn = document.querySelectorAll('#detail .learn-btn')[i];
      if (btn) btn.click();
    } else if (action === 'quiz') {
      await call('startQuiz', book.id, i);
    } else if (action === 'study') {
      await call('studyWithMax', book, s);
    }
    return true;
  }

  async function openCoursePath(cid, bid, sec, action) {
    const c = courses()[cid];
    if (!c) return false;
    if (!bid) {
      if (!(course() === c && vis('home'))) { hideAll(); await call('openCourse', cid); }
      return true;
    }
    const book = (c.books || []).find(b => b.id === bid);
    if (!book) { hideAll(); await call('openCourse', cid); return true; }
    if (!(course() === c && vis('detail') && st.book === bid)) {
      hideAll();
      await call('openCourse', cid);
      await call('openBook', bid);
      await sleep(30);
    } else if (st.quiz) {
      await call('openBook', bid); // leave the quiz, back to the sections
    }
    return sectionAction(book, sec, action);
  }

  async function openCurriculumPath(cid, unit, sec, action) {
    if (!unit) {
      if (!(vis('currCourseDetail') && window.__atriumCurrCourse === cid)) await call('openCurriculumUnit', cid);
      return true;
    }
    const bid = 'curr:' + cid + ':u' + unit;
    const cur = course();
    if (!(cur && cur.id === 'curr:' + cid && vis('detail') && st.book === bid)) {
      hideAll();
      await call('openCurriculumUnitAsCourse', cid, Number(unit));
      await sleep(30);
    } else if (st.quiz) {
      await call('openBook', bid);
    }
    const c = course();
    const book = c && (c.books || []).find(b => b.id === bid);
    return book ? sectionAction(book, sec, action) : true;
  }

  function needsApp(path) {
    if (path === '/' || path === '/pricing' || path === '/sign-in' || path === '/sign-up') return false;
    const page = PAGES.find(p => p.path === path);
    return page ? page.auth : true;
  }

  async function go(path) {
    path = normalize(path);
    const seg = path.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });

    closeOverlays(path);
    const now = describe();
    if (now && now.path === path) return true;

    if (needsApp(path) && !inApp()) return false;

    if (path === '/') {
      if (signedIn()) return call('goHome');
      hideAll();
      const landing = document.getElementById('landing');
      if (landing) landing.classList.remove('hidden');
      window.scrollTo(0, 0);
      return true;
    }
    if (path === '/pricing') return call('showPricing');
    if (path === '/sign-in' || path === '/sign-up') {
      if (signedIn()) return false;
      return call('openAuth', path === '/sign-up' ? 'signup' : 'signin');
    }

    const tool = TOOLS.find(t => t.path === path);
    if (tool) {
      // Opened straight from an address: put the app home under it.
      if (!inAppPage()) await call('goHome');
      return call(tool.open);
    }

    if (seg[0] === 'courses' && seg.length > 1) return openCoursePath(seg[1], seg[2], seg[3], seg[4]);
    if (seg[0] === 'curriculum' && seg.length > 1) return openCurriculumPath(seg[1], seg[2], seg[3], seg[4]);
    if (seg[0] === 'photo-atrium' && seg.length === 2 && seg[1] !== 'scan') return call('openPhotoAtriumResult', seg[1]);

    const page = PAGES.find(p => p.path === path);
    if (page && page.open) return call(page.open);
    return false;
  }

  function inAppPage() {
    return ['courses-home', 'home', 'detail', 'study', 'parentHome', 'photoAtriumResultPage'].some(vis) ||
      PAGES.some(p => p.auth && vis(p.view));
  }

  // Open a path, then settle the URL on whatever actually ended up on screen.
  // `push` adds a history entry (an in-app jump); otherwise the current one is replaced.
  async function navigate(path, push) {
    restoring = true;
    let ok = false;
    try { ok = await go(path); } finally { restoring = false; }
    await sleep(0);
    const d = describe();
    if (d) setMeta(d);
    if (d && d.path !== normalize(window.location.pathname)) sync(!push);
    return ok;
  }

  // Old links from before nested paths: /courses?course=algebra
  function legacyPath() {
    try {
      const c = new URLSearchParams(initialSearch).get('course');
      if (initialPath === '/courses' && c) return '/courses/' + enc(c);
    } catch (e) { /* ignore */ }
    return initialPath;
  }

  async function onReady() {
    if (ready) return;
    ready = true;
    const path = legacyPath();
    // admin.js routes /admin by itself.
    if (path !== '/' && path !== '/admin') {
      if (needsApp(path) && !signedIn()) {
        // Signed out on a members-only address: sign in first, then open it.
        pending = path;
        if (fn('openAuth')) fn('openAuth')('signin');
      } else {
        await navigate(path);
        return;
      }
    }
    setTimeout(() => sync(true), 0);
  }

  window.addEventListener('popstate', () => { navigate(window.location.pathname); });

  // ---------- recording what's open ----------
  function wrap(name, before) {
    const orig = fn(name);
    if (!orig || orig.__routerWrapped) return;
    const w = function () {
      try { before(arguments); } catch (e) { /* ignore */ }
      const r = orig.apply(this, arguments);
      // Some of these redraw a view that's already visible (a quiz replaces
      // the topic's contents), so no class flips for the observer to see.
      Promise.resolve(r).finally(() => setTimeout(() => sync(false), 0));
      return r;
    };
    w.__routerWrapped = true;
    window[name] = w;
  }

  function installWraps() {
    wrap('openBook', a => { st.book = a[0]; st.lesson = null; st.study = null; st.quiz = null; });
    wrap('toggleLesson', a => {
      const book = a[1];
      if (book) { st.book = book.id; st.lesson = (book.sections || []).indexOf(a[2]); }
    });
    wrap('studyWithMax', a => {
      const book = a[0];
      if (book) { st.book = book.id; st.study = (book.sections || []).indexOf(a[1]); }
    });
    wrap('startQuiz', a => { st.quiz = { bookId: a[0], sIdx: a[1] }; });
    wrap('startCumulative', a => { st.quiz = { bookId: a[0], sIdx: 'cum' }; });
    wrap('showPricing', () => { st.pricing = true; });
  }

  function watch() {
    let t = null;
    const obs = new MutationObserver(() => {
      // Several views flip in one navigation; sync once they settle.
      if (t) return;
      t = setTimeout(() => { t = null; sync(false); }, 0);
    });
    for (const id of new Set(WATCH)) {
      const n = document.getElementById(id);
      if (n) obs.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function init() {
    installWraps();
    watch();
    if (window.__atriumBooted) onReady();
    else window.addEventListener('atrium:ready', onReady, { once: true });
    // Fallback in case startup never signals (an error during auth init).
    setTimeout(onReady, 8000);
  }

  window.atriumNavigate = path => navigate(new URL(path, window.location.origin).pathname, true);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
