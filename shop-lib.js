// Rewards-shop logic, kept pure and DB-free so it can be unit-tested without a
// database or HTTP server. The server (server.js) wires these to the points
// total (db.getMyPointsSummary) and the generic KV store (db.getProgress /
// db.setProgress under the 'shop_v1' key).
//
// Coins are SPENDABLE = (all-time points earned) - (points spent here). We never
// mutate the points ledger, so the leaderboard and streaks are unaffected.

// Prices live here on the server so a client can't tamper with them.
const CATALOG = [
  // Themes recolour the whole UI accent. 'classic' is the free default.
  { id: 'classic', name: 'Classic', type: 'theme', price: 0, swatch: '#4a6fa5' },
  { id: 'ocean',   name: 'Ocean',   type: 'theme', price: 200, swatch: '#1f8f8f' },
  { id: 'forest',  name: 'Forest',  type: 'theme', price: 300, swatch: '#3d8a55' },
  { id: 'sunset',  name: 'Sunset',  type: 'theme', price: 350, swatch: '#d97742' },
  { id: 'grape',   name: 'Grape',   type: 'theme', price: 450, swatch: '#7d5bb0' },
  { id: 'rose',    name: 'Rose',    type: 'theme', price: 600, swatch: '#c65b7c' },
  // Badges show next to the student's name.
  { id: 'star',    name: 'Star',    type: 'badge', price: 150, emoji: '⭐' },
  { id: 'fire',    name: 'Fire',    type: 'badge', price: 150, emoji: '🔥' },
  { id: 'rocket',  name: 'Rocket',  type: 'badge', price: 250, emoji: '🚀' },
  { id: 'brain',   name: 'Big Brain', type: 'badge', price: 300, emoji: '🧠' },
  { id: 'crown',   name: 'Crown',   type: 'badge', price: 500, emoji: '👑' },
  { id: 'diamond', name: 'Diamond', type: 'badge', price: 750, emoji: '💎' }
];

function findItem(id) { return CATALOG.find(function (i) { return i.id === id; }) || null; }
function catalog() { return CATALOG; }

// Coerce a stored blob into a well-formed shape.
function normalize(saved) {
  var s = saved && typeof saved === 'object' ? saved : {};
  var owned = Array.isArray(s.owned) ? s.owned.filter(function (x) { return typeof x === 'string' && findItem(x); }) : [];
  var eq = s.equipped && typeof s.equipped === 'object' ? s.equipped : {};
  var theme = typeof eq.theme === 'string' && findItem(eq.theme) && findItem(eq.theme).type === 'theme' ? eq.theme : 'classic';
  var badge = typeof eq.badge === 'string' && findItem(eq.badge) && findItem(eq.badge).type === 'badge' ? eq.badge : null;
  var spent = Number.isFinite(s.spent) && s.spent >= 0 ? Math.floor(s.spent) : 0;
  return { spent: spent, owned: owned, equipped: { theme: theme, badge: badge } };
}

// A free item (price 0) is usable without being in `owned`.
function has(s, id) { var it = findItem(id); return !!it && (it.price === 0 || s.owned.indexOf(id) !== -1); }

// Full state for the client. `pointsTotal` is all-time points earned.
function state(pointsTotal, saved) {
  var s = normalize(saved);
  var total = Number.isFinite(pointsTotal) ? Math.floor(pointsTotal) : 0;
  return {
    coins: Math.max(0, total - s.spent),
    earned: total,
    spent: s.spent,
    owned: s.owned,
    equipped: s.equipped,
    catalog: CATALOG
  };
}

function buy(pointsTotal, saved, itemId) {
  var item = findItem(itemId);
  if (!item) return { ok: false, error: 'That item does not exist.' };
  var s = normalize(saved);
  if (item.price === 0) return { ok: false, error: 'That one is already free.' };
  if (s.owned.indexOf(itemId) !== -1) return { ok: false, error: 'You already own that.' };
  var avail = (Number.isFinite(pointsTotal) ? Math.floor(pointsTotal) : 0) - s.spent;
  if (avail < item.price) return { ok: false, error: 'Not enough coins yet — keep studying!' };
  s.owned.push(itemId);
  s.spent += item.price;
  return { ok: true, saved: s };
}

function equip(saved, slot, itemId) {
  if (slot !== 'theme' && slot !== 'badge') return { ok: false, error: 'Unknown slot.' };
  var s = normalize(saved);
  // Unequip / reset to default.
  if (itemId == null || itemId === 'none' || (slot === 'theme' && itemId === 'classic')) {
    s.equipped[slot] = slot === 'theme' ? 'classic' : null;
    return { ok: true, saved: s };
  }
  var item = findItem(itemId);
  if (!item || item.type !== slot) return { ok: false, error: 'That item cannot go there.' };
  if (!has(s, itemId)) return { ok: false, error: "You don't own that yet." };
  s.equipped[slot] = itemId;
  return { ok: true, saved: s };
}

module.exports = { CATALOG, catalog, findItem, normalize, state, buy, equip };
