/* ═══ FinalOutro ═══ The end of a final gets its own moment before the usual result card.
   Won: golden rain and fireworks, the trophy lifted overhead, CHAMPION in lights, the title and prize counted up.
   Lost: the lights dim, the silver medal, and a nod across the lane as she lifts the trophy. About seven seconds. */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { Rider } from "./Rider";
import { Sparks, CountUp, REDUCED_MOTION, vibrate } from "./fx";
import { playVictoryBig, playTitle, playCrowdRoar, playDefeatBig, playClang } from "../sounds";

const { useEffect, useRef, useMemo } = React;

function GoldRain() {
  var bits = useMemo(function () {
    var out = []; for (var i = 0; i < 40; i++) out.push({ x: Math.random() * 100, d: Math.random() * 2.2, t: 2.2 + Math.random() * 2, c: ["#fbbf24", "#fde68a", "#ffffff", "#f59e0b"][i % 4], w: 5 + Math.random() * 6 });
    return out;
  }, []);
  if (REDUCED_MOTION) return null;
  return (<>{bits.map(function (b, i) {
    return (<div key={i} aria-hidden style={{ position: "absolute", top: -20, left: b.x + "%", width: b.w, height: b.w * 0.5, background: b.c, borderRadius: 2,
      animation: "confetti-fall " + b.t.toFixed(2) + "s linear " + b.d.toFixed(2) + "s infinite" }} />);
  })}</>);
}

export default function FinalOutro(props) {
  var won = props.won;
  var doneRef = useRef(props.onDone); doneRef.current = props.onDone;
  useEffect(function () {
    var ts = [];
    if (won) {
      playVictoryBig(); vibrate([40, 60, 40, 60, 120]);
      ts.push(setTimeout(playCrowdRoar, 300), setTimeout(playTitle, 1500), setTimeout(playClang, 2600));
    } else {
      playDefeatBig(); ts.push(setTimeout(playCrowdRoar, 1800));
    }
    ts.push(setTimeout(function () { doneRef.current(); }, won ? 7200 : 6200));
    return function () { ts.forEach(clearTimeout); };
  }, []);

  return createPortal(
    <div onClick={function () { doneRef.current(); }} style={{ position: "fixed", inset: 0, zIndex: 1001, overflow: "hidden", cursor: "pointer", textAlign: "center", color: "#fef3c7", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: won ? "radial-gradient(circle at 50% 40%,#78350f 0%,#1c1917 70%)" : "radial-gradient(circle at 50% 40%,#334155 0%,#0f172a 75%)" }}>
      {won && <GoldRain />}
      {won && (<>
        <div style={{ position: "absolute", left: "22%", top: "16%" }}><Sparks count={30} spread={200} delay={0.4} colors={["#fbbf24", "#ffffff", "#f472b6"]} zIndex={2} /></div>
        <div style={{ position: "absolute", right: "22%", top: "12%" }}><Sparks count={30} spread={200} delay={1.1} colors={["#60a5fa", "#fbbf24", "#ffffff"]} zIndex={2} /></div>
        <div style={{ position: "absolute", left: "50%", top: "22%" }}><Sparks count={36} spread={260} delay={1.9} colors={["#fbbf24", "#fde68a", "#22c55e"]} zIndex={2} /></div>
      </>)}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 16px" }}>
        <motion.div initial={{ opacity: 0, letterSpacing: "14px" }} animate={{ opacity: 1, letterSpacing: "5px" }} transition={{ delay: 0.2, duration: 1 }}
          style={{ fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: won ? "#fde68a" : "#cbd5e1" }}>{props.tierName} · {won ? "Champion" : "Runner-up"}</motion.div>

        {/* The rider (and the trophy or the silver medal) */}
        <div style={{ position: "relative", marginTop: 10, height: 220, width: 260 }}>
          {won ? (
            <>
              <motion.div initial={{ y: 40, scale: 0.9 }} animate={{ y: 0, scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 14 }}
                style={{ position: "absolute", left: 20, bottom: 0, filter: "drop-shadow(0 0 24px rgba(251,191,36,0.7))" }}>
                <Rider palette={props.youPalette} width={210} pose="cheer" crown={true} />
              </motion.div>
              <motion.div initial={{ y: 120, opacity: 0, scale: 0.4 }} animate={{ y: [120, -20, -10], opacity: 1, scale: [0.4, 1.25, 1.1] }} transition={{ delay: 1.2, duration: 1.2, times: [0, 0.7, 1] }}
                style={{ position: "absolute", left: 98, top: -10, fontSize: 70, filter: "drop-shadow(0 0 22px rgba(251,191,36,0.95))" }}>🏆</motion.div>
            </>
          ) : (
            <>
              <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.8 }} style={{ position: "absolute", left: -10, bottom: 0, filter: "grayscale(0.35)" }}>
                <Rider palette={props.youPalette} width={170} pose="idle" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 0.9, x: 0 }} transition={{ delay: 1.6, duration: 0.9 }} style={{ position: "absolute", right: -30, bottom: 6 }}>
                <Rider palette={props.foePalette} width={140} pose="cheer" flip={true} crown={true} />
              </motion.div>
              <motion.div initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.9, type: "spring", stiffness: 260, damping: 12 }}
                style={{ position: "absolute", left: 60, top: 10, fontSize: 54, filter: "drop-shadow(0 0 16px rgba(203,213,225,0.8))" }}>🥈</motion.div>
            </>
          )}
        </div>

        <motion.div initial={{ scale: 2.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: won ? 2.1 : 1.1, type: "spring", stiffness: 300, damping: 13 }}
          style={{ fontSize: won ? 52 : 38, fontWeight: 900, fontStyle: "italic", lineHeight: 1.02, marginTop: 6,
            color: won ? "#fffbeb" : "#e2e8f0", textShadow: won ? "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 7px 0 #b45309, 0 0 30px rgba(251,191,36,0.9)" : "0 3px 0 #475569, 0 6px 14px rgba(0,0,0,0.5)" }}>
          {won ? "CHAMPION!" : "SO CLOSE."}
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: won ? 2.8 : 2.2 }}
          style={{ marginTop: 10, fontSize: 15, fontWeight: 800, color: won ? "#fde68a" : "#cbd5e1" }}>
          {won ? (props.pts ? (<span>+<CountUp to={props.pts} duration={1200} /> points · {props.money >= 1000000 ? "$" + (props.money / 1000000).toFixed(1) + "M" : props.money >= 1000 ? "$" + Math.round(props.money / 1000) + "K" : "$" + (props.money || 0)}</span>) : "Champion of the world!")
            : (props.foeName ? props.foeName + " lifts the trophy. Silver is yours — and next time…" : "Silver is yours — and next time…")}
        </motion.div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} transition={{ delay: 3.6 }} style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom) + 18px)", left: 0, right: 0, fontSize: 11, fontWeight: 800, letterSpacing: 2 }}>TAP TO CONTINUE</motion.div>
      </div>
    </div>,
    document.body
  );
}
