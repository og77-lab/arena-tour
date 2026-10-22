/* ═══ JoustStage ═══ The lane where the two riders charge and clash on every strike — framed like a TV broadcast.
   A deep lane with the wooden tilt (the jousting barrier) running behind the riders; the two ride face to face on one
   line, so the better striker's lance plainly lands on the other's chest, and every lance stays in view. A camera follows the action: it eases in as the roosters charge, punches in on
   the clash, and on the deciding hit holds on the rider who's going down. The stands sit further back, so they move
   less than the lane (and the hay bale in front moves more): depth without leaving the cartoon. Everything moves
   inside the stage only — never the controls below it. Reduced motion: the old flat view, no camera. */

import * as React from "react";
import { Rider, Feathers } from "./Rider";
import { REDUCED_MOTION, LOW_END } from "./fx";
import ArenaBackdrop from "./ArenaBackdrop";

const { useState, useEffect, useRef } = React;

var IDLE_X = 4;
var FOE_SCALE = 1;           /* both riders on one line, face to face (clearer hits than a far lane) */
var BACKDROP_GROUND = 96;    /* the stands are drawn for a lane at this height, then enlarged to fit */

function Bunting(props) {
  var n = 16, flags = [];
  for (var i = 0; i < n; i++) {
    var x = i * (100 / n);
    flags.push(<polygon key={i} points={x + ",0 " + (x + 100 / n) + ",0 " + (x + 50 / n) + ",9"} fill={i % 2 ? "#ffffff" : props.color} stroke="rgba(63,42,29,0.35)" strokeWidth="0.3" />);
  }
  return (
    <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 12 }}>
      <line x1="0" y1="0.3" x2="100" y2="0.3" stroke="rgba(63,42,29,0.5)" strokeWidth="0.5" />
      {flags}
    </svg>
  );
}

/* The tilt: a low wooden barrier down the middle of the lane, posts every so often, a painted stripe in the event's colour */
function Tilt(props) {
  var W = props.W, y = props.y, h = props.h, posts = [];
  for (var x = 10; x < W; x += 54) posts.push(x);
  return (
    <div aria-hidden style={{ position: "absolute", left: -10, right: -10, top: y - h, height: h, zIndex: 1, pointerEvents: "none" }}>
      {posts.map(function (px) { return (<div key={px} style={{ position: "absolute", left: px + 10, top: -4, width: 6, height: h + 8, background: "linear-gradient(90deg,#92400e,#78350f)", border: "1.5px solid #3f2a1d", borderRadius: "2px 2px 0 0" }} />); })}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: h * 0.42, background: "linear-gradient(180deg,#b45309,#92400e)", border: "1.5px solid #3f2a1d", borderRadius: 2 }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: h * 0.48, height: h * 0.3, background: "repeating-linear-gradient(90deg," + (props.color || "#f59e0b") + " 0 18px,#fffbeb 18px 36px)", border: "1.5px solid #3f2a1d", borderRadius: 2 }} />
    </div>
  );
}

/* action: null | { id, phase: "charge"|"impact"|"return"|"finale", youWon, big, word }   verdict: null | "won" | "lost"
   "finale" follows the match-deciding impact: the loser is unseated and stays down, the winner celebrates. */
