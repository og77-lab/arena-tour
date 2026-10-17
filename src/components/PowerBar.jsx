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
import { PLAYER_PALETTE, paletteFor, withKit } from "./Rider";
import { crowdEdge } from "../engine/social";
import { CoachBubble } from "./Coach";
import FinalOutro from "./FinalOutro";
import { conditionOf, softZone } from "../engine/events"
import { kitFx } from "../engine/gear"
import { fatigueFx } from "../engine/fitness";
import { enterMatch, leaveMatch, startBattle, stopBattle } from "../music";

const { useState, useEffect, useRef } = React;

function orbColor(v) { return v >= 85 ? "#22c55e" : v >= 70 ? "#eab308" : v >= 55 ? "#f97316" : "#ef4444"; }
/* Lighter variants for text on the dark reveal overlay */
function orbColorOnDark(v) { return v >= 85 ? "#4ade80" : v >= 70 ? "#facc15" : v >= 55 ? "#fb923c" : "#f87171"; }
var INK_GOLD = "#92400e", INK_RED = "#b91c1c";
function strikeLabel(v) { return v >= 96 ? "PERFECT!" : v >= 85 ? "GOLD!" : v >= 66 ? "CLOSE" : "MISS"; }
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
        {Array.from({ length: Math.max(3, strikes.length) }).map(function (_, i) {
          var v = strikes[i], filled = v != null;
          var won = filled && v > other[i];
          var c = filled ? orbColor(v) : "#e5e7eb";
          return (
            <div key={i} style={{
              width: strikes.length > 3 ? 18 : 22, height: strikes.length > 3 ? 18 : 22, borderRadius: "50%",
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
  var sm = 0, so = 0; for (var i = 0; i < n; i++) { sm += props.my[i]; so += props.op[i]; }
  var a = Math.round(sm / n) - Math.round(so / n); /* the same rounded averages that decide the set */
  var frac = Math.min(1, Math.abs(a) / 20);
  var ahead = a >= 0;
  var label = a === 0 ? "SET: DEAD EVEN" : ahead ? "SET: YOU LEAD +" + Math.round(a) : "SET: TRAILING " + Math.round(a);
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
              style={{ padding: "0 8px", border: "2px solid " + (r.tie ? "#e2e8f0" : r.youWon ? "#facc15" : "#f87171"), color: r.tie ? "#e2e8f0" : r.youWon ? "#facc15" : "#f87171", fontSize: 15, fontWeight: 900, letterSpacing: 1.5, borderRadius: 5, lineHeight: "18px" }}>
              {r.tie ? "TIE" : gap >= 0 ? "+" + gap : "−" + Math.abs(gap)}
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
      {/* Where your score came from: the landing spot, then Aim (extra points) on top */}
      {r.why && (
        <div style={{ position: "absolute", left: 0, right: 0, top: "100%", marginTop: 3, display: "flex", justifyContent: "center" }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, color: "#e2e8f0", background: "rgba(15,23,42,0.88)", borderRadius: 8, padding: "2px 8px", whiteSpace: "nowrap" }}>
            <span style={{ color: r.why.kind === "Gold" ? "#facc15" : r.why.kind === "Floor" ? "#c4b5fd" : "#fb923c" }}>
              {r.why.kind === "Gold" ? "In the gold" : r.why.kind === "Floor" ? "Floor (Stubbornness)" : "Outside the gold"} {r.why.base}
            </span>
            {r.why.aim !== 0 && (<span style={{ color: r.why.aim > 0 ? "#4ade80" : "#f87171" }}> {r.why.aim > 0 ? "+" : "−"} {Math.abs(r.why.aim)} Extra</span>)}
            {r.why.tired ? (<span style={{ color: "#f87171" }}> − {Math.abs(r.why.tired)} Tired</span>) : null}
            {r.why.gear ? (<span style={{ color: r.why.gear > 0 ? "#4ade80" : "#f87171" }}> {r.why.gear > 0 ? "+" : "−"} {Math.abs(r.why.gear)} Gear</span>) : null}
            {r.why.capped && (<span style={{ color: "#94a3b8" }}> (max 100)</span>)}
            <span style={{ color: "#94a3b8" }}> = {r.you}</span>
          </span>
        </div>
      )}
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
  var _tieAlert = useState(null), tieAlert = _tieAlert[0], setTieAlert = _tieAlert[1];
  var _finalOut = useState(false), finalOutDone = _finalOut[0], setFinalOutDone = _finalOut[1];
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
  /* For the achievements: gold-zone strikes this match, and sets where all three strikes were gold */
  var goldRef = useRef({ total: 0, set: 0, flawless: 0 });
  /* Menu music steps aside while a match is on screen */
  useEffect(function () { enterMatch(); return leaveMatch; }, []);
  var tr = props.tr || {}, otr = props.otr || {};
  var nR=(tr.r||0)-(otr.r||0), nP=(tr.p||0)-(otr.p||0), nF=(tr.f||0)-(otr.f||0), nS=(tr.s||0)-(otr.s||0), nG=(tr.g||0)-(otr.g||0);
  /* The lane conditions (mud, wind, heat, village green) bend the bar for both riders, and make one stat gap count more (or all of them less) */
  var COND = conditionOf(props.cond), CW = COND.w || {};
  nR *= CW.r || 1; nP *= CW.p || 1; nF *= CW.f || 1; nS *= CW.s || 1; nG *= CW.g || 1;
  /* Your lance and saddle bend your own bar only (never hers) */
  var KIT = kitFx(props.gear, props.cond);
  /* Tiredness (granny: zone and misses; rooster: bar speed), yours and hers */
  var FT = fatigueFx(props.fit || { g: 100, r: 100 }), OFT = fatigueFx(props.oppFit || { g: 100, r: 100 });
  /* Her kit bends her own strikes, exactly as yours bends yours */
  var OKIT = kitFx(props.oppGear, props.cond);
  var ctr = 72, swBase = softZone(13 - props.diff * 1.5 + nP * 1.2 + COND.zone + KIT.zone + FT.zone), fb = nF * 1.5;
  var accel = Math.max(0.03, 0.3 - nS * 0.015) * COND.accel * KIT.accel * FT.accel, minSc = Math.max(0, 15 + nG * 1.5 + KIT.floor);
  /* Bar resets every set, but each new set starts a little faster (fatigue — Stamina (less speed-up) softens it) */
  var baseSpd = Math.max(0.8, 2.4 + props.diff * 0.4 - nR * 0.12) * COND.speed * KIT.speed * FT.speed;
  function speedFor(setIdx, strikeIdx) { return baseSpd + setIdx * accel * 0.6 + strikeIdx * accel; }
  var spd = useRef(speedFor(init.sets.length, init.my.length));
  var dir = useRef(1);

  var setsWon = countWon(sets), setsLost = sets.length - setsWon;
  var setNum = sets.length + 1;
  var cnt = myH.length;
  var deciding = setsWon === need - 1 && setsLost === need - 1;
  /* Crowd roar: on the last strike of a set with the match on the line, a fan favourite gets a wider gold zone */
  var onTheLine = cnt >= STRIKES_PER_SET - 1 && (setsWon === need - 1 || setsLost === need - 1);
  /* The stands back the rider they love more — a steady edge, doubled with the match on the line */
  var CROWD = crowdEdge(props.fans || 0, props.oppFans != null ? props.oppFans : 0);
  var roar = onTheLine ? CROWD.me : 0;
  var sw = swBase + CROWD.me + roar;

  var youName = props.playerName || "YOU";
  var oppName = props.oppName || "OPPONENT";
  var youEmoji = props.playerEmoji || "⚔️";
  var oppEmoji = props.oppEmoji || "👤";
  var tierColor = props.tierColor || "#f59e0b";
  /* Both riders carry this week's kit into every scene: the walk-out, the lanes, the podium */
  var youPal = withKit(PLAYER_PALETTE, props.gear);
  var foePal = withKit(paletteFor(props.oppId, props.oppRank), props.oppGear);

  /* Scoring, the same for both riders: where the lance lands on the bar decides the score.
     Inside the gold zone: 100 on the centre line, sliding to 85 at the zone's edge.
     Just outside it drops sharply to 70, and keeps falling the further out you are, down to the floor. */
  function strikeScore(d, half, floor) {
    var s = d <= half ? 100 - 15 * (d / half) : Math.max(floor, 70 - (d - half) * 2.2);
    return s + (Math.random() * 2 - 1);
  }
  function gauss() { var u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

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
    var base = strikeScore(d, sw / 2, minSc);
    var gearPts = KIT.aim + (inZ ? KIT.gold : KIT.miss), tiredPts = inZ ? 0 : FT.miss;
    var sc = Math.round(Math.max(0, Math.min(100, base + fb + gearPts + tiredPts)));
    /* How the score was built, shown under it: where it landed + Aim (extra points) + gear − tiredness */
    var aimShown = Math.round(fb), gearShown = Math.round(gearPts), tiredShown = Math.round(tiredPts), capped = base + fb + gearPts + tiredPts > 100;
    var why = { kind: inZ ? "Gold" : base <= minSc + 1.01 ? "Floor" : "Outside", aim: aimShown, gear: gearShown, tired: tiredShown, capped: capped, base: capped ? Math.round(base) : Math.round(sc) - aimShown - gearShown - tiredShown };
    /* Her strike lands on the same bar. Talent sets how tightly she groups around the centre, so the riders you meet
       deep in a big tournament are the steadiest. The round's faster bar is your challenge, not a handicap for her:
       she only feels a little of the match speeding up (an odd slip late on), plus the lanes, her gear and her tiredness. */
    var oSw = softZone(13 - (props.tier || 0) * 0.4 + COND.zone + OFT.zone + OKIT.zone) + CROWD.her * (onTheLine ? 2 : 1);
    var oSpd = (2.4 * COND.speed * OKIT.speed + (sets.length * 0.18 + myH.length * 0.3) * 0.35 * COND.accel * OFT.accel * OKIT.accel) * OFT.speed;
    var oSigma = Math.max(1.5, 9.5 - (props.oppSkill || 50) * 0.075) * oSpd / 2.4;
    var oPos = Math.max(0, Math.min(100, ctr + gauss() * oSigma));
    var oD = Math.abs(oPos - ctr), oIn = oD <= oSw / 2, osc = Math.round(Math.max(0, Math.min(100, strikeScore(oD, oSw / 2, 15 + OKIT.floor) + (oIn ? 0 : OFT.miss) + OKIT.aim + (oIn ? OKIT.gold : OKIT.miss))));
    var youWon = sc > osc, tie = sc === osc;
    var id = Date.now() + Math.random();
    var nm = myH.concat([sc]), no = opH.concat([osc]);
    /* A set is decided on the averages as the screen shows them (rounded): level averages — 83–83 — go to tie-break strikes */
    var sumMy = nm.reduce(function (a, b) { return a + b; }, 0), sumOp = no.reduce(function (a, b) { return a + b; }, 0);
    var avMy = Math.round(sumMy / nm.length), avOp = Math.round(sumOp / no.length);
    var setDone = nm.length >= STRIKES_PER_SET && avMy !== avOp;
    var goesToTieBreak = nm.length >= STRIKES_PER_SET && avMy === avOp;
    var g = goldRef.current;
    if (inZ) { g.total++; g.set++; }
    if (setDone) { if (g.set >= STRIKES_PER_SET && avMy > avOp) g.flawless++; g.set = 0; }
    var newSets = setDone ? sets.concat([{ my: nm, op: no, won: avMy > avOp }]) : sets;
    var result = setDone ? matchResult(newSets, need) : null;

    /* Persist before any animation so a reload can't undo this strike */
    if (props.onProgress) props.onProgress(setDone ? { sets: newSets, my: [], op: [] } : { sets: sets, my: nm, op: no });

    /* Joust: both riders charge (0ms), lances meet at the clash (400ms), riders trot back (850ms), lane clears (1400ms).
       On the match-deciding strike the clash follows the match result, not this strike: the match loser is unseated
       (850ms), hits the dirt, and the moment holds before the outro (2700ms). */
    var big = Math.max(sc, osc) >= 85 || Math.abs(sc - osc) >= 15;
    var word = tie ? "DEADLOCK!" : youWon
      ? (sc >= 85 ? "BONK!" : big ? "WHAM!" : "TAP!")
      : (sc < 60 ? "WHIFF!" : big ? "OOF!" : "BLOCKED!");
    if (tie) big = false;
    var joustWon = youWon;
    if (result) { joustWon = result.w; big = true; word = result.w ? "KNOCKOUT!" : "UNSEATED!"; }
    function joustPhase(phase) { setJoust(function (j) { return j && j.id === id ? Object.assign({}, j, { phase: phase }) : j; }); }

    setPh("hitstop");
    setMarks(marks.concat([{ pos: pos, sc: sc, opos: oPos }]));
    setReveal({ id: id, you: sc, opp: osc, youWon: youWon, tie: tie, label: strikeLabel(sc), set: setNum, strike: nm.length, stamped: false, why: why });
    setJoust({ id: id, phase: "charge", youWon: joustWon, big: big, word: word });
    playStrike(sc);
    playGallop();
    vibrate(12);

    setTimeout(function () {
      setReveal(function (r) { return r && r.id === id ? Object.assign({}, r, { stamped: true }) : r; });
      setFx({ id: id, kind: tie ? "hit" : youWon ? (sc >= 85 ? "crit" : "hit") : "miss", youWon: youWon });
      joustPhase("impact");
      playClash(youWon || tie);
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
      } else if (goesToTieBreak) {
        setTieAlert(id); playHeartbeat(); vibrate([30, 60, 30]);
        setTimeout(function () { setTieAlert(null); spd.current += accel; posRef.current = 0; dir.current = 1; busy.current = false; setPh("go"); }, 1300);
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
    props.onDone(res.w, res.pa, res.oa, res.setsWon + "-" + res.setsLost, res.sets.map(function (s) { return s.won ? "W" : "L"; }).join(""), { gold: goldRef.current.total, flawless: goldRef.current.flawless, sets: res.sets.map(function (s) { return [Math.round(avg(s.my)), Math.round(avg(s.op))]; }) });
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
  /* Battle music: on once the opening animation is over, off when the match is decided (the outro has its own fanfare) */
  useEffect(function () {
    if (ph === "done") stopBattle();
    else if (ph !== "intro") startBattle();
  }, [ph]);

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
  var tieBreaking = cnt >= STRIKES_PER_SET;
  var finalStrike = cnt >= STRIKES_PER_SET - 1 && ph === "go";
  var banner = null;
  if (finalStrike) {
    var gapSoFar = 0; for (var gi = 0; gi < cnt; gi++) gapSoFar += myH[gi] - opH[gi];
    var target = gapSoFar >= 0
      ? "Protect your " + Math.round(gapSoFar) + "-pt lead"
      : -gapSoFar > 60 ? "Set is out of reach — finish strong"
      : "Outscore them by " + Math.ceil(-gapSoFar) + "+ to take the set";
    if (tieBreaking) banner = { tag: "⚠ Tie-break " + (cnt - STRIKES_PER_SET + 1), col: INK_RED, target: "Outscore her on this strike to take the set" };
    else if (deciding) banner = { tag: "🔥 All on the line", col: INK_RED, target: target };
    else if (setsWon === need - 1) banner = { tag: "⚡ Match point", col: INK_GOLD, target: target };
    else if (setsLost === need - 1) banner = { tag: "⚠ Save the match", col: INK_RED, target: target };
    else banner = { tag: "⚠ Set point", col: INK_RED, target: target };
  }

  var setTag = null, setTagColor = "#fde68a";
  if (deciding) { setTag = "DECIDING SET"; setTagColor = "#f87171"; }
  else if (setsWon === need - 1) { setTag = "MATCH POINT"; setTagColor = "#facc15"; }
  else if (setsLost === need - 1) { setTag = "ON THE BRINK"; setTagColor = "#f87171"; }

  /* First joust: the coach talks you through the first set (shown over the arena, so nothing moves) */
  var coachText = null;
  if (props.coach && ph === "go") {
    var struck = sets.length * STRIKES_PER_SET + cnt;
    if (struck === 0) coachText = "Watch the blue marker below. Tap STRIKE when it's inside the GOLD zone!";
    else if (struck === 1) coachText = "Gold scores 85+. A miss still scores — just less. Two more strikes this set.";
    else if (struck === 2) coachText = "Last strike of the set: the set goes to whoever has the higher AVERAGE of the three.";
    else if (sets.length === 1 && cnt === 0) coachText = "Win " + need + " sets to take the match. The bar speeds up as it goes on — keep your eye on it.";
  }

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
          bestOf={bestOf} resumeSet={sets.length > 0 || myH.length > 0 ? setNum : null} scout={props.scout} coach={props.coach} isFinal={!!props.isFinal} isSlam={props.tier >= 5} road={props.road} oppId={props.oppId} oppRank={props.oppRank}
          skipSignal={skip}
          onDone={function () { setPh(sets.length > 0 && myH.length === 0 ? "setintro" : "go"); if (sets.length > 0 && myH.length === 0) setTimeout(function () { setPh("go"); }, 1100); }} />
      )}
      {ph === "setbreak" && lastSet && (
        <SetBreak set={lastSet} setNum={sets.length} need={need} setsWon={setsWon} setsLost={setsLost}
          youName={youName} foeName={oppName} eliminated={props.eliminated !== false}
          continueSignal={cont} onContinue={startNextSet} />
      )}
      {isDone && props.isFinal && !finalOutDone && (
        <FinalOutro won={res.w} tierName={props.tierName} youPalette={youPal} foePalette={foePal} foeName={oppName}
          pts={props.titleStakes ? props.titleStakes.pts : null} money={props.titleStakes ? props.titleStakes.money : null} onDone={function () { setFinalOutDone(true); }} />
      )}
      {isDone && (!props.isFinal || finalOutDone) && (
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

        <JoustStage tier={props.tier} cond={props.cond} youKit={props.gear || null} foeKit={props.oppGear || null} you={youPal} foe={foePal} action={joust} verdict={isDone ? (res.w ? "won" : "lost") : null} tierColor={tierColor} />

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

        <CoachBubble text={coachText} />
        {reveal && (<StrikeReveal key={reveal.id} reveal={reveal} />)}
        {/* TIE-BREAK alert: the set is level after three strikes, so one more each until someone pulls ahead */}
        {tieAlert && (
          <motion.div key={"tb-" + tieAlert} initial={{ scale: 2.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: -3 }} transition={{ type: "spring", stiffness: 420, damping: 14 }}
            style={{ position: "absolute", left: 0, right: 0, top: "34%", zIndex: 40, display: "flex", flexDirection: "column", alignItems: "center", pointerEvents: "none" }}>
            <div style={{ background: "repeating-linear-gradient(135deg,#facc15 0 12px,#1c1917 12px 24px)", padding: 4, borderRadius: 10, boxShadow: "0 8px 22px rgba(0,0,0,0.35)", animation: REDUCED_MOTION ? "none" : "pulse 0.4s ease infinite" }}>
              <div style={{ background: "#b91c1c", color: "#fff", fontWeight: 900, fontSize: 24, letterSpacing: 3, padding: "6px 16px", borderRadius: 7, fontStyle: "italic", textShadow: "0 2px 0 #450a0a" }}>⚠ TIE-BREAK!</div>
            </div>
            <div style={{ marginTop: 6, fontSize: 11.5, fontWeight: 900, color: "#7f1d1d", background: "rgba(255,255,255,0.9)", borderRadius: 8, padding: "2px 8px" }}>Dead level — one more strike each</div>
          </motion.div>
        )}
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
            /* Yours: a full-height tick in your score's colour. Hers: a red notch along the bottom edge */
            return (<React.Fragment key={i}>
              <div style={{ position: "absolute", top: 6, bottom: 6, width: 4, left: "calc(" + m.pos + "% - 2px)", background: orbColor(m.sc), borderRadius: 2, opacity: isLast ? 0.95 : 0.5, border: "1px solid rgba(255,255,255,0.7)" }} />
              {m.opos != null && (<div title="Her strike" style={{ position: "absolute", bottom: 1, width: 0, height: 0, left: "calc(" + m.opos + "% - 5px)", borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderBottom: "9px solid #ef4444", opacity: isLast ? 1 : 0.45, filter: "drop-shadow(0 0 2px rgba(0,0,0,0.6))" }} />)}
            </React.Fragment>);
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

      {/* Fixed-size slot: the big round STRIKE button never moves or resizes the page */}
      <div style={{ marginTop: 8, textAlign: "center", height: 124 }}>
        <button
          onPointerDown={function (e) { e.preventDefault(); doStrike(); }}
          disabled={ph !== "go"}
          aria-label="Strike"
          style={{ width: 100, height: 100, borderRadius: "50%", display: "inline-flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
            background: "radial-gradient(circle at 35% 30%,#fca5a5 0%,#ef4444 38%,#b91c1c 75%,#7f1d1d 100%)", color: "#fff", border: "3px solid #450a0a",
            boxShadow: ph === "go" ? "0 6px 0 #450a0a, 0 0 0 5px rgba(239,68,68,0.25), 0 10px 22px rgba(220,38,38,0.45)" : "0 4px 0 #450a0a",
            fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, fontSize: 15, textShadow: "0 2px 0 rgba(0,0,0,0.35)",
            touchAction: "manipulation", WebkitTapHighlightColor: "transparent", animation: ph === "go" && !REDUCED_MOTION ? "pulse 0.5s ease infinite" : "none",
            opacity: ph === "go" ? 1 : 0.45, cursor: ph === "go" ? "pointer" : "default", fontFamily: "inherit" }}>
          <span aria-hidden style={{ fontSize: 26, lineHeight: 1 }}>⚡</span>
          STRIKE
        </button>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>Tap the arena, the button, or press Space</div>
      </div>
    </div>
  );
}
