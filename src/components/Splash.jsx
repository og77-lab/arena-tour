/* ═══ Splash ═══ Opening video + title card, once per browser session */

import * as React from "react";
import { motion } from "framer-motion";
import { FONT } from "../ui/theme";
import { REDUCED_MOTION } from "./fx";

const { useState, useRef, useEffect } = React;

var SEEN_KEY = "gj-splash-seen";

export function splashSeen() {
  try { return sessionStorage.getItem(SEEN_KEY) === "1"; } catch (e) { return false; }
}

export default function Splash(props) {
  var _stage = useState(REDUCED_MOTION ? "title" : "video"), stage = _stage[0], setStage = _stage[1];
  var _muted = useState(true), muted = _muted[0], setMuted = _muted[1];
  var vid = useRef(null);

  useEffect(function () {
    if (stage !== "video" || !vid.current) return;
    var p = vid.current.play();
    /* Autoplay can be refused (e.g. iOS low-power mode): go straight to the title card over the poster */
    if (p && p.catch) p.catch(function () { setStage("title"); });
  }, []);

  function toTitle() { if (stage === "video") setStage("title"); }
  function start() {
    try { sessionStorage.setItem(SEEN_KEY, "1"); } catch (e) {}
    if (vid.current) vid.current.pause();
    props.onDone();
  }
  function toggleSound(e) {
    e.stopPropagation();
    var m = !muted; setMuted(m);
    if (vid.current) { vid.current.muted = m; if (!m && vid.current.paused && stage === "video") vid.current.play().catch(function () {}); }
  }

  var chip = { background: "rgba(15,23,42,0.55)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 20, fontFamily: FONT, fontWeight: 900, fontSize: 12, letterSpacing: 1, padding: "7px 12px", cursor: "pointer" };

  return (
    <div onClick={stage === "video" ? toTitle : start}
      style={{ position: "fixed", inset: 0, zIndex: 2000, overflow: "hidden", fontFamily: FONT, cursor: "pointer", userSelect: "none", WebkitUserSelect: "none",
        background: "radial-gradient(circle at 50% 45%,#9be0f5 0%,#5fbbe8 45%,#3b97d6 100%)",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "env(safe-area-inset-top) 0 env(safe-area-inset-bottom)" }}>
      <video ref={vid} src="/intro.mp4" poster="/intro-poster.jpg" muted={muted} playsInline preload="auto"
        onEnded={toTitle} onError={toTitle}
        style={{ width: stage === "title" ? "min(100%, 900px, calc(48vh * 16 / 9))" : "min(100%, 900px, calc(70vh * 16 / 9))", aspectRatio: "16 / 9", height: "auto", objectFit: "contain", display: "block",
          /* Feather the video's own blue backdrop into the page so no rectangle edge shows */
          WebkitMaskImage: "radial-gradient(ellipse 50% 50% at center, #000 62%, transparent 100%)", maskImage: "radial-gradient(ellipse 50% 50% at center, #000 62%, transparent 100%)" }} />

      {stage === "title" && (
        <div style={{ textAlign: "center", padding: "0 18px", marginTop: 6 }}>
          <motion.div initial={{ scale: 0.6, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: 6, color: "#fff", textShadow: "0 2px 0 #1e3a5f" }}>THE GRAND</div>
            <div style={{ fontSize: "clamp(30px, 9vw, 54px)", fontWeight: 900, fontStyle: "italic", lineHeight: 1.02, color: "#fff7ed", letterSpacing: 1,
              textShadow: "0 2px 0 #fde68a, 0 4px 0 #f59e0b, 0 6px 0 #b45309, 0 8px 0 #7c2d12, 0 10px 18px rgba(0,0,0,0.3)" }}>
              GRANNY ROOSTER<br />JOUST
            </div>
          </motion.div>
          <motion.button onClick={function (e) { e.stopPropagation(); start(); }}
            initial={{ y: 14, scale: 0.92 }} animate={{ y: 0, scale: 1 }} transition={{ delay: 0.3, type: "spring", stiffness: 380, damping: 18 }}
            style={{ marginTop: 22, background: "linear-gradient(180deg,#fde68a,#f59e0b)", color: "#3f2a1d", border: "2px solid #3f2a1d", boxShadow: "0 5px 0 #3f2a1d", borderRadius: 14, padding: "14px 34px", fontFamily: FONT, fontWeight: 900, fontSize: 18, letterSpacing: 2, cursor: "pointer", animation: REDUCED_MOTION ? "none" : "pulse 1.4s ease infinite 1s" }}>
            TAP TO START
          </motion.button>
        </div>
      )}

      {stage === "video" && (
        <>
          <button onClick={toggleSound} aria-label={muted ? "Turn sound on" : "Turn sound off"} style={Object.assign({}, chip, { position: "absolute", top: "calc(env(safe-area-inset-top) + 14px)", right: 14 })}>{muted ? "🔇 SOUND" : "🔊 SOUND"}</button>
          <button onClick={function (e) { e.stopPropagation(); toTitle(); }} style={Object.assign({}, chip, { position: "absolute", bottom: "calc(env(safe-area-inset-bottom) + 18px)", right: 14 })}>SKIP ›</button>
        </>
      )}
    </div>
  );
}
