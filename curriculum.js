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
      </div>
    `).join('');
    list.querySelectorAll('.curr-course-card').forEach(card => {
      card.addEventListener('click', () => openCourse(card.dataset.id));
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
    el('currCourseMeta').textContent = bits.join(' · ');
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

  function backToList() {
    hide(el('currCourseDetail'));
    show(el('currCourseList'));
  }

  // ----- Page-level open / close -----
  let _opened = false;
  async function openCurriculum() {
    if (typeof window.hideAllTopLevel === 'function') window.hideAllTopLevel();
    show(el('curriculumPage'));
    hide(el('currCourseDetail'));
    show(el('currCourseList'));
    if (_opened) return;
    _opened = true;

    await loadSubjects();

    // Default grade from the signed-in user's grade_level if present.
    const user = (typeof window.getCurrentUser === 'function') ? window.getCurrentUser() : null;
    if (user && Number.isInteger(user.grade_level)) {
      el('currGrade').value = String(user.grade_level);
    }
    el('currSubject').addEventListener('change', loadCourses);
    el('currGrade').addEventListener('change', loadCourses);
    const back = el('currBack');
    if (back) back.addEventListener('click', () => {
      hide(el('curriculumPage'));
      if (typeof window.goHome === 'function') window.goHome();
    });
    const cBack = el('currCourseBack');
    if (cBack) cBack.addEventListener('click', backToList);

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
