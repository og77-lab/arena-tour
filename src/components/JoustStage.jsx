/* ═══ JoustStage ═══ Side-view lane where the two riders charge and clash on every strike */

import * as React from "react";
import { Rider, Feathers } from "./Rider";
import { REDUCED_MOTION } from "./fx";
import ArenaBackdrop from "./ArenaBackdrop";

const { useState, useEffect, useRef } = React;

var GROUND = 14;
var IDLE_X = 4;

function Bunting(props) {
  var n = 16, flags = [];
  for (var i = 0; i < n; i++) {
    var x = i * (100 / n);
    flags.push(<polygon key={i} points={x + ",0 " + (x + 100 / n) + ",0 " + (x + 50 / n) + ",9"} fill={i % 2 ? "#ffffff" : props.color} stroke="rgba(63,42,29,0.35)" strokeWidth="0.3" />);
  }
  return (
    <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 12 }}>
      <line x1="0" y1="0.3" x2="100" y2="0.3" stroke="rgba(63,42,29,0.5)" strokeWidth="0.5" />
      {flags}
    </svg>
  );
}

/* action: null | { id, phase: "charge"|"impact"|"return"|"finale", youWon, big, word }   verdict: null | "won" | "lost"
   "finale" follows the match-deciding impact: the loser is unseated and stays down, the winner celebrates. */
