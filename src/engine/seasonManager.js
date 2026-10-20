/* ═══ Engine / Season Manager ═══ Calendar + season creation + cross-season carryover */

import { TOTAL_EVENTS } from "../models/constants";
import { mkNPCs } from "./npcGenerator";
import { turnOver, toAge, ageCap, hofReason } from "./aging";
import { playerTitles } from "./titles";
import { statCap } from "./investments";
import { getRanked } from "../models/formulas";

/* Season calendar: 4 blocks × (4 swing weeks + 1 Grand Slam) = 20 events */
export function mkCalendar() {
  var cal = [];
  for (var gs = 0; gs < 4; gs++) {
    for (var sw = 0; sw < 4; sw++) {
      cal.push({ type: "swing", block: gs + 1, week: sw + 1, tier: null, done: false, result: null });
    }
    cal.push({ type: "gs", block: gs + 1, gsNum: gs + 1, tier: 5, done: false, result: null });
  }
  return cal;
}

/* Build a fresh season. If `prev` is passed, carries over NPCs, player career data, defending slots, etc. */
export function mkSeason(name, num, prev) {
  var emptyRes = []; for (var zi = 0; zi < TOTAL_EVENTS; zi++) emptyRes.push(0);
  var npcs, def = emptyRes.slice(), turn = null;
  if (prev) {
    /* The off-season: some rivals retire, newcomers take their places, everyone is a season older (engine/aging) */
    turn = turnOver(prev.npcs[0] && prev.npcs[0].y == null ? toAge(prev) : prev);
    npcs = turn.npcs.map(function (n) { var c = Object.assign({}, n); delete c.dr; return c; }); /* step-downs (engine/events) start again each season */ /* last season's weeks become the ones to defend */
    def = prev.player.res || def;
  } else {
    npcs = mkNPCs();
  }
  var ptr = prev ? Object.assign({ s: 0, g: 0 }, prev.player.tr) : { r: 0, p: 0, f: 0, s: 0, g: 0, tp: 0 };
  var pAge = prev ? (prev.player.y || prev.sNum || 1) + 1 : 1, pLost = 0;
  if (prev) { var pped = { y: pAge, pedigree: prev.player.pedigree }; ["r", "p", "f", "s", "g", "b"].forEach(function (k) { var c = statCap(pped, k); if ((ptr[k] || 0) > c) { pLost += ptr[k] - c; ptr[k] = c; } }); }
  var pBest = prev ? prev.player.best : { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0 };
  var pSP = 0; for (var di = 0; di < TOTAL_EVENTS; di++) pSP += (def[di] || 0);
  var res = []; for (var ri = 0; ri < TOTAL_EVENTS; ri++) res.push(0);
  /* Rank history — carry over last 20 entries from previous season */
  var rankHist = prev && prev.player.rankHist ? prev.player.rankHist.slice(-20) : [];
  /* Head-to-head records persist across seasons */
  var h2h = prev && prev.player.h2h ? prev.player.h2h : {};
  /* Career timeline persists across seasons; seed on fresh game */
  var timeline = prev && prev.player.timeline ? prev.player.timeline.slice() : [{ type: "start", s: num || 1, w: 0 }];
  var S = {
    pName: name || "Champion", sNum: num || 1, npcs: npcs, cal: mkCalendar(), calIdx: 0,
    player: {
      id: 1, isP: true, y: pAge,
      sp: pSP, ap: prev ? prev.player.ap : 0,
      tr: ptr, best: pBest,
      def: def, res: res,
      money: prev ? prev.player.money : 0, seasonMoney: 0,
      rankHist: rankHist, h2h: h2h, timeline: timeline
    },
    champs: prev ? prev.champs : [],
    tHist: prev ? prev.tHist : [],
    phase: "hub"
  };
  /* The crowd, the press, the paper, your badges, career counters and grudges all carry over between seasons (no undefined fields: the cloud save rejects them) */
  if (prev) {
    ["fans", "ivSeen", "lastTones", "goal", "ach", "stats", "rival", "settledRivals", "tips", "tutorial", "earned", "pedigree", "locker", "kit", "gearSpent", "followers", "hm", "startPts"].forEach(function (k) { if (prev.player[k] != null) S.player[k] = prev.player[k]; });
    if (prev.news) S.news = prev.news;
    /* Who left the tour (kept two seasons, so past draws still show their names), and the off-season's news */
    S.gone = (prev.gone || []).filter(function (g) { return g.s >= (num || 1) - 2; }).concat(turn.gone);
    S.nextId = turn.nextId;
    var top = turn.gone.slice().sort(function (a, b) { return a.rank - b.rank; }).slice(0, 6);
    S.farewell = { s: prev.sNum || 1, n: turn.gone.length, top: top.map(function (g) { return g.id; }), cap: ageCap(pAge), lost: pLost };
    if (turn.rivalGone) { S.farewell.rival = turn.rivalGone.id; delete S.player.rival; }
    /* a retired granny can't become your next rival: her head-to-head book closes */
    if (turn.gone.length && S.player.h2h) { var h2 = Object.assign({}, S.player.h2h); turn.gone.forEach(function (g) { delete h2[g.id]; }); S.player.h2h = h2; }
    if (prev.hist) S.hist = prev.hist; /* the tour's history (engine/history) */
    /* Record books that last forever: year-end No. 1s, the Hall of Fame, and your family of grannies */
    if (prev.yearEnd) S.yearEnd = prev.yearEnd;
    var inducted = turn.gone.filter(function (g) { return g.hof; });
    if (prev.hof || inducted.length) S.hof = (prev.hof || []).concat(inducted);
    if (prev.family) S.family = prev.family;
    if (prev.newsSeenAt != null) S.newsSeenAt = prev.newsSeenAt;
  }
  S.titles = 2;                    /* titles from the big pool (engine/migrate retitle) */
  S.world = 2;                     /* place names (engine/migrate renameWorld) */
  S.pts = 3;                       /* points on the current table (engine/migrate toPts3), rivals' points rolling */
  S.eng = 2;                       /* the match engine version: each rider on her own bar (engine/joust) */
  if (!prev) S.player.startPts = 10;  /* starting talent: 10 points to spread over the stats before the first event */
  S = toAge(S);                    /* a new tour: rivals of every age, you in your first season (engine/aging) */
  S.start = seasonSnapshot(S);
  return S;
}

