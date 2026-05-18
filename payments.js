// Stripe-side frontend glue: pricing toggle, upgrade modal, checkout / portal calls.
// Talks to /api/stripe/* on our own server (which talks to Stripe).

(function () {
  const PRICES = {
    monthly: { label: '$15', sub: '/month',
               trial: 'Billed monthly · cancel anytime · 3-day free trial',
               fine:  'After trial: $15/month. Cancel anytime.' },
    yearly:  { label: '$150', sub: '/year',
               trial: 'Billed annually · save $30 · cancel anytime · 3-day free trial',
               fine:  'After trial: $150/year (≈$12.50/mo). Cancel anytime.' },
  };

  let selectedPlanCard = 'monthly';
  let selectedPlanModal = 'monthly';

  function el(id) { return document.getElementById(id); }

  // ---- Pricing card toggle ----
  function syncPricingCard() {
    const amount = el('pricingAmount');
    const trial = el('pricingTrial');
    if (amount) amount.innerHTML = `${PRICES[selectedPlanCard].label}<span>${PRICES[selectedPlanCard].sub}</span>`;
    if (trial) trial.textContent = PRICES[selectedPlanCard].trial;
    document.querySelectorAll('.pricing-toggle-btn[data-plan]').forEach(b => {
      const active = b.dataset.plan === selectedPlanCard;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  // ---- Upgrade modal ----
  function openUpgradeModal(initialPlan) {
    if (initialPlan === 'monthly' || initialPlan === 'yearly') selectedPlanModal = initialPlan;
    syncUpgradeModal();
    const ov = el('upgradeOverlay');
    if (ov) ov.classList.remove('hidden');
  }
  function closeUpgradeModal() {
    const ov = el('upgradeOverlay');
    if (ov) ov.classList.add('hidden');
  }
  function syncUpgradeModal() {
    const amount = el('upgradeAmount');
    const fine = el('upgradeFine');
    if (amount) amount.innerHTML = `${PRICES[selectedPlanModal].label}<span>${PRICES[selectedPlanModal].sub}</span>`;
    if (fine) fine.textContent = PRICES[selectedPlanModal].fine;
    document.querySelectorAll('.pricing-toggle-btn[data-plan-modal]').forEach(b => {
      const active = b.dataset.planModal === selectedPlanModal;
      b.classList.toggle('active', active);
      b.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  // Expose for inline onclick on buttons.
  window.openUpgradeModal = openUpgradeModal;
  window.closeUpgradeModal = closeUpgradeModal;

  // ---- Subscription flow ----
  async function startCheckout(plan) {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    if (!user) {
      // Not signed in — bounce through the auth gate first, then they can
      // come back and click subscribe.
      if (typeof openAuth === 'function') openAuth('signup');
      return;
    }
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not start checkout');
      window.location.href = data.url;
    } catch (e) {
      alert(e.message || 'Could not start checkout');
    }
  }

  async function openBillingPortal() {
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || 'Could not open billing portal');
      window.location.href = data.url;
    } catch (e) {
      alert(e.message || 'Could not open billing portal');
    }
  }

  // Wire up the buttons defined in index.html (onclick="startProCheckout()" etc.)
  window.startProCheckout = () => startCheckout(selectedPlanCard);
  window.openBillingPortal = openBillingPortal;

  // Returning from Stripe Checkout — refresh /me so subscription_status shows up.
  function handleReturnFromStripe() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'success') {
      // Strip query params from URL for cleanliness
      history.replaceState(null, '', window.location.pathname);
      // Refresh /me so the rest of the app knows we're Pro now.
      fetch('/api/auth/me', { credentials: 'same-origin' })
        .then(r => r.ok ? r.json() : null)
        .then(() => {
          const t = document.createElement('div');
          t.className = 'welcome-toast show';
          t.innerHTML = '✨ <strong>Welcome to Atrium Pro!</strong> Max and all premium features are unlocked.';
          document.body.appendChild(t);
          setTimeout(() => t.remove(), 5000);
          // Forces any code reading currentUser to repull on next interaction;
          // the user object cached in auth.js will refresh on next /me call.
        }).catch(() => {});
    } else if (params.get('upgrade') === 'cancelled') {
      history.replaceState(null, '', window.location.pathname);
    } else if (params.get('from') === 'portal') {
      history.replaceState(null, '', window.location.pathname);
    }
  }

  function init() {
    syncPricingCard();
    syncUpgradeModal();

    // Pricing-card toggle clicks
    document.querySelectorAll('.pricing-toggle-btn[data-plan]').forEach(b => {
      b.addEventListener('click', () => {
        selectedPlanCard = b.dataset.plan === 'yearly' ? 'yearly' : 'monthly';
        syncPricingCard();
      });
    });

    // Upgrade-modal toggle clicks
    document.querySelectorAll('.pricing-toggle-btn[data-plan-modal]').forEach(b => {
      b.addEventListener('click', () => {
        selectedPlanModal = b.dataset.planModal === 'yearly' ? 'yearly' : 'monthly';
        syncUpgradeModal();
      });
    });

    const closeBtn = el('upgradeClose');
    if (closeBtn) closeBtn.addEventListener('click', closeUpgradeModal);
    const subBtn = el('upgradeSubscribeBtn');
    if (subBtn) subBtn.addEventListener('click', () => startCheckout(selectedPlanModal));

    // Click outside the card closes the modal.
    const ov = el('upgradeOverlay');
    if (ov) ov.addEventListener('click', (e) => {
      if (e.target === ov) closeUpgradeModal();
    });

    handleReturnFromStripe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Helper any other code can call when a Pro-gated feature is clicked.
window.requirePro = function () {
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  if (user && user.is_pro) return true;
  if (typeof openUpgradeModal === 'function') openUpgradeModal();
  return false;
};
