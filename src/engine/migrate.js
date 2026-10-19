/* ═══ Engine / Migrate ═══ Older tours reused first names ("two Lunas"). Give every NPC a first name of her own, keeping
   her title ("…the Bold"), and update every place the save mentions her: brackets, head-to-head, rival, the paper. */

import { npcName } from "../models/persona";
import { sh, spreadPts } from "../models/formulas";
import { TIERS, TOTAL_EVENTS } from "../models/constants";

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
  /* Walk the whole save: any object with an NPC id and a name gets the new name */
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
  var o = OLD_PTS[tier], n = TIERS[tier] && TIERS[tier].pts;
  if (!oldPts || !roundsWon || !o || !n) return 0;
  return Math.round(oldPts * sumTo(n, roundsWon) / sumTo(o, roundsWon));
}
function roundsWonOf(tier, pRound, won) { return won ? ((TIERS[tier] && TIERS[tier].rounds) || 5) : (pRound || 0); }

export function needsPts2(S) { return !!(S && S.player && S.npcs && S.pts !== 2); }

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
