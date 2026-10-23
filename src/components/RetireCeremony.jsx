/* ═══ RetireCeremony ═══ You retire, and the family carries on. Four scenes inside the gala's velvet:
   1. a lap of honour — she rides one last time across the arena, roses fly in from the stands;
   2. her career in numbers, counting up;
   3. the torch — she stands on the left, the next granny walks in from the right, and a burning torch passes from
      one hand to the other in a shower of sparks;
   4. the family wall — her portrait drops into a gold frame with its brass plate, and the new career begins.
   Tap or NEXT to move on, Skip to the end (same controls as the gala); the last button starts the new granny. */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FONT } from "../ui/theme";
import { Rider, PLAYER_PALETTE, withKit, lookPalette } from "./Rider";
import { Sparks, CountUp, REDUCED_MOTION, vibrate } from "./fx";
import { playVictoryBig, playRankUp, playTitle, playWhoosh, playClang } from "../sounds";

const { useState, useEffect } = React;
var GOLD = "#fbbf24", CREAM = "#fef3c7", SOFT = "#c4b5fd";

function Kicker(props) { return (<div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 4, color: SOFT, textTransform: "uppercase" }}>{props.children}</div>); }
function Big(props) {
  return (<div style={{ fontSize: props.size || 32, fontWeight: 900, fontStyle: "italic", lineHeight: 1.04, color: CREAM, letterSpacing: 0.5,
    textShadow: "0 2px 0 #f59e0b, 0 4px 0 #b45309, 0 8px 16px rgba(0,0,0,0.45)" }}>{props.children}</div>);
}
function Stage(props) {
  return (<motion.div key={props.k} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.98 }}
    transition={{ duration: REDUCED_MOTION ? 0.15 : 0.45, ease: [0.2, 0.8, 0.3, 1] }} style={{ width: "min(100%, 440px)", margin: "0 auto", textAlign: "center", position: "relative" }}>{props.children}</motion.div>);
}

/* A wooden torch with a flickering flame */
function Torch(props) {
  return (
    <svg width={props.size || 34} height={(props.size || 34) * 1.9} viewBox="0 0 34 64" aria-hidden style={{ overflow: "visible", display: "block" }}>
      <motion.path d="M17 2 C 26 12, 27 20, 17 28 C 7 20, 8 12, 17 2 Z" fill="#f97316" stroke="#7c2d12" strokeWidth="1.5"
        animate={REDUCED_MOTION ? {} : { scaleY: [1, 1.12, 0.94, 1.08, 1], scaleX: [1, 0.92, 1.06, 0.95, 1] }} transition={{ duration: 0.6, repeat: Infinity }} style={{ transformOrigin: "17px 28px" }} />
      <path d="M17 10 C 22 16, 22 21, 17 26 C 12 21, 12 16, 17 10 Z" fill="#fde047" />
      <rect x="11" y="27" width="12" height="6" rx="2" fill="#a16207" stroke="#3f2a1d" strokeWidth="1.4" />
      <rect x="14" y="33" width="6" height="29" rx="2.5" fill="#92400e" stroke="#3f2a1d" strokeWidth="1.4" />
    </svg>
  );
}

/* The gold frame with the brass plate, as on the family wall */
function Portrait(props) {
  return (
    <div style={{ display: "inline-block", padding: 9, borderRadius: 12, background: "linear-gradient(135deg,#b45309,#fbbf24 40%,#92400e 70%,#fde68a)", boxShadow: "0 10px 26px rgba(0,0,0,0.5)" }}>
      <div style={{ width: 170, height: 140, borderRadius: 6, background: "linear-gradient(180deg,#e7e5e4,#fef3c7)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", filter: "sepia(0.45)" }}>
        <Rider palette={props.palette} width={160} pose="cheer" />
      </div>
      <div style={{ margin: "7px auto 0", width: 150, padding: "3px 6px", borderRadius: 3, background: "linear-gradient(180deg,#fde68a,#ca8a04)", border: "1.5px solid #78350f", color: "#3f2a1d", fontSize: 11.5, fontWeight: 900, lineHeight: 1.25 }}>
        {props.name}<br /><span style={{ fontWeight: 700, fontSize: 10.5 }}>{props.line}</span>
      </div>
    </div>
  );
}

