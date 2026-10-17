/* ═══ Engine / Profile ═══ "Your numbers in this tournament": the same formulas the match uses (PowerBar), worked out
   for round 1 of a tier, in these lanes, with your stats against the field you'll face, your tiredness and a kit.
   Used by Get ready to show what a lance or saddle actually does to YOUR bar before you ride. */

import { conditionOf, softZone } from "./events";
import { kitFx } from "./gear";
import { fatigueFx } from "./fitness";

var TIER_DIFF = [0, 1, 2, 3, 4, 3];

/* gaps: { r, p, f, s, g } your level minus the field's (before the lanes weight them) */
export function matchNumbers(o) {
  var C = conditionOf(o.cond), W = C.w || {}, g = o.gaps || {}, K = kitFx(o.kit, o.cond), F = fatigueFx(o.fit || { g: 100, r: 100 });
  var nR = (g.r || 0) * (W.r || 1), nP = (g.p || 0) * (W.p || 1), nF = (g.f || 0) * (W.f || 1), nS = (g.s || 0) * (W.s || 1), nG = (g.g || 0) * (W.g || 1);
  var diff = TIER_DIFF[o.tier] || 0, normalSpd = 2.4 + diff * 0.4;
  var zone = softZone(13 - diff * 1.5 + nP * 1.2 + C.zone + K.zone + F.zone);
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

/* Expected points per strike for numbers like the above, for a rider of average timing: the match's own scoring
   (100 on the line, 85 at the zone edge, 70 just outside, down to the floor), averaged over a set's three strikes
   as the bar speeds up. One number that sums up zone, speed, speed-up and bonus points. */
function expScore(sd, half, n) {
  var tot = 0, ws = 0;
  for (var i = 0; i <= 48; i++) {
    var d = (i / 48) * 4 * sd, w = Math.exp(-0.5 * (d / sd) * (d / sd)) * (i === 0 ? 0.5 : 1), inZ = d <= half;
    var s = (inZ ? 100 - 15 * d / half : Math.max(n.floor, 70 - (d - half) * 2.2)) + (inZ ? n.gold : n.miss);
    tot += w * Math.max(0, Math.min(100, s)); ws += w;
  }
  return tot / ws;
}
export function pointsPerStrike(o) {
  var n = matchNumbers(o), diff = TIER_DIFF[o.tier] || 0, normalSpd = 2.4 + diff * 0.4, C = conditionOf(o.cond);
  var spd = n.speed / 100 * normalSpd, acc = n.accel / 100 * 0.3, tot = 0;
  for (var k = 0; k < 3; k++) tot += expScore(6 * (spd + k * acc) / 2.4, n.zone / 2, n);
  return tot / 3;
}
/* Bar speed through a set (start and speed-up together), as % of a normal bar */
export function barSpeed(o) { var n = matchNumbers(o), diff = TIER_DIFF[o.tier] || 0, normal = 2.4 + diff * 0.4; return (n.speed / 100 * normal + n.accel / 100 * 0.3) / (normal + 0.3) * 100; }

/* Does an event suit you? Your expected points per strike against a rider with level stats in the same lanes.
   GOOD / HARD past ±1.5 points a strike (about a set's worth over a match), EVEN in between. */
export function verdict(o) {
  var me = pointsPerStrike(o), her = pointsPerStrike({ cond: o.cond, tier: o.tier, gaps: {}, fit: { g: 100, r: 100 }, kit: null });
  var d = me - her;
  return { d: d, key: d > 1.5 ? "good" : d < -1.5 ? "hard" : "even" };
}
