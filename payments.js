// Stripe-side frontend glue: pricing toggle, upgrade modal, checkout / portal calls.
// Talks to /api/stripe/* on our own server (which talks to Stripe).

(function () {
  const PRICES = {
    monthly: { label: '$30', sub: '/month',
               trial: 'Billed monthly · cancel anytime · 3-day free trial',
               fine:  'After trial: $30/month. Cancel anytime.' },
    yearly:  { label: '$300', sub: '/year',
               trial: 'Billed annually · save $60 · cancel anytime · 3-day free trial',
               fine:  'After trial: $300/year (≈$25/mo). Cancel anytime.' },
  };

  // Summer promo copy, shown in place of the live prices while the paywall
  // kill switch is off. The list price is struck through rather than hidden so
  // the promo reads as a discount instead of as "this was always free".
  const SUMMER = {
    monthly: { trial: 'Free for the summer · no card required',
               fine:  'Free all summer. After that: $30/month or $300/year.' },
    yearly:  { trial: 'Free for the summer · no card required',
               fine:  'Free all summer. After that: $300/year (≈$25/mo).' },
  };

  let selectedPlanCard = 'monthly';
  let selectedPlanModal = 'monthly';
  let summerMode = false;

  function el(id) { return document.getElementById(id); }

  // ---- Pricing card toggle ----
  function syncPricingCard() {
    const amount = el('pricingAmount');
    const trial = el('pricingTrial');
    const p = PRICES[selectedPlanCard];
    if (amount) amount.innerHTML = summerMode
      ? `<s class="price-was">${p.label}<span>${p.sub}</span></s> <em class="price-now">Free</em>`
      : `${p.label}<span>${p.sub}</span>`;
    if (trial) trial.textContent = (summerMode ? SUMMER : PRICES)[selectedPlanCard].trial;
    const fine = el('pricingFine');
    if (fine && summerMode) fine.textContent = SUMMER[selectedPlanCard].fine;
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
    const p = PRICES[selectedPlanModal];
    if (amount) amount.innerHTML = summerMode
      ? `<s class="price-was">${p.label}<span>${p.sub}</span></s> <em class="price-now">Free</em>`
      : `${p.label}<span>${p.sub}</span>`;
    if (fine) fine.textContent = (summerMode ? SUMMER : PRICES)[selectedPlanModal].fine;
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

  // When the paywall kill switch is off (PAYWALL_DISABLED=1 on the host) the
  // pricing section stays visible but switches to the summer promo: list price
  // struck through, "Free" beside it. Checkout would 503 in this state, so the
  // Pro CTA points at signup instead. Fail-open: if /api/config doesn't
  // respond, leave the existing UI alone.
  async function applyPaywallVisibility() {
    try {
      const r = await fetch('/api/config', { credentials: 'same-origin' });
      const cfg = await r.json();
      if (cfg && cfg.paywall_active === false) {
        summerMode = true;
        const section = document.querySelector('.landing-pricing');
        if (section) section.classList.add('is-summer');

        const badge = document.querySelector('.pricing-badge-pro');
        if (badge) badge.textContent = 'Pro · free for the summer';

        const sub = document.querySelector('.landing-pricing .landing-section-sub');
        if (sub) sub.textContent = 'Pro is free for every student this summer — no card, no trial to cancel.';

        const cta = el('pricingSubscribeBtn');
        if (cta) {
          cta.textContent = 'Get Pro free →';
          cta.onclick = function () { if (typeof openAuth === 'function') openAuth('signup'); };
        }

        syncPricingCard();
        // Override requirePro so any feature-gate caller just passes through.
        window.requirePro = function () { return true; };
        // Make sure the upgrade modal can never pop.
        window.openUpgradeModal = function () { /* paywall disabled */ };
      }
    } catch (_) { /* leave UI as-is */ }
  }

  function init() {
    applyPaywallVisibility();
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

    // ---- Email-us modal (footer button) ----
    const emailOpen = el('footerEmailBtn');
    const emailOv = el('emailOverlay');
    const emailClose = el('emailClose');
    const emailCopy = el('emailCopyBtn');
    const emailHint = el('emailCopyHint');
    if (emailOpen && emailOv) {
      emailOpen.addEventListener('click', (e) => {
        e.preventDefault();
        emailOv.classList.remove('hidden');
      });
    }
    if (emailClose && emailOv) {
      emailClose.addEventListener('click', () => emailOv.classList.add('hidden'));
    }
    if (emailOv) {
      emailOv.addEventListener('click', (e) => { if (e.target === emailOv) emailOv.classList.add('hidden'); });
    }
    if (emailCopy && emailHint) {
      emailCopy.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText('hello@atriuminstitute.ai');
          emailHint.classList.remove('hidden');
          setTimeout(() => emailHint.classList.add('hidden'), 1500);
        } catch (_) {
          alert('hello@atriuminstitute.ai');
        }
      });
    }
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && emailOv && !emailOv.classList.contains('hidden')) {
        emailOv.classList.add('hidden');
      }
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
