/* ═══ BottomNav ═══ Thumb-reach tab bar for the hub */

import { createPortal } from "react-dom";
import { C, FONT, BODY } from "../ui/theme";
import Icon from "./Icons";

export var NAV_HEIGHT = 64;

var ITEMS = [
  { id: "home", icon: "home", label: "Home" },
  { id: "train", icon: "dumbbell", label: "Train" },
  { id: "season", icon: "calendar", label: "Season" },
  { id: "news", icon: "paper", label: "News" },
  { id: "rankings", icon: "trophy", label: "Ranks" },
  { id: "more", icon: "gear", label: "More" }
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
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: 30, width: 48, borderRadius: 15, background: on ? "linear-gradient(180deg,#fff3c4,#fde68a)" : "transparent", boxShadow: on ? "inset 0 -1px 0 rgba(146,64,14,0.18)" : "none", transform: on ? "translateY(-1px)" : "none", transition: "all 0.15s" }}><Icon name={it.icon} size={on ? 24 : 22} /></span>
              <span style={{ fontFamily: BODY, fontSize: 11, fontWeight: 800, color: on ? C.text : C.textMuted }}>{it.label}</span>
              {badge ? (<span style={{ position: "absolute", top: 6, right: "calc(50% - 26px)", minWidth: 16, height: 16, borderRadius: 8, background: C.red, color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: "16px", padding: "0 4px", boxSizing: "border-box", border: "1.5px solid #fff" }}>{badge}</span>) : null}
            </button>
          );
        })}
      </div>
    </nav>,
    document.body
  );
}
