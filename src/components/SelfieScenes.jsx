/* ═══ SelfieScenes ═══ Illustrated backdrops for Knitter selfies, drawn in the game's own style (ink outlines, warm
   flat colour). Each is a 200×120 SVG scene that fills the photo; the riders are drawn on top. */

var INK = "#3f2a1d";

function Bunting(props) {
  var cols = ["#ef4444", "#facc15", "#22c55e", "#3b82f6", "#ec4899"], y = props.y || 6, out = [];
  for (var i = 0; i < 11; i++) out.push(<polygon key={i} points={(i * 19) + "," + y + " " + (i * 19 + 18) + "," + y + " " + (i * 19 + 9) + "," + (y + 12)} fill={cols[i % 5]} stroke={INK} strokeWidth="0.8" />);
  return (<g><path d={"M0 " + y + " Q100 " + (y + 4) + " 200 " + y} fill="none" stroke={INK} strokeWidth="0.8" />{out}</g>);
}

function Bingo() {
  var balls = [7, 22, 41, 58, 13, 66, 85, 30];
  return (<g>
    <rect width="200" height="120" fill="#6d28d9" />
    {[0, 1, 2, 3, 4, 5, 6].map(function (i) { return (<rect key={i} x={i * 30} y="0" width="15" height="120" fill="#7c3aed" />); })}
    <rect x="20" y="10" width="160" height="44" rx="4" fill="#1e1b4b" stroke={INK} strokeWidth="2" />
    {balls.map(function (n, i) { return (<g key={i}><circle cx={34 + i * 19} cy="32" r="8" fill={["#f43f5e", "#facc15", "#22d3ee", "#a3e635"][i % 4]} stroke={INK} strokeWidth="1.2" /><text x={34 + i * 19} y="35" fontSize="8" fontWeight="900" textAnchor="middle" fill={INK}>{n}</text></g>); })}
    <text x="100" y="50" fontSize="7" fontWeight="900" textAnchor="middle" fill="#fde68a" letterSpacing="2">EYES DOWN!</text>
    {[40, 100, 160].map(function (x) { return (<g key={x}><line x1={x} y1="0" x2={x} y2="6" stroke={INK} /><ellipse cx={x} cy="8" rx="9" ry="4" fill="#fde047" stroke={INK} strokeWidth="1" /></g>); })}
    <rect x="0" y="92" width="200" height="28" fill="#4c1d95" />
    <rect x="10" y="86" width="70" height="8" rx="2" fill="#a16207" stroke={INK} strokeWidth="1" />
    <rect x="120" y="86" width="70" height="8" rx="2" fill="#a16207" stroke={INK} strokeWidth="1" />
  </g>);
}

function Beach() {
  return (<g>
    <rect width="200" height="120" fill="#7dd3fc" />
    <circle cx="168" cy="22" r="13" fill="#fde047" stroke="#f59e0b" strokeWidth="2" />
    <path d="M0 62 Q25 56 50 62 T100 62 T150 62 T200 62 L200 80 L0 80 Z" fill="#0ea5e9" />
    <path d="M0 70 Q25 65 50 70 T100 70 T150 70 T200 70" fill="none" stroke="#e0f2fe" strokeWidth="2" />
    <rect x="130" y="44" width="70" height="5" fill="#92400e" stroke={INK} strokeWidth="1" />
    {[136, 152, 168, 184].map(function (x) { return (<rect key={x} x={x} y="49" width="3" height="20" fill="#78350f" />); })}
    <path d="M0 78 Q60 72 120 80 T200 76 L200 120 L0 120 Z" fill="#fcd34d" />
    <g transform="translate(28 64)"><line x1="0" y1="0" x2="4" y2="34" stroke={INK} strokeWidth="1.5" /><path d="M-18 4 Q0 -14 20 2 Z" fill="#ef4444" stroke={INK} strokeWidth="1.2" /><path d="M-6 0 Q0 -10 8 -1" fill="#fff" /></g>
    <ellipse cx="62" cy="104" rx="8" ry="3" fill="#f472b6" />
  </g>);
}

function Lanes() {
  var crowd = []; for (var i = 0; i < 26; i++) crowd.push(<circle key={i} cx={6 + i * 7.6} cy={40 + (i % 3) * 7} r="3.4" fill={["#f87171", "#60a5fa", "#fbbf24", "#34d399", "#f472b6"][i % 5]} stroke={INK} strokeWidth="0.6" />);
  return (<g>
    <rect width="200" height="120" fill="#bae6fd" />
    <rect x="0" y="30" width="200" height="34" fill="#92400e" stroke={INK} strokeWidth="1.5" />
    {crowd}
    <Bunting y={16} />
    <rect x="0" y="64" width="200" height="56" fill="#d6b276" />
    <rect x="0" y="78" width="200" height="6" fill="#fff" stroke={INK} strokeWidth="1" />
    {[0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return (<rect key={i} x={i * 28} y="72" width="4" height="18" fill="#78350f" />); })}
    <g transform="translate(176 4)"><line x1="0" y1="0" x2="0" y2="28" stroke={INK} strokeWidth="1.5" /><path d="M0 2 L14 6 L0 10 Z" fill="#ef4444" /></g>
  </g>);
}

