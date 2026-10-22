/* ═══ Defending ═══ The points you're defending this week (won at this week last season, they drop off once it's
   played), and how much is still to defend over the rest of the season. Shown on Home and on the Season tab. */

import { C } from "../ui/theme";

export function defendLeft(S) {
  var d = (S.player && S.player.def) || [], left = 0, weeks = 0;
  for (var i = S.calIdx || 0; i < d.length; i++) if (d[i] > 0) { left += d[i]; weeks++; }
  return { pts: left, weeks: weeks };
}

export default function DefendBox(props) {
  var S = props.S, def = props.def || 0, rest = defendLeft(S);
  return (
    <div style={{ marginTop: props.mt == null ? 10 : props.mt, padding: "9px 11px", borderRadius: 12, textAlign: "left",
      background: def > 0 ? "#fff1f2" : "#f0fdf4", border: "1.5px solid " + (def > 0 ? "#fecdd3" : "#bbf7d0") }}>
      <div style={{ fontSize: 14.5, fontWeight: 900, color: def > 0 ? C.redInk : C.greenInk }}>
        🛡️ {def > 0 ? "Defending " + def.toLocaleString() + " pts this week" : "Nothing to defend this week"}
      </div>
      <div style={{ fontSize: 12.5, color: C.textSoft, marginTop: 3, lineHeight: 1.4, fontWeight: 700 }}>
        {def > 0
          ? (<span>You won {def.toLocaleString()} here last season. They drop off once this week is played: win <b style={{ color: C.text }}>more than {def.toLocaleString()}</b> and you climb, less and you slip.</span>)
          : "Every point you win this week is a gain."}
      </div>
      {rest.pts > 0 && (
        <div style={{ fontSize: 12, color: C.textMuted, marginTop: 5, fontWeight: 800 }}>
          Still to defend this season: <span style={{ color: C.text }}>{rest.pts.toLocaleString()} pts</span> over {rest.weeks} {rest.weeks === 1 ? "week" : "weeks"}
        </div>
      )}
    </div>
  );
}
