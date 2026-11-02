/* ═══ StudioOverlay ═══ Two old men in a dark broadcast booth who open each match: Sir Barry Pecksworth (dry BBC
   broadcaster) and Reggie Clutter (gruff Northern ex-champion). This is the TEXT-FIRST prototype: the dialogue is
   picked by the commentary engine (engine/commentary.js) from the real match data and shown as subtitles, no
   audio yet. The active speaker's portrait swaps between neutral and talking so he looks like he's actually
   saying it; the other sits still. Skip button, Space/Enter/Escape dismiss. The code and art ride ready for
   the TTS batch when we're happy with the shortlist of lines. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

var BOOTH = "/art/studio/studio-booth.png";
var CANVAS_W = 1792, CANVAS_H = 1024;
var REGGIE_BOX = { x: 100, y: 315, w: 680, h: 680 };
var BARRY_BOX  = { x: 1012, y: 315, w: 680, h: 680 };
var DESK_TOP = 750, DESK_H = CANVAS_H - DESK_TOP;
var PLAY_KEY = "studioPlayCount";
var AUTOSKIP_AFTER = 3;

function pct(a, b) { return (a / b) * 100 + "%"; }

function Portrait(props) {
  var box = props.box, open = props.open, neutralSrc = props.neutralSrc, talkingSrc = props.talkingSrc, sway = props.sway;
  return (
    <div style={{
      position: "absolute", left: pct(box.x, CANVAS_W), top: pct(box.y, CANVAS_H),
      width: pct(box.w, CANVAS_W), height: pct(box.h, CANVAS_H),
      transform: "translateY(" + (sway * 0.4).toFixed(2) + "%) rotate(" + (sway * 0.6).toFixed(2) + "deg)",
      transformOrigin: "50% 100%", transition: REDUCED_MOTION ? "none" : "transform 260ms ease", zIndex: 1
    }}>
      <img src={neutralSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: open ? 0 : 1 }} draggable={false} />
      <img src={talkingSrc} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: open ? 1 : 0 }} draggable={false} />
    </div>
  );
}

export default function StudioOverlay(props) {
  var lines = (props.commentary && props.commentary.lines) || [];
  var totalMs = (props.commentary && props.commentary.totalMs) || 1;
  var _idx = React.useState(0), idx = _idx[0], setIdx = _idx[1];
  var _elapsed = React.useState(0), elapsed = _elapsed[0], setElapsed = _elapsed[1];
  var _mouth = React.useState(false), mouth = _mouth[0], setMouth = _mouth[1];
  var _sway = React.useState({ barry: 0, reggie: 0 }), sway = _sway[0], setSway = _sway[1];
  var startRef = React.useRef(0);

  React.useEffect(function () {
    var n = 0; try { n = parseInt(sessionStorage.getItem(PLAY_KEY) || "0", 10) || 0; } catch (e) {}
    if (n >= AUTOSKIP_AFTER || lines.length === 0) { props.onDone && props.onDone(); return; }
    startRef.current = Date.now();
    var id = setInterval(function () {
      var e = Date.now() - startRef.current;
      setElapsed(e);
      /* which line we're on */
      var acc = 0, next = 0;
      for (var i = 0; i < lines.length; i++) { if (e < acc + lines[i].durMs) { next = i; break; } acc += lines[i].durMs; if (i === lines.length - 1) next = lines.length; }
      if (next >= lines.length) {
        try { sessionStorage.setItem(PLAY_KEY, String(n + 1)); } catch (ee) {}
        clearInterval(id);
        setTimeout(function () { props.onDone && props.onDone(); }, 500);
      } else {
        setIdx(next);
      }
    }, 60);
    return function () { clearInterval(id); };
  }, []);

  /* fake lip sync while a line is "being spoken" */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id = setInterval(function () { setMouth(Math.random() > 0.35); }, 140);
    return function () { clearInterval(id); };
  }, []);

  /* slow head sway */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id1 = setInterval(function () { setSway(function (s) { return { barry: (Math.random() - 0.5) * 1.6, reggie: s.reggie }; }); }, 1700);
    var id2 = setInterval(function () { setSway(function (s) { return { barry: s.barry, reggie: (Math.random() - 0.5) * 1.6 }; }); }, 2100);
    return function () { clearInterval(id1); clearInterval(id2); };
  }, []);

  var current = lines[idx] || null;
  var active = current ? current.speaker : null;
  var barryOpen = active === "barry" && mouth;
  var reggieOpen = active === "reggie" && mouth;
  var pctDone = Math.min(100, (elapsed / totalMs) * 100);

  function skip() { props.onDone && props.onDone(); }
  React.useEffect(function () {
    function onKey(e) { if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") { e.preventDefault(); skip(); } }
    window.addEventListener("keydown", onKey); return function () { window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "#070b14", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "12px", boxSizing: "border-box", touchAction: "manipulation", userSelect: "none", WebkitUserSelect: "none" }}>
      <div style={{ position: "relative", width: "100%", maxWidth: 760, aspectRatio: CANVAS_W + "/" + CANVAS_H, background: "#000", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 0 3px #78350f" }}>
        <img src={BOOTH} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} draggable={false} />
        <Portrait box={REGGIE_BOX} open={reggieOpen} neutralSrc="/art/studio/reggie-neutral.png" talkingSrc="/art/studio/reggie-talking.png" sway={sway.reggie} />
        <Portrait box={BARRY_BOX}  open={barryOpen}  neutralSrc="/art/studio/barry-neutral.png"  talkingSrc="/art/studio/barry-talking.png"  sway={sway.barry} />
        <div style={{
          position: "absolute", left: 0, right: 0, top: pct(DESK_TOP, CANVAS_H), height: pct(DESK_H, CANVAS_H),
          backgroundImage: "url(" + BOOTH + ")", backgroundSize: "100% " + pct(CANVAS_H, DESK_H),
          backgroundPosition: "bottom", backgroundRepeat: "no-repeat", pointerEvents: "none", zIndex: 2
        }} />
        <div style={{ position: "absolute", top: 8, left: 10, zIndex: 3, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(185,28,28,0.92)", color: "#fde68a", fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", borderRadius: 10, textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fde68a", boxShadow: "0 0 6px #fde68a", animation: REDUCED_MOTION ? "none" : "pulse 1s steps(2) infinite" }} />
          LIVE · {props.phase === "post" ? "POST-MATCH" : props.phase === "between" ? "BETWEEN SETS" : "PRE-MATCH"}
        </div>
        <button onClick={skip} aria-label="Skip pre-match"
          style={{ position: "absolute", top: 8, right: 8, zIndex: 3, padding: "5px 11px", borderRadius: 10, background: "rgba(0,0,0,0.55)", color: "#fde68a", border: "1px solid rgba(253,230,138,0.5)", fontSize: 11, fontWeight: 900, letterSpacing: 1, cursor: "pointer", textTransform: "uppercase" }}>Skip ⟩⟩</button>
        {current && (
          <div style={{ position: "absolute", left: "4%", right: "4%", bottom: "6%", zIndex: 4, padding: "10px 14px", background: "rgba(7,11,20,0.86)", color: "#fff", borderRadius: 10, border: "1px solid rgba(253,230,138,0.35)", boxShadow: "0 4px 14px rgba(0,0,0,0.4)" }}>
            <div style={{ color: current.speaker === "barry" ? "#fde68a" : "#86efac", fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", marginBottom: 3 }}>
              {current.speaker === "barry" ? "Sir Barry" : "Reggie"}
            </div>
            <div style={{ fontSize: 15, lineHeight: 1.35, fontWeight: 600 }}>{current.text}</div>
          </div>
        )}
      </div>
      <div style={{ width: "100%", maxWidth: 760, height: 3, background: "#0b0b0b", marginTop: 6, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: pctDone + "%", height: "100%", background: "#fde68a", transition: "width 60ms linear" }} />
      </div>
    </div>
  );
}
