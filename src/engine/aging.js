/* ═══ Engine / Aging ═══ Grannies get older, you included: y = seasons on the tour (1 in the first). Each stat ages on
   its own (ageStats below: its own first season of decline and its own pace), and levels above a stat's ceiling are
   lost at the start of a season. ageCap is the old single curve, kept for the off-season notice and old saves.
   At the end of every season some rivals retire (from 8 seasons on, more the older and the lower ranked — about 50 a
   year) and each is replaced by a newcomer who starts at the bottom with her own talent and potential.
   Measured over 30 seasons on the real engine: the field keeps moving instead of everyone maxing out. */

import { TOTAL_EVENTS } from "../models/constants";
import { FIRST_NAMES } from "../models/names";
import { TT, EMO } from "../models/constants";
import { getRanked } from "../models/formulas";
import { startLevels, liftTalent } from "./npcGenerator";

export var PEAK_SEASONS = 10;
var K = 0.117, P = 1.63;

/* Highest level a stat can be trained to at this age (before any rooster pedigree) */
export function ageCap(y) { y = y || 1; return y <= PEAK_SEASONS ? 20 : Math.max(1, Math.round(20 - K * Math.pow(y - PEAK_SEASONS, P))); }
export function ageOf(p) { return (p && p.y) || 1; }

/* ── Each stat ages on its own ── for every rider, each stat has its own first season of decline (after season 9–13)
   and its own pace (×0.6–1.5), fixed by her seed (a rival's id; yours is drawn when your granny starts). From then on
   the stat has a ceiling (S.ac, one per stat): it starts at the level she holds (at least 12) and drops every season —
   about a quarter of a level a season at first, a little faster each year, times her pace, with a dice roll on top. Levels above the
   ceiling are lost. So one granny's Reflexes go early while her Power holds, and the next one the other way round. */
var SK = ["r", "p", "f", "s", "g", "b"];
function hash01(seed, i, salt) {
  var x = (Math.imul(seed | 0, 2654435761) + Math.imul(i + 1, 40503) + salt) | 0;
  x = Math.imul(x ^ (x >>> 16), 2246822519); x = Math.imul(x ^ (x >>> 13), 3266489917); x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}
export var AGE = { from: 9, spread: 5, pace0: 0.6, paceSpan: 0.9, base: 0.25, grow: 0.05, start: 12 };
export function ageShape(seed, k) { var i = SK.indexOf(k); return { from: AGE.from + Math.floor(hash01(seed, i, 17) * AGE.spread), pace: AGE.pace0 + hash01(seed, i, 91) * AGE.paceSpan }; }
export function ageSeedOf(p) { return (p && (p.isP ? p.ageSeed : p.id)) || 1; }
/* The level a stat can be trained to now (before any rooster pedigree): 20 until its decline begins */
export function riderCap(p, k) { var i = SK.indexOf(k), ac = p && p.ac; return ac && ac[i] != null ? Math.max(1, Math.floor(ac[i])) : 20; }
/* A season older (y = the new season on tour): each stat's ceiling starts or keeps falling. extra[k] = pedigree levels
   on top of the ceiling. Returns { tr, ac (null while no stat has started), lost, drops: { stat: levels lost } } */
export function ageStats(p, y, rnd, extra) {
  rnd = rnd || Math.random; extra = extra || {};
  var seed = ageSeedOf(p), tr = Object.assign({}, (p && p.tr) || {}), ac = ((p && p.ac) || []).slice(), lost = 0, drops = {}, any = false;
  SK.forEach(function (k, i) {
    var a = ageShape(seed, k);
    if (y > a.from) {
      if (ac[i] == null) ac[i] = Math.max(AGE.start, (tr[k] || 0) - (extra[k] || 0)) + 0.99;
      ac[i] = Math.max(1, Math.round((ac[i] - AGE.base * a.pace * (1 + AGE.grow * (y - a.from)) * (0.4 + rnd() * 1.2)) * 10) / 10);
      var c = Math.floor(ac[i]) + (extra[k] || 0);
      if ((tr[k] || 0) > c) { drops[k] = tr[k] - c; lost += tr[k] - c; tr[k] = c; }
      any = true;
    } else ac[i] = null;
  });
  return { tr: tr, ac: any ? ac : null, lost: lost, drops: drops };
}

