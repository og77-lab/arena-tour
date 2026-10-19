/* ═══ Engine / NPC Generator ═══ Create the 999-NPC field with skill distribution and seeded SP */

import { EMO, TT } from "../models/constants";
import { npcName } from "../models/persona";
import { trainCost } from "../models/formulas";

/* Talent ceilings: only five riders on the whole tour can ever reach 90 — one a touch above the rest, one close
   behind her, three more just over the line. Everyone else tops out below 90. Talent never passes potential. */
var ELITE_POT = [94, 92.5, 91, 90.5, 90];
export function shapePotentials(npcs) {
  var order = npcs.slice().sort(function (a, b) { return (b.pot || 0) + (b.skill || 0) * 0.5 - ((a.pot || 0) + (a.skill || 0) * 0.5); });
  order.forEach(function (n, i) {
    n.pot = i < ELITE_POT.length ? ELITE_POT[i] : Math.min(n.pot || 60, 89.4 - i * 0.002);
    if (n.skill > n.pot) n.skill = n.pot;
  });
  return npcs;
}
/* Starting levels for a new tour: a bank of training points from talent (talent × 1.5), spent level by level on
   her favourite stat first and then evenly — so talent 31 starts a little ahead of talent 30, not a whole level */
function startLevels(n) {
  var tp = (n.skill || 30) * 1.5, tr = { r: 0, p: 0, f: 0, s: 0, g: 0 }, keys = ["r", "p", "f", "s", "g"], fav = keys[n.id % 5];
  for (var guard = 0; guard < 40; guard++) {
    var best = null; keys.forEach(function (k) { if (best == null || tr[k] - (k === fav ? 1 : 0) < tr[best] - (best === fav ? 1 : 0)) best = k; });
    var c = trainCost(tr[best]); if (tp < c) break; tp -= c; tr[best]++;
  }
  tr.tp = Math.round(tp); return tr;
}

export function mkNPCs() {
  var npcs = [];
  for (var i = 0; i < 999; i++) {
    var name = npcName(i) + " the " + TT[(i * 13) % TT.length]; /* unique full name + a title */
    var pct = i / 999;
    var skill = pct < 0.03 ? 82 + Math.random() * 10
              : pct < 0.1  ? 70 + Math.random() * 14
              : pct < 0.25 ? 55 + Math.random() * 18
              : pct < 0.5  ? 38 + Math.random() * 20
              :              15 + Math.random() * 28;
    /* Seed SP based on rank position — quadratic decay, everyone has base points */
    var pot = Math.round(skill + 6 + Math.random() * 12);
    npcs.push({
      id: i + 2, name: name, skill: skill, pot: pot,
      sp: 0, ap: 0, isP: false,
      emoji: EMO[i % EMO.length],
      tr: null,
      best: { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0, careerMoney: 0 }
    });
  }
  shapePotentials(npcs);
  npcs.forEach(function (n) { n.tr = startLevels(n); });
  /* Sort by skill descending, then assign seed SP by position */
  npcs.sort(function (a, b) { return (b.skill || 0) - (a.skill || 0); });
  for (var si = 0; si < npcs.length; si++) {
    var rank = si + 1;
    var seed = Math.round(3000 * Math.pow(Math.max(0, (1000 - rank) / 999), 2.5) + Math.random() * 10);
    npcs[si].sp = seed;
    npcs[si].ap = seed;
  }
  return npcs;
}
