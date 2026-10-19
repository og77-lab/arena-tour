/* ═══ ArenaBackdrop ═══ The jousting ground behind the riders, scaled to the event:
   a Futures field is a wooden bleacher with a few families and a dog; every tier up adds rows, flags and signs;
   Masters is a full four-row arena at sunset with TV cameras round the lane, sponsors' boards, light towers, an LED
   ribbon board, a storm of camera flashes and the Mexican wave; a Grand Slam or the Season Finals is a packed
   stadium with a giant screen, spotlights, glowing LED ad boards and a spider-cam on its wires. The crowd reacts to every clash: cheers when you win the strike,
   a groan with hands on heads when she does, hats in the air on a big hit, and a standing party at the end. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

const { useMemo } = React;

var SKINS = ["#f6d5bd", "#eac0a0", "#d9a07b", "#b97a56", "#8d5a3b", "#f3cfb3"];
var SHIRTS = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#14b8a6", "#ec4899", "#eab308", "#64748b"];
var HATS = [null, null, "#1f2937", "#f472b6", "#fde68a", null, "#60a5fa", "#ffffff"];
var SIGNS = ["GO GRAN!", "♥", "🐓!", "BONK!", "#1", "WOW"];
/* Pitch-side advertisers at the big events (all made up) */
var SPONSORS = ["CLUCK COLA", "DENTUGRIP", "EGGSPRESS", "TEA COSY CO", "KNIT WIT", "BINGO NITE", "NANA NAPS", "COOP BANK"];

/* tier 0 Futures … 4 Masters, 5 Grand Slam, 6 Season Finals */
var LOOK = [
  { rows: 1, fill: 0.4, span: 0.62, kids: 0.45, flags: 0.06, signs: 0, royal: false, tv: false, flashes: false, wave: false, screen: false, dog: true },
  { rows: 2, fill: 0.55, span: 0.8, kids: 0.3, flags: 0.1, signs: 1, royal: false, tv: false, flashes: false, wave: false, screen: false },
  { rows: 2, fill: 0.85, span: 1, kids: 0.15, flags: 0.14, signs: 2, royal: true, tv: false, flashes: false, wave: false, screen: false },
  { rows: 3, fill: 0.9, span: 1, kids: 0.1, flags: 0.18, signs: 3, royal: true, tv: false, flashes: true, wave: false, screen: false },
  { rows: 4, fill: 1, span: 1, kids: 0.05, flags: 0.26, signs: 4, royal: true, tv: true, flashes: 12, wave: true, screen: false, ribbon: "MASTERS", towers: true, dusk: true, boards: "print" },
  { rows: 4, fill: 1, span: 1, kids: 0.05, flags: 0.3, signs: 5, royal: true, tv: true, flashes: 16, wave: true, screen: true, ribbon: "GRAND SLAM", towers: true, boards: "led", spider: true },
  { rows: 4, fill: 1, span: 1, kids: 0.05, flags: 0.3, signs: 5, royal: true, tv: true, flashes: 16, wave: true, screen: true, ribbon: "WORLD FINAL", towers: true, gold: true, boards: "led", spider: true }
];

function rnd(i, salt) { var x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); }

