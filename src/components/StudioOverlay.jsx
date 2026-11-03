/* ═══ StudioOverlay ═══ Two old men in a dark broadcast booth who open and close each match: Sir Barry Pecksworth
   (dry BBC broadcaster) and Reggie Clutter (gruff Northern ex-champion). The dialogue is picked by the commentary
   engine from the real match data; this component plays it as real audio with lip-synced portraits.

   Audio flow: on mount, each line's text + voice is sent to /api/tts (Vercel serverless → ElevenLabs → cached in
   Vercel Blob). The response is an mp3 URL. All lines are fetched in parallel; the first audio starts as soon as
   its own URL arrives, and each next line starts when the previous one ends. If a line's audio fails or times out,
   the component falls back to the pre-estimated duration so the sequence always moves forward. Subtitles stay on
   screen under the booth throughout — accessible and a backstop while audio loads. Skip and auto-skip survive. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

var BOOTH = "/art/studio/studio-booth.png";
var CANVAS_W = 1792, CANVAS_H = 1024;
var REGGIE_BOX = { x: 100, y: 315, w: 680, h: 680 };
var BARRY_BOX  = { x: 1012, y: 315, w: 680, h: 680 };
var DESK_TOP = 750, DESK_H = CANVAS_H - DESK_TOP;
/* Settings → Studio commentary · OFF is the way to disable the booth; no per-session auto-skip counter. */

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

/* Fire /api/tts for one line. Returns {url} on success, {error} otherwise. Errors are console.warn-ed so a
   broken ElevenLabs key or missing Blob store shows up in DevTools instead of silently swallowing. */
function fetchTts(text, voice) {
  return fetch("/api/tts", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text, voice: voice })
  }).then(function (r) {
    return r.text().then(function (body) {
      var j; try { j = JSON.parse(body); } catch (e) { j = { error: "not json", detail: body.slice(0, 200) }; }
      if (!r.ok || !j.url) {
        console.warn("[studio/tts]", r.status, j && (j.error || j.detail), "·", voice, "·", text.slice(0, 60));
        return { error: (j && j.error) || ("http " + r.status) };
      }
      return j;
    });
  }).catch(function (e) {
    console.warn("[studio/tts] fetch failed:", String(e));
    return { error: String(e) };
  });
}

export default function StudioOverlay(props) {
  var lines = (props.commentary && props.commentary.lines) || [];
  var totalMs = (props.commentary && props.commentary.totalMs) || 1;
  var _idx = React.useState(0), idx = _idx[0], setIdx = _idx[1];
  var _mouth = React.useState(false), mouth = _mouth[0], setMouth = _mouth[1];
  var _sway = React.useState({ barry: 0, reggie: 0 }), sway = _sway[0], setSway = _sway[1];
  var _urls = React.useState([]), urls = _urls[0], setUrls = _urls[1];
  var audioRef = React.useRef(null);
  var fallbackTimer = React.useRef(null);
  var startedAt = React.useRef(0);

  /* On mount: fetch TTS one line at a time so free/Creator ElevenLabs tiers don't 429 on concurrent calls.
     Each URL lands in state as it resolves; the player starts the first line as soon as its URL is in. */
  React.useEffect(function () {
    if (lines.length === 0) { props.onDone && props.onDone(); return; }
    startedAt.current = Date.now();
    var cancelled = false;
    setUrls(new Array(lines.length).fill(undefined));
    (async function () {
      for (var i = 0; i < lines.length; i++) {
        if (cancelled) return;
        var r = await fetchTts(lines[i].text, lines[i].speaker);
        if (cancelled) return;
        var url = r && r.url ? r.url : null;
        (function (slot, v) {
          setUrls(function (prev) { var next = prev.slice(); next[slot] = v; return next; });
        })(i, url);
      }
    })();
    return function () { cancelled = true; if (audioRef.current) { try { audioRef.current.pause(); } catch (e) {} audioRef.current = null; } if (fallbackTimer.current) clearTimeout(fallbackTimer.current); };
  }, []);

  /* Whenever idx changes OR urls arrive, start the current line. */
  React.useEffect(function () {
    if (!lines.length) return;
    if (idx >= lines.length) {
      /* All lines done — hand back to the game. Small beat for the final subtitle to be read. */
      var done = setTimeout(function () { props.onDone && props.onDone(); }, 400);
      return function () { clearTimeout(done); };
    }
    var line = lines[idx];
    var url = urls[idx];
    /* Stop any previous audio first. */
    if (audioRef.current) { try { audioRef.current.pause(); } catch (e) {} audioRef.current = null; }
    if (fallbackTimer.current) { clearTimeout(fallbackTimer.current); fallbackTimer.current = null; }

    function advance() { setIdx(function (i) { return i + 1; }); }

    if (url) {
      var a = new Audio(url);
      audioRef.current = a;
      a.addEventListener("ended", advance, { once: true });
      a.addEventListener("error", function () {
        fallbackTimer.current = setTimeout(advance, line.durMs);
      }, { once: true });
      a.play().catch(function () {
        fallbackTimer.current = setTimeout(advance, line.durMs);
      });
    } else if (url === null) {
      /* URL resolved as null (TTS failed for this line): use the estimated duration. */
      fallbackTimer.current = setTimeout(advance, line.durMs);
    }
    /* url === undefined: not fetched yet. Hold on the subtitle. Effect re-runs when urls updates. */
  }, [idx, urls]);

  /* Fake lip sync — oscillate every ~140ms whenever we're mid-line: audio playing, audio still loading,
     or audio failed and we're reading the subtitle instead. The mouth stays closed only after the segment ends. */
  React.useEffect(function () {
    if (REDUCED_MOTION) return;
    var id = setInterval(function () {
      if (idx >= lines.length) { setMouth(false); return; }
      var a = audioRef.current;
      if (a && !a.paused) { setMouth(Math.random() > 0.3); return; }
      /* No live audio for this line (not loaded yet, or TTS failed): mime anyway. */
      setMouth(Math.random() > 0.4);
    }, 140);
    return function () { clearInterval(id); };
  }, [idx, lines.length]);

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
  /* Overall progress: elapsed vs estimated. Audio may run shorter or longer, so this is approximate. */
  var pctDone = Math.min(100, ((Date.now() - startedAt.current) / Math.max(1, totalMs)) * 100);
  var loading = urls.length === 0 && lines.length > 0;

  function skip() { if (audioRef.current) { try { audioRef.current.pause(); } catch (e) {} } props.onDone && props.onDone(); }
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
        {loading && (<div style={{ position: "absolute", top: 36, left: 10, zIndex: 3, color: "#94a3b8", fontSize: 10, fontWeight: 700, letterSpacing: 1 }}>Cueing voices…</div>)}
      </div>
      <div style={{ width: "100%", maxWidth: 760, height: 3, background: "#0b0b0b", marginTop: 6, borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: pctDone + "%", height: "100%", background: "#fde68a", transition: "width 150ms linear" }} />
      </div>
    </div>
  );
}
