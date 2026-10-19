/* ═══ FinalReveal ═══ Played before a final, and only a final: the trophy rises out of the dark, the road you took to get
   here flashes past, then a silhouette waits in the spotlight… a flash, and the opponent is revealed — name, rank,
   titles, her words. Then the usual VS and countdown take over. About eleven seconds — slow enough to take it all in. */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rider } from "./Rider";
import { Sparks, REDUCED_MOTION, vibrate } from "./fx";
import { quote } from "../models/persona";
import { playHeartbeat, playWhoosh, playImpact, playTitle, playClang } from "../sounds";

const { useState, useEffect, useRef } = React;

var GOLD = "#fbbf24", CREAM = "#fef3c7";

function Rays() {
  return (
    <motion.div aria-hidden initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 0.55, rotate: 40 }} transition={{ duration: 6, ease: "linear" }}
      style={{ position: "absolute", left: "50%", top: "38%", width: 560, height: 560, marginLeft: -280, marginTop: -280,
        background: "repeating-conic-gradient(rgba(251,191,36,0.32) 0deg 8deg, transparent 8deg 22deg)", WebkitMaskImage: "radial-gradient(circle, #000 0%, transparent 65%)", maskImage: "radial-gradient(circle, #000 0%, transparent 65%)" }} />
  );
}

