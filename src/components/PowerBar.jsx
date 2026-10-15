/* ═══ PowerBar ═══ Arena combat: VS intro → best-of-N sets (3 strikes each, higher average wins the set) → outro */

import * as React from "react";
import { motion } from "framer-motion";
import { playStrike, playClash, playBeep, playHeartbeat, playGallop, playCluck, playClang, playImpact } from "../sounds";
import { STRIKES_PER_SET } from "../models/constants";
import { CountUp, vibrate, REDUCED_MOTION } from "./fx";
import MatchIntro from "./MatchIntro";
import MatchOutro from "./MatchOutro";
import SetBreak from "./SetBreak";
import JoustStage from "./JoustStage";
import { PLAYER_PALETTE, paletteFor } from "./Rider";
import { crowdRoar } from "../engine/fans";

const { useState, useEffect, useRef } = React;

function orbColor(v) { return v >= 85 ? "#22c55e" : v >= 70 ? "#eab308" : v >= 55 ? "#f97316" : "#ef4444"; }
/* Lighter variants for text on the dark reveal overlay */
function orbColorOnDark(v) { return v >= 85 ? "#4ade80" : v >= 70 ? "#facc15" : v >= 55 ? "#fb923c" : "#f87171"; }
var INK_GOLD = "#92400e", INK_RED = "#b91c1c";
function strikeLabel(v) { return v >= 85 ? "PERFECT!" : v >= 75 ? "GREAT" : v >= 60 ? "GOOD" : "MISS"; }
function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }
function countWon(sets) { var n = 0; for (var i = 0; i < sets.length; i++) if (sets[i].won) n++; return n; }

/* Final result from the closed sets, or null while the match is still live */
function matchResult(sets, need) {
  var w = countWon(sets), l = sets.length - w;
  if (w < need && l < need) return null;
  var all = { my: [], op: [] };
  sets.forEach(function (s) { all.my = all.my.concat(s.my); all.op = all.op.concat(s.op); });
  return { w: w >= need, setsWon: w, setsLost: l, sets: sets, pa: avg(all.my), oa: avg(all.op), myStrikes: all.my };
}

