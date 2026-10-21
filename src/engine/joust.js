/* ═══ Engine / Joust ═══ The match, one set of rules for every rider. Each rider strikes on her OWN bar, built only from
   her own abilities (training levels, after injuries), today's round and lanes, her kit, her tiredness and the stands.
   Where she stops on it is down to her hands: for you, your real finger; for a rival, her talent — a steady wobble that
   costs more the faster her bar runs, a form for the day, and no wild collapses. Rival-vs-rival matches use exactly this,
   strike by strike. Nothing here looks at the other rider's abilities except the stands and nerves. */

import { conditionOf, softZone } from "./events";
import { kitFx } from "./gear";
import { fatigueFx } from "./fitness";

/* What one training level does (before the lanes weight it) */
export var LV = { r: 0.03, s: 0.07, p: 0.4, f: 0.5, g: 1.5, gs: 0.05 };   /* tuned so a level of each is worth about the same (sim) */
/* The bar of a rider with no training, in round difficulty `diff` (tier + round; see roundDiff) */
export var BASE = { zone: 12, zonePerDiff: 1.5, speed: 2.4, speedPerDiff: 0.4, accel: 0.45 };
export var CTR = 72;
/* Levels give a little less the higher they go: level 5 works like 4.3, 10 like 7.6, 20 like 11.4 (K = 16) */
export var SAT = 16;
export function effLevel(l) { return l > 0 ? SAT * (1 - Math.exp(-l / SAT)) : l; }
export var STRIKES = 3;

/* ── One rider's bar ── o: { tr, diff, cond, kit, fit, crowd (+zone from the stands), nerves (−zone) } */
export function riderBar(o) {
  var C = conditionOf(o.cond), W = C.w || {}, t = o.tr || {}, K = kitFx(o.kit, o.cond), F = fatigueFx(o.fit || { g: 100, r: 100 });
  function L(k) { return effLevel(t[k] || 0) * (W[k] != null ? W[k] : 1); }
  var zone = softZone(BASE.zone - o.diff * BASE.zonePerDiff + L("p") * LV.p + C.zone + K.zone + F.zone) + (o.crowd || 0) - (o.nerves || 0);
  return {
    zone: Math.max(2, zone),
    speed: (BASE.speed + o.diff * BASE.speedPerDiff) * Math.max(0.35, 1 - L("r") * LV.r) * C.speed * K.speed * F.speed,
    accel: BASE.accel * Math.max(0.2, 1 - L("s") * LV.s) * C.accel * K.accel * F.accel,
    aim: L("f") * LV.f + K.aim, lvAim: L("f") * LV.f, kitAim: K.aim, gold: K.gold, miss: K.miss + F.miss, tiredMiss: F.miss,
    floor: Math.max(0, 15 + L("g") * LV.g + K.floor),
    slope: 2.2 * Math.max(0.3, 1 - L("g") * LV.gs)   /* how fast a miss loses points: Stubbornness softens it */
  };
}
/* Bar speed for a strike: each strike of a set a little faster, each set starting a little faster */
export function speedAt(bar, setIdx, strikeIdx) { return bar.speed + setIdx * bar.accel * 0.6 + strikeIdx * bar.accel; }

/* Where it landed → points, then the bonuses on top, with no ceiling.
   The landing: 100 only dead on the line, 85 at the gold's edge, 70 just outside, falling to the floor.
   The bonus (Aim, gear, tiredness) is added after, so a near-perfect strike with good training can read 103. */
/* In the gold: 100 only dead on the line, 85 at the gold's edge — and the points fall fastest near the centre (exponent < 1),
   so real precision pays: a strike a fifth of the way out keeps about 95, half way out about 91. Same for every rider. */
export var GOLD = { exp: 0.75 };
export function goldBase(rel) { return 100 - 15 * Math.pow(Math.max(0, Math.min(1, rel)), GOLD.exp); }
export function landScore(d, bar, jitter) {
  var half = bar.zone / 2, inZ = d <= half;
  var base = inZ ? goldBase(d / half) : Math.max(bar.floor, 70 - (d - half) * (bar.slope || 2.2));
  base = Math.max(0, Math.min(100, base + (jitter || 0)));
  var bonus = bar.aim + (inZ ? bar.gold : bar.miss);
  return { inZ: inZ, base: base, bonus: bonus, total: Math.max(0, base + bonus) };
}

/* ── Hands ── a rider's wobble, in "% of a normal-speed bar" units (a normal bar crosses 144% a second, so 1 unit ≈ 7 ms).
   Anchored to how precisely people stop a moving marker: a beginner (~65 ms, 9.4) reads 25, an average practised player
   (~40 ms, 6.5) 55, and the tour's elite talent 90 is ~3.1 (~21 ms). Your hands are measured on this same scale.
   (a was 11.35 until season 8, then 12.8; 11.8 since the ability ladder — rivals and your reading move together.) */
