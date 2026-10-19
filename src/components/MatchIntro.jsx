/* ═══ MatchIntro ═══ Before each match: the scouting report first (take your time), then — on your word — the full
   VS splash and 3-2-1-FIGHT countdown in one uninterrupted run */

import * as React from "react";
import Icon, { StatIcon } from "./Icons";
import { LaneRow } from "./Lanes";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { playWhoosh, playImpact, playBeep, playFight, playFightVoice, preloadFightVoice } from "../sounds";
import { Sparks, vibrate, REDUCED_MOTION } from "./fx";
import { Rider, Face } from "./Rider";
import FinalReveal from "./FinalReveal";
import SlamIntro from "./SlamIntro";
import MastersIntro from "./MastersIntro";

const { useState, useEffect, useRef } = React;

function FighterBlock(props) {
  var left = props.side === "left";
  var _run = useState(true), running = _run[0], setRunning = _run[1];
  useEffect(function () { var t = setTimeout(function () { setRunning(false); }, 650); return function () { clearTimeout(t); }; }, []);
  return (
    <motion.div
      initial={{ x: left ? -260 : 260, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: left ? 0.12 : 0.22 }}
      style={{ position: "absolute", width: "52%", textAlign: left ? "left" : "right", top: left ? "15%" : undefined, bottom: left ? undefined : props.raised ? "25%" : "17%", left: left ? "6%" : undefined, right: left ? undefined : "6%", zIndex: 3 }}>
      <div style={{ display: "inline-block", filter: left ? "drop-shadow(0 0 18px rgba(250,204,21,0.55))" : "drop-shadow(0 0 18px rgba(239,68,68,0.5))" }}>
        <Rider palette={props.palette} width={128} flip={!left} pose={running ? "charge" : "idle"} running={running} />
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: 1, marginTop: 4, lineHeight: 1.05, textShadow: "0 3px 0 rgba(0,0,0,0.35), 0 0 18px rgba(0,0,0,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {!left && props.emoji ? props.emoji + " " : ""}{props.name}
      </div>
      {props.sub && (<div style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)", marginTop: 3, letterSpacing: 0.5 }}>{props.sub}</div>)}
    </motion.div>
  );
}

/* Side-by-side comparison of the two riders: what each brings into this match */
function TaleOfTape(props) {
  var _acc = useState(false), accInfo = _acc[0], setAccInfo = _acc[1];
  var sc = props.scout, y = sc.you || {};
  var h = sc.h2h || { w: 0, l: 0 };
  var GOOD = "#4ade80", BAD = "#f87171", MID = "rgba(255,255,255,0.85)";
  function row(label, mine, hers, better, key) {
    return (
      <div key={key || label} style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, padding: "clamp(1px, 0.7vh, 5px) 0", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        <span style={{ textAlign: "right", fontWeight: 900, fontSize: 15, color: better > 0 ? GOOD : better < 0 ? MID : MID }}>{mine}</span>
        <span style={{ fontSize: 10.5, fontWeight: 900, letterSpacing: 1.2, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", textAlign: "center", minWidth: 104 }}>{label}</span>
        <span style={{ textAlign: "left", fontWeight: 900, fontSize: 15, color: better < 0 ? BAD : MID }}>{hers}</span>
      </div>
    );
  }
  var prevWho = null;
  return (
    <motion.div onPointerDown={function (e) { e.stopPropagation(); }}
      initial={{ y: 24, opacity: 0, scale: 0.95 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{ width: "min(100%, 440px)", flexShrink: 0, background: "rgba(15,23,42,0.96)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 16, padding: "10px 14px 10px", boxSizing: "border-box", color: "#fff", boxShadow: "0 18px 40px rgba(0,0,0,0.5)" }}>
      {sc.rival && (
        <motion.div initial={{ scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 400, damping: 14 }}
          style={{ textAlign: "center", margin: "-2px auto 8px", background: "linear-gradient(90deg,#9f1239,#e11d48,#9f1239)", borderRadius: 10, padding: "5px 10px", fontWeight: 900, fontSize: 13, letterSpacing: 2, color: "#fff", boxShadow: "0 3px 0 #4c0519" }}>
          😤 YOUR ARCH-RIVAL · {h.w}–{h.l}
          <div style={{ fontSize: 10.5, letterSpacing: 0.5, fontWeight: 800, opacity: 0.9 }}>{h.w > h.l ? "You lead the feud — keep the boot on her neck" : h.w < h.l ? "She's got your number. Time for revenge." : "All square. Somebody has to blink."}</div>
        </motion.div>
      )}
      {sc.cond && (<div style={{ margin: "0 0 6px", padding: "4px 6px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}>
        <LaneRow cond={sc.cond} w={36} h={28} dark={true} compact={true} label="Today:" verdict={sc.laneV || null} />
      </div>)}
      <div style={{ textAlign: "center", fontSize: 10, fontWeight: 900, letterSpacing: 3, color: "#fde68a" }}>TALE OF THE TAPE</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 8, margin: "6px 0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, justifyContent: "flex-end", minWidth: 0 }}>
          <span style={{ fontWeight: 900, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{props.you.name}</span>
          <Face palette={props.you.palette} size={40} />
        </div>
        <span style={{ fontWeight: 900, fontStyle: "italic", color: "#fbbf24", fontSize: 16 }}>VS</span>
        <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
          <Face palette={props.foe.palette} size={40} />
          <span style={{ fontWeight: 900, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sc.emoji} {sc.name}{sc.standing ? " " + sc.standing.icon : ""}</span>
        </div>
      </div>
      {row("World rank", y.rank ? "#" + y.rank : "—", "#" + sc.rank, y.rank && sc.rank ? sc.rank - y.rank : 0)}
      <div onClick={function (e) { e.stopPropagation(); setAccInfo(!accInfo); }} style={{ cursor: "pointer" }}>{row("Accuracy ⓘ", y.hands != null ? y.hands : "—", sc.hands != null ? sc.hands : sc.talent, y.hands != null && sc.hands != null ? y.hands - sc.hands : 0)}</div>
      {accInfo && (<div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)", textAlign: "center", padding: "3px 6px 5px", lineHeight: 1.35 }}>How close to the centre a rider usually stops: 20 a beginner · 50 an average practised player · 90 elite. Yours is measured from your last 200 strikes; hers is her talent.</div>)}
      {sc.bars && row("Gold zone today", sc.bars.you.zone.toFixed(1) + "%", sc.bars.foe.zone.toFixed(1) + "%", Math.round((sc.bars.you.zone - sc.bars.foe.zone) * 10))}
      {sc.bars && row("Bar speed today", Math.round(sc.bars.you.speed) + "%", Math.round(sc.bars.foe.speed) + "%", Math.round(sc.bars.foe.speed - sc.bars.you.speed))}
      {sc.stats.map(function (s) {
        var head = s.who !== prevWho; prevWho = s.who;
        return (
          <div key={s.label}>
            {head && (<div style={{ textAlign: "center", fontSize: 10, fontWeight: 900, letterSpacing: 2, color: "#fde68a", marginTop: 6 }}>{s.who === "granny" ? "👵 GRANNY" : s.who === "fitness" ? "💪 FITNESS TODAY" : s.who === "crowd" ? "📣 THE STANDS" : "🐓 ROOSTER"}</div>)}
            {row(s.k ? (<span><StatIcon k={s.k} size={14} style={{ verticalAlign: "-2px", marginRight: 3 }} />{s.label}</span>) : s.icon + " " + s.label, s.you, s.foe, s.you - s.foe, s.label)}
          </div>
        );
      })}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px", marginTop: 8, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
        <span>Difficulty <b style={{ color: sc.diff.colOnDark }}>{sc.diff.label}</b></span>
        <span>{h.w + h.l === 0 ? "First meeting" : "Head-to-head " + h.w + "–" + h.l}</span>
        {sc.rooster && (<span>🐓 {sc.rooster}</span>)}
        {sc.kit && (<span>Her kit {sc.kit}</span>)}
        {(sc.injuries || []).map(function (t) { return (<span key={t} style={{ color: "#fca5a5", flexBasis: "100%", textAlign: "center" }}>🩹 {t}</span>); })}
      </div>
    </motion.div>
  );
}

export default function MatchIntro(props) {
  var _stage = useState(props.scout ? "scout" : "slam"), stage = _stage[0], setStage = _stage[1];
  /* Warm up the announcer clip while the scouting report is on screen */
  useEffect(function () { preloadFightVoice(); }, []);
  var _n = useState(3), n = _n[0], setN = _n[1];
  var timers = useRef([]);
  var doneRef = useRef(props.onDone);
  doneRef.current = props.onDone;

  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }
  function clearAll() { timers.current.forEach(clearTimeout); timers.current = []; }

  function startCount() {
    clearAll();
    setStage("count"); setN(3); playBeep();
    later(function () { setN(2); playBeep(); }, 800);
    later(function () { setN(1); playBeep(); }, 1600);
    later(function () { setN(0); playFight(); playFightVoice(); vibrate([30, 40, 60]); }, 2400);
    later(function () { setStage("out"); }, 3050);
    later(function () { doneRef.current(); }, 3300);
  }

  /* The cinematic: riders charge in, the VS slams, and the countdown follows straight on — nothing to tap, nothing in the way */
  function startCinematic() {
    clearAll();
    setStage("slam"); playWhoosh(); preloadFightVoice();
    later(function () { playImpact(true); vibrate(35); }, 420);
    later(startCount, 2700);   /* time to read who she is and what she says */
  }
  useEffect(function () {
    if (!props.scout) startShow();
    return clearAll;
  }, []);

  /* A final gets its own build-up first (trophy, your road, the opponent revealed), then the usual VS and countdown */
  function startShow() { clearAll(); if (props.isFinal && !props.resumeSet) setStage("final"); else if (props.isSlam && !props.resumeSet) setStage("slamIntro"); else if (props.isMasters && !props.resumeSet) setStage("mastersIntro"); else startCinematic(); }

  /* Only the scouting report waits for the player */
  function advance() { if (stage === "scout") startShow(); }

  /* Parent bumps skipSignal on Space/Enter */
  var skipSeen = useRef(props.skipSignal);
  useEffect(function () {
    if (props.skipSignal === skipSeen.current) return;
    skipSeen.current = props.skipSignal;
    advance();
  }, [props.skipSignal]);

  var tierColor = props.tierColor || "#f59e0b";
  /* Every tier up adds a little pomp to the VS: more sparks, camera flashes from Tour 250, a gleam and a second shockwave from Tour 500 */
  var tier = Math.max(0, Math.min(5, props.tier == null ? 0 : props.tier));

  return createPortal(
    <motion.div
      onPointerDown={advance}
      initial={{ opacity: 0 }}
      animate={stage === "out" ? { opacity: 0, scale: 1.08 } : { opacity: 1, scale: 1 }}
      transition={{ duration: stage === "out" ? 0.25 : 0.12 }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#070b14", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none", cursor: stage === "scout" ? "pointer" : "default" }}>
      {/* 1 · Scouting report on a quiet backdrop */}
      {stage === "scout" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 7, overflowY: "auto", padding: "12px", boxSizing: "border-box", display: "flex",
          background: "radial-gradient(circle at 50% 30%,#1e293b 0%,#0b1120 70%)" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.03) 0 2px,transparent 2px 22px)", pointerEvents: "none" }} />
          {/* margin:auto centres when there's room and scrolls (instead of clipping) on short screens */}
          <div style={{ margin: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative" }}>
            <div style={{ textAlign: "center" }}>
              {props.tierName && (<div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 5, color: "#fde68a", textTransform: "uppercase" }}>{props.tierName}</div>)}
              <div style={{ fontSize: 13, fontWeight: 900, letterSpacing: 3, color: "#fff", textTransform: "uppercase", marginTop: 3 }}>
                {props.roundLabel || "Match"} · {props.resumeSet ? "resuming set " + props.resumeSet : "best of " + (props.bestOf || 3) + " sets"}
              </div>
            </div>
            {props.coach && (
              <div style={{ width: "min(100%, 440px)", display: "flex", alignItems: "center", gap: 8, background: "rgba(15,23,42,0.92)", color: "#fff", border: "1.5px solid #fde68a", borderRadius: 12, padding: "7px 10px", fontSize: 13, fontWeight: 800, lineHeight: 1.35, boxSizing: "border-box" }}>
                <span aria-hidden style={{ fontSize: 20 }}>📣</span>
                <span>Coach Hettie: size her up first. Green numbers are where you're stronger, red where she is. Then send the riders out!</span>
              </div>
            )}
            <TaleOfTape scout={props.scout} you={props.you} foe={props.foe} />
            <motion.button onClick={function (e) { e.stopPropagation(); startShow(); }} onPointerDown={function (e) { e.stopPropagation(); }}
              initial={{ y: 20, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 380, damping: 18 }}
              style={{ flexShrink: 0, background: "linear-gradient(180deg,#f87171,#dc2626)", color: "#fff", border: "2px solid #450a0a", boxShadow: "0 5px 0 #450a0a", borderRadius: 14, padding: "13px 30px", fontWeight: 900, fontSize: 18, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", animation: REDUCED_MOTION ? "none" : "pulse 1.3s ease infinite 0.6s" }}>
              {props.isFinal ? "🏆 TO THE FINAL!" : "⚔️ TO THE LANES!"}
            </motion.button>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 700, letterSpacing: 1.5, flexShrink: 0 }}>TAP THE BUTTON OR PRESS SPACE</div>
          </div>
        </div>
      )}

      {stage === "slamIntro" && (<SlamIntro you={props.you} foe={props.foe} roundLabel={props.roundLabel} slamLabel={props.tierName} onDone={startCinematic} />)}
      {stage === "mastersIntro" && (<MastersIntro you={props.you} foe={props.foe} roundLabel={props.roundLabel} eventLabel={props.tierName} onDone={startCinematic} />)}
      {stage === "final" && (<FinalReveal you={props.you} foe={props.foe} scout={props.scout} road={props.road} tierName={props.tierName} oppId={props.oppId} onDone={startCinematic} />)}

      {/* 2 · The cinematic, mounted fresh so every animation plays from the start */}
      {stage !== "scout" && stage !== "final" && stage !== "slamIntro" && stage !== "mastersIntro" && (
      <div style={{ position: "absolute", inset: 0, animation: REDUCED_MOTION ? "none" : "arenaShakeHard 0.45s ease 0.42s" }}>
        {/* Diagonal split halves */}
        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}
          style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0,62% 0,38% 100%,0 100%)", background: "linear-gradient(140deg,#451a03 0%,#92400e 35%,#d97706 75%,#fbbf24 100%)" }} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}
          style={{ position: "absolute", inset: 0, clipPath: "polygon(62% 0,100% 0,100% 100%,38% 100%)", background: "linear-gradient(220deg,#0f172a 0%,#1e293b 40%,#7f1d1d 100%)" }} />
        {/* Camera flashes in the dark from Tour 250 up */}
        {tier >= 2 && !REDUCED_MOTION && Array.from({ length: tier * 3 }).map(function (_, i) {
          return (<div key={"cf" + i} aria-hidden style={{ position: "absolute", left: (4 + (i * 37) % 92) + "%", top: (8 + (i * 23) % 80) + "%", width: 5, height: 5, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff", opacity: 0, zIndex: 1,
            animation: "camFlash " + (1.5 + (i % 4) * 0.4).toFixed(2) + "s ease-out " + (0.5 + (i % 5) * 0.21).toFixed(2) + "s infinite" }} />);
        })}
        {/* Speed lines */}
        <div aria-hidden style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.04) 0 2px,transparent 2px 22px)", pointerEvents: "none" }} />
        {/* Lightning seam */}
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 2, pointerEvents: "none", overflow: "visible" }}>
          <motion.polyline points="62,0 54,30 58,34 47,62 51,65 38,100" fill="none" stroke="#fff" strokeWidth="3" vectorEffect="non-scaling-stroke" strokeLinejoin="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: [0, 1, 1, 0.75] }}
            transition={{ duration: 0.28, delay: 0.38, ease: "easeIn" }}
            style={{ filter: "drop-shadow(0 0 6px #fff) drop-shadow(0 0 14px " + tierColor + ")" }} />
        </svg>

        {/* Event title */}
        <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 300, damping: 24 }}
          style={{ position: "absolute", top: "4.5%", left: 0, right: 0, textAlign: "center", zIndex: 4 }}>
          {props.tierName && (<div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 5, color: "#fde68a", textTransform: "uppercase", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>{props.tierName}</div>)}
          <div style={{ display: "inline-block", marginTop: 5, padding: "4px 16px", background: tierColor, color: "#fff", fontSize: 15, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", borderRadius: 4, transform: "skewX(-12deg)", boxShadow: "0 4px 16px rgba(0,0,0,0.5)" }}>
            <span style={{ display: "inline-block", transform: "skewX(12deg)" }}>{props.roundLabel || "Match"}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "rgba(255,255,255,0.8)", textShadow: "0 2px 6px rgba(0,0,0,0.6)" }}>
            {props.resumeSet ? "RESUMING · SET " + props.resumeSet : "BEST OF " + (props.bestOf || 3) + " SETS"}
          </div>
        </motion.div>

        <FighterBlock side="left" name={props.you.name} emoji={props.you.emoji} sub={props.you.sub} palette={props.you.palette} />
        <FighterBlock side="right" name={props.foe.name} emoji={props.foe.emoji} sub={props.foe.sub} palette={props.foe.palette} />

        {/* VS slam */}
        <div style={{ position: "absolute", left: "50%", top: "50%", zIndex: 5 }}>
          <motion.div aria-hidden initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 9, opacity: 0 }} transition={{ delay: 0.42, duration: 0.6, ease: "easeOut" }}
            style={{ position: "absolute", width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: "50%", border: "4px solid #fff" }} />
          {tier >= 3 && (<motion.div aria-hidden initial={{ scale: 0, opacity: 0.9 }} animate={{ scale: 12, opacity: 0 }} transition={{ delay: 0.55, duration: 0.75, ease: "easeOut" }}
            style={{ position: "absolute", width: 40, height: 40, marginLeft: -20, marginTop: -20, borderRadius: "50%", border: "3px solid " + tierColor }} />)}
          <motion.div initial={{ scale: 4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: stage === "slam" ? 1 : 0.12, rotate: 0 }}
            transition={{ delay: stage === "slam" ? 0.4 : 0, type: "spring", stiffness: 420, damping: 16 }}
            style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0" }}>
            <div style={{ transform: "translate(-50%,-50%)", fontSize: 76, fontWeight: 900, fontStyle: "italic", letterSpacing: -2, lineHeight: 1.1, whiteSpace: "nowrap", color: "#fffbeb", textShadow: "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 6px 0 #b45309, 0 8px 0 #7c2d12, 0 0 26px rgba(250,204,21,0.85)", position: "relative", overflow: "hidden" }}>VS
              {tier >= 3 && !REDUCED_MOTION && (<motion.span aria-hidden initial={{ x: "-160%" }} animate={{ x: "160%" }} transition={{ delay: 0.9, duration: 0.7, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.75) 48%,transparent 66%)", mixBlendMode: "overlay" }} />)}
            </div>
          </motion.div>
        </div>
        <Sparks count={14 + tier * 5} delay={0.42} spread={170 + tier * 14} zIndex={4} colors={tier >= 4 ? ["#facc15", "#fde68a", "#ffffff", tierColor] : undefined} />

        <AnimatePresence>
          {(stage === "count" || stage === "out") && (
            <motion.div key="dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0, background: "radial-gradient(circle,rgba(0,0,0,0.25),rgba(0,0,0,0.7))", zIndex: 6 }} />
          )}
        </AnimatePresence>

        {/* Countdown */}
        {(stage === "count" || stage === "out") && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 7, pointerEvents: "none" }}>
            <AnimatePresence mode="popLayout">
              <motion.div key={n}
                initial={{ scale: 2.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                style={n === 0
                  ? { fontSize: 82, lineHeight: 1.15, fontWeight: 900, fontStyle: "italic", letterSpacing: 2, color: "#fff1f2", textShadow: "0 2px 0 #fca5a5, 0 4px 0 #ef4444, 0 6px 0 #b91c1c, 0 8px 0 #450a0a, 0 0 34px rgba(239,68,68,0.95)", whiteSpace: "nowrap" }
                  : { fontSize: 130, fontWeight: 900, color: "#fff", textShadow: "0 6px 0 #92400e, 0 0 40px rgba(250,204,21,0.9)", lineHeight: 1 }}>
                {n === 0 ? (<div style={{ animation: REDUCED_MOTION ? "none" : "arenaShakeHard 0.4s ease" }}>FIGHT!</div>) : n}
              </motion.div>
            </AnimatePresence>
            {n === 0 && (<Sparks key="fight-sparks" count={26} spread={220} colors={["#ef4444", "#facc15", "#ffffff"]} zIndex={8} />)}
          </div>
        )}

      </div>
      )}
    </motion.div>,
    document.body
  );
}