function Spectator(props) {
  var s = props.s, mood = props.mood;
  var anim;
  if (REDUCED_MOTION) anim = "none";
  else if (mood === "cheer" || mood === "big") anim = "crowdCheer " + (0.42 + s.r * 0.2).toFixed(2) + "s ease-out " + (s.r * 0.12).toFixed(2) + "s " + (mood === "big" ? 2 : 1);
  else if (mood === "party") anim = "crowdCheer " + (0.5 + s.r * 0.3).toFixed(2) + "s ease-out " + (s.r * 0.3).toFixed(2) + "s infinite";
  else if (mood === "groan") anim = "crowdGroan 0.7s ease-out " + (s.r * 0.1).toFixed(2) + "s 1 both";
  else if (props.wave) anim = "crowdWave 7s ease-in-out " + (s.x / props.W * 1.6 - 7).toFixed(2) + "s infinite";
  else if (s.hop) anim = "crowdHop " + (5 + s.r * 6).toFixed(1) + "s ease-out " + (s.r * -9).toFixed(1) + "s infinite";
  else anim = "crowdBob " + (1.6 + s.r * 1.4).toFixed(2) + "s ease-in-out " + (s.r * -2).toFixed(2) + "s infinite";
  var up = mood === "cheer" || mood === "big" || mood === "party", head = mood === "groan";
  return (
    <div style={{ position: "absolute", left: s.x, top: s.y, width: 12, height: 18, transform: "scale(" + s.sc + ")", transformOrigin: "50% 100%" }}>
      <div style={{ position: "absolute", inset: 0, animation: anim }}>
        {(up || head) && (<>
          <div style={{ position: "absolute", left: head ? 0 : -2, top: head ? 1 : 4, width: 2.5, height: head ? 7 : 8, borderRadius: 2, background: s.shirt, transform: head ? "rotate(35deg)" : "rotate(-25deg)" }} />
          <div style={{ position: "absolute", right: head ? 0 : -2, top: head ? 1 : 4, width: 2.5, height: head ? 7 : 8, borderRadius: 2, background: s.shirt, transform: head ? "rotate(-35deg)" : "rotate(25deg)" }} />
        </>)}
        <div style={{ position: "absolute", left: 1, top: 8, width: 10, height: 10, borderRadius: "5px 5px 2px 2px", background: s.shirt, border: "1px solid rgba(63,42,29,0.55)" }} />
        <div style={{ position: "absolute", left: 2, top: 0, width: 8, height: 8, borderRadius: "50%", background: s.skin, border: "1px solid rgba(63,42,29,0.55)" }} />
        {s.hat && (<div style={{ position: "absolute", left: 1.5, top: -1.5, width: 9, height: 3.5, borderRadius: "4px 4px 1px 1px", background: s.hat, border: "1px solid rgba(63,42,29,0.45)" }} />)}
        {s.flag && (
          <div style={{ position: "absolute", left: 10, top: -9, width: 1.5, height: 16, background: "#78350f" }}>
            <div style={{ position: "absolute", left: 1.5, top: 0, width: 9, height: 6, background: props.flagColor, transformOrigin: "0 50%", animation: REDUCED_MOTION ? "none" : "flagWave 0.9s ease-in-out " + (s.r * -1).toFixed(2) + "s infinite" }} />
          </div>
        )}
        {s.sign && (
          <div style={{ position: "absolute", left: -6, top: -9, minWidth: 24, height: 9, padding: "0 2px", background: "#fffbeb", border: "1px solid #3f2a1d", borderRadius: 1.5, fontSize: 6, lineHeight: "8px", fontWeight: 900, color: "#b91c1c", textAlign: "center", whiteSpace: "nowrap" }}>{s.sign}</div>
        )}
      </div>
    </div>
  );
}

