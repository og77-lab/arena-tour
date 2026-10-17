/* ═══ Effect ═══ One visual language for everything that changes a match. Every effect in the game — lanes, gear,
   tiredness, training — boils down to a handful of match elements, and each gets the same little chip with a
   miniature of the strike bar showing exactly what changes:

     zone   the gold zone gets wider / narrower
     speed  the marker starts faster / slower (a faint ghost marker runs at normal speed beside it)
     accel  the marker speeds up more / less after each strike
     gold   points added when you land in the gold
     miss   points added when you land outside it
     aim    points added to every strike
     stat   a stat gap counts more or less
     pts / money / fit   ranking points, prize money, fitness */

import { C, FONT } from "../ui/theme";
import { REDUCED_MOTION } from "./fx";

var STAT_ICON = { r: "⚡", p: "🐾", f: "🎯", s: "🫀", g: "🛡️", b: "🔋", all: "📊" };
var STAT_NAME = { r: "Reflexes", p: "Steady Stride", f: "Aim", s: "Stamina", g: "Stubbornness", b: "Bounce-back" };
/* Every stat is one element of the match — shown together so nobody has to remember which is which */
export var STAT_ELEMENT = { r: { k: "speed", v: 0.85, what: "bar speed" }, p: { k: "zone", v: 2, what: "gold zone" }, f: { k: "aim", v: 2, what: "every strike" }, g: { k: "miss", v: 2, what: "misses" }, s: { k: "accel", v: 0.7, what: "speed-up" }, b: { k: "fit", v: 1, what: "recovery" } };
export function statLabel(s) { var el = STAT_ELEMENT[s]; return STAT_NAME[s] + (el ? " (" + el.what + ")" : ""); }
function statShift(k, extra) {
  if (Math.abs(extra) < 0.05) return null;
  if (k === "r") { var sp = Math.round(Math.abs(extra) * 4.3); if (!sp) return null; return { k: "speed", v: extra > 0 ? 0.85 : 1.2, good: extra > 0, text: "bar " + sp + "% " + (extra > 0 ? "slower" : "faster") + " for you" }; }
  if (k === "p") { var z = Math.round(extra * 1.2 * 10) / 10; return { k: "zone", v: z, good: z > 0, text: "gold zone " + (z > 0 ? "+" : "−") + Math.abs(z) + "% for you" }; }
  if (k === "f") { var a = Math.round(extra * 1.5 * 10) / 10; return { k: "aim", v: a, good: a > 0, text: (a > 0 ? "+" : "−") + Math.abs(a) + " every strike for you" }; }
  if (k === "g") { var f = Math.round(extra * 1.5 * 10) / 10; return { k: "miss", v: f, good: f > 0, text: "worst miss " + (f > 0 ? "+" : "−") + Math.abs(f) + " for you" }; }
  if (k === "s") { var ac = Math.round(Math.abs(extra) * 5); if (!ac) return null; return { k: "accel", v: extra > 0 ? 0.7 : 1.3, good: extra > 0, text: "speed-up " + ac + "% " + (extra > 0 ? "less" : "more") + " for you" }; }
  return null;
}
function gapText(g) { var r = Math.round(g * 10) / 10; return r === 0 ? "you're level" : r > 0 ? "you lead by " + r : "you trail by " + Math.abs(r); }

function pct(m) { return Math.round(Math.abs(m - 1) * 100); }
function sg(v) { return v > 0 ? "+" : "−"; }
function n1(v) { var a = Math.abs(v); return a % 1 ? a.toFixed(1) : String(a); }

/* Turn any effect object into chips. fx keys: zone, speed, accel, gold, miss, aim, floor, w {r,p,…}, pts, money.
   gaps (optional): your stat gaps to the field you'll face — then a weighted stat is green if it helps YOU, red if it hurts */
