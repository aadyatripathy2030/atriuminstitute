// Referral program (client). Two jobs:
//  1) Capture a ?ref=CODE on arrival and remember it, so it rides along on
//     signup (auth.js reads window.getReferralCode()).
//  2) The "Invite Friends" overlay: shows the user's own referral link + how
//     many friends they've brought in (GET /api/me/referral).
// Self-contained; a failure here can't affect the app.
(function () {
  var REF_KEY = 'atrium_ref_v1';
  function el(id) { return document.getElementById(id); }
  function show(n) { if (n) n.classList.remove('hidden'); }
  function hide(n) { if (n) n.classList.add('hidden'); }

  // ---- Capture inbound ?ref= ----
  try {
    var code = new URLSearchParams(location.search).get('ref');
    if (code) {
      code = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
      if (code) sessionStorage.setItem(REF_KEY, code);
    }
  } catch (_) {}
  window.getReferralCode = function () {
    try { return sessionStorage.getItem(REF_KEY) || null; } catch (_) { return null; }
  };

  // ---- Invite overlay ----
  var myLink = '';

  function renderShare(link) {
    var wrap = el('refShare');
    if (!wrap) return;
    var msg = encodeURIComponent('I’ve been using Atrium Institute for math & English — join with my link and your first month of Pro is free: ' + link);
    var enc = encodeURIComponent(link);
    wrap.innerHTML =
      '<a class="ref-share-btn" target="_blank" rel="noopener" href="sms:?&body=' + msg + '">Text</a>' +
      '<a class="ref-share-btn" target="_blank" rel="noopener" href="mailto:?subject=' + encodeURIComponent('Try Atrium Institute') + '&body=' + msg + '">Email</a>' +
      '<a class="ref-share-btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + msg + '">WhatsApp</a>' +
      '<a class="ref-share-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=' + msg + '">X</a>';
  }

  async function load() {
    var errEl = el('refError'); hide(errEl);
    try {
      var r = await fetch('/api/me/referral', { credentials: 'same-origin' });
      if (r.status === 401) throw new Error('Sign in to get your invite link.');
      if (!r.ok) throw new Error('Could not load your invite link.');
      var d = await r.json();
      myLink = location.origin + '/?ref=' + encodeURIComponent(d.code || '');
      if (el('refLink')) el('refLink').value = myLink;
      if (el('refCount')) el('refCount').textContent = String(d.count || 0);
      renderShare(myLink);
    } catch (e) {
      if (errEl) { errEl.textContent = (e && e.message) || 'Could not load your invite link.'; show(errEl); }
    }
  }

  function copy() {
    var input = el('refLink');
    if (!input || !input.value) return;
    var done = function () {
      var b = el('refCopy'); if (!b) return;
      var t = b.textContent; b.textContent = 'Copied ✓';
      setTimeout(function () { b.textContent = t; }, 1400);
    };
    try {
      navigator.clipboard.writeText(input.value).then(done, function () { input.select(); document.execCommand('copy'); done(); });
    } catch (_) {
      try { input.select(); document.execCommand('copy'); done(); } catch (e) {}
    }
  }

  function open() { var ov = el('refOverlay'); if (!ov) return; show(ov); load(); }
  function close() { hide(el('refOverlay')); }
  window.openReferral = open;

  function init() {
    var navBtn = el('referralNavBtn');
    if (navBtn) navBtn.addEventListener('click', open);
    var closeBtn = el('refClose');
    if (closeBtn) closeBtn.addEventListener('click', close);
    var ov = el('refOverlay');
    if (ov) ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) {
      if (!el('refOverlay') || el('refOverlay').classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
    });
    var copyBtn = el('refCopy');
    if (copyBtn) copyBtn.addEventListener('click', copy);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
