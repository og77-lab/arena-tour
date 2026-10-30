/* ═══ StudioOverlay ═══ Two old men in a dark broadcast booth who open every match: Sir Barry Pecksworth (dry BBC
   broadcaster) and Reggie Clutter (gruff Northern ex-champion), sitting at a desk with microphones under the
   KNITTING CLUB BROADCASTING sign. One pre-rendered audio file carries the whole pre-match segment; the component
   maps time windows to the active speaker so his portrait swaps between the neutral and talking stills while his
   partner holds still. Tiny head sway on both so they feel alive. Skip button top-right and Space/Enter/Escape
   dismiss the segment; after three full plays in a session it auto-skips. The next time the real match intro picks
   up. Characters sit BEHIND the desk strip: the bottom slice of the booth image is redrawn on top so the microphones
   and desk edge cover the busts. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

var AUDIO_SRC = "/sounds/studio/pre-match-demo.mp3";
var BOOTH = "/art/studio/studio-booth.png";
/* Each segment: when (seconds) the current speaker's turn ENDS. Values measured from the stitched mp3. */
var TIMINGS = [
  { speaker: "barry",  end: 16.19 },
  { speaker: "reggie", end: 24.22 },
  { speaker: "barry",  end: 28.49 },
  { speaker: "reggie", end: 30.44 },
  { speaker: "barry",  end: 38.15 },
  { speaker: "reggie", end: 44.90 },
  { speaker: "barry",  end: 53.09 },
  { speaker: "reggie", end: 57.84 },
  { speaker: "barry",  end: 60.51 },
  { speaker: "reggie", end: 63.47 }
];
/* The booth art canvas is 1792×1024. Characters live on the same canvas at the coords the artist specified.
   Reggie faces image-right so he sits on the LEFT; Barry faces image-left so he sits on the RIGHT. The lower
   274 px of the booth is redrawn on top so the microphones and desk edge sit in front of the busts. */
var CANVAS_W = 1792, CANVAS_H = 1024;
var REGGIE_BOX = { x: 100, y: 315, w: 680, h: 680 };
var BARRY_BOX  = { x: 1012, y: 315, w: 680, h: 680 };
var DESK_TOP = 750, DESK_H = CANVAS_H - DESK_TOP;
var PLAY_KEY = "studioPlayCount";
var AUTOSKIP_AFTER = 3;

