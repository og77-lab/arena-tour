/* ═══ SetBreak ═══ Full-screen interlude between sets: set verdict, set score, stats, what's at stake next */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { bs } from "../models/formulas";
import { playVictory, playDefeat, playImpact, playHeartbeat } from "../sounds";
import { Sparks, CountUp, vibrate, REDUCED_MOTION } from "./fx";

const { useState, useEffect } = React;

function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

/* Row of set pips: filled = set won */
function Pips(props) {
  var out = [];
  for (var i = 0; i < props.need; i++) {
    var on = i < props.count;
    out.push(<span key={i} style={{ display: "inline-block", width: 12, height: 12, borderRadius: "50%", margin: "0 3px", background: on ? props.color : "rgba(255,255,255,0.12)", border: "2px solid " + (on ? props.color : "rgba(255,255,255,0.3)"), boxShadow: on ? "0 0 8px " + props.color : "none" }} />);
  }
  return (<div>{out}</div>);
}

export default function SetBreak(props) {
  var set = props.set;           /* { my: [..3], op: [..3], won } */
  var setNum = props.setNum;     /* number of the set just finished */
  var won = set.won;
  var need = props.need, w = props.setsWon, l = props.setsLost;
  var myAvg = avg(set.my), opAvg = avg(set.op), margin = myAvg - opAvg;
  /* Sets are decided on total points (a tie goes to tie-break strikes), so that is what we show */
  var mySum = set.my.reduce(function (a, b) { return a + b; }, 0), opSum = set.op.reduce(function (a, b) { return a + b; }, 0), by = Math.abs(mySum - opSum);
  var perfects = set.my.filter(function (s) { return s >= 85; }).length;
  var best = Math.round(Math.max.apply(null, set.my));
  var _ready = useState(false), ready = _ready[0], setReady = _ready[1];

  var line = won
    ? (margin > 15 ? "Total domination." : margin > 6 ? "A convincing set." : "Edge-of-your-seat stuff — just squeaked it!")
    : (margin < -15 ? "Ouch. They ran you over in that one." : margin < -6 ? "They had the upper hand this set." : "Lost by a whisker!");

  var next;
  if (w === need - 1 && l === need - 1) next = { tag: "DECIDING SET", sub: "Winner takes all", col: "#ef4444" };
  else if (w === need - 1) next = { tag: "MATCH POINT", sub: "Win this set to take the match", col: "#facc15" };
  else if (l === need - 1) next = { tag: "ON THE BRINK", sub: props.eliminated ? "Lose this set and you're out" : "Lose this set and the match is theirs", col: "#ef4444" };
  else next = { tag: "SET " + (setNum + 1), sub: "Bar resets — but fatigue builds", col: "#e5e7eb" };
  var tense = next.col === "#ef4444";

  useEffect(function () {
    playImpact(false);
    var t1 = setTimeout(function () { won ? playVictory() : playDefeat(); }, 150);
    var t2 = setTimeout(function () { if (tense) playHeartbeat(); }, 1100);
    var t3 = setTimeout(function () { setReady(true); }, 1000);
    vibrate(won ? [25, 40, 25] : [60, 40, 60]);
    return function () { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  /* Parent forwards Space/Enter via continueSignal */
  useEffect(function () { if (props.continueSignal && ready) props.onContinue(); }, [props.continueSignal]);

  var accent = won ? "#facc15" : "#ef4444";
  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}
      onPointerDown={function () { if (ready) props.onContinue(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden", cursor: ready ? "pointer" : "default", userSelect: "none", WebkitUserSelect: "none", touchAction: "manipulation", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        background: won ? "radial-gradient(circle at 50% 30%,#92400e 0%,#3b1d06 45%,#0c0a09 100%)" : "radial-gradient(circle at 50% 30%,#4c0519 0%,#1f0a0a 45%,#050505 100%)" }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(115deg,rgba(255,255,255,0.03) 0 2px,transparent 2px 22px)" }} />
      {won && (<Sparks count={18} spread={170} top="27%" delay={0.15} />)}

      <div style={{ position: "relative", zIndex: 3, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px", textAlign: "center" }}>
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={{ fontSize: 11, fontWeight: 900, letterSpacing: 5, color: "rgba(255,255,255,0.85)" }}>
          END OF SET {setNum}
        </motion.div>

        <motion.div initial={{ scale: 2.8, opacity: 0, rotate: -14 }} animate={{ scale: 1, opacity: 1, rotate: -5 }} transition={{ type: "spring", stiffness: 480, damping: 16, delay: 0.05 }}
          style={{ marginTop: 10, padding: "6px 22px", border: "4px solid " + accent, color: accent, fontSize: 34, fontWeight: 900, letterSpacing: 4, borderRadius: 8, background: "rgba(0,0,0,0.35)", textShadow: "0 0 18px " + accent, animation: REDUCED_MOTION ? "none" : "arenaShake 0.35s ease 0.2s" }}>
          {won ? "SET WON" : "SET LOST"}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ marginTop: 14, fontSize: 26, fontWeight: 900, color: "#fff" }}>
          <span style={{ color: "#fde68a" }}><CountUp to={Math.round(myAvg)} duration={500} delay={350} /></span>
          <span style={{ opacity: 0.4, margin: "0 10px", fontSize: 18 }}>–</span>
          <span style={{ color: "#fca5a5" }}><CountUp to={Math.round(opAvg)} duration={500} delay={350} /></span>
        </motion.div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: 2 }}>SET AVERAGE{set.my.length > 3 ? " · AFTER TIE-BREAK" : ""}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 6 }}>
          {perfects > 0 ? perfects + " perfect " + (perfects === 1 ? "strike" : "strikes") + " · " : ""}Best strike {best}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", fontStyle: "italic", marginTop: 6 }}>{line}</div>

        {/* Set scoreboard */}
        <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.55, type: "spring", stiffness: 380, damping: 20 }}
          style={{ marginTop: 18, padding: "10px 18px", borderRadius: 12, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#fde68a", fontWeight: 900, letterSpacing: 1.5, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{props.youName}</div>
            <Pips need={need} count={w} color="#facc15" />
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{w}<span style={{ opacity: 0.4, margin: "0 6px" }}>–</span>{l}</div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#fca5a5", fontWeight: 900, letterSpacing: 1.5, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{props.foeName}</div>
            <Pips need={need} count={l} color="#ef4444" />
          </div>
        </motion.div>

        {/* What's at stake next */}
        <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.85, type: "spring", stiffness: 260, damping: 22 }} style={{ marginTop: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 900, fontStyle: "italic", letterSpacing: 2, color: next.col, textShadow: "0 0 18px " + next.col, animation: tense && !REDUCED_MOTION ? "pulse 0.9s ease infinite 1s" : "none" }}>{next.tag}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 700, marginTop: 2 }}>{next.sub}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }} transition={{ duration: 0.2 }} style={{ marginTop: 18 }}>
          <button onClick={function () { if (ready) props.onContinue(); }}
            style={Object.assign({}, bs(tense ? "linear-gradient(135deg,#f87171,#dc2626)" : "linear-gradient(135deg,#fde68a,#f59e0b)", tense ? "#fff" : "#111"), { fontSize: 15, padding: "12px 26px" })}>
            Start set {setNum + 1} →
          </button>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 6, letterSpacing: 1.5 }}>TAP OR PRESS SPACE</div>
        </motion.div>
      </div>
    </motion.div>,
    document.body
  );
}
