/* ═══ Rider ═══ Jousting granny on a chicken (SVG, faces right; flip for the opponent) */

import * as React from "react";
import { motion } from "framer-motion";
import { REDUCED_MOTION } from "./fx";

const { useRef } = React;

var INK = "#3f2a1d";
var SKIN = "#f6d5bd";

export var PLAYER_PALETTE = { dress: "#2563eb", shawl: "#facc15", plume: "#facc15", chicken: { body: "#fffbeb", wing: "#fde68a", tail: "#f59e0b" } };

var DRESSES = ["#be123c", "#15803d", "#7c3aed", "#0e7490", "#c2410c", "#4d7c0f", "#9d174d", "#334155"];
var SHAWLS = ["#fda4af", "#86efac", "#c4b5fd", "#67e8f9", "#fdba74", "#fef08a", "#f9a8d4", "#cbd5e1"];
var PLUMES = ["#ef4444", "#22c55e", "#a855f7", "#06b6d4", "#f97316", "#84cc16", "#ec4899", "#94a3b8"];
var CHICKENS = [
  { body: "#fffbeb", wing: "#e7e5e4", tail: "#a8a29e" },
  { body: "#c2410c", wing: "#9a3412", tail: "#431407" },
  { body: "#a8a29e", wing: "#78716c", tail: "#292524" },
  { body: "#fcd34d", wing: "#f59e0b", tail: "#b45309" },
  { body: "#57534e", wing: "#44403c", tail: "#0c0a09" }
];

/* Stable look per NPC: same opponent always rides the same chicken in the same dress */
export function paletteFor(id) {
  var h = Math.abs(((id || 7) * 2654435761) | 0);
  var c = h % DRESSES.length;
  return { dress: DRESSES[c], shawl: SHAWLS[(c + 3) % SHAWLS.length], plume: PLUMES[c], chicken: CHICKENS[(h >> 4) % CHICKENS.length] };
}

var LANCE_ANGLE = { idle: -24, charge: 0, deflect: -38, knocked: -45, fallen: 30, cheer: -62 };
var GRANNY_POSE = { knocked: "rotate(-24deg)", fallen: "translate(-30px,34px) rotate(-96deg)", cheer: "translateY(-2px)" };

function svgT(origin, transform, transition) {
  return { transformBox: "view-box", transformOrigin: origin, transform: transform || "none", transition: transition || "transform 0.22s ease-out" };
}

