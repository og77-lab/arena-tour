/* ═══ Fitness ═══ The two meters (granny, rooster), big on Home and small everywhere else */

import { fitOf, fatigueFx, fitColor, fitWord, recoveryOf, injuryText, INJURY_LINE } from "../engine/fitness";
import { effectsOf, EffectList } from "./Effect";
import { C, FONT, label, card } from "../ui/theme";
import { fanChain } from "../engine/social";
import { useState } from "react";
import FanRules from "./FanRules";

function Meter(props) {
  var v = props.v, col = fitColor(v);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "82px 1fr 78px", alignItems: "center", gap: 8, height: 22 }}>
      <span style={{ fontSize: 13, fontWeight: 900, color: C.text, whiteSpace: "nowrap" }}>{props.icon} {props.label}</span>
      <div style={{ height: 12, borderRadius: 6, background: "#efe3c4", border: "1.5px solid " + C.ink, overflow: "hidden" }}>
        <div style={{ width: v + "%", height: "100%", background: col, transition: "width 0.6s" }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 900, color: col, textAlign: "right", whiteSpace: "nowrap" }}>{v}% <span style={{ fontSize: 10.5 }}>{fitWord(v)}</span></span>
    </div>
  );
}

/* Home card: both meters on their own rows, what tiredness does right now (as chips), and what comes back */
export function FitnessCard(props) {
  var p = props.player, f = fitOf(p), b = (p.tr && p.tr.b) || 0, x = fatigueFx(f);
  var gChips = effectsOf({ zone: Math.round(x.zone * 10) / 10, miss: Math.round(x.miss) });
  var rChips = effectsOf({ speed: Math.round(x.speed * 100) / 100, accel: Math.round(x.accel * 100) / 100 });
  return (
    <div onClick={props.onTrain} style={card({ padding: "10px 12px", cursor: props.onTrain ? "pointer" : "default", fontFamily: FONT })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={label(C.goldInk)}>Fitness</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.textSoft }}>Next recovery 👵+{Math.round(recoveryOf(b, false, f.g))} 🐓+{Math.round(recoveryOf(b, false, f.r))}</span>
      </div>
      {p.fitEnd && (<div style={{ fontSize: 11.5, fontWeight: 800, color: C.textSoft, marginBottom: 5 }}>Last tournament you finished at <span style={{ color: fitColor(p.fitEnd.g) }}>👵{p.fitEnd.g}%</span> <span style={{ color: fitColor(p.fitEnd.r) }}>🐓{p.fitEnd.r}%</span> — recovered since.</div>)}
      <Meter icon="👵" label="Granny" v={f.g} />

      <Meter icon="🐓" label="Rooster" v={f.r} />
      {Math.min(f.g, f.r) < 95 && (<div style={{ fontSize: 12.5, fontWeight: 900, color: C.redInk, marginTop: 6 }}>Tiredness right now: gold zone −{Math.abs(x.zone).toFixed(1)}%, bar {Math.round((x.speed - 1) * 100 + (x.accel - 1) * 30)}% faster, misses −{Math.round(Math.abs(x.miss))}</div>)}
      {Math.min(f.g, f.r) >= 95 && (<div style={{ fontSize: 12, color: C.greenInk, fontWeight: 800, marginTop: 4 }}>Both fresh — tiredness changes nothing yet.</div>)}
      {(p.inj || []).map(function (x) { return (<div key={x.id} style={{ fontSize: 12, fontWeight: 900, color: C.redInk, background: "#fef2f2", border: "1.5px solid #fecaca", borderRadius: 8, padding: "4px 8px", marginTop: 5 }}>🩹 {injuryText(x)}</div>); })}
      {Math.min(f.g, f.r) < INJURY_LINE && (<div style={{ fontSize: 12, fontWeight: 900, color: C.redInk, marginTop: 5 }}>⚠️ Under {INJURY_LINE}%: every match now risks an injury. Book the physio or skip a Slam to rest.</div>)}
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 5, lineHeight: 1.35 }}>Every match tires you and only part of it comes back after a tournament, so tiredness builds up. 🔋 Bounce-back and the physio (Train tab) win it back.</div>
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
/* followers → where fans settle → fans → what they give you, one step per line */
export function FanChain(props) {
  var c = props.c, k = props.k, e = c.edge, row = { display: "flex", gap: 6, alignItems: "baseline", fontSize: 12, lineHeight: 1.35, marginTop: 3 };
  var arrow = (<span style={{ color: C.textMuted, fontWeight: 900 }}>↳</span>);
  return (
    <div style={{ marginTop: 6, padding: "6px 8px", borderRadius: 8, background: "rgba(190,18,60,0.06)", color: C.textSoft }}>
      <div style={row}><span>🧶</span><span><b>{k(c.fol)} followers</b> → your fans drift back toward <b>{c.settle}</b> each week{c.lift ? (<span> ({c.base} for your rank <b style={{ color: C.greenInk }}>+{c.lift}</b> from followers)</span>) : (<span> (followers add +0 until 1K)</span>)}</span></div>
      <div style={row}>{arrow}<span><b>❤️ {c.fans} fans</b> → <b style={{ color: C.greenInk }}>+{c.tp} training pts</b> a week from sponsors</span></div>
      <div style={row}>{arrow}<span>In the stands vs a typical rival (❤️ {c.typLove}): {e > 0.05 ? (<b style={{ color: C.greenInk }}>your gold zone +{e.toFixed(1)}%</b>) : e < -0.05 ? (<b style={{ color: C.redInk }}>her gold zone +{(-e).toFixed(1)}%</b>) : (<b>even</b>)}{Math.abs(e) > 0.05 ? ", doubled on match point" : ""}</span></div>
    </div>
  );
}

