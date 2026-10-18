/* ═══ Engine / Profile ═══ "Your numbers in this tournament": the same formulas the match uses (PowerBar), worked out
   for round 1 of a tier, in these lanes, with your stats against the field you'll face, your tiredness and a kit.
   Used by Get ready to show what a lance or saddle actually does to YOUR bar before you ride. */

import { conditionOf, softZone } from "./events";
import { kitFx } from "./gear";
import { fatigueFx } from "./fitness";
import { riderBar, BASE } from "./joust";

var TIER_DIFF = [0, 1, 2, 3, 4, 3];

/* o: { tr (your levels as you ride today), tier, cond, fit, kit } — your own bar from engine/joust, round 1 of the tier */
export function matchNumbers(o) {
  var diff = TIER_DIFF[o.tier] || 0, normalSpd = BASE.speed + diff * BASE.speedPerDiff;
  var B = riderBar({ tr: o.tr || {}, diff: diff, cond: o.cond, kit: o.kit, fit: o.fit });
  return {
    zone: B.zone,                                 /* % of the bar */
    speed: B.speed / normalSpd * 100,             /* % of an untrained bar for this round */
    accel: B.accel / BASE.accel * 100,            /* % of an untrained speed-up */
    gold: B.aim + B.gold, miss: B.aim + B.miss,   /* points added to a gold hit / a miss */
    floor: B.floor, slope: B.slope
  };
}

/* Expected points per strike for numbers like the above, for a rider of average timing: the match's own scoring
   (100 on the line, 85 at the zone edge, 70 just outside, down to the floor), averaged over a set's three strikes
   as the bar speeds up. One number that sums up zone, speed, speed-up and bonus points. */
function expScore(sd, half, n) {
  var tot = 0, ws = 0;
  for (var i = 0; i <= 48; i++) {
    var d = (i / 48) * 4 * sd, w = Math.exp(-0.5 * (d / sd) * (d / sd)) * (i === 0 ? 0.5 : 1), inZ = d <= half;
    var s = (inZ ? 100 - 15 * d / half : Math.max(n.floor, 70 - (d - half) * (n.slope || 2.2))) + (inZ ? n.gold : n.miss);
    tot += w * Math.max(0, Math.min(100, s)); ws += w;
  }
  return tot / ws;
}
export function pointsPerStrike(o) {
  var n = matchNumbers(o), diff = TIER_DIFF[o.tier] || 0, normalSpd = 2.4 + diff * 0.4, C = conditionOf(o.cond);
  var spd = n.speed / 100 * normalSpd, acc = n.accel / 100 * BASE.accel, tot = 0;
  for (var k = 0; k < 3; k++) tot += expScore(6 * (spd + k * acc) / 2.4, n.zone / 2, n);
  return tot / 3;
}
/* Bar speed through a set (start and speed-up together), as % of a normal bar */
export function barSpeed(o) { var n = matchNumbers(o), diff = TIER_DIFF[o.tier] || 0, normal = 2.4 + diff * 0.4; return (n.speed / 100 * normal + n.accel / 100 * BASE.accel) / (normal + BASE.accel) * 100; }

/* Does an event suit you? Your expected points per strike against a rider with level stats in the same lanes.
   GOOD / HARD past ±1.5 points a strike (about a set's worth over a match), EVEN in between. */
export function verdict(o) {
  var me = pointsPerStrike(o), her = pointsPerStrike({ cond: o.cond, tier: o.tier, tr: {}, fit: { g: 100, r: 100 }, kit: null });
  var d = me - her;
  return { d: d, key: d > 1.5 ? "good" : d < -1.5 ? "hard" : "even" };
}
