/* ═══ Selfie ═══ Photos for Knitter posts, put together from parts so they almost never repeat: a place (its own
   little backdrop), who's in shot (the granny's face, the rooster, or both of them riding — in their real colours),
   something in hand, a sticker, a filter and the way the phone was held. Same seed → same photo. */

import { Rider } from "./Rider";
import { FONT } from "../ui/theme";
import { SceneArt } from "./SelfieScenes";

/* Places: a backdrop and a few things that belong there. keys are matched against the post's place text */
export var SCENES = [
  { key: "bingo", words: ["bingo"], bg: "linear-gradient(180deg,#7c3aed,#c4b5fd)", floor: "#5b21b6", deco: ["🎱", "7️⃣", "🔢"] },
  { key: "garden", words: ["garden", "plant", "greenhouse", "allotment", "veg", "marrow"], bg: "linear-gradient(180deg,#bbf7d0,#4ade80)", floor: "#65a30d", deco: ["🪴", "🌻", "🌷", "🥕"] },
  { key: "tea", words: ["tea", "café", "cafe", "scone", "cake shop"], bg: "linear-gradient(180deg,#fce7f3,#fbcfe8)", floor: "#be185d", deco: ["☕", "🫖", "🍰"] },
  { key: "beach", words: ["beach", "seaside", "pier", "sea", "coast", "promenade"], bg: "linear-gradient(180deg,#7dd3fc 0%,#bae6fd 55%,#38bdf8 56%,#0ea5e9 70%,#fde68a 71%)", floor: "#fcd34d", deco: ["⛱️", "🐚", "🦀", "🍦"] },
  { key: "lanes", words: ["lane", "arena", "final", "stand", "tournament", "joust", "tunnel"], bg: "linear-gradient(180deg,#bae6fd,#fef3c7)", floor: "#c8a46b", deco: ["🏆", "🎪", "🚩"] },
  { key: "bakery", words: ["bakery", "baker", "bun", "bread", "pie"], bg: "linear-gradient(180deg,#fed7aa,#fdba74)", floor: "#9a3412", deco: ["🥐", "🍞", "🧁", "🥧"] },
  { key: "hair", words: ["hair", "salon", "perm", "barber"], bg: "linear-gradient(180deg,#e0e7ff,#a5b4fc)", floor: "#4338ca", deco: ["💇‍♀️", "🪞", "💈"] },
  { key: "physio", words: ["physio", "doctor", "waiting room", "clinic", "chiropractor", "nurse"], bg: "linear-gradient(180deg,#f0fdfa,#99f6e4)", floor: "#0f766e", deco: ["🩺", "🦴", "🩹"] },
  { key: "fete", words: ["fete", "church", "village hall", "jumble", "raffle", "fair"], bg: "linear-gradient(180deg,#fef9c3,#fde047)", floor: "#a16207", deco: ["🎪", "🎟️", "🎈"] },
  { key: "kitchen", words: ["kitchen", "oven", "home", "sofa", "living room", "bed"], bg: "linear-gradient(180deg,#fff7ed,#fed7aa)", floor: "#b45309", deco: ["🍳", "🧶", "🛋️"] },
  { key: "bus", words: ["bus", "train", "station", "car park", "road"], bg: "linear-gradient(180deg,#e5e7eb,#9ca3af)", floor: "#4b5563", deco: ["🚌", "🚏", "☂️"] },
  { key: "library", words: ["library", "book", "museum", "gallery"], bg: "linear-gradient(180deg,#fef3c7,#d6b273)", floor: "#78350f", deco: ["📚", "🖼️", "🕰️"] },
  { key: "gym", words: ["gym", "pool", "aerobics", "yoga", "swim"], bg: "linear-gradient(180deg,#dbeafe,#93c5fd)", floor: "#1d4ed8", deco: ["🏋️‍♀️", "🧘‍♀️", "💦"] },
  { key: "farm", words: ["farm", "barn", "field", "coop", "hen"], bg: "linear-gradient(180deg,#fef08a,#bef264)", floor: "#854d0e", deco: ["🌾", "🐄", "🥚"] }
];
var HOLD = ["🏆", "☕", "🍰", "🧶", "🥇", "🍦", "🌹", "🥕", "📸", "🫖", "🧁", "🎂", "🍪", "💐"];
var STICKERS = ["😎", "💅", "🔥", "😴", "🤪", "😤", "🥳", "😇", "👑", "💪", "🙄", "😂", "🫶", "✨"];
var FILTERS = ["none", "sepia(0.35)", "saturate(1.4)", "hue-rotate(-12deg) saturate(1.2)", "contrast(1.1) brightness(1.05)", "grayscale(0.6)"];

