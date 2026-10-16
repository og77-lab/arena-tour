/* ═══ Fitness ═══ The two meters (granny, rooster), big on Home and small everywhere else */

import { fitOf, fitLines, fitColor, fitWord, recoveryOf } from "../engine/fitness";
import { C, FONT, label, card } from "../ui/theme";

function Meter(props) {
  var v = props.v, col = fitColor(v);
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 }}>
        <span style={{ fontSize: 13, fontWeight: 900, color: C.text }}>{props.icon} {props.label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: col }}>{v}% <span style={{ fontSize: 10.5, fontWeight: 800 }}>{fitWord(v)}</span></span>
      </div>
      <div style={{ height: 10, borderRadius: 6, background: "#efe3c4", border: "1.5px solid " + C.ink, overflow: "hidden" }}>
        <div style={{ width: v + "%", height: "100%", background: col, transition: "width 0.6s" }} />
      </div>
    </div>
  );
}

/* Home card: both meters, what tiredness is doing right now, and how much comes back next week */
export function FitnessCard(props) {
  var p = props.player, f = fitOf(p), lines = fitLines(f), b = (p.tr && p.tr.b) || 0;
  return (
    <div onClick={props.onTrain} style={card({ padding: "10px 12px", cursor: props.onTrain ? "pointer" : "default", fontFamily: FONT })}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <span style={label(C.goldInk)}>Fitness</span>
        <span style={{ fontSize: 11, fontWeight: 800, color: C.textSoft }}>+{Math.round(recoveryOf(b, false))}% back after each tournament · 🔋 Bounce-back {b}</span>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Meter icon="👵" label="Granny" v={f.g} />
        <Meter icon="🐓" label={props.roosterName || "Rooster"} v={f.r} />
      </div>
      <div style={{ fontSize: 12, color: lines.length ? C.redInk : C.greenInk, fontWeight: 800, marginTop: 6, lineHeight: 1.4 }}>
        {lines.length ? lines.map(function (l) { return (<div key={l}>{l}</div>); }) : "Both fresh — no tiredness on the lanes."}
      </div>
      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 4, lineHeight: 1.35 }}>Every match tires both of you; fitness only comes back between tournaments (double in a week off). Physio staff in the Train tab.</div>
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
