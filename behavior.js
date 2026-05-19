// Atrium Behavior Tracker — monitors student activity to detect engagement
// patterns (rushing, struggling, focus, idleness). Events are batched and
// sent to /api/behavior/events. Fire-and-forget; never blocks the UI.

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Session & buffer
  // ------------------------------------------------------------------
  const SESSION_ID = crypto.randomUUID ? crypto.randomUUID() : (
    'ses_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10)
  );
  const FLUSH_INTERVAL_MS = 15000; // send events every 15s
  const MAX_BUFFER = 200;
  let _buffer = [];
  let _flushing = false;

  function push(eventType, extra) {
    if (!window.getCurrentUser || !window.getCurrentUser()) return; // not signed in
    const evt = {
      event_type: eventType,
      course_id: window.COURSE ? window.COURSE.id : null,
      book_id: null,
      section_idx: null,
      payload: {},
      duration_ms: null,
      ...extra,
      _ts: Date.now(), // local reference, not sent
    };
    _buffer.push(evt);
    if (_buffer.length >= MAX_BUFFER) flush();
  }

  async function flush() {
    if (_flushing || !_buffer.length) return;
    _flushing = true;
    const batch = _buffer.splice(0, MAX_BUFFER);
    try {
      await fetch('/api/behavior/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ session_id: SESSION_ID, events: batch }),
      });
    } catch (_) {
      // Put failed events back (at the front) so they retry next flush.
      _buffer = batch.concat(_buffer).slice(0, MAX_BUFFER * 2);
    }
    _flushing = false;
  }

  setInterval(flush, FLUSH_INTERVAL_MS);
  window.addEventListener('beforeunload', () => {
    if (!_buffer.length) return;
    // Use sendBeacon for reliability on page close
    try {
      navigator.sendBeacon('/api/behavior/events', JSON.stringify({
        session_id: SESSION_ID,
        events: _buffer.splice(0, MAX_BUFFER),
      }));
    } catch (_) { /* best effort */ }
  });

  // ------------------------------------------------------------------
  // Session tracking
  // ------------------------------------------------------------------
  push('session_start');

  // ------------------------------------------------------------------
  // Tab focus/blur (idle detection)
  // ------------------------------------------------------------------
  let _blurTime = null;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      _blurTime = Date.now();
      push('tab_blur');
    } else {
      const idle = _blurTime ? Date.now() - _blurTime : 0;
      push('tab_focus', { duration_ms: idle, payload: { idle_ms: idle } });
      _blurTime = null;
    }
  });

  // ------------------------------------------------------------------
  // Lesson step tracking
  // ------------------------------------------------------------------
  // Hooks into lesson navigation. The lesson stepper calls these functions
  // which we monkey-patch to intercept timing.
  let _lessonStepStart = null;
  let _lessonStepIdx = null;
  let _lessonBookId = null;
  let _lessonSectionIdx = null;

  window._behaviorLessonOpen = function (bookId, sectionIdx) {
    _lessonBookId = bookId;
    _lessonSectionIdx = sectionIdx;
    _lessonStepStart = Date.now();
    _lessonStepIdx = 0;
    push('lesson_open', {
      book_id: bookId,
      section_idx: sectionIdx,
    });
  };

  window._behaviorLessonStep = function (stepIdx, totalSteps) {
    const now = Date.now();
    // Record time spent on the previous step
    if (_lessonStepStart != null && _lessonStepIdx != null) {
      const dur = now - _lessonStepStart;
      push('lesson_step_view', {
        book_id: _lessonBookId,
        section_idx: _lessonSectionIdx,
        duration_ms: dur,
        payload: {
          step: _lessonStepIdx,
          total_steps: totalSteps,
          time_ms: dur,
          rushed: dur < 3000,
        },
      });
    }
    _lessonStepStart = now;
    _lessonStepIdx = stepIdx;
  };

  window._behaviorLessonClose = function (stepIdx, totalSteps) {
    // Record final step time
    if (_lessonStepStart != null) {
      const dur = Date.now() - _lessonStepStart;
      push('lesson_step_view', {
        book_id: _lessonBookId,
        section_idx: _lessonSectionIdx,
        duration_ms: dur,
        payload: {
          step: _lessonStepIdx,
          total_steps: totalSteps,
          time_ms: dur,
        },
      });
    }
    push('lesson_close', {
      book_id: _lessonBookId,
      section_idx: _lessonSectionIdx,
      payload: { closed_at_step: stepIdx, total_steps: totalSteps },
    });
    _lessonStepStart = null;
    _lessonStepIdx = null;
  };

  window._behaviorLessonRegenerate = function (bookId, sectionIdx) {
    push('lesson_regenerate', {
      book_id: bookId,
      section_idx: sectionIdx,
    });
  };

  // ------------------------------------------------------------------
  // Quiz tracking
  // ------------------------------------------------------------------
  let _quizQuestionStart = null;

  window._behaviorQuizStart = function (bookId, sectionIdx, questionCount) {
    _quizQuestionStart = Date.now();
    push('quiz_start', {
      book_id: bookId,
      section_idx: sectionIdx,
      payload: { question_count: questionCount },
    });
  };

  window._behaviorQuizAnswer = function (bookId, sectionIdx, questionIdx, correct, totalQuestions) {
    const dur = _quizQuestionStart ? Date.now() - _quizQuestionStart : null;
    push('quiz_answer', {
      book_id: bookId,
      section_idx: sectionIdx,
      duration_ms: dur,
      payload: {
        question_idx: questionIdx,
        correct: correct,
        total_questions: totalQuestions,
        time_ms: dur,
      },
    });
    _quizQuestionStart = Date.now(); // reset for next question
  };

  window._behaviorQuizSubmit = function (bookId, sectionIdx, score, total, passed) {
    push('quiz_submit', {
      book_id: bookId,
      section_idx: sectionIdx,
      payload: { score: score, total: total, passed: passed },
    });
  };

  window._behaviorAnswerChanged = function (bookId, sectionIdx, questionIdx) {
    push('answer_changed', {
      book_id: bookId,
      section_idx: sectionIdx,
      payload: { question_idx: questionIdx },
    });
  };

  // ------------------------------------------------------------------
  // Hint tracking
  // ------------------------------------------------------------------
  window._behaviorHintRequest = function (bookId, sectionIdx, questionIdx) {
    push('hint_request', {
      book_id: bookId,
      section_idx: sectionIdx,
      payload: { question_idx: questionIdx },
    });
  };

  // ------------------------------------------------------------------
  // Chat / Study with Max tracking
  // ------------------------------------------------------------------
  window._behaviorChatMessage = function (messageLength) {
    push('chat_message', {
      payload: { message_length: messageLength },
    });
  };

  window._behaviorStudyWithMax = function (bookId, sectionIdx) {
    push('study_with_max', {
      book_id: bookId,
      section_idx: sectionIdx,
    });
  };

  // ------------------------------------------------------------------
  // Navigation tracking
  // ------------------------------------------------------------------
  window._behaviorSectionVisit = function (bookId, sectionIdx, sectionTitle) {
    push('section_visit', {
      book_id: bookId,
      section_idx: sectionIdx,
      payload: { title: sectionTitle },
    });
  };

  window._behaviorCourseVisit = function (courseId) {
    push('course_visit', {
      payload: { course_id: courseId },
    });
  };

  // Expose flush for explicit send (e.g. before navigation)
  window._behaviorFlush = flush;
  window._behaviorSessionId = SESSION_ID;

})();
