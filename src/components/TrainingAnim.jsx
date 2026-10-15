/* ═══ TrainingAnim ═══ A one-second gag each time you buy a level, played in the granny / rooster card's little stage:
   ⚡ swats a fly · 🎯 bullseye · 🛡️ a pillow bounces off · 🫀 rooster on a treadmill · 🐾 rooster on a balance beam.
   Never blocks: tap again and the next one simply restarts. */

import * as React from "react";
import { motion } from "framer-motion";
import { Rider, PLAYER_PALETTE } from "./Rider";
import { REDUCED_MOTION } from "./fx";

const { useState, useEffect } = React;

var DUR = 1100;

function PlusOne(props) {
  return (
    <motion.div initial={{ y: 6, opacity: 0, scale: 0.6 }} animate={{ y: -20, opacity: [0, 1, 1, 0], scale: 1 }} transition={{ duration: 1, times: [0, 0.15, 0.7, 1] }}
      style={{ position: "absolute", top: 2, left: 0, right: 0, textAlign: "center", fontSize: 15, fontWeight: 900, color: props.col, textShadow: "0 1px 0 #fff, 0 0 6px #fff", pointerEvents: "none", zIndex: 4 }}>
      +1 {props.label}
    </motion.div>
  );
}

/* Granny swats a buzzing fly */
function Reflexes() {
  var _p = useState("idle"), pose = _p[0], setPose = _p[1];
  useEffect(function () { var a = setTimeout(function () { setPose("deflect"); }, 520), b = setTimeout(function () { setPose("idle"); }, 820); return function () { clearTimeout(a); clearTimeout(b); }; }, []);
  return (
    <>
      <Rider palette={PLAYER_PALETTE} width={84} pose={pose} />
      <motion.span aria-hidden initial={{ x: 70, y: -40, opacity: 1 }} animate={{ x: [70, 40, 62, 34, 30], y: [-40, -52, -30, -46, -40], opacity: [1, 1, 1, 1, 0], scale: [1, 1, 1, 1, 0.2] }} transition={{ duration: 0.62, times: [0, 0.3, 0.55, 0.85, 1] }}
        style={{ position: "absolute", left: 20, bottom: 30, fontSize: 14 }}>🪰</motion.span>
      <motion.span aria-hidden initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: [0, 1, 0], scale: [0.3, 1.2, 1] }} transition={{ delay: 0.55, duration: 0.45 }}
        style={{ position: "absolute", right: 4, top: 10, fontSize: 11, fontWeight: 900, color: "#0891b2", fontStyle: "italic" }}>SWAT!</motion.span>
    </>
  );
}

/* Lance levelled, lunge, bullseye */
function Aim() {
  var _p = useState("idle"), pose = _p[0], setPose = _p[1];
  useEffect(function () { var a = setTimeout(function () { setPose("charge"); }, 150), b = setTimeout(function () { setPose("idle"); }, 850); return function () { clearTimeout(a); clearTimeout(b); }; }, []);
  return (
    <>
      <motion.div animate={{ x: [0, 0, 10, 0] }} transition={{ duration: 0.9, times: [0, 0.3, 0.5, 1] }}><Rider palette={PLAYER_PALETTE} width={78} pose={pose} /></motion.div>
      <motion.span aria-hidden animate={{ rotate: [0, 0, -14, 10, 0], scale: [1, 1, 1.25, 1, 1] }} transition={{ duration: 0.9, times: [0, 0.45, 0.55, 0.7, 1] }}
        style={{ position: "absolute", right: 2, top: 22, fontSize: 22 }}>🎯</motion.span>
    </>
  );
}