function Garden() {
  return (<g>
    <rect width="200" height="120" fill="#bae6fd" />
    <circle cx="30" cy="20" r="10" fill="#fde047" />
    <rect x="0" y="54" width="200" height="66" fill="#86efac" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(function (i) { return (<path key={i} d={"M" + (i * 16) + " 80 L" + (i * 16) + " 48 L" + (i * 16 + 5) + " 42 L" + (i * 16 + 10) + " 48 L" + (i * 16 + 10) + " 80 Z"} fill="#fff7ed" stroke={INK} strokeWidth="1" />); })}
    <rect x="0" y="58" width="200" height="4" fill="#fff7ed" stroke={INK} strokeWidth="0.8" />
    {[18, 46, 80, 120, 150, 182].map(function (x, i) { return (<g key={x}><line x1={x} y1="96" x2={x} y2="80" stroke="#15803d" strokeWidth="2" /><circle cx={x} cy="78" r="6" fill={["#f43f5e", "#facc15", "#a855f7", "#fb923c"][i % 4]} stroke={INK} strokeWidth="1" /><circle cx={x} cy="78" r="2" fill="#fef3c7" /></g>); })}
    <rect x="0" y="96" width="200" height="24" fill="#65a30d" />
    <rect x="150" y="98" width="30" height="14" fill="#c2410c" stroke={INK} strokeWidth="1" /><path d="M150 98 L180 98 L176 92 L154 92 Z" fill="#ea580c" stroke={INK} strokeWidth="1" />
  </g>);
}

function TeaRoom() {
  var dots = []; for (var y = 6; y < 70; y += 14) for (var x = 6; x < 200; x += 14) dots.push(<circle key={x + "-" + y} cx={x + (y % 28 ? 7 : 0)} cy={y} r="2.2" fill="#f9a8d4" />);
  return (<g>
    <rect width="200" height="120" fill="#fce7f3" />
    {dots}
    <rect x="140" y="12" width="40" height="30" rx="3" fill="#bae6fd" stroke={INK} strokeWidth="2" /><line x1="160" y1="12" x2="160" y2="42" stroke={INK} strokeWidth="1.5" />
    <rect x="0" y="80" width="200" height="40" fill="#fff" stroke={INK} strokeWidth="1.5" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return (<rect key={i} x={i * 20} y="80" width="10" height="40" fill="#fecdd3" />); })}
    <g transform="translate(150 60)"><ellipse cx="0" cy="16" rx="16" ry="12" fill="#fff" stroke={INK} strokeWidth="1.5" /><path d="M14 12 Q26 6 24 -2" fill="none" stroke={INK} strokeWidth="2" /><rect x="-5" y="2" width="10" height="5" rx="2" fill="#f472b6" stroke={INK} strokeWidth="1" /></g>
    <g transform="translate(34 76)"><path d="M-12 0 L12 0 L9 8 L-9 8 Z" fill="#fff" stroke={INK} strokeWidth="1.2" /><path d="M-10 -10 L10 -10 L8 0 L-8 0 Z" fill="#fbcfe8" stroke={INK} strokeWidth="1" /><circle cx="0" cy="-12" r="3" fill="#ef4444" /></g>
  </g>);
}

function Bakery() {
  return (<g>
    <rect width="200" height="120" fill="#fed7aa" />
    {[18, 44, 70].map(function (y) { return (<g key={y}><rect x="0" y={y} width="200" height="4" fill="#9a3412" stroke={INK} strokeWidth="0.8" />{[0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return (<ellipse key={i} cx={14 + i * 25} cy={y - 5} rx="10" ry="5.5" fill={["#d97706", "#f59e0b", "#b45309"][(i + y) % 3]} stroke={INK} strokeWidth="1" />); })}</g>); })}
    <rect x="0" y="86" width="200" height="34" fill="#fff7ed" stroke={INK} strokeWidth="1.5" />
    <rect x="0" y="86" width="200" height="6" fill="#ea580c" />
    <text x="100" y="108" fontSize="9" fontWeight="900" textAnchor="middle" fill="#9a3412" letterSpacing="2">FRESH TODAY · MOSTLY</text>
  </g>);
}

