/* ═══ Models / Formulas ═══ Pure game math — no React, no DOM, no I/O */

/* Short name (drop "the Swift" etc.) */
export function sh(n) { return (n || "?").split(" the ")[0]; }

/* Button style factory */
export function bs(bg, c) {
  return { background: bg, color: c, border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 15, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" };
}

/* Player+all NPCs sorted by season points (SP) */
export function getRanked(S) {
  var all = [Object.assign({}, S.player, { name: S.pName })].concat(S.npcs);
  all.sort(function (a, b) { return (b.sp || 0) - (a.sp || 0); });
  return all;
}

/* Player+all NPCs sorted by all-time points (AP) */
export function getARanked(S) {
  var all = [Object.assign({}, S.player, { name: S.pName })].concat(S.npcs);
  all.sort(function (a, b) { return (b.ap || 0) - (a.ap || 0); });
  return all;
}

/* Compute player's current rank out of the full field */
export function pRankOf(S) {
  var r = getRanked(S);
  for (var i = 0; i < r.length; i++) { if (r[i].isP) return i + 1; }
  return 1001;
}

/* NPC vs NPC bracket resolution — skill + training with a random roll */
export function nW(a, b) {
  var ta = a.tr || {}, tb = b.tr || {};
  var bA = ((ta.r||0)+(ta.p||0)+(ta.f||0)+(ta.s||0)+(ta.g||0)) * 0.9;
  var bB = ((tb.r||0)+(tb.p||0)+(tb.f||0)+(tb.s||0)+(tb.g||0)) * 0.9;
  var sA = Math.min(95, 55 + ((a.skill||50)+bA) * 0.4);
  var sB = Math.min(95, 55 + ((b.skill||50)+bB) * 0.4);
  return (sA + Math.random() * 14 - 5) >= (sB + Math.random() * 14 - 5) ? a : b;
}

/* Training point cost for next level of a stat */
export function trainCost(lv) {
  return (lv + 1) * 15 + Math.max(0, lv - 8) * 15;
}
