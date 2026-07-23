// AI flashcard generator. Generates a deck for any topic via the existing
// AI proxy (AI.generateFlashcards -> /api/claude intent:flashcards), lets the
// student flip through the cards, shuffle, and save decks to localStorage.
// Self-initialising and decoupled: a failure here cannot affect the rest of
// the app.
(function () {
  var DECKS_KEY = 'atrium_flashcard_decks_v1';

  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }

  function loadDecks() {
    try { return JSON.parse(localStorage.getItem(DECKS_KEY)) || []; }
    catch (_) { return []; }
  }
  function saveDecks(d) {
    try { localStorage.setItem(DECKS_KEY, JSON.stringify(d)); } catch (_) {}
  }

  var deck = [];        // current cards [{front, back}]
  var deckName = '';
  var idx = 0;
  var flipped = false;

  function renderCard() {
    if (!deck.length) return;
    var c = deck[idx];
    var front = el('fcFront'), back = el('fcBack');
    if (front) front.textContent = c.front;
    if (back) back.textContent = c.back;
    var prog = el('fcProgress');
    if (prog) prog.textContent = (idx + 1) + ' / ' + deck.length;
    var name = el('fcDeckName');
    if (name) name.textContent = deckName;
    setFlipped(false);
  }
  function setFlipped(v) {
    flipped = v;
    var inner = el('fcFlipInner');
    if (inner) inner.classList.toggle('is-flipped', flipped);
  }
  function go(delta) {
    if (!deck.length) return;
    idx = (idx + delta + deck.length) % deck.length;
    renderCard();
  }
  function shuffle() {
    for (var i = deck.length - 1; i > 0; i--) {
      // Deterministic-free shuffle is fine here; Math.random is available in the browser.
      var j = Math.floor(Math.random() * (i + 1));
      var t = deck[i]; deck[i] = deck[j]; deck[j] = t;
    }
    idx = 0; renderCard();
  }

  function enterStudy(cards, name) {
    deck = cards; deckName = name || 'Deck'; idx = 0;
    hide(el('fcGen')); show(el('fcStudy'));
    renderCard();
  }
  function backToGen() {
    show(el('fcGen')); hide(el('fcStudy'));
    renderSaved();
  }

  function renderSaved() {
    var wrap = el('fcSaved');
    if (!wrap) return;
    var decks = loadDecks();
    if (!decks.length) { wrap.innerHTML = ''; return; }
    var html = '<div class="fc-saved-h">Saved decks</div>';
    decks.forEach(function (d) {
      html += '<div class="fc-saved-row" data-id="' + d.id + '">' +
        '<button class="fc-saved-open" data-id="' + d.id + '">' +
          escapeHtml(d.topic) + ' <span class="fc-saved-count">' + d.cards.length + '</span>' +
        '</button>' +
        '<button class="fc-saved-del" data-id="' + d.id + '" aria-label="Delete deck">🗑</button>' +
      '</div>';
    });
    wrap.innerHTML = html;
    wrap.querySelectorAll('.fc-saved-open').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = loadDecks().filter(function (x) { return x.id === b.dataset.id; })[0];
        if (d) enterStudy(d.cards.slice(), d.topic);
      });
    });
    wrap.querySelectorAll('.fc-saved-del').forEach(function (b) {
      b.addEventListener('click', function () {
        saveDecks(loadDecks().filter(function (x) { return x.id !== b.dataset.id; }));
        renderSaved();
      });
    });
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function makeId() {
    // No Date.now dependency issues in the browser, but keep it simple/unique.
    return 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function open() {
    var ov = el('fcOverlay');
    if (!ov) return;
    show(ov);
    show(el('fcGen')); hide(el('fcStudy'));
    hide(el('fcError'));
    renderSaved();
    var topic = el('fcTopic');
    if (topic) topic.focus();
  }
  function close() { hide(el('fcOverlay')); }
  window.openFlashcards = open;

  async function generate() {
    var topicEl = el('fcTopic');
    var countEl = el('fcCount');
    var btn = el('fcGenBtn');
    var errEl = el('fcError');
    var topic = topicEl ? topicEl.value.trim() : '';
    hide(errEl);
    if (!topic) { if (errEl) { errEl.textContent = 'Enter a topic first.'; show(errEl); } return; }
    if (typeof AI === 'undefined' || !AI.generateFlashcards) {
      if (errEl) { errEl.textContent = 'The tutor is unavailable right now.'; show(errEl); }
      return;
    }
    var count = countEl ? parseInt(countEl.value, 10) || 12 : 12;
    var oldLabel = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Generating…'; }
    try {
      var cards = await AI.generateFlashcards(topic, count);
      if (!cards.length) {
        if (errEl) { errEl.textContent = 'Could not build a deck for that. Try a more specific academic topic.'; show(errEl); }
        return;
      }
      enterStudy(cards, topic);
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) ? e.message : 'Something went wrong. Try again.'; show(errEl); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = oldLabel || 'Generate'; }
    }
  }

  function saveCurrentDeck() {
    if (!deck.length) return;
    var decks = loadDecks();
    decks.unshift({ id: makeId(), topic: deckName, cards: deck.slice() });
    saveDecks(decks.slice(0, 50)); // cap stored decks
    var btn = el('fcSaveDeck');
    if (btn) { var t = btn.textContent; btn.textContent = 'Saved ✓'; setTimeout(function () { btn.textContent = t; }, 1400); }
  }

  function init() {
    var navBtn = el('flashcardsNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('fcClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('fcOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (el('fcOverlay') && el('fcOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === ' ' && el('fcStudy') && !el('fcStudy').classList.contains('hidden')) { e.preventDefault(); setFlipped(!flipped); }
    });

    var genBtn = el('fcGenBtn');
    if (genBtn) genBtn.addEventListener('click', generate);
    var topic = el('fcTopic');
    if (topic) topic.addEventListener('keydown', function (e) { if (e.key === 'Enter') generate(); });

    var flip = el('fcFlip');
    if (flip) {
      flip.addEventListener('click', function () { setFlipped(!flipped); });
      flip.addEventListener('keydown', function (e) { if (e.key === 'Enter') setFlipped(!flipped); });
    }
    var prev = el('fcPrev'), next = el('fcNext'), shuf = el('fcShuffle');
    if (prev) prev.addEventListener('click', function () { go(-1); });
    if (next) next.addEventListener('click', function () { go(1); });
    if (shuf) shuf.addEventListener('click', shuffle);
    var save = el('fcSaveDeck'), neu = el('fcNewDeck');
    if (save) save.addEventListener('click', saveCurrentDeck);
    if (neu) neu.addEventListener('click', backToGen);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