export default function RetireCeremony(props) {
  var c = props.career, pal = withKit(PLAYER_PALETTE, props.kit), heirPal = lookPalette(props.heirLook);
  var stages = ["lap", "numbers", "torch", "wall"];
  var _i = useState(0), i = _i[0], setI = _i[1];
  var st = stages[i], last = i === stages.length - 1;
  useEffect(function () {
    if (st === "lap") { playWhoosh(); setTimeout(playVictoryBig, 600); }
    else if (st === "numbers") playRankUp();
    else if (st === "torch") { setTimeout(function () { playClang(); vibrate([30, 40, 60]); }, 1900); }
    else if (st === "wall") setTimeout(playTitle, 900);
  }, [st]);
  function next() { if (!last) setI(i + 1); }
  var years = c.y + (c.y === 1 ? " season" : " seasons");

  return createPortal(
    <div onClick={next} style={{ position: "fixed", inset: 0, zIndex: 980, fontFamily: FONT, overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", cursor: last ? "default" : "pointer",
      background: "radial-gradient(circle at 50% 30%,#4c1d95 0%,#2e1065 45%,#0f0a1e 100%)", color: CREAM }}>
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 45% at 50% 40%, rgba(253,230,138,0.22), transparent 70%)" }} />
      <div style={{ position: "absolute", inset: 0, overflowY: "auto", display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top) + 18px) 16px calc(env(safe-area-inset-bottom) + 96px)" }}>
        <div style={{ margin: "auto 0", width: "100%" }}>
          <AnimatePresence mode="wait">

            {st === "lap" && (
              <Stage k="lap">
                <Kicker>The last ride</Kicker>
                <div style={{ marginTop: 6 }}><Big size={30}>A LEGEND HANGS UP<br />HER LANCE</Big></div>
                {/* she crosses the arena one last time; roses rain down from the stands */}
                <div style={{ position: "relative", height: 170, marginTop: 10, overflow: "hidden", borderRadius: 14, background: "linear-gradient(180deg,#3b0764 0%,#581c87 55%,#a16207 56%,#78350f 100%)" }}>
                  {Array.from({ length: 22 }).map(function (_, k) {
                    return (<motion.div key={"c" + k} aria-hidden initial={{ y: 0 }} animate={REDUCED_MOTION ? {} : { y: [0, -5, 0] }} transition={{ duration: 0.5 + (k % 4) * 0.1, repeat: Infinity, delay: (k % 5) * 0.08 }}
                      style={{ position: "absolute", left: (k * 4.6) + "%", top: 22 + (k % 3) * 9, width: 10, height: 14, borderRadius: "5px 5px 2px 2px", background: ["#f472b6", "#60a5fa", "#facc15", "#4ade80", "#f87171"][k % 5], opacity: 0.85 }} />);
                  })}
                  {!REDUCED_MOTION && Array.from({ length: 9 }).map(function (_, k) {
                    return (<motion.div key={"r" + k} aria-hidden initial={{ x: 0, y: -10, rotate: 0, opacity: 0 }} animate={{ y: 120 + (k % 3) * 8, rotate: 220 + k * 30, opacity: [0, 1, 1, 0.9] }}
                      transition={{ duration: 1.6, delay: 0.6 + k * 0.22, ease: "easeIn" }} style={{ position: "absolute", left: (8 + k * 10) + "%", top: 40, fontSize: 16 }}>🌹</motion.div>);
                  })}
                  {/* she rides in and pulls up in the middle of the arena, lance raised */}
                  <motion.div initial={{ x: REDUCED_MOTION ? "0%" : "-140%" }} animate={{ x: "0%" }} transition={{ duration: 2.2, ease: [0.25, 0.6, 0.35, 1] }}
                    style={{ position: "absolute", bottom: 6, left: "50%", marginLeft: -75, width: 150 }}>
                    <Rider palette={pal} width={150} pose="cheer" />
                  </motion.div>
                </div>
                <div style={{ fontSize: 15, color: SOFT, marginTop: 12, lineHeight: 1.5 }}>{props.name} retires after {years} on the tour. The whole arena is on its feet.</div>
              </Stage>
            )}

            {st === "numbers" && (
              <Stage k="numbers">
                <Kicker>{props.name} · {c.s0 === c.s1 ? "Season " + c.s1 : "Seasons " + c.s0 + "–" + c.s1}</Kicker>
                <div style={{ marginTop: 6 }}><Big size={28}>A CAREER IN NUMBERS</Big></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14 }}>
                  {[["Seasons", c.y], ["Best world rank", c.peak > 1000 ? "—" : "#" + c.peak], ["Titles", c.titles], ["Grand Slams", c.gs], ["Masters", c.mst], ["Hall of Fame", c.hof ? "YES" : "—"]].map(function (r, k) {
                    return (<motion.div key={r[0]} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + k * 0.18 }}
                      style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(253,230,138,0.25)", borderRadius: 14, padding: "9px 6px" }}>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: SOFT, textTransform: "uppercase" }}>{r[0]}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: k >= 3 && r[1] && r[1] !== "—" ? GOLD : CREAM, marginTop: 2 }}>{typeof r[1] === "number" ? <CountUp to={r[1]} /> : r[1]}</div>
                    </motion.div>);
                  })}
                </div>
                {c.hof && (<div style={{ fontSize: 14, fontWeight: 900, color: GOLD, marginTop: 10 }}>🏛️ Into the Hall of Fame: {c.hof}</div>)}
              </Stage>
            )}

            {st === "torch" && (
              <Stage k="torch">
                <Kicker>Passing the torch</Kicker>
                <div style={{ marginTop: 6 }}><Big size={28}>THE FAMILY RIDES ON</Big></div>
                <div style={{ position: "relative", height: 200, marginTop: 10 }}>
                  {/* the retiring granny stays left; the heir walks in from the right */}
                  <div style={{ position: "absolute", left: 0, bottom: 0, width: "48%" }}><Rider palette={pal} width={150} pose="idle" /></div>
                  <motion.div initial={{ x: 160, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                    style={{ position: "absolute", right: 0, bottom: 0, width: "48%" }}><Rider palette={heirPal} width={150} pose="idle" flip={true} /></motion.div>
                  {/* the torch crosses from her hand to the heir's */}
                  <motion.div initial={{ left: "28%", top: 34, rotate: -14 }} animate={REDUCED_MOTION ? { left: "62%" } : { left: ["28%", "28%", "45%", "62%"], top: [34, 34, 4, 34], rotate: [-14, -14, 0, 14] }}
                    transition={{ duration: 2, times: [0, 0.45, 0.72, 1], ease: "easeInOut" }} style={{ position: "absolute", zIndex: 3 }}>
                    <Torch size={34} />
                  </motion.div>
                  <Sparks count={26} spread={200} delay={1.9} colors={[GOLD, "#ffffff", "#f97316", "#fde68a"]} zIndex={4} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 900, padding: "0 10px" }}>
                  <span style={{ color: SOFT }}>{props.name}</span><span style={{ color: GOLD }}>{props.heir}</span>
                </div>
                <div style={{ fontSize: 14, color: SOFT, marginTop: 8, lineHeight: 1.5 }}>{props.name} hands the family torch to {props.heir}.</div>
              </Stage>
            )}

            {st === "wall" && (
              <Stage k="wall">
                <Kicker>The family wall</Kicker>
                <motion.div initial={{ y: -260, rotate: -8 }} animate={{ y: 0, rotate: [-8, 4, -2, 0] }} transition={{ duration: REDUCED_MOTION ? 0.1 : 1.1, ease: "easeOut" }} style={{ marginTop: 12 }}>
                  <Portrait palette={pal} name={props.name} line={(c.s0 === c.s1 ? "Season " + c.s1 : "Seasons " + c.s0 + "–" + c.s1) + " · best #" + (c.peak > 1000 ? "—" : c.peak) + (c.gs ? " · " + c.gs + " Slam" + (c.gs > 1 ? "s" : "") : "")} />
                </motion.div>
                <div style={{ fontSize: 14, color: SOFT, marginTop: 14, lineHeight: 1.5 }}>Her portrait goes up on the family wall{props.generation ? ", next to " + props.generation + " before her" : ""}. <b style={{ color: CREAM }}>{props.heir}</b> starts at #1000, first season on tour.</div>
                <button onClick={function (e) { e.stopPropagation(); props.onDone(); }}
                  style={{ marginTop: 18, width: "100%", fontFamily: FONT, fontWeight: 900, fontSize: 17, letterSpacing: 1, textTransform: "uppercase", padding: "15px 18px", borderRadius: 14, cursor: "pointer",
                    background: "linear-gradient(180deg,#fde68a,#f59e0b)", color: "#3f2a1d", border: "2px solid #3f2a1d", boxShadow: "0 5px 0 #3f2a1d" }}>
                  🔥 {props.heir}'s career begins
                </button>
              </Stage>
            )}
          </AnimatePresence>
        </div>
      </div>
      {!last && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 16px calc(env(safe-area-inset-bottom) + 14px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, zIndex: 8 }}>
          <button onClick={function (e) { e.stopPropagation(); setI(stages.length - 1); }} style={{ background: "none", border: "none", color: SOFT, fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: "pointer", padding: 8 }}>Skip</button>
          <div style={{ display: "flex", gap: 5 }}>
            {stages.map(function (_, j) { return (<span key={j} style={{ width: j === i ? 16 : 6, height: 6, borderRadius: 3, background: j <= i ? GOLD : "rgba(255,255,255,0.25)", transition: "width 0.2s" }} />); })}
          </div>
          <button onClick={function (e) { e.stopPropagation(); next(); }} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, letterSpacing: 1, padding: "10px 16px", borderRadius: 12, cursor: "pointer", background: GOLD, color: "#3f2a1d", border: "2px solid #3f2a1d", boxShadow: "0 3px 0 #3f2a1d" }}>NEXT ›</button>
        </div>
      )}
    </div>,
    document.body
  );
}
