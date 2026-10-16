/* ═══ MatchHeader ═══ Where am I? Tournament, round, format, and the road through the bracket */

import { C, FONT, display, label, card, button } from "../ui/theme";
import { conditionOf } from "../engine/events";

var SHORT = { "Round of 64": "R64", "Round of 32": "R32", "Round of 16": "R16", "Quarterfinals": "QF", "Semifinals": "SF", "Final": "F", "Group Stage": "Groups", "Semifinal": "SF", "World Final": "Final" };

export default function MatchHeader(props) {
  var rounds = props.rounds || [];
  var name = props.tierName || "", cd = props.cond ? conditionOf(props.cond) : null;
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
          {cd && cd.key !== "classic" && (<div style={{ marginTop: 3, fontSize: 11.5, fontWeight: 900, color: C.redInk }}>{cd.icon} {cd.name}: {cd.effect}</div>)}
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          {props.onScout && (<button onClick={props.onScout} style={button("night", { padding: "7px 10px", fontSize: 12, letterSpacing: 0.5, boxShadow: "0 3px 0 " + C.nightDeep })}>ⓘ Scout</button>)}
          {props.onBracket && (<button onClick={props.onBracket} aria-label="Bracket" style={button("ghost", { padding: "7px 9px", fontSize: 13 })}>🌐</button>)}
          {props.onHelp && (<button onClick={props.onHelp} aria-label="How to play" style={button("ghost", { padding: "7px 10px", fontSize: 13 })}>?</button>)}
        </div>
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
              </div>
            );
          })}
        </div>
      )}
      {props.sub && (<div style={Object.assign(label(C.textSoft), { marginTop: 7 })}>{props.sub}</div>)}
    </div>
  );
}