function Physio() {
  return (<g>
    <rect width="200" height="120" fill="#ccfbf1" />
    <rect x="18" y="10" width="34" height="44" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
    <circle cx="35" cy="20" r="5" fill="none" stroke={INK} strokeWidth="1.2" /><path d="M35 25 L35 42 M28 31 L42 31 M35 42 L30 50 M35 42 L40 50" stroke={INK} strokeWidth="1.2" fill="none" />
    <rect x="150" y="12" width="36" height="22" rx="3" fill="#fff" stroke={INK} strokeWidth="1.2" /><text x="168" y="27" fontSize="7" fontWeight="900" textAnchor="middle" fill="#0f766e">STRETCH!</text>
    <rect x="0" y="92" width="200" height="28" fill="#5eead4" />
    <rect x="110" y="70" width="80" height="12" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" /><rect x="116" y="82" width="4" height="14" fill={INK} /><rect x="180" y="82" width="4" height="14" fill={INK} />
    <circle cx="70" cy="62" r="9" fill="#fef9c3" stroke={INK} strokeWidth="1.2" /><text x="70" y="65" fontSize="8" textAnchor="middle">🩹</text>
  </g>);
}

function Kitchen() {
  return (<g>
    <rect width="200" height="120" fill="#fff7ed" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return [0, 1, 2].map(function (j) { return (<rect key={i + "-" + j} x={i * 20} y={50 + j * 10} width="20" height="10" fill={(i + j) % 2 ? "#fde68a" : "#fff"} stroke="#fcd34d" strokeWidth="0.6" />); }); })}
    <rect x="10" y="8" width="70" height="30" rx="2" fill="#a16207" stroke={INK} strokeWidth="1.5" /><line x1="45" y1="8" x2="45" y2="38" stroke={INK} />
    <rect x="130" y="10" width="40" height="28" rx="3" fill="#bae6fd" stroke={INK} strokeWidth="2" />
    <rect x="0" y="80" width="200" height="40" fill="#b45309" stroke={INK} strokeWidth="1.5" />
    <g transform="translate(160 66)"><ellipse cx="0" cy="12" rx="14" ry="5" fill="#374151" stroke={INK} strokeWidth="1" /><line x1="12" y1="10" x2="28" y2="6" stroke={INK} strokeWidth="2.5" /><ellipse cx="0" cy="9" rx="7" ry="3" fill="#fef3c7" /><circle cx="0" cy="9" r="2.2" fill="#facc15" /></g>
    <g transform="translate(30 72)"><circle cx="0" cy="0" r="8" fill="#ec4899" stroke={INK} strokeWidth="1" /><path d="M-6 -3 Q0 0 6 -3 M-7 2 Q0 5 7 2" stroke="#9d174d" strokeWidth="0.8" fill="none" /><line x1="4" y1="-10" x2="10" y2="6" stroke="#cbd5e1" strokeWidth="1.5" /></g>
  </g>);
}

function Fete() {
  return (<g>
    <rect width="200" height="120" fill="#bae6fd" />
    <Bunting y={8} />
    {[[30, "#ef4444"], [100, "#3b82f6"], [170, "#22c55e"]].map(function (t) { return (<g key={t[0]}><path d={"M" + (t[0] - 26) + " 70 L" + t[0] + " 34 L" + (t[0] + 26) + " 70 Z"} fill={t[1]} stroke={INK} strokeWidth="1.5" /><path d={"M" + (t[0] - 26) + " 70 L" + t[0] + " 34 L" + (t[0] - 8) + " 70 Z"} fill="#fff" opacity="0.5" /></g>); })}
    <rect x="0" y="70" width="200" height="50" fill="#86efac" />
    <rect x="60" y="78" width="80" height="14" rx="2" fill="#fff" stroke={INK} strokeWidth="1.2" /><text x="100" y="88" fontSize="7" fontWeight="900" textAnchor="middle" fill="#b91c1c">TOMBOLA · 20p</text>
  </g>);
}

function Salon() {
  return (<g>
    <rect width="200" height="120" fill="#e0e7ff" />
    <ellipse cx="60" cy="40" rx="26" ry="30" fill="#bfdbfe" stroke={INK} strokeWidth="2.5" /><ellipse cx="54" cy="32" rx="8" ry="12" fill="#fff" opacity="0.5" />
    <g transform="translate(150 20)"><ellipse cx="0" cy="14" rx="22" ry="16" fill="#c4b5fd" stroke={INK} strokeWidth="1.5" /><rect x="-3" y="28" width="6" height="40" fill="#6b7280" /></g>
    <rect x="0" y="88" width="200" height="32" fill="#4338ca" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return (<rect key={i} x={i * 20} y="88" width="10" height="32" fill="#3730a3" />); })}
  </g>);
}

