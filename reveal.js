// Scroll-reveal + hero entrance for the landing page.
//
// Fail-safe by construction: the hidden/animated CSS states only take effect
// when this script adds `.js-reveal` to <html>. If the script never runs, if
// IntersectionObserver is unavailable, or if the user prefers reduced motion,
// every element stays fully visible. Three backstops guarantee content is
// never left stuck invisible even though #landing is display:none until shown.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return; // leave everything visible

  root.classList.add('js-reveal');

  function pending() {
    return Array.prototype.slice.call(document.querySelectorAll('.reveal:not(.is-visible)'));
  }
  function reveal(el) { el.classList.add('is-visible'); }
  function revealAll() { pending().forEach(reveal); }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { reveal(e.target); io.unobserve(e.target); }
    });
  }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  function observe() { pending().forEach(function (el) { io.observe(el); }); }

  function start() {
    observe();
    // Backstop 1: #landing starts display:none; when it's unhidden, re-run so
    // IO re-evaluates now that its sections finally have layout.
    var landing = document.getElementById('landing');
    if (landing && 'MutationObserver' in window) {
      new MutationObserver(function () {
        if (!landing.classList.contains('hidden')) observe();
      }).observe(landing, { attributes: true, attributeFilter: ['class'] });
    }
    // Backstop 2: hard safety — nothing stays invisible past 3s, whatever happens.
    setTimeout(revealAll, 3000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
