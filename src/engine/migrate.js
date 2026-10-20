/* ═══ Engine / Migrate ═══ Older tours reused first names ("two Lunas"). Give every NPC a first name of her own, keeping
   her title ("…the Bold"), and update every place the save mentions her: brackets, head-to-head, rival, the paper. */

import { npcName } from "../models/persona";
import { sh, spreadPts, getRanked } from "../models/formulas";
import { findWeek, weekPts } from "./history";
import { TIERS, TOTAL_EVENTS, TT } from "../models/constants";

export function needsUniqueNames(S) {
  if (!S || !S.npcs) return false;
  var seen = {};
  for (var i = 0; i < S.npcs.length; i++) { var k = sh(S.npcs[i].name).split(" ")[0].toLowerCase(); if (seen[k]) return true; seen[k] = 1; }
  return false;
}

export function uniqueNames(S) {
  if (!needsUniqueNames(S)) return S;
  var map = {};
  S.npcs.forEach(function (n) {
    var title = (n.name || "").split(" the ")[1];
    map[n.id] = npcName(Math.max(0, n.id - 2) % 999) + (title ? " the " + title.replace(/ \d+$/, "") : "");
  });
  return renameAll(S, map);
}

/* Walk the whole save: any object with an NPC id and a name gets the new name (map: id → name) */
function renameAll(S, map) {
  function walk(v) {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      var o = {};
      Object.keys(v).forEach(function (k) { o[k] = walk(v[k]); });
      if (typeof o.id === "number" && o.id !== 1 && typeof o.name === "string" && map[o.id]) o.name = map[o.id];
      return o;
    }
    return v;
  }
  var out = walk(S);
  /* Head-to-head is keyed by id; its entries carry only the name */
  var h2h = out.player && out.player.h2h;
  if (h2h) Object.keys(h2h).forEach(function (id) { if (map[id]) h2h[id] = h2h[id].map(function (e) { return Object.assign({}, e, { name: map[id] }); }); });
  return out;
}

/* Titles (once per save: S.titles = 2). Tours began with only 20 titles, about 50 riders each ("the Swift" everywhere);
   the pool is now ~160, so every rider still on tour gets a title from it — her first name stays, and so does everything
   else. Each title ends up on 6–7 riders at most. Retired riders keep the name they retired with. */
export function titleFor(id) { return TT[(Math.max(0, id - 2) * 13) % TT.length]; }
export function needsTitles(S) { return !!(S && S.npcs && S.titles !== 2); }
export function retitle(S) {
  if (!needsTitles(S)) return S;
  var map = {};
  S.npcs.forEach(function (n) { map[n.id] = (n.name || "").split(" the ")[0] + " the " + titleFor(n.id); });
  return Object.assign(renameAll(S, map), { titles: 2 });
}

/* ═══ Points table conversion (once per save: S.pts = 2) ═══
   Tours started before the current table (Futures 100 · Challenger 250 · 250: 500 · 500: 1,000 · Masters 2,000 · Slam 4,000)
   hold points on the old one, and rivals there never dropped their points, so theirs piled up season after season.
   You: every week you're defending or have played this season is rebuilt from your own result there (tier, rounds
   won, the event's multiplier kept). Rivals have no week-by-week record, so each keeps her place in the ranking and
   takes the points that place holds on the current tour (a 5-run simulation of four seasons under today's rules),
   spread over the 20 weeks so they drop off like anyone's. */
var OLD_PTS = [[5, 12, 25, 50, 100], [12, 30, 60, 125, 250], [40, 80, 160, 320, 600], [80, 160, 320, 600, 1200], [150, 300, 600, 1200, 2500], [250, 500, 1000, 2000, 4000, 8000]];
/* [rank, points held at that rank] on the current tour */
var PLACE_PTS = [[1, 15730], [2, 11086], [3, 10023], [5, 8550], [7, 7407], [10, 5999], [15, 5084], [20, 4541], [30, 3555], [45, 2564], [64, 1556], [100, 996], [150, 715],
  [200, 513], [300, 364], [400, 258], [500, 200], [600, 174], [700, 145], [800, 118], [900, 89], [950, 70], [980, 50], [999, 18]];
/* rivals' all-time points: the old-to-new ratio for the tiers riders at each rank play (same simulation) */
var PLACE_AP = [[5, 0.445], [17, 0.589], [45, 0.612], [81, 0.694], [141, 0.727], [283, 0.773], [529, 0.84], [837, 0.877]];

