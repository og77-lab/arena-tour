/* ═══ MatchOutro ═══ Full-screen victory / elimination sequence after each match */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { bs } from "../models/formulas";
import { playVictoryBig, playDefeatBig, playCrack } from "../sounds";
import { Sparks, CountUp, vibrate, REDUCED_MOTION } from "./fx";
import { Rider } from "./Rider";

const { useState, useEffect } = React;

/* Sits upright for a beat, then the granny topples off her chicken */
function DefeatedRider(props) {
  var _f = useState(false), fallen = _f[0], setFallen = _f[1];
  useEffect(function () { var t = setTimeout(function () { setFallen(true); }, 450); return function () { clearTimeout(t); }; }, []);
  return (<Rider palette={props.palette} width={140} pose={fallen ? "fallen" : "knocked"} hatOff={true} />);
}

function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

/* One chip per set: set averages, ✓ if you took it */
function SetChips(props) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", maxWidth: 340 }}>
      {props.sets.map(function (s, i) {
        var my = Math.round(avg(s.my)), op = Math.round(avg(s.op));
        return (
          <motion.div key={i} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: props.delay + i * 0.08 }}
            style={{ padding: "4px 9px", borderRadius: 20, fontSize: 12, fontWeight: 800, background: s.won ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.18)", border: "1px solid " + (s.won ? "rgba(74,222,128,0.6)" : "rgba(248,113,113,0.6)"), color: "#fff" }}>
            <span style={{ opacity: 0.6, marginRight: 4 }}>SET {i + 1}</span>{my}<span style={{ opacity: 0.5, margin: "0 3px" }}>–</span>{op} {s.won ? "✓" : "✗"}
          </motion.div>
        );
      })}
    </div>
  );
}

