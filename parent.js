// Parent dashboard. Called from auth.js when a verified parent user lands.
// Renders the family overview, the per-student detail view, and the
// "link another student" form. All data is fetched from /api/parent/*
// endpoints which authorise on the server (parent can only see their
// own students).

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }
  function fmtDate(s) {
    if (!s) return '—';
    try { return new Date(s).toLocaleString(); } catch { return s; }
  }
  function fmtLinkCode(code) {
    if (!code) return '————————';
    return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
  }

  function describe(a) {
    if (typeof window.describeActivity === 'function') return window.describeActivity(a);
    return { icon: '•', title: a.kind, detail: '', when: a.created_at || '' };
  }
  function activityRow(a) {
    const d = describe(a);
    return `
      <div class="activity-event">
        <div class="activity-icon">${d.icon}</div>
        <div class="activity-body">
          <div class="activity-title">${escapeHTML(d.title)}</div>
          ${d.detail ? `<div class="activity-detail">${escapeHTML(d.detail)}</div>` : ''}
        </div>
        <div class="activity-when">${escapeHTML(d.when)}</div>
      </div>
    `;
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Request failed (${res.status})`);
    }
    return res.json();
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  function copyToClipboard(text) {
    try {
      navigator.clipboard.writeText(text);
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
  }

  function setLinkError(msg) {
    const n = el('parentLinkError');
    if (!n) return;
    if (!msg) { hide(n); n.textContent = ''; return; }
    n.textContent = msg;
    show(n);
  }

  async function renderStudentList() {
    const wrap = el('parentStudentList');
    if (!wrap) return;
    wrap.innerHTML = '<div class="parent-empty">Loading…</div>';
    try {
      const { students } = await fetchJSON('/api/parent/students');
      if (!students || students.length === 0) {
        wrap.innerHTML = '<div class="parent-empty">No students linked yet. Use the form below to add one with their code.</div>';
        return;
      }
      wrap.innerHTML = '';
      for (const s of students) {
        const row = document.createElement('div');
        row.className = 'parent-student-row';
        const consentBadge = s.consent_required
          ? (s.consent_granted_at ? '<span class="badge ok">Consent granted</span>' : '<span class="badge warn">Awaiting consent</span>')
          : '';
        row.innerHTML = `
          <div class="parent-student-main">
            <div class="parent-student-email">${escapeHTML(s.email)}</div>
            <div class="parent-student-meta">
              ${s.age ? `Age ${s.age}` : ''}
              ${s.state ? ` · ${escapeHTML(s.state)}` : ''}
              ${consentBadge ? ` · ${consentBadge}` : ''}
            </div>
          </div>
          <div class="parent-student-actions">
            <button class="cta-secondary" data-student-id="${s.id}">View progress</button>
          </div>
        `;
        row.querySelector('button[data-student-id]').addEventListener('click', () => openStudentDetail(s));
        wrap.appendChild(row);
      }
    } catch (e) {
      wrap.innerHTML = `<div class="parent-empty err">Could not load students: ${escapeHTML(e.message)}</div>`;
    }
  }

  function escapeHTML(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  async function openStudentDetail(student) {
    hide(el('parentHome'));
    show(el('parentStudentDetail'));
    el('parentDetailName').textContent = student.email;
    const meta = [];
    if (student.age) meta.push(`Age ${student.age}`);
    if (student.state) meta.push(student.state);
    if (student.consent_required) {
      meta.push(student.consent_granted_at ? 'Consent granted' : 'Awaiting consent');
    }
    el('parentDetailMeta').textContent = meta.join(' · ');

    const weakEl = el('parentDetailWeak');
    const quizEl = el('parentDetailQuizzes');
    const activityEl = el('parentDetailActivity');
    weakEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    quizEl.innerHTML = '<div class="parent-empty">Loading…</div>';
    activityEl.innerHTML = '<div class="parent-empty">Loading…</div>';

    try {
      const [{ sections }, { attempts }, { activity }] = await Promise.all([
        fetchJSON(`/api/parent/students/${student.id}/weak-sections`),
        fetchJSON(`/api/parent/students/${student.id}/quiz-attempts`),
        fetchJSON(`/api/parent/students/${student.id}/activity`),
      ]);

      weakEl.innerHTML = sections.length
        ? sections.map(s => `
            <div class="parent-detail-row">
              <div>${escapeHTML(s.course_id)} · ${escapeHTML(s.book_id)} · section ${s.section_idx + 1}</div>
              <div class="muted">${s.failures} failed ${s.failures === 1 ? 'attempt' : 'attempts'}</div>
            </div>
          `).join('')
        : '<div class="parent-empty">No weak topics yet. Either they haven\'t failed anything twice, or they haven\'t taken many quizzes.</div>';

      quizEl.innerHTML = attempts.length
        ? attempts.slice(0, 25).map(a => `
            <div class="parent-detail-row">
              <div>${escapeHTML(a.course_id)} · ${escapeHTML(a.book_id)} · section ${a.section_idx + 1}${a.section_kind !== 'section' ? ` (${escapeHTML(a.section_kind)})` : ''}</div>
              <div class="${a.passed ? 'ok' : 'warn'}">${a.score}/${a.total} · ${a.passed ? 'passed' : 'did not pass'}</div>
              <div class="muted">${fmtDate(a.completed_at)}</div>
            </div>
          `).join('')
        : '<div class="parent-empty">No quiz attempts yet.</div>';

      activityEl.innerHTML = activity.length
        ? activity.slice(0, 50).map(activityRow).join('')
        : '<div class="parent-empty">No activity yet for this student.</div>';
    } catch (e) {
      const msg = `<div class="parent-empty err">Could not load: ${escapeHTML(e.message)}</div>`;
      weakEl.innerHTML = msg; quizEl.innerHTML = msg; activityEl.innerHTML = msg;
    }
  }

  function closeStudentDetail() {
    hide(el('parentStudentDetail'));
    show(el('parentHome'));
  }

  async function handleLinkSubmit(e) {
    e.preventDefault();
    setLinkError('');
    const code = (el('parentLinkInput').value || '').trim();
    if (!code) return;
    try {
      await postJSON('/api/me/links', { linkCode: code });
      el('parentLinkInput').value = '';
      await renderStudentList();
    } catch (err) {
      setLinkError(err.message);
    }
  }

  async function initParentHome(user) {
    hide(el('landing'));
    hide(el('courses-home'));
    hide(el('home'));
    hide(el('detail'));
    hide(el('consentGate'));
    hide(el('authGate'));
    show(el('parentHome'));
    el('parentOwnLinkCode').textContent = fmtLinkCode(user && user.link_code);
    await renderStudentList();
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const form = el('parentLinkForm');
    if (form) form.addEventListener('submit', handleLinkSubmit);
    const back = el('parentDetailBack');
    if (back) back.addEventListener('click', closeStudentDetail);
    const copy = el('parentCopyBtn');
    if (copy) copy.addEventListener('click', () => {
      const code = (el('parentOwnLinkCode').textContent || '').replace('-', '');
      if (code && code !== '————————') copyToClipboard(code);
    });
  }

  window.showParentDashboard = async function (user) {
    wireOnce();
    await initParentHome(user);
  };
})();
