import * as React from "react";
import { motion } from "framer-motion";
import { syncAchievements, saveGameToCloud, loadGameFromCloud } from "./firebase";
import { playTitle, playRankUp, isMuted, setMuted } from "./sounds";
import { W, CSS, EMO, TIERS, RN5, RN6, HN, HC, HI, TOTAL_EVENTS, FINALS_BO, STATS, STAT_GROUPS, screenAnim } from "./models/constants";
import { sh, bs, nW, pRankOf, getRanked, getARanked, trainCost } from "./models/formulas";
import { sSet, sGet, stamp, pickNewest, queueCloudSave, cancelCloudSave } from "./engine/persistence";
import { mkSeason } from "./engine/seasonManager";
import PowerBar from "./components/PowerBar";
import Profile from "./components/Profile";
import Confetti from "./components/Confetti";
import BracketView from "./components/BracketView";
import HelpScreen from "./components/HelpScreen";
import HomeTab from "./components/HomeTab";
import SeasonTab from "./components/SeasonTab";
import SeasonGala from "./components/SeasonGala";
import { seasonAwards, yourSeason, hallOfHelmets, nextGoal } from "./engine/awards";
import TierSheet from "./components/TierSheet";
import BottomNav, { NAV_HEIGHT } from "./components/BottomNav";
import MatchHeader from "./components/MatchHeader";
import ScoutSheet from "./components/ScoutSheet";
import { Rider, Face, PLAYER_PALETTE, paletteFor } from "./components/Rider";
import { roosterName, trait, standing } from "./models/persona";
import { buildIssue, buildSpecialEdition, rankMap } from "./engine/news";
import { tallyTournament, checkAchievements } from "./engine/achievements";
import { updateRival, rivalRecord } from "./engine/rivalry";
import { ACHIEVEMENTS } from "./engine/achievements";
import AchievementsSheet, { AchToast, achCount } from "./components/Achievements";
import { fansOf, clampFans, weeklyDrift, performanceDelta, sponsorTP, hasTierWildcard, hasSlamWildcard } from "./engine/fans";
import { makeInterview, resolvePromise } from "./engine/interview";
import Interview from "./components/Interview";
import DailyCluck, { CluckPaper } from "./components/DailyCluck";
import { C, FONT, display, label, card, button, money } from "./ui/theme";

const { useState, useEffect, useRef } = React;

function talentLabel(skill) { var s = skill || 0; return s > 80 ? "Elite" : s > 60 ? "Strong" : s > 40 ? "Average" : "Developing"; }


var STAT_KEYS = ["r", "p", "f", "s", "g"];
function focusStat(id) { return STAT_KEYS[(Math.imul(id || 7, 2654435761) >>> 0) % STAT_KEYS.length]; }

/* Rivals train by the player's rules: bank this week's training points, then buy levels at trainCost prices.
   Each granny leans on her favourite stat but keeps the rest even. Returns levels bought. */
function npcTrainWeek(n, tp) {
  var tr = Object.assign({ r: 0, p: 0, f: 0, s: 0, g: 0, tp: 0 }, n.tr || {});
  tr.tp = (tr.tp || 0) + tp;
  var fav = focusStat(n.id), bought = 0;
  for (var guard = 0; guard < 20; guard++) {
    var best = null, bestScore = 1e9;
    STAT_KEYS.forEach(function (k) { var lv = tr[k] || 0; if (lv >= 20) return; var sc = lv - (k === fav ? 2 : 0); if (sc < bestScore) { bestScore = sc; best = k; } });
    if (!best) break;
    var cost = trainCost(tr[best] || 0);
    if (tr.tp < cost) break;
    tr.tp -= cost; tr[best] = (tr[best] || 0) + 1; bought++;
  }
  n.tr = tr;
  return bought;
}

/* d = the match difficulty number PowerBar uses (round + tier offset) */
function diffInfo(d) {
  return {
    label: d <= 1 ? "Easy" : d <= 3 ? "Medium" : d <= 5 ? "Hard" : d <= 7 ? "Very hard" : "Extreme",
    col: d <= 1 ? C.greenInk : d <= 3 ? "#0e7490" : d <= 5 ? C.goldInk : C.redInk,
    colOnDark: d <= 1 ? "#4ade80" : d <= 3 ? "#67e8f9" : d <= 5 ? "#fbbf24" : "#f87171",
    what: "Later rounds and bigger events mean a faster bar and a smaller gold zone"
  };
}

function buildScout(S, o, oRank, d) {
  var mine = S.player.tr || {}, hers = o.tr || {};
  var meetings = (S.player.h2h && S.player.h2h[o.id]) || [];
  var w = meetings.filter(function (m) { return m.w; }).length;
  return {
    name: sh(o.name), emoji: o.emoji || "", palette: paletteFor(o.id, oRank), rank: oRank, talent: talentLabel(o.skill), pts: o.sp || 0,
    rooster: roosterName(o.id), trait: trait(o.id), standing: standing(oRank), titles: (o.best && o.best.titles) || 0,
    you: { rank: pRankOf(S), pts: S.player.sp || 0 },
    h2h: { w: w, l: meetings.length - w }, rival: !!(S.player.rival && S.player.rival.id === o.id),
    stats: STATS.map(function (s) { return { icon: s.icon, label: s.label, what: s.what, who: s.who, you: mine[s.k] || 0, foe: hers[s.k] || 0 }; }),
    diff: diffInfo(d)
  };
}


