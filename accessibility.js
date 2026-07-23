// Accessibility controls: read-aloud (text-to-speech), adjustable text size,
// and a dyslexia-friendly font. All client-side, persisted to localStorage,
// mirroring the dark-mode pattern in app.js. Self-initialising and independent
// of the rest of the app so a failure here can't break navigation or lessons.
(function () {
  var ZOOM_KEY = 'atrium_a11y_zoom_v1';
  var FONT_KEY = 'atrium_a11y_font_v1';
  var ZOOMS = [0.9, 1, 1.1, 1.25, 1.4];
  var root = document.documentElement;

  // ---- Apply saved settings immediately (before DOMContentLoaded) to cut FOUC.
  var savedZoom = parseFloat(localStorage.getItem(ZOOM_KEY)) || 1;
  applyZoom(savedZoom);
  if (localStorage.getItem(FONT_KEY) === 'dyslexic') root.setAttribute('data-a11y-font', 'dyslexic');

  function applyZoom(z) {
    // `zoom` scales the whole (px-based) UI reliably across modern browsers.
    root.style.zoom = z === 1 ? '' : String(z);
  }
  function nearestZoomIndex(z) {
    var best = 1, d = Infinity;
    for (var i = 0; i < ZOOMS.length; i++) {
      var dd = Math.abs(ZOOMS[i] - z);
      if (dd < d) { d = dd; best = i; }
    }
    return best;
  }

  function init() {
    var toggle = document.getElementById('a11yToggle');
    var menu = document.getElementById('a11yMenu');
    if (!toggle || !menu) return;

    var speakBtn = document.getElementById('a11ySpeak');
    var upBtn = document.getElementById('a11yFontUp');
    var downBtn = document.getElementById('a11yFontDown');
    var sizeVal = document.getElementById('a11yFontVal');
    var dysBtn = document.getElementById('a11yDyslexia');
    var resetBtn = document.getElementById('a11yReset');

    var zoomIdx = nearestZoomIndex(savedZoom);

    function syncSize() {
      var z = ZOOMS[zoomIdx];
      applyZoom(z);
      if (sizeVal) sizeVal.textContent = Math.round(z * 100) + '%';
      localStorage.setItem(ZOOM_KEY, String(z));
    }
    function syncDys() {
      var on = root.getAttribute('data-a11y-font') === 'dyslexic';
      if (dysBtn) { dysBtn.textContent = on ? 'On' : 'Off'; dysBtn.setAttribute('aria-checked', on ? 'true' : 'false'); }
    }
    syncSize(); syncDys();

    // ---- Popover open/close
    function openMenu() { menu.classList.remove('hidden'); toggle.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { menu.classList.add('hidden'); toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', function (e) {
      e.stopPropagation();
      if (menu.classList.contains('hidden')) openMenu(); else closeMenu();
    });
    menu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); stopSpeech(); } });

    // ---- Text size
    if (upBtn) upBtn.addEventListener('click', function () { if (zoomIdx < ZOOMS.length - 1) { zoomIdx++; syncSize(); } });
    if (downBtn) downBtn.addEventListener('click', function () { if (zoomIdx > 0) { zoomIdx--; syncSize(); } });

    // ---- Dyslexia font
    if (dysBtn) dysBtn.addEventListener('click', function () {
      var on = root.getAttribute('data-a11y-font') === 'dyslexic';
      if (on) { root.removeAttribute('data-a11y-font'); localStorage.setItem(FONT_KEY, 'default'); }
      else { root.setAttribute('data-a11y-font', 'dyslexic'); localStorage.setItem(FONT_KEY, 'dyslexic'); }
      syncDys();
    });

    // ---- Reset
    if (resetBtn) resetBtn.addEventListener('click', function () {
      zoomIdx = nearestZoomIndex(1); syncSize();
      root.removeAttribute('data-a11y-font'); localStorage.setItem(FONT_KEY, 'default'); syncDys();
      stopSpeech();
    });

    // ---- Read aloud (Web Speech API)
    var speaking = false;
    var synth = window.speechSynthesis;

    function getReadableText() {
      // Pick the first visible top-level view and read its text.
      var ids = ['detail', 'study', 'courses-home', 'home', 'landing',
                 'about', 'whyAtrium', 'faq', 'profilePage', 'curriculumPage'];
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el && !el.classList.contains('hidden') && el.offsetParent !== null) {
          var t = (el.innerText || '').replace(/\s+\n/g, '\n').trim();
          if (t) return t.slice(0, 8000); // keep within engine limits
        }
      }
      return '';
    }
    function setSpeakLabel() { if (speakBtn) speakBtn.textContent = speaking ? '⏹ Stop' : '▶ Read aloud'; }
    function stopSpeech() { if (synth) synth.cancel(); speaking = false; setSpeakLabel(); }

    if (!synth) { if (speakBtn) { speakBtn.disabled = true; speakBtn.textContent = 'Not supported'; } }
    else if (speakBtn) {
      speakBtn.addEventListener('click', function () {
        if (speaking) { stopSpeech(); return; }
        var text = getReadableText();
        if (!text) { speakBtn.textContent = 'Nothing to read'; setTimeout(setSpeakLabel, 1200); return; }
        var u = new SpeechSynthesisUtterance(text);
        u.rate = 1; u.pitch = 1;
        u.onend = function () { speaking = false; setSpeakLabel(); };
        u.onerror = function () { speaking = false; setSpeakLabel(); };
        synth.cancel();
        synth.speak(u);
        speaking = true; setSpeakLabel();
      });
    }
    // Stop narration whenever the user navigates away.
    window.addEventListener('beforeunload', stopSpeech);
    setSpeakLabel();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
