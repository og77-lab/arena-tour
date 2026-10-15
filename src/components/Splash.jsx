/* ═══ Splash ═══ ~3.5s animated icon + title, then straight into the game (tap to skip) */

import * as React from "react";
import { motion } from "framer-motion";
import { FONT } from "../ui/theme";
import { Sparks, REDUCED_MOTION } from "./fx";

const { useEffect, useRef } = React;

var SEEN_KEY = "gj-splash-seen";
var DURATION = REDUCED_MOTION ? 1200 : 3500;

export function splashSeen() {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
}

export default function Splash(props) {
  var done = useRef(false);
  function finish() {
    if (done.current) return;
    done.current = true;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
    props.onDone();
  }
  /* Timer, not animation callbacks: it still advances if the tab is in the background */
  useEffect(function () { var t = setTimeout(finish, DURATION); return function () { clearTimeout(t); }; }, []);

  return (
    <motion.div onClick={finish}
      initial={{ opacity: 1 }} animate={{ opacity: [1, 1, 0] }} transition={{ duration: DURATION / 1000, times: [0, 0.88, 1] }}
      style={{ position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden", fontFamily: FONT, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
        background: "radial-gradient(circle at 50% 40%,#9be0f5 0%,#5fbbe8 45%,#3b97d6 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
      <div style={{ position: "relative" }}>
        <motion.div
          initial={{ scale: 0.25, rotate: -14, y: -40 }}
          animate={{ scale: [0.25, 1.1, 1], rotate: [-14, 4, 0], y: [-40, 0, 0] }}
          transition={{ duration: 0.75, times: [0, 0.6, 1], ease: "easeOut" }}
          style={{ width: "min(62vw, 46vh, 300px)", aspectRatio: "1 / 1" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "22%", overflow: "hidden", boxShadow: "0 18px 40px rgba(15,23,42,0.35), 0 0 0 4px rgba(255,255,255,0.65)", animation: REDUCED_MOTION ? "none" : "riderIdle 1.6s ease-in-out 0.9s infinite" }}>
            <img src="/icon-1024.jpg" alt="The Grand Granny Rooster Joust" width="300" height="300" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", transform: "scale(1.06)" }} />
            {/* Shine sweeping across the icon once it lands */}
            {!REDUCED_MOTION && (
              <motion.div aria-hidden initial={{ x: "-130%" }} animate={{ x: "130%" }} transition={{ delay: 0.8, duration: 0.7, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.75) 48%,transparent 66%)", pointerEvents: "none" }} />
            )}
          </div>
        </motion.div>
        <Sparks count={22} spread={190} delay={0.55} colors={["#fde68a", "#ffffff", "#f472b6", "#facc15"]} zIndex={3} />
      </div>

      <motion.div initial={{ opacity: 0, y: 16, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.85, type: "spring", stiffness: 320, damping: 18 }}
        style={{ textAlign: "center", padding: "0 16px" }}>
        <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 6, color: "#fff", textShadow: "0 2px 0 #1e3a5f" }}>THE GRAND</div>
        <div style={{ fontSize: "clamp(28px, 8.5vw, 50px)", fontWeight: 900, fontStyle: "italic", lineHeight: 1.02, color: "#fff7ed", letterSpacing: 1,
          textShadow: "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 6px 0 #b45309, 0 8px 0 #7c2d12, 0 10px 18px rgba(0,0,0,0.3)" }}>
          GRANNY ROOSTER<br />JOUST
        </div>
      </motion.div>
    </motion.div>
  );
}
