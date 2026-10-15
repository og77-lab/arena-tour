/* ═══ TierSheet ═══ Bottom sheet for choosing this week's tournament tier */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { TIERS } from "../models/constants";
import { C, FONT, display, label, card, money } from "../ui/theme";

export default function TierSheet(props) {
  var avail = props.available || [];
  var best = avail.length ? Math.max.apply(null, avail) : -1;
  return createPortal(
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(28,25,23,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: FONT }}>
      <motion.div onClick={function (e) { e.stopPropagation(); }}
        initial={{ y: 400 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{ width: "100%", maxWidth: 520, maxHeight: "86vh", overflowY: "auto", background: C.page, borderRadius: "20px 20px 0 0", border: "2px solid " + C.lineStrong, borderBottom: "none", padding: "10px 14px 22px", boxSizing: "border-box" }}>
        <div aria-hidden style={{ width: 44, height: 5, borderRadius: 3, background: C.lineStrong, margin: "0 auto 10px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={display(22)}>Choose your tournament</span>
          <button onClick={props.onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 22, color: C.textSoft, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, color: C.textSoft, margin: "2px 0 12px" }}>You're <b style={{ color: C.goldInk }}>#{props.rank}</b>. Tiers open up as your ranking climbs.</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[4, 3, 2, 1, 0].filter(function (ti) { return avail.indexOf(ti) >= 0; }).concat([4, 3, 2, 1, 0].filter(function (ti) { return avail.indexOf(ti) < 0; })).map(function (ti) {
            var t = TIERS[ti], ok = avail.indexOf(ti) >= 0;
            var top = t.pts[t.pts.length - 1], prize = t.money[t.money.length - 1];
            return (
              <button key={ti} disabled={!ok} onClick={function () { if (ok) props.onPick(ti); }}
                style={Object.assign(card({ padding: "10px 12px", borderColor: ok ? t.col : C.line, boxShadow: ok ? "0 3px 0 " + t.col : "none", opacity: ok ? 1 : 0.55 }), { display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%", cursor: ok ? "pointer" : "default", fontFamily: FONT, background: ok ? C.card : C.cardWarm })}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: t.col, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0, border: "2px solid " + C.ink, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>{t.short}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{t.name}</span>
                    {ok && ti === best && (<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#fff", background: C.greenInk, padding: "2px 6px", borderRadius: 10 }}>BEST FOR YOU</span>)}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                    Best of {t.bo || 3} sets · {t.size} riders · ranks {t.rankRange[0]}–{t.rankRange[1] > 1000 ? "1000" : t.rankRange[1]}
                  </div>
                  {!ok && (<div style={{ fontSize: 11, fontWeight: 800, color: C.redInk, marginTop: 2 }}>🔒 Not open at #{props.rank}</div>)}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={label()}>Champion</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.goldInk }}>{top.toLocaleString()} pts</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.greenInk }}>{money(prize)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