function Victory(props) {
  var champion = props.champion;
  var word = champion ? "CHAMPION" : "VICTORY";
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%,#fcd34d 0%,#d97706 13%,#92400e 28%,#451a03 52%,#1c1006 78%,#0c0a09 100%)" }}>
      <div aria-hidden style={{ position: "absolute", left: "50%", top: "34%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg,rgba(255,255,255,0.13) 0deg 7deg,transparent 7deg 18deg)", WebkitMaskImage: "radial-gradient(circle,#000 6%,transparent 38%)", maskImage: "radial-gradient(circle,#000 6%,transparent 38%)", animation: REDUCED_MOTION ? "none" : "spin 18s linear infinite", pointerEvents: "none" }} />
      <motion.div aria-hidden initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }} style={{ position: "absolute", inset: 0, background: "#fff", pointerEvents: "none" }} />
      <Sparks count={30} spread={230} top="30%" delay={0.2} />
      {champion && (<Sparks count={30} spread={300} top="30%" delay={0.75} colors={["#fde68a", "#22c55e", "#38bdf8", "#f472b6"]} />)}

      <div style={{ position: "relative", zIndex: 6, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px", textAlign: "center" }}>
        {champion && (
          <motion.div initial={{ y: -320, rotate: -35, scale: 0.6 }} animate={{ y: 0, rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 13, delay: 0.35 }}
            style={{ fontSize: 54, lineHeight: 1, marginBottom: -6, filter: "drop-shadow(0 0 22px rgba(253,224,71,0.9))" }}>🏆</motion.div>
        )}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4 }}>
          <motion.div initial={{ y: -260, scale: 0.6 }} animate={{ y: 0, scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.05 }}
            style={{ filter: "drop-shadow(0 0 26px rgba(253,224,71,0.75)) drop-shadow(0 6px 0 rgba(0,0,0,0.3))" }}>
            <Rider palette={props.youPalette} width={150} pose="cheer" crown={!champion} />
          </motion.div>
          {props.foePalette && (
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45, duration: 0.35 }}
              style={{ filter: "saturate(0.55) brightness(0.85)", marginBottom: 2 }}>
              <Rider palette={props.foePalette} width={96} pose="fallen" flip={true} />
            </motion.div>
          )}
        </div>
        <div style={{ display: "flex", marginTop: 10 }}>
          {word.split("").map(function (ch, i) {
            return (
              <motion.span key={i} initial={{ scale: 3.2, opacity: 0, y: -24 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 520, damping: 17, delay: 0.25 + i * 0.055 }}
                style={{ display: "inline-block", fontSize: champion ? 42 : 48, fontWeight: 900, fontStyle: "italic", color: "#fff", letterSpacing: 3, textShadow: "0 4px 0 #92400e, 0 0 24px rgba(250,204,21,0.95)" }}>
                {ch}
              </motion.span>
            );
          })}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ marginTop: 16, fontSize: 30, fontWeight: 900, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)", lineHeight: 1.1 }}>
          {props.setsWon}
          <span style={{ opacity: 0.55, margin: "0 10px", fontSize: 22 }}>–</span>
          <span style={{ opacity: 0.75 }}>{props.setsLost}</span>
        </motion.div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 700, letterSpacing: 2, marginBottom: 10, textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>SETS · vs {props.foeName} · AVG {Math.round(props.pa)}–{Math.round(props.oa)}</div>
        <SetChips sets={props.sets} delay={0.9} />

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.05, type: "spring", stiffness: 260, damping: 22 }} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#fde68a", fontWeight: 900, letterSpacing: 4 }}>{champion ? "TITLE WON" : props.nextLabel ? "ADVANCING TO" : (props.roundLabel || "MATCH").toUpperCase()}</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", textTransform: "uppercase", letterSpacing: 1.5, textShadow: "0 0 18px rgba(250,204,21,0.8)", animation: REDUCED_MOTION ? "none" : "pulse 1.6s ease infinite 1.4s" }}>
            {champion ? (props.tierName || "The Crown") : props.nextLabel || "Win secured"}
          </div>
        </motion.div>
        {props.stakes && (props.stakes.pts > 0 || props.stakes.money > 0) && (
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.25, type: "spring", stiffness: 400, damping: 18 }}
            style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 10 }}>
            {props.stakes.pts > 0 && (<span style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(253,224,71,0.6)", color: "#fde68a", fontWeight: 900, fontSize: 15 }}><CountUp to={props.stakes.pts} prefix="+" duration={700} delay={1300} /> PTS</span>)}
            {props.stakes.money > 0 && (<span style={{ padding: "5px 12px", borderRadius: 8, background: "rgba(0,0,0,0.35)", border: "1px solid rgba(74,222,128,0.6)", color: "#86efac", fontWeight: 900, fontSize: 15 }}><CountUp to={props.stakes.money} prefix="+$" duration={700} delay={1300} /></span>)}
          </motion.div>
        )}
        {props.footer}
      </div>
    </div>
  );
}

