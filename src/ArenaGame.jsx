import * as React from "react";
import { motion } from "framer-motion";
import { syncAchievements, saveGameToCloud, loadGameFromCloud } from "./firebase";
import { playTitle, playRankUp, isMuted, setMuted } from "./sounds";
import { W, CSS, EMO, TIERS, RN5, RN6, HN, HC, HI, TOTAL_EVENTS, screenAnim } from "./models/constants";
import { sh, bs, nW, pRankOf, getRanked, getARanked, trainCost } from "./models/formulas";
import { sSet, sGet } from "./engine/persistence";
import { mkSeason } from "./engine/seasonManager";
import PowerBar from "./components/PowerBar";
import Profile from "./components/Profile";
import RankSparkline from "./components/RankSparkline";
import Confetti from "./components/Confetti";
import BracketView from "./components/BracketView";
import HelpScreen from "./components/HelpScreen";

const { useState, useEffect, useRef } = React;


/* ═══ MAIN APP ═══ */
export default function Arena(props) {
  var userId = props.userId;
  var _scr = useState("loading"), scr = _scr[0], setScr = _scr[1];
  var _S = useState(null), S = _S[0], setS = _S[1];
  var _tab = useState("calendar"), tab = _tab[0], setTab = _tab[1];
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
    function fin(d) { if (done) return; done = true; if (d && d.player) { setS(d); setScr("hub"); } else setScr("title"); }
    if (userId) {
      loadGameFromCloud(userId).then(function(cloud) {
        if (cloud && cloud.player) { fin(cloud); sSet(cloud); }
        else fin(sGet());
      }).catch(function() { fin(sGet()); });
    } else {
      fin(sGet());
    }
  }, []);

  function save(s) { setS(s); sSet(s); if (userId) saveGameToCloud(userId, s).catch(function(e){ console.error("Cloud save failed:", e); }); }
  function exportSave() { if (!S) return; var b = new Blob([JSON.stringify(S)],{type:"application/json"}); var u = URL.createObjectURL(b); var a = document.createElement("a"); a.href = u; a.download = "arena-"+S.pName+"-s"+S.sNum+".json"; a.click(); URL.revokeObjectURL(u); }
  function importSave(e) { var f = e.target.files && e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(ev){ try { var d = JSON.parse(ev.target.result); if (d && d.player) { save(d); setScr("hub"); } } catch(err){} }; r.readAsText(f); }
  var _syncing = useState(false), syncing = _syncing[0], setSyncing = _syncing[1];
  var _syncMsg = useState(""), syncMsg = _syncMsg[0], setSyncMsg = _syncMsg[1];
  var _mutedState = useState(isMuted()), mutedState = _mutedState[0], setMutedState = _mutedState[1];
  function toggleMute() { var n = !mutedState; setMuted(n); setMutedState(n); }
  var _confetti = useState(false), confetti = _confetti[0], setConfetti = _confetti[1];
  var _showBracket = useState(false), showBracket = _showBracket[0], setShowBracket = _showBracket[1];
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
  function nextSeason() { if (!S) return; doSync(S); save(mkSeason(S.pName, (S.sNum||1)+1, S)); setScr("hub"); }
  function newGame() { if (confirm("Start a brand new game? Your current save will be erased.")) { sSet(null); if (userId) saveGameToCloud(userId, null).catch(function(){}); setS(null); setTS(null); setFS(null); setScr("title"); } }

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
      if (pRankOf(S) <= 64) {
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
    return avail;
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

  function onTR(won, myAvg, oppAvg) {
    if (!ts) return;
    var tier = TIERS[ts.tierIdx]; var rNames = tier.rounds === 6 ? RN6 : RN5;
    var bk = JSON.parse(JSON.stringify(ts.bracket)); bk._pts = tier.pts; bk._tier = ts.tierIdx;
    var m = bk[ts.round][ts.pending]; var opp = m.a.isP ? m.b : m.a;
    var winner = won ? (m.a.isP ? m.a : m.b) : (m.a.isP ? m.b : m.a);
    winner.tP = (winner.tP||0) + tier.pts[ts.round]; m.w = winner;
    var log = ts.log.concat([{ round: rNames[ts.round], opp: opp.name, won: won, pts: won ? tier.pts[ts.round] : 0 }]);
    var r = runBk(bk, ts.round, won, tier.rounds);
    setTS({ bracket: r.bracket, round: r.round, pending: r.pending, done: r.done, alive: won, log: log, tierIdx: ts.tierIdx });
    /* Record head-to-head vs this opponent */
    if (opp && opp.id) {
      var h2h = Object.assign({}, S.player.h2h || {});
      var entries = (h2h[opp.id] || []).concat([{
        s: S.sNum, tier: ts.tierIdx, round: ts.round, w: won,
        ma: myAvg != null ? Math.round(myAvg) : null,
        oa: oppAvg != null ? Math.round(oppAvg) : null,
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
    var newNpcs = S.npcs.map(function(n){
      var e = tally(n.id);
      var tr = Object.assign({s:0,g:0}, n.tr||{});
      var stats = ["r","p","f","s","g"];
      /* Only NPCs who competed in THIS bracket train. Others train from parallel sim below. */
      if (e > 0) {
        var trainR = e > 1000 ? 2 : e > 200 ? 1 : (Math.random() < 0.5 ? 1 : 0);
        for (var ti = 0; ti < trainR; ti++) { var st = stats[Math.floor(Math.random()*5)]; if ((tr[st]||0) < 20) tr[st] = (tr[st]||0) + 1; }
      }
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
    var newP = Object.assign({}, S.player, { sp: newSP, ap: (S.player.ap||0)+pp, tr: Object.assign({}, S.player.tr, { tp: (S.player.tr.tp||0) + Math.floor(pp/4) + 15 }), best: pb, res: newRes, timeline: newTimeline });
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
      if (numEvents === 0 || pti === ts.tierIdx) { if (pti === ts.tierIdx) parallelResults.push({ tier: pti, playerEvent: true, count: 1 }); continue; }
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
      var topWinner = null;
      var trainStats = ["r","p","f","s","g"];
      for (var ev = 0; ev < numEvents; ev++) {
        var poolStart = ev * pt.size;
        var pool = eligible.slice(poolStart, poolStart + pt.size);
        if (pool.length < 4) break;
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
        /* ── TRAINING for ALL participants based on how far they went ── */
        for (var tp2 = 0; tp2 < pool.length; tp2++) {
          var tNpc = newNpcs.find(function(n){return n.id===pool[tp2].id;});
          if (!tNpc) continue;
          var dr = deepRound[pool[tp2].id] || 0;
          var trainLevels = 0;
          if (dr >= pt.rounds) trainLevels = 2;       /* Winner: 2 levels */
          else if (dr >= pt.rounds - 1) trainLevels = 2; /* Finalist: 2 levels */
          else if (dr >= pt.rounds - 2) trainLevels = 1; /* Semifinalist: 1 level */
          else if (dr >= 1) trainLevels = 1;             /* Won at least 1 match: 1 level */
          else trainLevels = Math.random() < 0.3 ? 1 : 0; /* R1 loser: 30% chance */
          tNpc.tr = Object.assign({s:0,g:0}, tNpc.tr||{});
          for (var tl = 0; tl < trainLevels; tl++) {
            var tSt = trainStats[Math.floor(Math.random()*5)];
            if ((tNpc.tr[tSt]||0) < 20) tNpc.tr[tSt] = (tNpc.tr[tSt]||0)+1;
          }
        }
      }
      parallelResults.push({ tier: pti, count: numEvents, winner: topWinner });
    }
    /* Background training: NPCs who didn't play still have small chance */
    var trainStats2 = ["r","p","f","s","g"];
    for (var bgI = 0; bgI < newNpcs.length; bgI++) {
      if (playedIds[newNpcs[bgI].id]) continue;
      if (Math.random() < 0.12) {
        newNpcs[bgI].tr = Object.assign({s:0,g:0}, newNpcs[bgI].tr||{});
        var bgSt = trainStats2[Math.floor(Math.random()*5)];
        if ((newNpcs[bgI].tr[bgSt]||0) < 20) newNpcs[bgI].tr[bgSt] = (newNpcs[bgI].tr[bgSt]||0)+1;
      }
    }
    /* Calculate money earned */
    var moneyEarned = 0;
    for (var mri = 0; mri <= pRound; mri++) { moneyEarned += (tier.money || [])[mri] || 0; }
    var hist = (S.tHist||[]).concat([{ num: (S.tHist||[]).length + 1, season: S.sNum, tier: ts.tierIdx, tierName: tier.name, pPts: pp, defending: defending, netChange: netChange, pRound: pRound, roundName: rNames[pRound], money: moneyEarned, winner: champW ? { name: champW.isP ? S.pName : champW.name, emoji: champW.emoji||"👑", isP: champW.isP } : null }]);
    var cal = S.cal.slice(); cal[S.calIdx].done = true; cal[S.calIdx].tier = ts.tierIdx; cal[S.calIdx].result = { pPts: pp, defending: defending, net: netChange, pRound: pRound, parallel: parallelResults };
    newP.money = (newP.money || 0) + moneyEarned;
    newP.seasonMoney = (newP.seasonMoney || 0) + moneyEarned;
    /* Record post-event rank for sparkline */
    var newRank = pRankOf(Object.assign({}, S, { player: newP, npcs: newNpcs }));
    newP.rankHist = (newP.rankHist || []).concat([newRank]).slice(-40);
    save(Object.assign({}, S, { player: newP, npcs: newNpcs, tHist: hist, cal: cal, calIdx: S.calIdx + 1 }));
    setScr("hub"); setTS(null);
  }

  /* ─── Finals ─── */
  function startFinals() {
    if (!S) return;
    var ranked = getRanked(S);
    var t16 = ranked.slice(0,16).map(function(p){return Object.assign({},p,{gP:0,gW:0,gL:0});});
    var houses = [[],[],[],[]];
    for (var i = 0; i < t16.length; i++) { var row = Math.floor(i/4); var col = row%2===0?i%4:3-i%4; houses[col].push(t16[i]); }
    var gm = [];
    for (var hi = 0; hi < 4; hi++) for (var a = 0; a < houses[hi].length; a++) for (var b = a+1; b < houses[hi].length; b++) gm.push({hi:hi,a:houses[hi][a],b:houses[hi][b],w:null});
    var st = {houses:houses,gm:gm,gi:0,phase:"groups",semis:[],final:null,champ:null,pending:null,log:[]};
    advF(st); setFS(st); setScr("finals");
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
  function onFR(won) {
    if (!fs) return;
    var st = JSON.parse(JSON.stringify(fs)); var m, opp, winner, loser;
    if (st.phase==="groups") { m=st.gm[st.pending]; opp=m.a.isP?m.b:m.a; winner=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); loser=winner.id===m.a.id?m.b:m.a; m.w=winner; var h=st.houses[m.hi]; for(var x=0;x<h.length;x++){if(h[x].id===winner.id){h[x].gP+=3;h[x].gW++;}if(h[x].id===loser.id){h[x].gL++;}} st.gi++; }
    else if (st.phase==="semis") { m=st.semis[st.pending]; opp=m.a.isP?m.b:m.a; m.w=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); }
    else if (st.phase==="final") { m=st.final; opp=m.a.isP?m.b:m.a; winner=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); m.w=winner; st.champ=winner;
      if(S){ var pb=Object.assign({},S.player.best||{}); pb.finals=(pb.finals||0)+1; save(Object.assign({},S,{player:Object.assign({},S.player,{best:pb}),champs:(S.champs||[]).concat([{name:winner.isP?S.pName:winner.name,s:S.sNum,isP:winner.isP}])})); }
    }
    st.log=st.log.concat([{phase:st.phase,opp:(opp&&opp.name)||"?",won:won}]); st.pending=null; advF(st); setFS(st);
  }

  /* ═══ RENDER ═══ */
  if (scr === "loading") return (<motion.div key="loading" {...screenAnim} style={Object.assign({},W,{display:"flex",alignItems:"center",justifyContent:"center"})}><style dangerouslySetInnerHTML={{__html:CSS}} /><span style={{color:"#b45309",fontSize:16}}>⚔️ Loading Arena Tour...</span></motion.div>);

  if (scr === "title") return (
    <motion.div key="title" {...screenAnim} style={Object.assign({},W,{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"})}>
      <style dangerouslySetInnerHTML={{__html:CSS}} />
      <div style={{fontSize:48}}>⚔️</div>
      <h1 style={{fontSize:22,fontWeight:900,letterSpacing:3,background:"linear-gradient(135deg,#facc15,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"8px 0 4px"}}>ARENA TOUR</h1>
      <p style={{color:"#64748b",fontSize:13,margin:"0 0 16px"}}>1000 Warriors • 5 Tournament Tiers • Grand Slams • Season Finals</p>
      <div style={{background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:12,padding:18,maxWidth:320,width:"100%"}}>
        <div style={{fontSize:14,color:"#475569",fontWeight:700,letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Enter Your Warrior Name</div>
        <input value={inp} onChange={function(e){setInp(e.target.value)}} placeholder="e.g. Novak, Rafa, Serena..." onKeyDown={function(e){if(e.key==="Enter"&&inp.trim())newSeason()}}
          style={{width:"100%",padding:10,borderRadius:8,border:"1px solid rgba(250,204,21,0.3)",background:"#ffffff",color:"#b45309",fontSize:16,fontWeight:700,outline:"none",boxSizing:"border-box",textAlign:"center",marginBottom:8}} />
        <button onClick={function(){if(inp.trim())newSeason();}} disabled={!inp.trim()} style={Object.assign({},bs("linear-gradient(135deg,#facc15,#f59e0b)","#000"),{width:"100%",marginBottom:6,opacity:inp.trim()?1:0.4})}>Begin Season 1</button>
        <button onClick={function(){fileRef.current&&fileRef.current.click()}} style={Object.assign({},bs("#f1f5f9","#475569"),{width:"100%",fontSize:13,border:"1px solid #e5e7eb"})}>📂 Load Save</button>
        <input ref={fileRef} type="file" accept=".json" onChange={importSave} style={{display:"none"}} />
      </div>
      <div style={{marginTop:14,maxWidth:320,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(129,140,248,0.1)",borderRadius:10,padding:10,textAlign:"left"}}>
        <div style={{color:"#4f46e5",fontSize:13,fontWeight:700,letterSpacing:1,marginBottom:4}}>ATP-STYLE SEASON</div>
        <div style={{color:"#4338ca",fontSize:14,lineHeight:1.6}}>20-event season: <b>4 blocks</b> of 4 weekly tournaments + <b>Grand Slam</b>. Climb tiers from Futures → Masters as your rank improves. <b>Top 16</b> contest Season Finals. All 1000 players compete every week.</div>
      </div>
    </motion.div>
  );

  if (!S) return (<div style={W}><p>Loading...</p></div>);

  var pRank = pRankOf(S);
  var ranked = getRanked(S);
  var seasonDone = S.calIdx >= S.cal.length;
  var curEvent = !seasonDone ? S.cal[S.calIdx] : null;
  var avTiers = availableTiers(S);

  /* ─── HUB ─── */
  if (scr === "hub") {
    var lastDone = S.calIdx > 0 ? S.cal[S.calIdx - 1] : null;
    return (
      <motion.div key="hub" {...screenAnim} style={W}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        {confetti && (<Confetti />)}
        {prof && (<Profile player={prof.p} rank={prof.rank} playerName={S.pName} h2h={!prof.p.isP && S.player.h2h ? (S.player.h2h[prof.p.id] || []) : null} timeline={prof.p.isP ? (S.player.timeline || []) : null} onClose={function(){setProf(null)}} />)}
        {showHelp && (<HelpScreen onClose={function(){setHelp(false)}} />)}

        {/* ── Status Bar (tap to open your profile) ── */}
        <div onClick={function(){ setProf({ p: Object.assign({}, S.player, { name: S.pName, emoji: "⚔️" }), rank: pRank }); }} style={{padding:"10px 12px",background:"#ffffff",borderRadius:10,marginBottom:6,border:"1px solid #f1f5f9",cursor:"pointer"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <span style={{fontSize:17,color:"#b45309",fontWeight:800,letterSpacing:0.3}}>{S.pName}<span style={{ color: "#94a3b8", fontSize: 11, fontWeight: 500, marginLeft: 6 }}>view profile ›</span></span>
            <span style={{fontSize:20,color:"#b45309",fontWeight:900,letterSpacing:0.5}}>#{pRank}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:"#64748b",fontWeight:600}}>S{S.sNum} • Wk {Math.min(S.calIdx+1,TOTAL_EVENTS)}/{TOTAL_EVENTS}</span>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:14,color:"#334155",fontWeight:700}}>{(S.player.sp||0).toLocaleString()}<span style={{color:"#64748b",fontWeight:400,fontSize:12,marginLeft:2}}>pts</span></span>
              <span style={{fontSize:14,color:"#22c55e",fontWeight:800}}>💰{(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(S.player.money||0)}</span>
            </div>
          </div>
        </div>
        {/* Season progress mini-bar */}
        <div style={{display:"flex",gap:1,marginBottom:6,height:4}}>
          {S.cal.map(function(ev,i){return (<div key={i} style={{flex:1,borderRadius:2,background:ev.done?(ev.type==="gs"?"#b45309":"#22c55e"):i===S.calIdx?"#4f46e5":"#f8fafc"}}/>);})}
        </div>

        {/* Rank trajectory sparkline */}
        <RankSparkline history={S.player.rankHist || []} />

        {/* ── Tier Picker (compact horizontal pills) ── */}
        {!seasonDone && picking && (
          <div style={{background:"#ffffff",borderRadius:10,padding:10,border:"1px solid rgba(129,140,248,0.2)",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:14,fontWeight:800,color:"#4f46e5",letterSpacing:0.5}}>CHOOSE TIER <span style={{color:"#64748b",fontWeight:400,marginLeft:4}}>#{pRank}</span></span>
              <button onClick={function(){setPicking(false)}} style={{background:"#f1f5f9",border:"1px solid #e5e7eb",color:"#475569",fontSize:16,cursor:"pointer",width:28,height:28,borderRadius:6,lineHeight:1,padding:0}}>✕</button>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:5}}>
              {[0,1,2,3,4].map(function(ti){
                var t = TIERS[ti]; var canEnter = avTiers.indexOf(ti) >= 0;
                return (
                  <button key={ti} onClick={function(){if(canEnter){setPicking(false);startTourney(ti);}}} disabled={!canEnter}
                    style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"8px 2px",borderRadius:8,border:"2px solid "+(canEnter?t.col:"#f8fafc"),background:canEnter?"#ffffff":"transparent",cursor:canEnter?"pointer":"default",opacity:canEnter?1:0.3,minHeight:64}}>
                    <span style={{fontSize:14,color:t.col,fontWeight:900,letterSpacing:0.5}}>{t.short}</span>
                    <span style={{fontSize:12,color:"#0f172a",fontWeight:700,marginTop:2}}>{t.pts[t.pts.length-1]}p</span>
                    <span style={{fontSize:11,color:"#22c55e",fontWeight:600,marginTop:1}}>${(t.money[t.money.length-1]/1000).toFixed(0)}K</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Season Done ── */}
        {seasonDone && (
          <div style={{background:"#ffffff",borderRadius:8,padding:10,border:"1px solid rgba(250,204,21,0.1)",marginBottom:6,textAlign:"center"}}>
            <button onClick={pRank<=16?startFinals:nextSeason} style={Object.assign({},bs(pRank<=16?"linear-gradient(135deg,#f59e0b,#ef4444,#a855f7)":"linear-gradient(135deg,#cbd5e1,#94a3b8)",pRank<=16?"#ffffff":"#475569"),{width:"100%",animation:pRank<=16?"pulse 1.5s ease infinite":"none"})}>
              {pRank <= 16 ? "👑 Season Finals" : "🔄 Season " + ((S.sNum||1)+1)}
            </button>
          </div>
        )}

        {/* ── Train button (primary) ── */}
        {!picking && (
          <button onClick={function(){setScr("training")}} style={{width:"100%",padding:"12px 16px",borderRadius:8,border:"1px solid rgba(129,140,248,0.3)",background:"rgba(99,102,241,0.12)",color:"#4f46e5",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:6,letterSpacing:0.5}}>🏋️ TRAINING <span style={{color:"#b45309",marginLeft:6}}>{S.player.tr.tp||0} TP</span></button>
        )}
        <input ref={fileRef} type="file" accept=".json" onChange={importSave} style={{display:"none"}} />
        {syncMsg && (<div style={{fontSize:13,color:syncMsg==="Synced!"?"#22c55e":"#ef4444",textAlign:"center",marginBottom:4,fontWeight:700}}>{syncMsg}</div>)}

        {/* ── Last Week ── */}
        {lastDone && lastDone.result && lastDone.result.parallel && lastDone.result.parallel.length > 0 && (
          <div style={{background:"#ffffff",borderRadius:6,padding:6,border:"1px solid #f8fafc",marginBottom:6}}>
            <div style={{fontSize:13,color:"#64748b",fontWeight:700,marginBottom:3}}>📰 LAST WEEK</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {lastDone.result.parallel.map(function(pr, i){
                if (!pr) return null; var t = TIERS[pr.tier];
                return (<span key={i} style={{fontSize:13,padding:"2px 5px",borderRadius:3,background:pr.playerEvent?"rgba(250,204,21,0.08)":"#ffffff",color:pr.playerEvent?"#b45309":t.col}}>{t.short}{pr.count>1?"×"+pr.count:""}: {pr.playerEvent?"You "+(lastDone.result.pPts||0)+"p":(pr.winner&&pr.winner.name)?sh(pr.winner.name):"—"}</span>);
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{display:"flex",gap:2,marginBottom:6}}>
          {["calendar","rankings","history","settings"].map(function(t){
            var label = t==="calendar"?"📅 Calendar":t==="rankings"?"🏆 Rankings":t==="history"?"📊 Results":"⚙️";
            return (<button key={t} onClick={function(){setTab(t)}} style={{flex:t==="settings"?0.5:1,padding:"8px 4px",borderRadius:6,border:"none",cursor:"pointer",background:tab===t?"rgba(250,204,21,0.12)":"#f8fafc",color:tab===t?"#b45309":"#64748b",fontSize:13,fontWeight:700,letterSpacing:0.5}}>{label}</button>);
          })}
        </div>

        {tab === "calendar" && (
          <div style={{background:"#ffffff",borderRadius:8,padding:6,border:"1px solid #f8fafc"}}>
            {!seasonDone && curEvent && !picking && (
              <div style={{fontSize:13,color:"#b45309",fontWeight:700,textAlign:"center",marginBottom:6,letterSpacing:0.5}}>
                {curEvent.type==="gs"
                  ? (pRank<=64 ? "👑 TAP THE HIGHLIGHTED CELL TO ENTER GRAND SLAM" : "👑 TAP TO SKIP (NOT QUALIFIED, #"+pRank+")")
                  : "▶ TAP THE HIGHLIGHTED CELL TO PLAY WEEK "+curEvent.block+"."+curEvent.week}
              </div>
            )}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5, 1fr)",gap:4}}>
              {S.cal.map(function(ev, idx){
                var isCur = idx === S.calIdx && !seasonDone;
                var isGS = ev.type === "gs";
                var tier = ev.tier != null ? TIERS[ev.tier] : null;
                var def = (S.player.def && S.player.def[idx]) || 0;
                var net = ev.result ? ev.result.net : null;
                var bg = isCur ? "rgba(250,204,21,0.22)" : ev.done ? (isGS ? "rgba(250,204,21,0.06)" : "rgba(34,197,94,0.06)") : "#f8fafc";
                var bord = isCur ? "2px solid #facc15" : isGS ? "1px solid rgba(250,204,21,0.3)" : ev.done ? "1px solid rgba(34,197,94,0.12)" : "1px solid #f8fafc";
                return (
                  <div key={idx}
                    onClick={isCur ? playCurrent : undefined}
                    style={{background:bg,border:bord,borderRadius:6,padding:isCur?"8px 2px":"5px 2px",textAlign:"center",minWidth:0,cursor:isCur?"pointer":"default",animation:isCur?"pulse 1.5s ease infinite":"none",boxShadow:isCur?"0 0 12px rgba(250,204,21,0.35)":"none"}}>
                    <div style={{fontSize:isCur?13:12,fontWeight:800,color:isGS?"#b45309":isCur?"#b45309":ev.done?(tier?tier.col:"#475569"):"#94a3b8",lineHeight:1.2}}>
                      {isCur ? (isGS ? (pRank<=64 ? "👑▶" : "👑⏭") : "▶") : ev.done && tier ? tier.short : isGS ? "👑" : "—"}
                    </div>
                    {isCur ? (
                      <div style={{fontSize:13,color:"#0f172a",fontWeight:700,marginTop:2}}>
                        {isGS ? "GS "+ev.gsNum : "Wk "+ev.block+"."+ev.week}
                        {def>0&&(<div style={{fontSize:10,color:"#f59e0b",marginTop:1}}>def:{def}</div>)}
                      </div>
                    ) : ev.done && ev.result ? (
                      <div style={{fontSize:14,color:"#0f172a",fontWeight:600,lineHeight:1.1,marginTop:1}}>
                        {ev.result.pPts}
                        {net!=null&&net!==0&&(<span style={{color:net>0?"#22c55e":"#ef4444",fontWeight:700,marginLeft:2,fontSize:13}}>{net>0?"+":""}{net}</span>)}
                      </div>
                    ) : def > 0 ? (
                      <div style={{fontSize:13,color:"#f59e0b",marginTop:1}}>d:{def}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div style={{display:"flex",justifyContent:"space-between",marginTop:8,fontSize:13,color:"#64748b"}}>
              <span>{S.calIdx}/{TOTAL_EVENTS} played</span>
              <span>{seasonDone?"→ Finals":"Next: "+(S.cal[S.calIdx]?S.cal[S.calIdx].type==="gs"?"GS "+S.cal[S.calIdx].gsNum:"Wk "+(S.cal[S.calIdx].block||"")+"."+((S.cal[S.calIdx].week||"")):"")}</span>
            </div>
          </div>
        )}

        {tab === "rankings" && (function(){
          var pIdx = -1; for (var pi = 0; pi < ranked.length; pi++) { if (ranked[pi].isP) { pIdx = pi; break; } }
          var showTop = 50;
          var nearStart = Math.max(showTop, pIdx - 3);
          var nearEnd = Math.min(ranked.length - 1, pIdx + 7);
          var needNear = pIdx >= showTop;
          function renderRow(p, i) {
            var t = p.tr||{};
            return (
              <div key={p.id+"-"+i} onClick={function(){setProf({p:p,rank:i+1})}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 5px",background:p.isP?"rgba(250,204,21,0.08)":i%2===0?"#f8fafc":"transparent",borderRadius:3,marginBottom:1,cursor:"pointer",borderLeft:i<16?"2px solid "+(i<4?"#b45309":i<8?"#22c55e":i<12?"#3b82f6":"#475569"):"2px solid transparent"}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:14,color:p.isP?"#b45309":"#0f172a",fontWeight:p.isP?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    <span style={{color:i<3?["#b45309","#475569","#cd7f32"][i]:"#94a3b8",fontWeight:700,marginRight:3,width:26,display:"inline-block",textAlign:"right"}}>#{i+1}</span>
                    {p.isP?S.pName+" ⭐":(p.emoji||"")+" "+sh(p.name)}
                  </div>
                  <div style={{fontSize:13,color:"#94a3b8",marginTop:1}}>
                    {p.isP?"":"Talent:"}{p.isP?"":((p.skill||0)>80?(<span style={{color:"#ef4444"}}>Elite</span>):(p.skill||0)>60?(<span style={{color:"#f59e0b"}}>Strong</span>):(p.skill||0)>40?(<span style={{color:"#0891b2"}}>Avg</span>):(<span style={{color:"#475569"}}>Dev</span>))} <span style={{color:"#0891b2"}}>⚡{t.r||0}</span> <span style={{color:"#db2777"}}>💪{t.p||0}</span> <span style={{color:"#16a34a"}}>🎯{t.f||0}</span> <span style={{color:"#ea580c"}}>🫀{t.s||0}</span> <span style={{color:"#7c3aed"}}>🛡{t.g||0}</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:14,fontWeight:600,color:p.isP?"#b45309":"#334155"}}>{(p.sp||0).toLocaleString()}</div>
                  <div style={{fontSize:13,color:"#94a3b8"}}>AT:{(p.ap||0).toLocaleString()}</div>
                </div>
              </div>
            );
          }
          return (
            <div style={{background:"#ffffff",borderRadius:6,padding:4,border:"1px solid #f8fafc",maxHeight:380,overflowY:"auto"}}>
              {ranked.slice(0, showTop).map(function(p, i){ return renderRow(p, i); })}
              {needNear && (
                <div>
                  <div style={{textAlign:"center",padding:"4px",color:"#94a3b8",fontSize:13}}>··· {nearStart - showTop} more ···</div>
                  {ranked.slice(nearStart, nearEnd + 1).map(function(p, i){ return renderRow(p, nearStart + i); })}
                </div>
              )}
              <div style={{textAlign:"center",fontSize:13,color:"#94a3b8",padding:3}}>Tap any player for profile • {ranked.length} total</div>
            </div>
          );
        })()}

        {tab === "history" && (
          <div style={{background:"#ffffff",borderRadius:8,padding:6,border:"1px solid #f8fafc",maxHeight:380,overflowY:"auto"}}>
            {(S.tHist||[]).length===0?(<div style={{color:"#94a3b8",fontSize:13,padding:6}}>No events yet.</div>):
            (S.tHist||[]).slice().reverse().map(function(t,i){
              var tier = TIERS[t.tier]||TIERS[0];
              return (
                <div key={i} style={{padding:"5px 7px",background:i%2?"transparent":"#f8fafc",borderRadius:4,marginBottom:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:14}}>
                    <span><span style={{color:tier.col,fontWeight:700}}>{tier.short}</span><span style={{color:"#64748b",marginLeft:4}}>S{t.season}</span></span>
                    <div style={{textAlign:"right"}}>
                      <span style={{color:"#0f172a",fontWeight:600}}>{(t.pPts||0).toLocaleString()}</span>
                      {t.netChange != null && (<span style={{color:t.netChange>0?"#22c55e":t.netChange<0?"#ef4444":"#64748b",fontWeight:700,marginLeft:4,fontSize:13}}>{t.netChange>0?"+"+t.netChange:t.netChange===0?"±0":t.netChange}</span>)}
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#64748b",marginTop:1}}>
                    <span>Reached: <span style={{color:"#475569"}}>{t.roundName||"R1"}</span>{t.defending>0 && (<span style={{color:"#f59e0b",marginLeft:4}}>(def:{t.defending})</span>)}{t.money>0&&(<span style={{color:"#22c55e",marginLeft:4}}>💰{(t.money/1000).toFixed(0)}K</span>)}</span>
                    {t.winner&&(<span style={{color:t.winner.isP?"#b45309":"#475569"}}>🏆 {t.winner.isP?"YOU":sh(t.winner.name)}</span>)}
                  </div>
                </div>
              );
            })}
            {(S.champs||[]).length>0&&(<div style={{marginTop:4,borderTop:"1px solid #f1f5f9",paddingTop:4}}><div style={{fontSize:13,color:"#b45309",fontWeight:700,marginBottom:2}}>👑 Season Champions</div>{S.champs.map(function(c,i){return(<div key={i} style={{fontSize:13,color:c.isP?"#b45309":"#475569"}}>S{c.s}: {c.isP?"🌟 YOU":c.name}</div>);})}</div>)}
          </div>
        )}

        {tab === "settings" && (function(){
          var rowStyle = {display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 14px",borderRadius:10,marginBottom:8,background:"#f8fafc",border:"1px solid #f1f5f9",width:"100%",cursor:"pointer",textAlign:"left"};
          var labelStyle = {fontSize:15,fontWeight:700,color:"#0f172a"};
          var hintStyle = {fontSize:12,color:"#64748b",marginTop:2};
          return (
            <div style={{background:"#ffffff",borderRadius:8,padding:10,border:"1px solid #f8fafc"}}>
              <button onClick={function(){setHelp(true)}} style={Object.assign({},rowStyle,{border:"1px solid rgba(250,204,21,0.2)"})}>
                <div><div style={labelStyle}>❓ How to Play</div><div style={hintStyle}>Game rules & strike mechanic</div></div>
                <span style={{color:"#b45309",fontSize:18}}>›</span>
              </button>
              <button onClick={toggleMute} style={rowStyle}>
                <div><div style={labelStyle}>{mutedState?"🔇":"🔊"} Sound Effects</div><div style={hintStyle}>Strike hits, victory & defeat tones</div></div>
                <span style={{color:mutedState?"#ef4444":"#22c55e",fontSize:14,fontWeight:800,letterSpacing:0.5}}>{mutedState?"OFF":"ON"}</span>
              </button>
              {userId && (
                <button onClick={function(){doSync(S)}} disabled={syncing} style={Object.assign({},rowStyle,{border:"1px solid rgba(34,197,94,0.2)",opacity:syncing?0.6:1})}>
                  <div><div style={labelStyle}>☁️ Sync to Cloud</div><div style={hintStyle}>Back up achievements to leaderboard</div></div>
                  <span style={{color:"#22c55e",fontSize:14,fontWeight:700}}>{syncing?"...":"Sync"}</span>
                </button>
              )}
              <button onClick={exportSave} style={rowStyle}>
                <div><div style={labelStyle}>💾 Export Save</div><div style={hintStyle}>Download your game as JSON</div></div>
                <span style={{color:"#475569",fontSize:18}}>›</span>
              </button>
              <button onClick={function(){fileRef.current&&fileRef.current.click()}} style={rowStyle}>
                <div><div style={labelStyle}>📂 Import Save</div><div style={hintStyle}>Load a previously exported save</div></div>
                <span style={{color:"#475569",fontSize:18}}>›</span>
              </button>
              <button onClick={newGame} style={Object.assign({},rowStyle,{border:"1px solid rgba(239,68,68,0.25)",background:"rgba(239,68,68,0.05)",marginTop:16})}>
                <div><div style={Object.assign({},labelStyle,{color:"#ef4444"})}>🔄 Restart Game</div><div style={hintStyle}>Erase current save and start over</div></div>
                <span style={{color:"#ef4444",fontSize:18}}>›</span>
              </button>
            </div>
          );
        })()}
      </motion.div>
    );
  }

  /* ─── TRAINING ─── */
  if (scr === "training") return (
    <motion.div key="training" {...screenAnim} style={W}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:15,color:"#4f46e5",fontWeight:800}}>🏋️ TRAINING CAMP</span>
        <button onClick={function(){setScr("hub")}} style={{background:"#f1f5f9",border:"1px solid #e5e7eb",color:"#475569",padding:"5px 10px",borderRadius:6,fontSize:14,cursor:"pointer"}}>← Hub</button>
      </div>
      <div style={{textAlign:"center",marginBottom:14}}><span style={{fontSize:22,color:"#b45309",fontWeight:900}}>{S.player.tr.tp||0}</span><span style={{color:"#475569",fontSize:14,marginLeft:6}}>TP</span></div>
      {[{k:"r",l:"Reflexes",i:"⚡",d:"Slows bar speed (relative)",c:"#22d3ee"},{k:"p",l:"Power",i:"💪",d:"Widens sweet spot (relative)",c:"#f472b6"},{k:"f",l:"Focus",i:"🎯",d:"Strike score bonus (relative)",c:"#4ade80"},{k:"s",l:"Stamina",i:"🫀",d:"Less bar acceleration between strikes",c:"#fb923c"},{k:"g",l:"Grit",i:"🛡️",d:"Raises minimum score on bad hits",c:"#7c3aed"}].map(function(st){
        var lv=S.player.tr[st.k]||0,cost=trainCost(lv),can=(S.player.tr.tp||0)>=cost&&lv<20;
        return (
          <div key={st.k} style={{marginBottom:8,padding:10,background:"#f8fafc",borderRadius:8,border:"1px solid "+(can?st.c+"33":"#f8fafc")}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div><span style={{color:st.c,fontWeight:700,fontSize:13}}>{st.i} {st.l}</span><span style={{color:"#64748b",fontSize:14,marginLeft:6}}>Lv.{lv}/20</span></div>
              <button onClick={function(){doTrain(st.k)}} disabled={!can} style={{background:can?st.c:"#f8fafc",color:can?"#000":"#94a3b8",border:"none",padding:"4px 10px",borderRadius:5,fontSize:13,fontWeight:700,cursor:can?"pointer":"default",opacity:can?1:0.5}}>{lv>=20?"MAX":cost+" TP"}</button>
            </div>
            <div style={{display:"flex",gap:1,marginBottom:3}}>{Array.from({length:20}).map(function(_,i){return(<div key={i} style={{flex:1,height:5,borderRadius:2,background:i<lv?st.c:"#f1f5f9"}}/>);})}</div>
            <div style={{fontSize:13,color:"#64748b"}}>{st.d}</div>
          </div>
        );
      })}
      {(function(){
        var tr = S.player.tr;
        var total = (tr.r||0)+(tr.p||0)+(tr.f||0)+(tr.s||0)+(tr.g||0);
        var maxed = total >= 100;
        return (
          <div style={{background:"rgba(99,102,241,0.05)",borderRadius:6,padding:8,border:"1px solid rgba(129,140,248,0.08)",marginTop:4}}>
            <div style={{fontSize:13,color:"#4f46e5",fontWeight:700,marginBottom:3}}>TRAINING GUIDE</div>
            <div style={{fontSize:13,color:"#475569",lineHeight:1.5}}>
              All stats are <span style={{color:"#b45309"}}>relative</span> — only the gap vs your opponent matters. If you both have ⚡10, it cancels out.
            </div>
            {maxed ? (
              <div style={{marginTop:6,padding:6,background:"rgba(250,204,21,0.06)",borderRadius:4,border:"1px solid rgba(250,204,21,0.1)"}}>
                <div style={{fontSize:14,color:"#b45309",fontWeight:700}}>🏅 TRAINING COMPLETE</div>
                <div style={{fontSize:13,color:"#475569",lineHeight:1.5,marginTop:2}}>
                  All stats maxed! But top NPCs also train heavily — elite opponents with skill 85+ and 15+ training still score <span style={{color:"#ef4444"}}>89-99</span> against you. Masters and Grand Slam difficulty (speed 4.5-6.5×, zone 3-6px) ensures you still need <span style={{color:"#22c55e"}}>near-perfect timing</span> to beat the best. Your advantage is the gap closes — not that you become invincible.
                </div>
              </div>
            ) : (
              <div style={{fontSize:13,color:"#94a3b8",marginTop:3}}>
                Total: {total}/100 • NPCs gain 0-2 levels per tournament • Tournament winners gain 1 level
              </div>
            )}
          </div>
        );
      })()}
    </motion.div>
  );

  /* ─── TOURNAMENT ─── */
  if (scr === "tourney" && ts) {
    var tier = TIERS[ts.tierIdx]; var rNames = tier.rounds === 6 ? RN6 : RN5;
    var pm = ts.pending != null && ts.bracket[ts.round] ? ts.bracket[ts.round][ts.pending] : null;
    var opp = pm ? (pm.a.isP ? pm.b : pm.a) : null;
    var oppRank = 0; if (opp) { for (var oi = 0; oi < ranked.length; oi++) if (ranked[oi].id===opp.id){oppRank=oi+1;break;} }
    return (
      <motion.div key="tourney" {...screenAnim} style={W}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        {confetti && (<Confetti />)}
        {prof && (<Profile player={prof.p} rank={prof.rank} playerName={S.pName} h2h={!prof.p.isP && S.player.h2h ? (S.player.h2h[prof.p.id] || []) : null} timeline={prof.p.isP ? (S.player.timeline || []) : null} onClose={function(){setProf(null)}} />)}
        {showHelp && (<HelpScreen onClose={function(){setHelp(false)}} />)}
        {showBracket && (<BracketView ts={ts} playerName={S.pName} onClose={function(){setShowBracket(false)}} />)}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div><span style={{fontSize:13,color:tier.col,fontWeight:700}}>{tier.name}</span><span style={{color:"#94a3b8",margin:"0 4px"}}>•</span><span style={{fontSize:14,color:"#475569"}}>{rNames[Math.min(ts.round,tier.rounds-1)]}</span></div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={function(){setShowBracket(true)}} style={{background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.3)",color:"#4f46e5",fontSize:12,padding:"3px 8px",borderRadius:4,cursor:"pointer",fontWeight:700,letterSpacing:0.3}}>🌐 Bracket</button>
            <button onClick={function(){setHelp(true)}} style={{background:"none",border:"1px solid rgba(250,204,21,0.15)",color:"#b45309",fontSize:13,padding:"2px 6px",borderRadius:4,cursor:"pointer",fontWeight:700}}>?</button>
            <span style={{fontSize:13,color:"#475569"}}>{S.pName} <span style={{color:"#b45309"}}>#{pRank}</span></span>
          </div>
        </div>
        <div style={{display:"flex",gap:2,marginBottom:6}}>
          {rNames.map(function(_,i){return(<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<ts.round?tier.col:i===ts.round?tier.col+"66":"#f8fafc"}}/>);})}
        </div>

        {pm && ts.alive && opp && (
          <div style={{background:"#ffffff",border:"1px solid "+tier.col+"22",borderRadius:10,padding:10,marginBottom:6,animation:"glow 2s ease infinite"}}>
            <div style={{textAlign:"center",marginBottom:4}}>
              <div style={{fontSize:16,fontWeight:900,color:tier.col}}>⚔️ {rNames[ts.round]}</div>
              <div style={{fontSize:13,color:"#475569",marginTop:2}}><span style={{color:"#b45309"}}>{S.pName}</span> vs <span style={{color:"#0f172a",cursor:"pointer",textDecoration:"underline"}} onClick={function(){setProf({p:opp,rank:oppRank})}}>{opp.emoji} {opp.name}</span></div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:3,fontSize:13}}>
                <span style={{color:"#64748b"}}>Rank: <span style={{color:"#0f172a"}}>#{oppRank}</span></span>
                <span style={{color:"#64748b"}}>Talent: <span style={{color:(opp.skill||0)>80?"#ef4444":(opp.skill||0)>60?"#f59e0b":(opp.skill||0)>40?"#22d3ee":"#475569"}}>{(opp.skill||0)>80?"Elite":(opp.skill||0)>60?"Strong":(opp.skill||0)>40?"Average":"Developing"}</span></span>
                <span style={{color:"#64748b"}}>Pts: <span style={{color:"#0f172a"}}>{(opp.sp||0).toLocaleString()}</span></span>
              </div>
              {(function(){var ot=opp.tr||{},pt=S.player.tr||{}; return (
                <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:3,fontSize:13,padding:"3px 6px",background:"#ffffff",borderRadius:4}}>
                  {[{k:"r",i:"⚡",c:"#22d3ee"},{k:"p",i:"💪",c:"#f472b6"},{k:"f",i:"🎯",c:"#4ade80"},{k:"s",i:"🫀",c:"#fb923c"},{k:"g",i:"🛡",c:"#7c3aed"}].map(function(s){var d=(pt[s.k]||0)-(ot[s.k]||0);return(<span key={s.k} style={{color:s.c}}>{s.i}<span style={{color:"#b45309"}}>{pt[s.k]||0}</span><span style={{color:"#94a3b8"}}>v</span><span style={{color:"#0f172a"}}>{ot[s.k]||0}</span>{d!==0&&(<span style={{color:d>0?"#22c55e":"#ef4444",marginLeft:1}}>{d>0?"+"+d:d}</span>)}</span>);})}
                </div>
              );})()}
              {(function(){
                var d = ts.round + [0,1,2,3,4,3][ts.tierIdx];
                var barSpd = Math.max(0.8, 2.4 + d * 0.4).toFixed(1);
                var sweet = Math.max(3, 12 - d * 1.5);
                var diffLabel = d <= 1 ? "Easy" : d <= 3 ? "Medium" : d <= 5 ? "Hard" : d <= 7 ? "Very Hard" : "Extreme";
                var diffCol = d <= 1 ? "#4ade80" : d <= 3 ? "#22d3ee" : d <= 5 ? "#f59e0b" : d <= 7 ? "#ef4444" : "#dc2626";
                return (
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:3,fontSize:13,color:"#94a3b8"}}>
                    <span>Difficulty: <span style={{color:diffCol,fontWeight:700}}>{diffLabel}</span></span>
                    <span>Bar: {barSpd}×</span>
                    <span>Zone: {sweet}px</span>
                  </div>
                );
              })()}
            </div>
            <PowerBar key={"t-"+ts.round} onDone={onTR} oppSkill={opp.skill||50} diff={ts.round + [0,1,2,3,4,3][ts.tierIdx]} tr={S.player.tr} otr={opp.tr||{}} />
          </div>
        )}
        {ts.done && (
          <div style={{background:"#ffffff",borderRadius:10,padding:14,textAlign:"center",border:"1px solid "+tier.col+"22",marginBottom:6}}>
            <div style={{fontSize:18,fontWeight:900,color:ts.alive?tier.col:"#475569"}}>{ts.alive?"🏆 "+tier.name+" Champion!":"Tournament Complete"}</div>
            <div style={{color:"#475569",fontSize:13,marginTop:3}}>{ts.log.filter(function(m){return m.won}).length}W-{ts.log.filter(function(m){return !m.won}).length}L • {ts.log.reduce(function(a,m){return a+m.pts},0).toLocaleString()} pts</div>
            {(function(){ var ptsE = ts.log.reduce(function(a,m){return a+m.pts},0); var moneyE = 0; var t = TIERS[ts.tierIdx]; for(var mi=0;mi<ts.log.length;mi++){if(ts.log[mi].won&&t.money)moneyE+=(t.money[mi]||0);} return moneyE > 0 ? (<div style={{fontSize:14,color:"#22c55e",marginTop:2}}>💰 +${moneyE.toLocaleString()}</div>) : null; })()}
            {(function(){ var def = (S.player.def && S.player.def[S.calIdx]) || 0; var earned = ts.log.reduce(function(a,m){return a+m.pts},0); var net = earned - def; return def > 0 ? (<div style={{fontSize:14,marginTop:3}}><span style={{color:"#f59e0b"}}>Defending: {def}</span><span style={{color:"#94a3b8",margin:"0 4px"}}>→</span><span style={{color:net>=0?"#22c55e":"#ef4444",fontWeight:700}}>Net: {net>=0?"+"+net:net}</span></div>) : null; })()}
            <button onClick={finishT} style={Object.assign({},bs("linear-gradient(135deg,"+tier.col+",#f59e0b)","#000"),{marginTop:10})}>Return to Hub →</button>
          </div>
        )}
        {ts.log.length>0&&(<div style={{background:"#ffffff",borderRadius:6,padding:6,marginTop:4}}><div style={{fontSize:13,color:"#64748b",fontWeight:700,marginBottom:3}}>MATCH LOG</div>{ts.log.map(function(m,i){return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 4px",fontSize:14,color:m.won?"#22c55e":"#ef4444"}}><span>{m.won?"W":"L"} {m.round} vs {sh(m.opp)}</span><span>+{m.pts}</span></div>);})}</div>)}
      </motion.div>
    );
  }

  /* ─── FINALS ─── */
  if (scr === "finals" && fs) {
    var fpm=null,fopp=null; if(fs.pending!=null&&!fs.champ){if(fs.phase==="groups")fpm=fs.gm[fs.pending];else if(fs.phase==="semis")fpm=fs.semis[fs.pending];else if(fs.phase==="final")fpm=fs.final;if(fpm)fopp=fpm.a.isP?fpm.b:fpm.a;} var pQ=false;for(var hi=0;hi<fs.houses.length;hi++)for(var pi=0;pi<fs.houses[hi].length;pi++)if(fs.houses[hi][pi].isP)pQ=true;
    return (
      <motion.div key="finals" {...screenAnim} style={W}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:15,fontWeight:900,letterSpacing:3,background:"linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SEASON {S.sNum} FINALS</div>
          <div style={{fontSize:14,color:"#475569",marginTop:2}}>{fs.champ?"Champion Crowned":fs.phase==="groups"?"Group Stage":fs.phase==="semis"?"Semifinals":"World Championship"}</div>
        </div>
        {fs.champ&&(<div style={{textAlign:"center",padding:16}}><div style={{fontSize:48}}>👑</div><div style={{fontSize:20,fontWeight:900,color:"#b45309",letterSpacing:3,animation:"cg 2s ease infinite"}}>{fs.champ.isP?"YOU ARE WORLD CHAMPION!":"WORLD CHAMPION"}</div>{!fs.champ.isP&&(<div style={{fontSize:15,color:"#475569",marginTop:4}}>{fs.champ.emoji} {fs.champ.name}</div>)}<button onClick={nextSeason} style={Object.assign({},bs("linear-gradient(135deg,#facc15,#f59e0b)","#000"),{marginTop:14})}>🔄 Season {(S.sNum||1)+1}</button></div>)}
        {fpm&&fopp&&!fs.champ&&(<div style={{background:"#ffffff",border:"1px solid rgba(250,204,21,0.12)",borderRadius:10,padding:10,marginBottom:6,animation:"glow 2s ease infinite"}}><div style={{textAlign:"center",marginBottom:4}}><div style={{fontSize:16,fontWeight:900,color:"#b45309"}}>{fs.phase==="final"?"👑 WORLD CHAMPIONSHIP":"⚔️ "+fs.phase.toUpperCase()}</div><div style={{fontSize:13,color:"#475569",marginTop:2}}><span style={{color:"#b45309"}}>{S.pName}</span> vs <span style={{color:"#0f172a"}}>{fopp.emoji} {fopp.name}</span></div></div><PowerBar key={"f-"+fs.phase+"-"+fopp.id} onDone={onFR} oppSkill={fopp.skill||60} diff={fs.phase==="final"?5:fs.phase==="semis"?4:3} tr={S.player.tr} otr={fopp.tr||{}} /></div>)}
        {!fs.champ&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>{fs.houses.map(function(h,hi){return(<div key={hi} style={{background:"#ffffff",borderRadius:6,padding:5,border:"1px solid "+HC[hi]+"33"}}><div style={{fontSize:14,fontWeight:700,color:HC[hi],marginBottom:2}}>{HI[hi]} {HN[hi]}</div>{h.slice().sort(function(a,b){return(b.gP||0)-(a.gP||0)}).map(function(p){return(<div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:13,padding:"1px 3px",background:p.isP?"rgba(250,204,21,0.06)":"transparent",borderRadius:2,color:p.isP?"#b45309":"#334155"}}><span style={{maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.isP?"You":sh(p.name)}</span><span style={{fontWeight:600}}>{(p.gW||0)}W-{(p.gL||0)}L</span></div>);})}</div>);})}</div>)}
        {!fs.champ&&fs.semis.length>0&&(<div style={{background:"#ffffff",borderRadius:6,padding:6,marginBottom:6}}><div style={{fontSize:14,color:"#b45309",fontWeight:700,marginBottom:3}}>Semifinals</div>{fs.semis.map(function(m,i){return(<div key={i} style={{fontSize:14,color:"#334155",padding:"2px 0",display:"flex",justifyContent:"space-between"}}><span>{m.a.isP?"You":sh(m.a.name)} vs {m.b.isP?"You":sh(m.b.name)}</span><span style={{color:m.w?"#22c55e":"#64748b",fontWeight:600}}>{m.w?(m.w.isP?"You!":sh(m.w.name)):"—"}</span></div>);})}</div>)}
        {!pQ&&!fs.champ&&(<div style={{textAlign:"center",padding:10,background:"rgba(239,68,68,0.05)",borderRadius:8}}><div style={{color:"#ef4444",fontWeight:700,fontSize:14}}>You didn't qualify</div></div>)}
      </motion.div>
    );
  }

  return (<div style={W}><div style={{textAlign:"center",padding:40,color:"#94a3b8"}}>Loading...</div></div>);
}
