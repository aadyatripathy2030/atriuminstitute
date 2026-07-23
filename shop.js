// Rewards shop (client). Talks to /api/me/shop{,/buy,/equip}. Renders the
// catalog, handles buying/equipping, and applies the equipped theme + badge.
// Equipped cosmetics are cached in localStorage so they apply instantly on load
// (before the server confirms). Self-contained; a failure here can't affect the app.
(function () {
  var CACHE = 'atrium_cosmetic_v1';
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var state = null; // last fetched shop state

  // ---- Apply cosmetics to the page ----
  function badgeEmoji(id, catalog) {
    if (!id) return '';
    var list = catalog || (state && state.catalog) || [];
    var it = list.filter(function (x) { return x.id === id; })[0];
    return it && it.emoji ? it.emoji : '';
  }
  function applyCosmetics(equipped, catalog) {
    var root = document.documentElement;
    var theme = equipped && equipped.theme;
    if (theme && theme !== 'classic') root.setAttribute('data-cosmetic', theme);
    else root.removeAttribute('data-cosmetic');
    var badgeEl = el('cosmeticBadge');
    if (badgeEl) {
      var emo = badgeEmoji(equipped && equipped.badge, catalog);
      if (emo) { badgeEl.textContent = emo; show(badgeEl); }
      else { badgeEl.textContent = ''; hide(badgeEl); }
    }
  }
  function cache(equipped, catalog) {
    try {
      var emo = badgeEmoji(equipped && equipped.badge, catalog);
      localStorage.setItem(CACHE, JSON.stringify({ theme: (equipped && equipped.theme) || 'classic', badgeEmoji: emo }));
    } catch (_) {}
  }
  function applyFromCache() {
    try {
      var c = JSON.parse(localStorage.getItem(CACHE));
      if (!c) return;
      var root = document.documentElement;
      if (c.theme && c.theme !== 'classic') root.setAttribute('data-cosmetic', c.theme);
      var badgeEl = el('cosmeticBadge');
      if (badgeEl && c.badgeEmoji) { badgeEl.textContent = c.badgeEmoji; show(badgeEl); }
    } catch (_) {}
  }

  // ---- Rendering ----
  function itemCard(item) {
    var owned = item.price === 0 || (state.owned.indexOf(item.id) !== -1);
    var equipped = state.equipped[item.type] === item.id ||
      (item.type === 'theme' && item.id === 'classic' && state.equipped.theme === 'classic');
    var visual = item.type === 'theme'
      ? '<span class="shop-swatch" style="background:' + esc(item.swatch) + '"></span>'
      : '<span class="shop-emoji">' + esc(item.emoji) + '</span>';
    var btn;
    if (equipped) btn = '<button class="shop-btn shop-equipped" disabled>Equipped ✓</button>';
    else if (owned) btn = '<button class="shop-btn shop-equip" data-slot="' + item.type + '" data-id="' + esc(item.id) + '">Equip</button>';
    else btn = '<button class="shop-btn shop-buy" data-id="' + esc(item.id) + '">Buy · ' + item.price + ' 🪙</button>';
    return '<div class="shop-item' + (equipped ? ' is-equipped' : '') + '">' +
      visual + '<span class="shop-item-name">' + esc(item.name) + '</span>' + btn + '</div>';
  }
  function render() {
    if (!state) return;
    el('shopCoins').textContent = state.coins;
    var themes = state.catalog.filter(function (i) { return i.type === 'theme'; });
    var badges = state.catalog.filter(function (i) { return i.type === 'badge'; });
    el('shopThemes').innerHTML = themes.map(itemCard).join('');
    el('shopBadges').innerHTML = badges.map(itemCard).join('');
  }

  function setState(s) {
    state = s;
    render();
    applyCosmetics(s.equipped, s.catalog);
    cache(s.equipped, s.catalog);
  }

  // ---- Network ----
  async function load() {
    var errEl = el('shopError'); hide(errEl);
    try {
      var r = await fetch('/api/me/shop', { credentials: 'same-origin' });
      if (r.status === 401) throw new Error('Sign in to use the shop.');
      if (!r.ok) throw new Error('Could not load the shop.');
      setState(await r.json());
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) || 'Could not load the shop.'; show(errEl); }
    }
  }
  async function act(pathSuffix, body) {
    var errEl = el('shopError'); hide(errEl);
    try {
      var r = await fetch('/api/me/shop/' + pathSuffix, {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      var data = await r.json();
      if (!r.ok) throw new Error(data.error || 'That didn\'t work.');
      setState(data);
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) || 'That didn\'t work.'; show(errEl); }
    }
  }

  function open() { var ov = el('shopOverlay'); if (!ov) return; show(ov); load(); }
  function close() { hide(el('shopOverlay')); }
  window.openShop = open;

  function init() {
    // Instant apply from cache, then reconcile with the server when signed in.
    applyFromCache();
    var navBtn = el('shopNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('shopClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('shopOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('shopOverlay') || el('shopOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    // Delegate buy/equip clicks.
    ['shopThemes', 'shopBadges'].forEach(function (id) {
      var grid = el(id);
      if (!grid) return;
      grid.addEventListener('click', function (e) {
        var buy = e.target.closest('.shop-buy');
        var eq = e.target.closest('.shop-equip');
        if (buy) act('buy', { itemId: buy.dataset.id });
        else if (eq) act('equip', { slot: eq.dataset.slot, itemId: eq.dataset.id });
      });
    });
    // Refresh equipped cosmetics from the server on load for signed-in users.
    var signedIn = (typeof window.getCurrentUser === 'function') && window.getCurrentUser();
    if (signedIn) {
      fetch('/api/me/shop', { credentials: 'same-origin' }).then(function (r) {
        return r.ok ? r.json() : null;
      }).then(function (s) {
        if (s) { state = s; applyCosmetics(s.equipped, s.catalog); cache(s.equipped, s.catalog); }
      }).catch(function () {});
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
