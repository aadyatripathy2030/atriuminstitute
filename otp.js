// Six-box code entry, used by sign-in and the admin unlock (same design as
// ChartGauge's /verify page). Each digit gets its own box; the first box
// takes the phone's one-time-code autofill and a paste anywhere fills all
// six. The original <input> stays in the page, hidden, and always holds the
// whole code, so form code that reads input.value keeps working.
//
// States, each with its own look (set on .otp[data-state]): idle, typing,
// verifying (a wave across the boxes), error (a shake, red), success (green,
// box by box, then a check mark) and sent (a new code went out).
(function () {
  const lessMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function mount(input, opts = {}) {
    if (!input || input._otp) return input && input._otp;
    const label = opts.label || '6-digit code';
    const wrap = document.createElement('div');
    wrap.className = 'otp-wrap';
    wrap.innerHTML =
      '<div class="otp-done" aria-hidden="true"><svg viewBox="0 0 96 96" width="88" height="88">' +
      '<circle class="otp-ring" cx="48" cy="48" r="44"/><path class="otp-tick" d="M30 49.5l12 12 24-26"/></svg></div>' +
      `<div class="otp" data-state="idle" role="group" aria-label="${label}"></div>`;
    const row = wrap.querySelector('.otp');
    const boxes = [];
    for (let i = 0; i < 6; i++) {
      const b = document.createElement('input');
      b.className = 'otp-box';
      b.type = 'text';
      b.inputMode = 'numeric';
      b.pattern = '[0-9]*';
      b.autocomplete = i === 0 ? 'one-time-code' : 'off';
      b.setAttribute('aria-label', `Digit ${i + 1} of 6`);
      row.appendChild(b);
      boxes.push(b);
    }
    input.insertAdjacentElement('beforebegin', wrap);
    input.type = 'hidden';
    input.removeAttribute('required');

    const value = () => boxes.map(b => b.value).join('');
    const state = st => { row.dataset.state = st; };
    const sync = () => { input.value = value(); state(input.value.length ? 'typing' : 'idle'); };
    function setBox(b, d) {
      const had = b.value;
      b.value = d; b.dataset.v = d;
      b.classList.toggle('filled', !!d);
      if (d && d !== had && !lessMotion()) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    }
    function clear() { boxes.forEach(b => { setBox(b, ''); b.classList.remove('pop'); }); input.value = ''; }
    let busy = false;
    function maybeSubmit() {
      if (value().length === 6 && !busy && opts.onComplete) opts.onComplete(value());
    }
    // Several digits at once (paste, or autofill into one box): a whole code
    // fills from the first box, a part from where it landed.
    function spread(digits, from) {
      digits = digits.replace(/\D/g, '');
      if (!digits) return;
      const start = digits.length >= 6 ? 0 : from;
      digits.slice(0, 6 - start).split('').forEach((d, k) => setBox(boxes[start + k], d));
      sync();
      boxes[Math.min(start + digits.length, 5)].focus();
      maybeSubmit();
    }
    function clearErrorLook() {
      if (row.dataset.state === 'error' || row.dataset.state === 'sent') { sync(); if (opts.onEdit) opts.onEdit(); }
    }
    boxes.forEach((b, i) => {
      b.addEventListener('focus', () => { try { b.select(); } catch (e) { /* ignore */ } });
      b.addEventListener('keydown', e => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (/^[0-9]$/.test(e.key)) {
          e.preventDefault(); clearErrorLook();
          setBox(b, e.key); sync();
          if (i < 5) boxes[i + 1].focus();
          maybeSubmit();
        } else if (e.key === 'Backspace') {
          e.preventDefault(); clearErrorLook();
          if (b.value) setBox(b, '');
          else if (i > 0) { setBox(boxes[i - 1], ''); boxes[i - 1].focus(); }
          sync();
        } else if (e.key === 'Delete') { e.preventDefault(); setBox(b, ''); sync(); }
        else if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); boxes[i - 1].focus(); }
        else if (e.key === 'ArrowRight' && i < 5) { e.preventDefault(); boxes[i + 1].focus(); }
        else if (e.key === 'Enter') { /* let the form submit */ }
        else if (e.key.length === 1) e.preventDefault(); // letters never land
      });
      // Keyboards that don't report keys (many phones), autofill and paste.
      b.addEventListener('input', () => {
        clearErrorLook();
        const prev = b.dataset.v || '';
        let digits = b.value.replace(/\D/g, '');
        if (digits.length === 2 && prev) digits = digits.replace(prev, '') || digits.slice(-1);
        if (digits.length > 1) { b.value = prev; spread(digits, i); return; }
        setBox(b, digits); sync();
        if (digits && i < 5) boxes[i + 1].focus();
        maybeSubmit();
      });
      b.addEventListener('paste', e => {
        const t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '');
        e.preventDefault(); clearErrorLook();
        if (t) spread(t, i);
      });
    });

    const api = {
      value,
      clear() { clear(); wrap.classList.remove('done'); state('idle'); },
      focus() { const n = boxes.find(b => !b.value) || boxes[5]; setTimeout(() => n.focus(), 30); },
      setBusy(v) { busy = v; boxes.forEach(b => { b.readOnly = v; }); },
      verifying() { state('verifying'); },
      // Shake red, then clear the wrong digits for another try.
      error() {
        state('idle'); void row.offsetWidth; state('error');
        setTimeout(() => { if (row.dataset.state === 'error') { clear(); boxes[0].focus(); } }, 650);
      },
      // A new code went out: one soft flash across the row.
      sent() { clear(); state('idle'); void row.offsetWidth; state('sent'); boxes[0].focus(); },
      // Green box by box, then the row folds into a check mark. Resolves when
      // the animation has played, so the caller can move on.
      async success() {
        const calm = lessMotion();
        state('success');
        await wait(calm ? 150 : 550);
        wrap.classList.add('done');
        await wait(calm ? 600 : 1000);
      },
      reset() { this.clear(); },
      el: wrap,
    };
    input._otp = api;
    return api;
  }

  window.AtriumOTP = { mount };
})();