export var HANDS = { a: 11.8, b: 0.097 };
export function handsOf(talent) { return Math.max(1, HANDS.a - (talent || 50) * HANDS.b); }
export function talentOfHands(h) { return Math.max(0, Math.min(100, (HANDS.a - h) / HANDS.b)); }
function gauss(rnd) { var u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
export function dayForm(rnd) { return Math.exp(gauss(rnd || Math.random) * 0.08); }
/* A rival's strike: how far from the centre she stops, at this bar speed */
export function npcMiss(talent, form, spd, rnd) {
  rnd = rnd || Math.random; var g = gauss(rnd); while (Math.abs(g) > 2) g = gauss(rnd);
  return g * handsOf(talent) * (form || 1) * spd / BASE.speed;
}
/* Your hands, measured: each strike's distance from the centre at its bar speed. Kept as a running average of the
   last ~200 strikes. A rival's typical |wobble| is 0.73 of her hands figure (her bad strikes stop at two wobbles out). */
export function handsSample(d, spd) { return d * BASE.speed / Math.max(0.5, spd); }
export function addHands(hm, sample) {
  /* one wild strike (a fumbled tap) counts as at most three times your usual miss, so it can't skew the picture */
  if (hm && hm.n >= 10) sample = Math.min(sample, hm.m * 3);
  var n = Math.min(200, ((hm && hm.n) || 0) + 1), m = hm && hm.n ? hm.m + (sample - hm.m) / n : sample;
  return { n: n, m: Math.round(m * 1000) / 1000 };
}
export function handsTalent(hm) { return hm && hm.n >= 30 ? Math.round(talentOfHands(hm.m / 0.73)) : null; }

/* ── Ability and the gap between two riders ── a rider's ability is her typical strike from her talent and her training
   alone (no kit, no tiredness, no lanes: those come and go): her hands' usual miss on a reference bar. When two meet,
   the stronger one's gold grows and the weaker one's shrinks, by GAP.c % of the bar per point of difference, at most
   GAP.cap % in all (split between them). Two riders of a level feel nothing; a qualifier facing a top-3 legend feels it.
   The weaker rider's part fades with every set she wins. Same rule for you (your measured hands) and every rival. */
export var GAP = { c: 0.15, cap: 2 };
export function abilityRating(tr, talent) {
  var bar = riderBar({ tr: tr, diff: 3, cond: "classic", kit: null, fit: { g: 100, r: 100 } });
  return landScore(0.73 * handsOf(talent) * bar.speed / BASE.speed, bar).total;
}
/* + = her gold grows (she's the stronger), − = it shrinks */
export function gapEdge(myRating, herRating, setsWon) {
  var e = Math.max(-GAP.cap, Math.min(GAP.cap, ((myRating || 0) - (herRating || 0)) * GAP.c)) / 2;
  if (e < 0) e *= Math.max(0, 1 - 0.4 * (setsWon || 0));
  return Math.round(e * 100) / 100;
}

/* ── Nerves (old, by rank; kept for older code paths) ── the lower-ranked rider feels it, two ways (the bigger one counts, they don't add up):
   · by how many times lower she's ranked: under ×3 nothing, ×3 −0.3%, ×30 about −0.9%, never more than 1%;
   · facing a star: a top-3 rider costs −0.6% (−0.3% if you're top 10 yourself), a top-10 rider −0.4% (nothing if
     you're top 10 too). It fades with every set she wins. */
export function nerves(myRank, herRank, setsWon) {
  myRank = myRank || 1000; herRank = Math.max(1, herRank || 1000);
  if (herRank >= myRank) return 0;
  var ratio = myRank / herRank, byRank = ratio < 3 ? 0 : Math.min(1, 0.6 * Math.log10(ratio));
  var star = herRank <= 3 ? (myRank <= 10 ? 0.3 : 0.6) : herRank <= 10 && myRank > 10 ? 0.4 : 0;
  return Math.round(Math.max(byRank, star) * Math.max(0, 1 - 0.4 * (setsWon || 0)) * 100) / 100;
}

/* ── A whole match between two rivals, on these rules ── who: { tr, talent, kit, fit, rank, love }
   ctx: { diff, cond, bo }. Returns { winner: "a" | "b", sets: [[avgA, avgB]…] } */
export function simMatch(A, B, ctx, crowdEdgeFn, rnd) {
  rnd = rnd || Math.random;
  var need = Math.ceil((ctx.bo || 3) / 2), wa = 0, wb = 0, setIdx = 0, out = [];
  var fa = dayForm(rnd), fb = dayForm(rnd), ce = crowdEdgeFn ? crowdEdgeFn(A.love || 0, B.love || 0) : { me: 0, her: 0 };
  var ra = abilityRating(A.tr, A.talent), rb = abilityRating(B.tr, B.talent);
  while (wa < need && wb < need) {
    var barA = riderBar({ tr: A.tr, diff: ctx.diff, cond: ctx.cond, kit: A.kit, fit: A.fit, crowd: ce.me, nerves: -gapEdge(ra, rb, wa) });
    var barB = riderBar({ tr: B.tr, diff: ctx.diff, cond: ctx.cond, kit: B.kit, fit: B.fit, crowd: ce.her, nerves: -gapEdge(rb, ra, wb) });
    var sa = 0, sb = 0, n = 0;
    for (var k = 0; k < STRIKES + 5; k++) {
      sa += landScore(Math.abs(npcMiss(A.talent, fa, speedAt(barA, setIdx, k), rnd)), barA).total;
      sb += landScore(Math.abs(npcMiss(B.talent, fb, speedAt(barB, setIdx, k), rnd)), barB).total; n++;
      if (n >= STRIKES && Math.round(sa / n) !== Math.round(sb / n)) break;
    }
    if (sa >= sb) wa++; else wb++;
    out.push([Math.round(sa / n), Math.round(sb / n)]); setIdx++;
  }
  return { winner: wa > wb ? "a" : "b", sets: out };
}
