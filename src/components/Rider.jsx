/* ═══ Rider ═══ Jousting granny on a rooster (SVG, faces right; flip for the opponent).
   Every granny has a stable look (hair, glasses, headgear, accessory, rooster colours) derived from her id. */

import * as React from "react";
import { motion } from "framer-motion";
import { REDUCED_MOTION } from "./fx";

const { useRef, useId } = React;

var INK = "#3f2a1d";

/* The player's granny matches the game icon: floral bike helmet, round glasses, knit cardigan + pauldron, rainbow rooster */
export var PLAYER_PALETTE = {
  dress: "#c4a27c", shawl: "#7c5c3b", plume: "#facc15",
  chicken: { body: "#0e7490", neck: "#f97316", wing: "#ea580c", tail: "#1e3a8a" },
  look: { skin: "#f6d5bd", hair: "#f5f5f4", hairStyle: "bun", glasses: "round", brows: "fierce", hat: "floral", hatColor: "#14b8a6", acc: "pauldron", knit: true }
};

var DRESSES = ["#be123c", "#15803d", "#7c3aed", "#0e7490", "#c2410c", "#4d7c0f", "#9d174d", "#334155", "#b45309", "#1d4ed8"];
var SHAWLS = ["#fda4af", "#86efac", "#c4b5fd", "#67e8f9", "#fdba74", "#fef08a", "#f9a8d4", "#cbd5e1"];
var PLUMES = ["#ef4444", "#22c55e", "#a855f7", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#94a3b8"];
var CHICKENS = [
  { body: "#fffbeb", wing: "#e7e5e4", tail: "#a8a29e" },
  { body: "#c2410c", wing: "#9a3412", tail: "#431407" },
  { body: "#a8a29e", wing: "#78716c", tail: "#292524" },
  { body: "#fcd34d", wing: "#f59e0b", tail: "#b45309" },
  { body: "#57534e", wing: "#44403c", tail: "#0c0a09" },
  { body: "#1e3a8a", neck: "#dc2626", wing: "#b91c1c", tail: "#0f172a" },
  { body: "#166534", neck: "#facc15", wing: "#ca8a04", tail: "#14532d" }
];
var SKINS = ["#f6d5bd", "#f3cfb3", "#eac0a0", "#d9a07b", "#b97a56", "#8d5a3b"];
var HAIRS = ["#f5f5f4", "#e7e5e4", "#d6d3d1", "#c4b5fd", "#93c5fd", "#f9a8d4", "#b45309", "#9ca3af"];
var HAIR_STYLES = ["bun", "curls", "braid", "bob"];
var GLASSES = ["round", "cat", "square", "none", "round", "monocle"];
var BROWS = ["fierce", "sweet", "surprised"];
var HATS = ["colander", "floral", "pot", "beanie", "colander", "beanie"];
var HAT_COLORS = ["#14b8a6", "#f472b6", "#a78bfa", "#fb923c", "#60a5fa", "#facc15", "#4ade80"];
var ACCS = ["none", "pearls", "scarf", "earrings", "flower", "pearls"];

function hashOf(id, salt) { var x = Math.imul((id || 7) * 31 + salt * 97, 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; return (x ^ (x >>> 13)) >>> 0; }
function pick(arr, id, salt) { return arr[hashOf(id, salt) % arr.length]; }

/* Stable look per NPC; legends (top 10) ride in golden helmets, the world #1 wears the crown */
export function paletteFor(id, rank) {
  var c = hashOf(id, 1) % DRESSES.length;
  var look = {
    skin: pick(SKINS, id, 2), hair: pick(HAIRS, id, 3), hairStyle: pick(HAIR_STYLES, id, 4), glasses: pick(GLASSES, id, 5),
    brows: pick(BROWS, id, 6), hat: pick(HATS, id, 7), hatColor: pick(HAT_COLORS, id, 8), acc: pick(ACCS, id, 9)
  };
  if (rank && rank <= 10) { look.hat = "golden"; look.crown = rank === 1; }
  return { dress: DRESSES[c], shawl: SHAWLS[(c + 3) % SHAWLS.length], plume: PLUMES[c % PLUMES.length], chicken: pick(CHICKENS, id, 10), look: look };
}

var LANCE_ANGLE = { idle: -24, charge: 0, deflect: -38, knocked: -45, fallen: 30, cheer: -62 };
var GRANNY_POSE = { knocked: "rotate(-24deg)", fallen: "translate(-30px,34px) rotate(-96deg)", cheer: "translateY(-2px)" };

function svgT(origin, transform, transition) {
  return { transformBox: "view-box", transformOrigin: origin, transform: transform || "none", transition: transition || "transform 0.22s ease-out" };
}

function shade(hex, f) {
  var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  function m(v) { return Math.max(0, Math.min(255, Math.round(v * f))); }
  return "#" + ((1 << 24) + (m(r) << 16) + (m(g) << 8) + m(b)).toString(16).slice(1);
}

function HairBack(props) {
  var L = props.look, c = L.hair, s = { fill: c, stroke: INK, strokeWidth: 1.6 };
  if (L.hairStyle === "curls") return (<g {...s}><circle cx="46" cy="26" r="4.6" /><circle cx="47.5" cy="20.5" r="4.2" /><circle cx="52.5" cy="18.5" r="3.8" /><circle cx="45.5" cy="31.8" r="3.8" /></g>);
  if (L.hairStyle === "braid") return (<g {...s}><circle cx="47" cy="27" r="4.4" /><ellipse cx="46.5" cy="32" rx="2.8" ry="2.4" /><ellipse cx="45.6" cy="36.2" rx="2.5" ry="2.2" /><ellipse cx="44.9" cy="40" rx="2.2" ry="2" /><circle cx="44.6" cy="42.6" r="1.4" fill="#f472b6" /></g>);
  if (L.hairStyle === "bob") return (<path d="M45 22 Q50 16.5 60 19.5 L52 37.5 Q45 36.5 44.5 28 Z" {...s} />);
  return (<circle cx="47" cy="28" r="5" {...s} />);
}

function Glasses(props) {
  var g = props.look.glasses, lens = { fill: "rgba(224,242,254,0.32)", stroke: "#1f2937", strokeWidth: 1.4 };
  if (g === "none") return (<circle cx="60.5" cy="29.5" r="1.25" fill="#1f2937" />);
  if (g === "cat") return (<g><path d="M51 29 L56.6 29.3" stroke="#1f2937" strokeWidth="1.3" /><path d="M56.5 28 Q60 26.2 64.3 27.2 L63.2 31.6 Q59.6 33.2 57.1 31.1 Z" {...lens} /></g>);
  if (g === "square") return (<g><path d="M51 29 L57 29.5" stroke="#1f2937" strokeWidth="1.3" /><rect x="57" y="26.9" width="6.2" height="5.2" rx="1.2" {...lens} /></g>);
  if (g === "monocle") return (<g><circle cx="60.2" cy="29.6" r="3.5" fill="rgba(255,255,255,0.55)" stroke="#a16207" strokeWidth="1.5" /><path d="M58 32.6 Q56 38 57.5 42" fill="none" stroke="#a16207" strokeWidth="0.9" /></g>);
  return (<g><path d="M51 29 L57 29.5" stroke="#1f2937" strokeWidth="1.3" /><circle cx="60" cy="29.5" r="3.2" {...lens} /></g>);
}

function Brows(props) {
  var b = props.look.brows, s = { fill: "none", stroke: shade(props.look.hair === "#f5f5f4" ? "#9ca3af" : props.look.hair, 0.7), strokeWidth: 1.5, strokeLinecap: "round" };
  if (b === "sweet") return (<path d="M57 25.7 Q60 24.3 63 25.6" {...s} />);
  if (b === "surprised") return (<path d="M57.2 23.6 Q60 22.1 63 23.4" {...s} />);
  return (<path d="M57 24.6 L63.2 26.4" {...s} />);
}

function Mouth(props) {
  var b = props.look.brows;
  if (b === "sweet") return (<path d="M58.6 35.4 Q61.4 38.2 64 35.2" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />);
  if (b === "surprised") return (<ellipse cx="61.6" cy="36.2" rx="1.3" ry="1.5" fill={INK} />);
  return (<path d="M59 36.4 L63.8 35.7" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />);
}

function Hat(props) {
  var L = props.look, hc = L.hatColor || "#14b8a6", gone = props.gone;
  var style = { transformBox: "view-box", transformOrigin: "56px 22px", transform: gone ? "translate(-34px,-46px) rotate(-220deg)" : "none", opacity: gone ? 0 : 1, transition: gone ? "transform 0.6s ease-out, opacity 0.6s ease-in" : "transform 0.2s, opacity 0.2s" };
  var k = { stroke: INK, strokeWidth: 2, strokeLinejoin: "round" };
  var body;
  if (L.hat === "floral") {
    body = (<g>
      <path d="M45.5 28 Q46 14.5 56.5 14 Q67 14.5 67.5 28 Z" fill={hc} {...k} />
      <path d="M48.5 20.5 Q56.5 15.8 64.8 20.5" fill="none" stroke="#facc15" strokeWidth="1.7" />
      <path d="M47.2 24 Q56.5 18.8 66 24" fill="none" stroke="#f472b6" strokeWidth="1.7" />
      {[[51, 22.5, "#f472b6"], [60.5, 18.4, "#fb923c"], [63.4, 24.4, "#f9fafb"]].map(function (f, i) {
        return (<g key={i}><circle cx={f[0] - 1.2} cy={f[1]} r="1.25" fill={f[2]} /><circle cx={f[0] + 1.2} cy={f[1]} r="1.25" fill={f[2]} /><circle cx={f[0]} cy={f[1] - 1.2} r="1.25" fill={f[2]} /><circle cx={f[0]} cy={f[1] + 1.2} r="1.25" fill={f[2]} /><circle cx={f[0]} cy={f[1]} r="0.8" fill="#facc15" /></g>);
      })}
      <line x1="45" y1="28" x2="68" y2="28" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M50.5 28.5 L55.5 38.5" stroke="#1f2937" strokeWidth="1" />
    </g>);
  } else if (L.hat === "pot") {
    body = (<g>
      <path d="M46.5 27 L47.5 16.5 L64.5 16.5 L65.5 27 Z" fill="#94a3b8" {...k} />
      <line x1="47.2" y1="20.5" x2="64.8" y2="20.5" stroke="#64748b" strokeWidth="1.2" />
      <rect x="65" y="18.8" width="8" height="2.6" rx="1.2" fill="#475569" stroke={INK} strokeWidth="1.2" />
      <line x1="45.5" y1="27" x2="66.5" y2="27" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </g>);
  } else if (L.hat === "tophat") {
    body = (<g>
      <rect x="49" y="5" width="15" height="20" rx="1.5" fill="#1f2937" {...k} />
      <rect x="49" y="18.5" width="15" height="4" fill={hc} stroke={INK} strokeWidth="1.4" />
      <line x1="43.5" y1="26.5" x2="69.5" y2="26.5" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <line x1="44" y1="26.5" x2="69" y2="26.5" stroke="#374151" strokeWidth="1.6" strokeLinecap="round" />
    </g>);
  } else if (L.hat === "viking") {
    body = (<g>
      <path d="M47 18.5 Q41 14 40.5 6 Q45 11.5 49.5 15 Z" fill="#fef3c7" {...k} />
      <path d="M65 18.5 Q71 14 71.5 6 Q67 11.5 62.5 15 Z" fill="#fef3c7" {...k} />
      <path d="M46 27 Q56 11 66 27 Z" fill="#94a3b8" {...k} />
      <line x1="56" y1="14" x2="56" y2="27" stroke="#64748b" strokeWidth="1.6" />
      <line x1="45" y1="27" x2="67" y2="27" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </g>);
  } else if (L.hat === "beanie") {
    body = (<g>
      <path d="M45.5 28 Q46 15 56 14.5 Q66.5 15 67 28 Z" fill={hc} {...k} />
      {[49.5, 53.5, 57.5, 61.5, 65].map(function (x) { return (<line key={x} x1={x} y1="17.5" x2={x - 0.5} y2="25" stroke={INK} strokeWidth="0.8" opacity="0.3" />); })}
      <rect x="45" y="24.2" width="22.5" height="4.2" rx="2" fill={shade(hc, 0.75)} stroke={INK} strokeWidth="1.6" />
      <circle cx="56" cy="12.6" r="3.6" fill="#fff" stroke={INK} strokeWidth="1.6" />
    </g>);
  } else {
    var gold = L.hat === "golden";
    body = (<g>
      <path d="M56 15 Q50 4 40 6 Q48 10 54 17 Z" fill={gold ? "#ef4444" : props.plume} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M46 27 Q56 13 66 27 Z" fill={gold ? "#facc15" : "#cbd5e1"} {...k} />
      {gold && (<path d="M50 22 Q56 17 62 22" fill="none" stroke="#fef9c3" strokeWidth="1.6" strokeLinecap="round" />)}
      <line x1="45" y1="27" x2="67" y2="27" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
      {!gold && (<g><circle cx="51" cy="23" r="0.95" fill="#64748b" /><circle cx="56" cy="20.5" r="0.95" fill="#64748b" /><circle cx="61" cy="23" r="0.95" fill="#64748b" /><circle cx="56" cy="24.8" r="0.95" fill="#64748b" /><rect x="64" y="24.5" width="5" height="2.2" rx="1" fill="#94a3b8" stroke={INK} strokeWidth="1.2" /></g>)}
      {L.crown && (<path d="M50 15.5 L51.5 9.5 L54.2 13.2 L56.3 8.2 L58.4 13.2 L61 9.5 L62.4 15.5 Z" fill="#fde047" stroke={INK} strokeWidth="1.4" strokeLinejoin="round" />)}
    </g>);
  }
  return (<g style={style}>{body}{L.acc === "flower" && !gone && (<g><circle cx="66" cy="24" r="1.6" fill="#f472b6" /><circle cx="67.6" cy="25.4" r="1.6" fill="#f472b6" /><circle cx="66.4" cy="26.8" r="1.6" fill="#f472b6" /><circle cx="66.6" cy="25.4" r="0.9" fill="#facc15" /></g>)}</g>);
}

function Accessory(props) {
  var a = props.look.acc;
  if (a === "pearls") return (<g>{[[50, 44.6], [52.4, 45.6], [55, 46.2], [57.6, 46.2], [60.2, 45.6], [62.6, 44.6]].map(function (p, i) { return (<circle key={i} cx={p[0]} cy={p[1]} r="1.1" fill="#fff" stroke="#94a3b8" strokeWidth="0.5" />); })}</g>);
  if (a === "scarf") return (<g stroke={INK} strokeWidth="1.5" strokeLinejoin="round"><path d="M48 42 Q56 47 64 42 L64 45.5 Q56 50.5 48 45.5 Z" fill={props.scarf} /><path d="M48.5 44 Q41 46 36.5 52 L39.5 53.2 Q43.5 48.4 49.2 46.6 Z" fill={props.scarf} /></g>);
  if (a === "earrings") return (<circle cx="51.6" cy="34.6" r="1.5" fill="#facc15" stroke={INK} strokeWidth="0.8" />);
  if (a === "pauldron") return (<g><ellipse cx="61" cy="44.6" rx="5.6" ry="4" fill="#cbd5e1" stroke={INK} strokeWidth="1.6" /><circle cx="61" cy="44.4" r="0.8" fill="#64748b" /></g>);
  return null;
}

/* ── Kit: what the lance shaft and the saddle look like (no lance given = the classic striped lance) ── */
export function LanceShaft(props) {
  var id = props.id;
  var vamp = (<polygon points="70,50 78,55.5 71,62" fill="#e5e7eb" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />);
  var pennant = (<path d="M84 53.2 L99 49 L86 59 Z" fill={props.plume} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />);
  function shaft(w, col) { return (<g><line x1="44" y1="60" x2="122" y2="50" stroke={INK} strokeWidth={w + 2.6} strokeLinecap="round" /><line x1="44" y1="60" x2="122" y2="50" stroke={col} strokeWidth={w} strokeLinecap="round" /></g>); }
  if (id === "broom") return (
    <g>
      {/* straw head at the back end */}
      <path d="M45 56 L28 52 L26 66 L45 63 Z" fill="#facc15" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M30 55 L44 58 M29 59 L44 60 M29 63 L44 62" stroke="#a16207" strokeWidth="0.9" />
      <rect x="42" y="55.5" width="5" height="8" rx="1" fill="#dc2626" stroke={INK} strokeWidth="1.2" transform="rotate(-7 44.5 59.5)" />
      {shaft(3.2, "#b45309")}{vamp}{pennant}
    </g>);
  if (id === "needle") return (
    <g>
      {shaft(1.6, "#cbd5e1")}
      <circle cx="44" cy="60" r="7" fill="#ec4899" stroke={INK} strokeWidth="1.6" />
      <path d="M38.5 57 Q44 60 49.5 57 M38 61 Q44 64 50 61 M41 54.5 Q44 60 41 65.5" fill="none" stroke="#9d174d" strokeWidth="0.9" />
      <path d="M44 67 Q48 74 54 72" fill="none" stroke="#ec4899" strokeWidth="1.2" />
    </g>);
  if (id === "baguette") return (
    <g>
      {shaft(7, "#d97706")}
      <path d="M56 56.6 L61 59.8 M70 54.8 L75 58 M84 53 L89 56.2 M98 51.2 L103 54.4" stroke="#fde68a" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="64" cy="57.6" r="0.6" fill="#78350f" /><circle cx="92" cy="54.1" r="0.6" fill="#78350f" />
    </g>);
  if (id === "oak") return (
    <g>
      {shaft(5.4, "#78350f")}
      <path d="M50 58.6 Q66 55.6 80 55.2 M90 53.4 Q104 51.6 116 51" fill="none" stroke="#a16207" strokeWidth="0.9" opacity="0.8" />
      <ellipse cx="73" cy="56.2" rx="2" ry="1.4" fill="#451a03" /><ellipse cx="101" cy="52.7" rx="1.6" ry="1.1" fill="#451a03" />
      {vamp}
    </g>);
  if (id === "bamboo") return (
    <g>
      {shaft(3.4, "#65a30d")}
      {[58, 74, 90, 106].map(function (x) { var y = 60 - (x - 44) * 10 / 78; return (<line key={x} x1={x - 0.6} y1={y - 2.6} x2={x + 0.6} y2={y + 2.6} stroke="#365314" strokeWidth="1.5" />); })}
      <path d="M90 54 Q96 44 104 46 Q98 50 90 54 Z" fill="#84cc16" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
    </g>);
  return (
    <g>
      {shaft(3.4, "#b45309")}
      {props.knit && (<g><line x1="80" y1="55.4" x2="84" y2="54.9" stroke="#f472b6" strokeWidth="3.4" /><line x1="92" y1="53.9" x2="96" y2="53.4" stroke="#22d3ee" strokeWidth="3.4" /><line x1="104" y1="52.4" x2="108" y2="51.9" stroke="#facc15" strokeWidth="3.4" /></g>)}
      {vamp}{pennant}
    </g>);
}

/* Saddles hang down the rooster's side below the granny's skirt */
function Saddle(props) {
  var id = props.id;
  if (id === "teacosy") return (
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M38 68 Q56 62 76 68 L74 86 Q56 92 40 86 Z" fill="#f472b6" />
      <path d="M41 74 Q56 70 75 74 M40.5 80 Q56 76 74.5 80" fill="none" stroke="#fbcfe8" strokeWidth="2" />
      <circle cx="41" cy="88" r="3.2" fill="#fde047" />
    </g>);
  if (id === "racing") return (
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M38 68 Q56 62 76 68 L74 86 Q56 92 40 86 Z" fill="#f8fafc" />
      <path d="M44 66 L48 89 M52 64.6 L56 90.4" stroke="#dc2626" strokeWidth="3" />
      <circle cx="66" cy="78" r="5.2" fill="#facc15" />
      <text x="66" y="81" fontSize="7" fontWeight="900" textAnchor="middle" fill={INK} stroke="none">7</text>
    </g>);
  if (id === "rocking") return (
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
      {/* chair back behind her, rockers under the seat */}
      <path d="M36 70 L32 40 M42 69 L39 42" fill="none" stroke="#92400e" strokeWidth="3.4" />
      <path d="M31 42 Q36 38 41 42" fill="none" stroke="#92400e" strokeWidth="3.4" />
      <path d="M32 50 L40 49 M33 58 L41 57" stroke="#b45309" strokeWidth="2" />
      <path d="M34 72 Q56 64 78 72 L77 76 Q56 69 35 76 Z" fill="#b45309" />
      <path d="M30 80 Q56 92 82 80" fill="none" stroke="#92400e" strokeWidth="3" />
    </g>);
  if (id === "foam") return (
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
      <rect x="33" y="64" width="46" height="13" rx="5" fill="#fde047" />
      {[[39, 68], [47, 72], [57, 68], [66, 72], [73, 68]].map(function (c, i) { return (<circle key={i} cx={c[0]} cy={c[1]} r="1.5" fill="#ca8a04" stroke="none" />); })}
    </g>);
  if (id === "skates") return (
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
      <path d="M38 68 Q56 62 76 68 L74 84 Q56 90 40 84 Z" fill="#a855f7" />
      <path d="M46 72 L50 70 L48 76 L53 74" fill="none" stroke="#fde047" strokeWidth="1.8" />
    </g>);
  return null;
}
function Skate(props) {
  var x = props.x;
  return (
    <g stroke={INK} strokeWidth="1.2">
      <rect x={x - 7} y={104} width="14" height="4" rx="1.5" fill="#a855f7" />
      <circle cx={x - 4.5} cy={110} r="2.2" fill="#fde047" /><circle cx={x + 4.5} cy={110} r="2.2" fill="#fde047" />
    </g>);
}

/* pose: idle | charge | deflect | knocked | fallen | cheer */
export function Rider(props) {
  var p = props.palette || PLAYER_PALETTE, ch = p.chicken, L = p.look || PLAYER_PALETTE.look;
  /* Kit can come in as props or ride along on the palette (so every scene that draws her shows the same gear) */
  var lance = props.lance || (p.kit && p.kit.lance), saddle = props.saddle || (p.kit && p.kit.saddle);
  var neck = ch.neck || ch.body;
  var pose = props.pose || "idle";
  var run = props.running && !REDUCED_MOTION;
  var w = props.width || 130, h = w * 112 / 140;
  var legA = run ? "legRunA 0.22s linear infinite" : "none";
  var legB = run ? "legRunB 0.22s linear infinite" : "none";
  var hatGone = props.hatOff || pose === "fallen";
  var look = props.crown ? Object.assign({}, L, { hat: "colander" }) : L;
  /* Volume: every big shape gets a soft light from the upper left and a shadow to the lower right (one overlay
     gradient per drawing, in each shape's own box), so the cartoon reads as rounded and lit, not flat */
  var uid = useId().replace(/[^a-zA-Z0-9]/g, ""), VOL = "url(#v" + uid + ")", SICKLE = "url(#k" + uid + ")", COMB = "url(#c" + uid + ")";
  function lit(el, k) { return React.cloneElement(el, { key: k, fill: VOL, stroke: "none", style: Object.assign({}, el.props.style, { pointerEvents: "none" }) }); }
  /* the rooster in one outline (tail root, back, neck, head, breast, belly) and his mane with pointed hackles */
  var SIL = "M34 64 C46 56 66 57 80 53 C81 45 85 35 92 33 C99 31 104.5 36 105 42 C105.5 47 103 51 100.5 54 C102.5 63 101 76 92 85 C82 93 58 95 44 89 C36 85 31 76 34 64 Z";
  var MANE = "M80 54 C81 45 85 35 92 33 C99 31 104.5 36 105 42 C105.5 47 103 51 100.5 54 C101 58 101 61 100 64 L97.5 72 L95.4 65.5 L92.6 74 L90.2 66.4 L87.2 73.4 L85 65.6 L82 71 L80.6 63.4 C79.4 60 79.4 57 80 54 Z";
  var wingP = (<path d="M43 68 C53 60 69 61 76 69 C75 77 67 83 56 84 L51 87.5 L52.5 82.6 L46.6 84.4 L48.4 79.6 L42.6 79.8 C40.6 76 40.8 71.4 43 68 Z" fill={ch.wing} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />);
  var skirt = (<path d="M36 66 Q50 54 72 63 L70 76 Q52 82 38 74 Z" fill={L.knit ? "#6b3f5a" : p.dress} />);
  var torso = (<path d="M47 64 L49 41 Q56 36 63 41 L65 64 Z" fill={p.dress} />);
  var faceC = (<circle cx="56" cy="30" r="9.5" fill={L.skin} stroke={INK} strokeWidth="2" />);
  var plumage = shade(ch.body, 0.8), hackle = shade(neck, 0.78);
  return (
    <svg width={w} height={h} viewBox="0 0 140 112" aria-hidden style={{ overflow: "visible", display: "block", transform: props.flip ? "scaleX(-1)" : "none" }}>
      <defs>
        <radialGradient id={"v" + uid} cx="32%" cy="20%" r="90%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="0.58" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#2a1608" stopOpacity="0.42" />
        </radialGradient>
        <linearGradient id={"k" + uid} x1="0" y1="1" x2="0.4" y2="0">
          <stop offset="0" stopColor={ch.tail} />
          <stop offset="0.55" stopColor={shade(ch.tail, 1.5)} />
          <stop offset="0.75" stopColor="#2dd4bf" stopOpacity="0.85" />
          <stop offset="1" stopColor={ch.tail} />
        </linearGradient>
        <radialGradient id={"c" + uid} cx="35%" cy="30%" r="80%">
          <stop offset="0" stopColor="#fca5a5" />
          <stop offset="0.4" stopColor="#ef4444" />
          <stop offset="1" stopColor="#991b1b" />
        </radialGradient>
        <clipPath id={"r" + uid}><path d={SIL} /></clipPath>
      </defs>
      <g style={{ transformBox: "view-box", animation: REDUCED_MOTION ? "none" : (run ? "riderBob 0.22s ease-in-out infinite" : "riderIdle 1.6s ease-in-out infinite") }}>
        {/* ── Rooster ── two long sickle feathers with a sheen, then the tail coverts */}
        <g stroke={INK} strokeWidth="1.7" strokeLinejoin="round">
          <path d="M35 63 Q10 52 7 26 Q22 45 39 59 Z" fill={SICKLE} />
          <path d="M33 70 Q5 67 -1 45 Q15 61 36 66 Z" fill={SICKLE} />
        </g>
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <ellipse cx="26" cy="58" rx="11" ry="5" fill={ch.tail} transform="rotate(-40 26 58)" />
          <ellipse cx="23" cy="67" rx="12" ry="5" fill={ch.tail} transform="rotate(-12 23 67)" />
          <ellipse cx="27" cy="76" rx="10" ry="4.5" fill={ch.tail} transform="rotate(18 27 76)" />
        </g>
        <g>
          {lit(<ellipse cx="26" cy="58" rx="11" ry="5" transform="rotate(-40 26 58)" />, "t1")}
          {lit(<ellipse cx="23" cy="67" rx="12" ry="5" transform="rotate(-12 23 67)" />, "t2")}
          {lit(<ellipse cx="27" cy="76" rx="10" ry="4.5" transform="rotate(18 27 76)" />, "t3")}
        </g>
        <g fill="none" stroke="#ea580c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <g style={Object.assign(svgT("68px 88px"), { animation: legB })}><path d="M68 88 L68 104 M63 107 L68 104 L73 107 M68 104 L69 108" /><path d="M66.6 93 L69.4 93 M66.6 97 L69.4 97 M66.6 101 L69.4 101" stroke="#9a3412" strokeWidth="0.9" />{saddle === "skates" && (<Skate x={68} />)}</g>
          <g style={Object.assign(svgT("56px 88px"), { animation: legA })}><path d="M56 88 L56 104 M51 107 L56 104 L61 107 M56 104 L57 108" /><path d="M54.6 93 L57.4 93 M54.6 97 L57.4 97 M54.6 101 L57.4 101" stroke="#9a3412" strokeWidth="0.9" />{saddle === "skates" && (<Skate x={56} />)}</g>
        </g>
        {/* one body from tail to beak, shaded like a cel drawing: a soft shadow along the belly, light on the back */}
        <path d={SIL} fill={ch.body} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
        <g clipPath={"url(#r" + uid + ")"}>
          <ellipse cx="64" cy="100" rx="48" ry="21" fill={shade(ch.body, 0.66)} />
          <ellipse cx="56" cy="61" rx="25" ry="6.5" fill="#fff" opacity="0.24" />
          <path d="M40 80 C52 88 74 90 90 82" fill="none" stroke="#fff" strokeWidth="1" opacity="0.18" />
        </g>
        <g fill="none" stroke={plumage} strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
          <path d="M84 78 q2.6 2.6 5.2 0 M80.6 83.4 q2.6 2.6 5.2 0 M86 83.4 q2.4 2.4 4.8 0 M76 88 q2.4 2.4 4.8 0 M81.6 88.4 q2.4 2.4 4.8 0" />
        </g>
        {/* the comb sits behind the mane; the mane's pointed hackles fall over the shoulders */}
        <path d="M84.5 37 Q84 29.5 88.2 30.4 Q89 25 93.3 26.8 Q95.4 22.6 98.6 27 Q102.6 26.4 101.4 32.4 Q101.2 36.4 97.6 37.2 Z" fill={COMB} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d={MANE} fill={neck} stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        {lit(<path d={MANE} />, "mn")}
        <path d="M84 60 L85.6 66 M88.6 61 L90.4 68 M93.4 60 L95 66" fill="none" stroke={hackle} strokeWidth="1.1" strokeLinecap="round" opacity="0.8" />
        <g stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M104 40.6 L115 44.4 L104 45.2 Z" fill="#fbbf24" />
          <path d="M104 45.2 L113 46.2 L104 49 Z" fill="#d97706" />
          <path d="M101 48.8 Q99.4 54.6 102.6 58 Q106.4 55.4 105 49 Z" fill={COMB} />
        </g>
        <circle cx="98" cy="42" r="2.7" fill="#f59e0b" stroke="#78350f" strokeWidth="0.6" />
        <circle cx="98.3" cy="42" r="1.45" fill="#111" />
        <circle cx="98.9" cy="41.2" r="0.6" fill="#fff" />
        <circle cx="105.4" cy="42.4" r="0.5" fill="#78350f" />
        {(pose === "charge" || props.running) && (<line x1="94.5" y1="37.2" x2="101.5" y2="39.6" stroke="#111" strokeWidth="2" strokeLinecap="round" />)}
        <g style={Object.assign(svgT("46px 68px"), { animation: REDUCED_MOTION ? "none" : (run ? "wingFlap 0.22s ease-in-out infinite" : "wingIdle 1.6s ease-in-out infinite") })}>
          {wingP}
          {lit(wingP, "w")}
          <path d="M50 81 Q53 74 51 68 M57 82 Q61 75 59 68 M64 80 Q68 74 66 69" fill="none" stroke={shade(ch.wing, 0.62)} strokeWidth="1.3" strokeLinecap="round" />
          <path d="M47 66.4 C55 62.6 66 63.6 72 68" fill="none" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity="0.4" />
        </g>

        {saddle && (<Saddle id={saddle} />)}

        {/* ── Granny ── */}
        <g style={Object.assign(svgT("56px 64px", GRANNY_POSE[pose], pose === "fallen" ? "transform 0.55s cubic-bezier(.5,-0.3,.6,1)" : "transform 0.22s cubic-bezier(.3,1.6,.5,1)"), { display: props.noRider ? "none" : undefined })}>
          {/* she sits a size bigger on the rooster than before, and her head a touch bigger again (lance and hand unchanged) */}
          <g transform="translate(56 66) scale(1.14) translate(-56 -66)">
          {/* her shadow on the rooster's back */}
          <ellipse cx="56" cy="71" rx="19" ry="4.2" fill="#1c0f05" opacity="0.18" />
          <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
            {skirt}
            <ellipse cx="63" cy="82" rx="5" ry="3" fill="#1f2937" />
            {torso}
          </g>
          {lit(skirt, "sk")}{lit(torso, "to")}
          <path d="M44 72 Q47 66 46 62 M54 75 Q56 69 55 63 M63 74 Q64 69 63.4 64" fill="none" stroke={INK} strokeWidth="0.9" strokeLinecap="round" opacity="0.28" />
          <ellipse cx="63" cy="81.4" rx="2.4" ry="0.9" fill="#fff" opacity="0.35" />
          {L.knit ? (
            <g>
              <path d="M51 45 L50.5 62 M55 44 L55 63 M59 45 L59.5 63" stroke={INK} strokeWidth="0.8" opacity="0.22" />
              <circle cx="56.6" cy="50" r="0.9" fill={INK} /><circle cx="56.8" cy="55" r="0.9" fill={INK} /><circle cx="57" cy="60" r="0.9" fill={INK} />
            </g>
          ) : (
            <path d="M47 45 Q56 53 65 45 L65 51 Q56 58 47 51 Z" fill={p.shawl} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          )}
          {(L.acc === "pearls" || L.acc === "scarf") && (<Accessory look={L} scarf={p.shawl} />)}
          <g transform="translate(56 40) scale(1.1) translate(-56 -40)">
          <HairBack look={L} />
          {faceC}
          {lit(faceC, "fc")}
          <path d="M49.3 24.5 Q47.4 28.5 48.7 33.5" fill="none" stroke={L.hair} strokeWidth="2.6" strokeLinecap="round" />
          <path d="M49.8 25.4 Q48.8 28 49.4 30.6" fill="none" stroke="#fff" strokeWidth="0.8" strokeLinecap="round" opacity="0.6" />
          <circle cx="57.5" cy="34" r="2.4" fill="#fb7185" opacity="0.5" />
          <path d="M53.2 33.2 Q54.4 34.2 55.6 33.4 M63.6 31.6 L65.2 32.4 M63.8 29.6 L65.4 29.4" fill="none" stroke={INK} strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
          <circle cx="65" cy="32" r="1.8" fill={shade(L.skin, 0.86)} />
          <circle cx="64.6" cy="31.4" r="0.6" fill="#fff" opacity="0.6" />
          {L.glasses !== "none" && (<g><circle cx="60.2" cy="29.6" r="1.25" fill="#1f2937" /><circle cx="60.6" cy="29.2" r="0.4" fill="#fff" /></g>)}
          <Brows look={L} />
          <Glasses look={L} />
          <Mouth look={L} />
          {L.acc === "earrings" ? <Accessory look={L} /> : null}

          {!props.crown && (<Hat look={look} gone={hatGone} plume={p.plume} />)}
          {props.crown && (<text x="45" y="23" fontSize="17" style={{ transform: props.flip ? "scaleX(-1)" : "none", transformBox: "fill-box", transformOrigin: "center" }}>👑</text>)}
          </g>
          </g>

          {/* Lance with a boxing-glove tip */}
          <g style={svgT("68px 56px", "rotate(" + (props.aim != null ? props.aim : LANCE_ANGLE[pose] != null ? LANCE_ANGLE[pose] : -24) + "deg)", props.aim != null ? "transform 0.07s ease-out" : pose === "charge" ? "transform 0.18s ease-in" : "transform 0.3s cubic-bezier(.3,1.5,.5,1)")}>{/* aim: the angle that points the glove at the other rider (JoustStage) */}
            <LanceShaft id={lance} knit={L.knit} plume={p.plume} />
            <rect x="117" y="46" width="5" height="8" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="127" cy="50" rx="7" ry="6" fill="#dc2626" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="124" cy="44.6" rx="2.8" ry="2.1" fill="#dc2626" stroke={INK} strokeWidth="1.5" />
            <path d="M125 48 Q128 47 130.5 49" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
          </g>
          <path d="M60 44 Q66 50 68 56" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M60 44 Q66 50 68 56" fill="none" stroke={p.dress} strokeWidth="4.4" strokeLinecap="round" />
          <circle cx="68.5" cy="56.5" r="3.2" fill={L.skin} stroke={INK} strokeWidth="1.6" />
          {L.acc === "pauldron" ? <g transform="translate(56 66) scale(1.14) translate(-56 -66)"><Accessory look={L} /></g> : null}
        </g>
      </g>
    </svg>
  );
}

/* The same palette carrying a kit (lance + saddle ids) */
export function withKit(pal, kit) { return kit ? Object.assign({}, pal, { kit: { lance: kit.lance || "broom", saddle: kit.saddle || "teacosy" } }) : pal; }

/* Round head-and-shoulders crop of a rider, for lists and news photos */
export function Face(props) {
  var s = props.size || 34, w = s * 2.7, h = w * 112 / 140;
  return (
    <span aria-hidden style={{ position: "relative", display: "inline-block", width: s, height: s, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: props.bg || "linear-gradient(180deg,#e0f2fe,#fef3c7)", border: "1.5px solid " + INK }}>
      <span style={{ position: "absolute", left: s / 2 - w * 56 / 140, top: s * 0.56 - h * 30 / 112 }}>
        <Rider palette={props.palette} width={w} />
      </span>
    </span>
  );
}

/* Feather burst (flutters up, then drifts down with a sway) */
export function Feathers(props) {
  var parts = useRef(null);
  if (!parts.current) {
    parts.current = [];
    var colors = props.colors || ["#fffbeb", "#ffffff"];
    for (var i = 0; i < (props.count || 14); i++) {
      var dir = Math.random() < 0.5 ? -1 : 1;
      parts.current.push({ x1: dir * (10 + Math.random() * 40), x2: dir * (25 + Math.random() * 70), up: -(20 + Math.random() * 45), down: 30 + Math.random() * 45, rot: dir * (180 + Math.random() * 360), d: 0.9 + Math.random() * 0.7, c: colors[i % colors.length], s: 0.8 + Math.random() * 0.6 });
    }
  }
  if (REDUCED_MOTION) return null;
  return (
    <div aria-hidden style={{ position: "absolute", left: props.x, top: props.y, width: 0, height: 0, pointerEvents: "none", zIndex: 6 }}>
      {parts.current.map(function (f, i) {
        return (
          <motion.div key={i}
            initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
            animate={{ x: [0, f.x1, f.x2], y: [0, f.up, f.down], rotate: f.rot, opacity: [1, 1, 0] }}
            transition={{ duration: f.d, ease: "easeOut", times: [0, 0.35, 1] }}
            style={{ position: "absolute", width: 5 * f.s, height: 13 * f.s, marginLeft: -2.5 * f.s, marginTop: -6.5 * f.s, borderRadius: "50% 50% 50% 50% / 70% 70% 30% 30%", background: f.c, border: "1px solid rgba(63,42,29,0.35)" }} />
        );
      })}
    </div>
  );
}
