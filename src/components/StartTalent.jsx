/* ═══ StartTalent ═══ Your granny's starting talent: points to spread over the six stats before you ride (10 for a new
   granny, and once for older saves). Any split is allowed — all in one stat is fine. Levels add to what you have. */

import { useState } from "react";
import Icon, { StatIcon } from "./Icons";
import { createPortal } from "react-dom";
import { STATS } from "../models/constants";
import { C, FONT, display, label, card, button } from "../ui/theme";

export default function StartTalent(props) {
  var total = props.points || 10, have = props.tr || {};
  var _a = useState({}), add = _a[0], setAdd = _a[1];
  var used = Object.keys(add).reduce(function (s, k) { return s + add[k]; }, 0), left = total - used;
  function bump(k, d) {
    setAdd(function (cur) {
      var spent = Object.keys(cur).reduce(function (t, x) { return t + cur[x]; }, 0);
      if (d > 0 && spent >= total) return cur;
      var n = Object.assign({}, cur); n[k] = Math.max(0, (n[k] || 0) + d); if (!n[k]) delete n[k]; return n;
    });
  }
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 5000, background: "rgba(30,20,10,0.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: FONT }}>
      <div style={card({ width: "100%", maxWidth: 440, maxHeight: "calc(92dvh / var(--z, 1))", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: "14px 14px 18px" })}>
        <div style={label("#b45309")}>Starting talent</div>
        <div style={Object.assign(display(24), { marginTop: 2 })}>Spread {total} points</div>
        <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>Each point is one training level. Put them anywhere — even all in one stat. Your bar is built from your own levels; hers from hers.</div>
        <div style={{ fontSize: 15, fontWeight: 900, marginTop: 8, color: left ? C.goldInk : C.greenInk }}>{left ? left + " left to spread" : "All spread ✓"}</div>
        {STATS.map(function (s) {
          var lv = (have[s.k] || 0) + (add[s.k] || 0);
          return (
            <div key={s.k} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderTop: "1px dashed " + C.line }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900 }}><StatIcon k={s.k} size={18} style={{ verticalAlign: "-3px", marginRight: 4 }} />{s.label} <span style={{ fontSize: 12, color: C.goldInk }}>({s.el})</span></div>
                <div style={{ fontSize: 11.5, color: C.textMuted }}>{s.who === "granny" ? "👵" : s.who === "rooster" ? "🐓" : "🔋"} Each level: {s.per}</div>
              </div>
              <button onClick={function () { bump(s.k, -1); }} disabled={!add[s.k]} style={button("ghost", { padding: "4px 10px", fontSize: 16, opacity: add[s.k] ? 1 : 0.4 })}>−</button>
              <div style={{ width: 34, textAlign: "center", fontSize: 16, fontWeight: 900 }}>{lv}{add[s.k] ? (<div style={{ fontSize: 10, color: C.greenInk }}>+{add[s.k]}</div>) : null}</div>
              <button onClick={function () { bump(s.k, 1); }} disabled={!left} style={button("gold", { padding: "4px 10px", fontSize: 16, opacity: left ? 1 : 0.4 })}>+</button>
            </div>
          );
        })}
        <button onClick={function () { if (!left) props.onDone(add); }} disabled={!!left} style={button(left ? "ghost" : "gold", { width: "100%", marginTop: 10, fontSize: 16, padding: "12px", opacity: left ? 0.6 : 1 })}>{left ? "Spread all " + total + " points" : "Lock it in"}</button>
      </div>
    </div>, document.body);
}
