/* ═══ WeekEvents ═══ Tour results: every tournament of one week — yours and all the others — with its champion.
   Step between the weeks the tour remembers, tap a tournament for its whole draw (rebuilt from the tour history,
   engine/history), or find any granny by name to open her profile and her week-by-week results. */

import { useState } from "react";
import { TIERS } from "../models/constants";
import { conditionOf, FIELDS } from "../engine/events";
import { weekList } from "../engine/history";
import { C, FONT, display, label } from "../ui/theme";

export default function WeekEvents(props) {
  var q = useState(""), find = q[0];
  var w = props.week;
  var list = w ? weekList(w).sort(function (a, b) { return b.tier - a.tier || a.idx - b.idx; }) : [];
  var needle = find.trim().toLowerCase();
  var found = needle.length >= 2 ? props.riders.filter(function (r) { return r.name.toLowerCase().indexOf(needle) >= 0; }).slice(0, 8) : [];
  var arrow = function (on, txt, go) { return (<button disabled={!on} onClick={go} aria-label={txt === "‹" ? "Earlier week" : "Later week"} style={{ width: 34, height: 34, borderRadius: 17, border: "1.5px solid " + (on ? C.ink : C.line), background: on ? C.card : "transparent", color: on ? C.ink : C.line, fontSize: 18, fontWeight: 900, cursor: on ? "pointer" : "default", lineHeight: "28px", padding: 0 }}>{txt}</button>); };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, fontFamily: FONT }} onClick={props.onClose}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 14, maxWidth: 420, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", border: "1px solid #e5e7eb" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <span style={display(22)}>Tour results</span>
          <button onClick={props.onClose} aria-label="Close" style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        {/* Find a granny: her profile lists every week she rode */}
        <input value={find} onChange={function (e) { q[1](e.target.value); }} placeholder="🔎 Find a granny by name"
          style={{ fontSize: 14, padding: "8px 10px", borderRadius: 10, border: "1.5px solid " + C.lineStrong, fontFamily: FONT, fontWeight: 700, marginBottom: 6 }} />
        {needle.length >= 2 && (
          <div style={{ marginBottom: 8 }}>
            {found.length ? found.map(function (r) {
              return (<button key={r.id} onClick={function () { props.onRider(r.id); }} style={{ display: "flex", width: "100%", justifyContent: "space-between", gap: 8, padding: "6px 8px", marginBottom: 2, borderRadius: 8, border: "none", background: r.id === 1 ? C.goldSoft : C.cardWarm, cursor: "pointer", fontFamily: FONT, fontSize: 13, fontWeight: 800, color: C.text, textAlign: "left" }}>
                <span>{r.emoji} {r.name}</span><span style={{ color: C.textSoft }}>#{r.rank} ›</span>
              </button>);
            }) : (<div style={{ fontSize: 12.5, color: C.textSoft, padding: "4px 2px" }}>No granny by that name.</div>)}
          </div>
        )}
        {w ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0 6px" }}>
            {arrow(props.hasPrev, "‹", props.onPrev)}
            <div style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: C.text }}>Season {w.s} · {w.l}</div>
              <div style={label(C.textSoft)}>{list.length} tournaments · tap one for its draw</div>
            </div>
            {arrow(props.hasNext, "›", props.onNext)}
          </div>
        ) : (
          <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.45, padding: "6px 2px" }}>The tour keeps every tournament's draw from the next week you play. After it, every week shows up here — and in each granny's profile, under <b>Week by week</b>.</div>
        )}
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