export function effectsOf(fx, gaps) {
  var out = []; if (!fx) return out;
  if (fx.zone) out.push({ k: "zone", v: fx.zone, good: fx.zone > 0, text: "Gold zone " + sg(fx.zone) + n1(fx.zone) + "%" });
  if (fx.speed && fx.speed !== 1) out.push({ k: "speed", v: fx.speed, good: fx.speed < 1, text: "Bar " + pct(fx.speed) + "% " + (fx.speed < 1 ? "slower" : "faster") });
  if (fx.accel && fx.accel !== 1) out.push({ k: "accel", v: fx.accel, good: fx.accel < 1, text: "Speed-up " + sg(fx.accel - 1) + pct(fx.accel) + "%" });
  if (fx.gold) out.push({ k: "gold", v: fx.gold, good: fx.gold > 0, text: sg(fx.gold) + n1(fx.gold) + " on gold hits" });
  if (fx.miss) out.push({ k: "miss", v: fx.miss, good: fx.miss > 0, text: sg(fx.miss) + n1(fx.miss) + " on misses" });
  if (fx.floor) out.push({ k: "miss", v: fx.floor, good: fx.floor > 0, text: sg(fx.floor) + n1(fx.floor) + " worst miss" });
  if (fx.aim) out.push({ k: "aim", v: fx.aim, good: fx.aim > 0, text: sg(fx.aim) + n1(fx.aim) + " every strike" });
  if (fx.w) { var ks = Object.keys(fx.w).filter(function (k) { return fx.w[k] !== 1; });
    var allSame = ks.length >= 3 && ks.every(function (k) { return fx.w[k] === fx.w[ks[0]]; });
    if (!gaps) {
      /* No player to compare with (the guide): say it plainly */
      if (allSame) out.push({ k: "stat", s: "all", v: fx.w[ks[0]], good: null, text: "Every stat gap counts " + (fx.w[ks[0]] === 0.5 ? "half" : "×" + fx.w[ks[0]]) });
      else ks.forEach(function (k) { out.push({ k: "stat", s: k, v: fx.w[k], good: null, text: STAT_NAME[k] + " gap counts " + (fx.w[k] === 2 ? "double" : fx.w[k] === 0.5 ? "half" : "×" + fx.w[k]) + " (" + STAT_ELEMENT[k].what + ")" }); });
    } else {
      /* With your gaps: what the weighting adds to (or takes from) YOUR bar, in the bar's own terms */
      ks.forEach(function (k) {
        var g = gaps[k] || 0; if (allSame && Math.abs(g) < 0.3) return;
        var extra = g * (fx.w[k] - 1), el = statShift(k, extra);
        var head = STAT_NAME[k] + " " + (fx.w[k] === 0.5 ? "halved" : "×" + fx.w[k]) + " · " + gapText(g) + " → ";
        if (!el) { out.push({ k: "stat", s: k, v: fx.w[k], good: null, text: head + "no change for you" }); return; }
        out.push({ k: el.k, v: el.v, icon: STAT_ICON[k], good: el.good, text: head + el.text });
      });
    }
  }
  if (fx.pts && fx.pts !== 1) out.push({ k: "pts", v: fx.pts, good: fx.pts > 1, text: "Points " + sg(fx.pts - 1) + pct(fx.pts) + "%" });
  if (fx.money && fx.money !== 1) out.push({ k: "money", v: fx.money, good: fx.money > 1, text: "Prize " + sg(fx.money - 1) + pct(fx.money) + "%" });
  if (fx.fit) out.push({ k: "fit", v: fx.fit, good: fx.fit > 0, text: sg(fx.fit) + n1(fx.fit) + "% fitness back" });
  return out;
}

/* The miniature strike bar: 54×12, gold zone in the middle, a marker sweeping across */
export function MiniBar(props) {
  var k = props.k, v = props.v, W = 54;
  var zone = 12, zoneNew = k === "zone" ? Math.max(4, zone + v * 2.2) : zone;
  var dur = 1.5, durNew = k === "speed" ? dur / v : dur;
  var mark = function (pos, col, extra) { return (<div style={Object.assign({ position: "absolute", top: 1, width: 3, height: 10, borderRadius: 1.5, background: col, left: pos }, extra || {})} />); };
  var sweep = function (d, ease, ghost) {
    if (REDUCED_MOTION) return mark(ghost ? "30%" : "62%", ghost ? "rgba(255,255,255,0.35)" : "#38bdf8");
    return mark("2%", ghost ? "rgba(255,255,255,0.35)" : "#38bdf8", { animation: (ease === "accel" ? "miniAccel " : "miniSweep ") + d + "s " + (ease === "accel" ? "ease-in" : "ease-in-out") + " infinite" + (ease === "accel" ? "" : " alternate") });
  };
  return (
    <div aria-hidden style={{ position: "relative", width: W, height: 12, borderRadius: 6, background: "#1e293b", border: "1.5px solid " + C.ink, flexShrink: 0, overflow: "hidden" }}>
      {k === "zone" && (<div style={{ position: "absolute", top: 1, bottom: 1, left: "calc(50% - " + zone / 2 + "px)", width: zone, border: "1px dashed rgba(253,224,71,0.7)", borderRadius: 2, boxSizing: "border-box" }} />)}
      <div style={{ position: "absolute", top: 2, bottom: 2, left: "calc(50% - " + zoneNew / 2 + "px)", width: zoneNew, background: "#facc15", borderRadius: 2, opacity: k === "miss" ? 0.45 : 1 }} />
      {k === "speed" && sweep(dur, "", true)}
      {k === "speed" && sweep(durNew, "")}
      {k === "accel" && sweep(v > 1 ? 1.1 : 1.9, "accel")}
      {k === "zone" && sweep(dur, "")}
      {k === "gold" && mark("calc(50% - 1.5px)", "#38bdf8")}
      {k === "miss" && mark("14%", "#38bdf8")}
      {k === "aim" && (<span>{mark("calc(50% - 1.5px)", "#38bdf8")}{mark("14%", "#38bdf8")}</span>)}
    </div>
  );
}

