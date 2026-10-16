/* ═══ SlamIntro ═══ Every Grand Slam match opens like a stadium event: the floodlights clank on one tower at a time,
   the crowd swells to a roar, the golden GRAND SLAM crest slams in with the round, and the two riders walk out of
   their tunnels into the spotlights. Then the usual VS and countdown. About six seconds, nothing to tap. */

import * as React from "react";
import { motion } from "framer-motion";
import { Rider } from "./Rider";
import { Sparks, REDUCED_MOTION, vibrate } from "./fx";
import { playFloodlight, playCrowdRoar, playImpact, playWhoosh } from "../sounds";

const { useState, useEffect, useRef } = React;

var TOWERS = [0.1, 0.32, 0.68, 0.9];

export default function SlamIntro(props) {
  var _lit = useState(0), lit = _lit[0], setLit = _lit[1];
  var _st = useState("lights"), st = _st[0], setSt = _st[1];
  var timers = useRef([]);
  var doneRef = useRef(props.onDone); doneRef.current = props.onDone;
  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }
  useEffect(function () {
    TOWERS.forEach(function (_, i) { later(function () { setLit(i + 1); playFloodlight(); vibrate(15); }, 350 + i * 380); });
    later(playCrowdRoar, 1500);
    later(function () { setSt("crest"); playImpact(true); vibrate([30, 40, 60]); }, 2050);
    later(function () { setSt("walkout"); playWhoosh(); }, 3700);
    later(function () { doneRef.current(); }, 6100);
    return function () { timers.current.forEach(clearTimeout); };
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 8, overflow: "hidden", background: "radial-gradient(circle at 50% 70%,#1e1b4b 0%,#0b0a1f 70%)", color: "#fef3c7", textAlign: "center" }}>
      {/* Stands silhouette with a sea of camera flashes */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: "28%", height: "26%", background: "linear-gradient(180deg,#1e1b4b,#312e81)", clipPath: "polygon(0 35%,15% 20%,35% 10%,50% 6%,65% 10%,85% 20%,100% 35%,100% 100%,0 100%)", opacity: lit ? 1 : 0.4, transition: "opacity 0.6s" }} />
      {lit >= 4 && !REDUCED_MOTION && Array.from({ length: 22 }).map(function (_, i) {
        return (<div key={i} aria-hidden style={{ position: "absolute", left: (4 + (i * 37) % 92) + "%", bottom: (30 + (i * 13) % 20) + "%", width: 5, height: 5, borderRadius: "50%", background: "#fff", opacity: 0,
          animation: "camFlash " + (1.6 + (i % 5) * 0.4).toFixed(1) + "s ease-out " + ((i % 7) * 0.23).toFixed(2) + "s infinite" }} />);
      })}
      {/* Floodlight towers and their beams */}
      {TOWERS.map(function (x, i) {
        var on = lit > i;
        return (
          <div key={i} aria-hidden>
            <div style={{ position: "absolute", left: "calc(" + (x * 100) + "% - 2px)", top: "8%", width: 4, height: "40%", background: "#334155" }} />
            <div style={{ position: "absolute", left: "calc(" + (x * 100) + "% - 14px)", top: "6%", width: 28, height: 12, borderRadius: 3, background: on ? "#fef9c3" : "#475569", boxShadow: on ? "0 0 30px 10px rgba(254,249,195,0.75)" : "none", transition: "all 0.15s" }} />
            <div style={{ position: "absolute", left: "calc(" + (x * 100) + "% - 70px)", top: "8%", width: 140, height: "70%", background: "linear-gradient(180deg,rgba(254,249,195,0.38),rgba(254,249,195,0))", clipPath: "polygon(45% 0,55% 0,100% 100%,0 100%)",
              transform: "rotate(" + (x < 0.5 ? 14 : -14) + "deg)", transformOrigin: "50% 0", opacity: on ? 1 : 0, transition: "opacity 0.25s" }} />
          </div>
        );
      })}

      {/* The crest */}
      {(st === "crest" || st === "walkout") && (
        <motion.div initial={{ scale: 3, opacity: 0, y: 0 }} animate={st === "walkout" ? { scale: 0.62, opacity: 1, y: -150 } : { scale: 1, opacity: 1, y: 0 }}
          transition={st === "walkout" ? { duration: 0.6, ease: "easeInOut" } : { type: "spring", stiffness: 260, damping: 15 }}
          style={{ position: "absolute", left: 0, right: 0, top: "34%", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ position: "relative", padding: "10px 26px 12px", borderRadius: 18, background: "linear-gradient(180deg,#fde68a,#f59e0b 55%,#b45309)", border: "3px solid #78350f", boxShadow: "0 0 40px rgba(251,191,36,0.6), 0 10px 0 #451a03", overflow: "hidden" }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 5, color: "#451a03" }}>👑 THE BIG STAGE 👑</div>
            <div style={{ fontSize: (props.slamLabel || "").length > 12 ? 30 : 40, fontWeight: 900, fontStyle: "italic", lineHeight: 1, color: "#fffbeb", textShadow: "0 3px 0 #92400e, 0 6px 12px rgba(0,0,0,0.4)", whiteSpace: "nowrap" }}>{String(props.slamLabel || "Grand Slam").toUpperCase()}</div>
            {!REDUCED_MOTION && (<motion.div aria-hidden initial={{ x: "-140%" }} animate={{ x: "140%" }} transition={{ delay: 0.3, duration: 0.9, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.8) 48%,transparent 66%)" }} />)}
          </div>
          <div style={{ marginTop: 14, display: "inline-block", padding: "4px 16px", background: "#7f1d1d", border: "2px solid #fbbf24", borderRadius: 6, fontSize: 15, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", color: "#fff" }}>{props.roundLabel}</div>
          {st === "crest" && <Sparks count={34} spread={260} delay={0.2} colors={["#fbbf24", "#fde68a", "#ffffff", "#f472b6"]} zIndex={3} />}
        </motion.div>
      )}

      {/* The walk-out: each rider from her tunnel into a spotlight */}
      {st === "walkout" && [true, false].map(function (isYou) {
        var who = isYou ? props.you : props.foe;
        return (
          <motion.div key={isYou ? "y" : "f"} initial={{ x: isYou ? -220 : 220, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: isYou ? 0.35 : 0.9, duration: 0.9, ease: [0.2, 0.8, 0.3, 1] }}
            style={{ position: "absolute", bottom: "12%", [isYou ? "left" : "right"]: "2%", width: "48%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div aria-hidden style={{ position: "absolute", bottom: 18, width: 170, height: 34, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(254,249,195,0.55),transparent 70%)" }} />
            <div style={{ filter: isYou ? "drop-shadow(0 0 16px rgba(251,191,36,0.6))" : "drop-shadow(0 0 16px rgba(239,68,68,0.55))" }}>
              <Rider palette={who.palette} width={150} flip={!isYou} pose="idle" running={true} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, textTransform: "uppercase", color: "#fff", textShadow: "0 3px 0 rgba(0,0,0,0.5)", marginTop: 4, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(!isYou && who.emoji ? who.emoji + " " : "") + who.name}</div>
            {who.sub && (<div style={{ fontSize: 12, fontWeight: 800, color: "#c7d2fe" }}>{who.sub}</div>)}
          </motion.div>
        );
      })}
    </div>
  );
}