/* A TV camera on its tripod with the operator behind it, headphones on, lens to the lane */
function TvCamera(props) {
  var flip = props.flip;
  return (
    <div style={{ position: "absolute", left: props.x - 14, top: props.y, width: 28, height: 30, transform: flip ? "scaleX(-1)" : "none", zIndex: 1 }}>
      <div style={{ position: "absolute", left: 3, top: 2, width: 10, height: 13, borderRadius: "4px 4px 2px 2px", background: "#111827", border: "1px solid #0f172a" }} />
      <div style={{ position: "absolute", left: 4, top: -7, width: 8, height: 8, borderRadius: "50%", background: props.skin, border: "1px solid rgba(63,42,29,0.55)" }} />
      <div style={{ position: "absolute", left: 3, top: -8, width: 10, height: 5, borderRadius: "5px 5px 0 0", border: "1.5px solid #1f2937", borderBottom: "none" }} />
      <div style={{ position: "absolute", left: 11, top: -4, width: 3, height: 4, borderRadius: 1, background: "#1f2937" }} />
      <div style={{ position: "absolute", left: 12, top: 15, width: 1.5, height: 15, background: "#334155", transform: "rotate(18deg)", transformOrigin: "50% 0" }} />
      <div style={{ position: "absolute", left: 16, top: 15, width: 1.5, height: 15, background: "#334155" }} />
      <div style={{ position: "absolute", left: 20, top: 15, width: 1.5, height: 15, background: "#334155", transform: "rotate(-18deg)", transformOrigin: "50% 0" }} />
      <div style={{ position: "absolute", left: 9, top: 6, width: 16, height: 10, borderRadius: 2, background: "#1f2937", border: "1px solid #0f172a", transformOrigin: "30% 60%", animation: REDUCED_MOTION ? "none" : "camPan " + (4 + props.d) + "s ease-in-out " + (-props.d) + "s infinite" }}>
        <div style={{ position: "absolute", right: -5, top: 1.5, width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", border: "1px solid #0f172a" }} />
        <div style={{ position: "absolute", left: 2, top: 2, width: 3, height: 3, borderRadius: "50%", background: "#ef4444", animation: REDUCED_MOTION ? "none" : "screenGlow 1s steps(2) infinite" }} />
        <div style={{ position: "absolute", left: 1, top: -3, width: 8, height: 3, borderRadius: 1, background: "#374151" }} />
      </div>
    </div>
  );
}

function Pennant(props) {
  return (
    <div style={{ position: "absolute", top: 2, [props.side]: 4, width: 2, height: props.h, background: "#78350f", borderRadius: 1, zIndex: 1 }}>
      <div style={{ position: "absolute", top: 1, [props.side === "left" ? "left" : "right"]: 2, width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent",
        [props.side === "left" ? "borderLeft" : "borderRight"]: "16px solid " + props.color, transformOrigin: props.side === "left" ? "0 50%" : "100% 50%", animation: REDUCED_MOTION ? "none" : "flagWave 1.2s ease-in-out infinite" }} />
    </div>
  );
}

export default function ArenaBackdrop(props) {
  var W = props.W, groundTop = props.groundTop, col = props.tierColor || "#f59e0b";
  var tier = Math.max(0, Math.min(6, props.tier == null ? 2 : props.tier)), L = LOOK[tier];
  var standBottom = Math.min(groundTop - 28, 66);
  var rowH = L.rows >= 4 ? 11 : L.rows === 3 ? 14 : 17;
  var standTop = Math.max(8, standBottom - 6 - L.rows * rowH);
  var spanL = W * (1 - L.span) / 2, spanR = W - spanL;

  /* Rows of spectators, back rows smaller (perspective); laid out once per width and tier */
  var crowd = useMemo(function () {
    var out = [], gap = L.rows >= 4 ? 11 : 14, signsLeft = L.signs;
    for (var ri = 0; ri < L.rows; ri++) {
      var y = standTop + 3 + ri * rowH, sc = L.rows >= 3 ? 0.7 + ri * (0.3 / (L.rows - 1)) : 1;
      for (var x = spanL + 4 + (ri % 2 ? gap / 2 : 0), i = 0; x < spanR - 12; x += gap, i++) {
        var k = tier * 1000 + ri * 100 + i;
        if (rnd(k, 9) > L.fill) continue;
        if (L.royal && ri === 0 && Math.abs(x - W / 2) < 26) continue; /* the royal box sits here */
        var kid = rnd(k, 8) < L.kids;
        var s = { x: x + (rnd(k, 1) * 3 - 1.5), y: y + rnd(k, 2) * 2 + (kid ? 4 : 0), sc: kid ? sc * 0.72 : sc, r: rnd(k, 3),
          skin: SKINS[Math.floor(rnd(k, 4) * SKINS.length)], shirt: SHIRTS[Math.floor(rnd(k, 5) * SHIRTS.length)], hat: HATS[Math.floor(rnd(k, 6) * HATS.length)],
          flag: rnd(k, 7) < L.flags, hop: rnd(k, 11) < 0.2 };
        if (signsLeft > 0 && ri === L.rows - 1 && rnd(k, 12) < 0.18 && !s.flag) { s.sign = SIGNS[signsLeft % SIGNS.length]; signsLeft--; }
        out.push(s);
      }
    }
    return out;
  }, [W, tier]);
  var flashes = useMemo(function () {
    var out = []; for (var i = 0; i < (L.flashes === true ? 7 : L.flashes || 0); i++) out.push({ x: spanL + rnd(i, 21) * (spanR - spanL), y: standTop + rnd(i, 22) * (standBottom - standTop - 6), d: (rnd(i, 23) * 4).toFixed(2), p: (2.6 + rnd(i, 24) * 3).toFixed(2) });
    return out;
  }, [W, tier]);

  var mood = props.cheer === "groan" ? "groan" : props.cheer === "party" ? "party" : props.cheer === "big" ? "big" : props.cheer ? "cheer" : null;
  var cond = props.cond || "classic";
  var sky = cond === "mud" ? "linear-gradient(180deg,#94a3b8 0%,#cbd5e1 55%,#e2e8f0 100%)" : cond === "heat" ? "linear-gradient(180deg,#fb923c 0%,#fdba74 35%,#fde68a 75%,#fef3c7 100%)" : L.gold ? "linear-gradient(180deg,#1e1b4b 0%,#4c1d95 45%,#fde68a 100%)" : L.dusk ? "linear-gradient(180deg,#f9a8d4 0%,#fbcfe8 30%,#fed7aa 68%,#fde68a 100%)" : tier >= 5 ? "linear-gradient(180deg,#7dd3fc 0%,#bae6fd 40%,#fef3c7 100%)" : "linear-gradient(180deg,#bae6fd 0%,#e0f2fe 30%,#fef3c7 70%,#fde68a 100%)";
  var wood = tier >= 4 ? "repeating-linear-gradient(180deg,#475569 0 3px,#334155 3px 4px,#64748b 4px " + rowH + "px)" : "repeating-linear-gradient(180deg,#b45309 0 3px,#92400e 3px 4px,#c2621a 4px " + rowH + "px)";

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div style={{ position: "absolute", inset: 0, background: sky }} />
      {cond === "heat" && (<div style={{ position: "absolute", right: "12%", top: 3, width: 26, height: 26, borderRadius: "50%", background: "radial-gradient(circle,#fffbeb 0%,#fde047 45%,#f59e0b 100%)", boxShadow: "0 0 24px 10px rgba(253,224,71,0.6)" }} />)}
      {!L.gold && cond !== "heat" && [0, 1].map(function (i) {
        return (<div key={i} style={{ position: "absolute", top: 4 + i * 7, left: i ? "55%" : "8%", width: 46, height: 12, borderRadius: 10, background: "rgba(255,255,255,0.85)", boxShadow: "14px -4px 0 -2px rgba(255,255,255,0.85), -12px 2px 0 -3px rgba(255,255,255,0.8)",
          background: cond === "mud" ? "rgba(100,116,139,0.85)" : "rgba(255,255,255,0.85)",
          animation: REDUCED_MOTION ? "none" : "cloudDrift " + ((cond === "wind" ? 9 : 38) + i * (cond === "wind" ? 4 : 14)) + "s linear " + (-i * 17) + "s infinite" }} />);
      })}
      {/* Spotlights for the biggest nights */}
      {tier >= 5 && [0, 1].map(function (i) {
        return (<div key={"sp" + i} style={{ position: "absolute", top: -10, [i ? "right" : "left"]: "18%", width: 46, height: groundTop + 10, background: "linear-gradient(180deg,rgba(255,255,255,0.45),rgba(255,255,255,0))", clipPath: "polygon(40% 0,60% 0,100% 100%,0 100%)",
          transformOrigin: "50% 0", animation: REDUCED_MOTION ? "none" : "spotSweep " + (5 + i) + "s ease-in-out " + (-i * 2.5) + "s infinite", zIndex: 0 }} />);
      })}

      {/* Stands (a short wooden bleacher at Futures, a full grandstand further up) */}
      <div style={{ position: "absolute", left: spanL, width: spanR - spanL, top: standTop, height: standBottom - standTop, background: wood, borderTop: "3px solid " + (tier >= 4 ? "#1e293b" : "#78350f"), borderRadius: L.span < 1 ? "4px 4px 0 0" : 0 }} />
      {L.screen && (
        <div style={{ position: "absolute", left: W / 2 - 34, top: 2, width: 68, height: 22, background: "#0f172a", border: "2px solid #1e293b", borderRadius: 3, boxShadow: "0 0 10px rgba(56,189,248,0.6)", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 7.5, fontWeight: 900, letterSpacing: 1, color: "#fde68a", textShadow: "0 0 6px #f59e0b", zIndex: 2 }}>
          <span style={{ animation: REDUCED_MOTION ? "none" : "screenGlow 1.6s ease-in-out infinite" }}>{props.cheer === "groan" ? "OOOH!" : props.cheer ? "WHAM!" : tier === 6 ? "WORLD FINAL" : "GRAND SLAM"}</span>
        </div>
      )}
      {crowd.map(function (s, i) { return (<Spectator key={i} s={s} mood={mood} wave={L.wave} W={W} flagColor={col} />); })}
      {L.flashes && !REDUCED_MOTION && flashes.map(function (f, i) {
        return (<div key={"fl" + i} style={{ position: "absolute", left: f.x, top: f.y, width: 6, height: 6, borderRadius: "50%", background: "radial-gradient(circle,#fff 0%,rgba(255,255,255,0.6) 40%,transparent 70%)", opacity: 0,
          animation: "camFlash " + f.p + "s ease-out " + f.d + "s infinite" }} />);
      })}
      {/* Light towers at the ends of the big arenas, lamps blazing over the stands */}
      {L.towers && [0, 1].map(function (i) {
        return (<div key={"tw" + i} style={{ position: "absolute", [i ? "right" : "left"]: W * 0.05, top: standTop - 4, width: 3, height: standBottom - standTop + 4, zIndex: 1, background: "#475569" }}>
          <div style={{ position: "absolute", left: -10, top: -8, width: 23, height: 9, borderRadius: 2, background: "repeating-linear-gradient(90deg,#fffbeb 0 4px,#cbd5e1 4px 5px)", border: "1px solid #334155", boxShadow: "0 0 14px 6px rgba(255,251,235,0.8)" }} />
        </div>);
      })}
      <div style={{ position: "absolute", left: spanL, width: spanR - spanL, top: standBottom - 4, height: 4, background: tier >= 4 ? "#1e293b" : "#78350f", boxShadow: "0 2px 0 rgba(0,0,0,0.15)" }} />
      {/* LED ribbon board along the front of the stands, the event's name running round the arena */}
      {L.ribbon && (
        <div style={{ position: "absolute", left: spanL, width: spanR - spanL, top: standBottom - 3, height: 9, background: "#0f172a", borderTop: "1px solid " + col, borderBottom: "1px solid " + col, overflow: "hidden", boxShadow: "0 0 8px " + col }}>
          <div style={{ display: "flex", width: "max-content", whiteSpace: "nowrap", fontSize: 6.5, lineHeight: "8px", fontWeight: 900, letterSpacing: 1.5, color: L.screen ? "#fde68a" : "#fbcfe8", textShadow: "0 0 4px " + col, animation: REDUCED_MOTION ? "none" : "ledScroll 14s linear infinite" }}>
            {[0, 1].map(function (h) { return (<span key={h}>{Array.from({ length: Math.ceil(W / 60) + 2 }).map(function () { return " ★ " + L.ribbon; }).join("")}&nbsp;</span>); })}
          </div>
        </div>
      )}
      {/* depth: the roof's shade over the top rows, and a light haze between the stands and the lane */}
      <div style={{ position: "absolute", left: spanL, width: spanR - spanL, top: standTop, height: Math.max(8, (standBottom - standTop) * 0.45), background: "linear-gradient(180deg,rgba(20,12,4,0.32),rgba(20,12,4,0))" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: standBottom - 2, height: Math.max(10, groundTop - standBottom - 18), background: "linear-gradient(180deg,rgba(255,250,235,0.42),rgba(255,250,235,0))" }} />

      {/* Advertising boards along the pitch side: painted panels at the Masters, glowing LED boards at a Slam */}
      {L.boards && (function () {
        var n = Math.max(3, Math.round(W / 85)), x0 = W * 0.03, gap = 4, bw = (W * 0.94 - gap * (n - 1)) / n, top = standBottom + 8;
        var PRINT = [[col, "#ffffff"], ["#0f172a", "#fbcfe8"], ["#ffffff", "#be185d"], ["#fde68a", "#7c2d12"]];
        return Array.from({ length: n }).map(function (_, i) {
          var name = SPONSORS[(i + tier) % SPONSORS.length], led = L.boards === "led", pc = PRINT[i % PRINT.length];
          var glow = i % 2 ? "#38bdf8" : "#fde68a";
          return (<div key={"ad" + i} style={{ position: "absolute", left: x0 + i * (bw + gap), top: top, width: bw, height: 12, borderRadius: 1.5, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
            background: led ? "#0b1020" : pc[0], border: "1px solid " + (led ? "#334155" : "#3f2a1d"), boxShadow: led ? "0 0 6px rgba(56,189,248,0.45)" : "0 2px 0 rgba(0,0,0,0.18)",
            fontSize: 7, fontWeight: 900, letterSpacing: 0.8, whiteSpace: "nowrap", color: led ? glow : pc[1], textShadow: led ? "0 0 4px " + glow : "none" }}>
            <span style={{ animation: led && !REDUCED_MOTION ? "screenGlow " + (2.2 + (i % 3) * 0.4) + "s ease-in-out infinite" : "none" }}>{name}</span>
          </div>);
        });
      })()}
      {/* Pitch-side TV cameras, one each side of the centre, panning with the action */}
      {L.tv && L.boards && [0.41, 0.59].map(function (fx, i) {
        return (<TvCamera key={"cam" + i} x={W * fx} y={standBottom + 22} flip={fx > 0.5} d={i * 1.3} skin={SKINS[(i * 3 + 1) % SKINS.length]} />);
      })}
      {/* Slam: the spider-cam rides its wires over the lane */}
      {L.spider && (<>
        <svg style={{ position: "absolute", left: 0, top: 0, width: W, height: standBottom + 20, overflow: "visible", zIndex: 1 }}>
          <line x1={0} y1={0} x2={W / 2} y2={standBottom + 6} stroke="rgba(15,23,42,0.45)" strokeWidth="0.8" />
          <line x1={W} y1={0} x2={W / 2} y2={standBottom + 6} stroke="rgba(15,23,42,0.45)" strokeWidth="0.8" />
        </svg>
        <div style={{ position: "absolute", left: W / 2 - 7, top: standBottom + 4, width: 14, height: 9, borderRadius: 3, background: "#1f2937", border: "1px solid #0f172a", zIndex: 1, transformOrigin: "50% 0", animation: REDUCED_MOTION ? "none" : "camPan 3s ease-in-out infinite" }}>
          <div style={{ position: "absolute", left: 4, bottom: -4, width: 5, height: 5, borderRadius: "50%", background: "#0ea5e9", border: "1px solid #0f172a" }} />
          <div style={{ position: "absolute", left: 1.5, top: 1.5, width: 2.5, height: 2.5, borderRadius: "50%", background: "#ef4444", animation: REDUCED_MOTION ? "none" : "screenGlow 1s steps(2) infinite" }} />
        </div>
      </>)}

      {L.royal && (<>
        <div style={{ position: "absolute", left: W / 2 - 24, top: standTop - 12, width: 48, height: 14, borderRadius: "8px 8px 2px 2px", border: "1.5px solid #3f2a1d", background: "repeating-linear-gradient(90deg," + col + " 0 6px,#ffffff 6px 12px)", zIndex: L.screen ? 1 : 0, display: L.screen ? "none" : "block" }} />
        <div style={{ position: "absolute", left: W / 2 - 20, top: standTop + 2, width: 40, height: Math.min(18, standBottom - standTop - 6), background: "#7f1d1d", border: "1.5px solid #3f2a1d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>👑</div>
      </>)}

      {/* Futures: a dog on the grass and a picnic blanket */}
      {L.dog && (<>
        <div style={{ position: "absolute", left: spanL - 34, top: standBottom - 14, fontSize: 13, animation: REDUCED_MOTION ? "none" : "crowdHop 3.5s ease-out infinite" }}>🐕</div>
        <div style={{ position: "absolute", right: spanL - 40, top: standBottom - 8, width: 30, height: 6, borderRadius: 2, background: "repeating-linear-gradient(90deg,#ef4444 0 5px,#fff 5px 10px)", border: "1px solid #3f2a1d" }} />
        <div style={{ position: "absolute", right: spanL - 30, top: standBottom - 17, fontSize: 9 }}>🧺</div>
      </>)}

      {/* TV crew: a camera on a crane and the LIVE bug */}
      {L.tv && (<>
        <div style={{ position: "absolute", left: 10, top: standBottom - 2, width: 3, height: groundTop - standBottom - 20, background: "#334155", transform: "rotate(-18deg)", transformOrigin: "50% 100%" }} />
        <div style={{ position: "absolute", left: 4, top: standBottom - 12, width: 18, height: 11, borderRadius: 2, background: "#1f2937", border: "1px solid #0f172a", animation: REDUCED_MOTION ? "none" : "camPan 4s ease-in-out infinite" }}>
          <div style={{ position: "absolute", right: -5, top: 2, width: 6, height: 6, borderRadius: "50%", background: "#0ea5e9", border: "1px solid #0f172a" }} />
          <div style={{ position: "absolute", left: 2, top: 2, width: 3, height: 3, borderRadius: "50%", background: "#ef4444", animation: REDUCED_MOTION ? "none" : "screenGlow 1s steps(2) infinite" }} />
        </div>
        <div style={{ position: "absolute", right: 8, top: L.screen ? 28 : 4, display: "flex", alignItems: "center", gap: 3, background: "rgba(15,23,42,0.85)", color: "#fff", fontSize: 7, fontWeight: 900, letterSpacing: 1, padding: "2px 5px", borderRadius: 3, zIndex: 3 }}>
          <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#ef4444", animation: REDUCED_MOTION ? "none" : "screenGlow 1s steps(2) infinite" }} />LIVE
        </div>
      </>)}

      {!L.screen && (<><Pennant side="left" h={standTop + 10} color={col} /><Pennant side="right" h={standTop + 10} color="#ef4444" /></>)}

      {/* Tilt barrier down the lane (behind the riders) */}
      <div style={{ position: "absolute", left: "6%", right: "6%", top: groundTop - 20, height: 14, background: "repeating-linear-gradient(90deg," + col + " 0 14px,#fffbeb 14px 28px)", border: "1.5px solid #3f2a1d", borderRadius: 2, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: "6%", right: "6%", top: groundTop - 23, height: 4, background: "#92400e", border: "1px solid #3f2a1d", borderRadius: 2 }} />
      {[0.06, 0.28, 0.5, 0.72, 0.94].map(function (p) {
        return (<div key={p} style={{ position: "absolute", left: "calc(" + (p * 100) + "% - 2px)", top: groundTop - 24, width: 4, height: 24, background: "#78350f", border: "1px solid #3f2a1d" }} />);
      })}

      {/* Hats in the air on a big hit */}
      {(mood === "big" || mood === "party") && !REDUCED_MOTION && [0, 1, 2, 3, 4, 5].map(function (i) {
        return (<div key={props.cheerId + "-" + i} style={{ position: "absolute", left: (spanL / W * 100 + 8 + i * (L.span * 14)) + "%", top: standTop + 6, width: 8, height: 4, borderRadius: "4px 4px 1px 1px", background: SHIRTS[i % SHIRTS.length], border: "1px solid #3f2a1d",
          animation: "hatToss 0.9s ease-out " + (i * 0.05) + "s both" }} />);
      })}
    </div>
  );
}
