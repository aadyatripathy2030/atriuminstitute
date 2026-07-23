// Pure referral/discount logic — no DB, no Stripe — so it can be unit-tested.
// server.js wires these to the KV store (referral_v1) and Stripe.
//
// Two-sided model, both rewards are one free month = a 30-day trial:
//   • Referee (person who joined via a link): their first month is free.
//   • Referrer: earns a free month each time one of their referees subscribes.
// Free months are redeemed as extra trial days on that user's Stripe checkout.

const BASE_TRIAL_DAYS = 3;   // the normal 3-day trial
const MONTH_DAYS = 30;

function normalize(s) {
  s = s && typeof s === 'object' ? s : {};
  var referees = Array.isArray(s.referees) ? s.referees : [];
  return {
    referredBy: s.referredBy || null,
    referees: referees,
    count: referees.length || (Number(s.count) || 0),
    signupPerkRedeemed: !!s.signupPerkRedeemed,
    rewardMonths: (Number.isFinite(s.rewardMonths) && s.rewardMonths > 0) ? Math.floor(s.rewardMonths) : 0,
    subscriptionCounted: !!s.subscriptionCounted,
    at: s.at || null,
  };
}

// How many free months this user can redeem at checkout right now, and the
// resulting trial length. No mutation — the caller stamps the returned `meta`
// into the Stripe subscription so the webhook can mark them redeemed.
function checkoutPerk(state) {
  var s = normalize(state);
  var signupMonths = (s.referredBy && !s.signupPerkRedeemed) ? 1 : 0;
  var rewardMonths = s.rewardMonths;
  var freeMonths = signupMonths + rewardMonths;
  return {
    freeMonths: freeMonths,
    trialDays: freeMonths > 0 ? freeMonths * MONTH_DAYS : BASE_TRIAL_DAYS,
    meta: { signupApplied: signupMonths === 1, rewardMonthsApplied: rewardMonths },
  };
}

// After a subscription is confirmed, mark the perks that were applied to it as
// spent. Idempotency is the caller's job (gate on subscriptionCounted).
function redeem(state, meta) {
  var s = normalize(state);
  if (meta && meta.signupApplied) s.signupPerkRedeemed = true;
  if (meta && meta.rewardMonthsApplied > 0) s.rewardMonths = Math.max(0, s.rewardMonths - meta.rewardMonthsApplied);
  return s;
}

// Referrer earns one free month when a referee subscribes.
function accrueReward(referrerState) {
  var s = normalize(referrerState);
  s.rewardMonths = s.rewardMonths + 1;
  return s;
}

module.exports = { BASE_TRIAL_DAYS, MONTH_DAYS, normalize, checkoutPerk, redeem, accrueReward };
