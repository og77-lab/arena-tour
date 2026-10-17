/* ═══ Lanes ═══ What the lanes look like and do, at a glance: a little picture of the ground (the same look the
   arena takes on), the name, and the effect chips. Used in the tournament list, Get ready and the tale of the tape. */

import { CONDITIONS } from "../engine/events";
import { effectsOf, EffectList } from "./Effect";
import { C, FONT } from "../ui/theme";
import { REDUCED_MOTION } from "./fx";

var SKY = { classic: "linear-gradient(180deg,#7dd3fc,#e0f2fe)", mud: "linear-gradient(180deg,#94a3b8,#cbd5e1)", wind: "linear-gradient(180deg,#38bdf8,#e0f2fe)", heat: "linear-gradient(180deg,#fb923c,#fde68a)", green: "linear-gradient(180deg,#7dd3fc,#ecfccb)" };
var GROUND = { classic: "linear-gradient(180deg,#d6b276,#a57c45)", mud: "linear-gradient(180deg,#6b4f2a,#3b2a14)", wind: "linear-gradient(180deg,#d6b276,#a57c45)", heat: "linear-gradient(180deg,#f2d49b,#d6b073)", green: "linear-gradient(180deg,#65a30d,#3f6212)" };

/* A tiny picture of the lanes */
export function LaneTile(props) {
  var c = props.cond || "classic", w = props.w || 54, h = props.h || 40, g = Math.round(h * 0.38), anim = !REDUCED_MOTION;
  return (
    <div aria-hidden style={{ position: "relative", width: w, height: h, borderRadius: 9, overflow: "hidden", border: "2px solid " + C.ink, background: SKY[c] || SKY.classic, flexShrink: 0 }}>
      {(c === "classic" || c === "heat") && (<div style={{ position: "absolute", right: 5, top: 4, width: c === "heat" ? 15 : 11, height: c === "heat" ? 15 : 11, borderRadius: "50%", background: "radial-gradient(circle,#fffbeb,#fde047 55%,#f59e0b)", boxShadow: c === "heat" ? "0 0 10px 4px rgba(253,224,71,0.7)" : "none" }} />)}
      {c === "mud" && (<div style={{ position: "absolute", left: 4, top: 3, width: 22, height: 8, borderRadius: 6, background: "#64748b" }} />)}
      {c === "mud" && (<div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(105deg,rgba(255,255,255,0.55) 0 1px,transparent 1px 6px)", backgroundSize: "24px 24px", animation: anim ? "rainFall 0.5s linear infinite" : "none" }} />)}
      {c === "wind" && [0, 1, 2].map(function (i) { return (<div key={i} style={{ position: "absolute", left: -20, top: 4 + i * 7, width: 18, height: 2, borderRadius: 2, background: "#fff", animation: anim ? "laneGust " + (0.8 + i * 0.3) + "s linear " + (i * 0.25) + "s infinite" : "none" }} />); })}
      {c === "wind" && (<div style={{ position: "absolute", right: 6, bottom: g - 1, width: 2, height: 14, background: C.ink }}><div style={{ position: "absolute", left: 2, top: 0, width: 10, height: 6, background: "#ef4444", transformOrigin: "left center", animation: anim ? "flagWave 0.5s ease-in-out infinite" : "none" }} /></div>)}
      {c === "heat" && (<div style={{ position: "absolute", left: 0, right: 0, bottom: g - 4, height: 8, background: "linear-gradient(180deg,transparent,rgba(255,237,213,0.7),transparent)", animation: anim ? "heatShimmer 1.4s ease-in-out infinite" : "none" }} />)}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: g, background: GROUND[c] || GROUND.classic, borderTop: "1.5px solid rgba(63,42,29,0.6)" }} />
      {c === "mud" && [0.12, 0.55].map(function (x) { return (<div key={x} style={{ position: "absolute", left: (x * 100) + "%", bottom: 3, width: 16, height: 4, borderRadius: "50%", background: "#94a3b8", border: "1px solid #3b2a14" }} />); })}
      {c === "green" && [0.1, 0.35, 0.6, 0.85].map(function (x) { return (<div key={x} style={{ position: "absolute", left: (x * 100) + "%", bottom: g - 4, width: 5, height: 5, borderRadius: "50%", background: "radial-gradient(circle,#facc15 0 30%,#fff 32%)" }} />); })}
      {c === "heat" && (<div style={{ position: "absolute", left: 6, bottom: 4, fontSize: 9 }}>💦</div>)}
    </div>
  );
}

export function laneChips(c) { var d = CONDITIONS[c] || CONDITIONS.classic; return effectsOf({ zone: d.zone, speed: d.speed, accel: d.accel, w: d.w, money: d.money !== 1 ? d.money : 1, pts: d.pts !== 1 ? d.pts : 1 }); }

/* One lane on one row: tile, name, chips */
export function LaneRow(props) {
  var d = CONDITIONS[props.cond] || CONDITIONS.classic;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
      <LaneTile cond={props.cond} w={props.w || 50} h={props.h || 36} />
      {props.compact ? (
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 12, fontWeight: 900, color: props.dark ? "#fde68a" : C.text, marginRight: 2 }}>{props.label ? props.label + " " : ""}{d.name}</span>
          <EffectList list={laneChips(props.cond)} empty="nothing changes" />
        </div>
      ) : (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 900, color: props.dark ? "#fff" : C.text }}>{d.name}</div>
        <div style={{ marginTop: 3 }}><EffectList list={laneChips(props.cond)} empty="Nothing changes — pure timing" /></div>
      </div>)}
    </div>
  );
}

/* All five side by side, for comparing before you pick */
export function CompareLanes() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "8px 10px", background: "#fff", border: "1.5px solid " + C.line, borderRadius: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: C.textSoft }}>The lanes change the bar for <b>both</b> riders. Which suits you depends on your stats and your gear.</div>
      {Object.keys(CONDITIONS).map(function (k) { return (<LaneRow key={k} cond={k} />); })}
    </div>
  );
}
