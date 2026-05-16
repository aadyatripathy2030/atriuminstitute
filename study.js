// Study Methods panel: descriptions + interactive widgets (Pomodoro, spaced-rep dates, recall timer).

(function() {
  const METHODS = [
    {
      title: 'Active Recall',
      body: `<p>Instead of re-reading notes, force your brain to retrieve information. Close your book, grab a blank sheet, and write down everything you can remember on the topic. Check what you missed, and repeat until you can recall it accurately.</p>`,
      widget: 'recall'
    },
    {
      title: 'Spaced Repetition',
      body: `<p>Don't cram. Spread studying over days or weeks. Review new material after 1 day, 3 days, 1 week, then 1 month. This catches your brain right as it's about to forget — moving knowledge into long-term memory.</p>`,
      widget: 'sr'
    },
    {
      title: 'The Feynman Technique',
      body: `<p>Simplify complex topics by breaking them down into plain, conversational language. Pick a topic, then write an explanation as if you were teaching a beginner. Where you struggle to explain it is exactly what you need to study more.</p>
             <p style="font-size:12.5px;color:var(--muted)"><b>Steps:</b> 1) Pick a concept. 2) Teach it to a 12-year-old in plain English. 3) Find the gaps in your explanation. 4) Go back, fix them, simplify again.</p>`
    },
    {
      title: 'The Pomodoro Technique',
      body: `<p>Beat burnout by working in focused bursts. Study with zero distractions for 25 minutes, then take a 5-minute break. After four cycles, take a longer break of 15–30 minutes.</p>`,
      widget: 'pomo'
    },
    {
      title: 'Past Papers & Practice Tests',
      body: `<p>Nothing prepares you for an exam like testing yourself on previous years' exams. This familiarizes you with the exact question formats, timing, and reasoning the examiners expect.</p>
             <p style="font-size:12.5px;color:var(--muted)"><b>Tip:</b> Atrium's Cumulative Tests at the end of each book act like timed practice papers — take them under exam conditions.</p>`
    },
    {
      title: 'The Cornell Note-Taking System',
      body: `<p>Divide your paper into three sections: a narrow left column for cues/keywords, a wide right column for detailed notes, and a bottom section for a brief summary. This forces you to synthesize ideas instead of just transcribing.</p>
             <pre style="font-family:ui-monospace,monospace;font-size:11px;background:var(--card-hi);padding:10px;border-radius:8px;border:1px solid var(--border);margin:8px 0 0 0">┌──────┬──────────────────┐
│ Cues │     Notes        │
│      │                  │
│      │                  │
├──────┴──────────────────┤
│      Summary            │
└─────────────────────────┘</pre>`
    },
    {
      title: 'Interleaved Practice',
      body: `<p>Don't spend hours on one subject. Mix different subjects or problem types in a single session. This prevents your brain from settling into repetitive patterns and dramatically improves problem-solving across topics.</p>
             <p style="font-size:12.5px;color:var(--muted)"><b>Try:</b> Alternate algebra → geometry → algebra → English. Even within math, mix problem types from different sections.</p>`
    },
    {
      title: 'Mind Mapping',
      body: `<p>Use visual aids — colors, doodles, diagrams — to represent key points. This leverages "dual coding" (verbal + visual), proven to improve memory retention. Free tools like Miro and Whimsical work well for digital maps.</p>`
    },
    {
      title: 'Mnemonics & Acronyms',
      body: `<p>Create memory aids that anchor complex facts to something simple. Examples: <b>PEMDAS</b> for order of operations; <b>HOMES</b> for the Great Lakes (Huron, Ontario, Michigan, Erie, Superior); <b>FANBOYS</b> for coordinating conjunctions. Sound, visualization, and association make facts stick.</p>`
    },
    {
      title: 'The SQ3R Method',
      body: `<p>A comprehensive reading-comprehension routine:</p>
             <p style="font-size:13px;margin:0;line-height:1.7">
               <b>S</b>urvey — scan headings, graphics, key terms.<br>
               <b>Q</b>uestion — form questions the text might answer.<br>
               <b>R</b>ead — read actively, looking for answers.<br>
               <b>R</b>ecite — summarize the information in your own words.<br>
               <b>R</b>eview — go over the material again to lock it in.
             </p>`
    }
  ];

  function topicPickerHTML(idx, methodTitle) {
    if (typeof COURSES === 'undefined') return '';
    const courseOpts = Object.entries(COURSES).map(([id, c]) =>
      `<option value="${id}">${c.title}</option>`).join('');
    return `<div class="topic-picker">
      <div class="picker-label">📖 Study a topic with this method:</div>
      <select class="picker-select course-select" data-idx="${idx}">${courseOpts}</select>
      <select class="picker-select book-select" data-idx="${idx}"></select>
      <button class="start-method-btn" data-idx="${idx}" data-method="${methodTitle.replace(/"/g, '&quot;')}">Start with Diego →</button>
    </div>`;
  }

  function fillBooks(idx) {
    const courseSel = document.querySelector(`.course-select[data-idx="${idx}"]`);
    const bookSel = document.querySelector(`.book-select[data-idx="${idx}"]`);
    if (!courseSel || !bookSel) return;
    const course = COURSES[courseSel.value];
    bookSel.innerHTML = course.books.map(b =>
      `<option value="${b.id}">${b.emoji || ''} ${b.title}</option>`).join('');
  }

  function initTopicPickers() {
    if (typeof COURSES === 'undefined') return;
    document.querySelectorAll('.course-select').forEach(sel => {
      const idx = sel.getAttribute('data-idx');
      fillBooks(idx);
      sel.addEventListener('change', () => fillBooks(idx));
    });
    document.querySelectorAll('.start-method-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = btn.getAttribute('data-idx');
        const method = btn.getAttribute('data-method');
        const courseSel = document.querySelector(`.course-select[data-idx="${idx}"]`);
        const bookSel = document.querySelector(`.book-select[data-idx="${idx}"]`);
        const course = COURSES[courseSel.value];
        const book = course.books.find(b => b.id === bookSel.value);
        if (!book) return;
        const sectionsList = book.sections.map((s, i) => `${i+1}. ${s.title}`).join('\n');
        const msg =
`I'd like to use the **${method}** method to study **${course.title} → ${book.title}**.

The sections in this topic are:
${sectionsList}

Which section should we focus on? Once I pick, please walk me through it using the ${method} method.`;
        document.getElementById('studyPanel').classList.remove('open');
        if (typeof openChat === 'function') openChat();
        const input = document.getElementById('chatInput');
        if (input) {
          input.value = msg;
          input.focus();
          input.dispatchEvent(new Event('input'));
          // Auto-send so Diego responds and asks which section.
          if (typeof sendChat === 'function') sendChat();
        }
      });
    });
  }

  function widgetHTML(kind) {
    if (kind === 'pomo') {
      const s = loadPomoSettings();
      return `<div class="pomo" id="pomoWidget">
        <div class="pomo-phase" id="pomoPhase">FOCUS</div>
        <div class="pomo-time" id="pomoTime">25:00</div>
        <div class="pomo-controls">
          <button class="pomo-btn primary" id="pomoStart">Start</button>
          <button class="pomo-btn" id="pomoReset">Reset</button>
          <button class="pomo-btn" id="pomoSkip">Skip</button>
        </div>
        <div class="pomo-meta" id="pomoMeta">Cycle 1 of 4 · next: 5 min break</div>
        <details class="pomo-settings">
          <summary>⚙️ Customize durations</summary>
          <div class="pomo-settings-row">
            <label>Focus<input type="number" min="1" max="180" id="pomoSetFocus" value="${s.focus}"> min</label>
            <label>Short break<input type="number" min="1" max="60" id="pomoSetShort" value="${s.short}"> min</label>
            <label>Long break<input type="number" min="1" max="120" id="pomoSetLong" value="${s.long}"> min</label>
            <label>Cycles before long<input type="number" min="1" max="10" id="pomoSetCycles" value="${s.cycles}"></label>
          </div>
          <button class="pomo-btn primary" id="pomoSaveSettings">Save & reset</button>
        </details>
      </div>`;
    }
    if (kind === 'sr') {
      const today = new Date().toISOString().slice(0,10);
      return `<div class="sr-widget">
        <div class="sr-input">
          <label for="srDate">Studied on:</label>
          <input type="date" id="srDate" value="${today}">
        </div>
        <div class="sr-dates" id="srDates"></div>
      </div>`;
    }
    if (kind === 'recall') {
      return `<div class="recall-widget">
        <div class="recall-time" id="recallTime">5:00</div>
        <div class="recall-btns">
          <button class="pomo-btn primary" id="recallStart">Start 5-min recall</button>
          <button class="pomo-btn" id="recallReset">Reset</button>
        </div>
        <div class="pomo-meta">Write everything you remember. No peeking.</div>
      </div>`;
    }
    return '';
  }

  function renderPanel() {
    const body = document.getElementById('studyBody');
    body.innerHTML = METHODS.map((m, i) => `
      <div class="method-card" data-idx="${i}">
        <div class="method-head">
          <div class="method-num">${i+1}</div>
          <div class="method-title">${m.title}</div>
          <div class="method-toggle">›</div>
        </div>
        <div class="method-body">
          ${m.body}
          ${m.widget ? widgetHTML(m.widget) : ''}
          ${topicPickerHTML(i, m.title)}
          <button class="ask-diego-btn" data-method="${m.title.replace(/"/g, '&quot;')}">💬 Ask Diego for questions</button>
        </div>
      </div>
    `).join('');

    body.querySelectorAll('.ask-diego-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const methodName = btn.getAttribute('data-method');
        document.getElementById('studyPanel').classList.remove('open');
        if (typeof openChat === 'function') openChat();
        const input = document.getElementById('chatInput');
        if (input) {
          input.value = `Can you give me a few practice questions to try the ${methodName} method?`;
          input.focus();
          input.dispatchEvent(new Event('input'));
        }
      });
    });

    initTopicPickers();

    body.querySelectorAll('.method-head').forEach(head => {
      head.addEventListener('click', () => {
        const card = head.parentElement;
        const wasOpen = card.classList.contains('open');
        // Close all
        body.querySelectorAll('.method-card.open').forEach(c => c.classList.remove('open'));
        if (!wasOpen) card.classList.add('open');
      });
    });

    initPomodoro();
    initSpacedRep();
    initRecall();
  }

  // ---------- POMODORO ----------
  const POMO_SETTINGS_KEY = 'atrium_pomo_settings_v1';
  function loadPomoSettings() {
    try {
      const s = JSON.parse(localStorage.getItem(POMO_SETTINGS_KEY)) || {};
      return {
        focus:  Number(s.focus)  > 0 ? Number(s.focus)  : 25,
        short:  Number(s.short)  > 0 ? Number(s.short)  : 5,
        long:   Number(s.long)   > 0 ? Number(s.long)   : 20,
        cycles: Number(s.cycles) > 0 ? Number(s.cycles) : 4
      };
    } catch { return { focus: 25, short: 5, long: 20, cycles: 4 }; }
  }
  function savePomoSettings(s) { localStorage.setItem(POMO_SETTINGS_KEY, JSON.stringify(s)); }

  function pomoPhases() {
    const s = loadPomoSettings();
    return [
      { name: 'FOCUS', label: 'FOCUS',       seconds: s.focus * 60, cls: '' },
      { name: 'BREAK', label: 'SHORT BREAK', seconds: s.short * 60, cls: 'break' },
      { name: 'LONG',  label: 'LONG BREAK',  seconds: s.long  * 60, cls: 'long' }
    ];
  }

  let pomoState = { phaseIdx: 0, secondsLeft: loadPomoSettings().focus * 60, cycle: 1, running: false, tickId: null };

  function fmt(sec) {
    sec = Math.max(0, sec);
    const m = Math.floor(sec/60), s = sec%60;
    return `${m}:${String(s).padStart(2,'0')}`;
  }

  function pomoRender() {
    const phases = pomoPhases();
    const phase = phases[pomoState.phaseIdx];
    const settings = loadPomoSettings();
    // Panel display (may not exist if panel never opened)
    const timeEl = document.getElementById('pomoTime');
    if (timeEl) {
      const phaseEl = document.getElementById('pomoPhase');
      const startBtn = document.getElementById('pomoStart');
      const metaEl = document.getElementById('pomoMeta');
      timeEl.textContent = fmt(pomoState.secondsLeft);
      phaseEl.textContent = phase.label;
      phaseEl.className = 'pomo-phase ' + phase.cls;
      startBtn.textContent = pomoState.running ? 'Pause' : 'Start';
      let nextLabel;
      if (phase.name === 'FOCUS') {
        nextLabel = pomoState.cycle >= settings.cycles ? `${settings.long} min long break` : `${settings.short} min break`;
      } else {
        nextLabel = `${settings.focus} min focus`;
      }
      metaEl.textContent = `Cycle ${pomoState.cycle} of ${settings.cycles} · next: ${nextLabel}`;
    }
    // Always-visible chip
    const chip = document.getElementById('pomoChip');
    if (chip) {
      const active = pomoState.running || pomoState.secondsLeft < phase.seconds;
      chip.classList.toggle('hidden', !active);
      chip.classList.remove('break', 'long');
      if (phase.cls) chip.classList.add(phase.cls);
      chip.classList.toggle('paused', !pomoState.running);
      const cp = document.getElementById('pomoChipPhase');
      const ct = document.getElementById('pomoChipTime');
      if (cp) cp.textContent = phase.label;
      if (ct) ct.textContent = fmt(pomoState.secondsLeft);
    }
    document.title = pomoState.running
      ? `${fmt(pomoState.secondsLeft)} · ${phase.label} — Atrium Math`
      : 'Atrium Math';
  }

  function pomoAdvance() {
    const phases = pomoPhases();
    const settings = loadPomoSettings();
    const phase = phases[pomoState.phaseIdx];
    try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play().catch(()=>{}); } catch {}
    if (phase.name === 'FOCUS') {
      if (pomoState.cycle >= settings.cycles) {
        pomoState.phaseIdx = 2;
        pomoState.cycle = 1;
      } else {
        pomoState.phaseIdx = 1;
      }
    } else {
      if (phase.name === 'BREAK') pomoState.cycle++;
      pomoState.phaseIdx = 0;
    }
    pomoState.secondsLeft = pomoPhases()[pomoState.phaseIdx].seconds;
  }

  function pomoTick() {
    if (!pomoState.running) return;
    pomoState.secondsLeft--;
    if (pomoState.secondsLeft <= 0) pomoAdvance();
    pomoRender();
  }

  function pomoResetAll() {
    pomoState.running = false;
    clearInterval(pomoState.tickId);
    pomoState.phaseIdx = 0;
    pomoState.cycle = 1;
    pomoState.secondsLeft = loadPomoSettings().focus * 60;
    pomoRender();
  }

  function initPomodoro() {
    if (!document.getElementById('pomoStart')) return;
    document.getElementById('pomoStart').addEventListener('click', () => {
      pomoState.running = !pomoState.running;
      if (pomoState.running) {
        pomoState.tickId = setInterval(pomoTick, 1000);
      } else {
        clearInterval(pomoState.tickId);
      }
      pomoRender();
    });
    document.getElementById('pomoReset').addEventListener('click', pomoResetAll);
    document.getElementById('pomoSkip').addEventListener('click', () => { pomoAdvance(); pomoRender(); });
    const saveBtn = document.getElementById('pomoSaveSettings');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const focus  = parseInt(document.getElementById('pomoSetFocus').value, 10);
        const sh     = parseInt(document.getElementById('pomoSetShort').value, 10);
        const lng    = parseInt(document.getElementById('pomoSetLong').value, 10);
        const cyc    = parseInt(document.getElementById('pomoSetCycles').value, 10);
        savePomoSettings({
          focus: focus > 0 ? focus : 25,
          short: sh > 0 ? sh : 5,
          long:  lng > 0 ? lng : 20,
          cycles: cyc > 0 ? cyc : 4
        });
        pomoResetAll();
        saveBtn.textContent = 'Saved ✓';
        setTimeout(() => { saveBtn.textContent = 'Save & reset'; }, 1200);
      });
    }
    pomoRender();
  }

  // ---------- SPACED REPETITION ----------
  function srRender() {
    const dateEl = document.getElementById('srDate');
    const datesEl = document.getElementById('srDates');
    if (!dateEl || !datesEl) return;
    const base = new Date(dateEl.value);
    if (isNaN(base)) { datesEl.innerHTML = '<div class="sr-date">Invalid date</div>'; return; }
    const intervals = [
      { label: '1 day later', days: 1 },
      { label: '3 days later', days: 3 },
      { label: '1 week later', days: 7 },
      { label: '1 month later', days: 30 }
    ];
    const opts = { weekday: 'short', month: 'short', day: 'numeric' };
    datesEl.innerHTML = intervals.map(iv => {
      const d = new Date(base); d.setDate(d.getDate() + iv.days);
      return `<div class="sr-date"><b>${iv.label}</b>${d.toLocaleDateString(undefined, opts)}</div>`;
    }).join('');
  }

  function initSpacedRep() {
    const el = document.getElementById('srDate');
    if (!el) return;
    el.addEventListener('change', srRender);
    srRender();
  }

  // ---------- ACTIVE RECALL TIMER ----------
  let recallState = { secondsLeft: 5*60, running: false, tickId: null };
  function recallRender() {
    const t = document.getElementById('recallTime');
    const btn = document.getElementById('recallStart');
    if (!t) return;
    t.textContent = fmt(recallState.secondsLeft);
    btn.textContent = recallState.running ? 'Pause' : (recallState.secondsLeft === 5*60 ? 'Start 5-min recall' : 'Resume');
  }
  function recallTick() {
    if (!recallState.running) return;
    recallState.secondsLeft--;
    if (recallState.secondsLeft <= 0) {
      recallState.running = false;
      clearInterval(recallState.tickId);
      recallState.secondsLeft = 0;
      try { new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=').play().catch(()=>{}); } catch {}
    }
    recallRender();
  }
  function initRecall() {
    const btn = document.getElementById('recallStart');
    if (!btn) return;
    btn.addEventListener('click', () => {
      if (recallState.secondsLeft <= 0) recallState.secondsLeft = 5*60;
      recallState.running = !recallState.running;
      if (recallState.running) recallState.tickId = setInterval(recallTick, 1000);
      else clearInterval(recallState.tickId);
      recallRender();
    });
    document.getElementById('recallReset').addEventListener('click', () => {
      recallState.running = false;
      clearInterval(recallState.tickId);
      recallState.secondsLeft = 5*60;
      recallRender();
    });
    recallRender();
  }

  // ---------- PANEL TOGGLE ----------
  function setupPanel() {
    const fab = document.getElementById('studyFab');
    const panel = document.getElementById('studyPanel');
    const closeBtn = document.getElementById('studyClose');
    if (!fab || !panel) return;
    let rendered = false;
    function openPanel(scrollToPomo = false) {
      panel.classList.add('open');
      if (!rendered) { renderPanel(); rendered = true; }
      if (scrollToPomo) {
        // Open the Pomodoro card (index 3) and scroll to it.
        const cards = panel.querySelectorAll('.method-card');
        cards.forEach(c => c.classList.remove('open'));
        const pomoCard = cards[3];
        if (pomoCard) {
          pomoCard.classList.add('open');
          setTimeout(() => pomoCard.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
        }
      }
    }
    fab.addEventListener('click', () => {
      if (panel.classList.contains('open')) panel.classList.remove('open');
      else openPanel();
    });
    closeBtn.addEventListener('click', () => panel.classList.remove('open'));
    const chip = document.getElementById('pomoChip');
    if (chip) chip.addEventListener('click', () => openPanel(true));
    // Render chip once so it has correct initial state.
    pomoRender();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPanel);
  } else {
    setupPanel();
  }
})();
