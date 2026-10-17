/* ═══ Fitness ═══ The two meters (granny, rooster), big on Home and small everywhere else */

import { fitOf, fatigueFx, fitColor, fitWord, recoveryOf, injuryText, INJURY_LINE } from "../engine/fitness";
import { effectsOf, EffectList } from "./Effect";
import { C, FONT, label, card } from "../ui/theme";

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
      {gChips.length > 0 && (<div style={{ margin: "3px 0 5px" }}><EffectList list={gChips} /></div>)}
      <Meter icon="🐓" label="Rooster" v={f.r} />
      {rChips.length > 0 && (<div style={{ margin: "3px 0 2px" }}><EffectList list={rChips} /></div>)}
      {!gChips.length && !rChips.length && (<div style={{ fontSize: 12, color: C.greenInk, fontWeight: 800, marginTop: 4 }}>Both fresh — tiredness changes nothing yet.</div>)}
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