function sumTo(a, k) { var s = 0; for (var i = 0; i < k; i++) s += a[i] || 0; return s; }
function along(tab, rank) {
  if (rank <= tab[0][0]) return tab[0][1];
  for (var i = 1; i < tab.length; i++) if (rank <= tab[i][0]) {
    var t = (Math.log(rank) - Math.log(tab[i - 1][0])) / (Math.log(tab[i][0]) - Math.log(tab[i - 1][0]));
    return tab[i - 1][1] + t * (tab[i][1] - tab[i - 1][1]);
  }
  return tab[tab.length - 1][1];
}
/* points won at an event on the old table → the same rounds on the current one */
function convPts(tier, roundsWon, oldPts) {
  var o = OLD_PTS[tier], n = TIERS[tier] && TIERS[tier].tp; /* the table this conversion aimed at (table 2, now kept as tp) */
  if (!oldPts || !roundsWon || !o || !n) return 0;
  return Math.round(oldPts * sumTo(n, roundsWon) / sumTo(o, roundsWon));
}
function roundsWonOf(tier, pRound, won) { return won ? ((TIERS[tier] && TIERS[tier].rounds) || 5) : (pRound || 0); }

export function needsPts2(S) { return !!(S && S.player && S.npcs && !(S.pts >= 2)); }

export function toPts2(S) {
  if (!needsPts2(S)) return S;
  var P = S.player, out = Object.assign({}, S, { pts: 2 });
  /* every old result the save remembers, old points → new; a number seen there converts the same way elsewhere */
  var byOld = {}, oldSum = 0, newSum = 0;
  function hConv(h) { return convPts(h.tier, roundsWonOf(h.tier, h.pRound, h.winner && h.winner.isP), h.pPts); }
  (S.tHist || []).forEach(function (h) { var v = hConv(h); if (h.pPts) { byOld[h.pPts] = v; oldSum += h.pPts; newSum += v; } });
  var ratio = oldSum ? newSum / oldSum : 0.5;
  function viaOld(x) { return !x ? 0 : byOld[x] != null ? byOld[x] : Math.round(x * ratio); }

  /* this season's weeks from the calendar (exact), last season's from the history of that season, in order */
  var res = (P.res || []).slice(), def = (P.def || []).slice();
  (S.cal || []).forEach(function (e, i) { if (e && e.done && e.result) res[i] = e.result.pPts ? convPts(e.tier, roundsWonOf(e.tier, e.result.pRound, e.result.won), e.result.pPts) : 0; });
  var prevH = (S.tHist || []).filter(function (h) { return h.season === (S.sNum || 1) - 1 && h.pPts; }), j = 0;
  def = def.map(function (v) { if (!v) return 0; var h = prevH[j]; if (h && h.pPts === v) { j++; return hConv(h); } return viaOld(v); });
  var sp = 0; for (var i = 0; i < TOTAL_EVENTS; i++) sp += i < (S.calIdx || 0) ? (res[i] || 0) : (def[i] || 0);
  var best = Object.assign({}, P.best || {}); if (best.peakS) best.peakS = Math.round(best.peakS * ratio);
  out.player = Object.assign({}, P, { sp: sp, ap: Math.round((P.ap || 0) * ratio), def: def, res: res, best: best });

  /* the record books, so old weeks read on the same scale */
  out.tHist = (S.tHist || []).map(function (h) { var p = hConv(h), d = viaOld(h.defending); return Object.assign({}, h, { pPts: p, defending: d, netChange: p - d }); });
  out.cal = (S.cal || []).map(function (e, i) {
    if (!e || !e.result) return e;
    var r = Object.assign({}, e.result, { pPts: res[i] || 0, defending: viaOld(e.result.defending) }); r.net = r.pPts - r.defending;
    return Object.assign({}, e, { result: r });
  });
  if (P.timeline) out.player.timeline = P.timeline.map(function (t) { return t.pts ? Object.assign({}, t, { pts: viaOld(t.pts) }) : t; });

  /* rivals: same order as before, the points of their place, dropping off a twentieth a week */
  var order = S.npcs.slice().sort(function (a, b) { return (b.sp || 0) - (a.sp || 0); }), place = {};
  order.forEach(function (n, k) { place[n.id] = k + 1; });
  out.npcs = S.npcs.map(function (n) {
    var r = place[n.id], v = Math.round(along(PLACE_PTS, r));
    return Object.assign({}, n, { sp: v, ap: Math.max(v, Math.round((n.ap || 0) * along(PLACE_AP, r))), w: spreadPts(v) });
  });
  /* a tournament in progress: its riders carry copies of their points */
  var spOf = {}; out.npcs.forEach(function (n) { spOf[n.id] = n; });
  function fix(x) { if (!x) return x; if (x.isP) return Object.assign({}, x, { sp: out.player.sp, ap: out.player.ap }); var n = spOf[x.id]; return n ? Object.assign({}, x, { sp: n.sp, ap: n.ap, w: n.w }) : x; }
  if (S.activeT && S.activeT.bracket) out.activeT = Object.assign({}, S.activeT, { bracket: S.activeT.bracket.map(function (rd) { return rd ? rd.map(function (m) { return Object.assign({}, m, { a: fix(m.a), b: fix(m.b), w: m.w ? fix(m.w) : null }); }) : rd; }) });
  return out;
}

