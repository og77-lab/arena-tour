/* ═══ UI Theme ═══ Shared design tokens for the screens around the match.
   Same warm "coop arena" language as the joust: cream ground, gold, brown ink outlines, chunky 3D buttons.
   Text/background pairs below were chosen to clear WCAG AA (≥4.5:1) on cream and white. */

export var C = {
  page: "#fff8e7",        /* warm cream page */
  card: "#ffffff",
  cardWarm: "#fffbeb",
  line: "#f1dfb4",        /* card borders */
  lineStrong: "#e2c88e",
  shadow: "#e7d3a8",      /* chunky bottom shadow under cards/buttons */
  ink: "#3f2a1d",         /* outline brown, same as the riders */
  text: "#1c1917",
  textSoft: "#57534e",    /* 7.4:1 on cream */
  textMuted: "#6f655c",   /* 5.3:1 on cream */
  gold: "#f59e0b",
  goldSoft: "#fde68a",
  goldInk: "#92400e",     /* gold text on light: 6.4:1 */
  red: "#dc2626",
  redInk: "#b91c1c",
  green: "#16a34a",
  greenInk: "#15803d",    /* 4.9:1 on cream */
  night: "#1e293b",       /* dark pills/badges */
  nightDeep: "#0f172a"
};

export var FONT = "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
var DISPLAY_FONT = "'Fredoka', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/* Display type: rounded and friendly (Fredoka) */
export function display(size, color) {
  return { fontFamily: DISPLAY_FONT, fontSize: size, fontWeight: 700, letterSpacing: 0.2, color: color || C.text, lineHeight: 1.05 };
}

/* Small label: calm sentence case, not shouting capitals */
export function label(color) {
  return { fontSize: 12, fontWeight: 800, letterSpacing: 0.3, color: color || C.textMuted };
}

/* Cards: white, soft layered shadow, a hairline edge (no thick outline) */
export function card(extra) {
  return Object.assign({ background: C.card, border: "1px solid rgba(63,42,29,0.07)", borderRadius: 18, boxShadow: "0 1px 2px rgba(63,42,29,0.07), 0 6px 18px rgba(63,42,29,0.09)", padding: 12 }, extra || {});
}

/* Chunky game button. kind: "gold" | "red" | "night" | "ghost" */
export function button(kind, extra) {
  var k = {
    gold: { background: "linear-gradient(180deg,#ffd75e 0%,#f5a311 100%)", color: C.ink, border: "none", boxShadow: "0 2px 0 #c97a06, 0 8px 18px rgba(245,158,11,0.3)" },
    red: { background: "linear-gradient(180deg,#fb7185,#e11d48)", color: "#fff", border: "none", boxShadow: "0 2px 0 #9f1239, 0 8px 18px rgba(225,29,72,0.28)" },
    night: { background: "linear-gradient(180deg,#334155,#1e293b)", color: "#fff", border: "none", boxShadow: "0 2px 0 #0f172a, 0 8px 18px rgba(15,23,42,0.25)" },
    ghost: { background: C.card, color: C.ink, border: "1px solid rgba(63,42,29,0.12)", boxShadow: "0 1px 2px rgba(63,42,29,0.07), 0 4px 12px rgba(63,42,29,0.07)" }
  }[kind || "gold"];
  return Object.assign({ fontFamily: DISPLAY_FONT, fontWeight: 600, fontSize: 16, letterSpacing: 0.3, padding: "12px 18px", borderRadius: 14, cursor: "pointer", touchAction: "manipulation" }, k, extra || {});
}

/* Dark pill with a coloured dot (tier identity without putting text on the tier colour) */
export function pill(extra) {
  return Object.assign({ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(28,25,23,0.86)", color: "#fff", fontSize: 12, fontWeight: 800, letterSpacing: 0.2, padding: "4px 11px", borderRadius: 999 }, extra || {});
}

export function money(m) {
  m = m || 0;
  return m >= 1000000 ? "$" + (m / 1000000).toFixed(1) + "M" : m >= 1000 ? "$" + Math.round(m / 1000) + "K" : "$" + m;
}

/* ── v2: the cleaner look (Home first) ── rounded display type, soft depth instead of thick outlines, calm labels.
   Same warm palette and ink; the riders and the jokes stay exactly as they are. */
export var BODY = "'Nunito', " + FONT;
export var HEAD = "'Fredoka', 'Nunito', " + FONT;
export var SHADOW = "0 1px 2px rgba(63,42,29,0.07), 0 6px 18px rgba(63,42,29,0.09)";
export function card2(extra) {
  return Object.assign({ background: "#ffffff", borderRadius: 18, boxShadow: SHADOW, border: "1px solid rgba(63,42,29,0.06)", padding: 14, fontFamily: BODY }, extra || {});
}
export function title2(size, color) { return { fontFamily: HEAD, fontWeight: 600, fontSize: size, color: color || C.text, lineHeight: 1.1, letterSpacing: 0.2 }; }
export function cap2(color) { return { fontFamily: BODY, fontSize: 12, fontWeight: 800, color: color || C.textMuted, letterSpacing: 0.2 }; }
export function button2(kind, extra) {
  var k = {
    gold: { background: "linear-gradient(180deg,#ffd75e 0%,#f5a311 100%)", color: C.ink, boxShadow: "0 2px 0 #c97a06, 0 8px 18px rgba(245,158,11,0.32)" },
    ghost: { background: "#ffffff", color: C.ink, boxShadow: SHADOW, border: "1px solid rgba(63,42,29,0.10)" },
    red: { background: "linear-gradient(180deg,#fb7185,#e11d48)", color: "#fff", boxShadow: "0 2px 0 #9f1239, 0 8px 18px rgba(225,29,72,0.3)" }
  }[kind || "gold"];
  return Object.assign({ fontFamily: HEAD, fontWeight: 600, fontSize: 17, letterSpacing: 0.3, padding: "13px 18px", borderRadius: 14, border: "none", cursor: "pointer", touchAction: "manipulation" }, k, extra || {});
}
