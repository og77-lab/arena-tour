/* ═══ MatchHeader ═══ Where am I? Tournament, round, format, and the road through the bracket */

import { C, FONT, display, label, card, button } from "../ui/theme";
import { conditionOf } from "../engine/events";
import { BY_ID } from "../engine/gear";
import { FitnessMini } from "./Fitness";
import { useState } from "react";

var SHORT = { "Round of 64": "R64", "Round of 32": "R32", "Round of 16": "R16", "Quarterfinals": "QF", "Semifinals": "SF", "Final": "F", "Group Stage": "Groups", "Semifinal": "SF", "World Final": "Final" };

export default function MatchHeader(props) {
  var rounds = props.rounds || [];
  var name = props.tierName || "", cd = props.cond ? conditionOf(props.cond) : null;
  /* the opponent's report, the draw and the rules live behind one small button, so the screen stays on the match */
  var _m = useState(false), menu = _m[0], setMenu = _m[1];
  var items = [props.onScout && ["🔎 Her report", props.onScout], props.onBracket && ["📋 The draw", props.onBracket], props.onHelp && ["❔ How to play", props.onHelp]].filter(Boolean);
  return (
    <div style={card({ padding: "10px 12px 10px", marginBottom: 8, fontFamily: FONT, textAlign: "left" })}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span aria-hidden style={{ width: 12, height: 12, borderRadius: "50%", background: props.tierColor, border: "2px solid " + C.ink, flexShrink: 0 }} />
            <span style={Object.assign(display(name.length > 22 ? 15 : name.length > 15 ? 17 : 21), { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{name}</span>
          </div>
          <div style={{ marginTop: 3, fontSize: 15, fontWeight: 900, color: C.text }}>
            {props.roundLabel}
            <span style={{ fontSize: 12, fontWeight: 800, color: C.textSoft, marginLeft: 8 }}>Best of {props.bestOf} sets</span>
          </div>
          {((cd && cd.key !== "classic") || props.gear || props.fit) && (
            <div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 900, display: "flex", gap: 8, alignItems: "center" }}>
              {props.fit && (<span style={{ flexShrink: 0 }}><FitnessMini fit={props.fit} />{props.fitStart && (props.fitStart.g > props.fit.g || props.fitStart.r > props.fit.r) ? (<span style={{ color: C.redInk, fontSize: 10.5, marginLeft: 3 }}>({props.fit.g - props.fitStart.g}/{props.fit.r - props.fitStart.r})</span>) : null}{props.injured ? " 🩹" : ""}</span>)}
              {props.gear && (<span style={{ color: C.textSoft, flexShrink: 0 }}>{(BY_ID[props.gear.lance] || {}).icon}{(BY_ID[props.gear.saddle] || {}).icon}</span>)}
              {cd && cd.key !== "classic" && (<span style={{ color: C.redInk, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cd.icon} {cd.effect}</span>)}
            </div>
          )}
        </div>
        {items.length > 0 && (<div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={function () { setMenu(!menu); }} aria-label="More" aria-expanded={menu} style={button("ghost", { padding: "4px 11px", fontSize: 18, lineHeight: 1, letterSpacing: 1 })}>⋯</button>
          {menu && (<div style={{ position: "absolute", right: 0, top: "calc(100% + 6px)", zIndex: 50, background: C.card, border: "1.5px solid " + C.line, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.18)", padding: 4, minWidth: 160 }}>
            {items.map(function (it) { return (<button key={it[0]} onClick={function () { setMenu(false); it[1](); }} style={{ display: "block", width: "100%", textAlign: "left", padding: "9px 10px", border: "none", background: "none", borderRadius: 8, fontFamily: FONT, fontSize: 14, fontWeight: 800, color: C.text, cursor: "pointer" }}>{it[0]}</button>); })}
          </div>)}
        </div>)}
      </div>
      {rounds.length > 1 && (
        <div style={{ display: "flex", gap: 4, marginTop: 9 }}>
          {rounds.map(function (r, i) {
            var done = i < props.roundIdx, cur = i === props.roundIdx;
            return (
              <div key={i} style={{ flex: 1, textAlign: "center", padding: "3px 0", borderRadius: 8, fontSize: 10, fontWeight: 900, letterSpacing: 0.6,
                background: cur ? C.night : done ? "#efe3c4" : C.cardWarm,
                color: cur ? "#fff" : done ? C.textSoft : C.textMuted,
                border: (cur ? "2px solid " + props.tierColor : "1.5px solid " + C.line),
                boxShadow: cur ? "0 0 0 2px " + C.card + ", 0 0 10px " + props.tierColor : "none" }}>
                {done ? "✓ " : ""}{SHORT[r] || r}
                {props.ladder && props.ladder[i] && (<span style={{ display: "block", fontSize: 10.5, letterSpacing: 0, color: cur ? "#fde68a" : done ? C.textSoft : C.goldInk }}>{props.ladder[i].pts.toLocaleString()}</span>)}
              </div>
            );
          })}
        </div>
      )}
      {props.sub && (<div style={Object.assign(label(C.textSoft), { marginTop: 7 })}>{props.sub}</div>)}
    </div>
  );
}
