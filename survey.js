// Post-signup student survey. Shown once when survey_completed_at is null
// and survey_skipped is false. Answers persist via /api/me/survey.
// "Skip for now" flips survey_skipped to true so the overlay doesn't
// nag on every sign-in; the user can still complete it later from the
// Profile page (TODO when needed).

(function () {
  function el(id) { return document.getElementById(id); }
  function show(node) { node && node.classList.remove('hidden'); }
  function hide(node) { node && node.classList.add('hidden'); }

  function showSurvey() {
    const ov = el('surveyOverlay');
    if (!ov) return;
    ov.setAttribute('aria-hidden', 'false');
    show(ov);
    document.body.classList.add('survey-open');
  }
  function hideSurvey() {
    const ov = el('surveyOverlay');
    if (!ov) return;
    ov.setAttribute('aria-hidden', 'true');
    hide(ov);
    document.body.classList.remove('survey-open');
  }

  function collectSurvey() {
    const form = el('surveyForm');
    if (!form) return {};
    const out = {
      confidenceSubjects: [],
      helpSubjects: [],
    };
    for (const elem of form.querySelectorAll('input, textarea')) {
      if (!elem.name) continue;
      if (elem.type === 'radio') {
        if (elem.checked) out[elem.name] = elem.value;
      } else if (elem.type === 'checkbox') {
        if (elem.name === 'confidenceSubjects' || elem.name === 'helpSubjects') {
          if (elem.checked) out[elem.name].push(elem.value);
        }
      } else if (elem.value !== '') {
        out[elem.name] = elem.value;
      }
    }
    return out;
  }

  async function handleSurveySubmit(e) {
    e.preventDefault();
    const errBox = el('surveyError');
    if (errBox) hide(errBox);
    const payload = collectSurvey();
    const btn = el('surveySubmitBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
    try {
      const r = await fetch('/api/me/survey', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      hideSurvey();
      // Surface the points / badge feedback so the kid sees the reward.
      if (typeof window.showPointToast === 'function' && window.AtriumPoints) {
        window.showPointToast(window.AtriumPoints.achievement, 'Survey complete', { icon: '🎉', flavor: 'milestone' });
      }
      if (typeof window.checkForNewBadges === 'function') {
        setTimeout(window.checkForNewBadges, 600);
      }
    } catch (err) {
      if (errBox) { errBox.textContent = err.message || 'Could not save.'; show(errBox); }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Save and continue'; }
    }
  }

  async function handleSurveySkip() {
    try {
      await fetch('/api/me/survey/skip', { method: 'POST', credentials: 'same-origin' });
    } catch (_e) {}
    hideSurvey();
  }

  // Called by auth.js after sign-in. Fetches the profile and decides
  // whether to show the overlay.
  async function maybeShowSurvey(user) {
    if (!user || user.role !== 'student') return;
    try {
      const r = await fetch('/api/me/rich-profile', { credentials: 'same-origin' });
      if (!r.ok) return;
      const { profile } = await r.json();
      if (profile && profile.survey_completed_at) return;
      if (profile && profile.survey_skipped) return;
      showSurvey();
    } catch (_e) {}
  }

  function wireOnce() {
    if (wireOnce._done) return;
    wireOnce._done = true;
    const form = el('surveyForm');
    if (form) form.addEventListener('submit', handleSurveySubmit);
    const skip = el('surveySkipBtn');
    if (skip) skip.addEventListener('click', handleSurveySkip);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireOnce);
  } else {
    wireOnce();
  }

  window.maybeShowSurvey = maybeShowSurvey;
})();
