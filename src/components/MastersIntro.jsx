/* ═══ MastersIntro ═══ A Masters match opens like prime-time TV: the arena goes dark, two searchlights cross over the
   stands, a pink broadcast wipe tears across, the silver MASTERS shield lands with the round, and each rider gets her
   on-air name card. A notch below the Slam (no floodlight towers, no gold, no walk-out) and shorter: about 4.6 seconds. */

import * as React from "react";
import { motion } from "framer-motion";
import { Face } from "./Rider";
import { Sparks, REDUCED_MOTION, vibrate } from "./fx";
import { playCrowdRoar, playImpact, playWhoosh } from "../sounds";

const { useState, useEffect, useRef } = React;

var PINK = "#ec4899";

function NameCard(props) {
  var left = props.side === "left", who = props.who;
  return (
    <motion.div initial={{ x: left ? "-110%" : "110%" }} animate={{ x: 0 }} transition={{ delay: props.delay, type: "spring", stiffness: 240, damping: 26 }}
      style={{ position: "absolute", [left ? "left" : "right"]: 0, bottom: left ? "27%" : "13%", width: "min(86%, 360px)", display: "flex", flexDirection: left ? "row" : "row-reverse", alignItems: "stretch" }}>
      <div style={{ width: 8, background: left ? "#fbbf24" : "#ef4444" }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: left ? "row" : "row-reverse", alignItems: "center", gap: 10, padding: "8px 14px", background: "linear-gradient(" + (left ? "90deg" : "270deg") + ",rgba(15,23,42,0.96),rgba(80,7,36,0.92))", borderTop: "2px solid " + PINK, boxShadow: "0 8px 22px rgba(0,0,0,0.5)" }}>
        <div style={{ flexShrink: 0, borderRadius: "50%", boxShadow: "0 0 0 2px #e2e8f0, 0 0 14px " + PINK }}><Face palette={who.palette} size={46} /></div>
        <div style={{ minWidth: 0, textAlign: left ? "left" : "right" }}>
          <div style={{ fontSize: 20, fontWeight: 900, textTransform: "uppercase", color: "#fff", letterSpacing: 0.5, lineHeight: 1.05, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{(!left && who.emoji ? who.emoji + " " : "") + who.name}</div>
          {who.sub && (<div style={{ fontSize: 12, fontWeight: 800, color: "#fbcfe8", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{who.sub}</div>)}
        </div>
      </div>
    </motion.div>
  );
}

export default function MastersIntro(props) {
  var _st = useState("dark"), st = _st[0], setSt = _st[1];
  var timers = useRef([]);
  var doneRef = useRef(props.onDone); doneRef.current = props.onDone;
  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }
  useEffect(function () {
    later(function () { setSt("wipe"); playWhoosh(); }, 450);
    later(playCrowdRoar, 700);
    later(function () { setSt("shield"); playImpact(true); vibrate([25, 40, 50]); }, 1050);
    later(function () { setSt("cards"); playWhoosh(); }, 2600);
    later(function () { doneRef.current(); }, 4600);
    return function () { timers.current.forEach(clearTimeout); };
  }, []);
  var label = String(props.eventLabel || "Masters").toUpperCase();
  var showShield = st === "shield" || st === "cards";

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 8, overflow: "hidden", background: "radial-gradient(circle at 50% 75%,#4a0f33 0%,#1a0b24 55%,#07060f 100%)", color: "#fff", textAlign: "center" }}>
      {/* Stands, with camera flashes going off once the lights are up */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, bottom: "30%", height: "24%", background: "linear-gradient(180deg,#2e1065,#4a0f33)", clipPath: "polygon(0 40%,20% 22%,50% 14%,80% 22%,100% 40%,100% 100%,0 100%)", opacity: st === "dark" ? 0.35 : 0.95, transition: "opacity 0.5s" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle at 7px 6px,rgba(251,207,232,0.22) 3.5px,transparent 4.5px)", backgroundSize: "14px 11px" }} />
      </div>
      <div aria-hidden style={{ position: "absolute", left: "15%", right: "15%", bottom: "38%", height: "30%", borderRadius: "50%", background: "radial-gradient(ellipse,rgba(236,72,153,0.35),transparent 70%)", opacity: st === "dark" ? 0 : 1, transition: "opacity 0.6s" }} />
      {st !== "dark" && !REDUCED_MOTION && Array.from({ length: 14 }).map(function (_, i) {
        return (<div key={i} aria-hidden style={{ position: "absolute", left: (5 + (i * 41) % 90) + "%", bottom: (32 + (i * 11) % 17) + "%", width: 4, height: 4, borderRadius: "50%", background: "#fff", opacity: 0,
          animation: "camFlash " + (1.8 + (i % 4) * 0.45).toFixed(2) + "s ease-out " + ((i % 6) * 0.27).toFixed(2) + "s infinite" }} />);
      })}
      {/* Two searchlights crossing over the arena */}
      {[0, 1].map(function (i) {
        return (<div key={i} aria-hidden style={{ position: "absolute", bottom: "-6%", [i ? "right" : "left"]: "8%", width: 120, height: "105%", transformOrigin: "50% 100%",
          background: "linear-gradient(0deg,rgba(251,207,232,0.5),rgba(251,207,232,0))", clipPath: "polygon(0 0,100% 0,56% 100%,44% 100%)",
          opacity: st === "dark" ? 0 : 1, transition: "opacity 0.35s", transform: "rotate(" + (i ? -18 : 18) + "deg)",
          animation: REDUCED_MOTION ? "none" : "searchCross " + (3.2 + i * 0.6) + "s ease-in-out " + (-i * 1.3) + "s infinite" + (i ? " reverse" : "") }} />);
      })}
      {/* The LIVE bug, as on the telly */}
      <div style={{ position: "absolute", top: 14, right: 14, display: "flex", alignItems: "center", gap: 6, padding: "4px 9px", background: "rgba(15,23,42,0.85)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 4, fontSize: 12, fontWeight: 900, letterSpacing: 2 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: REDUCED_MOTION ? "none" : "screenGlow 1s steps(2) infinite" }} />LIVE
      </div>
      {/* Broadcast wipe */}
      {st !== "dark" && !REDUCED_MOTION && (
        <motion.div aria-hidden initial={{ x: "-130%" }} animate={{ x: "130%" }} transition={{ duration: 0.6, ease: [0.6, 0, 0.3, 1] }}
          style={{ position: "absolute", top: "-20%", bottom: "-20%", left: "-10%", width: "120%", background: "linear-gradient(90deg,transparent 0%," + PINK + " 30%,#fbcfe8 50%," + PINK + " 70%,transparent 100%)", transform: "skewX(-18deg)", opacity: 0.9, zIndex: 4 }} />
      )}

      {/* The silver shield */}
      {showShield && (
        <motion.div initial={{ scale: 2.4, opacity: 0, y: 0 }} animate={st === "cards" ? { scale: 0.68, opacity: 1, y: -130 } : { scale: 1, opacity: 1, y: 0 }}
          transition={st === "cards" ? { duration: 0.55, ease: "easeInOut" } : { type: "spring", stiffness: 300, damping: 17 }}
          style={{ position: "absolute", left: 0, right: 0, top: "30%", display: "flex", flexDirection: "column", alignItems: "center", zIndex: 5 }}>
          <div style={{ position: "relative", padding: "12px 28px 20px", background: "linear-gradient(180deg,#f8fafc,#cbd5e1 50%,#64748b)", border: "3px solid " + PINK, clipPath: "polygon(0 0,100% 0,100% 72%,50% 100%,0 72%)", boxShadow: "0 0 30px rgba(236,72,153,0.6)", overflow: "hidden", minWidth: 190 }}>
            <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 5, color: "#9d174d" }}>★ MASTERS ★</div>
            <div style={{ fontSize: label.length > 14 ? 24 : 32, fontWeight: 900, fontStyle: "italic", lineHeight: 1.05, color: "#1e293b", textShadow: "0 2px 0 #fff, 0 3px 0 rgba(236,72,153,0.55)", whiteSpace: "nowrap", marginTop: 2 }}>{label}</div>
            {!REDUCED_MOTION && (<motion.div aria-hidden initial={{ x: "-150%" }} animate={{ x: "150%" }} transition={{ delay: 0.25, duration: 0.8, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.9) 48%,transparent 66%)" }} />)}
          </div>
          <div style={{ marginTop: 10, display: "inline-block", padding: "4px 16px", background: PINK, borderRadius: 4, transform: "skewX(-12deg)", fontSize: 15, fontWeight: 900, letterSpacing: 3, textTransform: "uppercase", boxShadow: "0 4px 14px rgba(0,0,0,0.5)" }}>
            <span style={{ display: "inline-block", transform: "skewX(12deg)" }}>{props.roundLabel}</span>
          </div>
          {st === "shield" && <Sparks count={28} spread={230} delay={0.15} colors={[PINK, "#f8fafc", "#cbd5e1", "#fbcfe8"]} zIndex={3} />}
        </motion.div>
      )}

      {st === "cards" && (<>
        <NameCard side="left" who={props.you} delay={0.2} />
        <NameCard side="right" who={props.foe} delay={0.65} />
      </>)}
    </div>
  );
}