function pct(a, b) { return (a / b) * 100 + "%"; }
function speakerAt(t) { for (var i = 0; i < TIMINGS.length; i++) if (t < TIMINGS[i].end) return TIMINGS[i].speaker; return null; }

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
  var audioRef = React.useRef(null);
  var _t = React.useState(0), t = _t[0], setT = _t[1];
  var _done = React.useState(false), done = _done[0], setDone = _done[1];
  var _mouth = React.useState(false), mouth = _mouth[0], setMouth = _mouth[1];
  var _sway = React.useState({ barry: 0, reggie: 0 }), sway = _sway[0], setSway = _sway[1];
  var _ready = React.useState(false), ready = _ready[0], setReady = _ready[1];

  React.useEffect(function () {
    var n = 0; try { n = parseInt(sessionStorage.getItem(PLAY_KEY) || "0", 10) || 0; } catch (e) {}
    if (n >= AUTOSKIP_AFTER) { props.onDone && props.onDone(); return; }
    var a = audioRef.current; if (!a) return;
    var onTime = function () { setT(a.currentTime); };
    var onEnd = function () { try { sessionStorage.setItem(PLAY_KEY, String(n + 1)); } catch (e) {} setDone(true); setTimeout(function () { props.onDone && props.onDone(); }, 500); };
    var onCan = function () { setReady(true); a.play().catch(function () { setReady(true); }); };
    a.addEventListener("timeupdate", onTime); a.addEventListener("ended", onEnd); a.addEventListener("canplay", onCan);
    return function () { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); a.removeEventListener("canplay", onCan); try { a.pause(); } catch (e) {} };
  }, []);

  /* Lip sync by portrait swap: toggle active speaker between neutral and talking at ~140ms, random. */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id = setInterval(function () {
      var a = audioRef.current; if (!a || a.paused) { setMouth(false); return; }
      setMouth(Math.random() > 0.35);
    }, 140);
    return function () { clearInterval(id); };
  }, []);

  /* Slow head sway on both heads, independent timers so they don't move in lockstep. */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id1 = setInterval(function () { setSway(function (s) { return { barry: (Math.random() - 0.5) * 1.6, reggie: s.reggie }; }); }, 1700);
    var id2 = setInterval(function () { setSway(function (s) { return { barry: s.barry, reggie: (Math.random() - 0.5) * 1.6 }; }); }, 2100);
    return function () { clearInterval(id1); clearInterval(id2); };
  }, []);

  var active = speakerAt(t);
  var barryOpen = active === "barry" && mouth;
  var reggieOpen = active === "reggie" && mouth;
  var pctDone = Math.min(100, (t / TIMINGS[TIMINGS.length - 1].end) * 100);

  function skip() { try { if (audioRef.current) audioRef.current.pause(); } catch (e) {} props.onDone && props.onDone(); }
  React.useEffect(function () {
    function onKey(e) { if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") { e.preventDefault(); skip(); } }
    window.addEventListener("keydown", onKey); return function () { window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div style={{ position: "relative", maxWidth: 520, margin: "0 auto 8px", borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 14px rgba(0,0,0,0.3), 0 0 0 3px #78350f" }}>
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />
      <div style={{ position: "relative", width: "100%", aspectRatio: CANVAS_W + "/" + CANVAS_H, background: "#000" }}>
        {/* booth (back layer) */}
        <img src={BOOTH} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} draggable={false} />
        {/* characters, behind the desk */}
        <Portrait box={REGGIE_BOX} open={reggieOpen} neutralSrc="/art/studio/reggie-neutral.png" talkingSrc="/art/studio/reggie-talking.png" sway={sway.reggie} />
        <Portrait box={BARRY_BOX}  open={barryOpen}  neutralSrc="/art/studio/barry-neutral.png"  talkingSrc="/art/studio/barry-talking.png"  sway={sway.barry} />
        {/* desk strip redrawn on top so busts sit BEHIND the microphones and desk edge */}
        <div style={{
          position: "absolute", left: 0, right: 0, top: pct(DESK_TOP, CANVAS_H), height: pct(DESK_H, CANVAS_H),
          backgroundImage: "url(" + BOOTH + ")", backgroundSize: "100% " + pct(CANVAS_H, DESK_H),
          backgroundPosition: "bottom", backgroundRepeat: "no-repeat", pointerEvents: "none", zIndex: 2
        }} />
        {/* LIVE pill */}
        <div style={{ position: "absolute", top: 8, left: 10, zIndex: 3, display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(185,28,28,0.92)", color: "#fde68a", fontSize: 10, fontWeight: 900, letterSpacing: 2, padding: "3px 8px", borderRadius: 10, textTransform: "uppercase", boxShadow: "0 2px 6px rgba(0,0,0,0.3)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#fde68a", boxShadow: "0 0 6px #fde68a", animation: REDUCED_MOTION ? "none" : "pulse 1s steps(2) infinite" }} />
          LIVE · PRE-MATCH
        </div>
        {/* skip */}
        <button onClick={skip} aria-label="Skip pre-match"
          style={{ position: "absolute", top: 8, right: 8, zIndex: 3, padding: "5px 11px", borderRadius: 10, background: "rgba(0,0,0,0.55)", color: "#fde68a", border: "1px solid rgba(253,230,138,0.5)", fontSize: 11, fontWeight: 900, letterSpacing: 1, cursor: "pointer", textTransform: "uppercase" }}>Skip ⟩⟩</button>
        {!ready && (<div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", color: "#fde68a", fontSize: 10, fontWeight: 900, letterSpacing: 1, zIndex: 3 }}>Cueing up…</div>)}
        {done && (<div style={{ position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", color: "#86efac", fontSize: 10, fontWeight: 900, letterSpacing: 1, zIndex: 3 }}>… AND NOW TO THE LANES</div>)}
      </div>
      {/* progress */}
      <div style={{ height: 3, background: "#0b0b0b" }}>
        <div style={{ width: pctDone + "%", height: "100%", background: "#fde68a", transition: "width 150ms linear" }} />
      </div>
    </div>
  );
}
