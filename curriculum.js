// Curriculum browser. Read-only view of curriculum_* tables loaded
// from the xlsx imports. Subject + grade selectors filter the course
// list; clicking a course expands its units and lessons inline.
//
// Defaults the grade selector to the signed-in user's grade_level
// when available, otherwise leaves it on "All grades".
(function () {
  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
  function show(node) { if (node) node.classList.remove('hidden'); }
  function hide(node) { if (node) node.classList.add('hidden'); }

  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'same-origin' });
    let data = {};
    try { data = await res.json(); } catch (_) { /* tolerate */ }
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  }

  let subjects = [];
  let courses = [];

  async function loadSubjects() {
    const subjSel = el('currSubject');
    if (!subjSel) return;
    try {
      const r = await fetchJSON('/api/curriculum/subjects');
      subjects = r.subjects || [];
    } catch (_) {
      subjects = [];
    }
    if (!subjects.length) {
      // Empty state: nothing imported yet.
      subjSel.innerHTML = '<option value="">No subjects loaded</option>';
      subjSel.disabled = true;
      return;
    }
    subjSel.disabled = false;
    subjSel.innerHTML = '';
    if (subjects.length > 1) {
      const all = document.createElement('option');
      all.value = '';
      all.textContent = 'All subjects';
      subjSel.appendChild(all);
    }
    for (const s of subjects) {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.title;
      subjSel.appendChild(opt);
    }
    // Default to the first (only) subject for clarity.
    subjSel.value = subjects[0].id;
  }

  async function loadCourses() {
    const list = el('currCourseList');
    if (!list) return;
    list.innerHTML = '<div class="parent-empty">Loading…</div>';
    const subject = el('currSubject').value;
    const grade = el('currGrade').value;
    const params = new URLSearchParams();
    if (subject) params.set('subject', subject);
    if (grade) params.set('grade', grade);
    try {
      const r = await fetchJSON('/api/curriculum/courses?' + params.toString());
      courses = r.courses || [];
    } catch (e) {
      list.innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
      return;
    }
    renderCourseList();
  }

  function renderCourseList() {
    const list = el('currCourseList');
    if (!list) return;
    if (!courses.length) {
      list.innerHTML = `<div class="parent-empty">No courses match the current filter. Try a different grade, or load the curriculum with <code>npm run import-curriculum</code>.</div>`;
      return;
    }
    list.innerHTML = courses.map(c => `
      <div class="curr-course-card" data-id="${esc(c.id)}">
        <div class="curr-course-card-head">
          <h3>${esc(c.title)}</h3>
          <span class="curr-course-grades">${(c.grade_levels || []).map(g => 'Grade ' + g).join(', ')}</span>
        </div>
        <div class="curr-course-card-meta">
          ${c.total_weeks ? `${c.total_weeks} weeks` : ''}${c.total_weeks && c.total_lessons ? ' · ' : ''}${c.total_lessons ? `${c.total_lessons} lessons` : ''}
        </div>
        ${legacyBadge(c)}
        <div class="curr-course-actions">
          ${learnButton(c, 'inline')}
          <button type="button" class="curr-card-detail-btn">View units & lessons →</button>
        </div>
      </div>
    `).join('');
    list.querySelectorAll('.curr-course-card').forEach(card => {
      // Open the structured detail (units + lessons) only when the body
      // of the card is clicked or the explicit "View units & lessons"
      // button is hit. The Start-learning button has its own handler and
      // we don't want a stray click on it to also open the detail page.
      const detail = card.querySelector('.curr-card-detail-btn');
      if (detail) detail.addEventListener('click', (e) => {
        e.stopPropagation();
        openCourseDetail(card.dataset.id);
      });
      card.addEventListener('click', (e) => {
        if (e.target.closest('.curr-learn-btn')) return;
        if (e.target.closest('.curr-card-detail-btn')) return;
        openCourseDetail(card.dataset.id);
      });
    });
    // Start-learning click handlers (inline form on every card).
    list.querySelectorAll('.curr-learn-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const legacy = btn.dataset.legacy;
        startLearning(legacy);
      });
    });
  }

  async function openCourse(courseId) {
    hide(el('currCourseList'));
    const detail = el('currCourseDetail');
    show(detail);
    el('currUnits').innerHTML = '<div class="parent-empty">Loading…</div>';
    el('currCourseTitle').textContent = '…';
    el('currCourseMeta').textContent = '';
    try {
      const r = await fetchJSON('/api/curriculum/courses/' + encodeURIComponent(courseId));
      renderCourseDetail(r.course);
    } catch (e) {
      el('currUnits').innerHTML = `<div class="parent-empty err">Could not load: ${esc(e.message)}</div>`;
    }
  }

  function renderCourseDetail(course) {
    if (!course) return;
    el('currCourseTitle').textContent = course.title;
    const grades = (course.grade_levels || []).map(g => 'Grade ' + g).join(', ');
    const bits = [grades, course.total_weeks ? course.total_weeks + ' weeks' : null, course.total_lessons ? course.total_lessons + ' lessons' : null].filter(Boolean);
    el('currCourseMeta').innerHTML = esc(bits.join(' · ')) + ' ' + legacyBadge(course);
    const units = course.units || [];
    if (!units.length) {
      el('currUnits').innerHTML = '<div class="parent-empty">No units loaded for this course.</div>';
      return;
    }
    el('currUnits').innerHTML = units.map(u => `
      <details class="curr-unit" ${u.unit_number === 1 ? 'open' : ''}>
        <summary>
          <span class="curr-unit-num">Unit ${u.unit_number}</span>
          <span class="curr-unit-title">${esc(u.unit_title)}</span>
          ${u.weeks ? `<span class="curr-unit-weeks">${u.weeks} weeks</span>` : ''}
          <span class="curr-unit-count">${(u.lessons || []).length} lessons</span>
        </summary>
        <div class="curr-unit-body">
          ${(u.lessons || []).map(l => renderLesson(l)).join('')}
        </div>
      </details>
    `).join('');
  }

  function renderLesson(l) {
    const fields = [
      ['Learning objective', l.learning_objective],
      ['Key concepts', l.key_concepts],
      ['Prerequisites', l.prerequisites],
      ['Key vocabulary', l.key_vocabulary],
      ['Common misconceptions', l.common_misconceptions],
      ['Real-world hook', l.real_world_hook],
      ['Practices', l.practices],
    ];
    return `
      <div class="curr-lesson">
        <div class="curr-lesson-head">
          <span class="curr-lesson-num">${esc(l.lesson_number)}</span>
          <span class="curr-lesson-title">${esc(l.lesson_title)}</span>
          ${l.ccss_code ? `<span class="curr-lesson-ccss">${esc(l.ccss_code)}</span>` : ''}
        </div>
        <dl class="curr-lesson-fields">
          ${fields.filter(([_, v]) => v).map(([k, v]) => `
            <dt>${esc(k)}</dt>
            <dd>${esc(v)}</dd>
          `).join('')}
        </dl>
      </div>
    `;
  }

  // "Start learning" button. Renders disabled when no legacy mapping
  // exists yet. Click delegates to the existing app.js openCourse() flow.
  function learnButton(c, _variant) {
    if (c && c.legacy_course_id) {
      return `<button type="button" class="curr-learn-btn" data-legacy="${esc(c.legacy_course_id)}">Start learning →</button>`;
    }
    return `<button type="button" class="curr-learn-btn" disabled title="No existing course content yet">Coming soon</button>`;
  }

  function startLearning(legacyCourseId) {
    if (!legacyCourseId) return;
    hide(el('curriculumPage'));
    if (typeof window.setCourse === 'function' && typeof window.COURSES !== 'undefined' && window.COURSES[legacyCourseId]) {
      window.setCourse(legacyCourseId);
    }
    if (typeof window.openCourse === 'function') {
      window.openCourse(legacyCourseId);
    } else if (typeof window.goHome === 'function') {
      window.goHome();
    }
  }

  function openCourseDetail(courseId) {
    if (typeof openCourse !== 'undefined') {
      // openCourse is a closure-local function inside this IIFE; alias
      // it via the global setter below to keep the click flow simple.
    }
    return openCourse(courseId);
  }

  // Badge showing whether this curriculum course reuses content from an
  // existing courses.js course (legacy_course_id is set) or needs fresh
  // content generation. Useful at a glance for "where does effort go?"
  function legacyBadge(c) {
    if (c && c.legacy_course_id) {
      const title = window.COURSES && window.COURSES[c.legacy_course_id] ? window.COURSES[c.legacy_course_id].title : c.legacy_course_id;
      return `<span class="curr-legacy-badge curr-legacy-existing" title="Reuses content from the existing &quot;${esc(title)}&quot; course (id: ${esc(c.legacy_course_id)})">✓ Existing content: ${esc(title)}</span>`;
    }
    return `<span class="curr-legacy-badge curr-legacy-new" title="No existing courses.js course maps to this. Content needs to be generated.">✱ Needs new content</span>`;
  }

  function backToList() {
    hide(el('currCourseDetail'));
    show(el('currCourseList'));
  }

  // ----- Page-level open / close -----
  let _wired = false;
  async function openCurriculum() {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('curriculumPage'));
    hide(el('currCourseDetail'));
    show(el('currCourseList'));

    // Wire listeners + back buttons exactly once. Re-opening re-reads
    // the user's current grade and re-fetches the course list every
    // time, so a freshly-saved profile grade takes effect next open.
    if (!_wired) {
      _wired = true;
      el('currSubject').addEventListener('change', loadCourses);
      el('currGrade').addEventListener('change', loadCourses);
      const back = el('currBack');
      if (back) back.addEventListener('click', () => {
        hide(el('curriculumPage'));
        if (typeof window.goHome === 'function') window.goHome();
      });
      const cBack = el('currCourseBack');
      if (cBack) cBack.addEventListener('click', backToList);
      await loadSubjects();
    }

    // Refresh the grade default from the cached user every time. If the
    // user updated their grade in profile, getCurrentUser() now returns
    // the new value (profile.js calls window.setCurrentUser after save).
    const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (user && Number.isInteger(user.grade_level)) {
      el('currGrade').value = String(user.grade_level);
    }

    await loadCourses();
  }
  window.openCurriculum = openCurriculum;

  // Wire the nav button. Other pages do this in their own init; we
  // attach lazily because index.html includes us after admin.js but
  // before app.js, and the nav button exists from page load.
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('curriculumNavBtn');
    if (btn) btn.addEventListener('click', openCurriculum);
  });
})();
