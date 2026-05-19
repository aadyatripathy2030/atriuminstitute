// PhotoAtrium: scan a math problem with the phone camera (or file
// upload), get a Photomath-style step-by-step solution, and keep a
// history of every solve. Three views:
//   - photoAtriumScannerPage  (live camera + tap-to-capture + file fallback)
//   - photoAtriumResultPage   (problem + answer + collapsible steps)
//   - photoAtriumListPage     (history grid)
//
// The floating FAB (📸) opens the scanner. Live camera uses getUserMedia;
// the file-input fallback uses capture="environment" so phones open the
// camera app directly.

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // ---------- Image capture + compression ----------

  let mediaStream = null;

  async function startCamera() {
    const video = el('paCameraVideo');
    if (!video) return;
    stopCamera();
    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      video.srcObject = mediaStream;
      await video.play();
      el('paCameraError').classList.add('hidden');
    } catch (e) {
      el('paCameraError').textContent = `Camera unavailable: ${e.message}. Use the "Pick a photo" button below.`;
      el('paCameraError').classList.remove('hidden');
    }
  }

  function stopCamera() {
    if (mediaStream) {
      mediaStream.getTracks().forEach(t => t.stop());
      mediaStream = null;
    }
    const video = el('paCameraVideo');
    if (video) video.srcObject = null;
  }

  // Resize an image dataURL down to maxSize on the longest edge, JPEG q.
  function compressDataUrl(dataUrl, maxSize, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
        const w = Math.round(img.width * ratio);
        const h = Math.round(img.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function captureFromVideo() {
    const video = el('paCameraVideo');
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.92);
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ---------- Top-level navigation ----------

  // True for mouse-first devices (laptops, desktops, large monitors).
  // matchMedia('(pointer: coarse)') is true on phones / tablets with a
  // touchscreen as primary input. The negation isolates "the user is on
  // a real computer" so we can warn them PhotoAtrium is built for phones.
  function isDesktopPointer() {
    try {
      return window.matchMedia('(pointer: fine)').matches
          && !window.matchMedia('(pointer: coarse)').matches;
    } catch (_e) {
      // No matchMedia (old browser). Fall back to a screen-size check.
      return (window.innerWidth || 0) >= 1024;
    }
  }

  // Called by the FAB. On phones / tablets we go straight to the
  // scanner. On desktop we show the "PhotoAtrium works best on a phone"
  // confirmation first — Cancel aborts, Continue anyway opens the
  // scanner (which will fall back to the file-picker if the desktop
  // has no usable camera).
  function handleFabClick() {
    if (isDesktopPointer()) {
      showDesktopWarn();
    } else {
      openScanner();
    }
  }

  function showDesktopWarn() {
    const overlay = el('paDesktopWarn');
    if (!overlay) { openScanner(); return; }
    overlay.setAttribute('aria-hidden', 'false');
    overlay.classList.remove('hidden');
  }
  function hideDesktopWarn() {
    const overlay = el('paDesktopWarn');
    if (!overlay) return;
    overlay.setAttribute('aria-hidden', 'true');
    overlay.classList.add('hidden');
  }

  function openScanner() {
    hideDesktopWarn();
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('photoAtriumScannerPage'));
    window.scrollTo({ top: 0 });
    startCamera();
  }

  function closeScanner() {
    stopCamera();
    hide(el('photoAtriumScannerPage'));
    if (typeof window.goHome === 'function') window.goHome();
  }

  async function openList() {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('photoAtriumListPage'));
    window.scrollTo({ top: 0 });
    const grid = el('paListGrid');
    grid.innerHTML = '<div class="parent-empty">Loading…</div>';
    try {
      const r = await fetch('/api/photo-atrium/list', { credentials: 'same-origin' });
      const data = await r.json();
      const items = data.items || [];
      if (!items.length) {
        grid.innerHTML = `
          <div class="pa-list-empty">
            <div class="pa-list-empty-icon">📸</div>
            <h3>No solves yet</h3>
            <p>Tap the 📸 Snap &amp; Solve button to take a photo of your first math problem. Every solve is saved here automatically.</p>
            <button class="cta-primary" onclick="openPhotoScanner()">Snap a problem</button>
          </div>
        `;
        return;
      }
      grid.innerHTML = items.map(item => `
        <button class="pa-card" data-id="${esc(item.id)}">
          <div class="pa-card-thumb">${item.thumbnail_data
            ? `<img src="${esc(item.thumbnail_data)}" alt="Scanned problem">`
            : `<div class="pa-card-thumb-fallback">📝</div>`}</div>
          <div class="pa-card-body">
            <div class="pa-card-problem">${renderLatexInline(item.detected_problem)}</div>
            <div class="pa-card-meta">
              <span class="pa-tag pa-tag-${esc(item.subject || 'other')}">${esc(item.subject || 'other')}</span>
              <span class="pa-card-date">${formatDate(item.created_at)}</span>
            </div>
          </div>
        </button>
      `).join('');
      // Typeset math previews.
      if (typeof window.typesetMath === 'function') {
        try { window.typesetMath(grid); } catch (_e) {}
      }
      grid.querySelectorAll('.pa-card').forEach(card => {
        card.addEventListener('click', () => openResult(card.dataset.id));
      });
    } catch (e) {
      grid.innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
    }
  }

  async function openResult(id) {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('photoAtriumResultPage'));
    window.scrollTo({ top: 0 });
    const wrap = el('paResultContent');
    wrap.innerHTML = '<div class="parent-empty">Loading…</div>';
    el('paResultMeta').dataset.id = id;
    try {
      const r = await fetch(`/api/photo-atrium/${encodeURIComponent(id)}`, { credentials: 'same-origin' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      renderResult(data.parsed, data.item);
    } catch (e) {
      wrap.innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
    }
  }

  // ---------- Solve flow ----------

  let lastSolve = null; // { id, parsed }

  async function doSolve(rawDataUrl) {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('photoAtriumResultPage'));
    window.scrollTo({ top: 0 });
    stopCamera();

    const wrap = el('paResultContent');
    wrap.innerHTML = `
      <div class="pa-solving">
        <div class="pa-solving-thumb"><img src="${esc(rawDataUrl)}" alt="Scanned problem"></div>
        <div class="pa-solving-text">
          <div class="pa-spinner"></div>
          <h2>Reading the problem…</h2>
          <p>Max is reading the photo and writing the solution. This usually takes 10-20 seconds.</p>
        </div>
      </div>
    `;

    try {
      // Compress the captured image down before upload. Solve image is
      // sent at 1280px / q0.7 (~150KB). Thumbnail kept for the list view
      // is 200px / q0.55 (~5-15KB).
      const solveImg = await compressDataUrl(rawDataUrl, 1280, 0.7);
      const thumbImg = await compressDataUrl(rawDataUrl, 200, 0.55);

      const r = await fetch('/api/photo-atrium/solve', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: solveImg,
          thumbnailDataUrl: thumbImg,
        }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        const msg = data.message || data.error || 'Could not solve this image.';
        wrap.innerHTML = `
          <div class="pa-error">
            <div class="pa-error-icon">😕</div>
            <h3>Couldn't read that one</h3>
            <p>${esc(msg)}</p>
            <div class="pa-error-actions">
              <button class="cta-secondary" onclick="openPhotoScanner()">Try again</button>
            </div>
          </div>
        `;
        return;
      }
      lastSolve = { id: data.id, parsed: data.parsed, created_at: data.created_at };
      el('paResultMeta').dataset.id = data.id;
      renderResult(data.parsed, { id: data.id, created_at: data.created_at, thumbnail_data: thumbImg });
      // Reward toast
      if (typeof window.showPointToast === 'function') {
        window.showPointToast(10, 'Snap & Solve', { icon: '📸' });
      }
      if (typeof window.checkForNewBadges === 'function') {
        setTimeout(window.checkForNewBadges, 600);
      }
    } catch (e) {
      wrap.innerHTML = `<div class="pa-error"><div class="pa-error-icon">⚠️</div><h3>Network error</h3><p>${esc(e.message)}</p><button class="cta-secondary" onclick="openPhotoScanner()">Try again</button></div>`;
    }
  }

  // Re-solve when the user edits the recognised problem.
  async function reSolve(problemText) {
    const wrap = el('paResultContent');
    wrap.innerHTML = `<div class="pa-solving"><div class="pa-solving-text"><div class="pa-spinner"></div><h2>Solving your edit…</h2></div></div>`;
    try {
      const r = await fetch('/api/photo-atrium/re-solve', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problemText }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) {
        wrap.innerHTML = `<div class="pa-error"><h3>Could not solve</h3><p>${esc(data.error || 'Unknown error')}</p></div>`;
        return;
      }
      lastSolve = { id: data.id, parsed: data.parsed, created_at: data.created_at };
      el('paResultMeta').dataset.id = data.id;
      renderResult(data.parsed, { id: data.id, created_at: data.created_at, thumbnail_data: null });
    } catch (e) {
      wrap.innerHTML = `<div class="pa-error"><h3>Network error</h3><p>${esc(e.message)}</p></div>`;
    }
  }

  // ---------- Rendering ----------

  function renderResult(parsed, item) {
    const wrap = el('paResultContent');
    if (!parsed) {
      wrap.innerHTML = '<div class="pa-error"><h3>Empty result</h3></div>';
      return;
    }
    const subj = parsed.subject || 'other';
    const dateText = item && item.created_at ? formatDate(item.created_at) : '';
    const thumbHtml = item && item.thumbnail_data
      ? `<img class="pa-result-thumb" src="${esc(item.thumbnail_data)}" alt="Scanned problem">` : '';

    const methodsHtml = (parsed.methods || []).map((m, i) => `
      <details class="pa-method" ${i === 0 ? 'open' : ''}>
        <summary>${esc(m.name || `Method ${i + 1}`)}</summary>
        <ol class="pa-steps">
          ${(m.steps || []).map(s => `
            <li class="pa-step">
              <div class="pa-step-eq">${renderLatexBlock(s.eq)}</div>
              <details class="pa-step-why">
                <summary>Why this step?</summary>
                <div class="pa-step-why-body">${esc(s.why)}</div>
              </details>
            </li>
          `).join('')}
        </ol>
      </details>
    `).join('');

    wrap.innerHTML = `
      <div class="pa-result-head">
        ${thumbHtml}
        <div class="pa-result-meta">
          <span class="pa-tag pa-tag-${esc(subj)}">${esc(subj)}</span>
          ${dateText ? `<span class="pa-result-date">${dateText}</span>` : ''}
        </div>
      </div>

      <section class="pa-problem-block">
        <div class="pa-block-label">Problem</div>
        <div class="pa-problem-eq">${renderLatexBlock(parsed.problem)}</div>
        <details class="pa-edit-wrap">
          <summary>Not quite right? Edit and re-solve</summary>
          <textarea class="pa-edit-input" rows="2" placeholder="Type the corrected LaTeX">${esc(parsed.problem)}</textarea>
          <button class="cta-secondary pa-edit-btn" type="button">Re-solve</button>
        </details>
      </section>

      <section class="pa-answer-block">
        <div class="pa-block-label">Answer</div>
        <div class="pa-answer-eq">${renderLatexBlock(parsed.answer || '(no final answer)')}</div>
      </section>

      ${parsed.illustration ? `<section class="pa-illustration">${parsed.illustration}</section>` : ''}

      <section class="pa-steps-block">
        <div class="pa-block-label">Step-by-step</div>
        ${methodsHtml || '<div class="parent-empty">No steps were generated.</div>'}
      </section>

      ${parsed.note ? `<section class="pa-note"><strong>Note:</strong> ${esc(parsed.note)}</section>` : ''}

      <div class="pa-result-actions">
        <button class="cta-secondary" id="paAnotherBtn" type="button">📸 Snap another</button>
        <button class="cta-link" id="paHistoryBtn" type="button">📜 See history</button>
        <button class="pa-delete-btn" id="paDeleteBtn" type="button">🗑 Delete</button>
      </div>
    `;

    // Wire dynamic buttons.
    const editBtn = wrap.querySelector('.pa-edit-btn');
    if (editBtn) editBtn.addEventListener('click', () => {
      const ta = wrap.querySelector('.pa-edit-input');
      const txt = (ta && ta.value || '').trim();
      if (txt) reSolve(txt);
    });
    wrap.querySelector('#paAnotherBtn').addEventListener('click', openScanner);
    wrap.querySelector('#paHistoryBtn').addEventListener('click', openList);
    wrap.querySelector('#paDeleteBtn').addEventListener('click', deleteCurrentSolve);

    if (typeof window.typesetMath === 'function') {
      try { window.typesetMath(wrap); } catch (_e) {}
    }
  }

  async function deleteCurrentSolve() {
    const id = el('paResultMeta').dataset.id;
    if (!id) return;
    if (!confirm('Delete this solve from your Snap & Solve history?')) return;
    try {
      const r = await fetch(`/api/photo-atrium/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      openList();
    } catch (e) {
      alert('Could not delete: ' + e.message);
    }
  }

  // ---------- LaTeX rendering helpers ----------
  // Wrap LaTeX in \(...\) (inline) or \[...\] (block) so MathJax / our
  // in-house renderer picks it up. If the text already contains $ or
  // bracket delimiters, pass through.
  function renderLatexInline(latex) {
    const t = String(latex || '').trim();
    if (!t) return '';
    if (/^\\\(|\\\[|\$/.test(t)) return esc(t);
    return `\\(${esc(t)}\\)`;
  }
  function renderLatexBlock(latex) {
    const t = String(latex || '').trim();
    if (!t) return '';
    if (/^\\\(|\\\[|\$/.test(t)) return esc(t);
    return `\\[${esc(t)}\\]`;
  }

  function formatDate(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (_e) { return ''; }
  }

  // ---------- Wiring ----------

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;

    // FAB
    const fab = el('photoAtriumFab');
    if (fab) fab.addEventListener('click', handleFabClick);

    // Desktop "best on phone" confirmation
    const dCancel = el('paDesktopCancel');
    const dContinue = el('paDesktopContinue');
    const dUpload = el('paDesktopUpload');
    const dFile = el('paDesktopFileInput');
    if (dCancel) dCancel.addEventListener('click', hideDesktopWarn);
    if (dContinue) dContinue.addEventListener('click', openScanner);
    // "Upload an image" opens the OS file picker without going through
    // the camera-first scanner page. Saves desktop users a step.
    if (dUpload && dFile) {
      dUpload.addEventListener('click', () => dFile.click());
      dFile.addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0];
        e.target.value = '';
        if (!f) return;
        hideDesktopWarn();
        try {
          const data = await readFileAsDataURL(f);
          await doSolve(data);
        } catch (err) {
          alert('Could not read that image: ' + (err && err.message || err));
        }
      });
    }
    // Click on the dim backdrop also dismisses.
    const dOverlay = el('paDesktopWarn');
    if (dOverlay) dOverlay.addEventListener('click', (e) => {
      if (e.target === dOverlay) hideDesktopWarn();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && dOverlay && !dOverlay.classList.contains('hidden')) {
        hideDesktopWarn();
      }
    });

    // Scanner controls
    const shutter = el('paShutterBtn');
    if (shutter) shutter.addEventListener('click', async () => {
      const data = captureFromVideo();
      if (!data) return;
      await doSolve(data);
    });
    const filePicker = el('paFileInput');
    if (filePicker) filePicker.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const data = await readFileAsDataURL(f);
      e.target.value = '';
      await doSolve(data);
    });
    const closeBtn = el('paScannerClose');
    if (closeBtn) closeBtn.addEventListener('click', closeScanner);

    // Result page back / scan-another wiring
    const backBtn = el('paResultBack');
    if (backBtn) backBtn.addEventListener('click', openList);

    // List page back + scan button
    const listBack = el('paListBack');
    if (listBack) listBack.addEventListener('click', () => {
      hide(el('photoAtriumListPage'));
      if (typeof window.goHome === 'function') window.goHome();
    });
    const listScan = el('paListScanBtn');
    if (listScan) listScan.addEventListener('click', openScanner);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else {
    wireOnce();
  }

  window.openPhotoScanner = openScanner;
  window.openPhotoAtriumList = openList;
  window.openPhotoAtriumResult = openResult;
})();