/* ═══ Points table 3 (once per save: S.pts = 3) ═══
   Winning a tier is now worth about reaching the quarterfinal of the tier above (constants TIERS). Everyone's points are
   rebuilt on the new table:
   1. You: every week of this season and every week you're defending, from your own result there (tier, rounds won, the
      event's multiplier kept) — the tour's history first, then your tournament log.
   2. Rivals: every week the tour's history recorded (engine/history) is rebuilt exactly from her round and tier;
      older weeks are scaled by what her place in the ranking is worth on the new table (a 3-run, 4-season simulation),
      so everyone keeps her order. */
var V2 = TIERS.map(function (t) { return t.tp; }), V3 = TIERS.map(function (t) { return t.pts; });
function conv3(tier, roundsWon, oldPts) { if (!oldPts || !roundsWon || !V2[tier]) return 0; var o = sumTo(V2[tier], roundsWon), n = sumTo(V3[tier], roundsWon); return o ? Math.round(oldPts * n / o) : 0; }
/* [rank, new ÷ old points held at that rank] and [rank, points held] on the new table */
var FACTOR3 = [[1, 2.07], [10, 2.57], [30, 2.86], [64, 1.26], [100, 1.04], [200, 0.71], [300, 0.535], [400, 0.43], [600, 0.32], [800, 0.28], [1000, 0.22]];
var PLACE3 = [[1, 31000], [10, 17500], [30, 10300], [64, 1700], [100, 960], [200, 350], [300, 190], [400, 107], [600, 55], [800, 32], [999, 12]];
/* What a place in the ranking holds on the current table (a new tour's starting points) */
export function placePts(rank) { return Math.round(along(PLACE3, rank)); }