/* pose: idle | charge | deflect | knocked | fallen | cheer */
export function Rider(props) {
  var p = props.palette || PLAYER_PALETTE, ch = p.chicken;
  var pose = props.pose || "idle";
  var run = props.running && !REDUCED_MOTION;
  var w = props.width || 130, h = w * 112 / 140;
  var legA = run ? "legRunA 0.22s linear infinite" : "none";
  var legB = run ? "legRunB 0.22s linear infinite" : "none";
  var hatGone = props.hatOff || pose === "fallen";
  return (
    <svg width={w} height={h} viewBox="0 0 140 112" aria-hidden style={{ overflow: "visible", display: "block", transform: props.flip ? "scaleX(-1)" : "none" }}>
      <g style={{ transformBox: "view-box", animation: REDUCED_MOTION ? "none" : (run ? "riderBob 0.22s ease-in-out infinite" : "riderIdle 1.6s ease-in-out infinite") }}>
        {/* ── Chicken ── */}
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <ellipse cx="26" cy="58" rx="11" ry="5" fill={ch.tail} transform="rotate(-40 26 58)" />
          <ellipse cx="23" cy="67" rx="12" ry="5" fill={ch.tail} transform="rotate(-12 23 67)" />
          <ellipse cx="27" cy="76" rx="10" ry="4.5" fill={ch.tail} transform="rotate(18 27 76)" />
        </g>
        <g fill="none" stroke="#ea580c" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <g style={Object.assign(svgT("68px 88px"), { animation: legB })}><path d="M68 88 L68 104 M63 107 L68 104 L73 107 M68 104 L69 108" /></g>
          <g style={Object.assign(svgT("56px 88px"), { animation: legA })}><path d="M56 88 L56 104 M51 107 L56 104 L61 107 M56 104 L57 108" /></g>
        </g>
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <ellipse cx="87" cy="60" rx="10" ry="15" fill={ch.body} transform="rotate(22 87 60)" />
          <circle cx="88" cy="34" r="3.5" fill="#ef4444" />
          <circle cx="93.5" cy="31.5" r="4" fill="#ef4444" />
          <circle cx="99" cy="34" r="3.5" fill="#ef4444" />
          <circle cx="94" cy="44" r="11" fill={ch.body} />
          <polygon points="104,41 115,45 104,49" fill="#f59e0b" />
          <ellipse cx="103" cy="53" rx="2.8" ry="4.5" fill="#ef4444" />
          <ellipse cx="60" cy="74" rx="31" ry="19" fill={ch.body} />
        </g>
        <circle cx="98" cy="42" r="2.1" fill="#111" />
        <circle cx="98.7" cy="41.3" r="0.7" fill="#fff" />
        {(pose === "charge" || props.running) && (<line x1="94.5" y1="37.2" x2="101.5" y2="39.6" stroke="#111" strokeWidth="2" strokeLinecap="round" />)}
        <g style={Object.assign(svgT("46px 68px"), { animation: REDUCED_MOTION ? "none" : (run ? "wingFlap 0.22s ease-in-out infinite" : "wingIdle 1.6s ease-in-out infinite") })}>
          <path d="M42 66 Q58 60 73 70 Q66 82 50 80 Q40 76 42 66 Z" fill={ch.wing} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M50 79 Q53 73 51 68 M57 80 Q61 74 59 68 M64 78 Q67 73 66 69" fill="none" stroke={INK} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
        </g>

        {/* ── Granny ── */}
        <g style={svgT("56px 64px", GRANNY_POSE[pose], pose === "fallen" ? "transform 0.55s cubic-bezier(.5,-0.3,.6,1)" : "transform 0.22s cubic-bezier(.3,1.6,.5,1)")}>
          <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
            <path d="M36 66 Q50 54 72 63 L70 76 Q52 82 38 74 Z" fill={p.dress} />
            <ellipse cx="63" cy="82" rx="5" ry="3" fill="#1f2937" />
            <path d="M47 64 L49 41 Q56 36 63 41 L65 64 Z" fill={p.dress} />
            <path d="M47 45 Q56 53 65 45 L65 51 Q56 58 47 51 Z" fill={p.shawl} />
            <circle cx="47" cy="28" r="5" fill="#e5e7eb" />
            <circle cx="56" cy="30" r="9.5" fill={SKIN} />
          </g>
          <circle cx="57.5" cy="34" r="2.2" fill="#fb7185" opacity="0.45" />
          <circle cx="65" cy="32" r="1.6" fill="#e9b99b" />
          <path d="M51 29 L57 29.5" stroke="#1f2937" strokeWidth="1.3" />
          <circle cx="60" cy="29.5" r="3.2" fill="rgba(255,255,255,0.55)" stroke="#1f2937" strokeWidth="1.4" />
          <path d="M59 36.2 Q61.5 37.6 64 35.6" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />

          {/* Colander helmet (flies off on a big hit) */}
          {!props.crown && (
            <g style={{ transformBox: "view-box", transformOrigin: "56px 22px", transform: hatGone ? "translate(-34px,-46px) rotate(-220deg)" : "none", opacity: hatGone ? 0 : 1, transition: hatGone ? "transform 0.6s ease-out, opacity 0.6s ease-in" : "transform 0.2s, opacity 0.2s" }}>
              <path d="M56 15 Q50 4 40 6 Q48 10 54 17 Z" fill={p.plume} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M46 27 Q56 13 66 27 Z" fill="#cbd5e1" stroke={INK} strokeWidth="2" strokeLinejoin="round" />
              <line x1="45" y1="27" x2="67" y2="27" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
              <circle cx="51" cy="23" r="0.95" fill="#64748b" /><circle cx="56" cy="20.5" r="0.95" fill="#64748b" />
              <circle cx="61" cy="23" r="0.95" fill="#64748b" /><circle cx="56" cy="24.8" r="0.95" fill="#64748b" />
              <rect x="64" y="24.5" width="5" height="2.2" rx="1" fill="#94a3b8" stroke={INK} strokeWidth="1.2" />
            </g>
          )}
          {props.crown && (<text x="45" y="23" fontSize="17" style={{ transform: props.flip ? "scaleX(-1)" : "none", transformBox: "fill-box", transformOrigin: "center" }}>👑</text>)}

          {/* Lance with a boxing-glove tip */}
          <g style={svgT("68px 56px", "rotate(" + (LANCE_ANGLE[pose] != null ? LANCE_ANGLE[pose] : -24) + "deg)", pose === "charge" ? "transform 0.18s ease-in" : "transform 0.3s cubic-bezier(.3,1.5,.5,1)")}>
            <line x1="44" y1="60" x2="122" y2="50" stroke={INK} strokeWidth="6" strokeLinecap="round" />
            <line x1="44" y1="60" x2="122" y2="50" stroke="#b45309" strokeWidth="3.4" strokeLinecap="round" />
            <polygon points="70,50 78,55.5 71,62" fill="#e5e7eb" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M84 53.2 L99 49 L86 59 Z" fill={p.plume} stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="117" y="46" width="5" height="8" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="127" cy="50" rx="7" ry="6" fill="#dc2626" stroke={INK} strokeWidth="1.8" />
            <ellipse cx="124" cy="44.6" rx="2.8" ry="2.1" fill="#dc2626" stroke={INK} strokeWidth="1.5" />
            <path d="M125 48 Q128 47 130.5 49" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
          </g>
          <path d="M60 44 Q66 50 68 56" fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <path d="M60 44 Q66 50 68 56" fill="none" stroke={p.dress} strokeWidth="4.4" strokeLinecap="round" />
          <circle cx="68.5" cy="56.5" r="3.2" fill={SKIN} stroke={INK} strokeWidth="1.6" />
        </g>
      </g>
    </svg>
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
