/* ═══ ItemArt ═══ Pictures of the kit for the shop and the locker: each lance is the real lance (the same drawing the
   rider carries, glove tip and all), each saddle a real saddle with its own twist — knitted, striped, on rockers,
   made of sponge, on wheels. */

import { LanceShaft } from "./Rider";
import { BY_ID } from "../engine/gear";

var INK = "#3f2a1d";

function Glove() {
  return (
    <g>
      <rect x="117" y="46" width="5" height="8" rx="1.5" fill="#fff" stroke={INK} strokeWidth="1.6" />
      <ellipse cx="127" cy="50" rx="7" ry="6" fill="#dc2626" stroke={INK} strokeWidth="1.8" />
      <ellipse cx="124" cy="44.6" rx="2.8" ry="2.1" fill="#dc2626" stroke={INK} strokeWidth="1.5" />
      <path d="M125 48 Q128 47 130.5 49" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/* A saddle: seat with pommel and cantle, the flap below, a stirrup hanging off it */
function SaddleShape(props) {
  var seat = props.seat, flap = props.flap;
  return (
    <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
      {props.under}
      <path d="M40 40 L40 52" stroke={INK} strokeWidth="2" />
      <path d="M35 52 L45 52 L43 58 L37 58 Z" fill="#94a3b8" />
      <path d="M20 32 L62 30 L60 47 Q41 52 22 47 Z" fill={flap} />
      <path d="M9 30 Q12 17 22 22 Q40 30 58 21 Q70 15 72 27 Q70 34 58 33 Q40 36 22 34 Q10 35 9 30 Z" fill={seat} />
      {props.over}
    </g>
  );
}

export default function ItemArt(props) {
  var id = props.id, g = BY_ID[id], size = props.size || 56;
  if (!g) return null;
  if (g.slot === "lance") {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden style={{ display: "block", overflow: "hidden", filter: "drop-shadow(0 1px 0 rgba(63,42,29,0.35))" }}>
        {props.pad !== false && (<ellipse cx="50" cy="86" rx="34" ry="7" fill="rgba(63,42,29,0.12)" />)}
        {/* the whole lance, centred and laid diagonally so it always fits its box */}
        <g transform="translate(50 48) rotate(-35) scale(0.8) translate(-80 -55)">
          <LanceShaft id={id} plume="#f59e0b" />
          <Glove />
        </g>
      </svg>
    );
  }
  var art;
  if (id === "teacosy") art = (<SaddleShape seat="#f472b6" flap="#f9a8d4"
    over={<g><path d="M16 27 Q40 33 64 25" fill="none" stroke="#fbcfe8" strokeWidth="2.4" /><path d="M24 38 L58 36 M24 43 L57 41" stroke="#fbcfe8" strokeWidth="2" /><circle cx="69" cy="20" r="4" fill="#fde047" /></g>} />);
  else if (id === "racing") art = (<SaddleShape seat="#f8fafc" flap="#f8fafc"
    over={<g><path d="M30 24 L33 35 M38 27 L40 36" stroke="#dc2626" strokeWidth="3" /><circle cx="49" cy="41" r="5.5" fill="#facc15" /><text x="49" y="44.5" fontSize="8" fontWeight="900" textAnchor="middle" fill={INK} stroke="none">7</text></g>} />);
  else if (id === "rocking") art = (<SaddleShape seat="#b45309" flap="#d97706"
    under={<g><path d="M8 62 Q40 76 74 60" fill="none" stroke="#92400e" strokeWidth="4" strokeLinecap="round" /><path d="M20 47 L16 64 M60 45 L64 62" stroke="#92400e" strokeWidth="3" strokeLinecap="round" /></g>}
    over={<g><path d="M66 22 L68 4 M71 24 L74 6" stroke="#92400e" strokeWidth="3" strokeLinecap="round" /><path d="M66 6 Q71 2 76 6" fill="none" stroke="#92400e" strokeWidth="3" strokeLinecap="round" /></g>} />);
  else if (id === "foam") art = (<SaddleShape seat="#fde047" flap="#fef08a"
    over={<g stroke="none">{[[20, 27], [30, 30], [44, 29], [54, 26], [64, 24], [30, 40], [44, 42], [54, 39]].map(function (c, i) { return (<circle key={i} cx={c[0]} cy={c[1]} r={1.8} fill="#ca8a04" />); })}</g>} />);
  else if (id === "skates") art = (<SaddleShape seat="#a855f7" flap="#c084fc"
    under={<g><circle cx="27" cy="54" r="5" fill="#fde047" /><circle cx="55" cy="53" r="5" fill="#fde047" /><path d="M22 49 L60 48" stroke={INK} strokeWidth="2.4" /></g>}
    over={<path d="M36 36 L41 33 L39 40 L45 37" fill="none" stroke="#fde047" strokeWidth="2" />} />);
  return (
    <svg width={size} height={size} viewBox="0 -4 84 84" aria-hidden style={{ display: "block", overflow: "hidden" }}>
      {props.pad !== false && (<ellipse cx="42" cy="76" rx="30" ry="6" fill="rgba(63,42,29,0.12)" />)}
      <g transform="translate(2 6)">{art}</g>
    </svg>
  );
}
