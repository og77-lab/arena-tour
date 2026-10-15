/* ═══ MatchIntro ═══ Full-screen VS splash + 3-2-1-FIGHT countdown before each match */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { playWhoosh, playImpact, playBeep, playFight } from "../sounds";
import { Sparks, vibrate, REDUCED_MOTION } from "./fx";
import { Rider } from "./Rider";

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
      style={{ position: "absolute", width: "52%", textAlign: left ? "left" : "right", top: left ? "17%" : undefined, bottom: left ? undefined : "17%", left: left ? "6%" : undefined, right: left ? undefined : "6%", zIndex: 3 }}>
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

export default function MatchIntro(props) {
  var _stage = useState("slam"), stage = _stage[0], setStage = _stage[1];
  var _n = useState(3), n = _n[0], setN = _n[1];
  var timers = useRef([]);
  var doneRef = useRef(props.onDone);
  doneRef.current = props.onDone;

  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }
  function clearAll() { timers.current.forEach(clearTimeout); timers.current = []; }

  function startCount() {
    clearAll();
    setStage("count"); setN(3); playBeep();
    later(function () { setN(2); playBeep(); }, 520);
    later(function () { setN(1); playBeep(); }, 1040);
    later(function () { setN(0); playFight(); vibrate([30, 40, 60]); }, 1560);
    later(function () { setStage("out"); }, 2080);
    later(function () { doneRef.current(); }, 2330);
  }

  useEffect(function () {
    playWhoosh();
    later(function () { playImpact(true); vibrate(35); }, 420);
    later(startCount, 1600);
    return clearAll;
  }, []);

  /* Parent bumps skipSignal on Space/Enter */
  var skipSeen = useRef(props.skipSignal);
  useEffect(function () {
    if (props.skipSignal === skipSeen.current) return;
    skipSeen.current = props.skipSignal;
    if (stage === "slam") startCount();
  }, [props.skipSignal]);

  var tierColor = props.tierColor || "#f59e0b";

  return createPortal(
    <motion.div
      onPointerDown={function () { if (stage === "slam") startCount(); }}
      initial={{ opacity: 0 }}
      animate={stage === "out" ? { opacity: 0, scale: 1.08 } : { opacity: 1, scale: 1 }}
      transition={{ duration: stage === "out" ? 0.25 : 0.12 }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#070b14", overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none", cursor: "pointer" }}>
      <div style={{ position: "absolute", inset: 0, animation: REDUCED_MOTION ? "none" : "arenaShakeHard 0.45s ease 0.42s" }}>
        {/* Diagonal split halves */}
        <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}
          style={{ position: "absolute", inset: 0, clipPath: "polygon(0 0,62% 0,38% 100%,0 100%)", background: "linear-gradient(140deg,#451a03 0%,#92400e 35%,#d97706 75%,#fbbf24 100%)" }} />
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} transition={{ type: "spring", stiffness: 200, damping: 26 }}
          style={{ position: "absolute", inset: 0, clipPath: "polygon(62% 0,100% 0,100% 100%,38% 100%)", background: "linear-gradient(220deg,#0f172a 0%,#1e293b 40%,#7f1d1d 100%)" }} />
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
          <motion.div initial={{ scale: 4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: stage === "slam" ? 1 : 0.12, rotate: 0 }}
            transition={{ delay: stage === "slam" ? 0.4 : 0, type: "spring", stiffness: 420, damping: 16 }}
            style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0" }}>
            <div style={{ transform: "translate(-50%,-50%)", fontSize: 76, fontWeight: 900, fontStyle: "italic", letterSpacing: -2, lineHeight: 1.1, whiteSpace: "nowrap", color: "#fffbeb", textShadow: "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 6px 0 #b45309, 0 8px 0 #7c2d12, 0 0 26px rgba(250,204,21,0.85)" }}>VS</div>
          </motion.div>
        </div>
        <Sparks count={22} delay={0.42} spread={190} zIndex={4} />

        {/* Countdown */}
        <AnimatePresence>
          {stage !== "slam" && (
            <motion.div key="dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0, background: "radial-gradient(circle,rgba(0,0,0,0.25),rgba(0,0,0,0.7))", zIndex: 6 }} />
          )}
        </AnimatePresence>
        {stage !== "slam" && (
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

        {stage === "slam" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.9 }}
            style={{ position: "absolute", bottom: "3.5%", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 2, zIndex: 4 }}>
            TAP OR PRESS SPACE TO SKIP
          </motion.div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