function Badge(props) {
  return (<span aria-hidden style={{ minWidth: 30, padding: "0 3px", boxSizing: "border-box", height: 14, borderRadius: 7, background: "#1e293b", border: "1.5px solid " + C.ink, color: "#fde68a", fontSize: 9, fontWeight: 900, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 1, flexShrink: 0 }}>{props.children}</span>);
}

/* One chip: the miniature, then the change in plain numbers. good=true green, false red, null neutral */
export function EffectChip(props) {
  var e = props.e, col = e.good === true ? C.greenInk : e.good === false ? C.redInk : C.text;
  var el = e.k === "stat" && STAT_ELEMENT[e.s];
  var vis = e.icon ? (<span style={{ position: "relative", display: "inline-flex" }}><MiniBar k={e.k} v={e.v} /><span style={{ position: "absolute", left: -4, top: -6, fontSize: 10 }}>{e.icon}</span></span>) : e.k === "stat" ? (el && el.k !== "fit" ? (<span style={{ position: "relative", display: "inline-flex" }}><MiniBar k={el.k} v={el.v} /><span style={{ position: "absolute", left: -4, top: -6, fontSize: 10 }}>{STAT_ICON[e.s]}</span></span>) : (<Badge>{STAT_ICON[e.s]}×{e.v}</Badge>)) : e.k === "pts" ? (<Badge>🏆</Badge>) : e.k === "money" ? (<Badge>💰</Badge>) : e.k === "fit" ? (<Badge>🔋</Badge>) : (<MiniBar k={e.k} v={e.v} />);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, maxWidth: "100%", boxSizing: "border-box", padding: "3px 7px 3px 4px", borderRadius: 9, background: e.good === true ? "#f0fdf4" : e.good === false ? "#fef2f2" : "#f8fafc", border: "1.5px solid " + (e.good === true ? "#bbf7d0" : e.good === false ? "#fecaca" : C.line), fontFamily: FONT }}>
      {vis}
      <span style={{ fontSize: 11.5, fontWeight: 900, color: col, whiteSpace: e.text.length > 26 ? "normal" : "nowrap", lineHeight: 1.2 }}>{e.text}</span>
    </span>
  );
}

export function EffectList(props) {
  var list = props.list || [];
  if (!list.length) return props.empty ? (<div style={{ fontSize: 11.5, fontWeight: 800, color: C.textMuted }}>{props.empty}</div>) : null;
  return (<div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{list.map(function (e, i) { return (<EffectChip key={i} e={e} />); })}</div>);
}

/* What each element means on the lanes — the reference card, opened from "What do these mean?" */
var LEGEND = [
  { e: { k: "zone", v: 2, good: true, text: "Gold zone" }, what: "The yellow strip. Stop the marker inside it for 85–100 points." },
  { e: { k: "speed", v: 1.3, good: false, text: "Bar speed" }, what: "How fast the marker sweeps when a set starts. Faster is harder to stop in the gold." },
  { e: { k: "accel", v: 1.4, good: false, text: "Speed-up" }, what: "How much faster it gets after every strike in a set." },
  { e: { k: "gold", v: 3, good: true, text: "On gold hits" }, what: "Points added only when you land in the gold." },
  { e: { k: "miss", v: 3, good: true, text: "On misses" }, what: "Points added only when you land outside the gold (70 and below)." },
  { e: { k: "aim", v: 2, good: true, text: "Every strike" }, what: "Points added to every strike, hit or miss." },
  { e: { k: "stat", s: "r", v: 2, good: true, text: "Reflexes ×2 · you lead by 2 → bar 9% slower for you" }, what: "The lanes make that stat's gap count double (or half on the village green). The chip shows what that does to YOUR bar against this field: green helps you, red hurts." }
];
export function Legend() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 8px", alignItems: "center", padding: "8px 10px", background: "#f8fafc", border: "1.5px solid " + C.line, borderRadius: 12, marginBottom: 8 }}>
      {LEGEND.map(function (x, i) {
        return [<EffectChip key={"c" + i} e={x.e} />, <span key={"t" + i} style={{ fontSize: 11.5, color: C.textSoft, lineHeight: 1.3 }}>{x.what}</span>];
      })}
    </div>
  );
}

/* What one level of each stat does, as a chip (the gap to your opponent, except Bounce-back) */
var STAT_FX = { r: { speed: 0.96 }, f: { aim: 1.5 }, g: { floor: 1.5 }, s: { accel: 0.95 }, p: { zone: 1.2 }, b: { fit: 0.7 } };
export function statEffect(k) { return effectsOf(STAT_FX[k] || {}); }