export default function FinalReveal(props) {
  var road = (props.road || []).slice(-5);
  var _st = useState("trophy"), st = _st[0], setSt = _st[1];
  var timers = useRef([]);
  var doneRef = useRef(props.onDone); doneRef.current = props.onDone;
  function later(fn, ms) { timers.current.push(setTimeout(fn, ms)); }

  useEffect(function () {
    var t = 0;
    playWhoosh(); later(playHeartbeat, 300); later(playHeartbeat, 1200); later(function () { playClang(); }, 1700);
    t = 3500;
    if (road.length) { later(function () { setSt("road"); playWhoosh(); }, t); t += 1800 + road.length * 650; }
    later(function () { setSt("shadow"); playHeartbeat(); }, t);
    later(playHeartbeat, t + 900);
    later(playHeartbeat, t + 1600);
    later(function () { setSt("reveal"); playImpact(true); playClang(); vibrate([40, 60, 80]); }, t + 2300);
    later(playTitle, t + 2700);
    later(function () { doneRef.current(); }, t + 6800);
    return function () { timers.current.forEach(clearTimeout); };
  }, []);

  var sc = props.scout || {}, foe = props.foe;
  var words = quote(props.oppId, 3);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 8, overflow: "hidden", background: "radial-gradient(circle at 50% 40%,#1c1917 0%,#0c0a09 70%)", color: CREAM, textAlign: "center" }}>
      <AnimatePresence mode="wait">
        {st === "trophy" && (
          <motion.div key="trophy" exit={{ opacity: 0, scale: 1.1 }} transition={{ duration: 0.35 }} style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            {!REDUCED_MOTION && <Rays />}
            {/* Fireworks over the trophy */}
            <div style={{ position: "absolute", left: "26%", top: "22%" }}><Sparks count={26} spread={170} delay={1.7} colors={["#fbbf24", "#fde68a", "#ffffff"]} zIndex={1} /></div>
            <div style={{ position: "absolute", right: "26%", top: "18%" }}><Sparks count={26} spread={170} delay={2.3} colors={["#f472b6", "#fbbf24", "#ffffff"]} zIndex={1} /></div>
            <div style={{ position: "absolute", left: "50%", top: "30%" }}><Sparks count={30} spread={220} delay={2.9} colors={["#60a5fa", "#fbbf24", "#ffffff"]} zIndex={1} /></div>
            <motion.div initial={{ y: 120, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ duration: 1.6, ease: [0.2, 0.8, 0.3, 1] }}
              style={{ fontSize: 96, lineHeight: 1, filter: "drop-shadow(0 0 24px rgba(251,191,36,0.85))", position: "relative" }}>🏆</motion.div>
            <motion.div initial={{ opacity: 0, letterSpacing: "18px" }} animate={{ opacity: 1, letterSpacing: "6px" }} transition={{ delay: 1.1, duration: 1.1 }}
              style={{ marginTop: 18, fontSize: 13, fontWeight: 900, color: "#fde68a", textTransform: "uppercase", position: "relative" }}>{props.tierName}</motion.div>
            <motion.div initial={{ opacity: 0, scale: 2.2 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6, type: "spring", stiffness: 220, damping: 14 }}
              style={{ fontSize: 54, fontWeight: 900, fontStyle: "italic", lineHeight: 1.05, position: "relative", textShadow: "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 7px 0 #b45309, 0 10px 22px rgba(0,0,0,0.6)" }}>THE FINAL</motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.85 }} transition={{ delay: 2.4 }} style={{ marginTop: 10, fontSize: 14, fontWeight: 700, position: "relative" }}>{props.you.name}, you made it.</motion.div>
          </motion.div>
        )}

        {st === "road" && (
          <motion.div key="road" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 18px" }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 4, color: "#a8a29e", textTransform: "uppercase" }}>Your road to the final</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, marginTop: 14, width: "min(100%, 320px)" }}>
              {road.map(function (r, i) {
                return (
                  <motion.div key={i} initial={{ x: i % 2 ? 80 : -80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.35 + i * 0.4, type: "spring", stiffness: 300, damping: 22 }}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(251,191,36,0.3)" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#a8a29e", textTransform: "uppercase", letterSpacing: 1 }}>{r.round}</span>
                    <span style={{ textAlign: "right" }}><span style={{ fontSize: 15, fontWeight: 900 }}>{r.name}</span>{r.rank ? (<span style={{ fontSize: 12, fontWeight: 800, color: "#a8a29e" }}> #{r.rank}</span>) : null}<span style={{ display: "block", fontSize: 12, fontWeight: 900, color: "#4ade80" }}>won {r.sc ? String(r.sc).replace("-", "–") : "✓"}</span></span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {(st === "shadow" || st === "reveal") && (
          <motion.div key="foe" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
            style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
            {/* Spotlight cone and fog */}
            <div aria-hidden style={{ position: "absolute", left: "50%", top: 0, width: 280, marginLeft: -140, height: "62%", background: "linear-gradient(180deg,rgba(255,255,255,0.22),rgba(255,255,255,0.02))", clipPath: "polygon(42% 0,58% 0,100% 100%,0 100%)" }} />
            <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: "52%", height: 70, background: "radial-gradient(ellipse at center,rgba(255,255,255,0.12),transparent 70%)" }} />
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 4, color: st === "reveal" ? "#fca5a5" : "#a8a29e", textTransform: "uppercase", position: "relative" }}>
              {st === "reveal" ? "Your opponent" : "And waiting for you…"}
            </div>
            <motion.div animate={st === "reveal" ? { scale: [1, 1.12, 1] } : { scale: [0.96, 1, 0.96] }} transition={st === "reveal" ? { duration: 0.5 } : { duration: 1.3, repeat: Infinity }}
              style={{ position: "relative", marginTop: 8, filter: st === "reveal" ? "drop-shadow(0 0 22px rgba(239,68,68,0.6))" : "brightness(0) drop-shadow(0 0 14px rgba(255,255,255,0.35))", transition: "filter 0.25s" }}>
              <Rider palette={foe.palette} width={200} flip={true} pose={st === "reveal" ? "cheer" : "idle"} crown={sc.rank === 1} />
              {st === "reveal" && <Sparks count={28} spread={220} colors={["#ef4444", "#fbbf24", "#ffffff"]} zIndex={3} />}
            </motion.div>
            {st === "reveal" && (<>
              <motion.div initial={{ scale: 2.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 420, damping: 15 }}
                style={{ fontSize: 34, fontWeight: 900, fontStyle: "italic", lineHeight: 1.05, marginTop: 4, color: "#fff1f2", textShadow: "0 2px 0 #fca5a5, 0 4px 0 #ef4444, 0 7px 0 #7f1d1d, 0 10px 20px rgba(0,0,0,0.6)" }}>
                {(foe.emoji ? foe.emoji + " " : "") + String(foe.name || "").toUpperCase()}
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginTop: 10 }}>
                {[sc.rank ? "World #" + sc.rank : null, sc.titles ? sc.titles + (sc.titles === 1 ? " title" : " titles") : "Hungry for a first title", sc.standing ? sc.standing.icon + " " + sc.standing.tag : null].filter(Boolean).map(function (t, i) {
                  return (<span key={i} style={{ fontSize: 12, fontWeight: 900, padding: "4px 9px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }}>{t}</span>);
                })}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3 }}
                style={{ marginTop: 12, maxWidth: 320, fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14, color: "#e7e5e4" }}>“{words}”</motion.div>
            </>)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
