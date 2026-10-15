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

export var FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

/* Heavy italic display type, as on the VS / victory screens */
export function display(size, color) {
  return { fontSize: size, fontWeight: 900, fontStyle: "italic", letterSpacing: 0.5, color: color || C.text, lineHeight: 1.05 };
}

/* Small uppercase label */
export function label(color) {
  return { fontSize: 10, fontWeight: 900, letterSpacing: 1.6, textTransform: "uppercase", color: color || C.textMuted };
}

export function card(extra) {
  return Object.assign({ background: C.card, border: "2px solid " + C.line, borderRadius: 16, boxShadow: "0 3px 0 " + C.shadow, padding: 12 }, extra || {});
}

/* Chunky game button. kind: "gold" | "red" | "night" | "ghost" */
export function button(kind, extra) {
  var k = {
    gold: { background: "linear-gradient(180deg,#fde68a,#f59e0b)", color: C.ink, border: "2px solid " + C.ink, boxShadow: "0 4px 0 " + C.ink },
    red: { background: "linear-gradient(180deg,#f87171,#dc2626)", color: "#fff", border: "2px solid #7f1d1d", boxShadow: "0 4px 0 #7f1d1d" },
    night: { background: C.night, color: "#fff", border: "2px solid " + C.nightDeep, boxShadow: "0 4px 0 " + C.nightDeep },
    ghost: { background: C.card, color: C.ink, border: "2px solid " + C.lineStrong, boxShadow: "0 3px 0 " + C.shadow }
  }[kind || "gold"];
  return Object.assign({ fontFamily: FONT, fontWeight: 900, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", padding: "12px 18px", borderRadius: 12, cursor: "pointer", touchAction: "manipulation" }, k, extra || {});
}

/* Dark pill with a coloured dot (tier identity without putting text on the tier colour) */
export function pill(extra) {
  return Object.assign({ display: "inline-flex", alignItems: "center", gap: 6, background: C.night, color: "#fff", fontSize: 10, fontWeight: 900, letterSpacing: 1.4, textTransform: "uppercase", padding: "3px 10px", borderRadius: 20 }, extra || {});
}

export function money(m) {
  m = m || 0;
  return m >= 1000000 ? "$" + (m / 1000000).toFixed(1) + "M" : m >= 1000 ? "$" + Math.round(m / 1000) + "K" : "$" + m;
}
