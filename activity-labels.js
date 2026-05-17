// Shared activity-event formatter used by both the student-facing Activity
// page (activity.js) and the parent-facing student-detail view (parent.js).
//
// Resolves course / book / section IDs to their human titles using COURSES
// (loaded earlier in index.html). Falls back gracefully if a course id has
// been deleted or renamed.

(function () {
  function lookupCourseBookSection(courseId, bookId, sectionIdx) {
    const fallback = {
      course: courseId || '?',
      book: bookId || '?',
      section: (typeof sectionIdx === 'number') ? `Section ${sectionIdx + 1}` : '?',
    };
    if (typeof COURSES === 'undefined' || !COURSES) return fallback;
    const course = COURSES[courseId];
    if (!course) return fallback;
    const book = (course.books || []).find(b => b.id === bookId);
    if (!book) return { ...fallback, course: course.title };
    const sec = (book.sections || [])[sectionIdx];
    return {
      course: course.title,
      book: book.title,
      section: sec && sec.title ? sec.title : `Section ${sectionIdx + 1}`,
    };
  }

  function relativeTime(iso) {
    if (!iso) return '';
    const t = new Date(iso).getTime();
    if (isNaN(t)) return iso;
    const diff = Date.now() - t;
    const min = Math.round(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const hr = Math.round(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
    const d = Math.round(hr / 24);
    if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`;
    if (d < 30) {
      const wk = Math.round(d / 7);
      return `${wk} week${wk === 1 ? '' : 's'} ago`;
    }
    return new Date(iso).toLocaleDateString();
  }

  function kindLabel(sectionKind) {
    if (sectionKind === 'cumulative') return 'cumulative test';
    if (sectionKind === 'final') return 'final exam';
    return 'quiz';
  }

  function ordinal(n) {
    if (!n || n < 1) return '';
    const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function fmtDuration(seconds) {
    if (!seconds || seconds < 1) return '';
    if (seconds < 60) return `${seconds} sec`;
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;
    const hr = Math.floor(min / 60);
    const rem = min % 60;
    return rem ? `${hr} hr ${rem} min` : `${hr} hr`;
  }

  function describeActivity(event) {
    const meta = event.meta || {};
    const when = relativeTime(event.created_at);

    switch (event.kind) {
      case 'signin':
        return {
          icon: '🔓',
          title: 'Signed in to Atrium',
          detail: '',
          when,
        };

      case 'quiz_pass': {
        const { course, book, section } = lookupCourseBookSection(meta.courseId, meta.bookId, meta.sectionIdx);
        const k = kindLabel(meta.sectionKind);
        const pct = (meta.total > 0) ? Math.round(100 * meta.score / meta.total) : 0;
        let phrase;
        if (pct === 100) phrase = `Perfect ${meta.score}/${meta.total} on the ${k}`;
        else if (pct >= 90) phrase = `Strong pass — ${meta.score}/${meta.total} on the ${k}`;
        else phrase = `Passed the ${k} (${meta.score}/${meta.total})`;
        const extras = [];
        if (meta.attemptNumber > 1) extras.push(`${ordinal(meta.attemptNumber)} attempt`);
        const dur = fmtDuration(meta.durationSeconds);
        if (dur) extras.push(dur);
        return {
          icon: pct === 100 ? '🏆' : '✅',
          title: `${phrase}: ${section}`,
          detail: `${course} → ${book}${extras.length ? ` · ${extras.join(' · ')}` : ''}`,
          when,
        };
      }

      case 'quiz_fail': {
        const { course, book, section } = lookupCourseBookSection(meta.courseId, meta.bookId, meta.sectionIdx);
        const k = kindLabel(meta.sectionKind);
        const pct = (meta.total > 0) ? Math.round(100 * meta.score / meta.total) : 0;
        const close = pct >= 60;
        const extras = [];
        if (meta.attemptNumber > 1) extras.push(`${ordinal(meta.attemptNumber)} attempt`);
        const dur = fmtDuration(meta.durationSeconds);
        if (dur) extras.push(dur);
        return {
          icon: close ? '🎯' : '🔄',
          title: close
            ? `Close call on the ${k}: ${section} (${meta.score}/${meta.total})`
            : `Didn't pass the ${k} yet: ${section} (${meta.score}/${meta.total})`,
          detail: `${course} → ${book}${extras.length ? ` · ${extras.join(' · ')}` : ''} · worth a retake`,
          when,
        };
      }

      case 'lesson_started': {
        const courseTitle = (typeof COURSES !== 'undefined' && COURSES[meta.courseId]) ? COURSES[meta.courseId].title : (meta.courseId || '');
        return {
          icon: '📖',
          title: `Started a Max lesson on ${meta.sectionTitle || 'a topic'}`,
          detail: courseTitle && meta.bookId ? `${courseTitle} → ${meta.bookId}` : '',
          when,
        };
      }

      case 'study_started': {
        const courseTitle = (typeof COURSES !== 'undefined' && COURSES[meta.courseId]) ? COURSES[meta.courseId].title : (meta.courseId || '');
        return {
          icon: '🧠',
          title: `Opened a Study with Max session on ${meta.sectionTitle || 'a topic'}`,
          detail: courseTitle && meta.bookId ? `${courseTitle} → ${meta.bookId}` : '',
          when,
        };
      }

      case 'chat_topic_started':
        return {
          icon: '💬',
          title: meta.topic ? `Asked Max about ${meta.topic}` : 'Opened a chat with Max',
          detail: '',
          when,
        };

      case 'link_created':
        return {
          icon: '🔗',
          title: 'Linked accounts',
          detail: 'A parent / student connection was created.',
          when,
        };

      case 'link_removed':
        return {
          icon: '✂️',
          title: 'Removed an account link',
          detail: '',
          when,
        };

      case 'reminder_sent':
        return {
          icon: '📧',
          title: 'Study reminder email sent',
          detail: meta.content === 'continuation'
            ? 'Reminder type: continue where you left off'
            : meta.content === 'weak_topics'
              ? 'Reminder type: focus on topics you missed'
              : 'Reminder type: simple nudge',
          when,
        };

      case 'digest_sent':
        return {
          icon: '📧',
          title: 'Weekly digest email sent',
          detail: meta.studentCount
            ? `Summary covered ${meta.studentCount} student${meta.studentCount === 1 ? '' : 's'}`
            : '',
          when,
        };

      default:
        return {
          icon: '•',
          title: event.kind,
          detail: '',
          when,
        };
    }
  }

  window.describeActivity = describeActivity;
})();
