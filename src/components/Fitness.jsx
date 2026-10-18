/* ═══ Fitness ═══ The two meters (granny, rooster), big on Home and small everywhere else */

import { fitOf, fatigueFx, fitColor, fitWord, recoveryOf, injuryText, INJURY_LINE } from "../engine/fitness";
import { effectsOf, EffectList } from "./Effect";
import { C, FONT, label, card, BODY, HEAD, card2, title2, cap2 } from "../ui/theme";
import Icon from "./Icons";
import { fanChain } from "../engine/social";
import { useState } from "react";
import FanRules from "./FanRules";

function Meter(props) {
  var v = props.v, col = fitColor(v);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "92px 1fr 66px", alignItems: "center", gap: 8, height: 28 }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: C.text, whiteSpace: "nowrap" }}><Icon name={props.iconName} size={22} />{props.label}</span>
      <div style={{ height: 10, borderRadius: 6, background: "#f3ead3", overflow: "hidden", boxShadow: "inset 0 1px 2px rgba(63,42,29,0.12)" }}>
        <div style={{ width: v + "%", height: "100%", borderRadius: 6, background: "linear-gradient(90deg," + col + "cc," + col + ")", transition: "width 0.6s" }} />
      </div>
      <span style={{ textAlign: "right", whiteSpace: "nowrap", lineHeight: 1 }}><span style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 17, color: col }}>{v}%</span><span style={{ display: "block", fontSize: 10, fontWeight: 800, color: C.textMuted }}>{fitWord(v)}</span></span>
    </div>
  );
}

/* Home card: both meters on their own rows, what tiredness does right now (as chips), and what comes back */
export function FitnessCard(props) {
  var p = props.player, f = fitOf(p), b = (p.tr && p.tr.b) || 0, x = fatigueFx(f);
  var gChips = effectsOf({ zone: Math.round(x.zone * 10) / 10, miss: Math.round(x.miss) });
  var rChips = effectsOf({ speed: Math.round(x.speed * 100) / 100, accel: Math.round(x.accel * 100) / 100 });
  return (
    <div onClick={props.onTrain} style={card2({ cursor: props.onTrain ? "pointer" : "default" })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="battery" size={22} /><span style={title2(17)}>Fitness</span></span>
        <span style={cap2(C.textSoft)}>next recovery <b style={{ color: C.greenInk }}>+{Math.round(recoveryOf(b, false, f.g))}</b> / <b style={{ color: C.greenInk }}>+{Math.round(recoveryOf(b, false, f.r))}</b></span>
      </div>
      {p.fitEnd && (<div style={{ fontSize: 11.5, fontWeight: 800, color: C.textSoft, marginBottom: 5 }}>Last tournament you finished at <span style={{ color: fitColor(p.fitEnd.g), whiteSpace: "nowrap" }}><Icon name="granny" size={15} /> {p.fitEnd.g}%</span> <span style={{ color: fitColor(p.fitEnd.r), whiteSpace: "nowrap" }}><Icon name="rooster" size={15} /> {p.fitEnd.r}%</span> — recovered since.</div>)}
      <Meter iconName="granny" label="Granny" v={f.g} />
      <Meter iconName="rooster" label="Rooster" v={f.r} />
      {Math.min(f.g, f.r) < 95 && (<div style={{ fontSize: 12.5, fontWeight: 900, color: C.redInk, marginTop: 6 }}>Tiredness right now: gold zone −{Math.abs(x.zone).toFixed(1)}%, bar {Math.round((x.speed - 1) * 100 + (x.accel - 1) * 30)}% faster, misses −{Math.round(Math.abs(x.miss))}</div>)}
      {Math.min(f.g, f.r) >= 95 && (<div style={{ fontSize: 12, color: C.greenInk, fontWeight: 800, marginTop: 4 }}>Both fresh — tiredness changes nothing yet.</div>)}
      {(p.inj || []).map(function (x) { return (<div key={x.id} style={{ fontSize: 12, fontWeight: 900, color: C.redInk, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "4px 8px", marginTop: 5 }}>🩹 {injuryText(x)}</div>); })}
      {Math.min(f.g, f.r) < INJURY_LINE && (<div style={{ fontSize: 12, fontWeight: 900, color: C.redInk, marginTop: 5 }}>⚠️ Under {INJURY_LINE}%: every match now risks an injury. Book the physio or skip a Slam to rest.</div>)}
      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 6, fontWeight: 700 }}>Tiredness builds up · Bounce-back and the physio win it back</div>
    </div>
  );
}

