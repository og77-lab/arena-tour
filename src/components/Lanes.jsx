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

export function laneChips(c, gaps) { var d = CONDITIONS[c] || CONDITIONS.classic; return effectsOf({ zone: d.zone, speed: d.speed, accel: d.accel, w: d.w, money: d.money !== 1 ? d.money : 1, pts: d.pts !== 1 ? d.pts : 1 }, gaps); }

/* One lane on one row: tile, name, chips */
export function LaneRow(props) {
  var d = CONDITIONS[props.cond] || CONDITIONS.classic, dark = props.dark;
  if (props.compact) return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
      <LaneTile cond={props.cond} w={props.w || 36} h={props.h || 28} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, fontWeight: 900, color: dark ? "#fde68a" : C.text }}>{props.label ? props.label + " " : ""}{d.short}</span>
      {props.verdict && (<Verdict v={props.verdict} />)}
    </div>
  );
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FONT }}>
      <LaneTile cond={props.cond} w={props.w || 50} h={props.h || 36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: dark ? "#fff" : C.text }}>{d.name}</span>
          {props.verdict && (<Verdict v={props.verdict} />)}
        </div>
        <div style={{ fontSize: 11.5, color: dark ? "rgba(255,255,255,0.8)" : C.textSoft, lineHeight: 1.35, marginTop: 1 }}>{d.about}</div>
      </div>
    </div>
  );
}

/* All five side by side, for comparing before you pick */
export function CompareLanes(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "8px 10px", background: "#fff", border: "1.5px solid " + C.line, borderRadius: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 11.5, fontWeight: 800, color: C.textSoft }}>The lanes change the match for <b>both</b> riders.</div>
      {Object.keys(CONDITIONS).map(function (k) { return (<LaneRow key={k} cond={k} verdict={props.verdictOf ? props.verdictOf(k) : null} />); })}
    </div>
  );
}

/* The one thing a player needs: does this suit me? Words, not icons. */
export function Verdict(props) {
  var k = props.v && props.v.key;
  if (!k) return null;
  var st = k === "good" ? { bg: "#16a34a", fg: "#fff", t: "✓ GOOD FOR YOU" } : k === "hard" ? { bg: "#dc2626", fg: "#fff", t: "✗ HARD FOR YOU" } : { bg: "#e7e5e4", fg: "#44403c", t: "EVEN" };
  return (<span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 900, letterSpacing: 0.8, color: st.fg, background: st.bg, borderRadius: 10, padding: "3px 8px", whiteSpace: "nowrap", fontFamily: FONT }}>{st.t}</span>);
}
