/* ═══ StudioOverlay ═══ Two old men in a dark broadcast booth who open every match: Sir Barry Pecksworth (dry BBC
   broadcaster) and Reggie Clutter (gruff Northern ex-champion), sitting at a desk with microphones and the
   "KNITTING CLUB LIVE" ribbon over them. One pre-rendered audio file carries the whole pre-match segment; the
   component maps time windows to the active speaker so his mouth opens on cue and the other sits still. Random
   blinks and a tiny head sway on both so they feel alive. Skip button top-right and the SPACE key dismiss the
   segment; after three full plays in a session it auto-skips. The next time the real match intro picks up.
   This is a prototype on one hard-coded file; later the lines are picked and stitched per-match. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

var AUDIO_SRC = "/sounds/studio/pre-match-demo.mp3";
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
var PLAY_KEY = "studioPlayCount";
var AUTOSKIP_AFTER = 3;

function speakerAt(t) {
  for (var i = 0; i < TIMINGS.length; i++) if (t < TIMINGS[i].end) return TIMINGS[i].speaker;
  return null;
}

/* One commentator at the desk. mouthOpen 0..1 drives the mouth; blink is a 0..1 pulse (1 = eyes shut). */
function Head(props) {
  var p = props.palette, name = props.name, role = props.role;
  var mouth = Math.max(0.08, Math.min(1, props.mouthOpen || 0.08));
  var blink = props.blink || 0;
  var eyeH = 2.4 * (1 - blink);
  var sway = props.sway || 0;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, minWidth: 0 }}>
      <div style={{ transform: "translateY(" + (sway * 1.5).toFixed(2) + "px) rotate(" + (sway * 1.2).toFixed(2) + "deg)", transformOrigin: "50% 100%", transition: REDUCED_MOTION ? "none" : "transform 220ms ease" }}>
        <svg viewBox="0 0 120 150" width="112" height="140" aria-hidden style={{ display: "block" }}>
          {/* shoulder & suit */}
          <path d={"M 10 150 Q 10 110 60 108 Q 110 110 110 150 Z"} fill={p.suit} stroke="#1a0f06" strokeWidth="1.6" />
          <rect x="56" y="112" width="8" height="24" fill={p.tie} stroke="#1a0f06" strokeWidth="0.8" />
          {/* neck */}
          <rect x="50" y="92" width="20" height="18" fill={p.skin} stroke="#1a0f06" strokeWidth="1.2" />
          {/* head */}
          <ellipse cx="60" cy="60" rx="36" ry="42" fill={p.skin} stroke="#1a0f06" strokeWidth="2" />
          {/* hair */}
          {p.hair === "bald" ? (
            <>
              <path d={"M 24 46 Q 60 10 96 46 Q 92 32 60 24 Q 28 32 24 46 Z"} fill="transparent" />
              <path d={"M 24 54 Q 32 70 24 86"} fill="none" stroke={p.hairCol} strokeWidth="4" strokeLinecap="round" />
              <path d={"M 96 54 Q 88 70 96 86"} fill="none" stroke={p.hairCol} strokeWidth="4" strokeLinecap="round" />
            </>
          ) : (
            <path d={"M 20 50 Q 30 14 60 14 Q 90 14 100 50 Q 94 36 60 28 Q 28 34 20 50 Z"} fill={p.hairCol} stroke="#1a0f06" strokeWidth="1.6" />
          )}
          {/* ears */}
          <ellipse cx="22" cy="62" rx="5" ry="8" fill={p.skin} stroke="#1a0f06" strokeWidth="1.2" />
          <ellipse cx="98" cy="62" rx="5" ry="8" fill={p.skin} stroke="#1a0f06" strokeWidth="1.2" />
          {/* glasses */}
          {p.glasses && (<g stroke="#1a0f06" strokeWidth="1.5" fill="none">
            <circle cx="44" cy="58" r="9" fill="rgba(255,255,255,0.14)" />
            <circle cx="76" cy="58" r="9" fill="rgba(255,255,255,0.14)" />
            <line x1="53" y1="58" x2="67" y2="58" />
          </g>)}
          {/* eyebrows */}
          <path d={"M 36 46 Q 44 42 52 46"} fill="none" stroke={p.brow} strokeWidth="2.6" strokeLinecap="round" transform={p.browAngle ? "rotate(" + p.browAngle + " 44 46)" : ""} />
          <path d={"M 68 46 Q 76 42 84 46"} fill="none" stroke={p.brow} strokeWidth="2.6" strokeLinecap="round" transform={p.browAngle ? "rotate(" + (-p.browAngle) + " 76 46)" : ""} />
          {/* eyes */}
          <ellipse cx="44" cy="58" rx="3.2" ry={eyeH} fill="#1a0f06" />
          <ellipse cx="76" cy="58" rx="3.2" ry={eyeH} fill="#1a0f06" />
          {blink > 0.5 && (<>
            <line x1="40" y1="58" x2="48" y2="58" stroke="#1a0f06" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="72" y1="58" x2="80" y2="58" stroke="#1a0f06" strokeWidth="1.6" strokeLinecap="round" />
          </>)}
          {/* nose */}
          <path d={"M 60 60 Q 58 72 60 78 Q 64 78 62 72 Z"} fill={p.noseShade} stroke="#1a0f06" strokeWidth="1" />
          {/* moustache */}
          {p.moustache && (<path d={"M 40 86 Q 60 92 80 86 Q 72 94 60 92 Q 48 94 40 86 Z"} fill={p.hairCol} stroke="#1a0f06" strokeWidth="1.2" />)}
          {/* mouth */}
          <g transform="translate(60 94)">
            <ellipse cx="0" cy="0" rx={5 + mouth * 2} ry={1.5 + mouth * 5} fill="#2a1a10" stroke="#1a0f06" strokeWidth="1.2" />
            {mouth > 0.3 && (<rect x={-3} y={-mouth * 2.5} width="6" height={mouth * 2.2} rx="1" fill="#f7e4c0" opacity="0.85" />)}
          </g>
          {/* chin shadow */}
          <path d={"M 36 86 Q 60 100 84 86"} fill="none" stroke={p.noseShade} strokeWidth="1.2" opacity="0.5" />
        </svg>
      </div>
      {/* mic */}
      <div style={{ marginTop: -14, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: 14, height: 20, borderRadius: "7px 7px 3px 3px", background: "linear-gradient(180deg,#4b5563,#1f2937)", border: "1px solid #0f172a", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08)" }} />
        <div style={{ width: 2, height: 14, background: "#334155" }} />
      </div>
      <div style={{ marginTop: 6, textAlign: "center", color: "#fde68a", fontWeight: 900, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", textShadow: "0 1px 0 #000" }}>{name}</div>
      <div style={{ marginTop: 1, color: "#94a3b8", fontSize: 9.5, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase" }}>{role}</div>
    </div>
  );
}

var BARRY = { suit: "#1f2937", tie: "#7f1d1d", skin: "#e8c6a4", noseShade: "#b4845e", hair: "ring", hairCol: "#e5e7eb", brow: "#9ca3af", glasses: true, moustache: false };
var REGGIE = { suit: "#3b2d1f", tie: "#047857", skin: "#d9a07b", noseShade: "#8b5a3b", hair: "bald", hairCol: "#78716c", brow: "#44403c", glasses: false, moustache: true, browAngle: 10 };

export default function StudioOverlay(props) {
  var audioRef = React.useRef(null);
  var _t = React.useState(0), t = _t[0], setT = _t[1];
  var _done = React.useState(false), done = _done[0], setDone = _done[1];
  var _blink = React.useState({ barry: 0, reggie: 0 }), blink = _blink[0], setBlink = _blink[1];
  var _sway = React.useState({ barry: 0, reggie: 0 }), sway = _sway[0], setSway = _sway[1];
  var _mouth = React.useState(0.1), mouth = _mouth[0], setMouth = _mouth[1];
  var _ready = React.useState(false), ready = _ready[0], setReady = _ready[1];

  React.useEffect(function () {
    /* auto-skip after a few full plays this session */
    var n = 0; try { n = parseInt(sessionStorage.getItem(PLAY_KEY) || "0", 10) || 0; } catch (e) {}
    if (n >= AUTOSKIP_AFTER) { props.onDone && props.onDone(); return; }
    var a = audioRef.current; if (!a) return;
    var onTime = function () { setT(a.currentTime); };
    var onEnd = function () { try { sessionStorage.setItem(PLAY_KEY, String(n + 1)); } catch (e) {} setDone(true); setTimeout(function () { props.onDone && props.onDone(); }, 500); };
    var onCan = function () { setReady(true); a.play().catch(function () { setReady(true); }); };
    a.addEventListener("timeupdate", onTime); a.addEventListener("ended", onEnd); a.addEventListener("canplay", onCan);
    return function () { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); a.removeEventListener("canplay", onCan); try { a.pause(); } catch (e) {} };
  }, []);

  /* fake lip-sync: oscillate mouth height every ~110ms while audio is playing */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id = setInterval(function () {
      var a = audioRef.current; if (!a || a.paused) { setMouth(0.1); return; }
      setMouth(0.25 + Math.random() * 0.7);
    }, 110);
    return function () { clearInterval(id); };
  }, []);

  /* independent random blinks */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var tm = { barry: null, reggie: null };
    function schedule(who) {
      tm[who] = setTimeout(function () {
        setBlink(function (b) { var n = {}; n.barry = b.barry; n.reggie = b.reggie; n[who] = 1; return n; });
        setTimeout(function () { setBlink(function (b) { var n = {}; n.barry = b.barry; n.reggie = b.reggie; n[who] = 0; return n; }); schedule(who); }, 110);
      }, 2200 + Math.random() * 3800);
    }
    schedule("barry"); schedule("reggie");
    return function () { if (tm.barry) clearTimeout(tm.barry); if (tm.reggie) clearTimeout(tm.reggie); };
  }, []);

  /* slow head sway */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id = setInterval(function () { setSway({ barry: (Math.random() - 0.5) * 2, reggie: (Math.random() - 0.5) * 2 }); }, 1800);
    return function () { clearInterval(id); };
  }, []);

  var active = speakerAt(t);
  var mB = active === "barry" ? mouth : 0.08, mR = active === "reggie" ? mouth : 0.08;
  var pct = Math.min(100, (t / TIMINGS[TIMINGS.length - 1].end) * 100);

  function skip() { try { if (audioRef.current) audioRef.current.pause(); } catch (e) {} props.onDone && props.onDone(); }
  React.useEffect(function () {
    function onKey(e) { if (e.code === "Space" || e.code === "Enter" || e.code === "Escape") { e.preventDefault(); skip(); } }
    window.addEventListener("keydown", onKey); return function () { window.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", background: "radial-gradient(ellipse at 50% 30%,#1e293b 0%,#0b1120 60%,#000 100%)", border: "3px solid #78350f", boxShadow: "inset 0 0 60px rgba(0,0,0,0.6), 0 4px 14px rgba(0,0,0,0.3)", padding: "14px 10px 10px", maxWidth: 520, margin: "0 auto 8px" }}>
      <audio ref={audioRef} src={AUDIO_SRC} preload="auto" />
      {/* ribbon */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 22, background: "linear-gradient(90deg,#b91c1c,#dc2626,#b91c1c)", color: "#fde68a", fontSize: 10, fontWeight: 900, letterSpacing: 2, textAlign: "center", lineHeight: "22px", textTransform: "uppercase", borderBottom: "1px solid #78350f" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fde68a", boxShadow: "0 0 6px #fde68a", animation: REDUCED_MOTION ? "none" : "pulse 1s steps(2) infinite" }} />
          Knitting Club Live · Pre-Match
        </span>
      </div>
      {/* skip */}
      <button onClick={skip} aria-label="Skip pre-match"
        style={{ position: "absolute", top: 28, right: 10, zIndex: 2, padding: "4px 10px", borderRadius: 10, background: "rgba(255,255,255,0.1)", color: "#fde68a", border: "1px solid rgba(253,230,138,0.4)", fontSize: 11, fontWeight: 900, letterSpacing: 1, cursor: "pointer", textTransform: "uppercase" }}>Skip ⟩⟩</button>
      {/* desk */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 16, padding: "6px 4px 0" }}>
        <Head name="Sir Barry Pecksworth" role="Lead broadcaster" palette={BARRY} mouthOpen={mB} blink={blink.barry} sway={sway.barry} />
        <Head name="Reggie Clutter" role="Colour · ex-champion" palette={REGGIE} mouthOpen={mR} blink={blink.reggie} sway={sway.reggie} />
      </div>
      <div style={{ height: 14, background: "linear-gradient(180deg,#78350f 0%,#451a03 100%)", borderTop: "1px solid #92400e", marginTop: 4, borderRadius: "0 0 8px 8px", boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08)" }} />
      {/* progress */}
      <div style={{ marginTop: 8, height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: pct + "%", height: "100%", background: "#fde68a", transition: "width 150ms linear" }} />
      </div>
      {!ready && (<div style={{ textAlign: "center", color: "#94a3b8", fontSize: 10, marginTop: 4, fontWeight: 700, letterSpacing: 1 }}>Cueing up…</div>)}
      {done && (<div style={{ textAlign: "center", color: "#86efac", fontSize: 10, marginTop: 4, fontWeight: 900, letterSpacing: 1 }}>…AND NOW TO THE LANES</div>)}
    </div>
  );
}
