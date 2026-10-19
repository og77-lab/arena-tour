/* ═══ WeekEvents ═══ Every tournament of one week — yours and all the others — with its champion. Tap one to see its
   whole draw, round 1 to the final (rebuilt from the tour history, engine/history). */

import { TIERS } from "../models/constants";
import { conditionOf, FIELDS } from "../engine/events";
import { weekList } from "../engine/history";
import { C, FONT, display, label } from "../ui/theme";

export default function WeekEvents(props) {
  var w = props.week; if (!w) return null;
  var list = weekList(w).sort(function (a, b) { return b.tier - a.tier || a.idx - b.idx; });
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, fontFamily: FONT }} onClick={props.onClose}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 14, maxWidth: 420, width: "100%", maxHeight: "85vh", display: "flex", flexDirection: "column", border: "1px solid #e5e7eb" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
          <span style={display(22)}>{w.l || "This week"}</span>
          <button onClick={props.onClose} aria-label="Close" style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={Object.assign(label(C.textSoft), { marginBottom: 8 })}>Season {w.s} · {list.length} tournaments · tap one for its draw</div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {list.map(function (e, i) {
            var t = TIERS[e.tier], cd = conditionOf(e.cond), f = FIELDS[e.field], champ = e.winnerId != null ? props.nameOf(e.winnerId) : null;
            var head = i === 0 || list[i - 1].tier !== e.tier;
            return (
              <div key={e.idx}>
                {head && (<div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: t.col, textTransform: "uppercase", margin: i ? "10px 2px 3px" : "0 2px 3px" }}>{t.name}</div>)}
                <button onClick={function () { props.onOpen(e.idx); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left", padding: "7px 8px", marginBottom: 3, borderRadius: 10, cursor: "pointer", fontFamily: FONT,
                    background: e.mine ? C.goldSoft : C.cardWarm, border: "1.5px solid " + (e.mine ? C.ink : C.line) }}>
                  <span aria-hidden style={{ fontSize: 16 }}>{cd.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: "block", fontSize: 13.5, fontWeight: 900, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.name}{e.mine ? " · your event" : ""}</span>
                    <span style={{ display: "block", fontSize: 11.5, color: C.textSoft }}>{cd.name} · {f ? f.label : ""} · draw of {e.size}</span>
                  </span>
                  <span style={{ textAlign: "right", fontSize: 12, fontWeight: 800, color: champ && champ.isP ? C.goldInk : C.text, maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    🏆 {champ ? (champ.emoji ? champ.emoji + " " : "") + champ.short : "—"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
