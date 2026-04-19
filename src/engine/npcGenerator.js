/* ═══ Engine / NPC Generator ═══ Create the 999-NPC field with skill distribution and seeded SP */

import { EMO, FN, TT } from "../models/constants";

export function mkNPCs() {
  var npcs = [];
  for (var i = 0; i < 999; i++) {
    var fi = i % FN.length, ti = Math.floor(i / FN.length) % TT.length;
    var suffix = Math.floor(i / (FN.length * TT.length));
    var name = FN[fi] + " the " + TT[ti] + (suffix > 0 ? " " + (suffix + 1) : "");
    var pct = i / 999;
    var skill = pct < 0.03 ? 82 + Math.random() * 10
              : pct < 0.1  ? 70 + Math.random() * 14
              : pct < 0.25 ? 55 + Math.random() * 18
              : pct < 0.5  ? 38 + Math.random() * 20
              :              15 + Math.random() * 28;
    /* Seed SP based on rank position — quadratic decay, everyone has base points */
    var pot = Math.min(95, Math.round(skill + 8 + Math.random() * 15));
    npcs.push({
      id: i + 2, name: name, skill: skill, pot: pot,
      sp: 0, ap: 0, isP: false,
      emoji: EMO[i % EMO.length],
      tr: { r: 0, p: 0, f: 0, s: 0, g: 0 },
      best: { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0, careerMoney: 0 }
    });
  }
  /* Sort by skill descending, then assign seed SP by position */
  npcs.sort(function (a, b) { return (b.skill || 0) - (a.skill || 0); });
  for (var si = 0; si < npcs.length; si++) {
    var rank = si + 1;
    var seed = Math.round(5000 * Math.pow(Math.max(0, (1000 - rank) / 999), 2.5) + Math.random() * 10);
    npcs[si].sp = seed;
    npcs[si].ap = seed;
  }
  return npcs;
}