function Defeat(props) {
  var word = props.eliminated ? "ELIMINATED" : "DEFEAT";
  var size = props.eliminated ? 40 : 54;
  var textStyle = { fontSize: size, fontWeight: 900, fontStyle: "italic", letterSpacing: 3, color: "#ef4444", textShadow: "0 4px 0 #450a0a, 0 0 26px rgba(239,68,68,0.7)", whiteSpace: "nowrap", lineHeight: 1.1 };
  var topClip = "polygon(0 0,100% 0,100% 47%,0 60%)", botClip = "polygon(0 60%,100% 47%,100% 100%,0 100%)";
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 38%,#3f0d0d 0%,#1c1917 55%,#050505 100%)", boxShadow: "inset 0 0 180px rgba(220,38,38,0.45)" }}>
      <motion.div aria-hidden initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: "absolute", inset: 0, background: "#7f1d1d", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0 1px,transparent 1px 3px)", pointerEvents: "none" }} />
      <Sparks count={18} spread={170} top="42%" delay={0.55} colors={["#94a3b8", "#ef4444", "#e5e7eb"]} />

      <div style={{ position: "relative", zIndex: 6, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px", textAlign: "center", animation: REDUCED_MOTION ? "none" : "arenaShakeHard 0.5s ease 0.12s" }}>
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
          style={{ filter: "saturate(0.6) drop-shadow(0 0 20px rgba(239,68,68,0.5))" }}>
          <DefeatedRider palette={props.youPalette} />
        </motion.div>
        <motion.div initial={{ scale: 1.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 480, damping: 20, delay: 0.1 }}
          style={{ position: "relative", marginTop: 12 }}>
          <motion.div animate={{ x: -4, y: -3, rotate: -1.2 }} transition={{ delay: 0.62, type: "spring", stiffness: 300, damping: 14 }} style={Object.assign({ clipPath: topClip }, textStyle)}>{word}</motion.div>
          <motion.div animate={{ x: 7, y: 5, rotate: 2.2 }} transition={{ delay: 0.62, type: "spring", stiffness: 300, damping: 14 }} style={Object.assign({ clipPath: botClip, position: "absolute", left: 0, top: 0 }, textStyle)}>{word}</motion.div>
          <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", left: -6, right: -6, top: 0, width: "calc(100% + 12px)", height: "100%", overflow: "visible", pointerEvents: "none" }}>
            <motion.polyline points="0,60 22,55 31,62 48,51 63,56 79,48 100,47" fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0, opacity: 1 }} animate={{ pathLength: 1, opacity: [1, 1, 0] }} transition={{ delay: 0.5, duration: 0.5, times: [0, 0.4, 1] }}
              style={{ filter: "drop-shadow(0 0 4px #fff)" }} />
          </svg>
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}
          style={{ fontSize: 14, color: "#fca5a5", fontWeight: 800, marginTop: 10, letterSpacing: 0.5 }}>
          {props.eliminated ? "Knocked out in the " + (props.roundLabel || "tournament") : props.foeName + " takes this one"}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.95 }}
          style={{ marginTop: 6, fontSize: 28, fontWeight: 900, color: "#e5e7eb" }}>
          <span style={{ opacity: 0.75 }}>{props.setsWon}</span><span style={{ opacity: 0.4, margin: "0 10px", fontSize: 20 }}>–</span><span style={{ color: "#f87171" }}>{props.setsLost}</span>
        </motion.div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontWeight: 700, letterSpacing: 2, marginBottom: 10 }}>SETS · vs {props.foeName} · AVG {Math.round(props.pa)}–{Math.round(props.oa)}</div>
        <SetChips sets={props.sets} delay={1.05} />
        {props.footer}
      </div>
    </div>
  );
}

export default function MatchOutro(props) {
  var _ready = useState(false), ready = _ready[0], setReady = _ready[1];
  var won = props.won;

  useEffect(function () {
    var crack = null;
    if (won) { playVictoryBig(); vibrate(props.champion ? [40, 60, 40, 60, 120] : [30, 50, 80]); }
    else { playDefeatBig(); vibrate([120, 60, 200]); crack = setTimeout(playCrack, 500); }
    var t = setTimeout(function () { setReady(true); }, 1200);
    return function () { clearTimeout(t); clearTimeout(crack); };
  }, []);

  var footer = (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={ready ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }} transition={{ duration: 0.25 }} style={{ marginTop: 18 }}>
      {props.story && (<div style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", fontStyle: "italic", maxWidth: 300, margin: "0 auto 12px", lineHeight: 1.4 }}>{props.story}</div>)}
      <button onClick={function () { if (ready) props.onContinue(); }} disabled={!ready}
        style={Object.assign({}, bs(won ? "linear-gradient(135deg,#fde68a,#facc15,#f59e0b)" : "linear-gradient(135deg,#e5e7eb,#9ca3af)", "#111"), { fontSize: 16, padding: "13px 30px", boxShadow: won ? "0 6px 24px rgba(250,204,21,0.55)" : "0 6px 20px rgba(0,0,0,0.5)" })}>
        {won ? (props.champion ? "🏆 Lift the trophy" : props.nextLabel ? "Next match →" : "Continue →") : "Continue →"}
      </button>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 6, letterSpacing: 1.5 }}>OR PRESS SPACE</div>
    </motion.div>
  );

  var inner = won
    ? (<Victory {...props} footer={footer} />)
    : (<Defeat {...props} footer={footer} />);

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", userSelect: "none", WebkitUserSelect: "none" }}>
      {inner}
    </motion.div>,
    document.body
  );
}
