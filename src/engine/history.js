/* ═══ Engine / History ═══ The tour remembers every week: which tournaments ran, and for every rider (you are id 1)
   which one she rode, where she sat in the draw and how far she got. One short code per rider per week —
   event (1 char) + draw slot (2) + rounds won (1), "...." for a week she didn't ride — so a whole week of 1,000 riders
   is one 4,000-character string. Any draw tree is rebuilt from slots and rounds won, so brackets are never stored.
   The current and previous season keep every week; older seasons fold into a summary per rider (best round and
   titles in each tier), and beyond MAX_OLD seasons the oldest summaries merge into one. Same record for everyone. */

import { TIERS, RN5, RN6 } from "../models/constants";

var B36 = "0123456789abcdefghijklmnopqrstuvwxyz", NONE = "....", MAX_OLD = 10;
function d36(ch) { return B36.indexOf(ch); }
function idxOf(s, id, w) { return s.substr(id * w, w); }

/* One week: events = [{ tier, name, cond, field, mul }], riders = { id: [event, slot, roundsWon] } */
export function recordWeek(H, wk) {
  H = H || { wk: [], old: [] };
  var maxId = 0; Object.keys(wk.riders).forEach(function (id) { if (+id > maxId) maxId = +id; });
  var codes = new Array(maxId + 1);
  for (var i = 0; i <= maxId; i++) { var r = wk.riders[i]; codes[i] = r ? B36[r[0]] + (r[1] < 36 ? "0" : "") + r[1].toString(36) + B36[Math.min(35, r[2])] : NONE; }
  var w = { s: wk.s, c: wk.c, l: wk.label || "", e: wk.events.map(function (e) { return [e.tier, e.name || "", e.cond || "classic", e.field || "mixed", e.mul || 1]; }), r: codes.join("") };
  if (wk.rest) w.x = 1;
  var weeks = H.wk.filter(function (x) { return !(x.s === w.s && x.c === w.c); }).concat([w]);
  /* Seasons older than the previous one fold into summaries */
  var keep = [], fold = {};
  weeks.forEach(function (x) { if (x.s < wk.s - 1) (fold[x.s] = fold[x.s] || []).push(x); else keep.push(x); });
  var old = (H.old || []).slice();
  Object.keys(fold).sort(function (a, b) { return a - b; }).forEach(function (s) { old.push(summarise(+s, fold[s])); });
  while (old.length > MAX_OLD) old.splice(0, 2, mergeSum(old[0], old[1]));
  return { wk: keep, old: old };
}

/* Per rider, 12 chars: for each of the 6 tiers, best rounds won ("." never rode) and titles (base 36, capped) */
function summarise(s, weeks) {
  var best = [], titles = [];
  weeks.forEach(function (w) {
    var n = w.r.length / 4;
    for (var id = 0; id < n; id++) {
      var c = idxOf(w.r, id, 4); if (c === NONE) continue;
      var e = w.e[d36(c[0])]; if (!e) continue;
      var t = e[0], k = id * 6 + t, won = d36(c[3]);
      if (best[k] == null || won > best[k]) best[k] = won;
      if (won >= TIERS[t].rounds) titles[k] = (titles[k] || 0) + 1;
    }
  });
  return { s: s, r: sumString(best, titles) };
}
function sumString(best, titles) {
  var n = Math.ceil(Math.max(best.length, titles.length) / 6), out = "";
  for (var id = 0; id < n; id++) for (var t = 0; t < 6; t++) { var k = id * 6 + t; out += best[k] == null ? ".." : B36[best[k]] + B36[Math.min(35, titles[k] || 0)]; }
  return out;
}
function readSum(r) { var best = [], titles = []; for (var k = 0; k < r.length / 2; k++) { var a = r[k * 2]; if (a !== ".") { best[k] = d36(a); titles[k] = d36(r[k * 2 + 1]); } } return { best: best, titles: titles }; }
function mergeSum(a, b) {
  var A = readSum(a.r), B = readSum(b.r), best = [], titles = [], n = Math.max(A.best.length, B.best.length);
  for (var k = 0; k < n; k++) {
    if (A.best[k] == null && B.best[k] == null) continue;
    best[k] = Math.max(A.best[k] == null ? -1 : A.best[k], B.best[k] == null ? -1 : B.best[k]);
    titles[k] = (A.titles[k] || 0) + (B.titles[k] || 0);
  }
  var from = Array.isArray(a.s) ? a.s[0] : a.s, to = Array.isArray(b.s) ? b.s[1] : b.s;
  return { s: [from, to], r: sumString(best, titles) };
}