/* You retire: your career goes on the family wall (and into the Hall of Fame if it earned it), and the next granny of the
   family starts from nothing in the same world — the bottom of the ranking, first season on tour. N = the new season. */
export function passTheLance(N, prev, name) {
  var P = prev.player, b = P.best || {}, tt = playerTitles(prev), y = P.y || prev.sNum || 1;
  /* her best world rank: the record, her rank history and where she finished, whichever is best */
  var fin = 1001; getRanked(prev).forEach(function (p, i) { if (p.isP) fin = i + 1; });
  var peak = Math.min.apply(null, [b.rank || 1001, fin].concat((P.rankHist || []).filter(function (x) { return x > 0; })));
  var rec = { name: prev.pName, s0: Math.max(1, (prev.sNum || 1) - y + 1), s1: prev.sNum || 1, y: y, peak: peak, titles: b.titles || 0, gsTitles: b.gsTitles || 0, mst: tt[4] || 0 };
  if (b.gsSet) rec.gsSet = b.gsSet;
  if (P.kit) rec.kit = P.kit;
  var why = hofReason(b, prev.yearEnd, 1); if (why) rec.hof = why;
  var zeros = []; for (var i = 0; i < TOTAL_EVENTS; i++) zeros.push(0);
  var player = { id: 1, isP: true, y: 1, sp: 0, ap: 0, tr: { r: 0, p: 0, f: 0, s: 0, g: 0, tp: 0 }, best: { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0 },
    def: zeros, res: zeros.slice(), money: 0, seasonMoney: 0, rankHist: [], h2h: {}, timeline: [{ type: "start", s: N.sNum, w: 0 }], startPts: 10 };
  /* badges and the coach's tips belong to you, the one holding the phone */
  ["ach", "tips", "tutorial", "ivSeen", "lastTones"].forEach(function (k) { if (P[k] != null) player[k] = P[k]; });
  var out = Object.assign({}, N, { pName: (name || "").trim().slice(0, 20) || prev.pName + " Jr", player: player, family: (prev.family || []).concat([rec]) });
  if (rec.hof) out.hof = (N.hof || []).concat([Object.assign({ id: 1, isP: true, s: rec.s1, rank: 0 }, rec)]);
  out.farewell = Object.assign({}, N.farewell, { heir: prev.pName }); delete out.farewell.lost; delete out.farewell.rival;
  out.start = seasonSnapshot(out);
  return out;
}

function trTotal(tr) { tr = tr || {}; return (tr.r || 0) + (tr.p || 0) + (tr.f || 0) + (tr.s || 0) + (tr.g || 0); }

/* Where everyone stood on day one — the season awards measure from here */
export function seasonSnapshot(S) {
  var ranks = {}, titles = {}, tr = {}, tt = {};
  getRanked(S).forEach(function (p, i) {
    var id = p.isP ? 1 : p.id;
    ranks[id] = i + 1; titles[id] = p.isP ? 0 : (p.best && p.best.titles) || 0; tr[id] = trTotal(p.tr);
    if (!p.isP && p.best && p.best.tt) tt[id] = p.best.tt;
  });
  return { ranks: ranks, titles: titles, tr: tr, tt: tt };
}
export { trTotal };
