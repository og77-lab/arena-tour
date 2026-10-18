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
  /* level on points: you rank behind the rival (so a brand-new granny starts at #1000) */
  all.sort(function (a, b) { return (b.sp || 0) - (a.sp || 0) || (a.isP ? 1 : 0) - (b.isP ? 1 : 0); });
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

/* Rival vs rival: the very match you play (engine/joust), strike by strike — each on her own bar from her own
   abilities, her talent's hands, her kit for these lanes, her tiredness, the stands and nerves.
   ctx: { tier, round, diff (else from tier + round), cond, bo, kit(n) → kit, rank(n) → rank } */
import { effTr, fitOf } from "../engine/fitness";
import { simMatch } from "../engine/joust";
import { crowdEdge, crowdLove } from "../engine/social";

var TIER_DIFF = [0, 1, 2, 3, 4, 3, 4];
export function nW(a, b, ctx) {
  ctx = ctx || {};
  var tier = ctx.tier != null ? ctx.tier : 2, d = ctx.diff != null ? ctx.diff : (TIER_DIFF[tier] || 0) + (ctx.round || 0) * 0.6;
  function who(n) { var r = ctx.rank ? ctx.rank(n) : 500; return { tr: effTr(n), talent: n.skill || 50, kit: ctx.kit ? ctx.kit(n) : null, fit: fitOf(n), rank: r, love: crowdLove(n, r) }; }
  return simMatch(who(a), who(b), { diff: d, bo: ctx.bo || 3, cond: ctx.cond || "classic" }, crowdEdge).winner === "a" ? a : b;
}

/* Training points a rider earns in a week — the same rule for you and every rival: a small base for turning up,
   plus a third of the ranking points won. A deep run buys a few levels on the riders who went out early;
   the edge fades once you move up to a tier where everyone is winning that much */
export var TP_BASE = 8;
export function weeklyTP(pts) { return TP_BASE + Math.floor((pts || 0) / 3); }

/* Training point cost for next level of a stat */
export function trainCost(lv) {
  return (lv + 1) * 15 + Math.max(0, lv - 8) * 15;
}
