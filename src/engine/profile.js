/* ═══ Engine / Profile ═══ "Your numbers in this tournament": the same formulas the match uses (PowerBar), worked out
   for round 1 of a tier, in these lanes, with your stats against the field you'll face, your tiredness and a kit.
   Used by Get ready to show what a lance or saddle actually does to YOUR bar before you ride. */

import { conditionOf } from "./events";
import { kitFx } from "./gear";
import { fatigueFx } from "./fitness";

var TIER_DIFF = [0, 1, 2, 3, 4, 3];

/* gaps: { r, p, f, s, g } your level minus the field's (before the lanes weight them) */
export function matchNumbers(o) {
  var C = conditionOf(o.cond), W = C.w || {}, g = o.gaps || {}, K = kitFx(o.kit, o.cond), F = fatigueFx(o.fit || { g: 100, r: 100 });
  var nR = (g.r || 0) * (W.r || 1), nP = (g.p || 0) * (W.p || 1), nF = (g.f || 0) * (W.f || 1), nS = (g.s || 0) * (W.s || 1), nG = (g.g || 0) * (W.g || 1);
  var diff = TIER_DIFF[o.tier] || 0, normalSpd = 2.4 + diff * 0.4;
  var zone = Math.max(3, 13 - diff * 1.5 + nP * 1.2 + C.zone + K.zone + F.zone);
  var spd = Math.max(0.8, normalSpd - nR * 0.12) * C.speed * K.speed * F.speed;
  var acc = Math.max(0.03, 0.3 - nS * 0.015) * C.accel * K.accel * F.accel;
  return {
    zone: zone,                                   /* % of the bar */
    speed: spd / normalSpd * 100,                 /* % of a normal bar for this round */
    accel: acc / 0.3 * 100,                       /* % of a normal speed-up */
    gold: nF * 1.5 + K.aim + K.gold,              /* points added to a gold hit */
    miss: nF * 1.5 + K.aim + K.miss + F.miss,     /* points added to a miss */
    floor: Math.max(0, 15 + nG * 1.5 + K.floor)   /* the worst a strike can score */
  };
}