/* A pillow flies in and bounces off; she doesn't budge */
function Stubborn() {
  return (
    <>
      <Rider palette={PLAYER_PALETTE} width={84} pose="idle" />
      <motion.div aria-hidden initial={{ x: 70, y: -36, rotate: 0 }} animate={{ x: [70, 8, 60], y: [-36, -34, -70], rotate: [0, -20, 160], opacity: [1, 1, 0] }} transition={{ duration: 0.95, times: [0, 0.4, 1], ease: "easeOut" }}
        style={{ position: "absolute", left: 20, bottom: 30, width: 22, height: 14, borderRadius: 6, background: "#fdf2f8", border: "1.5px solid #9d174d", boxShadow: "inset 0 0 0 2px #fbcfe8" }} />
      <motion.span aria-hidden initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 0.4, duration: 0.6 }}
        style={{ position: "absolute", right: 6, top: 12, fontSize: 11, fontWeight: 900, color: "#7c3aed", fontStyle: "italic" }}>BOING</motion.span>
    </>
  );
}

/* Rooster on a treadmill, sweating */
function Stamina() {
  return (
    <>
      <div aria-hidden style={{ position: "absolute", left: 6, right: 6, bottom: 4, height: 8, borderRadius: 4, border: "1.5px solid #3f2a1d",
        background: "repeating-linear-gradient(90deg,#78716c 0 6px,#a8a29e 6px 12px)", animation: REDUCED_MOTION ? "none" : "beltRun 0.25s linear infinite" }} />
      <div style={{ position: "relative", marginBottom: 8 }}><Rider palette={PLAYER_PALETTE} width={84} pose="charge" running={true} noRider={true} /></div>
      {[0, 1].map(function (i) {
        return (<motion.span key={i} aria-hidden initial={{ opacity: 0, y: 0 }} animate={{ opacity: [0, 1, 0], y: [0, 12] }} transition={{ delay: 0.25 + i * 0.35, duration: 0.5 }}
          style={{ position: "absolute", left: 30 + i * 22, top: 16, fontSize: 10 }}>💦</motion.span>);
      })}
    </>
  );
}

/* Rooster wobbles on a balance beam, then holds steady */
function Stride() {
  return (
    <>
      <div aria-hidden style={{ position: "absolute", left: 12, right: 12, bottom: 4, height: 7, borderRadius: 3, background: "linear-gradient(180deg,#b45309,#78350f)", border: "1.5px solid #3f2a1d" }} />
      <motion.div animate={{ rotate: [0, -9, 7, -4, 0] }} transition={{ duration: 0.95, ease: "easeInOut" }} style={{ transformOrigin: "50% 100%", marginBottom: 9 }}>
        <Rider palette={PLAYER_PALETTE} width={80} pose="idle" noRider={true} />
      </motion.div>
      <motion.span aria-hidden initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ delay: 0.7, duration: 0.4 }}
        style={{ position: "absolute", right: 6, top: 10, fontSize: 11, fontWeight: 900, color: "#db2777", fontStyle: "italic" }}>STEADY!</motion.span>
    </>
  );
}

var BY_STAT = { r: Reflexes, f: Aim, g: Stubborn, s: Stamina, p: Stride };

/* The little stage in a training card. fx = { k, n, label, col } of the latest level bought (n bumps every tap) */
export default function TrainStage(props) {
  var fx = props.fx, Anim = fx && BY_STAT[fx.k];
  var _live = useState(null), live = _live[0], setLive = _live[1];
  useEffect(function () {
    if (!fx || !Anim) return;
    setLive(fx);
    var t = setTimeout(function () { setLive(null); }, DUR);
    return function () { clearTimeout(t); };
  }, [fx && fx.n]);
  var Cur = live && !REDUCED_MOTION ? BY_STAT[live.k] : null;
  return (
    <div style={{ position: "relative", flexShrink: 0, width: props.w || 96, height: props.h || 72, borderRadius: 12, overflow: "hidden",
      background: "linear-gradient(180deg,#fef3c7,#fde68a)", border: "1.5px solid " + (live ? live.col : "#f1dfb4"), transition: "border-color 0.3s",
      display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      {Cur ? (<Cur key={live.n} />) : (<Rider palette={PLAYER_PALETTE} width={props.who === "rooster" ? 80 : 84} pose="idle" noRider={props.who === "rooster"} />)}
      {live && (<PlusOne key={"p" + live.n} label={live.label} col={live.col} />)}
    </div>
  );
}