export default function JoustStage(props) {
  var ref = useRef(null);
  var _w = useState(320), W = _w[0], setW = _w[1];
  useEffect(function () {
    if (!ref.current || typeof ResizeObserver === "undefined") return;
    var ro = new ResizeObserver(function (e) { setW(e[0].contentRect.width); });
    ro.observe(ref.current);
    return function () { ro.disconnect(); };
  }, []);

  var rw = Math.round(Math.min(130, Math.max(92, W * 0.38)));
  var k = rw / 140;
  /* Room above the riders for the stands and the crowd */
  var H = Math.round(112 * k) + 56 + GROUND;
  /* Left glove tip (x≈134) meets the right granny's torso (x≈56, mirrored) */
  var meet = Math.max(IDLE_X, (W - 190 * k) / 2);

  var a = props.action, v = props.verdict;
  var phase = a ? a.phase : null;
  var closing = phase === "charge" || phase === "impact" || phase === "finale";
  function riderState(isYou) {
    var lost = a && (isYou ? !a.youWon : a.youWon);
    var st = { dx: closing ? meet - IDLE_X : 0, pose: "idle", running: false, hatOff: false, ease: "transform 0.55s cubic-bezier(.3,.7,.4,1)" };
    if (phase === "charge") { st.pose = "charge"; st.running = true; st.ease = "transform 0.38s cubic-bezier(.55,0,.9,.6)"; }
    else if (phase === "impact") {
      st.pose = lost ? (a.big ? "knocked" : "deflect") : "charge";
      if (lost) { st.dx -= a.big ? 26 : 12; st.ease = "transform 0.28s cubic-bezier(.2,1.5,.4,1)"; }
      st.hatOff = lost && a.big;
    } else if (phase === "return") { st.running = true; st.hatOff = lost && a.big; }
    else if (phase === "finale") {
      st.pose = lost ? "fallen" : "cheer";
      st.hatOff = lost;
      if (lost) { st.dx -= 26; st.ease = "transform 0.28s cubic-bezier(.2,1.5,.4,1)"; }
    }
    if (!a && v) st.pose = (isYou ? v === "won" : v === "lost") ? "cheer" : "fallen";
    if (REDUCED_MOTION) { st.dx = 0; st.running = false; }
    return st;
  }
  var me = riderState(true), foe = riderState(false);

  var impact = (phase === "impact" || phase === "finale") && !REDUCED_MOTION;
  var landed = phase === "finale" && !REDUCED_MOTION;
  var loserIsFoe = a && a.youWon;
  var loserPal = a ? (loserIsFoe ? props.foe : props.you) : null;
  var featherX = a ? (loserIsFoe ? W - IDLE_X - (meet - IDLE_X) - 62 * k : meet + 62 * k) : 0;
  var groundTop = H - GROUND;

  function riderBox(isYou, st, pal) {
    var side = isYou ? { left: IDLE_X } : { right: IDLE_X };
    return (
      <div style={Object.assign({ position: "absolute", bottom: GROUND - 6, width: rw, transform: "translateX(" + (isYou ? st.dx : -st.dx) + "px)", transition: st.ease, zIndex: isYou ? 3 : 2 }, side)}>
        {st.running && !REDUCED_MOTION && (
          <div aria-hidden style={{ position: "absolute", bottom: 2, [isYou ? "left" : "right"]: rw * 0.32, width: 14, height: 9, borderRadius: "50%", background: "rgba(161,128,82,0.55)", animation: "dustPuff 0.35s ease-out infinite", transform: isYou ? "none" : "scaleX(-1)" }} />
        )}
        <Rider palette={pal} width={rw} flip={!isYou} pose={st.pose} running={st.running} hatOff={st.hatOff} />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative", height: H, margin: "2px -2px 0", overflow: "hidden", borderRadius: 10 }}>
      <ArenaBackdrop W={W} groundTop={groundTop} tierColor={props.tierColor} cheerId={a ? a.id : 0}
        cheer={impact ? (a.big ? "big" : "small") : (!a && v) ? "big" : null} />
      <Bunting color={props.tierColor || "#f59e0b"} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: groundTop, height: GROUND, background: "linear-gradient(180deg,#c8a46b,#a57c45)", borderTop: "2px solid #8b6435" }} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: groundTop + 5, height: 2, background: "repeating-linear-gradient(90deg,rgba(63,42,29,0.25) 0 6px,transparent 6px 18px)" }} />

      {riderBox(false, foe, props.foe)}
      {riderBox(true, me, props.you)}

      {impact && (
        <div key={"flash-" + a.id} aria-hidden style={{ position: "absolute", left: W / 2, top: groundTop - 62 * k, width: 70, height: 70, marginLeft: -35, marginTop: -35, borderRadius: "50%", background: "radial-gradient(circle,#fff 0%,rgba(255,255,255,0.7) 30%,transparent 70%)", animation: "flashBoom 0.4s ease-out forwards", pointerEvents: "none", zIndex: 5 }} />
      )}
      {impact && loserPal && (
        <Feathers key={"f-" + a.id} x={featherX} y={groundTop - 45 * k} count={a.big ? 18 : 8} colors={[loserPal.chicken.body, loserPal.chicken.wing, "#ffffff"]} />
      )}
      {landed && (
        <div key={"land-" + a.id} aria-hidden style={{ position: "absolute", left: loserIsFoe ? W - meet + 26 - 30 * k : meet - 26 + 30 * k, top: groundTop - 14, width: 110, height: 34, marginLeft: -55, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(161,128,82,0.75) 0%,rgba(161,128,82,0.35) 45%,transparent 70%)", animation: "flashBoom 0.7s ease-out 0.35s both", pointerEvents: "none", zIndex: 4 }} />
      )}
      {impact && a.word && (
        <div key={"w-" + a.id} aria-hidden style={{ position: "absolute", left: "50%", top: "30%", zIndex: 7, pointerEvents: "none", fontSize: a.big ? 30 : 22, fontWeight: 900, fontStyle: "italic", letterSpacing: 1, whiteSpace: "nowrap", color: a.youWon ? "#facc15" : "#f87171", textShadow: "-2px -2px 0 #3f2a1d, 2px -2px 0 #3f2a1d, -2px 2px 0 #3f2a1d, 2px 2px 0 #3f2a1d, 0 4px 0 #3f2a1d", animation: "comicPop 0.75s ease-out forwards" }}>
          {a.word}
        </div>
      )}
    </div>
  );
}
