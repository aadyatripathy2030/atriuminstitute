// Thin wrapper around the Stripe SDK so server.js doesn't have to know
// SDK details. Holds the price-id lookup, builds Checkout Sessions with
// trials, and exposes a webhook constructor that validates signatures.
//
// Env vars consumed:
//   STRIPE_SECRET_KEY        sk_test_… or sk_live_…  (required to do anything)
//   STRIPE_PRICE_ID_MONTHLY  price_…  (required for the monthly plan)
//   STRIPE_PRICE_ID_YEARLY   price_…  (required for the yearly plan)
//   STRIPE_WEBHOOK_SECRET    whsec_…  (required to receive webhooks)
//   SITE_URL                 e.g. https://atriuminstitute.com (used as
//                            success/cancel URL roots; falls back to
//                            atriuminstitute.onrender.com)

const SECRET_KEY = process.env.STRIPE_SECRET_KEY || '';
const PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || '';
const PRICE_YEARLY  = process.env.STRIPE_PRICE_ID_YEARLY  || '';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';
const SITE_URL = (process.env.SITE_URL || 'https://atriuminstitute.onrender.com').replace(/\/$/, '');

// Kill switch. When PAYWALL_DISABLED is unset or anything other than the
// literal string "0", the paywall is OFF: isConfigured() returns false,
// every code path that asked "is Stripe live?" sees No, /api/claude does
// not gate, /api/stripe/checkout returns 503. The Stripe code stays in
// place so flipping this back to "0" re-enables everything.
const PAYWALL_DISABLED = (process.env.PAYWALL_DISABLED || '1') !== '0';

const TRIAL_DAYS = 3;

let stripe = null;
try {
  // Lazy require so the rest of the app still boots if `stripe` isn't
  // installed yet (e.g. running tests locally without `npm install`).
  if (SECRET_KEY) stripe = require('stripe')(SECRET_KEY, { apiVersion: '2024-12-18.acacia' });
} catch (e) {
  console.warn('Stripe SDK not loaded:', e.message);
}

function isConfigured() {
  if (PAYWALL_DISABLED) return false;
  return !!(stripe && PRICE_MONTHLY && PRICE_YEARLY);
}

function priceFor(plan) {
  if (plan === 'yearly') return PRICE_YEARLY;
  return PRICE_MONTHLY;
}

// Map of statuses we treat as "paying / has access"
const ACTIVE_STATUSES = new Set(['active', 'trialing']);
function isActiveStatus(s) { return s && ACTIVE_STATUSES.has(s); }

// Make sure the user has a Stripe Customer attached. If not, create one
// and persist it via the provided db callback.
async function ensureCustomer(user, db) {
  if (!isConfigured()) throw new Error('Stripe is not configured on the server.');
  if (user.stripe_customer_id) return user.stripe_customer_id;
  const customer = await stripe.customers.create({
    email: user.email,
    metadata: { atrium_user_id: user.id },
  });
  await db.setStripeCustomerId(user.id, customer.id);
  return customer.id;
}

async function createCheckoutSession(user, db, plan) {
  if (!isConfigured()) throw new Error('Stripe is not configured.');
  const priceId = priceFor(plan);
  if (!priceId) throw new Error('Unknown plan: ' + plan);
  const customer = await ensureCustomer(user, db);
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: {
      trial_period_days: TRIAL_DAYS,
      metadata: { atrium_user_id: user.id, plan },
    },
    // Avoid charging users without confirming the address/card — keep it
    // friction-free for the trial.
    payment_method_collection: 'if_required',
    allow_promotion_codes: true,
    success_url: `${SITE_URL}/?upgrade=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/?upgrade=cancelled`,
    client_reference_id: user.id,
    metadata: { atrium_user_id: user.id, plan },
  });
  return session.url;
}

// Cancel a user's active Stripe subscription immediately. Used by the
// self-serve account-delete flow so a deleted account doesn't keep
// getting charged. Safe to call when there's no subscription on file
// or when Stripe isn't configured -- both paths return false.
async function cancelSubscriptionForUser(user) {
  if (!isConfigured() || !stripe) return false;
  if (!user || !user.stripe_subscription_id) return false;
  try {
    await stripe.subscriptions.cancel(user.stripe_subscription_id);
    return true;
  } catch (e) {
    // Already-cancelled / unknown / 4xx Stripe errors are not fatal
    // for the account-delete flow. Log and carry on.
    console.warn('Stripe subscription cancel failed:', e.message);
    return false;
  }
}

async function createPortalSession(user, db) {
  if (!isConfigured()) throw new Error('Stripe is not configured.');
  const customer = await ensureCustomer(user, db);
  const portal = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${SITE_URL}/?from=portal`,
  });
  return portal.url;
}

function constructWebhookEvent(rawBody, signatureHeader) {
  if (!stripe) throw new Error('Stripe SDK not loaded');
  if (!WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET not set');
  return stripe.webhooks.constructEvent(rawBody, signatureHeader, WEBHOOK_SECRET);
}

// Translate a Stripe subscription object into the rows we want in our DB.
function subscriptionRow(sub) {
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
  return {
    stripe_subscription_id: sub.id,
    subscription_status: sub.status,
    current_period_end: periodEnd,
    plan: planFromSubscription(sub),
  };
}

function planFromSubscription(sub) {
  if (!sub.items || !sub.items.data || !sub.items.data[0]) return null;
  const pid = sub.items.data[0].price && sub.items.data[0].price.id;
  if (pid === PRICE_YEARLY) return 'yearly';
  if (pid === PRICE_MONTHLY) return 'monthly';
  return null;
}

module.exports = {
  isConfigured,
  isActiveStatus,
  createCheckoutSession,
  createPortalSession,
  cancelSubscriptionForUser,
  constructWebhookEvent,
  subscriptionRow,
  priceFor,
  TRIAL_DAYS,
  // exposed for tests
  _planFromSubscription: planFromSubscription,
};