/* ═══ MAIN APP ═══ */
export default function Arena(props) {
  var userId = props.userId;
  var owner = userId || "guest";
  var _scr = useState("loading"), scr = _scr[0], setScr = _scr[1];
  var _S = useState(null), S = _S[0], setS = _S[1];
  var _tab = useState("home"), tab = _tab[0], setTab = _tab[1];
  var _inp = useState(""), inp = _inp[0], setInp = _inp[1];
  var _ts = useState(null), ts = _ts[0], setTS = _ts[1];
  var _fs = useState(null), fs = _fs[0], setFS = _fs[1];
  var _ttab = useState("match"), ttab = _ttab[0], setTtab = _ttab[1];
  var _prof = useState(null), prof = _prof[0], setProf = _prof[1];
  var _picking = useState(false), picking = _picking[0], setPicking = _picking[1];
  var _help = useState(false), showHelp = _help[0], setHelp = _help[1];
  var fileRef = useRef(null);

  useEffect(function () {
    var done = false;
    function fin(d) {
      if (done) return; done = true;
      if (!d || !d.player) { setScr("title"); return; }
      setS(d);
      if (d.activeT) { setTS(d.activeT); setScr("tourney"); }
      else if (d.activeF) { setFS(d.activeF); setScr("finals"); }
      else setScr("hub");
    }
    if (userId) {
      loadGameFromCloud(userId).then(function(cloud) {
        var local = sGet();
        var best = pickNewest(local, cloud, owner);
        fin(best);
        if (best && best === cloud) sSet(cloud);
        else if (best && best === local) queueCloudSave(userId, stamp(local, owner), saveGameToCloud);
      }).catch(function() { fin(sGet()); });
    } else {
      fin(sGet());
    }
  }, []);

  function save(s) { var st = stamp(s, owner); setS(st); sSet(st); queueCloudSave(userId, st, saveGameToCloud); }

  /* Live tournament/finals state (bracket + current match progress) rides along in the save, so a reload resumes mid-event.
     Written after every change, so it always lands after any save() made in the same update. */
  useEffect(function () {
    if (!S) return;
    var patch = scr === "tourney" && ts ? { activeT: ts, activeF: null } : scr === "finals" && fs ? { activeT: null, activeF: fs } : null;
    if (!patch) return;
    var snap = stamp(Object.assign({}, S, patch), owner);
    sSet(snap);
    queueCloudSave(userId, snap, saveGameToCloud);
  }, [ts, fs]);
  function exportSave() { if (!S) return; var b = new Blob([JSON.stringify(S)],{type:"application/json"}); var u = URL.createObjectURL(b); var a = document.createElement("a"); a.href = u; a.download = "arena-"+S.pName+"-s"+S.sNum+".json"; a.click(); URL.revokeObjectURL(u); }
  function importSave(e) { var f = e.target.files && e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(ev){ try { var d = JSON.parse(ev.target.result); if (d && d.player) { save(d); setScr("hub"); } } catch(err){} }; r.readAsText(f); }
  var _syncing = useState(false), syncing = _syncing[0], setSyncing = _syncing[1];
  var _syncMsg = useState(""), syncMsg = _syncMsg[0], setSyncMsg = _syncMsg[1];
  var _mutedState = useState(isMuted()), mutedState = _mutedState[0], setMutedState = _mutedState[1];
  function toggleMute() { var n = !mutedState; setMuted(n); setMutedState(n); }
  var _confetti = useState(false), confetti = _confetti[0], setConfetti = _confetti[1];
  var _showBracket = useState(false), showBracket = _showBracket[0], setShowBracket = _showBracket[1];
  var _showScout = useState(false), showScout = _showScout[0], setShowScout = _showScout[1];
  var _paper = useState(null), paper = _paper[0], setPaper = _paper[1];
  var _interview = useState(null), interview = _interview[0], setInterview = _interview[1];
  var _newsIdx = useState(0), newsIdx = _newsIdx[0], setNewsIdx = _newsIdx[1];
  var _gala = useState(null), gala = _gala[0], setGala = _gala[1];
  var _achQ = useState([]), achQ = _achQ[0], setAchQ = _achQ[1];
  var _showAch = useState(false), showAch = _showAch[0], setShowAch = _showAch[1];
  /* Achievements: whenever the save changes on the hub, award anything newly earned (only on the hub, so a save never
     lands mid-tournament without its live bracket) */
  useEffect(function () {
    if (!S || !S.player || scr !== "hub") return;
    var fresh = checkAchievements(S); if (!fresh.length) return;
    var ach = Object.assign({}, S.player.ach || {}); fresh.forEach(function (id) { ach[id] = { s: S.sNum, at: Date.now() }; });
    save(Object.assign({}, S, { player: Object.assign({}, S.player, { ach: ach }) }));
    setAchQ(function (q) { return q.concat(fresh.length > 3 ? ["+" + fresh.length] : fresh); });
  }, [S, scr]);
  var _rankView = useState({ mode: "me", above: 25, below: 25 }), rankView = _rankView[0], setRankView = _rankView[1];
  /* Opening Rankings lands on your own row, centred */
  useEffect(function () {
    if (scr !== "hub" || tab !== "rankings") return;
    setRankView({ mode: "me", above: 25, below: 25 });
    var t = setTimeout(function () { var el = document.querySelector("[data-me-row]"); if (el) el.scrollIntoView({ block: "center" }); }, 60);
    return function () { clearTimeout(t); };
  }, [scr, tab]);
  function markNewsSeen() {
    if (S && S.news && S.news[0] && S.newsSeenAt !== S.news[0].at) save(Object.assign({}, S, { newsSeenAt: S.news[0].at }));
  }

  /* The player picked an answer: settle the crowd's reaction, remember the tone, record a promise, update this week's issue */
  function onInterviewAnswer(answer, outcome) {
    var iv = interview; if (!iv || !S) return;
    var p = S.player, f = clampFans(fansOf(p) + outcome.delta);
    var issue = Object.assign({}, iv.issue, {
      interview: { outlet: iv.iv.outlet, question: iv.iv.question, quote: answer.text, delta: outcome.delta, reaction: outcome.reaction, viral: outcome.viral, promise: answer.tone === "bold" },
      fans: Object.assign({}, iv.issue.fans, { after: f, interview: outcome.delta })
    });
    var news = (S.news || []).slice(); if (news[0] && news[0].at === iv.issue.at) news[0] = issue;
    save(Object.assign({}, S, { news: news, player: Object.assign({}, p, { stats: outcome.viral ? Object.assign({}, p.stats || {}, { viral: ((p.stats || {}).viral || 0) + 1 }) : (p.stats || {}), fans: f, lastTones: [answer.tone].concat(p.lastTones || []).slice(0, 2), ivSeen: (iv.iv.used || []).concat(p.ivSeen || []).slice(0, 48), promise: answer.tone === "bold" ? { wk: iv.issue.wk } : null }) }));
    return issue;
  }
  var lastRankRef = useRef(null);

  /* Rank-up chime when crossing tier thresholds */
  useEffect(function() {
    if (!S) return;
    var r = pRankOf(S);
    var prev = lastRankRef.current;
    lastRankRef.current = r;
    if (prev == null) return;
    var thresholds = [1, 3, 10, 16, 50, 100, 500];
    for (var i = 0; i < thresholds.length; i++) {
      if (r <= thresholds[i] && prev > thresholds[i]) { playRankUp(); break; }
    }
  }, [S]);

  function doSync(seasonData) {
    if (!userId || !seasonData) return;
    setSyncing(true); setSyncMsg("");
    var sd = Object.assign({}, seasonData, { _lastRank: pRankOf(seasonData) });
    syncAchievements(userId, seasonData.pName, "⚔️", sd)
      .then(function() { setSyncMsg("Synced!"); setTimeout(function(){ setSyncMsg(""); }, 2000); })
      .catch(function(e) { setSyncMsg("Sync failed"); console.error(e); })
      .finally(function() { setSyncing(false); });
  }

  function newSeason() { save(mkSeason(inp, 1, null)); setScr("hub"); }
  function nextSeason(from) { var cur = from && from.cal ? from : S; if (!cur) return; doSync(cur); save(mkSeason(cur.pName, (cur.sNum||1)+1, cur)); setScr("hub"); }
  function newGame() { if (confirm("Start a brand new game? Your current save will be erased.")) { cancelCloudSave(); sSet(null); if (userId) saveGameToCloud(userId, null).catch(function(){}); setS(null); setTS(null); setFS(null); setScr("title"); } }

  function doTrain(stat) {
    if (!S) return;
    var t = Object.assign({s:0,g:0}, S.player.tr);
    var cost = trainCost(t[stat]||0);
    if (t.tp < cost || (t[stat]||0) >= 20) return;
    t.tp -= cost; t[stat] = (t[stat]||0) + 1;
    save(Object.assign({}, S, { player: Object.assign({}, S.player, { tr: t }) }));
  }

  /* ─── Play current event (used by calendar cell click and Next Event button) ─── */
  function playCurrent() {
    if (!S || S.calIdx >= S.cal.length) return;
    var ev = S.cal[S.calIdx];
    if (!ev) return;
    if (ev.type === "gs") {
      if (pRankOf(S) <= 64 || hasSlamWildcard(fansOf(S.player))) {
        startTourney(5);
      } else {
        var cal = S.cal.slice();
        cal[S.calIdx].done = true;
        cal[S.calIdx].result = { pPts: 0, defending: 0, net: 0, pRound: 0, parallel: [] };
        /* Record rank for sparkline (skipped GS — rank stays same) */
        var skipRank = pRankOf(S);
        var skipPlayer = Object.assign({}, S.player, { rankHist: (S.player.rankHist || []).concat([skipRank]).slice(-40) });
        save(Object.assign({}, S, { cal: cal, calIdx: S.calIdx + 1, player: skipPlayer }));
      }
    } else {
      setPicking(true);
    }
  }

  /* ─── Available tiers for player ─── */
  function availableTiers(S) {
    var rank = pRankOf(S);
    var avail = [];
    for (var i = 0; i < 5; i++) {
      if (rank >= TIERS[i].rankRange[0] && rank <= TIERS[i].rankRange[1]) avail.push(i);
    }
    /* If nothing matches, find closest tier for this rank */
    if (avail.length === 0) {
      if (rank > 700) avail.push(0);
      else if (rank > 400) avail.push(1);
      else if (rank > 200) avail.push(2);
      else if (rank > 100) avail.push(3);
      else avail.push(4);
    }
    /* Crowd favourites get a wildcard into the tier above */
    var top = Math.max.apply(null, avail);
    if (hasTierWildcard(fansOf(S.player)) && top < 4) avail.push(top + 1);
    return avail;
  }
  function wildcardTier(S) {
    if (!hasTierWildcard(fansOf(S.player))) return -1;
    var a = availableTiers(S); return a[a.length - 1];
  }

  /* ─── Bracket logic ─── */
  function runBk(bk, round, alive, maxRound) {
    var rd = bk[round]; if (!rd) return { bracket: bk, round: round, pending: null, done: true };
    for (var i = 0; i < rd.length; i++) { var m = rd[i]; if (m.w) continue; if ((m.a.isP || m.b.isP) && alive) return { bracket: bk, round: round, pending: i, done: false }; var w = nW(m.a, m.b); w.tP = (w.tP||0) + (bk._pts ? bk._pts[round] : 0); m.w = w; }
    if (round >= maxRound - 1) return { bracket: bk, round: round, pending: null, done: true };
    var nx = []; for (var j = 0; j < rd.length; j += 2) { if (j+1 < rd.length) nx.push({ a: rd[j].w, b: rd[j+1].w, w: null }); }
    bk[round + 1] = nx;
    return runBk(bk, round + 1, alive, maxRound);
  }

  function startTourney(tierIdx) {
    if (!S) return;
    var tier = TIERS[tierIdx];
    var ranked = getRanked(S);
    var pool = [];
    for (var i = 0; i < ranked.length && pool.length < tier.size; i++) {
      var r = i + 1;
      if (r >= tier.rankRange[0] && r <= tier.rankRange[1]) pool.push(Object.assign({}, ranked[i], { tP: 0 }));
    }
    /* Ensure player is in pool */
    var hasP = pool.some(function(p){return p.isP;});
    if (!hasP) { pool[pool.length - 1] = Object.assign({}, S.player, { name: S.pName, tP: 0 }); }
    /* Fill if needed */
    while (pool.length < tier.size) {
      var extra = ranked[pool.length + tier.rankRange[0] - 1];
      if (extra) pool.push(Object.assign({}, extra, { tP: 0 }));
      else break;
    }
    /* Shuffle */
    for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(Math.random()*(k+1)); var t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
    var pi = -1; for (var x = 0; x < pool.length; x++) { if (pool[x].isP) { pi = x; break; } }
    if (pi > 0) { var tmp = pool[0]; pool[0] = pool[pi]; pool[pi] = tmp; }
    var r0 = []; for (var m = 0; m < pool.length; m += 2) r0.push({ a: pool[m], b: pool[m+1], w: null });
    var bk = [r0]; bk._pts = tier.pts; bk._tier = tierIdx;
    var result = runBk(bk, 0, true, tier.rounds);
    setTS({ bracket: result.bracket, round: result.round, pending: result.pending, done: result.done, alive: true, log: [], tierIdx: tierIdx });
    setTtab("match"); setScr("tourney");
  }

  function onTR(won, myAvg, oppAvg, setScore, setSeq, xtra) {
    if (!ts) return;
    var tier = TIERS[ts.tierIdx]; var rNames = tier.rounds === 6 ? RN6 : RN5;
    var bk = JSON.parse(JSON.stringify(ts.bracket)); bk._pts = tier.pts; bk._tier = ts.tierIdx;
    var m = bk[ts.round][ts.pending]; var opp = m.a.isP ? m.b : m.a;
    var winner = won ? (m.a.isP ? m.a : m.b) : (m.a.isP ? m.b : m.a);
    winner.tP = (winner.tP||0) + tier.pts[ts.round]; m.w = winner;
    var oppRankNow = 0; var rk = getRanked(S); for (var rki = 0; rki < rk.length; rki++) { if (rk[rki].id === opp.id) { oppRankNow = rki + 1; break; } }
    var log = ts.log.concat([{ round: rNames[ts.round], opp: opp.name, oppId: opp.id, oppRank: oppRankNow, myRank: pRankOf(S), won: won, pts: won ? tier.pts[ts.round] : 0, sc: setScore || null, seq: setSeq || "", gold: (xtra && xtra.gold) || 0, flawless: (xtra && xtra.flawless) || 0 }]);
    var r = runBk(bk, ts.round, won, tier.rounds);
    setTS({ bracket: r.bracket, round: r.round, pending: r.pending, done: r.done, alive: won, log: log, tierIdx: ts.tierIdx });
    /* Record head-to-head vs this opponent */
    if (opp && opp.id) {
      var h2h = Object.assign({}, S.player.h2h || {});
      var entries = (h2h[opp.id] || []).concat([{
        s: S.sNum, tier: ts.tierIdx, round: ts.round, w: won,
        ma: myAvg != null ? Math.round(myAvg) : null,
        oa: oppAvg != null ? Math.round(oppAvg) : null,
        sc: setScore || null,
        name: opp.name, emoji: opp.emoji
      }]);
      h2h[opp.id] = entries.slice(-10); /* keep last 10 per opponent */
      save(Object.assign({}, S, { player: Object.assign({}, S.player, { h2h: h2h }) }));
    }
    if (r.done && won) {
      /* Tournament title won — celebrate */
      setTimeout(function(){ playTitle(); }, 500);
      setConfetti(true);
      setTimeout(function(){ setConfetti(false); }, 3200);
    }
  }

  function finishT() {
    if (!S || !ts) return;
    var tier = TIERS[ts.tierIdx]; var isGS = ts.tierIdx === 5;
    var tally = function(pid) { var p = 0; for (var ri = 0; ri < ts.bracket.length; ri++) { var rd = ts.bracket[ri]; if (rd) for (var mi = 0; mi < rd.length; mi++) { if (rd[mi].w && rd[mi].w.id === pid) p += tier.pts[ri]; } } return p; };
    var pp = tally(1);
    /* No points for R1 losers — you must win to earn */
    var pRound = 0; for (var ri = 0; ri < ts.bracket.length; ri++) { var rd = ts.bracket[ri]; if (rd) for (var mi = 0; mi < rd.length; mi++) { var mm = rd[mi]; if ((mm.a && mm.a.id===1)||(mm.b && mm.b.id===1)) pRound = ri; } }
    var champM = ts.bracket[tier.rounds - 1] && ts.bracket[tier.rounds - 1][0]; var champW = champM && champM.w;
    var wonTitle = champW && champW.id === 1;
    var spBefore = {}; S.npcs.forEach(function(n){ spBefore[n.id] = n.sp || 0; });
    var newNpcs = S.npcs.map(function(n){
      var e = tally(n.id);
      var tr = Object.assign({s:0,g:0}, n.tr||{});
      var nb = Object.assign({}, n.best||{});
      if (champW && champW.id === n.id) { nb.titles = (nb.titles||0) + 1; if (isGS) nb.gsTitles = (nb.gsTitles||0) + 1; }
      var nb2 = Object.assign({}, nb, { careerMoney: (nb.careerMoney||0) + Math.round(e * 3) });
      return Object.assign({}, n, { sp: (n.sp||0)+e, ap: (n.ap||0)+e, skill: Math.min(n.pot||92, (n.skill||30)+(Math.random()*0.3-0.05)), tr: tr, best: nb2 });
    });
    /* Update player with DEFENDING POINTS system */
    var pb = Object.assign({}, S.player.best||{});
    var oldPeak = pb.rank || 1001;
    if (wonTitle) { pb.titles = (pb.titles||0) + 1; if (isGS) pb.gsTitles = (pb.gsTitles||0) + 1; }
    /* Defending: points earned at this calendar slot last season */
    var defending = (S.player.def && S.player.def[S.calIdx]) || 0;
    var netChange = pp - defending;
    var newSP = (S.player.sp||0) + netChange;
    if (newSP < 0) newSP = 0;
    var curRank = pRankOf(S);
    if (curRank < (pb.rank||1001)) pb.rank = curRank;
    if (newSP > (pb.peakS||0)) pb.peakS = newSP;
    var newRes = (S.player.res || [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]).slice();
    newRes[S.calIdx] = pp;
    /* Career timeline entries for this event */
    var tlNew = [];
    var curEv = S.cal && S.cal[S.calIdx];
    var wLabel = curEv ? (curEv.type === "gs" ? ("GS " + curEv.gsNum) : (curEv.block + "." + curEv.week)) : String(S.calIdx + 1);
    /* Compute money earned here so timeline has it */
    var tlMoney = 0;
    for (var tlmi = 0; tlmi <= pRound; tlmi++) { tlMoney += (tier.money || [])[tlmi] || 0; }
    if (wonTitle) {
      tlNew.push({ type: "title", s: S.sNum, w: wLabel, tier: ts.tierIdx, pts: pp, money: tlMoney });
    } else if (isGS && pRound >= 2) {
      /* Quarterfinals or better at a Grand Slam, even without title */
      tlNew.push({ type: "gs", s: S.sNum, w: wLabel, gsNum: curEv ? curEv.gsNum : null, pRound: pRound, pts: pp, money: tlMoney });
    }
    if (curRank < oldPeak) {
      tlNew.push({ type: "peak", s: S.sNum, w: wLabel, rank: curRank });
    }
    var newTimeline = (S.player.timeline || []).concat(tlNew).slice(-200);
    /* Crowd: weekly drift + how you rode + last week's promise; sponsors pay out training points on the new total */
    var fansBefore = fansOf(S.player);
    var perf = performanceDelta(ts.log, wonTitle, isGS);
    var prom = resolvePromise(S.player.promise, pRound, tier.rounds, wonTitle);
    /* Beating your rival: the crowd loves a grudge settled on the lanes */
    var rivalNow = S.player.rival || null;
    var revengeWins = rivalNow ? ts.log.filter(function(m){ return m.won && m.oppId === rivalNow.id; }).length : 0;
    var rivalLoss = rivalNow ? ts.log.some(function(m){ return !m.won && m.oppId === rivalNow.id; }) : false;
    if (revengeWins) { perf.d += 3; perf.notes = perf.notes.concat(["revenge on " + sh(rivalNow.name)]); }
    var fansNow = clampFans(weeklyDrift(fansBefore) + perf.d + (prom ? prom.delta : 0));
    var sponsor = sponsorTP(fansNow);
    /* Career counters for the achievements, then who your rival is after this week */
    var newStats = tallyTournament(S.player.stats, ts.log, { bo: tier.bo, tierIdx: ts.tierIdx, wonTitle: wonTitle, rivalId: rivalNow ? rivalNow.id : null, promiseKept: !!(prom && prom.kept) });
    var rv = updateRival(S.player, S.sNum, curEv ? (curEv.type === "gs" ? "Grand Slam " + curEv.gsNum : "Week " + wLabel) : "");
    var settledRivals = S.player.settledRivals || [];
    if (rv.settled) { newStats.rivalsSettled = (newStats.rivalsSettled || 0) + 1; settledRivals = settledRivals.concat([rv.settled.id]); }
    var newP = Object.assign({}, S.player, { sp: newSP, ap: (S.player.ap||0)+pp, tr: Object.assign({}, S.player.tr, { tp: (S.player.tr.tp||0) + Math.floor(pp/4) + 15 + sponsor }), best: pb, res: newRes, timeline: newTimeline, fans: fansNow, promise: null,
      stats: newStats, rival: rv.rival, settledRivals: settledRivals });
    if (!rv.rival) delete newP.rival;
    /* Update NPC peak ranks */
    var tempS = Object.assign({}, S, { player: newP, npcs: newNpcs });
    var ranked = getRanked(tempS);
    for (var ri2 = 0; ri2 < ranked.length; ri2++) {
      if (!ranked[ri2].isP) {
        var npc = newNpcs.find(function(n){return n.id===ranked[ri2].id;});
        if (npc && (ri2+1) < ((npc.best||{}).rank||1001)) { npc.best = Object.assign({}, npc.best||{}); npc.best.rank = ri2+1; }
      }
    }
    var rNames = tier.rounds === 6 ? RN6 : RN5;
    /* ── FULL TOUR SIMULATION: ALL 1000 players compete every week ── */
    var parallelResults = [];
    var curEvent = S.cal && S.cal[S.calIdx];
    var isGSweek = curEvent && curEvent.type === "gs";
    var tempRanked = getRanked(Object.assign({}, S, { player: newP, npcs: newNpcs }));
    /* Newsroom notes: the week's biggest giant-killing anywhere on tour, and each tier's most surprising champion */
    var rkOf = {}; tempRanked.forEach(function(p, i){ if (!p.isP) rkOf[p.id] = i + 1; });
    var shock = null;
    var brief = function(p){ return { id: p.id, name: p.name, emoji: p.emoji || "" }; };
    /* Mark which NPCs played in player's tournament (they already got points above) */
    var playedIds = {};
    for (var bri = 0; bri < ts.bracket.length; bri++) {
      var brd = ts.bracket[bri]; if (!brd) continue;
      for (var bmi = 0; bmi < brd.length; bmi++) { if (brd[bmi].a) playedIds[brd[bmi].a.id] = true; if (brd[bmi].b) playedIds[brd[bmi].b.id] = true; }
    }
    /* Run multiple tournaments at each tier for remaining NPCs */
    var tierCounts = isGSweek ? [0,0,0,0,0,1] : [10,5,3,2,1,0];
    for (var pti = 0; pti < 6; pti++) {
      var numEvents = tierCounts[pti];
      /* The player's tournament is one of this tier's events; the rest of the tier still plays its own */
      if (pti === ts.tierIdx) { parallelResults.push({ tier: pti, playerEvent: true, count: 1 }); numEvents -= 1; }
      if (numEvents <= 0) continue;
      var pt = TIERS[pti];
      /* Collect eligible NPCs not in player's tournament */
      var eligible = [];
      for (var ei = 0; ei < tempRanked.length; ei++) {
        var er = ei + 1;
        if (!tempRanked[ei].isP && !playedIds[tempRanked[ei].id] && er >= pt.rankRange[0] && er <= pt.rankRange[1]) eligible.push(tempRanked[ei]);
      }
      if (eligible.length < 8) continue;
      /* Shuffle eligible pool */
      for (var ek = eligible.length - 1; ek > 0; ek--) { var ej = Math.floor(Math.random()*(ek+1)); var et = eligible[ek]; eligible[ek] = eligible[ej]; eligible[ej] = et; }
      var topWinner = null, tierUpset = null;
      for (var ev = 0; ev < numEvents; ev++) {
        var poolStart = ev * pt.size;
        var pool = eligible.slice(poolStart, poolStart + pt.size);
        if (pool.length < 4) break;
        /* One tournament per rider per week, even where tier rank ranges overlap */
        pool = pool.filter(function(p){ return !playedIds[p.id]; });
        pool.forEach(function(p){ playedIds[p.id] = true; });
        if (pool.length % 2) pool.pop();
        if (pool.length < 4) continue;
        /* Track each participant's deepest round */
        var deepRound = {};
        for (var dp = 0; dp < pool.length; dp++) deepRound[pool[dp].id] = 0;
        /* Sim full bracket */
        var brackets = [pool.slice()];
        for (var rd2 = 0; rd2 < pt.rounds && brackets[brackets.length-1].length > 1; rd2++) {
          var cur = brackets[brackets.length-1]; var nxt = [];
          for (var mi2 = 0; mi2 < cur.length; mi2 += 2) {
            if (mi2+1 < cur.length) {
              var w2 = nW(cur[mi2], cur[mi2+1]);
              var l2 = w2.id === cur[mi2].id ? cur[mi2+1] : cur[mi2];
              deepRound[w2.id] = rd2 + 1;
              var gap = (rkOf[w2.id] || 0) - (rkOf[l2.id] || 0);
              if (gap > 0 && (!shock || gap * (1 + pti * 0.6) > shock.gap * (1 + shock.tier * 0.6))) shock = { tier: pti, round: (pt.rounds === 6 ? RN6 : RN5)[rd2], w: brief(w2), l: brief(l2), wRank: rkOf[w2.id], lRank: rkOf[l2.id], gap: gap };
              /* Loser gets points for round reached */
              var loserNpc = newNpcs.find(function(n){return n.id===l2.id;});
              if (loserNpc && rd2 > 0) { var lPts = Math.round(pt.pts[rd2-1] * 0.6); loserNpc.sp = (loserNpc.sp||0)+lPts; loserNpc.ap = (loserNpc.ap||0)+lPts; }
              nxt.push(w2);
            } else { nxt.push(cur[mi2]); }
          }
          brackets.push(nxt);
        }
        /* Winner gets full points + titles */
        var winner = brackets[brackets.length-1][0];
        if (winner) {
          var wNpc = newNpcs.find(function(n){return n.id===winner.id;});
          if (wNpc) {
            var totalWin = 0; for (var wp = 0; wp < pt.pts.length; wp++) totalWin += pt.pts[wp];
            wNpc.sp = (wNpc.sp||0)+totalWin; wNpc.ap = (wNpc.ap||0)+totalWin;
            wNpc.best = Object.assign({},wNpc.best||{}); wNpc.best.titles = (wNpc.best.titles||0)+1;
            if (pti === 5) wNpc.best.gsTitles = (wNpc.best.gsTitles||0)+1;
            if (!topWinner || totalWin > (topWinner.pts||0)) topWinner = { name: winner.name, emoji: winner.emoji, id: winner.id, pts: totalWin };
            /* How unlikely was this champion? Compare her to the event's top seed */
            var fav = pool.reduce(function(a, p){ return (rkOf[p.id] || 9999) < (rkOf[a.id] || 9999) ? p : a; }, pool[0]);
            var seedGap = (rkOf[winner.id] || 0) - (rkOf[fav.id] || 0);
            if (seedGap > 0 && (!tierUpset || seedGap > tierUpset.gap)) tierUpset = { winner: brief(winner), wRank: rkOf[winner.id], fav: brief(fav), favRank: rkOf[fav.id], gap: seedGap };
          }
          /* Semifinalists get partial points */
          if (brackets.length >= 3) {
            var semis2 = brackets[brackets.length - 2];
            for (var si2 = 0; si2 < semis2.length; si2++) {
              var sNpc = newNpcs.find(function(n){return n.id===semis2[si2].id && n.id!==winner.id;});
              if (sNpc) { var sPts = Math.round(pt.pts[pt.pts.length-2] * 0.7); sNpc.sp=(sNpc.sp||0)+sPts; sNpc.ap=(sNpc.ap||0)+sPts; }
            }
          }
        }
      }
      if (topWinner) topWinner.rank = rkOf[topWinner.id];
      parallelResults.push({ tier: pti, count: numEvents, winner: topWinner, upset: tierUpset });
    }
    /* ── TRAINING: every rider earns and spends training points by the player's rules ── */
    var trainLog = {};
    newNpcs.forEach(function(n){
      var earned = Math.max(0, (n.sp || 0) - (spBefore[n.id] || 0));
      var bought = npcTrainWeek(n, playedIds[n.id] ? 15 + Math.floor(earned / 4) : 10);
      if (bought) trainLog[n.id] = bought;
    });
    /* Calculate money earned */
    var moneyEarned = 0;
    for (var mri = 0; mri <= pRound; mri++) { moneyEarned += (tier.money || [])[mri] || 0; }
    var hist = (S.tHist||[]).concat([{ num: (S.tHist||[]).length + 1, season: S.sNum, tier: ts.tierIdx, tierName: tier.name, pPts: pp, defending: defending, netChange: netChange, pRound: pRound, roundName: rNames[pRound], money: moneyEarned, winner: champW ? { name: champW.isP ? S.pName : champW.name, emoji: champW.emoji||"👑", isP: champW.isP } : null }]);
    var cal = S.cal.slice(); cal[S.calIdx].done = true; cal[S.calIdx].tier = ts.tierIdx; cal[S.calIdx].result = { pPts: pp, defending: defending, net: netChange, pRound: pRound, won: !!wonTitle, parallel: parallelResults };
    newP.money = (newP.money || 0) + moneyEarned;
    newP.seasonMoney = (newP.seasonMoney || 0) + moneyEarned;
    /* Record post-event rank for sparkline */
    var newRank = pRankOf(Object.assign({}, S, { player: newP, npcs: newNpcs }));
    newP.rankHist = (newP.rankHist || []).concat([newRank]).slice(-40);
    cal[S.calIdx].result.rankAfter = newRank;
    var afterS = Object.assign({}, S, { player: newP, npcs: newNpcs, tHist: hist, cal: cal, calIdx: S.calIdx + 1, activeT: null, activeF: null });
    var issue = null;
    try {
      issue = buildIssue({ before: S, after: afterS, bracket: ts.bracket, roundNames: rNames, tierIdx: ts.tierIdx, tierName: tier.name, pRound: pRound, wonTitle: wonTitle,
        pts: pp, net: netChange, money: moneyEarned, champ: champW, parallel: parallelResults, shock: shock, trainLog: trainLog, weekLabel: curEv && curEv.type === "gs" ? "Grand Slam " + curEv.gsNum : "Week " + wLabel });
    } catch (e) { console.error("News issue failed:", e); }
    if (issue) {
      issue.fans = { before: fansBefore, perf: perf.d, notes: perf.notes, promise: prom, sponsor: sponsor, after: fansNow };
      /* The feud column: your rival's week, and what happened if you met */
      var feudWho = rv.rival || rivalNow;
      if (feudWho) {
        var fb4 = rankMap(S), faf = rankMap(afterS), fl = (afterS.player.h2h || {})[feudWho.id] || [], fw = fl.filter(function(m){ return m.w; }).length;
        issue.rival = { p: { id: feudWho.id, name: feudWho.name, emoji: feudWho.emoji || "" }, from: fb4[feudWho.id], to: faf[feudWho.id], lv: trainLog[feudWho.id] || 0,
          h2h: { w: fw, l: fl.length - fw }, met: revengeWins ? "won" : rivalLoss ? "lost" : null, isNew: !!(rv.rival && (!rivalNow || rivalNow.id !== rv.rival.id)),
          settled: rv.settled ? { name: rv.settled.name, emoji: rv.settled.emoji || "" } : null };
      }
      afterS.news = [issue].concat(S.news || []).slice(0, 12);
    }
    save(afterS);
    setScr("hub"); setTS(null);
    if (issue) {
      /* Press first, then the paper (which quotes the interview) */
      var y = issue.you, rival = y.rivalry && y.rivalry.l >= 2 && y.rivalry.l > y.rivalry.w;
      var ctx = y.champion ? "champion" : y.reached === "Final" ? "final" : rival ? "rival" : y.wins >= 2 ? "deep" : "early";
      setInterview({ issue: issue, iv: makeInterview(ctx, { tier: tier.name, round: y.reached, foe: y.lostTo ? sh(y.lostTo.foe.name) : "", beat: y.bestWin ? sh(y.bestWin.foe.name) : "" }, null, S.player.ivSeen) });
    }
  }

  /* ─── Finals ─── */
  function startFinals() {
    if (!S) return;
    var st = mkFinals(S); setFS(st); setScr("finals");
    if (pRankOf(S) <= 16) { var fst = Object.assign({}, S.player.stats || {}); fst.finals = (fst.finals || 0) + 1; save(Object.assign({}, S, { player: Object.assign({}, S.player, { stats: fst }) })); }
  }
  function mkFinals(S) {
    var ranked = getRanked(S);
    var t16 = ranked.slice(0,16).map(function(p){return Object.assign({},p,{gP:0,gW:0,gL:0});});
    var houses = [[],[],[],[]];
    for (var i = 0; i < t16.length; i++) { var row = Math.floor(i/4); var col = row%2===0?i%4:3-i%4; houses[col].push(t16[i]); }
    var gm = [];
    for (var hi = 0; hi < 4; hi++) for (var a = 0; a < houses[hi].length; a++) for (var b = a+1; b < houses[hi].length; b++) gm.push({hi:hi,a:houses[hi][a],b:houses[hi][b],w:null});
    var st = {houses:houses,gm:gm,gi:0,phase:"groups",semis:[],final:null,champ:null,pending:null,log:[]};
    advF(st); return st;
  }

  /* ─── Season gala ─── Crown the world champion (the Finals are played out without you if you didn't make them),
     record it once, then hand everything to the ceremony. Its last button starts the next season. */
  function openGala() {
    if (!S) return;
    var st = fs && fs.champ ? fs : mkFinals(S);
    var champ = st.champ, fin = st.final, runner = fin && fin.w ? (fin.w.id === fin.a.id ? fin.b : fin.a) : null;
    var S2 = S;
    if (champ && !(S.champs || []).some(function(c){ return c.s === S.sNum; })) {
      S2 = Object.assign({}, S, { champs: (S.champs || []).concat([{ name: champ.isP ? S.pName : champ.name, s: S.sNum, isP: !!champ.isP, id: champ.isP ? 1 : champ.id, emoji: champ.emoji || "" }]) });
      save(S2);
    }
    var ranked2 = getRanked(S2), cRank = 1;
    ranked2.forEach(function(p, i){ if ((p.isP && champ.isP) || p.id === champ.id) cRank = i + 1; });
    var ys = yourSeason(S2);
    setGala({
      champ: champ.isP ? { id: 1, name: S.pName, emoji: "👵", isP: true } : { id: champ.id, name: champ.name, emoji: champ.emoji || "" },
      runnerUp: runner ? { id: runner.id, name: runner.isP ? S.pName : runner.name, isP: !!runner.isP } : null, champRank: cRank,
      awards: seasonAwards(S2), you: ys, hall: hallOfHelmets(S2), goal: nextGoal(ys.rankEnd, S.sNum + 1)
    });
  }
  function finishGala() {
    var g = gala; setGala(null); setFS(null);
    if (!S) return;
    nextSeason(Object.assign({}, S, { player: Object.assign({}, S.player, { goal: g ? g.goal : S.player.goal }) }));
  }
  function advF(st) {
    if (st.champ) return;
    if (st.phase==="groups") {
      while (st.gi < st.gm.length) { var m = st.gm[st.gi]; if (m.a.isP||m.b.isP){st.pending=st.gi;return;} var w=nW(m.a,m.b),l=w.id===m.a.id?m.b:m.a;m.w=w; var h=st.houses[m.hi]; for(var x=0;x<h.length;x++){if(h[x].id===w.id){h[x].gP+=3;h[x].gW++;}if(h[x].id===l.id){h[x].gL++;}} st.gi++; }
      var hw=st.houses.map(function(h){return h.slice().sort(function(a,b){return(b.gP-a.gP)||(b.gW-a.gW);})[0];}); st.semis=[{a:hw[0],b:hw[2],w:null},{a:hw[1],b:hw[3],w:null}]; st.phase="semis"; st.pending=null; advF(st);
    } else if (st.phase==="semis") {
      for(var i=0;i<st.semis.length;i++){var sm=st.semis[i];if(sm.w)continue;if(sm.a.isP||sm.b.isP){st.pending=i;return;}sm.w=nW(sm.a,sm.b);} if(st.semis[0].w&&st.semis[1].w){st.final={a:st.semis[0].w,b:st.semis[1].w,w:null};st.phase="final";st.pending=null;advF(st);}
    } else if (st.phase==="final"&&st.final&&!st.final.w) { if(st.final.a.isP||st.final.b.isP){st.pending="final";return;} st.final.w=nW(st.final.a,st.final.b);st.champ=st.final.w; }
  }
  function onFR(won, myAvg, oppAvg, setScore, setSeq, xtra) {
    if (!fs) return;
    /* Finals matches count towards the career counters too (S1 carries them into the champion save below) */
    var S1 = S;
    if (S && xtra) { var gst = Object.assign({}, S.player.stats || {}); gst.gold = (gst.gold || 0) + (xtra.gold || 0); gst.flawless = (gst.flawless || 0) + (xtra.flawless || 0); if (won) gst.wins = (gst.wins || 0) + 1; S1 = Object.assign({}, S, { player: Object.assign({}, S.player, { stats: gst }) }); save(S1); }
    var st = JSON.parse(JSON.stringify(fs)); var m, opp, winner, loser;
    delete st.match;
    if (st.phase==="groups") { m=st.gm[st.pending]; opp=m.a.isP?m.b:m.a; winner=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); loser=winner.id===m.a.id?m.b:m.a; m.w=winner; var h=st.houses[m.hi]; for(var x=0;x<h.length;x++){if(h[x].id===winner.id){h[x].gP+=3;h[x].gW++;}if(h[x].id===loser.id){h[x].gL++;}} st.gi++; }
    else if (st.phase==="semis") { m=st.semis[st.pending]; opp=m.a.isP?m.b:m.a; m.w=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); }
    else if (st.phase==="final") { m=st.final; opp=m.a.isP?m.b:m.a; winner=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); m.w=winner; st.champ=winner;
      if(S1){ var pb=Object.assign({},S1.player.best||{}); pb.finals=(pb.finals||0)+1; save(Object.assign({},S1,{player:Object.assign({},S1.player,{best:pb}),champs:(S1.champs||[]).concat([{name:winner.isP?S.pName:winner.name,s:S.sNum,isP:winner.isP}])})); }
    }
    st.log=st.log.concat([{phase:st.phase,opp:(opp&&opp.name)||"?",won:won}]); st.pending=null; advF(st); setFS(st);
  }

  /* ═══ RENDER ═══ */
  if (scr === "loading") return (<motion.div key="loading" {...screenAnim} style={Object.assign({},W,{background:C.page,display:"flex",alignItems:"center",justifyContent:"center"})}><style dangerouslySetInnerHTML={{__html:CSS}} /><span style={{color:C.goldInk,fontSize:16,fontWeight:800}}>🐓 Saddling the roosters…</span></motion.div>);

  if (scr === "title") return (
    <motion.div key="title" {...screenAnim} style={Object.assign({},W,{background:C.page,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",fontFamily:FONT})}>
      <style dangerouslySetInnerHTML={{__html:CSS}} />
      <img src="/icon-192.png" alt="" width="96" height="96" style={{borderRadius:22,border:"3px solid "+C.ink,boxShadow:"0 4px 0 "+C.ink}} />
      <div style={Object.assign(label(C.goldInk),{marginTop:14,letterSpacing:5})}>The Grand</div>
      <h1 style={Object.assign(display(30),{margin:"2px 0 6px"})}>Granny Rooster Joust</h1>
      <p style={{color:C.textSoft,fontSize:13,margin:"0 0 16px",fontWeight:700}}>1000 grannies · 5 tournament tiers · Grand Slams · Season Finals</p>
      <div style={card({padding:18,maxWidth:320,width:"100%",boxSizing:"border-box"})}>
        <div style={Object.assign(label(C.textSoft),{marginBottom:6})}>Name your granny</div>
        <input value={inp} onChange={function(e){setInp(e.target.value)}} placeholder="e.g. Grandma Ruth, Nana Rosa…" onKeyDown={function(e){if(e.key==="Enter"&&inp.trim())newSeason()}}
          style={{width:"100%",padding:12,borderRadius:10,border:"2px solid "+C.lineStrong,background:C.cardWarm,color:C.text,fontSize:16,fontWeight:800,outline:"none",boxSizing:"border-box",textAlign:"center",marginBottom:10,fontFamily:FONT}} />
        <button onClick={function(){if(inp.trim())newSeason();}} disabled={!inp.trim()} style={button("gold",{width:"100%",marginBottom:8,opacity:inp.trim()?1:0.45})}>Saddle up · Season 1</button>
        <button onClick={function(){fileRef.current&&fileRef.current.click()}} style={button("ghost",{width:"100%",fontSize:13})}>📂 Load a save file</button>
        <input ref={fileRef} type="file" accept=".json" onChange={importSave} style={{display:"none"}} />
      </div>
      <div style={card({marginTop:12,maxWidth:320,width:"100%",boxSizing:"border-box",padding:"10px 12px",textAlign:"left",background:C.cardWarm})}>
        <div style={label(C.goldInk)}>How a season works</div>
        <div style={{color:C.textSoft,fontSize:13,lineHeight:1.55,marginTop:4}}>20 events: <b style={{color:C.text}}>4 blocks</b> of weekly tournaments, each closed by a <b style={{color:C.text}}>Grand Slam</b>. Climb from Futures to Masters as your rank rises. The <b style={{color:C.text}}>top 16</b> ride in the Season Finals.</div>
      </div>
    </motion.div>
  );

  if (!S) return (<div style={W}><p>Loading...</p></div>);

  var pRank = pRankOf(S);
  var ranked = getRanked(S);
  var seasonDone = S.calIdx >= S.cal.length;
  var curEvent = !seasonDone ? S.cal[S.calIdx] : null;
  var avTiers = availableTiers(S);

  /* ─── HUB ─── (tabs: home · train · season · rankings · more, with a bottom nav) */
  if (scr === "hub" || scr === "training") {
    var hubTab = scr === "training" ? "train" : tab;
    var tpNow = (S.player.tr && S.player.tr.tp) || 0;
    /* Average levels of the riders ranked around you — the ones you'll actually meet */
    var rivalTr = (function(){
      var rk = getRanked(S), me = rk.findIndex(function(p){ return p.isP; }), near = rk.slice(Math.max(0, me - 25), me + 26).filter(function(p){ return !p.isP; });
      var o = {}; STAT_KEYS.forEach(function(k){ o[k] = near.length ? near.reduce(function(a, p){ return a + ((p.tr||{})[k]||0); }, 0) / near.length : 0; });
      return o;
    })();
    var affordable = ["r","p","f","s","g"].filter(function(k){ var lv = (S.player.tr[k]||0); return lv < 20 && tpNow >= trainCost(lv); }).length;
    function goTab(t) { setScr("hub"); setTab(t); if (t === "news") { setNewsIdx(0); markNewsSeen(); } try { window.scrollTo(0, 0); } catch (e) {} }
    var newsUnread = !!(S.news && S.news[0] && S.newsSeenAt !== S.news[0].at);
    function sectionTitle(txt, sub) {
      return (<div style={{margin:"2px 2px 8px"}}><div style={display(24)}>{txt}</div>{sub && (<div style={{fontSize:13,color:C.textSoft,marginTop:2}}>{sub}</div>)}</div>);
    }
    return (
      <motion.div key="hub" {...screenAnim} style={Object.assign({}, W, { background: C.page, padding: "10px 10px " + (NAV_HEIGHT + 28) + "px" })}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        {confetti && (<Confetti />)}
        {prof && (<Profile player={prof.p} rank={prof.rank} isRival={!!(S.player.rival && prof.p.id === S.player.rival.id)} playerName={S.pName} h2h={!prof.p.isP && S.player.h2h ? (S.player.h2h[prof.p.id] || []) : null} timeline={prof.p.isP ? (S.player.timeline || []) : null} onClose={function(){setProf(null)}} />)}
        {showHelp && (<HelpScreen onClose={function(){setHelp(false)}} />)}
        {picking && !seasonDone && (<TierSheet available={avTiers} wildcard={wildcardTier(S)} rank={pRank} onClose={function(){setPicking(false)}} onPick={function(ti){ setPicking(false); startTourney(ti); }} />)}
        {gala && (<SeasonGala S={S} champ={gala.champ} runnerUp={gala.runnerUp} champRank={gala.champRank} awards={gala.awards} you={gala.you} hall={gala.hall} goal={gala.goal} onDone={finishGala} />)}
        {achQ.length > 0 && (<AchToast queue={achQ} onShown={function(){ setAchQ(function(q){ return q.slice(1); }); }} onOpen={function(){ setAchQ([]); setShowAch(true); }} />)}
        {showAch && (<AchievementsSheet S={S} onClose={function(){ setShowAch(false); }} />)}
        {paper && (<DailyCluck issue={paper} onClose={function(){ setPaper(null); markNewsSeen(); }} />)}
        {interview && (<Interview iv={interview.iv} recentTones={S.player.lastTones || []} fans={fansOf(S.player)}
          onAnswer={onInterviewAnswer} onDone={function(issue){ setInterview(null); setPaper(issue || interview.issue); }} />)}
        <input ref={fileRef} type="file" accept=".json" onChange={importSave} style={{display:"none"}} />

        <div style={{maxWidth:520,margin:"0 auto",textAlign:"left"}}>
          {syncMsg && (<div style={{fontSize:13,color:syncMsg==="Synced!"?C.greenInk:C.redInk,textAlign:"center",marginBottom:6,fontWeight:800}}>{syncMsg}</div>)}

          {hubTab === "home" && (
            <HomeTab S={S} pRank={pRank} curEvent={curEvent} seasonDone={seasonDone}
              onPlay={playCurrent} onFinals={startFinals} onNextSeason={openGala}
              onReadPaper={function(){ goTab("news"); }}
              ach={{ n: achCount(S), total: ACHIEVEMENTS.length }} onAch={function(){ setShowAch(true); }}
              rival={S.player.rival ? { p: S.player.rival, rank: rankMap(S)[S.player.rival.id], rec: rivalRecord(S.player) } : null}
              onRival={function(){ var rp = S.npcs.filter(function(n){ return n.id === S.player.rival.id; })[0]; if (rp) setProf({ p: rp, rank: rankMap(S)[rp.id] }); }}
              onTrain={function(){ goTab("train"); }}
              onOpenProfile={function(){ setProf({ p: Object.assign({}, S.player, { name: S.pName, emoji: "👵" }), rank: pRank }); }} />
          )}

          {hubTab === "train" && (
            <div>
              {sectionTitle("Training Camp", "Spend training points between tournaments. Stats only count relative to your opponent.")}
              <div style={card({textAlign:"center",marginBottom:10,padding:"10px 12px"})}>
                <div style={label()}>Training points</div>
                <div style={display(30, C.goldInk)}>{tpNow} TP</div>
              </div>
              {STAT_GROUPS.map(function(g){
                return (
                  <div key={g.who} style={card({marginBottom:10,padding:"10px 12px 4px"})}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
                      <div style={{flexShrink:0,width:58,height:46,borderRadius:10,background:"linear-gradient(180deg,#fef3c7,#fde68a)",border:"1.5px solid "+C.line,display:"flex",alignItems:"flex-end",justifyContent:"center",overflow:"hidden"}}>
                        <Rider palette={PLAYER_PALETTE} width={58} pose="idle" noRider={g.who==="rooster"} />
                      </div>
                      <div>
                        <div style={display(20)}>{g.icon} {g.title}</div>
                        <div style={label(C.textSoft)}>{g.sub}</div>
                      </div>
                    </div>
                    {STATS.filter(function(st){ return st.who === g.who; }).map(function(st, si){
                      var lv=S.player.tr[st.k]||0,cost=trainCost(lv),can=tpNow>=cost&&lv<20;
                      return (
                        <div key={st.k} style={{padding:"9px 0",borderTop:"1px dashed "+C.line}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,gap:8}}>
                            <div><span style={{color:C.text,fontWeight:900,fontSize:15}}>{st.icon} {st.label}</span><span style={{color:C.textSoft,fontSize:13,marginLeft:6,fontWeight:700}}>Lv {lv}/20</span></div>
                            <button onClick={function(){doTrain(st.k)}} disabled={!can} style={button(can?"gold":"ghost",{padding:"6px 12px",fontSize:13,opacity:can?1:0.6,cursor:can?"pointer":"default"})}>{lv>=20?"MAX":cost+" TP"}</button>
                          </div>
                          {(function(){
                            var rv = rivalTr[st.k] || 0;
                            return (
                              <div style={{position:"relative",display:"flex",gap:2,marginBottom:5}}>
                                {Array.from({length:20}).map(function(_,i){return(<div key={i} style={{flex:1,height:7,borderRadius:2,background:i<lv?st.col:"#efe3c4"}}/>);})}
                                <div title="Average of riders ranked near you" style={{position:"absolute",top:-3,height:13,width:3,borderRadius:2,background:C.ink,left:"calc("+Math.min(100,rv/20*100)+"% - 1.5px)"}} />
                              </div>
                            );
                          })()}
                          <div style={{fontSize:13,color:C.text,fontWeight:700,lineHeight:1.4}}>{st.what}.</div>
                          <div style={{display:"grid",gridTemplateColumns:"auto 1fr",columnGap:8,rowGap:2,fontSize:12.5,color:C.textSoft,marginTop:4,lineHeight:1.35}}>
                            <span style={{fontWeight:900,color:C.goldInk}}>Each level</span><span>{st.per}</span>
                            <span style={{fontWeight:900,color:C.goldInk}}>Train it if</span><span>{st.best.charAt(0).toLowerCase() + st.best.slice(1)}</span>
                            <span style={{fontWeight:900,color:C.goldInk}}>Vs rivals</span>
                            <span>{(function(){ var rv = rivalTr[st.k] || 0, gap = Math.round((lv - rv) * 10) / 10;
                              return (<span>You <b style={{color:C.text}}>{lv}</b> · riders near you ≈ <b style={{color:C.text}}>{rv.toFixed(1)}</b> <b style={{color: gap > 0.4 ? C.greenInk : gap < -0.4 ? C.redInk : C.textMuted}}>{gap > 0.4 ? "▲ ahead" : gap < -0.4 ? "▼ behind" : "level"}</b></span>); })()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {(function(){
                var tr = S.player.tr;
                var total = (tr.r||0)+(tr.p||0)+(tr.f||0)+(tr.s||0)+(tr.g||0);
                return (
                  <div style={card({padding:"10px 12px",background:C.cardWarm})}>
                    <div style={label(C.goldInk)}>How training works</div>
                    <div style={{fontSize:13,color:C.textSoft,lineHeight:1.5,marginTop:4}}>
                      Only the <b style={{color:C.text}}>gap</b> to your opponent matters — if you both have ⚡10, it cancels out, and if she's ahead the effect works <b style={{color:C.text}}>against</b> you. The dark tick on each bar is the average of riders ranked near you. Rivals train too, with points they earn just like you.
                    </div>
                    <div style={{fontSize:12,color:C.textMuted,marginTop:6,fontWeight:700}}>Total {total}/100{total>=100?" · fully trained — the rest is your timing":""}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {hubTab === "season" && (
            <div>
              <SeasonTab S={S} pRank={pRank} curEvent={curEvent} seasonDone={seasonDone} avail={seasonDone ? [] : availableTiers(S)} wildcard={wildcardTier(S)}
                gsOk={pRank <= 64 || hasSlamWildcard(fansOf(S.player))} onPlay={playCurrent} onFinals={startFinals} onNextSeason={openGala} />
              <div style={Object.assign(label(C.textSoft), {margin:"14px 2px 6px"})}>Career results</div>
              <div style={card({padding:6})}>
                {(S.tHist||[]).length===0?(<div style={{color:C.textMuted,fontSize:13,padding:6}}>No events yet.</div>):
                (S.tHist||[]).slice().reverse().map(function(t,i){
                  var tier = TIERS[t.tier]||TIERS[0];
                  return (
                    <div key={i} style={{padding:"6px 8px",background:i%2?"transparent":C.cardWarm,borderRadius:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}>
                        <span style={{display:"flex",alignItems:"center",gap:6}}><span aria-hidden style={{width:8,height:8,borderRadius:"50%",background:tier.col}} /><span style={{color:C.text,fontWeight:900}}>{tier.name}</span><span style={{color:C.textMuted,fontWeight:700}}>S{t.season}</span></span>
                        <div style={{textAlign:"right"}}>
                          <span style={{color:C.text,fontWeight:800}}>{(t.pPts||0).toLocaleString()} pts</span>
                          {t.netChange != null && (<span style={{color:t.netChange>0?C.greenInk:t.netChange<0?C.redInk:C.textMuted,fontWeight:900,marginLeft:6,fontSize:13}}>{t.netChange>0?"+"+t.netChange:t.netChange===0?"±0":t.netChange}</span>)}
                        </div>
                      </div>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.textSoft,marginTop:2}}>
                        <span>Reached <b style={{color:C.text}}>{t.roundName||"R1"}</b>{t.money>0&&(<span style={{color:C.greenInk,marginLeft:6,fontWeight:800}}>{money(t.money)}</span>)}</span>
                        {t.winner&&(<span style={{color:t.winner.isP?C.goldInk:C.textSoft,fontWeight:t.winner.isP?900:600}}>🏆 {t.winner.isP?"YOU":sh(t.winner.name)}</span>)}
                      </div>
                    </div>
                  );
                })}
                {(S.champs||[]).length>0&&(<div style={{marginTop:6,borderTop:"1px dashed "+C.line,padding:"6px 8px 2px"}}><div style={label(C.goldInk)}>👑 Season champions</div>{S.champs.map(function(c,i){return(<div key={i} style={{fontSize:13,color:c.isP?C.goldInk:C.textSoft,fontWeight:c.isP?900:600,marginTop:2}}>S{c.s}: {c.isP?"🌟 YOU":c.name}</div>);})}</div>)}
              </div>
            </div>
          )}

          {hubTab === "news" && (function(){
            var issues = S.news || [];
            var idx = Math.min(newsIdx, Math.max(0, issues.length - 1));
            var issue = issues.length ? issues[idx] : buildSpecialEdition(S);
            return (
              <div>
                {sectionTitle("The Daily Cluck", issues.length ? "A fresh issue after every tournament — your run, your rivals, the world's best." : "A special edition for now. Your first real issue prints after your first tournament.")}
                {issues.length > 0 && (
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 6, marginBottom: 6 }}>
                    {issues.map(function (it, i) {
                      var on = i === idx;
                      return (
                        <button key={it.at || i} onClick={function(){ setNewsIdx(i); }}
                          style={{ flexShrink: 0, fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: 12, padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                            background: on ? "#1c1917" : "#f4ecd8", color: on ? "#f4ecd8" : "#1c1917", border: "1.5px solid #1c1917" }}>
                          {i === 0 ? "Latest · " : ""}S{it.s} {it.wk}
                        </button>
                      );
                    })}
                  </div>
                )}
                <CluckPaper issue={issue} inline={true} />
              </div>
            );
          })()}

          {hubTab === "rankings" && (function(){
            var pIdx = -1; for (var pi = 0; pi < ranked.length; pi++) { if (ranked[pi].isP) { pIdx = pi; break; } }
            var showTop = 50;
            var nearStart = Math.max(showTop, pIdx - 3);
            var nearEnd = Math.min(ranked.length - 1, pIdx + 7);
            var needNear = pIdx >= showTop;
            function renderRow(p, i) {
              var t = p.tr||{};
              return (
                <div key={p.id+"-"+i} data-me-row={p.isP ? "1" : undefined} onClick={function(){setProf({p:p,rank:i+1})}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,padding:"5px 8px",background:p.isP?C.goldSoft:i%2===0?C.cardWarm:"transparent",borderRadius:8,cursor:"pointer",borderLeft:i<16?"3px solid "+(i<4?C.gold:i<8?"#22c55e":i<12?"#3b82f6":"#64748b"):"3px solid transparent"}}>
                  <span style={{color:i<3?C.goldInk:C.textMuted,fontWeight:900,fontSize:13,width:34,textAlign:"right",flexShrink:0}}>#{i+1}</span>
                  <Face palette={p.isP ? PLAYER_PALETTE : paletteFor(p.id, i+1)} size={34} />
                  <div style={{minWidth:0,flex:1}}>
                    <div style={{fontSize:14,color:C.text,fontWeight:p.isP?900:700,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {p.isP?S.pName+" ⭐":(p.emoji||"")+" "+sh(p.name)}{!p.isP && standing(i+1) ? " " + standing(i+1).icon : ""}
                    </div>
                    <div style={{fontSize:12,color:C.textMuted,marginTop:1,fontWeight:600}}>
                      {p.isP?"":"Talent "}{p.isP?"":((p.skill||0)>80?"Elite":(p.skill||0)>60?"Strong":(p.skill||0)>40?"Average":"Developing")}{p.isP?"":" · "}{STATS.map(function(st){ return st.icon + (t[st.k]||0); }).join(" ")}
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:900,color:C.text}}>{(p.sp||0).toLocaleString()}</div>
                    <div style={{fontSize:11,color:C.textMuted,fontWeight:600}}>all-time {(p.ap||0).toLocaleString()}</div>
                  </div>
                </div>
              );
            }
            return (
              <div>
                {sectionTitle("Rankings", "Season points. Top 16 qualify for the Season Finals.")}
                <div style={{display:"flex",gap:6,marginBottom:8}}>
                  {[["me","🎯 Around me"],["top","👑 Top 50"]].map(function(v){
                    var on = rankView.mode === v[0];
                    return (<button key={v[0]} onClick={function(){ setRankView({ mode: v[0], above: 25, below: 25 }); setTimeout(function(){ if (v[0]==="me") { var el=document.querySelector("[data-me-row]"); el && el.scrollIntoView({block:"center"}); } else window.scrollTo(0,0); }, 30); }}
                      style={button(on?"night":"ghost",{padding:"7px 12px",fontSize:12,letterSpacing:0.5})}>{v[1]}</button>);
                  })}
                </div>
                <div style={card({padding:6})}>
                  {rankView.mode === "top" ? ranked.slice(0, showTop).map(function(p, i){ return renderRow(p, i); }) : (function(){
                    /* You in the middle: the same number of riders above and below, more on demand */
                    var start = Math.max(0, pIdx - rankView.above), end = Math.min(ranked.length - 1, pIdx + rankView.below);
                    return (
                      <div>
                        {start > 0 && (<button onClick={function(){ setRankView({ mode: "me", above: rankView.above + 25, below: rankView.below }); }} style={button("ghost",{width:"100%",padding:"7px",fontSize:12,marginBottom:6})}>▲ Show 25 more above (#{Math.max(1, start - 24)}–#{start})</button>)}
                        {ranked.slice(start, end + 1).map(function(p, i){ return renderRow(p, start + i); })}
                        {end < ranked.length - 1 && (<button onClick={function(){ setRankView({ mode: "me", above: rankView.above, below: rankView.below + 25 }); }} style={button("ghost",{width:"100%",padding:"7px",fontSize:12,marginTop:6})}>▼ Show 25 more below (#{end + 2}–#{Math.min(ranked.length, end + 26)})</button>)}
                      </div>
                    );
                  })()}
                  <div style={{textAlign:"center",fontSize:12,color:C.textMuted,padding:6,fontWeight:600}}>Tap any rider for her profile · {ranked.length} riders</div>
                </div>
              </div>
            );
          })()}

          {hubTab === "more" && (function(){
            var rowStyle = Object.assign(card({padding:"12px 14px",marginBottom:8}), {display:"flex",alignItems:"center",justifyContent:"space-between",width:"100%",cursor:"pointer",textAlign:"left",fontFamily:FONT});
            var labelStyle = {fontSize:15,fontWeight:900,color:C.text};
            var hintStyle = {fontSize:12,color:C.textSoft,marginTop:2};
            return (
              <div>
                {sectionTitle("More")}
                <button onClick={function(){setShowAch(true)}} style={rowStyle}>
                  <div><div style={labelStyle}>🏅 Achievements</div><div style={hintStyle}>{achCount(S)} of {ACHIEVEMENTS.length} badges earned</div></div>
                  <span style={{color:C.goldInk,fontSize:20,fontWeight:900}}>›</span>
                </button>
                <button onClick={function(){setHelp(true)}} style={rowStyle}>
                  <div><div style={labelStyle}>❓ How to Play</div><div style={hintStyle}>Sets, strikes and training explained</div></div>
                  <span style={{color:C.goldInk,fontSize:20,fontWeight:900}}>›</span>
                </button>
                <button onClick={toggleMute} style={rowStyle}>
                  <div><div style={labelStyle}>{mutedState?"🔇":"🔊"} Sound Effects</div><div style={hintStyle}>Clucks, clangs, fanfares</div></div>
                  <span style={{color:mutedState?C.redInk:C.greenInk,fontSize:14,fontWeight:900,letterSpacing:0.5}}>{mutedState?"OFF":"ON"}</span>
                </button>
                {userId && (
                  <button onClick={function(){doSync(S)}} disabled={syncing} style={Object.assign({},rowStyle,{opacity:syncing?0.6:1})}>
                    <div><div style={labelStyle}>☁️ Sync to Leaderboard</div><div style={hintStyle}>Post your achievements to the global leaderboard</div></div>
                    <span style={{color:C.greenInk,fontSize:14,fontWeight:900}}>{syncing?"...":"Sync"}</span>
                  </button>
                )}
                <button onClick={exportSave} style={rowStyle}>
                  <div><div style={labelStyle}>💾 Export Save</div><div style={hintStyle}>Download your game as a file</div></div>
                  <span style={{color:C.textSoft,fontSize:20,fontWeight:900}}>›</span>
                </button>
                <button onClick={function(){fileRef.current&&fileRef.current.click()}} style={rowStyle}>
                  <div><div style={labelStyle}>📂 Import Save</div><div style={hintStyle}>Load a previously exported file</div></div>
                  <span style={{color:C.textSoft,fontSize:20,fontWeight:900}}>›</span>
                </button>
                <button onClick={newGame} style={Object.assign({},rowStyle,{borderColor:"#fecaca",background:"#fff5f5",marginTop:16})}>
                  <div><div style={Object.assign({},labelStyle,{color:C.redInk})}>🔄 Restart Game</div><div style={hintStyle}>Erase this save and start over</div></div>
                  <span style={{color:C.redInk,fontSize:20,fontWeight:900}}>›</span>
                </button>
              </div>
            );
          })()}
        </div>

        <BottomNav tab={hubTab} onTab={goTab} badges={{ train: affordable || null, news: newsUnread ? "!" : null }} />
      </motion.div>
    );
  }

  /* ─── TOURNAMENT ─── */
  if (scr === "tourney" && ts) {
    var tier = TIERS[ts.tierIdx]; var rNames = tier.rounds === 6 ? RN6 : RN5;
    var pm = ts.pending != null && ts.bracket[ts.round] ? ts.bracket[ts.round][ts.pending] : null;
    var opp = pm ? (pm.a.isP ? pm.b : pm.a) : null;
    var oppRank = 0; if (opp) { for (var oi = 0; oi < ranked.length; oi++) if (ranked[oi].id===opp.id){oppRank=oi+1;break;} }
    var matchDiff = ts.round + [0,1,2,3,4,3][ts.tierIdx];
    var scoutT = opp ? buildScout(S, opp, oppRank, matchDiff) : null;
    return (
      <motion.div key="tourney" {...screenAnim} style={Object.assign({}, W, { background: C.page })}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        {confetti && (<Confetti />)}
        {prof && (<Profile player={prof.p} rank={prof.rank} isRival={!!(S.player.rival && prof.p.id === S.player.rival.id)} playerName={S.pName} h2h={!prof.p.isP && S.player.h2h ? (S.player.h2h[prof.p.id] || []) : null} timeline={prof.p.isP ? (S.player.timeline || []) : null} onClose={function(){setProf(null)}} />)}
        {showHelp && (<HelpScreen onClose={function(){setHelp(false)}} />)}
        {showBracket && (<BracketView ts={ts} playerName={S.pName} onClose={function(){setShowBracket(false)}} />)}
        {showScout && scoutT && pm && ts.alive && (<ScoutSheet scout={scoutT} onClose={function(){setShowScout(false)}} />)}
        <div style={{maxWidth:520,margin:"0 auto",textAlign:"left"}}>
        <MatchHeader tierName={tier.name} tierColor={tier.col} roundLabel={ts.done ? (ts.alive ? "Champion" : "Tournament over") : rNames[Math.min(ts.round,tier.rounds-1)]}
          bestOf={tier.bo || 3} rounds={rNames} roundIdx={ts.done ? (ts.alive ? tier.rounds : -1) : ts.round}
          onScout={pm && ts.alive && opp ? function(){ setShowScout(true); } : null}
          onBracket={function(){ setShowBracket(true); }} onHelp={function(){ setHelp(true); }} />

        {pm && ts.alive && opp && (
          <div>
            <PowerBar key={"t-"+ts.round} scout={scoutT} onDone={onTR} oppSkill={opp.skill||50} diff={ts.round + [0,1,2,3,4,3][ts.tierIdx]} tr={S.player.tr} otr={opp.tr||{}} playerName={S.pName} playerEmoji="⚔️" oppName={sh(opp.name)} oppEmoji={opp.emoji||"👤"} oppId={opp.id} oppRank={oppRank} fans={fansOf(S.player)} tierColor={tier.col} roundLabel={rNames[ts.round]}
              tierName={tier.name} youSub={"World #"+pRank} foeSub={"World #"+oppRank+" · "+talentLabel(opp.skill)}
              isFinal={ts.round >= tier.rounds-1} nextLabel={ts.round < tier.rounds-1 ? rNames[ts.round+1] : null} eliminated={true}
              stakes={{ pts: tier.pts[ts.round], money: (tier.money||[])[ts.round]||0 }}
              bestOf={tier.bo || 3} initialProgress={ts.match}
              onProgress={function(p){ setTS(function(prev){ return prev ? Object.assign({}, prev, { match: p }) : prev; }); }} />
          </div>
        )}
        {ts.done && (function(){
          var earned = ts.log.reduce(function(a,m){return a+m.pts},0);
          var moneyE = 0; for (var mi=0; mi<ts.log.length; mi++) { if (ts.log[mi].won && tier.money) moneyE += (tier.money[mi]||0); }
          var def = (S.player.def && S.player.def[S.calIdx]) || 0, net = earned - def;
          return (
            <div style={card({textAlign:"center",padding:"16px 14px",marginBottom:8})}>
              <div style={display(24, ts.alive ? C.goldInk : C.text)}>{ts.alive ? "🏆 " + tier.name + " Champion!" : "Tournament complete"}</div>
              <div style={{color:C.textSoft,fontSize:14,marginTop:6,fontWeight:700}}>{ts.log.filter(function(m){return m.won}).length} won · {ts.log.filter(function(m){return !m.won}).length} lost · <b style={{color:C.text}}>{earned.toLocaleString()} pts</b>{moneyE > 0 && (<b style={{color:C.greenInk}}> · +{money(moneyE)}</b>)}</div>
              {def > 0 && (<div style={{fontSize:13,marginTop:4,fontWeight:700,color:C.textSoft}}>Defending {def} from last season → <b style={{color:net>=0?C.greenInk:C.redInk}}>net {net>=0?"+"+net:net}</b></div>)}
              <button onClick={finishT} style={button("gold",{marginTop:12,width:"100%"})}>Back to the tour →</button>
            </div>
          );
        })()}
        {ts.log.length>0&&(<div style={card({padding:"8px 10px"})}><div style={Object.assign(label(C.textSoft),{marginBottom:4})}>Match log</div>{ts.log.map(function(m,i){return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"3px 2px",fontSize:14,fontWeight:800,color:m.won?C.greenInk:C.redInk,borderTop:i?"1px dashed "+C.line:"none"}}><span>{m.won?"W":"L"} · {m.round} vs {sh(m.opp)}</span><span>+{m.pts}</span></div>);})}</div>)}
        </div>
      </motion.div>
    );
  }

  /* ─── FINALS ─── */
  if (scr === "finals" && fs) {
    var fpm=null,fopp=null; if(fs.pending!=null&&!fs.champ){if(fs.phase==="groups")fpm=fs.gm[fs.pending];else if(fs.phase==="semis")fpm=fs.semis[fs.pending];else if(fs.phase==="final")fpm=fs.final;if(fpm)fopp=fpm.a.isP?fpm.b:fpm.a;} var pQ=false;for(var hi=0;hi<fs.houses.length;hi++)for(var pi=0;pi<fs.houses[hi].length;pi++)if(fs.houses[hi][pi].isP)pQ=true;
    return (
      <motion.div key="finals" {...screenAnim} style={W}>
        {gala && (<SeasonGala S={S} champ={gala.champ} runnerUp={gala.runnerUp} champRank={gala.champRank} awards={gala.awards} you={gala.you} hall={gala.hall} goal={gala.goal} onDone={finishGala} />)}
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:15,fontWeight:900,letterSpacing:3,background:"linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SEASON {S.sNum} FINALS</div>
          <div style={{fontSize:14,color:"#475569",marginTop:2}}>{fs.champ?"Champion Crowned":fs.phase==="groups"?"Group Stage":fs.phase==="semis"?"Semifinals":"World Championship"}</div>
        </div>
        {fs.champ&&(<div style={{textAlign:"center",padding:16}}><div style={{fontSize:48}}>👑</div><div style={{fontSize:20,fontWeight:900,color:"#b45309",letterSpacing:3,animation:"cg 2s ease infinite"}}>{fs.champ.isP?"YOU ARE WORLD CHAMPION!":"WORLD CHAMPION"}</div>{!fs.champ.isP&&(<div style={{fontSize:15,color:"#475569",marginTop:4}}>{fs.champ.emoji} {fs.champ.name}</div>)}<button onClick={openGala} style={Object.assign({},bs("linear-gradient(135deg,#facc15,#f59e0b)","#000"),{marginTop:14})}>🎩 To the Season Gala</button></div>)}
        {fpm&&fopp&&!fs.champ&&(function(){
          var fRank = 0; for (var fri = 0; fri < ranked.length; fri++) if (ranked[fri].id === fopp.id) { fRank = fri + 1; break; }
          var scoutF = buildScout(S, fopp, fRank, fs.phase==="final"?5:fs.phase==="semis"?4:3);
          return (<div style={{maxWidth:520,margin:"0 auto 6px",textAlign:"left"}}>
          {showScout && (<ScoutSheet scout={scoutF} onClose={function(){setShowScout(false)}} />)}
          <MatchHeader tierName={"Season " + S.sNum + " Finals"} tierColor="#a855f7" roundLabel={fs.phase==="final"?"World Final":fs.phase==="semis"?"Semifinal":"Group Stage"}
            bestOf={FINALS_BO} rounds={["Group Stage","Semifinal","World Final"]} roundIdx={fs.phase==="final"?2:fs.phase==="semis"?1:0}
            onScout={function(){ setShowScout(true); }} onHelp={function(){ setHelp(true); }} />
          <PowerBar key={"f-"+fs.phase+"-"+fopp.id} scout={scoutF} onDone={onFR} oppSkill={fopp.skill||60} diff={fs.phase==="final"?5:fs.phase==="semis"?4:3} tr={S.player.tr} otr={fopp.tr||{}} playerName={S.pName} playerEmoji="⚔️" oppName={sh(fopp.name)} oppEmoji={fopp.emoji||"👤"} oppId={fopp.id} oppRank={fRank} fans={fansOf(S.player)} tierColor={fs.phase==="final"?"#b45309":"#8b5cf6"} roundLabel={fs.phase==="final"?"World Final":fs.phase==="semis"?"Semifinal":"Group Stage"}
          tierName={"Season "+S.sNum+" Finals"} youSub={"World #"+pRank} foeSub={talentLabel(fopp.skill)}
          isFinal={fs.phase==="final"} nextLabel={fs.phase==="semis"?"World Final":null} eliminated={fs.phase!=="groups"}
          bestOf={FINALS_BO} initialProgress={fs.match}
          onProgress={function(p){ setFS(function(prev){ return prev ? Object.assign({}, prev, { match: p }) : prev; }); }} /></div>);
        })()}
        {!fs.champ&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>{fs.houses.map(function(h,hi){return(<div key={hi} style={{background:"#ffffff",borderRadius:6,padding:5,border:"1px solid "+HC[hi]+"33"}}><div style={{fontSize:14,fontWeight:700,color:HC[hi],marginBottom:2}}>{HI[hi]} {HN[hi]}</div>{h.slice().sort(function(a,b){return(b.gP||0)-(a.gP||0)}).map(function(p){return(<div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"1px 3px",background:p.isP?"rgba(250,204,21,0.06)":"transparent",borderRadius:2,color:p.isP?"#b45309":"#334155"}}><span style={{maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.isP?"You":sh(p.name)}</span><span style={{fontWeight:600}}>{(p.gW||0)}W-{(p.gL||0)}L</span></div>);})}</div>);})}</div>)}
        {!fs.champ&&fs.semis.length>0&&(<div style={{background:"#ffffff",borderRadius:6,padding:6,marginBottom:6}}><div style={{fontSize:14,color:"#b45309",fontWeight:700,marginBottom:3}}>Semifinals</div>{fs.semis.map(function(m,i){return(<div key={i} style={{fontSize:14,color:"#334155",padding:"2px 0",display:"flex",justifyContent:"space-between"}}><span>{m.a.isP?"You":sh(m.a.name)} vs {m.b.isP?"You":sh(m.b.name)}</span><span style={{color:m.w?"#22c55e":"#64748b",fontWeight:600}}>{m.w?(m.w.isP?"You!":sh(m.w.name)):"—"}</span></div>);})}</div>)}
        {!pQ&&!fs.champ&&(<div style={{textAlign:"center",padding:10,background:"rgba(239,68,68,0.05)",borderRadius:8}}><div style={{color:"#ef4444",fontWeight:700,fontSize:14}}>You didn't qualify</div></div>)}
      </motion.div>
    );
  }

  return (<div style={W}><div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div></div>);
}
