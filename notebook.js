// Digital notebook. A local, per-browser set of notes with a two-pane list +
// editor, auto-saving to localStorage. No server, no AI. Self-contained and
// decoupled; a failure here cannot affect the rest of the app.
(function () {
  var KEY = 'atrium_notebook_v1';

  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var notes = [];      // [{id, title, body, updatedAt}]
  var activeId = null;
  var saveTimer = null;

  function load() {
    try { notes = JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (_) { notes = []; }
    if (!Array.isArray(notes)) notes = [];
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(notes)); } catch (_) {}
  }
  function active() { return notes.filter(function (n) { return n.id === activeId; })[0] || null; }
  function makeId() { return 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function fmtDate(ts) {
    if (!ts) return '';
    try {
      var d = new Date(ts);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
        ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
    } catch (_) { return ''; }
  }
  function titleOf(n) { return (n.title && n.title.trim()) || (n.body && n.body.trim().split('\n')[0].slice(0, 40)) || 'Untitled note'; }
  function snippetOf(n) { return (n.body || '').replace(/\s+/g, ' ').trim().slice(0, 60); }

  function renderList() {
    var wrap = el('nbList');
    if (!wrap) return;
    if (!notes.length) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = notes.map(function (n) {
      return '<button class="nb-item' + (n.id === activeId ? ' active' : '') + '" data-id="' + n.id + '">' +
        '<span class="nb-item-title">' + esc(titleOf(n)) + '</span>' +
        '<span class="nb-item-snip">' + esc(snippetOf(n)) + '</span>' +
        '<span class="nb-item-date">' + esc(fmtDate(n.updatedAt)) + '</span>' +
      '</button>';
    }).join('');
    wrap.querySelectorAll('.nb-item').forEach(function (b) {
      b.addEventListener('click', function () { selectNote(b.dataset.id); });
    });
  }

  function renderEditor() {
    var n = active();
    if (!n) { hide(el('nbEditor')); show(el('nbEmpty')); return; }
    hide(el('nbEmpty')); show(el('nbEditor'));
    el('nbNoteTitle').value = n.title || '';
    el('nbNoteBody').value = n.body || '';
    var saved = el('nbSaved');
    if (saved) saved.textContent = n.updatedAt ? 'Saved ' + fmtDate(n.updatedAt) : '';
  }

  function selectNote(id) { activeId = id; renderList(); renderEditor(); }

  function newNote() {
    var n = { id: makeId(), title: '', body: '', updatedAt: Date.now() };
    notes.unshift(n);
    persist();
    activeId = n.id;
    renderList(); renderEditor();
    var t = el('nbNoteTitle');
    if (t) t.focus();
  }

  function onEdit() {
    var n = active();
    if (!n) return;
    n.title = el('nbNoteTitle').value;
    n.body = el('nbNoteBody').value;
    n.updatedAt = Date.now();
    // Debounced save; keep the list snippet/title live.
    var saved = el('nbSaved');
    if (saved) saved.textContent = 'Saving…';
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      // Move the edited note to the top (most-recent first).
      notes = [n].concat(notes.filter(function (x) { return x.id !== n.id; }));
      persist();
      renderList();
      if (saved) saved.textContent = 'Saved ' + fmtDate(n.updatedAt);
    }, 400);
  }

  function deleteNote() {
    var n = active();
    if (!n) return;
    notes = notes.filter(function (x) { return x.id !== n.id; });
    persist();
    activeId = notes.length ? notes[0].id : null;
    renderList(); renderEditor();
  }

  function open() {
    var ov = el('nbOverlay');
    if (!ov) return;
    load();
    activeId = notes.length ? notes[0].id : null;
    renderList(); renderEditor();
    show(ov);
  }
  function close() {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; persist(); }
    hide(el('nbOverlay'));
  }
  window.openNotebook = open;

  function init() {
    var navBtn = el('notebookNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('nbClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('nbOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('nbOverlay') || el('nbOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    var nw = el('nbNew'); if (nw) nw.addEventListener('click', newNote);
    var nw2 = el('nbEmptyNew'); if (nw2) nw2.addEventListener('click', newNote);
    var title = el('nbNoteTitle'); if (title) title.addEventListener('input', onEdit);
    var body = el('nbNoteBody'); if (body) body.addEventListener('input', onEdit);
    var del = el('nbDelete'); if (del) del.addEventListener('click', deleteNote);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
