/* ═══ MatchOutro ═══ Full-screen victory / elimination sequence after each match */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { bs } from "../models/formulas";
import { playVictoryBig, playDefeatBig, playCrack, playCrowdRoar } from "../sounds";
import { Sparks, CountUp, vibrate, REDUCED_MOTION } from "./fx";
import { Rider } from "./Rider";

var DISPLAY = "'Fredoka', 'Nunito', sans-serif";

const { useState, useEffect } = React;

/* Sits upright for a beat, then the granny topples off her chicken */
function DefeatedRider(props) {
  var _f = useState(false), fallen = _f[0], setFallen = _f[1];
  useEffect(function () { var t = setTimeout(function () { setFallen(true); }, 450); return function () { clearTimeout(t); }; }, []);
  return (<Rider palette={props.palette} width={140} pose={fallen ? "fallen" : "knocked"} hatOff={true} />);
}

/* The big events put their badge on the result: a silver MASTERS shield, a gold GRAND SLAM crest */
function Plaque(props) {
  var slam = props.tier >= 5;
  return (
    <motion.div initial={{ y: -30, opacity: 0, scale: 1.3 }} animate={{ y: 0, opacity: props.dim ? 0.75 : 1, scale: 1 }} transition={{ delay: props.delay || 0.15, type: "spring", stiffness: 340, damping: 18 }}
      style={{ marginBottom: 10, padding: "4px 16px", borderRadius: slam ? 10 : 4, fontSize: 12, fontWeight: 900, letterSpacing: 4, whiteSpace: "nowrap",
        background: slam ? "linear-gradient(180deg,#fde68a,#f59e0b 60%,#b45309)" : "linear-gradient(180deg,#f8fafc,#cbd5e1 55%,#94a3b8)",
        color: slam ? "#451a03" : "#831843", border: "2px solid " + (slam ? "#78350f" : "#ec4899"), boxShadow: slam ? "0 0 22px rgba(251,191,36,0.6)" : "0 0 18px rgba(236,72,153,0.55)" }}>
      {slam ? "👑 " : "★ "}{String(props.label || (slam ? "Grand Slam" : "Masters")).toUpperCase()}{slam ? " 👑" : " ★"}
    </motion.div>
  );
}

/* Ribbons of confetti drifting down over a big win */
function Confetti(props) {
  if (REDUCED_MOTION) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 4 }}>
      {Array.from({ length: props.count }).map(function (_, i) {
        var c = props.colors[i % props.colors.length];
        return (<div key={i} style={{ position: "absolute", top: 0, left: ((i * 53) % 100) + "%", width: i % 3 ? 6 : 4, height: i % 3 ? 10 : 14, borderRadius: 1, background: c, opacity: 0,
          animation: "confetti-fall " + (2.6 + (i % 5) * 0.45).toFixed(2) + "s linear " + (0.4 + (i % 7) * 0.33).toFixed(2) + "s infinite" }} />);
      })}
    </div>
  );
}