/* Season start: levels above the cap are gone (returns how many were lost) */
export function clampToAge(tr, cap) {
  var lost = 0, out = Object.assign({}, tr || {});
  ["r", "p", "f", "s", "g", "b"].forEach(function (k) { if ((out[k] || 0) > cap) { lost += out[k] - cap; out[k] = cap; } });
  return { tr: out, lost: lost };
}

/* Chance a rival retires at the end of a season: none before 8 seasons, then rising with age; rankPct 0 = #1, 1 = last */
export function retireChance(y, rankPct) { if (y < 8) return 0; return Math.min(0.95, 0.0042 * Math.pow(y - 7, 1.6) * (0.5 + rankPct)); }

/* Old saves: rivals get an age spread over 1–16 seasons (fixed per rider), you count from season 1 */
function h(id) { return (Math.imul(id || 7, 2654435761) >>> 0); }
export function needsAge(S) { return !!(S && S.npcs && S.player && (S.player.y == null || S.npcs.some(function (n) { return n.y == null; }))); }
export function toAge(S) {
  if (!needsAge(S)) return S;
  var out = Object.assign({}, S, { npcs: S.npcs.map(function (n) { return n.y != null ? n : Object.assign({}, n, { y: 1 + (h(n.id) >>> 8) % 16 }); }) });
  if (S.player.y == null) out.player = Object.assign({}, S.player, { y: S.sNum || 1 });
  return out;
}

/* A first name nobody on the tour has now; a name a recent retiree wore comes back as "II", "III"… */
var ROMAN = ["", " II", " III", " IV", " V", " VI", " VII", " VIII"];
function freshName(taken, recent, rnd) {
  var pool = FIRST_NAMES.filter(function (f) { return !taken[f]; });
  var fresh = pool.filter(function (f) { return !recent[f]; });
  var first = (fresh.length ? fresh : pool)[Math.floor(rnd() * (fresh.length ? fresh.length : pool.length))] || "Granny";
  var base = first, n = recent[first] || 0;
  if (n) first = base + (ROMAN[n] || " " + (n + 1));
  taken[base] = 1;
  return first + " the " + TT[Math.floor(rnd() * TT.length)];
}

/* A newcomer: talent at the tour's floor (60–62), her own potential (one in 25 is a prodigy), no points yet */
function newcomer(id, name, rnd) {
  var skill = liftTalent(15 + rnd() * 28), prodigy = rnd() < 0.04;
  var pot = Math.min(89.4, Math.round(prodigy ? 82 + rnd() * 7 : skill + 6 + rnd() * 30));
  var n = { id: id, name: name, skill: skill, pot: pot, sp: 0, ap: 0, isP: false, emoji: EMO[Math.floor(rnd() * EMO.length)], y: 1, money: 500,
    w: new Array(TOTAL_EVENTS).fill(0), best: { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0, careerMoney: 0 } };
  n.tr = startLevels(n);
  return n;
}

/* How each one left — read out at the gala. Tasteful, mostly. */
var CAUSES = [
  "Hung up her lance and opened a tea room.", "Her knees filed for divorce.", "Ran off with the postman — and the rooster.",
  "Took up competitive knitting. Already ranked.", "Became a professional bingo caller.", "Retired to grow prize-winning marrows.",
  "Moved in with her grandchildren, who now regret it.", "Bought a caravan and was last seen heading north.", "Discovered daytime television.",
  "Wrote a tell-all memoir: 'Lances, Lies and Lavender'.", "Became a lollipop lady. Nobody crosses her.", "Went on a cruise and simply never came back.",
  "Opened a jousting school. Two pupils, both terrified.", "Her rooster retired first; she followed out of solidarity.",
  "Joined the Great Henhouse in the Sky.", "Promoted to the Heavenly Tour — still unbeaten up there.", "Now jousting with the angels. Points pending.",
  "Left for the big coop upstairs. The rooster took it badly.", "Ascended to the eternal tea party beyond the clouds.", "Nodded off in her armchair and decided to stay there."
];
export function causeText(g) { return CAUSES[((g && g.cause) || 0) % CAUSES.length]; }

