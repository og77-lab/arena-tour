/* ═══ Engine / Fitness ═══ Two meters, 0–100: the granny's and the rooster's. Every match costs some of both (a
   best-of-5 costs more), and they only come back between tournaments. The same rules apply to every rider on tour.

   A tired granny: a narrower gold zone, and her misses score less.
   A tired rooster: the bar starts faster and speeds up more after every strike.

   Recovery each week = 25 + 1.25 × Bounce-back (the sixth stat, 0–20 — it counts on its own, not against the
   opponent). A week off (a Grand Slam you don't play, or no tournament at all) recovers double.
   The physio staff (one booking per week, as the weekly investment) adds more on top. */

import { TIERS } from "../models/constants";

export var COST = { g: 5, r: 6 };
export var BASE_RECOVERY = 25, PER_BOUNCE = 1.25;

/* Physio staff: booked as this week's investment, effect is immediate */
export var STAFF = [
  { id: "nurse", icon: "👩‍⚕️", name: "Nurse Nellie", sub: "Liniment, lavender and a very firm 'sit DOWN, dear'.", g: 35, r: 0, priceMul: 0.12 },
  { id: "doctor", icon: "🩺", name: "Dr. Featherby, rooster chiropractor", sub: "One crack of the wishbone and he's strutting again.", g: 0, r: 35, priceMul: 0.12 },
  { id: "spa", icon: "🛁", name: "Spa weekend at Bingo-on-Sea", sub: "Mud baths for her, a dust bath for him, bingo for both.", g: 20, r: 20, priceMul: 0.18 }
];

function clamp(x) { return Math.max(0, Math.min(100, Math.round(x))); }

/* Fitness of any rider (player or NPC); missing means fresh */
export function fitOf(p) { return { g: p && p.fg != null ? p.fg : 100, r: p && p.fr != null ? p.fr : 100 }; }
/* Write fitness back onto a rider object; fresh riders don't store anything (keeps saves small, no undefined) */
export function putFit(p, f) {
  var g = clamp(f.g), r = clamp(f.r);
  if (g >= 100) delete p.fg; else p.fg = g;
  if (r >= 100) delete p.fr; else p.fr = r;
  return p;
}

/* What one match costs, by format */
export function matchCost(bo) { var m = (bo || 3) >= 5 ? 1.5 : 1; return { g: COST.g * m, r: COST.r * m }; }
export function tierBo(ti) { return (TIERS[ti] && TIERS[ti].bo) || 3; }
export function afterMatches(f, n, bo) { var c = matchCost(bo); return { g: clamp(f.g - c.g * n), r: clamp(f.r - c.r * n) }; }

/* Between tournaments: partial recovery, double on a week off */
export function recoveryOf(bounce, rested) { return (BASE_RECOVERY + PER_BOUNCE * (bounce || 0)) * (rested ? 2 : 1); }
export function recover(f, bounce, rested) { var x = recoveryOf(bounce, rested); return { g: clamp(f.g + x), r: clamp(f.r + x) }; }

/* How tired riders play. Fresh = no effect; at 0 fitness: zone −2.5%, misses −6, bar starts 10% faster, speeds up 35% more */
export function fatigueFx(f) {
  var tg = (100 - f.g) / 100, tr = (100 - f.r) / 100;
  return { zone: -2.5 * tg, miss: -6 * tg, speed: 1 + 0.1 * tr, accel: 1 + 0.35 * tr };
}
/* For NPC-vs-NPC results (the quick sim): the same tiredness as a small strength penalty */
export function fatiguePenalty(p) { var f = fitOf(p); return ((100 - f.g) + (100 - f.r)) / 2 * 0.06; }

/* Readable effects of the current fitness */
export function fitLines(f) {
  var x = fatigueFx(f), out = [];
  if (f.g < 100) out.push("👵 gold zone " + Math.abs(x.zone).toFixed(1) + "% narrower, misses −" + Math.round(Math.abs(x.miss)));
  if (f.r < 100) out.push("🐓 bar starts " + Math.round((x.speed - 1) * 100) + "% faster, speeds up " + Math.round((x.accel - 1) * 100) + "% more");
  return out;
}
export function fitColor(v) { return v >= 80 ? "#16a34a" : v >= 55 ? "#d97706" : "#dc2626"; }
export function fitWord(v) { return v >= 90 ? "Fresh" : v >= 75 ? "Fine" : v >= 55 ? "Tired" : v >= 35 ? "Weary" : "Exhausted"; }
