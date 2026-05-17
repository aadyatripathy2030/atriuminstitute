// Login disabled — landing page → courses, no auth required.
// File kept (instead of deleted) so existing references in index.html don't break.

(function() {
  function showLanding() {
    document.getElementById('landing').classList.remove('hidden');
    document.getElementById('courses-home').classList.add('hidden');
    document.getElementById('home').classList.add('hidden');
    document.getElementById('detail').classList.add('hidden');
    document.getElementById('about').classList.add('hidden');
    document.getElementById('progressPill').classList.remove('hidden');
  }

  function showApp() {
    document.getElementById('landing').classList.add('hidden');
    document.getElementById('courses-home').classList.remove('hidden');
    if (typeof renderCourses === 'function') renderCourses();
    if (typeof renderProgressPill === 'function') renderProgressPill();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Landing CTAs call openAuth(). First-time visitors get the onboarding
  // questionnaire (name, age, grade, etc.); returning users go straight to courses.
  window.openAuth = function() {
    const hasProfile = (typeof loadProfile === 'function') && loadProfile();
    if (!hasProfile && typeof startOnboarding === 'function') {
      document.getElementById('landing').classList.add('hidden');
      startOnboarding();
    } else {
      showApp();
    }
  };

  // Hide nav items that no longer apply (sign-in button, user chip).
  function hideAuthChrome() {
    const els = ['navSignInBtn', 'navUser', 'authGate'];
    for (const id of els) {
      const el = document.getElementById(id);
      if (el) el.classList.add('hidden');
    }
  }

  function init() {
    hideAuthChrome();
    showLanding();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
