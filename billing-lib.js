// Usage-based AI billing ledger — pure, DB-free, unit-testable.
//
// Each AI call already has a computed dollar cost (see computeCost in server.js).
// This library accumulates that cost per user in MICRO-DOLLARS (integers, to
// avoid float drift) and, at billing time, flushes whole cents onto the Stripe
// invoice while carrying the sub-cent remainder forward — so "every cent" is
// billed exactly once, with nothing lost to rounding.
//
// Units: $1 = 1,000,000 micro-dollars = 100 cents, so 1 cent = 10,000 micros.
var MICROS_PER_CENT = 10000;

function normalize(l) {
  l = l && typeof l === 'object' ? l : {};
  return {
    unbilledMicros: (Number.isFinite(l.unbilledMicros) && l.unbilledMicros > 0) ? Math.floor(l.unbilledMicros) : 0,
    billedMicros: (Number.isFinite(l.billedMicros) && l.billedMicros > 0) ? Math.floor(l.billedMicros) : 0,
  };
}

// Add one call's cost (in USD) to the unbilled balance.
function accrue(l, costUsd) {
  var s = normalize(l);
  var micros = (Number.isFinite(costUsd) && costUsd > 0) ? Math.round(costUsd * 1000000) : 0;
  s.unbilledMicros += micros;
  return s;
}

// Compute whole cents to bill now; carry the sub-cent remainder forward.
// Returns { cents, ledger } — the caller only persists `ledger` AFTER the
// charge succeeds, so a failed Stripe call never loses the balance.
function flush(l) {
  var s = normalize(l);
  var cents = Math.floor(s.unbilledMicros / MICROS_PER_CENT);
  var billed = cents * MICROS_PER_CENT;
  return {
    cents: cents,
    ledger: { unbilledMicros: s.unbilledMicros - billed, billedMicros: s.billedMicros + billed },
  };
}

// Dollar figures for display/inspection (not used for the charge itself).
function unbilledUsd(l) { return normalize(l).unbilledMicros / 1000000; }
function billedUsd(l) { return normalize(l).billedMicros / 1000000; }

module.exports = { MICROS_PER_CENT, normalize, accrue, flush, unbilledUsd, billedUsd };
