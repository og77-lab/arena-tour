/* ═══ Engine / Titles ═══ A title is not just a title: four Challenger wins are not one Masters. Everywhere a rider's
   titles are shown they come split by tournament type, and where titles are compared they are weighed by the
   tournament's champion points (Futures 100 … Masters 2,000, a Slam 4,000). tt = { tierIndex: count } (5 = Slam). */

import { TIERS } from "../models/constants";

export var TIER_SHORT = ["Futures", "Challenger", "Tour 250", "Tour 500", "Masters", "Slam"];
export function champPts(t) { var T = TIERS[t]; return T ? T.pts.reduce(function (a, b) { return a + b; }, 0) : 0; }

/* "1 Masters · 3 Challenger" — biggest first */
export function titleMix(tt) {
  var out = [];
  for (var t = 5; t >= 0; t--) { var n = (tt && tt[t]) || 0; if (n) out.push(n + " " + TIER_SHORT[t]); }
  return out.join(" · ");
}
export function titleCount(tt) { var n = 0; for (var t = 0; t <= 5; t++) n += (tt && tt[t]) || 0; return n; }
export function titleValue(tt) { var v = 0; for (var t = 0; t <= 5; t++) v += ((tt && tt[t]) || 0) * champPts(t); return v; }
export function addTitle(tt, tier) { var o = Object.assign({}, tt || {}); o[tier] = (o[tier] || 0) + 1; return o; }
export function diffTitles(now, before) { var o = {}; for (var t = 0; t <= 5; t++) { var d = ((now && now[t]) || 0) - ((before && before[t]) || 0); if (d > 0) o[t] = d; } return o; }

/* A rider's titles by type: yours from your career counters, a rival's from her record */
export function playerTitles(S) {
  var s = (S.player.stats || {}).tierTitles || {}, o = {};
  for (var t = 0; t <= 5; t++) if (s[t]) o[t] = s[t];
  var gs = (S.player.best || {}).gsTitles || 0; if (gs > (o[5] || 0)) o[5] = gs;
  return o;
}
export function npcTitles(n) { return (n && n.best && n.best.tt) || {}; }
/* This season's titles from the calendar (yours) */
export function seasonTitles(S) { var o = {}; (S.cal || []).forEach(function (e) { if (e.result && e.result.won) { var t = e.type === "gs" ? 5 : (e.result.tier != null ? e.result.tier : e.tier); if (t != null) o[t] = (o[t] || 0) + 1; } }); return o; }