/* Nameplate under the joust lane: who, and this set's strike orbs. Module-level so its animations don't restart on every render. */
function Fighter(props) {
  var isYou = props.isYou, strikes = props.strikes, other = props.other;
  var verdict = props.verdict; /* "won" | "lost" | null */
  var color = isYou ? INK_GOLD : "#334155";
  return (
    <div style={{ flex: 1, textAlign: "center", position: "relative", minWidth: 0 }}>
      <div style={{ fontSize: 10, color: color, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase", lineHeight: "13px", height: 13 }}>
        {verdict === "won" ? "👑 " : verdict === "lost" ? "💫 " : ""}{isYou ? "YOU" : "FOE"}
      </div>
      <div style={{ fontSize: 13, color: "#0f172a", fontWeight: 800, lineHeight: "18px", height: 18, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>
        {!isYou && props.emoji ? props.emoji + " " : ""}{props.name}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 4 }}>
        {[0,1,2].map(function (i) {
          var v = strikes[i], filled = v != null;
          var won = filled && v >= other[i];
          var c = filled ? orbColor(v) : "#e5e7eb";
          return (
            <div key={i} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: filled ? "radial-gradient(circle at 30% 30%,#fff," + c + " 80%)" : "#f1f5f9",
              border: "2px solid " + c,
              boxShadow: won ? "0 0 8px " + c : "none",
              animation: filled ? "orbPop 0.5s ease" : "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 10, fontWeight: 900, color: filled ? "#0f172a" : "#cbd5e1"
            }}>
              {filled ? Math.round(v) : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* Tug-of-war bar for the current set: average point gap. Positive = you lead; its sign after strike 3 decides the set. */
function Momentum(props) {
  var n = props.my.length;
  if (n === 0) return (<div style={{ height: 30 }} />);
  var gap = 0; for (var i = 0; i < n; i++) gap += props.my[i] - props.op[i];
  var a = gap / n;
  var frac = Math.min(1, Math.abs(a) / 20);
  var ahead = a >= 0;
  var label = Math.abs(a) < 0.5 ? "SET: DEAD EVEN" : ahead ? "SET: YOU LEAD +" + Math.round(a) : "SET: TRAILING " + Math.round(a);
  return (
    <div style={{ maxWidth: 260, margin: "0 auto", height: 30 }}>
      <div style={{ position: "relative", height: 8, borderRadius: 4, background: "rgba(15,23,42,0.08)", overflow: "hidden" }}>
        <motion.div
          initial={false}
          animate={{ width: (frac * 50) + "%", left: ahead ? (50 - frac * 50) + "%" : "50%" }}
          transition={{ type: "spring", stiffness: 180, damping: 20 }}
          style={{ position: "absolute", top: 0, bottom: 0, background: ahead ? "linear-gradient(90deg,#facc15,#f59e0b)" : "linear-gradient(90deg,#ef4444,#f87171)", borderRadius: 4 }} />
        <div style={{ position: "absolute", top: -2, bottom: -2, left: "calc(50% - 1px)", width: 2, background: "#0f172a", opacity: 0.35 }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.5, marginTop: 4, color: ahead ? INK_GOLD : INK_RED }}>{label}</div>
    </div>
  );
}

/* Per-strike score panel floating over the top of the lane, so the joust below stays visible */
function StrikeReveal(props) {
  var r = props.reveal;
  var gap = r.you - r.opp;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: r.leaving ? 0 : 1, y: 0 }} transition={{ duration: 0.15 }}
      style={{ position: "absolute", top: 4, left: "50%", marginLeft: -125, width: 250, zIndex: 30, borderRadius: 12, background: "rgba(15,23,42,0.9)", boxShadow: "0 6px 18px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 12px", boxSizing: "border-box", pointerEvents: "none" }}>
      <motion.div animate={r.stamped ? (r.youWon ? { scale: 1.2 } : { scale: 0.85, opacity: 0.5 }) : { scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}
        style={{ fontSize: 30, fontWeight: 900, color: "#facc15", textShadow: "0 0 14px rgba(250,204,21,0.6)", width: 52, textAlign: "left", lineHeight: 1.1 }}>
        <CountUp to={r.you} duration={360} tick={true} />
      </motion.div>
      <div style={{ textAlign: "center", flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, color: "#cbd5e1", letterSpacing: 1.2, fontWeight: 900, whiteSpace: "nowrap" }}>SET {r.set} · STRIKE {r.strike}</div>
        <div style={{ height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {r.stamped ? (
            <motion.div initial={{ scale: 2.4, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -5 }} transition={{ type: "spring", stiffness: 520, damping: 16 }}
              style={{ padding: "0 8px", border: "2px solid " + (r.youWon ? "#facc15" : "#f87171"), color: r.youWon ? "#facc15" : "#f87171", fontSize: 15, fontWeight: 900, letterSpacing: 1.5, borderRadius: 5, lineHeight: "18px" }}>
              {gap >= 0 ? "+" + gap : "−" + Math.abs(gap)}
            </motion.div>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, color: orbColorOnDark(r.you) }}>{r.label}</span>
          )}
        </div>
      </div>
      <motion.div animate={r.stamped ? (r.youWon ? { scale: 0.85, opacity: 0.5 } : { scale: 1.2 }) : { scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 15 }}
        style={{ fontSize: 30, fontWeight: 900, color: "#f87171", textShadow: "0 0 14px rgba(239,68,68,0.5)", width: 52, textAlign: "right", lineHeight: 1.1 }}>
        <CountUp to={r.opp} duration={360} />
      </motion.div>
    </motion.div>
  );
}

/* Big in-arena "SET 2" card shown for a beat before the cursor starts */
function SetIntroCard(props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      style={{ position: "absolute", inset: 0, zIndex: 30, borderRadius: 12, background: "radial-gradient(ellipse at center,rgba(15,23,42,0.85),rgba(15,23,42,0.6))", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <motion.div initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 480, damping: 18 }}
        style={{ fontSize: 44, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: 3, textShadow: "0 4px 0 #92400e, 0 0 24px rgba(250,204,21,0.8)" }}>
        SET {props.setNum}
      </motion.div>
      {props.tag && (
        <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ marginTop: 4, fontSize: 14, fontWeight: 900, letterSpacing: 3, color: props.tagColor, textShadow: "0 0 12px " + props.tagColor }}>
          {props.tag}
        </motion.div>
      )}
    </motion.div>
  );
}

export default function PowerBar(props) {
  var bestOf = props.bestOf || 3;
  var need = Math.ceil(bestOf / 2);
  var init = props.initialProgress || { sets: [], my: [], op: [] };
  var initRes = matchResult(init.sets, need);

  var _p = useState(initRes ? "done" : "intro"), ph = _p[0], setPh = _p[1];
  var _sets = useState(init.sets), sets = _sets[0], setSets = _sets[1];
  var _my = useState(init.my), myH = _my[0], setMyH = _my[1];
  var _op = useState(init.op), opH = _op[0], setOpH = _op[1];
  var _marks = useState([]), marks = _marks[0], setMarks = _marks[1];
  var _res = useState(initRes), res = _res[0], setRes = _res[1];
  var _fx = useState(null), fx = _fx[0], setFx = _fx[1];
  var _reveal = useState(null), reveal = _reveal[0], setReveal = _reveal[1];
  var _joust = useState(null), joust = _joust[0], setJoust = _joust[1];
  var _skip = useState(0), skip = _skip[0], setSkip = _skip[1];
  var _cont = useState(0), cont = _cont[0], setCont = _cont[1];
  var raf = useRef(null);
  var cursorRef = useRef(null);
  var posRef = useRef(0);
  var busy = useRef(false);
  var doneAt = useRef(initRes ? Date.now() - 2000 : 0);
  var finished = useRef(false);
  var tr = props.tr || {}, otr = props.otr || {};
  var nR=(tr.r||0)-(otr.r||0), nP=(tr.p||0)-(otr.p||0), nF=(tr.f||0)-(otr.f||0), nS=(tr.s||0)-(otr.s||0), nG=(tr.g||0)-(otr.g||0);
  var ctr = 72, swBase = Math.max(3, 12 - props.diff * 1.5 + nP * 1.2), fb = nF * 1.5;
  var accel = Math.max(0.03, 0.3 - nS * 0.015), minSc = Math.max(0, 15 + nG * 1.5);
  /* Bar resets every set, but each new set starts a little faster (fatigue — Stamina softens it) */
  var baseSpd = Math.max(0.8, 2.4 + props.diff * 0.4 - nR * 0.12);
  function speedFor(setIdx, strikeIdx) { return baseSpd + setIdx * accel * 0.6 + strikeIdx * accel; }
  var spd = useRef(speedFor(init.sets.length, init.my.length));
  var dir = useRef(1);

  var setsWon = countWon(sets), setsLost = sets.length - setsWon;
  var setNum = sets.length + 1;
  var cnt = myH.length;
  var deciding = setsWon === need - 1 && setsLost === need - 1;
  /* Crowd roar: on the last strike of a set with the match on the line, a fan favourite gets a wider gold zone */
  var onTheLine = cnt === STRIKES_PER_SET - 1 && (setsWon === need - 1 || setsLost === need - 1);
  var roar = onTheLine ? crowdRoar(props.fans || 0) : 0;
  var sw = swBase + roar;

  var youName = props.playerName || "YOU";
  var oppName = props.oppName || "OPPONENT";
  var youEmoji = props.playerEmoji || "⚔️";
  var oppEmoji = props.oppEmoji || "👤";
  var tierColor = props.tierColor || "#f59e0b";
  var youPal = PLAYER_PALETTE;
  var foePal = paletteFor(props.oppId, props.oppRank);

  /* Cursor is driven straight on the DOM node so the arena doesn't re-render 60×/s.
     Speed is normalised to 60fps units so 120Hz screens don't get a faster bar. */
  useEffect(function () {
    if (ph !== "go") return;
    var last = performance.now();
    function tick(now) {
      var dt = Math.min(50, now - last) / (1000 / 60); last = now;
      var n = posRef.current + dir.current * spd.current * dt;
      if (n >= 100) { n = Math.max(0, 200 - n); dir.current = -1; }
      if (n <= 0) { n = Math.min(100, -n); dir.current = 1; }
      posRef.current = n;
      if (cursorRef.current) cursorRef.current.style.left = "calc(" + n + "% - 5px)";
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return function () { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [ph]);

  /* Timeline per strike: 0ms freeze + roll-up · 400ms clash/stamp · 1000ms orbs+momentum update · 1450ms next strike / set break / outro */
  function doStrike() {
    if (ph !== "go" || busy.current) return;
    busy.current = true;
    if (raf.current) cancelAnimationFrame(raf.current);
    var pos = posRef.current;
    var d = Math.abs(pos - ctr), inZ = d <= sw / 2;
    var sc = Math.min(100, (inZ ? 85 + Math.random() * 12 : Math.max(minSc, 60 - d * 1.2 + Math.random() * 10)) + fb);
    var oB = ((otr.r||0)+(otr.p||0)+(otr.f||0)+(otr.s||0)+(otr.g||0)) * 0.9;
    var effSkill = (props.oppSkill||50) + oB;
    var oBase = Math.min(95, 55 + effSkill * 0.4);
    var osc = Math.min(99, oBase + (Math.random() * 14 - 5));
    var youWon = sc >= osc;
    var id = Date.now() + Math.random();
    var nm = myH.concat([sc]), no = opH.concat([osc]);
    var setDone = nm.length >= STRIKES_PER_SET;
    var newSets = setDone ? sets.concat([{ my: nm, op: no, won: avg(nm) >= avg(no) }]) : sets;
    var result = setDone ? matchResult(newSets, need) : null;

    /* Persist before any animation so a reload can't undo this strike */
    if (props.onProgress) props.onProgress(setDone ? { sets: newSets, my: [], op: [] } : { sets: sets, my: nm, op: no });

    /* Joust: both riders charge (0ms), lances meet at the clash (400ms), riders trot back (850ms), lane clears (1400ms).
       On the match-deciding strike the clash follows the match result, not this strike: the match loser is unseated
       (850ms), hits the dirt, and the moment holds before the outro (2700ms). */
    var big = Math.max(sc, osc) >= 85 || Math.abs(sc - osc) >= 15;
    var word = youWon
      ? (sc >= 85 ? "BONK!" : big ? "WHAM!" : "TAP!")
      : (sc < 60 ? "WHIFF!" : big ? "OOF!" : "BLOCKED!");
    var joustWon = youWon;
    if (result) { joustWon = result.w; big = true; word = result.w ? "KNOCKOUT!" : "UNSEATED!"; }
    function joustPhase(phase) { setJoust(function (j) { return j && j.id === id ? Object.assign({}, j, { phase: phase }) : j; }); }

    setPh("hitstop");
    setMarks(marks.concat([{ pos: pos, sc: sc }]));
    setReveal({ id: id, you: Math.round(sc), opp: Math.round(osc), youWon: youWon, label: strikeLabel(sc), set: setNum, strike: nm.length, stamped: false });
    setJoust({ id: id, phase: "charge", youWon: joustWon, big: big, word: word });
    playStrike(sc);
    playGallop();
    vibrate(12);

    setTimeout(function () {
      setReveal(function (r) { return r && r.id === id ? Object.assign({}, r, { stamped: true }) : r; });
      setFx({ id: id, kind: youWon ? (sc >= 85 ? "crit" : "hit") : "miss", youWon: youWon });
      joustPhase("impact");
      playClash(youWon);
      playCluck();
      if (big) playClang();
      vibrate(youWon ? (sc >= 85 ? [20, 30, 50] : 30) : [50, 30, 50]);
    }, 400);
    if (result) {
      setTimeout(function () { joustPhase("finale"); playCluck(); }, 850);
      setTimeout(function () { playImpact(true); vibrate([80, 40, 120]); }, 1200);
    } else {
      setTimeout(function () { joustPhase("return"); }, 850);
      setTimeout(function () { setJoust(function (j) { return j && j.id === id ? null : j; }); }, 1400);
    }
    setTimeout(function () {
      setFx(function (f) { return f && f.id === id ? null : f; });
      setReveal(function (r) { return r && r.id === id ? Object.assign({}, r, { leaving: true }) : r; });
    }, 850);
    setTimeout(function () { setReveal(null); setMyH(nm); setOpH(no); }, 1000);

    if (result) {
      setTimeout(function () { setSets(newSets); }, 1000);
      setTimeout(function () { setRes(result); setPh("done"); doneAt.current = Date.now(); }, 2700);
      return;
    }
    setTimeout(function () {
      if (setDone) {
        setSets(newSets); setPh("setbreak");
      } else {
        spd.current += accel;
        posRef.current = 0; dir.current = 1; busy.current = false; setPh("go");
      }
    }, 1500);
  }

  var setIntroLock = useRef(false);
  function startNextSet() {
    if (ph !== "setbreak" || setIntroLock.current) return;
    setIntroLock.current = true;
    setMyH([]); setOpH([]); setMarks([]);
    spd.current = speedFor(sets.length, 0);
    setPh("setintro");
    playBeep();
    if (countWon(sets) === need - 1 || sets.length - countWon(sets) === need - 1) setTimeout(playHeartbeat, 200);
    setTimeout(function () { posRef.current = 0; dir.current = 1; busy.current = false; setIntroLock.current = false; setPh("go"); }, 1100);
  }

  function finish() {
    if (!res || finished.current || Date.now() - doneAt.current < 1200) return;
    finished.current = true;
    props.onDone(res.w, res.pa, res.oa, res.setsWon + "-" + res.setsLost, res.sets.map(function (s) { return s.won ? "W" : "L"; }).join(""));
  }

  /* Space / Enter drives every phase */
  var actRef = useRef(null);
  actRef.current = function () {
    if (ph === "intro") setSkip(function (s) { return s + 1; });
    else if (ph === "go") doStrike();
    else if (ph === "setbreak") setCont(function (c) { return c + 1; });
    else if (ph === "done") finish();
  };
  useEffect(function () {
    function onKey(e) {
      if (e.repeat || (e.code !== "Space" && e.key !== "Enter")) return;
      var t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      e.preventDefault();
      actRef.current();
    }
    window.addEventListener("keydown", onKey);
    return function () { window.removeEventListener("keydown", onKey); };
  }, []);

  var sl = ctr - sw / 2;
  var lastMark = marks[marks.length - 1];
  var isDone = ph === "done" && res;

  var story = null;
  if (res) {
    var misses = res.myStrikes.filter(function (s) { return s < 60; }).length;
    var perfects = res.myStrikes.filter(function (s) { return s >= 85; }).length;
    var score = res.setsWon + "-" + res.setsLost;
    if (res.w) {
      if (res.setsLost === 0) story = "Clean sweep, " + score + (perfects >= 3 ? " — " + perfects + " perfect strikes." : ". Never gave them a set.");
      else if (!res.sets[0].won) story = "What a comeback! Dropped the first set and still won " + score + ".";
      else if (res.setsLost === need - 1) story = "Survived a deciding-set thriller, " + score + ".";
      else story = "Won " + score + ". Steady timing paid off.";
    } else {
      if (misses >= 3) story = misses + " weak strikes cost you. Aim for the gold zone.";
      else if (res.sets[0].won) story = "Took the first set but couldn't close it out.";
      else if (res.setsWon === need - 1) story = "Lost a deciding set — that close.";
      else story = "Lost " + score + ". Train up and come back stronger.";
    }
  }

  /* Banner for strike 3 of a set */
  var finalStrike = cnt === STRIKES_PER_SET - 1 && ph === "go";
  var banner = null;
  if (finalStrike) {
    var gapSoFar = 0; for (var gi = 0; gi < cnt; gi++) gapSoFar += myH[gi] - opH[gi];
    var target = gapSoFar >= 0
      ? "Protect your " + Math.round(gapSoFar) + "-pt lead"
      : -gapSoFar > 60 ? "Set is out of reach — finish strong"
      : "Outscore them by " + Math.ceil(-gapSoFar) + "+ to take the set";
    if (deciding) banner = { tag: "🔥 All on the line", col: INK_RED, target: target };
    else if (setsWon === need - 1) banner = { tag: "⚡ Match point", col: INK_GOLD, target: target };
    else if (setsLost === need - 1) banner = { tag: "⚠ Save the match", col: INK_RED, target: target };
    else banner = { tag: "⚠ Set point", col: INK_RED, target: target };
  }

  var setTag = null, setTagColor = "#fde68a";
  if (deciding) { setTag = "DECIDING SET"; setTagColor = "#f87171"; }
  else if (setsWon === need - 1) { setTag = "MATCH POINT"; setTagColor = "#facc15"; }
  else if (setsLost === need - 1) { setTag = "ON THE BRINK"; setTagColor = "#f87171"; }

  var shake = REDUCED_MOTION || !fx ? "none" : fx.kind === "crit" ? "arenaShakeHard 0.4s ease" : "arenaShake 0.35s ease";
  var redAlert = deciding || !!banner;
  var lastSet = sets[sets.length - 1];

  return (
    <div style={{ position: "relative", padding: "4px 0" }}>
      {ph === "intro" && (
        <MatchIntro
          you={{ name: youName, emoji: youEmoji, sub: props.youSub, palette: youPal }}
          foe={{ name: oppName, emoji: oppEmoji, sub: props.foeSub, palette: foePal }}
          roundLabel={props.roundLabel} tierName={props.tierName} tierColor={tierColor}
          bestOf={bestOf} resumeSet={sets.length > 0 || myH.length > 0 ? setNum : null} scout={props.scout}
          skipSignal={skip}
          onDone={function () { setPh(sets.length > 0 && myH.length === 0 ? "setintro" : "go"); if (sets.length > 0 && myH.length === 0) setTimeout(function () { setPh("go"); }, 1100); }} />
      )}
      {ph === "setbreak" && lastSet && (
        <SetBreak set={lastSet} setNum={sets.length} need={need} setsWon={setsWon} setsLost={setsLost}
          youName={youName} foeName={oppName} eliminated={props.eliminated !== false}
          continueSignal={cont} onContinue={startNextSet} />
      )}
      {isDone && (
        <MatchOutro
          won={res.w} champion={res.w && !!props.isFinal} eliminated={!res.w && props.eliminated !== false}
          pa={res.pa} oa={res.oa} sets={res.sets} setsWon={res.setsWon} setsLost={res.setsLost}
          foeName={oppName} roundLabel={props.roundLabel} nextLabel={props.nextLabel} tierName={props.tierName}
          stakes={props.stakes} story={story} youPalette={youPal} foePalette={foePal}
          onContinue={finish} />
      )}

      <div
        onPointerDown={function (e) { if (ph === "go") { e.preventDefault(); doStrike(); } }}
        style={{
          position: "relative",
          background: deciding
            ? "radial-gradient(ellipse at center top,#fff1f2 0%,#ffe4e6 45%,#fecdd3 100%)"
            : "radial-gradient(ellipse at center top,#fef3c7 0%,#fff7ed 40%,#fde68a 100%)",
          borderRadius: 14, padding: "10px 8px 8px",
          border: "2px solid " + (redAlert ? "rgba(239,68,68,0.6)" : "rgba(250,204,21,0.4)"),
          overflow: "hidden", animation: shake !== "none" ? shake : (deciding && !REDUCED_MOTION ? "auraFoe 1.6s ease infinite" : "none"),
          boxShadow: "inset 0 0 40px rgba(250,204,21,0.08), 0 4px 12px rgba(180,83,9,0.08)",
          cursor: ph === "go" ? "crosshair" : "default",
          touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none"
        }}>
        <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: "linear-gradient(180deg,transparent,rgba(180,83,9,0.08))", pointerEvents: "none" }} />

        <div style={{ textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: banner ? banner.col : "#1e293b", color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: 1.5, padding: "2px 10px", borderRadius: 20, textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.15)", animation: banner && !REDUCED_MOTION ? "pulse 1s ease infinite" : "none" }}>
            {!banner && (<span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: tierColor, boxShadow: "0 0 6px " + tierColor }} />)}
            {banner ? banner.tag + (roar && ph === "go" ? " · 📣 Crowd roars" : "") : (deciding ? "Deciding set" : "Set " + setNum) + " · Strike " + Math.min(cnt + 1, STRIKES_PER_SET) + "/" + STRIKES_PER_SET}
          </span>
        </div>

        <JoustStage you={youPal} foe={foePal} action={joust} verdict={isDone ? (res.w ? "won" : "lost") : null} tierColor={tierColor} />

        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "flex-start", gap: 4, marginTop: 4, marginBottom: 6 }}>
          <Fighter isYou={true} name={youName} emoji={youEmoji} strikes={myH} other={opH} verdict={isDone ? (res.w ? "won" : "lost") : null} />
          <div style={{ paddingTop: 2, textAlign: "center", minWidth: 74 }}>
            <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2, color: INK_GOLD }}>SETS</div>
            <div style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.1, color: "#b45309", textShadow: "0 2px 4px rgba(180,83,9,0.2)" }}>
              {setsWon}<span style={{ color: "#94a3b8", margin: "0 4px" }}>–</span><span style={{ color: "#334155" }}>{setsLost}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: INK_GOLD }}>BEST OF {bestOf}</div>
          </div>
          <Fighter isYou={false} name={oppName} emoji={oppEmoji} strikes={opH} other={myH} verdict={isDone ? (res.w ? "lost" : "won") : null} />
        </div>

        <Momentum my={myH} op={opH} />

        {/* Fixed-height slot: the STRIKE button must never move mid-match */}
        <div style={{ height: 18, marginTop: 2, textAlign: "center", fontSize: 12, fontWeight: 800, lineHeight: "18px", color: banner ? banner.col : "transparent", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {banner ? banner.target : " "}
        </div>

        {reveal && (<StrikeReveal key={reveal.id} reveal={reveal} />)}
        {ph === "setintro" && (<SetIntroCard setNum={setNum} tag={setTag} tagColor={setTagColor} />)}
      </div>

      {/* Strike track */}
      <div style={{ marginTop: 10, marginBottom: 4 }}>
        <div style={{ position: "relative", height: 36, background: "linear-gradient(90deg,#1e293b 0%,#334155 50%,#1e293b 100%)", borderRadius: 18, overflow: "hidden", margin: "0 auto", maxWidth: 320, border: "2px solid #0f172a", boxShadow: "inset 0 2px 6px rgba(0,0,0,0.4)" }}>
          <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: sl + "%", background: "linear-gradient(90deg,rgba(239,68,68,0.25),transparent)" }} />
          <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, right: 0, width: Math.max(0, 100 - sl - sw) + "%", background: "linear-gradient(270deg,rgba(239,68,68,0.25),transparent)" }} />
          <div style={{ position: "absolute", top: 3, bottom: 3, left: sl + "%", width: sw + "%", background: "linear-gradient(180deg,rgba(250,204,21,0.95),rgba(245,158,11,0.85))", borderRadius: 12, boxShadow: "0 0 14px rgba(250,204,21,0.7), inset 0 0 8px rgba(255,255,255,0.5)", animation: REDUCED_MOTION ? "none" : "zoneBreathe 1.4s ease infinite" }} />
          <div style={{ position: "absolute", top: 2, bottom: 2, width: 2, left: "calc(" + ctr + "% - 1px)", background: "rgba(255,255,255,0.9)", borderRadius: 1 }} />
          {/* Where this set's strikes landed — timing feedback */}
          {marks.map(function (m, i) {
            var isLast = i === marks.length - 1;
            return (<div key={i} style={{ position: "absolute", top: 6, bottom: 6, width: 4, left: "calc(" + m.pos + "% - 2px)", background: orbColor(m.sc), borderRadius: 2, opacity: isLast ? 0.95 : 0.5, border: "1px solid rgba(255,255,255,0.7)" }} />);
          })}
          {ph === "hitstop" && lastMark && !REDUCED_MOTION && (
            <div key={"burst-" + marks.length} aria-hidden style={{ position: "absolute", top: "50%", left: lastMark.pos + "%", width: 44, height: 44, marginLeft: -22, marginTop: -22, borderRadius: "50%", background: "radial-gradient(circle," + orbColor(lastMark.sc) + ",transparent 70%)", animation: "flashBoom 0.45s ease-out forwards", pointerEvents: "none" }} />
          )}
          {(ph === "go" || ph === "hitstop") && (
            <div ref={cursorRef} style={{
              position: "absolute", top: -4, bottom: -4, width: 10,
              left: "calc(" + posRef.current + "% - 5px)",
              background: "linear-gradient(180deg,#60a5fa,#1e40af,#60a5fa)",
              borderRadius: 3, border: "1px solid #fff",
              boxShadow: ph === "hitstop" ? "0 0 4px rgba(255,255,255,0.9)" : "0 0 12px rgba(59,130,246,0.9), 0 0 24px rgba(59,130,246,0.5)",
              opacity: ph === "hitstop" ? 0.6 : 1
            }} />
          )}
        </div>
      </div>

      <div style={{ marginTop: 8, textAlign: "center", minHeight: 74 }}>
        <button
          onPointerDown={function (e) { e.preventDefault(); doStrike(); }}
          disabled={ph !== "go"}
          style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 900, textTransform: "uppercase", fontSize: 16, padding: "14px 28px", letterSpacing: 2, touchAction: "manipulation", boxShadow: "0 4px 14px rgba(220,38,38,0.5)", animation: ph === "go" && !REDUCED_MOTION ? "pulse 0.5s ease infinite" : "none", opacity: ph === "go" ? 1 : 0.4, cursor: ph === "go" ? "pointer" : "default" }}>
          ⚡ STRIKE!
        </button>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Tap the arena, the button, or press Space</div>
      </div>
    </div>
  );
}
