/* ═══ AdPopup ═══ Full-screen parody mobile-ad overlay. Renders one image (/art/ads/<id>.png), plays Nigel's
   pre-generated voiceover, and dismisses on any tap (including the tiny decoy X in the corner — we never
   actually lock the player out). 10-second auto-dismiss if they just let it play. */

import * as React from "react";
import { enterMatch, leaveMatch } from "../music";
const { useState, useEffect, useRef } = React;

var AUTO_DISMISS_MS = 10000;

export default function AdPopup(props) {
  var ad = props.ad;
  /* The art file may have been uploaded as .png, .webp, or .jpg — try each in that order via onError fallback. */
  var EXTS = ["png", "webp", "jpg"];
  var _extIdx = useState(0), extIdx = _extIdx[0], setExtIdx = _extIdx[1];
  var imgBase = ad.img.replace(/\.(png|webp|jpg|jpeg)$/i, "");
  var imgSrc = imgBase + "." + EXTS[extIdx];
  var _loaded = useState(false), loaded = _loaded[0], setLoaded = _loaded[1];
  var audioRef = useRef(null);
  var doneRef = useRef(props.onDone); doneRef.current = props.onDone;

  useEffect(function () {
    /* Duck the menu music while Nigel is talking — reuses the match-depth counter that enterMatch/leaveMatch
       already drive, so the music fades out smoothly here and back in 1.2 s after the ad dismisses. */
    enterMatch();
    var cancelled = false;
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: ad.text, voice: "nigel" })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (cancelled) return;
      if (j && j.url) {
        var a = new Audio(j.url); a.volume = 1;
        audioRef.current = a;
        a.play().catch(function () {});
      }
    }).catch(function () {});

    var t = setTimeout(function () { doneRef.current && doneRef.current(); }, AUTO_DISMISS_MS);
    return function () {
      cancelled = true;
      clearTimeout(t);
      var a = audioRef.current;
      if (a) { try { a.pause(); a.src = ""; } catch (e) {} }
      leaveMatch();
    };
  }, []);

  function dismiss(e) {
    if (e) { try { e.stopPropagation(); } catch (err) {} }
    doneRef.current && doneRef.current();
  }

  return (
    <div onClick={dismiss} style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "rgba(0,0,0,0.78)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 12, cursor: "pointer",
      animation: "fadeIn 0.18s ease"
    }}>
      <style dangerouslySetInnerHTML={{__html: "@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes adPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}"}} />
      <div style={{
        position: "relative", maxWidth: 420, maxHeight: "92vh", width: "100%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.6)", borderRadius: 10, overflow: "hidden",
        animation: "adPulse 2.6s ease-in-out infinite"
      }}>
        <img src={imgSrc} alt="" onLoad={function () { setLoaded(true); }}
          onError={function () { if (extIdx < EXTS.length - 1) setExtIdx(extIdx + 1); }}
          style={{ display: "block", width: "100%", height: "auto", background: "#222" }} />
        {!loaded && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: 12, fontFamily: "monospace", opacity: 0.6
          }}>loading sponsor…</div>
        )}
        {/* The tiny decoy X — identical behaviour to tapping anywhere else, but visually it's the "proper" close */}
        <button onClick={dismiss} aria-label="close" style={{
          position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%",
          background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.4)", color: "#fff",
          fontSize: 14, fontWeight: 700, lineHeight: "22px", cursor: "pointer", padding: 0,
          opacity: 0.55
        }}>×</button>
      </div>
      {/* The tap-anywhere hint, small and unobtrusive at the bottom */}
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 14, textAlign: "center",
        color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 600, letterSpacing: 2,
        textTransform: "uppercase", pointerEvents: "none"
      }}>Tap to dismiss</div>
    </div>
  );
}