/* The Hall of Fame: very hard to enter — all four Slams, or eight Slams, or year-end No. 1 three seasons running */
function bits(x) { var n = 0; for (var i = 0; i < 4; i++) if (x & (1 << i)) n++; return n; }
export function no1Streak(yearEnd, id) {
  var best = 0, run = 0, last = null;
  (yearEnd || []).slice().sort(function (a, b) { return a.s - b.s; }).forEach(function (e) {
    if (e.id !== id) run = 0; else run = run > 0 && last === e.s - 1 ? run + 1 : 1;
    last = e.s; if (run > best) best = run;
  });
  return best;
}
export function hofReason(best, yearEnd, id) {
  best = best || {};
  if (bits(best.gsSet || 0) >= 4) return "Won all four Grand Slams";
  if ((best.gsTitles || 0) >= 8) return best.gsTitles + " Grand Slam titles";
  if (no1Streak(yearEnd, id) >= 3) return "Year-end world No. 1, " + no1Streak(yearEnd, id) + " seasons running";
  return null;
}
export var HOF_RULE = "all four Grand Slams, or 8 Grand Slams, or year-end No. 1 three seasons running";

/* Decided at the gala, so the ceremony can say goodbye; the new season then carries it out */
export function retirementPlan(S, rnd) {
  rnd = rnd || Math.random;
  var ranked = getRanked(S).filter(function (p) { return !p.isP; }), N = ranked.length, gone = [];
  ranked.forEach(function (n, i) {
    if (rnd() < retireChance(ageOf(n), i / N)) {
      var b = n.best || {}, g = { id: n.id, name: n.name, emoji: n.emoji || "", y: ageOf(n), s: S.sNum || 1, rank: i + 1, pts: n.sp || 0, peak: Math.min(b.rank || 1001, i + 1),
        titles: b.titles || 0, gsTitles: b.gsTitles || 0, cause: Math.floor(rnd() * 1000) };
      if (b.tt) g.tt = b.tt;
      if (b.gsSet) g.gsSet = b.gsSet;
      var why = hofReason(b, S.yearEnd, n.id); if (why) g.hof = why;
      gone.push(g);
    }
  });
  return gone;
}

/* End of season `prev`: who retires, who comes in. Returns { npcs, gone, rivalGone, nextId } — everyone a season older,
   levels clamped to the new cap. gone = what the record keeps of each retiree. */
export function turnOver(prev, rnd) {
  rnd = rnd || Math.random;
  var live = {}; prev.npcs.forEach(function (n) { live[n.id] = 1; });
  var gone = (prev.retiring && prev.retiring.s === prev.sNum ? prev.retiring.gone : retirementPlan(prev, rnd)).filter(function (g) { return live[g.id]; }), goneIds = {};
  gone.forEach(function (g) { goneIds[g.id] = 1; });
  var taken = {}, recent = {};
  prev.npcs.forEach(function (n) { if (!goneIds[n.id]) taken[n.name.split(" the ")[0].replace(/ [IVX]+$/, "")] = 1; });
  (prev.gone || []).concat(gone).forEach(function (g) { var f = g.name.split(" the ")[0], base = f.replace(/ [IVX]+$/, ""), k = ROMAN.indexOf(f.slice(base.length)); recent[base] = Math.max(recent[base] || 0, (k < 0 ? 0 : k) + 1); });
  var nextId = prev.nextId || 0;
  prev.npcs.forEach(function (n) { if (n.id >= nextId) nextId = n.id + 1; });
  (prev.gone || []).forEach(function (g) { if (g.id >= nextId) nextId = g.id + 1; });
  var npcs = prev.npcs.filter(function (n) { return !goneIds[n.id]; }).map(function (n) {
    var c = Object.assign({}, n); if (n.w) c.w = n.w.slice();
    c.y = ageOf(n) + 1;
    var ag = ageStats(n, c.y, rnd); c.tr = ag.tr; if (ag.ac) c.ac = ag.ac; else delete c.ac;
    return c;
  });
  gone.forEach(function () { npcs.push(newcomer(nextId, freshName(taken, recent, rnd), rnd)); nextId++; });
  var rival = prev.player && prev.player.rival;
  return { npcs: npcs, gone: gone, rivalGone: rival && goneIds[rival.id] ? gone.filter(function (g) { return g.id === rival.id; })[0] : null, nextId: nextId };
}

/* From this many seasons on tour, the gala offers you retirement: the next granny of the family takes over */
export var RETIRE_FROM = 15;