/* ─── Reading it back ─── */
function codeOf(w, id) { var c = idxOf(w.r, id, 4); return c && c !== NONE && c.length === 4 ? { ev: d36(c[0]), slot: parseInt(c.substr(1, 2), 36), won: d36(c[3]) } : null; }
export function roundNamesOf(tier) { return TIERS[tier].rounds === 6 ? RN6 : RN5; }
/* What she won: rounds won × the tier's table × the event's multiplier (same as the week's own scoring) */
export function ptsFor(tier, won, mul) { var p = 0, T = TIERS[tier]; for (var i = 0; i < won && i < T.pts.length; i++) p += T.pts[i]; return Math.round(p * (mul || 1)); }
export function reachedName(tier, won) { var T = TIERS[tier]; return won >= T.rounds ? "Champion" : roundNamesOf(tier)[won] || ""; }

export function findWeek(H, s, c) { return H && H.wk ? H.wk.filter(function (w) { return w.s === s && w.c === c; })[0] || null : null; }

/* The draw of one event, in slot order: [{ id, won }] */
function drawOf(w, evIdx) {
  var out = [], n = w.r.length / 4;
  for (var id = 0; id < n; id++) { var x = codeOf(w, id); if (x && x.ev === evIdx) out[x.slot] = { id: id, won: x.won }; }
  return out.filter(Boolean);
}

/* Every event of a week with its winner: [{ idx, tier, name, cond, field, mul, size, winner, mine }] */
export function weekList(w) {
  if (!w) return [];
  return w.e.map(function (e, i) {
    var d = drawOf(w, i), top = d.reduce(function (a, x) { return !a || x.won > a.won ? x : a; }, null);
    return { idx: i, tier: e[0], name: e[1], cond: e[2], field: e[3], mul: e[4], size: d.length, winnerId: top ? top.id : null,
      mine: d.some(function (x) { return x.id === 1; }) };
  });
}

/* The tree, rebuilt: pairs (0,1), (2,3)… each round; the rider who won more rounds goes through (an odd one out gets a bye),
   exactly as the week was played. Returns the same shape the live bracket uses: rounds of { a, b, w }. */
export function treeOf(w, evIdx, who) {
  var d = drawOf(w, evIdx), e = w.e[evIdx]; if (!e || d.length < 2) return null;
  var rounds = TIERS[e[0]].rounds, bk = [], cur = d.map(function (x) { return Object.assign({ won: x.won }, who(x.id)); });
  for (var rd = 0; rd < rounds && cur.length > 1; rd++) {
    var row = [], nxt = [];
    for (var m = 0; m < cur.length; m += 2) {
      if (m + 1 >= cur.length) { nxt.push(cur[m]); continue; }
      var a = cur[m], b = cur[m + 1], win = a.won > rd ? a : b.won > rd ? b : null;
      row.push({ a: a, b: b, w: win }); nxt.push(win || a);
    }
    bk.push(row); cur = nxt;
  }
  return { bracket: bk, tierIdx: e[0], eventName: e[1], cond: e[2], ptsMul: e[4], done: true, round: -1, pending: null };
}

/* One rider's weeks, newest first: [{ s, c, label, idx, tier, name, cond, won, pts, reached }] — and rest weeks */
export function riderWeeks(H, id) {
  var out = [];
  ((H && H.wk) || []).forEach(function (w) {
    var x = codeOf(w, id);
    if (!x) { out.push({ s: w.s, c: w.c, label: w.l, none: true }); return; }
    var e = w.e[x.ev]; if (!e) return;
    out.push({ s: w.s, c: w.c, label: w.l, idx: x.ev, tier: e[0], name: e[1], cond: e[2], won: x.won, pts: ptsFor(e[0], x.won, e[4]), reached: reachedName(e[0], x.won), rest: id === 1 && !!w.x });
  });
  return out.reverse();
}

/* Older seasons for one rider: [{ s: number | [from, to], tiers: [{ tier, best, titles }] }], newest first */
export function riderPast(H, id) {
  return ((H && H.old) || []).map(function (o) {
    var c = o.r.substr(id * 12, 12), tiers = [];
    for (var t = 0; t < 6 && c.length === 12; t++) { var a = c[t * 2]; if (a !== ".") tiers.push({ tier: t, best: d36(a), titles: d36(c[t * 2 + 1]) }); }
    return { s: o.s, tiers: tiers };
  }).filter(function (o) { return o.tiers.length; }).reverse();
}
