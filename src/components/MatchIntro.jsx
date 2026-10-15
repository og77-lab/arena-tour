/* ═══ MatchIntro ═══ Full-screen VS splash + 3-2-1-FIGHT countdown before each match */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { playWhoosh, playImpact, playBeep, playFight } from "../sounds";
import { Sparks, vibrate, REDUCED_MOTION } from "./fx";
import { Rider, Face } from "./Rider";

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
      {row("Season points", (y.pts || 0).toLocaleString(), (sc.pts || 0).toLocaleString(), (y.pts || 0) - (sc.pts || 0))}
      {row("Talent", "—", sc.talent, 0)}
      {sc.stats.map(function (s) {
        var head = s.who !== prevWho; prevWho = s.who;
        return (
          <div key={s.label}>
            {head && (<div style={{ textAlign: "center", fontSize: 10, fontWeight: 900, letterSpacing: 2, color: "#fde68a", marginTop: 6 }}>{s.who === "granny" ? "👵 GRANNY" : "🐓 ROOSTER"}</div>)}
            {row(s.icon + " " + s.label, s.you, s.foe, s.you - s.foe, s.label)}
          </div>
        );
      })}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "4px 12px", marginTop: 8, fontSize: 12, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
        <span>Difficulty <b style={{ color: sc.diff.colOnDark }}>{sc.diff.label}</b></span>
        <span>{h.w + h.l === 0 ? "First meeting" : "Head-to-head " + h.w + "–" + h.l}</span>
        {sc.rooster && (<span>🐓 {sc.rooster}</span>)}
      </div>
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

  /* After the slam the intro waits on the tale-of-the-tape card; the countdown only starts when the player is ready */
  useEffect(function () {
    playWhoosh();
    later(function () { playImpact(true); vibrate(35); }, 420);
    later(function () { setStage(function (s) { return s === "slam" ? "scout" : s; }); }, 1500);
    return clearAll;
  }, []);

  function advance() {
    if (stage === "slam") setStage("scout");
    else if (stage === "scout") startCount();
  }

  /* Parent bumps skipSignal on Space/Enter */
  var skipSeen = useRef(props.skipSignal);
  useEffect(function () {
    if (props.skipSignal === skipSeen.current) return;
    skipSeen.current = props.skipSignal;
    advance();
  }, [props.skipSignal]);

  var tierColor = props.tierColor || "#f59e0b";

  return createPortal(
    <motion.div
      onPointerDown={advance}
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

        <AnimatePresence>
          {stage !== "slam" && (
            <motion.div key="dim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", inset: 0, background: stage === "scout" ? "rgba(2,6,23,0.72)" : "radial-gradient(circle,rgba(0,0,0,0.25),rgba(0,0,0,0.7))", zIndex: 6 }} />
          )}
        </AnimatePresence>

        {/* Tale of the tape: waits here until the player is ready */}
        {stage === "scout" && (
          <div style={{ position: "absolute", inset: 0, zIndex: 7, overflowY: "auto", padding: "12px", boxSizing: "border-box", display: "flex" }}>
          {/* margin:auto centres when there's room and scrolls (instead of clipping) on short screens */}
          <div style={{ margin: "auto", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {props.coach && (
              <div style={{ width: "min(100%, 440px)", display: "flex", alignItems: "center", gap: 8, background: "rgba(15,23,42,0.92)", color: "#fff", border: "1.5px solid #fde68a", borderRadius: 12, padding: "7px 10px", fontSize: 13, fontWeight: 800, lineHeight: 1.35, boxSizing: "border-box" }}>
                <span aria-hidden style={{ fontSize: 20 }}>📣</span>
                <span>Coach Hettie: size her up first. Green numbers are where you're stronger, red where she is. Then hit FIGHT!</span>
              </div>
            )}
            {props.scout && (<TaleOfTape scout={props.scout} you={props.you} foe={props.foe} />)}
            <motion.button onClick={function (e) { e.stopPropagation(); startCount(); }} onPointerDown={function (e) { e.stopPropagation(); }}
              initial={{ y: 20, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 380, damping: 18 }}
              style={{ flexShrink: 0, background: "linear-gradient(180deg,#f87171,#dc2626)", color: "#fff", border: "2px solid #450a0a", boxShadow: "0 5px 0 #450a0a", borderRadius: 14, padding: "13px 30px", fontWeight: 900, fontSize: 18, letterSpacing: 2, cursor: "pointer", fontFamily: "inherit", animation: REDUCED_MOTION ? "none" : "pulse 1.3s ease infinite 0.6s" }}>
              ⚔️ READY? FIGHT!
            </motion.button>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 700, letterSpacing: 1.5, flexShrink: 0 }}>TAP THE BUTTON OR PRESS SPACE</div>
          </div>
          </div>
        )}

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

        {stage === "slam" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 0.9 }}
            style={{ position: "absolute", bottom: "3.5%", left: 0, right: 0, textAlign: "center", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: 2, zIndex: 4 }}>
            TAP TO SEE THE SCOUTING REPORT
          </motion.div>
        )}
      </div>
    </motion.div>,
    document.body
  );
}