/* One-line version for headers: 👵 78 🐓 64 */
export function FitnessMini(props) {
  var f = props.fit || fitOf(props.player);
  return (
    <span style={{ fontWeight: 900, whiteSpace: "nowrap" }}>
      <span style={{ color: fitColor(f.g) }}>👵{f.g}</span> <span style={{ color: fitColor(f.r) }}>🐓{f.r}</span>
    </span>
  );
}

/* Home card: your fans (and why they moved this week), your Knitter following, and what fans are for */
/* What your crowd love gives you right now, and where it's heading — plain lines, real numbers */
export function FanChain(props) {
  var c = props.c, k = props.k, e = c.edge, row = { fontSize: 12.5, lineHeight: 1.4, marginTop: 3 };
  return (
    <div style={{ marginTop: 8, padding: "9px 11px", borderRadius: 14, background: "#fff1f2", color: C.textSoft }}>
      <div style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 600, color: "#9f1239" }}>What {c.fans} gives you</div>
      <div style={row}>• <b style={{ color: C.greenInk }}>+{c.tp} training points</b> a week from sponsors</div>
      <div style={row}>• Riders near your rank have about ❤️ {c.typLove}. Against them: {e > 0.05 ? (<b style={{ color: C.greenInk }}>your gold zone +{e.toFixed(1)}%</b>) : e < -0.05 ? (<b style={{ color: C.redInk }}>her gold zone +{(-e).toFixed(1)}%</b>) : (<b>no edge either way</b>)}{Math.abs(e) > 0.05 ? " (×2 on match point)" : ""}</div>
      <div style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 600, color: "#9f1239", marginTop: 8 }}>Where it's heading</div>
      <div style={row}>Each week it slides 10% toward <b>{c.settle}</b> ({c.base} for your rank{c.lift ? (<span> + <b style={{ color: C.greenInk }}>{c.lift}</b> for {k(c.fol)} followers</span>) : ""}), then your results move it.</div>
    </div>
  );
}

export function FansCard(props) {
  var p = props.player, fans = p.fans != null ? p.fans : 20, w = p.fansWeek, fol = p.followers != null ? p.followers : 120;
  var d = w ? fans - w.before : 0, rs = useState(false), open = rs[0];
  function k(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1000) + "K" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n); }
  return (
    <div style={card2({})}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="heart" size={22} /><span style={title2(17)}>Crowd love</span></span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 800, color: C.textSoft }}><Icon name="yarn" size={18} />{k(fol)} followers{w && w.fol ? (<b style={{ color: w.fol > 0 ? C.greenInk : C.redInk }}> {w.fol > 0 ? "+" + k(w.fol) : "−" + k(-w.fol)}</b>) : null}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontFamily: HEAD, fontSize: 32, fontWeight: 600, color: "#be123c", lineHeight: 1 }}>{fans}<span style={{ fontSize: 14, color: C.textMuted, fontWeight: 600 }}> / 100</span></span>
        {w && (<span style={{ fontSize: 14, fontWeight: 900, color: d > 0 ? C.greenInk : d < 0 ? C.redInk : C.textMuted }}>{d > 0 ? "▲ +" + d : d < 0 ? "▼ " + d : "±0"} this week</span>)}
      </div>
      {w && w.parts && w.parts.length > 0 && (<div style={{ fontSize: 12, fontWeight: 800, color: C.textSoft, marginTop: 2 }}>
        {w.parts.map(function (x, i) { return (<span key={i}>{i ? " · " : ""}{x[0]} <b style={{ color: x[1] > 0 ? C.greenInk : C.redInk }}>{x[1] > 0 ? "+" : ""}{x[1]}</b></span>); })}
      </div>)}
      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 3 }}>A score of how much the crowd loves you, not a head count. Your Knitter followers are the people.</div>
      <FanChain c={fanChain(p, props.rank)} k={k} />
      <button onClick={function () { rs[1](!open); }} style={{ marginTop: 8, width: "100%", padding: "9px 8px", borderRadius: 12, border: "none", background: open ? "#ffe4e6" : "#fff1f2", color: "#9f1239", fontWeight: 600, fontSize: 14, fontFamily: HEAD, cursor: "pointer" }}>📜 {open ? "Hide the rules" : "All the crowd love rules"}</button>
      {open && (<div style={{ marginTop: 6 }}><FanRules /></div>)}
    </div>
  );
}