export function FansCard(props) {
  var p = props.player, fans = p.fans != null ? p.fans : 20, w = p.fansWeek, fol = p.followers != null ? p.followers : 120;
  var d = w ? fans - w.before : 0, rs = useState(false), open = rs[0];
  function k(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1000) + "K" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n); }
  return (
    <div style={card({ padding: "10px 12px", fontFamily: FONT })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={label("#be123c")}>Fans & Knitter</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.textSoft }}>🧶 {k(fol)} followers{w && w.fol ? (<b style={{ color: C.greenInk }}> +{k(w.fol)}</b>) : null}</span>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        <span style={{ fontSize: 22, fontWeight: 900, color: "#be123c" }}>❤️ {fans}</span>
        {w && (<span style={{ fontSize: 14, fontWeight: 900, color: d > 0 ? C.greenInk : d < 0 ? C.redInk : C.textMuted }}>{d > 0 ? "▲ +" + d : d < 0 ? "▼ " + d : "±0"} this week</span>)}
      </div>
      {w && w.parts && w.parts.length > 0 && (<div style={{ fontSize: 12, fontWeight: 800, color: C.textSoft, marginTop: 2 }}>
        {w.parts.map(function (x, i) { return (<span key={i}>{i ? " · " : ""}{x[0]} <b style={{ color: x[1] > 0 ? C.greenInk : C.redInk }}>{x[1] > 0 ? "+" : ""}{x[1]}</b></span>); })}
      </div>)}
      <FanChain c={fanChain(p, props.rank)} k={k} />
      <button onClick={function () { rs[1](!open); }} style={{ marginTop: 6, width: "100%", padding: "6px 8px", borderRadius: 8, border: "1.5px solid #fecdd3", background: open ? "#fff1f2" : "#fff", color: "#be123c", fontWeight: 900, fontSize: 12, fontFamily: FONT, cursor: "pointer" }}>📜 {open ? "Hide the fan rules" : "All the fan rules"}</button>
      {open && (<div style={{ marginTop: 6 }}><FanRules /></div>)}
    </div>
  );
}