function avg(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

/* One chip per set: set averages, ✓ if you took it */
function SetChips(props) {
  return (
    <div style={{ display: "flex", justifyContent: "center", gap: 6, flexWrap: "wrap", maxWidth: 340 }}>
      {props.sets.map(function (s, i) {
        var my = Math.round(avg(s.my)), op = Math.round(avg(s.op)); /* rounded set averages: that is what decides a set */
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
  var tier = props.tier || 0, masters = tier === 4, slam = tier >= 5;
  /* Masters wins glow pink and silver; everything else stays gold, the Slam with fireworks on top */
  var bg = masters ? "radial-gradient(circle at 50% 30%,#fbcfe8 0%,#ec4899 13%,#9d174d 30%,#4a0f33 54%,#170816 80%,#0c0a09 100%)"
    : "radial-gradient(circle at 50% 30%,#fcd34d 0%,#d97706 13%,#92400e 28%,#451a03 52%,#1c1006 78%,#0c0a09 100%)";
  return (
    <div style={{ position: "absolute", inset: 0, background: bg }}>
      <div aria-hidden style={{ position: "absolute", left: "50%", top: "34%", width: "220vmax", height: "220vmax", marginLeft: "-110vmax", marginTop: "-110vmax", background: "repeating-conic-gradient(from 0deg,rgba(255,255,255,0.13) 0deg 7deg,transparent 7deg 18deg)", WebkitMaskImage: "radial-gradient(circle,#000 6%,transparent 38%)", maskImage: "radial-gradient(circle,#000 6%,transparent 38%)", animation: REDUCED_MOTION ? "none" : "spin 18s linear infinite", pointerEvents: "none" }} />
      <motion.div aria-hidden initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.45 }} style={{ position: "absolute", inset: 0, background: "#fff", pointerEvents: "none" }} />
      {tier >= 2 && !REDUCED_MOTION && Array.from({ length: tier * 3 }).map(function (_, i) {
        return (<div key={"cf" + i} aria-hidden style={{ position: "absolute", left: (3 + (i * 37) % 94) + "%", top: (6 + (i * 29) % 86) + "%", width: 5, height: 5, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff", opacity: 0,
          animation: "camFlash " + (1.6 + (i % 4) * 0.45).toFixed(2) + "s ease-out " + ((i % 6) * 0.25).toFixed(2) + "s infinite" }} />);
      })}
      <Sparks count={24 + tier * 3} spread={210 + tier * 10} top="30%" delay={0.2} colors={masters ? ["#ec4899", "#fbcfe8", "#ffffff", "#cbd5e1"] : undefined} />
      {masters && (<Confetti count={26} colors={["#ec4899", "#f8fafc", "#cbd5e1", "#f9a8d4"]} />)}
      {slam && (<Confetti count={36} colors={["#fbbf24", "#fde68a", "#ffffff", "#ef4444", "#38bdf8"]} />)}
      {slam && [[18, "24%", 0.9], [80, "18%", 1.35], [50, "10%", 1.8], [30, "14%", 2.4], [70, "26%", 2.9]].map(function (f, i) {
        return (<div key={"fw" + i} aria-hidden style={{ position: "absolute", left: f[0] + "%", top: 0, width: 0, height: "100%", pointerEvents: "none" }}>
          <Sparks count={22} spread={90} top={f[1]} delay={f[2]} colors={i % 2 ? ["#fde68a", "#fbbf24", "#ffffff"] : ["#f472b6", "#38bdf8", "#ffffff"]} />
        </div>);
      })}
      {champion && (<Sparks count={30} spread={300} top="30%" delay={0.75} colors={["#fde68a", "#22c55e", "#38bdf8", "#f472b6"]} />)}

      <div style={{ position: "relative", zIndex: 6, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px", textAlign: "center" }}>
        {tier >= 4 && (<Plaque tier={tier} label={props.tierName} />)}
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
                style={{ display: "inline-block", fontSize: champion ? 42 : 48, fontFamily: DISPLAY, fontWeight: 700, color: "#fff", letterSpacing: 3, textShadow: "0 4px 0 #92400e, 0 0 24px rgba(250,204,21,0.95)" }}>
                {ch}
              </motion.span>
            );
          })}
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ marginTop: 16, fontFamily: DISPLAY, fontSize: 30, fontWeight: 700, color: "#fff", textShadow: "0 2px 10px rgba(0,0,0,0.5)", lineHeight: 1.1 }}>
          {props.setsWon}
          <span style={{ opacity: 0.55, margin: "0 10px", fontSize: 22 }}>–</span>
          <span style={{ opacity: 0.75 }}>{props.setsLost}</span>
        </motion.div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 700, letterSpacing: 2, marginBottom: 10, textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>SETS · vs {props.foeName} · AVG {Math.round(props.pa)}–{Math.round(props.oa)}</div>
        <SetChips sets={props.sets} delay={0.9} />

        <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.05, type: "spring", stiffness: 260, damping: 22 }} style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#fde68a", fontWeight: 900, letterSpacing: 4 }}>{champion ? "TITLE WON" : props.nextLabel ? "ADVANCING TO" : (props.roundLabel || "MATCH").toUpperCase()}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, fontWeight: 700, color: "#fff", textTransform: "uppercase", letterSpacing: 1.5, textShadow: "0 0 18px rgba(250,204,21,0.8)", animation: REDUCED_MOTION ? "none" : "pulse 1.6s ease infinite 1.4s" }}>
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
  var textStyle = { fontSize: size, fontFamily: DISPLAY, fontWeight: 700, letterSpacing: 3, color: "#ef4444", textShadow: "0 4px 0 #450a0a, 0 0 26px rgba(239,68,68,0.7)", whiteSpace: "nowrap", lineHeight: 1.1 };
  var topClip = "polygon(0 0,100% 0,100% 47%,0 60%)", botClip = "polygon(0 60%,100% 47%,100% 100%,0 100%)";
  return (
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 38%,#3f0d0d 0%,#1c1917 55%,#050505 100%)", boxShadow: "inset 0 0 180px rgba(220,38,38,0.45)" }}>
      <motion.div aria-hidden initial={{ opacity: 0.7 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ position: "absolute", inset: 0, background: "#7f1d1d", pointerEvents: "none" }} />
      <div aria-hidden style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg,rgba(255,255,255,0.025) 0 1px,transparent 1px 3px)", pointerEvents: "none" }} />
      <Sparks count={18} spread={170} top="42%" delay={0.55} colors={["#94a3b8", "#ef4444", "#e5e7eb"]} />

      <div style={{ position: "relative", zIndex: 6, height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px", textAlign: "center", animation: REDUCED_MOTION ? "none" : "arenaShakeHard 0.5s ease 0.12s" }}>
        {(props.tier || 0) >= 4 && (<Plaque tier={props.tier} label={props.tierName} dim={true} delay={0.3} />)}
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
          style={{ marginTop: 6, fontFamily: DISPLAY, fontSize: 28, fontWeight: 700, color: "#e5e7eb" }}>
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
    var roar = won && (props.tier || 0) >= 4 ? setTimeout(playCrowdRoar, 250) : null;
    if (won) { playVictoryBig(); vibrate(props.champion ? [40, 60, 40, 60, 120] : [30, 50, 80]); }
    else { playDefeatBig(); vibrate([120, 60, 200]); crack = setTimeout(playCrack, 500); }
    var t = setTimeout(function () { setReady(true); }, 1200);
    return function () { clearTimeout(t); clearTimeout(crack); clearTimeout(roar); };
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
