/* ═══ Splash ═══ The intro video at double speed (~5s), the title pops in, then straight into the game.
   Tap skips. If the video can't play (autoplay refused, slow network) the animated icon plays instead. */

import * as React from "react";
import { motion } from "framer-motion";
import { FONT } from "../ui/theme";
import { Sparks, REDUCED_MOTION } from "./fx";

const { useState, useEffect, useRef } = React;

var SEEN_KEY = "gj-splash-seen";
var SPEED = 2;            /* 10s clip → ~5s */
var TITLE_HOLD = 1300;    /* title stays this long after the clip ends */
var ICON_DURATION = 3500; /* fallback animation length */
var HARD_CAP = 9000;      /* never hold the player longer than this */

export function splashSeen() {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
}

function Title(props) {
  return (
    <motion.div initial={{ opacity: 0, y: 16, scale: 0.85 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: props.delay || 0, type: "spring", stiffness: 320, damping: 18 }}
      style={{ textAlign: "center", padding: "0 16px" }}>
      <div style={{ fontSize: 14, fontWeight: 900, letterSpacing: 6, color: "#fff", textShadow: "0 2px 0 #1e3a5f" }}>THE GRAND</div>
      <div style={{ fontSize: "clamp(28px, 8.5vw, 50px)", fontWeight: 900, fontStyle: "italic", lineHeight: 1.02, color: "#fff7ed", letterSpacing: 1,
        textShadow: "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 6px 0 #b45309, 0 8px 0 #7c2d12, 0 10px 18px rgba(0,0,0,0.3)" }}>
        GRANNY ROOSTER<br />JOUST
      </div>
    </motion.div>
  );
}

function IconAnim() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
      <div style={{ position: "relative" }}>
        <motion.div initial={{ scale: 0.25, rotate: -14, y: -40 }} animate={{ scale: [0.25, 1.1, 1], rotate: [-14, 4, 0], y: [-40, 0, 0] }}
          transition={{ duration: 0.75, times: [0, 0.6, 1], ease: "easeOut" }} style={{ width: "min(62vw, 46vh, 300px)", aspectRatio: "1 / 1" }}>
          <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: "22%", overflow: "hidden", boxShadow: "0 18px 40px rgba(15,23,42,0.35), 0 0 0 4px rgba(255,255,255,0.65)", animation: REDUCED_MOTION ? "none" : "riderBob 1.1s ease-in-out 0.9s infinite" }}>
            <img src="/icon-1024.jpg" alt="The Grand Granny Rooster Joust" width="300" height="300" style={{ width: "100%", height: "100%", display: "block", objectFit: "cover", transform: "scale(1.06)" }} />
            {!REDUCED_MOTION && (
              <motion.div aria-hidden initial={{ x: "-130%" }} animate={{ x: "130%" }} transition={{ delay: 0.8, duration: 0.7, ease: "easeInOut", repeat: 2, repeatDelay: 0.6 }}
                style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.75) 48%,transparent 66%)", pointerEvents: "none" }} />
            )}
          </div>
        </motion.div>
        <Sparks count={22} spread={190} delay={0.55} colors={["#fde68a", "#ffffff", "#f472b6", "#facc15"]} zIndex={3} />
      </div>
      <Title delay={0.85} />
    </div>
  );
}

export default function Splash(props) {
  var _mode = useState(REDUCED_MOTION ? "icon" : "video"), mode = _mode[0], setMode = _mode[1];
  var _title = useState(false), showTitle = _title[0], setShowTitle = _title[1];
  var vid = useRef(null);
  var done = useRef(false);
  function finish() {
    if (done.current) return;
    done.current = true;
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
    props.onDone();
  }
  /* Timers, not animation callbacks: they still advance if the tab is in the background */
  useEffect(function () { var t = setTimeout(finish, HARD_CAP); return function () { clearTimeout(t); }; }, []);
  useEffect(function () {
    if (mode !== "icon") return;
    var t = setTimeout(finish, ICON_DURATION); return function () { clearTimeout(t); };
  }, [mode]);
  useEffect(function () {
    if (mode !== "video" || !vid.current) return;
    vid.current.playbackRate = SPEED;
    var p = vid.current.play();
    if (p && p.catch) p.catch(function () { setMode("icon"); });
    /* A clip that hasn't started within 2s (slow connection) gives way to the icon */
    var stall = setTimeout(function () { if (vid.current && vid.current.currentTime < 0.1) setMode("icon"); }, 2000);
    return function () { clearTimeout(stall); };
  }, [mode]);
  function onEnded() { setShowTitle(true); setTimeout(finish, TITLE_HOLD); }

  return (
    <div onClick={finish}
      style={{ position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden", fontFamily: FONT, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
        background: "radial-gradient(circle at 50% 45%,#9be0f5 0%,#5fbbe8 45%,#3b97d6 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
      {mode === "icon" ? (<IconAnim />) : (
        <>
          <video ref={vid} src="/intro.mp4" poster="/intro-poster.jpg" muted playsInline preload="auto"
            onLoadedMetadata={function (e) { e.currentTarget.playbackRate = SPEED; }} onEnded={onEnded} onError={function () { setMode("icon"); }}
            style={{ width: "min(100%, 900px, calc(62vh * 16 / 9))", aspectRatio: "16 / 9", height: "auto", objectFit: "contain", display: "block",
              WebkitMaskImage: "radial-gradient(ellipse 50% 50% at center, #000 62%, transparent 100%)", maskImage: "radial-gradient(ellipse 50% 50% at center, #000 62%, transparent 100%)" }} />
          <div style={{ minHeight: 120 }}>{showTitle && (<Title />)}</div>
        </>
      )}
      <div style={{ position: "absolute", bottom: "calc(env(safe-area-inset-bottom) + 16px)", left: 0, right: 0, textAlign: "center", fontSize: 11, fontWeight: 800, letterSpacing: 2, color: "rgba(255,255,255,0.85)" }}>TAP TO SKIP</div>
    </div>
  );
}
