/* ═══ ScoutSheet ═══ Everything about the opponent, in words — opened on demand, never in the way of the fight */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { C, FONT, display, label, card } from "../ui/theme";
import { Rider } from "./Rider";

/* scout: { name, emoji, palette, rank, talent, pts, h2h:{w,l}, stats:[{icon,label,what,you,foe}], diff:{label,col,what} } */
export function ScoutStatRow(props) {
  var s = props.s, gap = s.you - s.foe;
  var verdict = gap > 0 ? "+" + gap + " you" : gap < 0 ? (-gap) + " to her" : "even";
  var vcol = gap > 0 ? C.greenInk : gap < 0 ? C.redInk : C.textMuted;
  var max = Math.max(20, s.you, s.foe);
  return (
    <div style={{ padding: "7px 0", borderTop: props.first ? "none" : "1px dashed " + C.line }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{s.icon} {s.label}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: vcol, whiteSpace: "nowrap" }}>{verdict}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "34px 1fr 34px", alignItems: "center", gap: 6, marginTop: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 900, color: C.goldInk, textAlign: "right" }}>{s.you}</span>
        <div style={{ position: "relative", height: 8, borderRadius: 4, background: "#efe3c4", overflow: "hidden" }}>
          <div style={{ position: "absolute", right: "50%", top: 0, bottom: 0, width: (s.you / max * 50) + "%", background: C.gold }} />
          <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: (s.foe / max * 50) + "%", background: "#94a3b8" }} />
          <div style={{ position: "absolute", left: "calc(50% - 1px)", top: -2, bottom: -2, width: 2, background: C.ink }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 900, color: C.textSoft }}>{s.foe}</span>
      </div>
      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2, fontWeight: 600 }}>{s.what}</div>
    </div>
  );
}

export default function ScoutSheet(props) {
  var sc = props.scout;
  var h = sc.h2h || { w: 0, l: 0 };
  return createPortal(
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 950, background: "rgba(28,25,23,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: FONT }}>
      <motion.div onClick={function (e) { e.stopPropagation(); }}
        initial={{ y: 400 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{ width: "100%", maxWidth: 520, maxHeight: "88vh", overflowY: "auto", background: C.page, borderRadius: "20px 20px 0 0", border: "2px solid " + C.lineStrong, borderBottom: "none", padding: "10px 14px 22px", boxSizing: "border-box", textAlign: "left" }}>
        <div aria-hidden style={{ width: 44, height: 5, borderRadius: 3, background: C.lineStrong, margin: "0 auto 8px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={label(C.textSoft)}>Scouting report</span>
          <button onClick={props.onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 22, color: C.textSoft, cursor: "pointer", padding: 4 }}>✕</button>
        </div>

        <div style={card({ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", marginTop: 4 })}>
          <div style={{ flexShrink: 0, width: 80, height: 64, borderRadius: 12, background: "linear-gradient(180deg,#f1f5f9,#e2e8f0)", border: "1.5px solid " + C.line, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
            <Rider palette={sc.palette} width={78} flip={true} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={Object.assign(display(20), { whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" })}>{sc.emoji} {sc.name}</div>
            <div style={{ display: "flex", gap: 10, marginTop: 4, flexWrap: "wrap", fontSize: 13, color: C.textSoft, fontWeight: 700 }}>
              <span>World <b style={{ color: C.text }}>#{sc.rank}</b></span>
              <span>Talent <b style={{ color: C.text }}>{sc.talent}</b></span>
              <span><b style={{ color: C.text }}>{(sc.pts || 0).toLocaleString()}</b> pts</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, marginTop: 3, color: h.w + h.l === 0 ? C.textMuted : h.w >= h.l ? C.greenInk : C.redInk }}>
              {h.w + h.l === 0 ? "First meeting" : "Head-to-head: you " + h.w + " – " + h.l + " her"}
            </div>
          </div>
        </div>

        <div style={card({ padding: "8px 12px", marginTop: 10, background: C.cardWarm })}>
          {sc.standing && (<div style={{ fontSize: 13, fontWeight: 900, color: C.goldInk, marginBottom: 3 }}>{sc.standing.icon} {sc.standing.tag} of the tour{sc.titles ? " · " + sc.titles + " titles" : ""}</div>)}
          <div style={{ fontSize: 13, color: C.text, fontWeight: 700 }}>🐓 Rides <b>{sc.rooster}</b></div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 2, fontStyle: "italic" }}>“{sc.trait}”</div>
        </div>

        <div style={card({ padding: "6px 12px", marginTop: 10 })}>
          <div style={Object.assign(label(C.textSoft), { margin: "4px 0 2px" })}>Training — only the gap counts</div>
          {sc.stats.map(function (s, i) {
            var head = i === 0 || sc.stats[i - 1].who !== s.who;
            return (
              <div key={s.label}>
                {head && s.who && (<div style={{ fontSize: 12, fontWeight: 900, color: C.text, margin: i ? "8px 0 0" : "2px 0 0" }}>{s.who === "granny" ? "👵 Granny" : s.who === "fitness" ? "💪 Fitness today" : s.who === "crowd" ? "📣 The stands" : "🐓 Rooster"}</div>)}
                <ScoutStatRow s={s} first={head} />
              </div>
            );
          })}
        </div>

        <div style={card({ padding: "10px 12px", marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 })}>
          <div>
            <div style={label(C.textSoft)}>Match difficulty</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2, fontWeight: 600 }}>{sc.diff.what}</div>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: sc.diff.col, whiteSpace: "nowrap" }}>{sc.diff.label}</span>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