export function needsPts3(S) { return !!(S && S.player && S.npcs && !(S.pts >= 3)); }
export function toPts3(S) {
  if (!needsPts3(S)) return S;
  if (needsPts2(S)) S = toPts2(S);
  var P = S.player, sNum = S.sNum || 1, ci = S.calIdx || 0, out = Object.assign({}, S, { pts: 3 });
  var rankOf = {}, pRank = 1000; getRanked(S).forEach(function (p, i) { if (p.isP) pRank = i + 1; else rankOf[p.id] = i + 1; });
  /* the recorded week that sits in ledger slot c: this season's before calIdx, last season's from calIdx on */
  function weekAt(c) { return c < ci ? findWeek(S.hist, sNum, c) : findWeek(S.hist, sNum - 1, c); }

  /* ── you ── */
  var oldSum = 0, newSum = 0;
  function hConv(h) { return conv3(h.tier, roundsWonOf(h.tier, h.pRound, h.winner && h.winner.isP), h.pPts); }
  (S.tHist || []).forEach(function (h) { if (h.pPts) { oldSum += h.pPts; newSum += hConv(h); } });
  var ratio = oldSum ? newSum / oldSum : along(FACTOR3, pRank);
  var res = (P.res || []).slice(), def = (P.def || []).slice();
  (S.cal || []).forEach(function (e, i) { if (i < ci && e && e.done && e.result) { var w = weekAt(i); res[i] = w ? weekPts(w, 1) : e.result.pPts ? conv3(e.tier, roundsWonOf(e.tier, e.result.pRound, e.result.won), e.result.pPts) : 0; } });
  var prevH = (S.tHist || []).filter(function (h) { return h.season === sNum - 1 && h.pPts; }), j = 0;
  def = def.map(function (v, c) {
    if (c >= ci) { var w = weekAt(c); if (w) return weekPts(w, 1); }
    if (!v) return 0;
    var h = prevH[j]; if (h && h.pPts === v) { j++; return hConv(h); }
    return Math.round(v * ratio);
  });
  var sp = 0; for (var i = 0; i < TOTAL_EVENTS; i++) sp += i < ci ? (res[i] || 0) : (def[i] || 0);
  var best = Object.assign({}, P.best || {}); if (best.peakS) best.peakS = Math.round(best.peakS * ratio);
  out.player = Object.assign({}, P, { sp: sp, ap: Math.round((P.ap || 0) * ratio), def: def, res: res, best: best });
  out.tHist = (S.tHist || []).map(function (h) { var p = hConv(h), d = Math.round((h.defending || 0) * ratio); return Object.assign({}, h, { pPts: p, defending: d, netChange: p - d }); });
  out.cal = (S.cal || []).map(function (e, i) {
    if (!e || !e.result) return e;
    var r = Object.assign({}, e.result, { pPts: res[i] || 0, defending: Math.round((e.result.defending || 0) * ratio) }); r.net = r.pPts - r.defending;
    return Object.assign({}, e, { result: r });
  });
  if (P.timeline) out.player.timeline = P.timeline.map(function (t) { return t.pts ? Object.assign({}, t, { pts: t.tier != null ? conv3(t.tier, TIERS[t.tier].rounds, t.pts) : t.pRound != null ? conv3(5, t.pRound, t.pts) : Math.round(t.pts * ratio) }) : t; });

  /* ── rivals ── */
  out.npcs = S.npcs.map(function (n) {
    var f = along(FACTOR3, rankOf[n.id] || 1000), w = (n.w || spreadPts(n.sp)).slice(), s = 0, scaled = [], oldPart = 0;
    for (var c = 0; c < TOTAL_EVENTS; c++) { var wk = weekAt(c); if (wk) w[c] = weekPts(wk, n.id); else { scaled.push(c); oldPart += w[c] || 0; } }
    /* the unrecorded weeks scale as one total (so riders level on points stay level), largest remainders first */
    var target = Math.round(oldPart * f), parts = scaled.map(function (c) { var x = (w[c] || 0) * f; return { c: c, v: Math.floor(x), r: x - Math.floor(x) }; });
    var left = target - parts.reduce(function (a, p) { return a + p.v; }, 0);
    parts.sort(function (a, b) { return b.r - a.r; }).forEach(function (p, k) { w[p.c] = p.v + (k < left ? 1 : 0); });
    for (c = 0; c < TOTAL_EVENTS; c++) s += w[c] || 0;
    return Object.assign({}, n, { w: w, sp: s, ap: Math.max(s, Math.round((n.ap || 0) * f)) });
  });
  var spOf = {}; out.npcs.forEach(function (n) { spOf[n.id] = n; });
  function fix(x) { if (!x) return x; if (x.isP) return Object.assign({}, x, { sp: out.player.sp, ap: out.player.ap }); var n = spOf[x.id]; return n ? Object.assign({}, x, { sp: n.sp, ap: n.ap, w: n.w }) : x; }
  if (S.activeT && S.activeT.bracket) out.activeT = Object.assign({}, S.activeT, { bracket: S.activeT.bracket.map(function (rd) { return rd ? rd.map(function (m) { return Object.assign({}, m, { a: fix(m.a), b: fix(m.b), w: m.w ? fix(m.w) : null }); }) : rd; }) });
  return out;
}

/* Place names that were too close to real ones (once per save: S.world = 2): "Wimbledon-on-Wold" is now "Wimblehen-on-Wold"
   everywhere the save mentions it — the history, last results, the paper's archive */
var RENAMED = [["Wimbledon-on-Wold", "Wimblehen-on-Wold"]];
export function needsWorldNames(S) { return !!(S && S.player && S.world !== 2); }
export function renameWorld(S) {
  if (!needsWorldNames(S)) return S;
  var j = JSON.stringify(S);
  RENAMED.forEach(function (r) { j = j.split(r[0]).join(r[1]); });
  return Object.assign(JSON.parse(j), { world: 2 });
}
