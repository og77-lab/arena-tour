/* ═══ ArenaBackdrop ═══ The jousting ground behind the riders: sky and drifting clouds, wooden stands packed with
   a bobbing crowd (some waving the tier's colours), the royal box, pennants on poles and the cloth-draped tilt
   barrier down the lane. The crowd leaps on every clash — higher for a big hit — and keeps cheering at match end. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

const { useMemo } = React;

var SKINS = ["#f6d5bd", "#eac0a0", "#d9a07b", "#b97a56", "#8d5a3b", "#f3cfb3"];
var SHIRTS = ["#ef4444", "#3b82f6", "#22c55e", "#a855f7", "#f97316", "#14b8a6", "#ec4899", "#eab308", "#64748b"];
var HATS = [null, null, "#1f2937", "#f472b6", "#fde68a", null, "#60a5fa", "#ffffff"];

function rnd(i, salt) { var x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453; return x - Math.floor(x); }

function Spectator(props) {
  var s = props.s, cheering = props.cheering;
  var anim = REDUCED_MOTION ? "none"
    : cheering ? "crowdCheer " + (0.42 + s.r * 0.2).toFixed(2) + "s ease-out " + (s.r * 0.12).toFixed(2) + "s " + (props.big ? 2 : 1)
    : "crowdBob " + (1.6 + s.r * 1.4).toFixed(2) + "s ease-in-out " + (s.r * -2).toFixed(2) + "s infinite";
  return (
    <div style={{ position: "absolute", left: s.x, top: s.y, width: 12, height: 18, animation: anim }}>
      {/* arms up while cheering */}
      {cheering && (<>
        <div style={{ position: "absolute", left: -2, top: 4, width: 2.5, height: 8, borderRadius: 2, background: s.shirt, transform: "rotate(-25deg)" }} />
        <div style={{ position: "absolute", right: -2, top: 4, width: 2.5, height: 8, borderRadius: 2, background: s.shirt, transform: "rotate(25deg)" }} />
      </>)}
      <div style={{ position: "absolute", left: 1, top: 8, width: 10, height: 10, borderRadius: "5px 5px 2px 2px", background: s.shirt, border: "1px solid rgba(63,42,29,0.55)" }} />
      <div style={{ position: "absolute", left: 2, top: 0, width: 8, height: 8, borderRadius: "50%", background: s.skin, border: "1px solid rgba(63,42,29,0.55)" }} />
      {s.hat && (<div style={{ position: "absolute", left: 1.5, top: -1.5, width: 9, height: 3.5, borderRadius: "4px 4px 1px 1px", background: s.hat, border: "1px solid rgba(63,42,29,0.45)" }} />)}
      {s.flag && (
        <div style={{ position: "absolute", left: 10, top: -9, width: 1.5, height: 16, background: "#78350f" }}>
          <div style={{ position: "absolute", left: 1.5, top: 0, width: 9, height: 6, background: props.flagColor, transformOrigin: "0 50%", animation: REDUCED_MOTION ? "none" : "flagWave 0.9s ease-in-out " + (s.r * -1).toFixed(2) + "s infinite" }} />
        </div>
      )}
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
  var standTop = 18, standBottom = Math.min(groundTop - 28, 66);
  /* Two rows of spectators, laid out once per width */
  var crowd = useMemo(function () {
    var out = [], gap = 15, rows = [standTop + 4, standTop + 21];
    rows.forEach(function (y, ri) {
      for (var x = 6 + (ri ? 7 : 0), i = 0; x < W - 14; x += gap, i++) {
        var k = ri * 100 + i;
        if (Math.abs(x - W / 2) < 26 && ri === 0) continue; /* the royal box sits here */
        out.push({ x: x + (rnd(k, 1) * 4 - 2), y: y + rnd(k, 2) * 2, r: rnd(k, 3), skin: SKINS[Math.floor(rnd(k, 4) * SKINS.length)], shirt: SHIRTS[Math.floor(rnd(k, 5) * SHIRTS.length)],
          hat: HATS[Math.floor(rnd(k, 6) * HATS.length)], flag: rnd(k, 7) < 0.16 });
      }
    });
    return out;
  }, [W]);
  var cheering = !!props.cheer, big = props.cheer === "big";

  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Sky and clouds */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,#bae6fd 0%,#e0f2fe 30%,#fef3c7 70%,#fde68a 100%)" }} />
      {[0, 1].map(function (i) {
        return (<div key={i} style={{ position: "absolute", top: 4 + i * 7, left: i ? "55%" : "8%", width: 46, height: 12, borderRadius: 10, background: "rgba(255,255,255,0.85)", boxShadow: "14px -4px 0 -2px rgba(255,255,255,0.85), -12px 2px 0 -3px rgba(255,255,255,0.8)",
          animation: REDUCED_MOTION ? "none" : "cloudDrift " + (38 + i * 14) + "s linear " + (-i * 17) + "s infinite" }} />);
      })}

      {/* Stands */}
      <div style={{ position: "absolute", left: 0, right: 0, top: standTop, height: standBottom - standTop, background: "repeating-linear-gradient(180deg,#b45309 0 3px,#92400e 3px 4px,#c2621a 4px 15px)", borderTop: "3px solid #78350f" }} />
      {crowd.map(function (s, i) { return (<Spectator key={i} s={s} cheering={cheering} big={big} flagColor={col} />); })}
      {/* Railing along the front of the stands */}
      <div style={{ position: "absolute", left: 0, right: 0, top: standBottom - 4, height: 4, background: "#78350f", boxShadow: "0 2px 0 rgba(0,0,0,0.15)" }} />

      {/* Royal box with a striped canopy in the tier's colour */}
      <div style={{ position: "absolute", left: W / 2 - 24, top: standTop - 12, width: 48, height: 14, borderRadius: "8px 8px 2px 2px", border: "1.5px solid #3f2a1d",
        background: "repeating-linear-gradient(90deg," + col + " 0 6px,#ffffff 6px 12px)" }} />
      <div style={{ position: "absolute", left: W / 2 - 20, top: standTop + 2, width: 40, height: 18, background: "#7f1d1d", border: "1.5px solid #3f2a1d", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>👑</div>

      <Pennant side="left" h={standTop + 10} color={col} />
      <Pennant side="right" h={standTop + 10} color="#ef4444" />

      {/* Tilt barrier down the lane (behind the riders) */}
      <div style={{ position: "absolute", left: "6%", right: "6%", top: groundTop - 20, height: 14, background: "repeating-linear-gradient(90deg," + col + " 0 14px,#fffbeb 14px 28px)", border: "1.5px solid #3f2a1d", borderRadius: 2, opacity: 0.9 }} />
      <div style={{ position: "absolute", left: "6%", right: "6%", top: groundTop - 23, height: 4, background: "#92400e", border: "1px solid #3f2a1d", borderRadius: 2 }} />
      {[0.06, 0.28, 0.5, 0.72, 0.94].map(function (p) {
        return (<div key={p} style={{ position: "absolute", left: "calc(" + (p * 100) + "% - 2px)", top: groundTop - 24, width: 4, height: 24, background: "#78350f", border: "1px solid #3f2a1d" }} />);
      })}

      {/* Hats tossed in the air on a big hit */}
      {big && !REDUCED_MOTION && [0, 1, 2, 3, 4, 5].map(function (i) {
        return (<div key={props.cheerId + "-" + i} style={{ position: "absolute", left: (12 + i * 15) + "%", top: standTop + 6, width: 8, height: 4, borderRadius: "4px 4px 1px 1px", background: SHIRTS[i % SHIRTS.length], border: "1px solid #3f2a1d",
          animation: "hatToss 0.9s ease-out " + (i * 0.05) + "s both" }} />);
      })}
    </div>
  );
}