function rnd(seed) { var x = Math.imul((seed >>> 0) ^ 0x9e3779b9, 2654435761) >>> 0; x ^= x >>> 16; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; x = x || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

/* The scene for a bit of text (a place, a post), or a random one */
export function sceneFor(text, r) {
  var t = (text || "").toLowerCase();
  for (var i = 0; i < SCENES.length; i++) if (SCENES[i].words.some(function (w) { return t.indexOf(w) >= 0; })) return SCENES[i];
  return SCENES[Math.floor(r() * SCENES.length)];
}

/* props: seed, palette (the poster's look), text (for the place), h (height), who ("granny" | "rooster" | "both", optional) */
export default function Selfie(props) {
  var r = rnd(props.seed || 1), sc = sceneFor(props.text, r), h = props.h || 132;
  var who = props.who || ["granny", "both", "rooster", "both", "granny"][Math.floor(r() * 5)];
  var hold = HOLD[Math.floor(r() * HOLD.length)], sticker = STICKERS[Math.floor(r() * STICKERS.length)], filter = FILTERS[Math.floor(r() * FILTERS.length)];
  var tilt = (r() * 8 - 4).toFixed(1), flip = r() < 0.5, d1 = r(), d2 = r();
  return (
    <div aria-hidden style={{ position: "relative", height: h, borderRadius: 10, overflow: "hidden", border: "2px solid #3f2a1d", background: "#e5e7eb", boxShadow: "0 2px 0 rgba(63,42,29,0.25)", filter: filter, transform: "rotate(" + tilt * 0.25 + "deg)", fontFamily: FONT }}>
      <SceneArt k={sc.key} />
      {/* phone-camera depth: the background a touch soft, a warm light from one side */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(" + (flip ? 250 : 110) + "deg, rgba(255,240,200,0.35), rgba(255,255,255,0) 55%)" }} />
      <div style={{ position: "absolute", left: "15%", right: "15%", bottom: h * 0.02, height: h * 0.1, borderRadius: "50%", background: "radial-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0) 70%)" }} />
      {/* who's in shot */}
      {who === "granny" && (<div data-who="granny" style={{ position: "absolute", left: "48%", top: -h * 0.24, marginLeft: -((flip ? 84 : 56) / 140) * h * 2.1 }}><Rider palette={props.palette} width={h * 2.1} pose={r() < 0.5 ? "cheer" : "idle"} flip={flip} lance={props.kit && props.kit.lance} /></div>)}
      {who === "both" && (<div data-who="both" style={{ position: "absolute", left: flip ? "36%" : "18%", bottom: h * 0.02 }}><Rider palette={props.palette} width={h * 1.05} pose={r() < 0.5 ? "cheer" : "idle"} flip={flip} lance={props.kit && props.kit.lance} saddle={props.kit && props.kit.saddle} /></div>)}
      {who === "rooster" && (<div data-who="rooster" style={{ position: "absolute", left: flip ? "40%" : "20%", bottom: h * 0.03 }}><Rider palette={props.palette} width={h * 0.95} pose="idle" noRider={true} flip={flip} /></div>)}
      {/* in hand, a sticker, the phone */}
      <span style={{ position: "absolute", left: flip ? "28%" : "62%", bottom: h * 0.2, fontSize: h * 0.2, transform: "rotate(" + tilt + "deg)" }}>{hold}</span>
      <span style={{ position: "absolute", right: 6, bottom: 6, fontSize: h * 0.18, filter: "drop-shadow(0 1px 0 rgba(0,0,0,0.3))" }}>{sticker}</span>
      {/* lens vignette, then the selfie frame */}
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 " + h * 0.22 + "px rgba(40,20,0,0.35)", pointerEvents: "none" }} />
      <span style={{ position: "absolute", left: 20, top: 6, fontSize: 9, fontWeight: 800, color: "#fff", background: "rgba(30,20,10,0.55)", borderRadius: 8, padding: props.text ? "1px 6px" : 0, letterSpacing: 0.3 }}>{props.text && props.text.length < 34 ? "📍 " + props.text : ""}</span>
      {/* selfie frame: corners and a timestamp */}
      {["0 0", "100% 0", "0 100%", "100% 100%"].map(function (p, i) { return (<span key={i} style={{ position: "absolute", left: i % 2 ? "auto" : 5, right: i % 2 ? 5 : "auto", top: i < 2 ? 5 : "auto", bottom: i >= 2 ? 5 : "auto", width: 12, height: 12, borderTop: i < 2 ? "2px solid rgba(255,255,255,0.8)" : "none", borderBottom: i >= 2 ? "2px solid rgba(255,255,255,0.8)" : "none", borderLeft: i % 2 ? "none" : "2px solid rgba(255,255,255,0.8)", borderRight: i % 2 ? "2px solid rgba(255,255,255,0.8)" : "none" }} />); })}
    </div>
  );
}