function Library() {
  var books = []; for (var r = 0; r < 3; r++) for (var i = 0; i < 18; i++) books.push(<rect key={r + "-" + i} x={4 + i * 11} y={10 + r * 26} width="9" height="20" fill={["#b91c1c", "#1d4ed8", "#15803d", "#a16207", "#7c3aed"][(i * 3 + r) % 5]} stroke={INK} strokeWidth="0.6" />);
  return (<g><rect width="200" height="120" fill="#78350f" />{books}{[30, 56, 82].map(function (y) { return (<rect key={y} x="0" y={y} width="200" height="4" fill="#451a03" />); })}<rect x="0" y="92" width="200" height="28" fill="#a16207" /></g>);
}

function Bus() {
  return (<g>
    <rect width="200" height="120" fill="#cbd5e1" />
    {[0, 1, 2, 3].map(function (i) { return (<line key={i} x1={20 + i * 50} y1="0" x2={10 + i * 50} y2="120" stroke="#e2e8f0" strokeWidth="1" opacity="0.7" />); })}
    <rect x="120" y="20" width="70" height="60" rx="4" fill="#ef4444" stroke={INK} strokeWidth="2" /><rect x="126" y="28" width="58" height="20" fill="#bae6fd" stroke={INK} strokeWidth="1" /><text x="155" y="62" fontSize="8" fontWeight="900" textAnchor="middle" fill="#fff">No. 7</text>
    <g transform="translate(40 20)"><line x1="0" y1="0" x2="0" y2="70" stroke={INK} strokeWidth="2.5" /><rect x="-12" y="0" width="24" height="16" rx="3" fill="#facc15" stroke={INK} strokeWidth="1.5" /><text x="0" y="11" fontSize="7" fontWeight="900" textAnchor="middle">BUS</text></g>
    <rect x="0" y="90" width="200" height="30" fill="#6b7280" /><rect x="0" y="104" width="200" height="3" fill="#fff" opacity="0.7" />
  </g>);
}

function Gym() {
  return (<g>
    <rect width="200" height="120" fill="#dbeafe" />
    <rect x="0" y="60" width="200" height="60" fill="#38bdf8" /><path d="M0 64 Q25 60 50 64 T100 64 T150 64 T200 64" fill="none" stroke="#e0f2fe" strokeWidth="2" />
    {[20, 60, 100, 140, 180].map(function (x) { return (<line key={x} x1={x} y1="60" x2={x} y2="120" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="4 4" />); })}
    <rect x="10" y="12" width="60" height="18" rx="3" fill="#fff" stroke={INK} strokeWidth="1.2" /><text x="40" y="24" fontSize="7" fontWeight="900" textAnchor="middle" fill="#1d4ed8">AQUA AEROBICS</text>
    <g transform="translate(160 40)"><circle cx="0" cy="0" r="9" fill="none" stroke="#ef4444" strokeWidth="4" /><circle cx="0" cy="0" r="9" fill="none" stroke="#fff" strokeWidth="4" strokeDasharray="7 7" /></g>
  </g>);
}

function Farm() {
  return (<g>
    <rect width="200" height="120" fill="#fef9c3" />
    <path d="M0 60 Q50 44 100 58 T200 54 L200 120 L0 120 Z" fill="#a3e635" />
    <g transform="translate(140 22)"><rect x="0" y="16" width="44" height="36" fill="#b91c1c" stroke={INK} strokeWidth="1.5" /><path d="M-4 18 L22 0 L48 18 Z" fill="#7f1d1d" stroke={INK} strokeWidth="1.5" /><rect x="14" y="30" width="16" height="22" fill="#fff" stroke={INK} strokeWidth="1" /><path d="M14 30 L30 52 M30 30 L14 52" stroke={INK} strokeWidth="1" /></g>
    {[10, 30, 50, 70, 90].map(function (x) { return (<path key={x} d={"M" + x + " 96 L" + (x + 4) + " 80 L" + (x + 8) + " 96"} fill="none" stroke="#ca8a04" strokeWidth="2" />); })}
    <rect x="0" y="98" width="200" height="22" fill="#854d0e" opacity="0.6" />
  </g>);
}

export var SCENE_ART = { bingo: Bingo, beach: Beach, lanes: Lanes, garden: Garden, tea: TeaRoom, bakery: Bakery, physio: Physio, kitchen: Kitchen, fete: Fete, hair: Salon, library: Library, bus: Bus, gym: Gym, farm: Farm };

export function SceneArt(props) {
  var A = SCENE_ART[props.k] || Lanes;
  return (<svg viewBox="0 0 200 120" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}><A /></svg>);
}
