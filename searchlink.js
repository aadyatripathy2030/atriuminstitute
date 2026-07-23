// Deep-linkable course search: /?q=term opens the courses view and applies the
// filter. This is the target the WebSite SearchAction in the page's structured
// data points to, so Google's sitelinks search box lands on a real result set.
// Self-contained; a failure here cannot affect anything else.
(function () {
  var q;
  try { q = new URLSearchParams(location.search).get('q'); } catch (_) { q = null; }
  if (!q) return;
  q = q.trim().slice(0, 100);
  if (!q) return;

  function apply() {
    // Show the courses grid (works signed-in or out; renderCourses builds from
    // client-side course data).
    if (typeof goToCourses === 'function') { try { goToCourses(); } catch (_) {} }
    var s = document.getElementById('navSearch');
    if (!s) return;
    s.value = q;
    // renderCourses() is async; keep retrying until the grid has cards, then
    // fire the input handler that does the filtering.
    var tries = 0;
    (function tick() {
      var grid = document.getElementById('coursesGrid');
      if (grid && grid.querySelector('.course-card')) {
        s.dispatchEvent(new Event('input', { bubbles: true }));
      } else if (tries++ < 40) {
        setTimeout(tick, 100);
      }
    })();
  }

  // Run once auth routing has settled so it isn't immediately overridden.
  if (document.readyState === 'complete') setTimeout(apply, 600);
  else window.addEventListener('load', function () { setTimeout(apply, 600); });
})();
