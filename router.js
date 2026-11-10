// Clean URLs for the single-page app.
//
// Every top-level view gets its own path (/faq, /profile, /shop, ...).
// The URL follows whatever view is on screen (watched with a
// MutationObserver, so no navigation function has to know about it),
// opening a path directly shows that view, and Back/Forward work.
// The server serves index.html for each path in ROUTES (see SPA_ROUTES
// in server.js) — keep the two lists in sync.
(function () {
  'use strict';

  // Order matters: overlays first, so /shop wins over the page under it.
  const ROUTES = [
    { path: '/shop',         view: 'shopOverlay',         open: 'openShop',            auth: true,  title: 'Shop' },
    { path: '/admin',        view: 'adminPage',           open: null,                  auth: true,  title: 'Admin' },
    { path: '/about',        view: 'about',               open: 'showAbout',           auth: false, title: 'About' },
    { path: '/why-atrium',   view: 'whyAtrium',           open: 'showWhyAtrium',       auth: false, title: 'Why Atrium' },
    { path: '/faq',          view: 'faq',                 open: 'showFAQ',             auth: false, title: 'FAQ' },
    { path: '/contact',      view: 'contact',             open: 'showContact',         auth: false, title: 'Contact' },
    { path: '/privacy',      view: 'privacy',             open: 'showPrivacy',         auth: false, title: 'Privacy Policy' },
    { path: '/terms',        view: 'terms',               open: 'showTerms',           auth: false, title: 'Terms of Use' },
    { path: '/courses',      view: 'home',                open: null,                  auth: true,  title: null, course: true },
    { path: '/courses',      view: 'courses-home',        open: 'goToCourses',         auth: true,  title: 'Courses' },
    { path: '/profile',      view: 'profilePage',         open: 'openProfile',         auth: true,  title: 'Profile' },
    { path: '/activity',     view: 'activityPage',        open: 'openActivity',        auth: true,  title: 'Activity' },
    { path: '/favorites',    view: 'favoritesPage',       open: 'openFavorites',       auth: true,  title: 'Favorites' },
    { path: '/achievements', view: 'achievementsPage',    open: 'openAchievements',    auth: true,  title: 'Achievements' },
    { path: '/leaderboard',  view: 'leaderboardPage',     open: 'openLeaderboard',     auth: true,  title: 'Leaderboard' },
    { path: '/curriculum',   view: 'curriculumPage',      open: 'openCurriculum',      auth: true,  title: 'Curriculum' },
    { path: '/photo-atrium', view: 'photoAtriumListPage', open: 'openPhotoAtriumList', auth: true,  title: 'Photo Atrium' },
    { path: '/parent',       view: 'parentHome',          open: null,                  auth: true,  title: 'Parent dashboard' },
    { path: '/',             view: 'landing',             open: null,                  auth: false, title: null },
  ];

  const BASE_TITLE = document.title;
  const initialPath = normalize(window.location.pathname);
  const initialSearch = window.location.search;
  let ready = false;     // false until auth.js has decided where to land
  let restoring = false; // true while applying a popstate, so we don't push
  let pending = null;    // members-only page to open once the visitor signs in

  function normalize(p) {
    if (!p) return '/';
    if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1);
    return p.toLowerCase();
  }

  function isVisible(id) {
    const n = document.getElementById(id);
    return !!n && !n.classList.contains('hidden');
  }

  function currentRoute() {
    for (const r of ROUTES) if (isVisible(r.view)) return r;
    return null; // a view with no URL of its own (a course, a lesson, onboarding)
  }

  // The open course, when the course view is on screen (COURSE lives in courses.js).
  function openCourseId() {
    try {
      if (typeof COURSE !== 'undefined' && COURSE && COURSE.id && COURSES[COURSE.id] === COURSE) return COURSE.id;
    } catch (e) { /* ignore */ }
    return null;
  }

  function courseParam(search) {
    try { return new URLSearchParams(search).get('course'); } catch (e) { return null; }
  }

  // The query string a route should carry: ?course=<id> for a course,
  // otherwise whatever was there minus a stale course param.
  function searchFor(route) {
    const q = new URLSearchParams(window.location.search);
    q.delete('course');
    if (route.course) {
      const id = openCourseId();
      if (id) q.set('course', id);
    }
    const str = q.toString();
    return str ? '?' + str : '';
  }

  function setMeta(route) {
    let title = route && route.title;
    if (route && route.course) {
      const id = openCourseId(); title = id ? COURSES[id].title : 'Courses';
    }
    document.title = title ? title + ' · Atrium Institute' : BASE_TITLE;
    const canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = 'https://atriuminstitute.ai' + (route ? route.path : '/');
  }

  function sync(replace) {
    if (!ready || restoring) return;
    const route = currentRoute();
    if (!route) return;
    if (pending && signedIn() && isVisible('courses-home')) {
      // Just signed in after asking for a members-only page: open it now.
      const want = pending; pending = null;
      if (go(want.path, want.search)) return;
    }
    setMeta(route);
    if (route.course && !openCourseId()) return; // a curriculum unit: no URL of its own
    const search = searchFor(route);
    if (normalize(window.location.pathname) === route.path && window.location.search === search) return;
    const url = route.path + search + window.location.hash;
    try {
      if (replace) history.replaceState({ path: route.path }, '', url);
      else history.pushState({ path: route.path }, '', url);
    } catch (e) { /* ignore */ }
  }

  function signedIn() {
    return typeof window.getCurrentUser === 'function' && !!window.getCurrentUser();
  }

  // Are we somewhere a signed-in page may open over (not mid-onboarding,
  // not waiting on parental consent)?
  function inApp() {
    return isVisible('courses-home') || isVisible('parentHome') ||
      ROUTES.some(r => r.auth && r.view !== 'courses-home' && isVisible(r.view));
  }

  function callOpener2(name, arg) {
    const fn = window[name];
    if (typeof fn !== 'function') return false;
    try { Promise.resolve(fn(arg)).catch(() => {}); } catch (e) { return false; }
    return true;
  }

  function callOpener(name) {
    const fn = window[name] || (typeof globalThis[name] === 'function' ? globalThis[name] : null);
    if (typeof fn !== 'function') return false;
    try { Promise.resolve(fn()).catch(() => {}); } catch (e) { return false; }
    return true;
  }

  // Show the view for `path`. Returns false if it can't be shown here.
  function go(path, search) {
    const courseId = path === '/courses' ? courseParam(search || '') : null;
    if (courseId && typeof COURSES !== 'undefined' && COURSES[courseId]) {
      if (!(signedIn() && inApp())) return false;
      return callOpener2('openCourse', courseId);
    }
    const route = ROUTES.find(r => r.path === path && !r.course);
    if (!route) return false;
    if (path === '/') {
      if (signedIn()) return callOpener('goHome');
      if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
      const landing = document.getElementById('landing');
      if (landing) landing.classList.remove('hidden');
      window.scrollTo(0, 0);
      return true;
    }
    if (!route.open) return false;
    if (route.auth && !(signedIn() && inApp())) return false;
    if (route.view === 'shopOverlay') {
      // An overlay sits on top of the app home.
      if (!isVisible('courses-home') && !isVisible('parentHome')) callOpener('goHome');
    } else if (isVisible('shopOverlay')) {
      const ov = document.getElementById('shopOverlay');
      if (ov) ov.classList.add('hidden');
    }
    return callOpener(route.open);
  }

  function onReady() {
    if (ready) return;
    ready = true;
    // admin.js routes /admin by itself.
    if (initialPath !== '/' && initialPath !== '/admin') {
      const route = ROUTES.find(r => r.path === initialPath);
      if (route && route.auth && !signedIn()) {
        // Signed out on a members-only page: ask them to sign in, then open it.
        pending = { path: initialPath, search: initialSearch };
        if (typeof window.openAuth === 'function') window.openAuth('signin');
      } else {
        go(initialPath, initialSearch);
      }
    }
    // Let the opened view render, then settle the URL without adding history.
    setTimeout(() => sync(true), 0);
  }

  window.addEventListener('popstate', () => {
    const path = normalize(window.location.pathname);
    restoring = true;
    const ok = go(path, window.location.search);
    restoring = false;
    // Let the view render, then fix the title, or point the URL back at
    // what's on screen if that page couldn't open here.
    setTimeout(() => { if (ok) setMeta(currentRoute()); else sync(true); }, 0);
  });

  function watch() {
    const obs = new MutationObserver(() => {
      // Several views flip in one navigation; sync once they settle.
      if (watch._t) return;
      watch._t = setTimeout(() => { watch._t = null; sync(false); }, 0);
    });
    for (const r of ROUTES) {
      const n = document.getElementById(r.view);
      if (n) obs.observe(n, { attributes: true, attributeFilter: ['class'] });
    }
  }

  function init() {
    watch();
    if (window.__atriumBooted) onReady();
    else window.addEventListener('atrium:ready', onReady, { once: true });
    // Fallback in case startup never signals (an error during auth init).
    setTimeout(onReady, 8000);
  }

  window.atriumNavigate = function (path) {
    const u = new URL(path, window.location.origin);
    return go(normalize(u.pathname), u.search);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
