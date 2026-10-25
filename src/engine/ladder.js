/* ═══ Engine / Ladder ═══ What the rivals at each tier are really like, measured on the current world with the match
   engine itself (engine/joust): their average talent, their typical set in round 1 on their own tier's bar, and the
   same riders on one common bar (a Futures bar). The tier's own bar gets harder as the tier rises (smaller gold, faster
   bar) for you and her alike, so her own-bar number stays level while the common-bar number shows how much better
   she really is. Seeded, so the table doesn't change every time it opens. */

import { getRanked } from "../models/formulas";
import { TIERS } from "../models/constants";
import { riderBar, speedAt, landScore, npcMiss, dayForm, STRIKES } from "./joust";

function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

function setAvg(o, diff, rnd, sets) {
  var B = riderBar({ tr: o.tr, diff: diff, cond: "classic", kit: null, fit: { g: 100, r: 100 } }), tot = 0, n = 0;
  for (var m = 0; m < sets; m++) {
    var form = dayForm(rnd);
    for (var k = 0; k < STRIKES; k++) { tot += landScore(Math.abs(npcMiss(o.skill, form, speedAt(B, 0, k), rnd)), B, 0).total; n++; }
  }
  return tot / n;
}

export function tierLadder(S) {
  var ranked = getRanked(S).filter(function (p) { return !p.isP; }), rnd = rng((S.sNum || 1) * 7919 + 17), out = [];
  for (var t = 0; t <= 4; t++) {
    var T = TIERS[t], lo = T.rankRange[0], hi = Math.min(ranked.length, T.rankRange[1]);
    var field = ranked.slice(lo - 1, hi), step = Math.max(1, Math.floor(field.length / 40)), sample = field.filter(function (_, i) { return i % step === 0; });
    var tal = 0, own = 0, common = 0;
    sample.forEach(function (o) { tal += o.skill || 60; own += setAvg(o, t, rnd, 12); common += setAvg(o, 0, rnd, 12); });
    var n = Math.max(1, sample.length);
    out.push({ tier: t, name: T.name, talent: Math.round(tal / n), own: Math.round(own / n), common: Math.round(common / n) });
  }
  return out;
}
