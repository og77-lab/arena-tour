/* ═══ Engine / Aging ═══ Grannies get older. One age curve for everyone, you included: y = seasons on the tour (1 in the
   first). Up to season 10 every stat can be trained to 20; after that the cap drops, a little more every season —
   18 at 15, 15 at 20, 10 at 25, 5 at 30 — and levels above the cap are lost at the start of a season.
   At the end of every season some rivals retire (from 8 seasons on, more the older and the lower ranked — about 50 a
   year) and each is replaced by a newcomer who starts at the bottom with her own talent and potential.
   Measured over 30 seasons on the real engine: the field keeps moving instead of everyone maxing out. */

import { TOTAL_EVENTS } from "../models/constants";
import { FIRST_NAMES } from "../models/names";
import { TT, EMO } from "../models/constants";
import { getRanked } from "../models/formulas";
import { startLevels } from "./npcGenerator";

export var PEAK_SEASONS = 10;
var K = 0.117, P = 1.63;

/* Highest level a stat can be trained to at this age (before any rooster pedigree) */
export function ageCap(y) { y = y || 1; return y <= PEAK_SEASONS ? 20 : Math.max(1, Math.round(20 - K * Math.pow(y - PEAK_SEASONS, P))); }
export function ageOf(p) { return (p && p.y) || 1; }

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

/* A newcomer: low talent, her own potential (one in 25 is a prodigy), no points yet */
function newcomer(id, name, rnd) {
  var skill = 15 + rnd() * 28, prodigy = rnd() < 0.04;
  var pot = Math.min(89.4, Math.round(prodigy ? 82 + rnd() * 7 : skill + 6 + rnd() * 30));
  var n = { id: id, name: name, skill: skill, pot: pot, sp: 0, ap: 0, isP: false, emoji: EMO[Math.floor(rnd() * EMO.length)], y: 1, money: 500,
    w: new Array(TOTAL_EVENTS).fill(0), best: { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0, careerMoney: 0 } };
  n.tr = startLevels(n);
  return n;
}

/* End of season `prev`: who retires, who comes in. Returns { npcs, gone, rivalGone, nextId } — everyone a season older,
   levels clamped to the new cap. gone = what the record keeps of each retiree. */
export function turnOver(prev, rnd) {
  rnd = rnd || Math.random;
  var ranked = getRanked(prev).filter(function (p) { return !p.isP; }), N = ranked.length, rankOf = {};
  ranked.forEach(function (p, i) { rankOf[p.id] = i + 1; });
  var gone = [], goneIds = {};
  ranked.forEach(function (n, i) {
    if (rnd() < retireChance(ageOf(n), i / N)) {
      var b = n.best || {};
      goneIds[n.id] = 1;
      gone.push({ id: n.id, name: n.name, emoji: n.emoji || "", y: ageOf(n), s: prev.sNum || 1, rank: i + 1, pts: n.sp || 0, peak: Math.min(b.rank || 1001, i + 1),
        titles: b.titles || 0, gsTitles: b.gsTitles || 0, tt: b.tt || null, cause: Math.floor(rnd() * 1000) });
    }
  });
  gone.forEach(function (g) { if (g.tt == null) delete g.tt; });
  var taken = {}, recent = {};
  prev.npcs.forEach(function (n) { if (!goneIds[n.id]) taken[n.name.split(" the ")[0].replace(/ [IVX]+$/, "")] = 1; });
  (prev.gone || []).concat(gone).forEach(function (g) { var f = g.name.split(" the ")[0], base = f.replace(/ [IVX]+$/, ""), k = ROMAN.indexOf(f.slice(base.length)); recent[base] = Math.max(recent[base] || 0, (k < 0 ? 0 : k) + 1); });
  var nextId = prev.nextId || 0;
  prev.npcs.forEach(function (n) { if (n.id >= nextId) nextId = n.id + 1; });
  (prev.gone || []).forEach(function (g) { if (g.id >= nextId) nextId = g.id + 1; });
  var npcs = prev.npcs.filter(function (n) { return !goneIds[n.id]; }).map(function (n) {
    var c = Object.assign({}, n); if (n.w) c.w = n.w.slice();
    c.y = ageOf(n) + 1; c.tr = clampToAge(n.tr, ageCap(c.y)).tr;
    return c;
  });
  gone.forEach(function () { npcs.push(newcomer(nextId, freshName(taken, recent, rnd), rnd)); nextId++; });
  var rival = prev.player && prev.player.rival;
  return { npcs: npcs, gone: gone, rivalGone: rival && goneIds[rival.id] ? gone.filter(function (g) { return g.id === rival.id; })[0] : null, nextId: nextId };
}