export default function JoustStage(props) {
  var ref = useRef(null);
  var _w = useState(320), W = _w[0], setW = _w[1];
  useEffect(function () {
    if (!ref.current || typeof ResizeObserver === "undefined") return;
    var ro = new ResizeObserver(function (e) { setW(e[0].contentRect.width); });
    ro.observe(ref.current);
    return function () { ro.disconnect(); };
  }, []);

  /* The frame: a tall stage, riders ~40% of its width; the lane starts at 62% of the height */
  var rw = Math.round(Math.min(220, Math.max(110, W * 0.4)));
  var k = rw / 140, rh = rw * 0.8;
  var H = Math.round(Math.max(210, Math.min(380, W * 0.68)));
  var laneTop = Math.round(H * 0.6);
  var railY = Math.round(laneTop + (H - laneTop) * 0.3);   /* the tilt runs behind both riders */
  var railH = Math.round(Math.max(12, 16 * k));
  var youFeet = H - 8, foeFeet = youFeet;
  var bs = laneTop / BACKDROP_GROUND;
  /* where the lance tips meet: both slide in until 68% of each rider reaches the middle */
  var travel = Math.max(0, (W - 2 * IDLE_X - 0.68 * rw * (1 + FOE_SCALE)) / 2);

  var a = props.action, v = props.verdict;
  var phase = a ? a.phase : null;
  var closing = phase === "charge" || phase === "impact" || phase === "finale";

  /* ── The hit ── whoever struck better reaches the other: her glove (lance tip, viewBox 127,50) is aimed from the grip
     (68,56) at the loser's chest (58,50), and she rides in just far enough for it to land. The loser is knocked back a
     beat later, so the contact reads. Points map from each rider's 140×112 drawing onto the stage. */
  var s = rw / 140, GLOVE = Math.hypot(59, 6), BASE = Math.atan2(-6, 59), CHEST = [58, 50];
  function youPt(dx, vx, vy) { return { x: IDLE_X + dx + vx * s, y: youFeet - rh + vy * s }; }
  function foePt(dx, vx, vy) { return { x: W - IDLE_X - dx - vx * s * FOE_SCALE, y: foeFeet - (112 - vy) * s * FOE_SCALE }; }
  var hit = null;
  if (a && (phase === "impact" || phase === "finale")) {
    var tgt, gy, len, dy, D, aimRad;
    if (a.youWon) {
      tgt = foePt(travel, CHEST[0], CHEST[1]); gy = youFeet - rh + 56 * s; len = GLOVE * s; dy = tgt.y - gy;
      D = Math.sqrt(Math.max(len * len * 0.3, len * len - dy * dy)); aimRad = Math.atan2(dy, D) - BASE;
      hit = { youDx: tgt.x - D - (IDLE_X + 68 * s), foeDx: travel, aim: aimRad * 180 / Math.PI, at: tgt };
    } else {
      tgt = youPt(travel, CHEST[0], CHEST[1]); gy = foeFeet - (112 - 56) * s * FOE_SCALE; len = GLOVE * s * FOE_SCALE; dy = tgt.y - gy;
      D = Math.sqrt(Math.max(len * len * 0.3, len * len - dy * dy)); aimRad = Math.atan2(dy, D) - BASE;
      hit = { youDx: travel, foeDx: W - IDLE_X - (tgt.x + D + 68 * s * FOE_SCALE), aim: aimRad * 180 / Math.PI, at: tgt };
    }
  }
  function riderState(isYou) {
    var lost = a && (isYou ? !a.youWon : a.youWon);
    var st = { dx: closing ? travel : 0, pose: "idle", running: false, hatOff: false, aim: null, ease: "transform 0.55s cubic-bezier(.3,.7,.4,1)" };
    if (phase === "charge") { st.pose = "charge"; st.running = true; st.ease = "transform 0.42s cubic-bezier(.55,0,.9,.6)"; }
    else if (phase === "impact") {
      st.pose = lost ? (a.big ? "knocked" : "deflect") : "charge";
      if (lost) { st.dx = travel - (a.big ? 34 : 16) * k; st.ease = "transform 0.3s cubic-bezier(.2,1.5,.4,1) 0.14s"; }
      else { st.dx = isYou ? hit.youDx : hit.foeDx; st.aim = hit.aim; st.ease = "transform 0.08s ease-out"; }
      st.hatOff = lost && a.big;
    } else if (phase === "return") { st.running = true; st.hatOff = lost && a.big; }
    else if (phase === "finale") {
      st.pose = lost ? "fallen" : "cheer";
      st.hatOff = lost;
      if (lost) { st.dx = travel - 34 * k; st.ease = "transform 0.3s cubic-bezier(.2,1.5,.4,1)"; }
      else st.dx = isYou ? hit.youDx : hit.foeDx;
    }
    if (!a && v) st.pose = (isYou ? v === "won" : v === "lost") ? "cheer" : "fallen";
    if (REDUCED_MOTION) { st.dx = 0; st.running = false; }
    return st;
  }
  var me = riderState(true), foe = riderState(false);

  /* Lost a set (not the match): a little dizzy for a couple of seconds — stars round the head, a wobble in the saddle */
  var _dz = useState(null), dizzy = _dz[0], setDizzy = _dz[1];
  var setLoss = a && a.setLoss && (phase === "impact" || phase === "return") ? a.setLoss : null, dzId = a ? a.id : null;
  var dzTimer = useRef(null);
  useEffect(function () {
    if (!setLoss || REDUCED_MOTION) return;
    setDizzy({ who: setLoss, id: dzId });
    /* the spell runs its course even after the clash clears (so not a cleanup of this effect) */
    if (dzTimer.current) clearTimeout(dzTimer.current);
    dzTimer.current = setTimeout(function () { dzTimer.current = null; setDizzy(null); }, 2400);
  }, [setLoss, dzId]);
  useEffect(function () { return function () { if (dzTimer.current) clearTimeout(dzTimer.current); }; }, []);

  var impact = (phase === "impact" || phase === "finale") && !REDUCED_MOTION;
  var landed = phase === "finale" && !REDUCED_MOTION;
  var loserIsFoe = a && a.youWon;
  var loserPal = a ? (loserIsFoe ? props.foe : props.you) : null;
  /* the clash point (between the two lances) and where the loser ends up */
  /* the flash and the feathers burst where the glove lands (the loser's chest); between the riders otherwise */
  var clashX = hit ? hit.at.x : W / 2, clashY = hit ? hit.at.y : ((youFeet - rh * 0.58) + (foeFeet - rh * FOE_SCALE * 0.58)) / 2;
  var featherX = a ? (loserIsFoe ? W - IDLE_X - travel - rw * FOE_SCALE * 0.45 : IDLE_X + travel + rw * 0.45) : 0;
  var featherY = a ? (loserIsFoe ? foeFeet - rh * FOE_SCALE * 0.55 : youFeet - rh * 0.55) : 0;

  /* ── The camera ── in on the charge, a punch on the clash, then back out (fully, for the match's last fall) */
  var cam = { z: 1, x: clashX, y: clashY, t: "transform 0.7s cubic-bezier(.3,.7,.3,1)" };
  if (!REDUCED_MOTION) {
    if (phase === "charge") cam = { z: 1.2, x: clashX, y: clashY, t: "transform 0.45s cubic-bezier(.5,0,.8,.5)" };
    else if (phase === "impact") cam = { z: a.big || a.perfect ? 1.4 : 1.3, x: clashX, y: clashY, t: "transform 0.12s ease-out" };
    /* the match is decided: back out to the full frame, so the fall and the celebration are seen whole, never cropped */
    else if (phase === "finale") cam = { z: 1, x: clashX, y: clashY, t: "transform 0.6s cubic-bezier(.3,.8,.3,1)" };
  }
  var camOrigin = cam.x + "px " + cam.y + "px";
  /* parallax: the stands move about half as much as the lane, the foreground half as much again more */
  var standZ = Math.pow(cam.z, -0.5), frontZ = Math.pow(cam.z, 0.45);

  var cond = props.cond || "classic";
  var GROUND_BG = { classic: ["#d9b77e", "#a57c45"], mud: ["#7c5c33", "#4a3519"], heat: ["#f2dcaa", "#d6b073"], green: ["#7cb518", "#4d7c0f"], wind: ["#d9b77e", "#a57c45"] };
  var gb = GROUND_BG[cond] || GROUND_BG.classic;
  var dust = cond === "mud" ? "rgba(74,53,25,0.7)" : cond === "green" ? "rgba(132,204,22,0.4)" : "rgba(196,160,104,0.7)";

  function riderBox(isYou, st, pal) {
    var side = isYou ? { left: IDLE_X } : { right: IDLE_X };
    var dz = dizzy && dizzy.who === (isYou ? "you" : "foe");
    var sc = isYou ? 1 : FOE_SCALE, feet = isYou ? youFeet : foeFeet;
    return (
      <div style={Object.assign({ position: "absolute", top: feet - rh, width: rw, height: rh, transform: "translateX(" + (isYou ? st.dx : -st.dx) + "px) scale(" + sc + ")", transformOrigin: isYou ? "0 100%" : "100% 100%", transition: st.ease, zIndex: isYou ? 4 : 2 }, side)}>
        {/* a soft shadow on the lane under the rooster, stretching as it runs */}
        <div aria-hidden style={{ position: "absolute", bottom: -4, left: rw * 0.16, width: rw * 0.68, height: 12 * k, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(40,25,10,0.42) 0%,rgba(40,25,10,0) 70%)", transform: st.running ? "scaleX(1.2)" : "none", transition: "transform 0.3s" }} />
        {st.running && !REDUCED_MOTION && [0, 1, 2].map(function (i) {
          return (<div key={"d" + i} aria-hidden style={{ position: "absolute", bottom: 0, [isYou ? "left" : "right"]: rw * (0.2 + i * 0.07), width: (16 + i * 4) * k, height: (10 + i * 2) * k, borderRadius: "50%", background: "radial-gradient(circle," + dust + " 0%,rgba(0,0,0,0) 72%)", animation: "dustTrail 0.5s ease-out " + (i * 0.11) + "s infinite", transform: isYou ? "none" : "scaleX(-1)" }} />);
        })}
        {st.running && !REDUCED_MOTION && cond === "mud" && [0, 1, 2].map(function (i) {
          return (<div key={i} aria-hidden style={{ position: "absolute", bottom: 4, [isYou ? "left" : "right"]: rw * (0.25 + i * 0.06), width: 6 * k, height: 6 * k, borderRadius: "50%", background: "#4a3519",
            animation: "mudSplash 0.45s ease-out " + (i * 0.12) + "s infinite", transform: isYou ? "none" : "scaleX(-1)" }} />);
        })}
        {/* speed lines behind a charging rider */}
        {st.running && phase === "charge" && !REDUCED_MOTION && [0, 1, 2].map(function (i) {
          return (<div key={"s" + i} aria-hidden style={{ position: "absolute", top: rh * (0.25 + i * 0.18), [isYou ? "left" : "right"]: -rw * 0.28, width: rw * (0.3 - i * 0.05), height: 2.5, borderRadius: 2, background: "rgba(255,255,255,0.85)", boxShadow: "0 0 0 1px rgba(63,42,29,0.25)" }} />);
        })}
        <div style={{ animation: dz ? "dizzyWobble 0.6s ease-in-out infinite" : "none", transformOrigin: isYou ? "40% 100%" : "60% 100%" }}>
          <Rider palette={pal} width={rw} flip={!isYou} pose={st.pose} aim={st.aim} running={st.running} hatOff={st.hatOff} lance={((isYou ? props.youKit : props.foeKit) || {}).lance || "broom"} saddle={((isYou ? props.youKit : props.foeKit) || {}).saddle || "teacosy"} />
        </div>
        {dz && (
          <div aria-hidden style={{ position: "absolute", left: (isYou ? 56 * s : rw - 56 * s) - 22 * k, top: -4 * k, width: 44 * k, height: 16 * k, pointerEvents: "none" }}>
            <div style={{ position: "absolute", inset: 0, animation: "dizzyStars 0.9s linear infinite" }}>
              {[0, 1, 2].map(function (i) { var ang = i * 2.094; return (<span key={i} style={{ position: "absolute", left: 22 * k + Math.cos(ang) * 18 * k - 6 * k, top: 8 * k + Math.sin(ang) * 6 * k - 6 * k, fontSize: 12 * k, lineHeight: 1 }}>⭐</span>); })}
            </div>
          </div>
        )}
      </div>
    );
  }

  var shake = impact && a && !REDUCED_MOTION ? (function () { var t = Math.floor(a.id) % 2 ? "B" : ""; return a.perfect ? "zoomPunch" + t + " 0.32s ease-out, stageShakeBig" + t + " 0.42s ease-out" : phase === "finale" ? "stageShakeBig" + t + " 0.45s ease-out" : a.big ? "stageShake" + t + " 0.32s ease-out" : "none"; })() : "none";
  var cheer = phase === "finale" ? (a.youWon ? "party" : "groan") : impact ? (a.youWon ? (a.big ? "big" : "cheer") : "groan") : (!a && v === "won") ? "party" : null;

  return (
    <div ref={ref} style={{ position: "relative", height: H, margin: "2px -2px 0", overflow: "hidden", borderRadius: 14, background: "#bae6fd", boxShadow: "0 2px 0 rgba(63,42,29,0.10), 0 8px 20px rgba(63,42,29,0.14)" }}>
     {/* the camera */}
     <div style={{ position: "absolute", inset: 0, transform: "scale(" + cam.z + ")", transformOrigin: camOrigin, transition: cam.t, willChange: "transform" }}>{/* its own GPU layer: zooming costs nothing to redraw */}
     {/* everything inside shakes on a big clash */}
     <div style={{ position: "absolute", inset: 0, animation: shake }}>
      {/* The stands, drawn for a smaller lane and enlarged; further back, so they move less with the camera */}
      <div style={{ position: "absolute", left: 0, top: 0, width: W, height: laneTop, transform: "scale(" + standZ + ")", transformOrigin: camOrigin, transition: cam.t, willChange: "transform", filter: LOW_END || REDUCED_MOTION ? "none" : "blur(0.6px) saturate(0.92)" }}>{/* a shallow focus: the stands sit just soft behind the riders */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W / bs, height: BACKDROP_GROUND, transform: "scale(" + bs + ")", transformOrigin: "0 0" }}>
          <ArenaBackdrop W={W / bs} groundTop={BACKDROP_GROUND} tierColor={props.tierColor} tier={props.tier} cond={props.cond} cheerId={a ? a.id : 0} cheer={cheer} />
          <Bunting color={props.tierColor || "#f59e0b"} />
        </div>
      </div>

      {/* The lane: far side lighter (haze), near side full colour; rake marks show its depth */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: laneTop, bottom: 0, background: "linear-gradient(180deg," + gb[0] + " 0%," + gb[1] + " 100%)", borderTop: "2px solid " + (cond === "green" ? "#3f6212" : cond === "mud" ? "#3b2a14" : "#8b6435") }} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: laneTop, height: railY - laneTop, background: "linear-gradient(180deg,rgba(255,250,235,0.35),rgba(255,250,235,0.08))" }} />
      {/* the ground's grain: fine pebbles and hoof-scuffs, a pool of light where the riders meet, darker towards the camera */}
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: laneTop, bottom: 0, opacity: cond === "green" ? 0.5 : 0.9,
        backgroundImage: "radial-gradient(rgba(63,42,29,0.16) 0.7px, transparent 1.3px), radial-gradient(rgba(255,250,235,0.22) 0.6px, transparent 1.2px), radial-gradient(ellipse 14px 3px at 50% 50%, rgba(63,42,29,0.09), transparent 70%)",
        backgroundSize: "9px 7px, 13px 11px, 46px 17px", backgroundPosition: "0 0, 4px 3px, 10px 6px" }} />
      <div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: laneTop, bottom: 0, background: "radial-gradient(60% 70% at 50% 40%, rgba(255,247,225,0.35) 0%, rgba(255,247,225,0) 70%), linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(40,25,10,0.28) 100%)" }} />
      {cond === "mud" && [0.08, 0.3, 0.5, 0.7, 0.9].map(function (x, i) { var y = i % 2 ? H - 18 * k : railY + 6; return (<div key={x} aria-hidden style={{ position: "absolute", left: (x * 100) + "%", top: y, width: (40 - (i % 2) * 12) * k, height: 9 * k, borderRadius: "50%", zIndex: 1, background: "radial-gradient(ellipse at 40% 35%,#e2e8f0 0%,#94a3b8 45%,#475569 100%)", border: "1.5px solid #3b2a14", boxShadow: "inset 0 -2px 0 rgba(30,41,59,0.4)" }} />); })}
      {cond === "green" && [0.04, 0.17, 0.3, 0.43, 0.56, 0.69, 0.82, 0.95].map(function (x, i) { var y = i % 2 ? H - 14 * k : laneTop + 6; return (<div key={x} aria-hidden style={{ position: "absolute", left: (x * 100) + "%", top: y, width: 8 * k, height: 8 * k, borderRadius: "50%", zIndex: 1, background: "radial-gradient(circle,#facc15 0 30%,#fff 32% 100%)", boxShadow: "0 0 0 1px rgba(63,98,18,0.5)" }} />); })}
      {cond === "heat" && (<div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: laneTop, bottom: 0, background: "linear-gradient(180deg,rgba(255,237,213,0.25),rgba(214,176,115,0.0))" }} />)}

      <Tilt W={W} y={railY} h={railH} color={props.tierColor} />
      {riderBox(false, foe, props.foe)}
      {riderBox(true, me, props.you)}

      {/* Weather over everything: rain in the mud, gusts and leaves on the coast, shimmer in a heatwave */}
      {!REDUCED_MOTION && cond === "mud" && (<div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 6, pointerEvents: "none", backgroundImage: "repeating-linear-gradient(105deg,rgba(148,163,184,0.45) 0 1px,transparent 1px 9px)", backgroundSize: "40px 40px", animation: "rainFall 0.5s linear infinite" }} />)}
      {!REDUCED_MOTION && cond === "wind" && [0, 1, 2, 3].map(function (i) {
        return (<div key={i} aria-hidden style={{ position: "absolute", left: -40, top: 20 + i * 18 + "%", width: 46, height: 2, borderRadius: 2, background: "rgba(255,255,255,0.85)", zIndex: 6, pointerEvents: "none", animation: "windStreak " + (0.9 + i * 0.25) + "s linear " + (i * 0.3) + "s infinite" }} />);
      })}
      {!REDUCED_MOTION && cond === "wind" && [0, 1].map(function (i) {
        return (<div key={"l" + i} aria-hidden style={{ position: "absolute", left: -20, top: 30 + i * 30 + "%", fontSize: 14, zIndex: 6, pointerEvents: "none", animation: "leafBlow " + (2.4 + i) + "s linear " + (i * 1.1) + "s infinite" }}>🍂</div>);
      })}
      {!REDUCED_MOTION && cond === "heat" && (<div aria-hidden style={{ position: "absolute", left: 0, right: 0, top: laneTop - 14, height: 18, zIndex: 6, pointerEvents: "none", background: "linear-gradient(180deg,transparent,rgba(255,237,213,0.35),transparent)", animation: "heatShimmer 1.4s ease-in-out infinite" }} />)}

      {impact && (
        <div key={"flash-" + a.id} aria-hidden style={{ position: "absolute", left: clashX, top: clashY, width: 90 * k, height: 90 * k, marginLeft: -45 * k, marginTop: -45 * k, borderRadius: "50%", background: "radial-gradient(circle,#fff 0%,rgba(255,255,255,0.7) 30%,transparent 70%)", animation: "flashBoom 0.4s ease-out forwards", pointerEvents: "none", zIndex: 5 }} />
      )}
      {impact && loserPal && (
        <Feathers key={"f-" + a.id} x={featherX} y={featherY} count={a.big ? 22 : 10} colors={[loserPal.chicken.body, loserPal.chicken.wing, "#ffffff"]} />
      )}
      {landed && (
        <div key={"land-" + a.id} aria-hidden style={{ position: "absolute", left: featherX, top: (loserIsFoe ? foeFeet : youFeet) - 16 * k, width: 130 * k, height: 40 * k, marginLeft: -65 * k, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(161,128,82,0.75) 0%,rgba(161,128,82,0.35) 45%,transparent 70%)", animation: "flashBoom 0.7s ease-out 0.35s both", pointerEvents: "none", zIndex: 5 }} />
      )}
      {/* the clash raises a ring of dust on the lane */}
      {impact && (<div key={"ring-" + a.id} aria-hidden style={{ position: "absolute", left: clashX - 56 * k, top: railY - 12 * k, width: 112 * k, height: 28 * k, borderRadius: "50%", border: "3px solid rgba(196,160,104,0.7)", background: "radial-gradient(ellipse,rgba(196,160,104,0.35) 0%,rgba(196,160,104,0) 70%)", animation: "dustRing 0.55s ease-out forwards", pointerEvents: "none", zIndex: 4 }} />)}
      {/* PERFECT: a golden burst where the lances meet */}
      {impact && a.perfect && (<div key={"gold-" + a.id} aria-hidden style={{ position: "absolute", left: clashX - 50 * k, top: clashY - 50 * k, width: 100 * k, height: 100 * k, borderRadius: "50%", background: "radial-gradient(circle,rgba(253,224,71,0.95) 0%,rgba(250,204,21,0.6) 30%,rgba(250,204,21,0) 70%)", boxShadow: "0 0 30px 10px rgba(250,204,21,0.45)", animation: "goldBurst 0.6s ease-out forwards", pointerEvents: "none", zIndex: 5 }} />)}

      {/* the foreground: a hay bale and a bucket close to the camera, slightly soft, moving more than the lane */}
      <div aria-hidden style={{ position: "absolute", inset: 0, zIndex: 7, pointerEvents: "none", transform: "scale(" + frontZ + ")", transformOrigin: camOrigin, transition: cam.t, willChange: "transform" }}>
        <div style={{ position: "absolute", left: -18 * k, bottom: -14 * k, width: 70 * k, height: 40 * k, borderRadius: 10 * k, filter: "blur(1.2px)", border: "1.5px solid rgba(63,42,29,0.8)",
          background: "linear-gradient(90deg, transparent 30%, rgba(120,53,15,0.85) 30% 34%, transparent 34% 68%, rgba(120,53,15,0.85) 68% 72%, transparent 72%), repeating-linear-gradient(175deg, rgba(255,251,235,0.35) 0 1px, transparent 1px 4px), linear-gradient(180deg,#fde68a 0%,#facc15 35%,#ca8a04 100%)",
          boxShadow: "inset 0 -8px 10px rgba(120,53,15,0.4), inset 0 4px 6px rgba(255,251,235,0.4)" }} />
        <div style={{ position: "absolute", right: -6 * k, bottom: -10 * k, width: 34 * k, height: 34 * k, borderRadius: "4px 4px 10px 10px", background: "linear-gradient(90deg,#94a3b8,#cbd5e1 40%,#64748b)", border: "2px solid #3f2a1d", filter: "blur(1px)" }} />
      </div>
     </div>
     </div>

      {/* the comic word stays readable, outside the camera */}
      {impact && a.word && (
        <div key={"w-" + a.id} aria-hidden style={{ position: "absolute", left: "50%", top: "30%", zIndex: 9, pointerEvents: "none", fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: (a.perfect ? 40 : a.big ? 34 : 26) * Math.max(1, k * 0.9), fontWeight: 700, letterSpacing: 1, whiteSpace: "nowrap", color: a.perfect ? "#fde047" : a.youWon ? "#facc15" : "#f87171", textShadow: "-2px -2px 0 #3f2a1d, 2px -2px 0 #3f2a1d, -2px 2px 0 #3f2a1d, 2px 2px 0 #3f2a1d, 0 4px 0 #3f2a1d", animation: "comicPop 0.75s ease-out forwards" }}>
          {a.word}
        </div>
      )}
      {/* light and depth over the scene: warm sun from above, a soft vignette at the edges */}
      <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 8, background: "radial-gradient(120% 90% at 30% 0%, rgba(255,244,214,0.28) 0%, rgba(255,244,214,0) 55%)", boxShadow: "inset 0 0 34px rgba(40,25,10,0.32)" }} />
    </div>
  );
}
