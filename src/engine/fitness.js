/* ═══ Engine / Fitness ═══ Two meters, 0–100: the granny's and the rooster's. Every match costs some of both (a
   best-of-5 costs more), and they only come back between tournaments. The same rules apply to every rider on tour.

   Every SET ridden costs some of both, so a three-set match tires more than a two-set one.

   A tired granny: a narrower gold zone, and her misses score less.
   A tired rooster: the bar starts faster and speeds up more after every strike.

   Recovery after each tournament = 65% of what's missing + 1.25 × Bounce-back (the sixth stat, 0–20 — it counts
   on its own, not against the opponent). So tiredness builds up for anyone who keeps going deep. A week off (a Grand
   Slam you don't play) recovers double. Ride on under 35% and every match risks an injury.
   The physio staff (one booking per week, as the weekly investment) adds more on top. */

import { TIERS } from "../models/constants";

export var COST = { g: 2.8, r: 3.4 }; /* per set ridden */
export var BASE_RECOVERY = 0, MISSING_SHARE = 0.65, PER_BOUNCE = 1.25;

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
/* A match of unknown length (the quick sim, a rival's past rounds): the average sets for its format */
export function matchCost(bo) { var sets = (bo || 3) >= 5 ? 4 : 2.5; return { g: COST.g * sets, r: COST.r * sets }; }
export function afterSets(f, sets) { return { g: clamp(f.g - COST.g * sets), r: clamp(f.r - COST.r * sets) }; }
export function setsOf(score) { var m = String(score || "").match(/(d+)D+(d+)/); return m ? (+m[1]) + (+m[2]) : 2.5; }
export function tierBo(ti) { return (TIERS[ti] && TIERS[ti].bo) || 3; }
export function afterMatches(f, n, bo) { var c = matchCost(bo); return { g: clamp(f.g - c.g * n), r: clamp(f.r - c.r * n) }; }

/* Between tournaments: partial recovery, double on a week off */
export function recoveryOf(bounce, rested, v) { return (BASE_RECOVERY + MISSING_SHARE * (100 - (v == null ? 100 : v)) + PER_BOUNCE * (bounce || 0)) * (rested ? 2 : 1); }
export function recover(f, bounce, rested) { return { g: clamp(f.g + recoveryOf(bounce, rested, f.g)), r: clamp(f.r + recoveryOf(bounce, rested, f.r)) }; }

/* ── Injuries ── Under 35% a match can injure you: the lower the meter, the likelier (up to 25% a match at 0).
   An injury knocks a few levels off one or two stats for a few tournaments. */
export var INJURY_LINE = 35;
export var INJURIES = [
  { id: "hamstring", side: "g", icon: "🦵", name: "Pulled hamstring", mods: { r: -3 }, len: 2 },
  { id: "elbow", side: "g", icon: "💪", name: "Jouster's elbow", mods: { f: -3 }, len: 3 },
  { id: "back", side: "g", icon: "🪑", name: "Creaky back", mods: { g: -3 }, len: 2 },
  { id: "claw", side: "r", icon: "🐾", name: "Sprained claw", mods: { p: -3 }, len: 3 },
  { id: "wing", side: "r", icon: "🪽", name: "Pulled wing", mods: { s: -3 }, len: 2 },
  { id: "wishbone", side: "r", icon: "🦴", name: "Bruised wishbone", mods: { p: -2, s: -2 }, len: 2 }
];
export var INJ_BY_ID = {}; INJURIES.forEach(function (x) { INJ_BY_ID[x.id] = x; });
/* After a match: maybe an injury (rand = a 0..1 source, so the quick sim can pass its own) */
export function rollInjury(f, rand) {
  var r = rand || Math.random, sides = [];
  if (f.g < INJURY_LINE) sides.push("g"); if (f.r < INJURY_LINE) sides.push("r");
  for (var i = 0; i < sides.length; i++) {
    var v = sides[i] === "g" ? f.g : f.r;
    if (r() < (INJURY_LINE - v) / INJURY_LINE * 0.25) { var pool = INJURIES.filter(function (x) { return x.side === sides[i]; }); var pick = pool[Math.floor(r() * pool.length)]; return { id: pick.id, left: pick.len }; }
  }
  return null;
}
export function addInjury(list, inj) { if (!inj) return list || []; var out = (list || []).filter(function (x) { return x.id !== inj.id; }); out.push(inj); return out; }
/* One tournament (or week off) passes */
export function tickInjuries(list) { return (list || []).map(function (x) { return { id: x.id, left: x.left - 1 }; }).filter(function (x) { return x.left > 0; }); }
/* Physio shortens injuries on its side by a tournament */
export function treatInjuries(list, g, r) { return (list || []).map(function (x) { var d = INJ_BY_ID[x.id]; return (d && ((d.side === "g" && g) || (d.side === "r" && r))) ? { id: x.id, left: x.left - 1 } : x; }).filter(function (x) { return x.left > 0; }); }
/* Stats as they ride today: training minus injuries (never below 0) */
export function effTr(p) {
  var tr = Object.assign({}, (p && p.tr) || {}); ((p && p.inj) || []).forEach(function (x) { var d = INJ_BY_ID[x.id]; if (!d) return; Object.keys(d.mods).forEach(function (k) { tr[k] = Math.max(0, (tr[k] || 0) + d.mods[k]); }); });
  return tr;
}
export function injuryText(x) { var d = INJ_BY_ID[x.id]; if (!d) return ""; var names = { r: "Reflexes", f: "Aim", g: "Stubbornness", p: "Steady Stride", s: "Stamina" }; return d.icon + " " + d.name + ": " + Object.keys(d.mods).map(function (k) { return names[k] + " " + d.mods[k]; }).join(", ") + " · " + x.left + " tournament" + (x.left > 1 ? "s" : "") + " left"; }

/* How tired riders play. Fresh = no effect; at 0 fitness: zone −4%, misses −10, bar starts 18% faster, speeds up 60% more.
   Felt mostly late in a tournament (a final is ridden at ~60%); best-of-5 weeks carry some tiredness into the next */
export function fatigueFx(f) {
  var tg = (100 - f.g) / 100, tr = (100 - f.r) / 100;
  return { zone: -4 * tg, miss: -10 * tg, speed: 1 + 0.18 * tr, accel: 1 + 0.6 * tr };
}
/* For NPC-vs-NPC results (the quick sim): the same tiredness as a small strength penalty */
export function fatiguePenalty(p) { var f = fitOf(p); return ((100 - f.g) + (100 - f.r)) / 2 * 0.1; }

/* Readable effects of the current fitness */
export function fitLines(f) {
  var x = fatigueFx(f), out = [];
  if (f.g < 100) out.push("👵 gold zone " + Math.abs(x.zone).toFixed(1) + "% narrower, misses −" + Math.round(Math.abs(x.miss)));
  if (f.r < 100) out.push("🐓 bar starts " + Math.round((x.speed - 1) * 100) + "% faster, speeds up " + Math.round((x.accel - 1) * 100) + "% more");
  return out;
}
export function fitColor(v) { return v >= 80 ? "#16a34a" : v >= 55 ? "#d97706" : "#dc2626"; }
export function fitWord(v) { return v >= 90 ? "Fresh" : v >= 75 ? "Fine" : v >= 55 ? "Tired" : v >= 35 ? "Weary" : "Exhausted"; }
