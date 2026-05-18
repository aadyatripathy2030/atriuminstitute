// My Favorites: starred topics (books) live in a tiny client-side
// cache so the heart icon on every topic card can render its filled
// state without an extra API call. The cache is hydrated from
// /api/me/favorites on first need, then maintained locally as the
// student toggles hearts.
//
// Public surface (all on window):
//   window.AtriumFavorites.isFavorite(courseId, bookId) -> bool
//   window.AtriumFavorites.toggle(courseId, bookId)       -> Promise<bool>
//   window.AtriumFavorites.refresh()                     -> Promise<void>
//   window.openFavorites()                                -> show page
//
// The hydrated cache is a Set of "courseId:bookId" keys.
(function () {
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
  function show(node) { if (node) node.classList.remove('hidden'); }
  function hide(node) { if (node) node.classList.add('hidden'); }

  const _set = new Set();
  let _list = []; // [{course_id, book_id, created_at}]
  let _hydrated = false;
  let _hydratingPromise = null;

  function _key(courseId, bookId) { return courseId + ':' + bookId; }

  async function _hydrate() {
    if (_hydrated) return;
    if (_hydratingPromise) return _hydratingPromise;
    _hydratingPromise = (async () => {
      try {
        const res = await fetch('/api/me/favorites', { credentials: 'same-origin' });
        if (!res.ok) {
          // Not signed in or DB hiccup: leave the cache empty. The heart
          // toggle's POST will surface a clearer error if the user clicks.
          _hydrated = true;
          return;
        }
        const data = await res.json();
        _list = data.favorites || [];
        _set.clear();
        for (const f of _list) _set.add(_key(f.course_id, f.book_id));
        _hydrated = true;
      } catch (_) {
        _hydrated = true; // give up; better to load no hearts than to spin
      } finally {
        _hydratingPromise = null;
      }
    })();
    return _hydratingPromise;
  }

  function isFavorite(courseId, bookId) {
    return _set.has(_key(courseId, bookId));
  }

  async function toggle(courseId, bookId) {
    if (!courseId || !bookId) return false;
    const k = _key(courseId, bookId);
    const currentlyFavorited = _set.has(k);
    // Optimistic update.
    if (currentlyFavorited) {
      _set.delete(k);
      _list = _list.filter(f => !(f.course_id === courseId && f.book_id === bookId));
    } else {
      _set.add(k);
      _list.unshift({ course_id: courseId, book_id: bookId, created_at: new Date().toISOString() });
    }
    try {
      const res = await fetch('/api/me/favorites', {
        method: currentlyFavorited ? 'DELETE' : 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, bookId }),
      });
      if (!res.ok) {
        // Rollback on failure.
        if (currentlyFavorited) {
          _set.add(k);
          _list.unshift({ course_id: courseId, book_id: bookId, created_at: new Date().toISOString() });
        } else {
          _set.delete(k);
          _list = _list.filter(f => !(f.course_id === courseId && f.book_id === bookId));
        }
        const data = await res.json().catch(() => ({}));
        let msg = data.error || `Request failed (${res.status})`;
        if (res.status >= 500) {
          // Most likely: user_favorites table doesn't exist yet because
          // npm run migrate hasn't been run since the favorites feature
          // landed. Surface a clear hint instead of "Internal error".
          msg += ' — if this just landed, the DB migration may be pending. Try refreshing in a couple of minutes, or contact the admin to run npm run migrate.';
        }
        console.warn('[favorites] toggle response not ok:', res.status, msg);
        throw new Error(msg);
      }
      console.log('[favorites] toggle ok:', currentlyFavorited ? 'removed' : 'added', courseId, bookId);
    } catch (e) {
      console.warn('[favorites] toggle failed:', e && e.message);
      throw e;
    }
    return !currentlyFavorited;
  }

  async function refresh() {
    _hydrated = false;
    _set.clear();
    _list = [];
    await _hydrate();
  }

  // Auto-hydrate on first access. Don't block the caller; renderers
  // should re-render once hydration finishes.
  async function ensureHydrated() {
    if (!_hydrated && !_hydratingPromise) {
      await _hydrate();
    } else if (_hydratingPromise) {
      await _hydratingPromise;
    }
  }

  // ----- Page -----
  let _favPageWired = false;
  async function openFavorites() {
    console.log('[favorites] openFavorites entry');
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('favoritesPage'));
    if (!_favPageWired) {
      _favPageWired = true;
      const back = el('favBack');
      if (back) back.addEventListener('click', () => {
        hide(el('favoritesPage'));
        if (typeof window.goHome === 'function') window.goHome();
      });
    }
    // Always refetch when the page opens. Hearts toggled elsewhere in
    // the app may have mutated server state since the last hydrate; an
    // explicit refresh keeps the page authoritative.
    const list = el('favoritesList');
    if (list) list.innerHTML = '<div class="parent-empty">Loading…</div>';
    try {
      await refresh();
      console.log('[favorites] refresh done. count:', _list.length);
    } catch (e) {
      console.warn('[favorites] refresh failed:', e && e.message);
    }
    renderFavorites();
  }

  function renderFavorites() {
    const list = el('favoritesList');
    if (!list) return;
    if (_list.length === 0) {
      list.innerHTML = `
        <div class="parent-empty">
          You haven't starred any topics yet. From the home page, click the
          <span class="fav-heart" aria-hidden="true">♡</span> on any topic
          card to add it here.
        </div>
      `;
      return;
    }
    const COURSES_REF = (typeof window.COURSES !== 'undefined') ? window.COURSES : {};
    const tiles = [];
    for (const f of _list) {
      const course = COURSES_REF[f.course_id];
      if (!course) continue;
      const book = (course.books || []).find(b => b.id === f.book_id);
      if (!book) continue;
      const scores = (typeof loadScores === 'function') ? loadScores() : {};
      const stats = (typeof bookStatsFor === 'function') ? bookStatsFor(book, scores) : { passed: 0, total: (book.sections || []).length };
      const pct = stats.total ? (100 * stats.passed / stats.total) : 0;
      tiles.push(`
        <div class="course-card topic-card" data-course="${esc(f.course_id)}" data-book="${esc(f.book_id)}"
             style="--a1:${book.accent || course.accent};--a2:${book.accent2 || course.accent2}">
          <button class="fav-heart-btn favorited" type="button" data-course="${esc(f.course_id)}" data-book="${esc(f.book_id)}" aria-label="Remove from favorites" title="Remove from favorites">♥</button>
          <div class="course-emoji">${book.emoji || course.emoji || '📘'}</div>
          <div class="course-title">${esc(book.title)}</div>
          <div class="course-subtitle">${esc(course.title)}</div>
          ${book.subtitle ? `<div class="course-desc">${esc(book.subtitle)}</div>` : ''}
          <div class="course-meta">
            <span>${(book.sections || []).length} quizzes</span>
            <span>${stats.passed}/${stats.total} passed</span>
          </div>
          <div class="book-progress-bar"><div style="width:${pct}%"></div></div>
          <div class="course-cta">Start ${esc(book.title)} →</div>
        </div>
      `);
    }
    if (!tiles.length) {
      list.innerHTML = '<div class="parent-empty">Your favorites reference courses that are no longer available.</div>';
      return;
    }
    list.innerHTML = tiles.join('');
    // Card click -> open the book.
    list.querySelectorAll('.course-card.topic-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.fav-heart-btn')) return;
        const cid = card.dataset.course;
        const bid = card.dataset.book;
        if (typeof setCourse === 'function') setCourse(cid);
        if (typeof window._setNavFromTopicGrid === 'function') {
          window._setNavFromTopicGrid(true);
        }
        // Hide favorites page so the detail stacks cleanly.
        hide(el('favoritesPage'));
        if (typeof window.openBook === 'function') window.openBook(bid);
      });
    });
    // Heart click -> unfavorite + re-render.
    list.querySelectorAll('.fav-heart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const cid = btn.dataset.course;
        const bid = btn.dataset.book;
        try {
          await toggle(cid, bid);
          renderFavorites();
        } catch (err) {
          alert(err.message || 'Could not update favorite.');
        }
      });
    });
  }

  // Public API.
  window.AtriumFavorites = {
    isFavorite, toggle, refresh,
    // ensureHydrated is useful for renderers that want to wait before
    // rendering hearts, but it's optional -- hearts can render in their
    // default empty state and re-render once hydration completes.
    ensureHydrated,
  };
  window.openFavorites = openFavorites;

  // Hydrate once the DOM is alive, in the background. Callers can also
  // explicitly call AtriumFavorites.refresh() after sign-in / sign-out.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _hydrate(); });
  } else {
    _hydrate();
  }

  // Wire the nav button.
  function wireNav() {
    const btn = document.getElementById('favoritesNavBtn');
    if (btn) btn.addEventListener('click', openFavorites);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireNav);
  } else {
    wireNav();
  }
})();
