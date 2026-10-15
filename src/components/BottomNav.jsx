/* ═══ BottomNav ═══ Thumb-reach tab bar for the hub */

import { createPortal } from "react-dom";
import { C, FONT } from "../ui/theme";

export var NAV_HEIGHT = 64;

var ITEMS = [
  { id: "home", icon: "🏠", label: "Home" },
  { id: "train", icon: "🏋️", label: "Train" },
  { id: "season", icon: "📅", label: "Season" },
  { id: "news", icon: "📰", label: "News" },
  { id: "rankings", icon: "🏆", label: "Ranks" },
  { id: "more", icon: "⚙️", label: "More" }
];

export default function BottomNav(props) {
  return createPortal(
    <nav aria-label="Main" style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 800, display: "flex", justifyContent: "center", pointerEvents: "none", fontFamily: FONT }}>
      <div style={{ pointerEvents: "auto", width: "100%", maxWidth: 520, height: NAV_HEIGHT, paddingBottom: "env(safe-area-inset-bottom)", background: C.card, borderTop: "2px solid " + C.lineStrong, borderRadius: "18px 18px 0 0", boxShadow: "0 -4px 16px rgba(63,42,29,0.10)", display: "flex", alignItems: "stretch", boxSizing: "content-box" }}>
        {ITEMS.map(function (it) {
          var on = props.tab === it.id;
          var badge = props.badges && props.badges[it.id];
          return (
            <button key={it.id} onClick={function () { props.onTab(it.id); }} aria-current={on ? "page" : undefined}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, fontFamily: FONT, padding: 0, position: "relative" }}>
              <span style={{ fontSize: 20, lineHeight: "26px", width: 44, borderRadius: 14, background: on ? C.goldSoft : "transparent", border: on ? "2px solid " + C.ink : "2px solid transparent", transition: "background 0.15s" }}>{it.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 900, letterSpacing: 0.6, color: on ? C.text : C.textMuted, textTransform: "uppercase" }}>{it.label}</span>
              {badge ? (<span style={{ position: "absolute", top: 6, right: "calc(50% - 26px)", minWidth: 16, height: 16, borderRadius: 8, background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: "16px", padding: "0 4px", boxSizing: "border-box", border: "1.5px solid #fff" }}>{badge}</span>) : null}
            </button>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}
