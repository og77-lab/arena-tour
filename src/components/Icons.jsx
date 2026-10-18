/* ═══ Icons ═══ The game's own icon set for the interface (stats, money, tabs, rows): drawn on a 24-grid in the riders'
   ink (brown outline, warm flat colour, one soft highlight), so every phone shows the same thing. Emojis stay where
   they belong — inside the jokes (knits, the paper, the interview). */

var INK = "#3f2a1d", SW = 1.6;
var P = { stroke: INK, strokeWidth: SW, strokeLinejoin: "round", strokeLinecap: "round" };

var DRAW = {
  trophy: (<g><path d="M7 4h10v4a5 5 0 0 1-10 0z" fill="#facc15" {...P} /><path d="M7 6H4.5a2.5 2.5 0 0 0 2.6 3.2M17 6h2.5a2.5 2.5 0 0 1-2.6 3.2" fill="none" {...P} /><path d="M10.5 13h3l.6 3.5h-4.2z" fill="#f59e0b" {...P} /><rect x="7.5" y="16.5" width="9" height="3.5" rx="1" fill="#b45309" {...P} /><path d="M9.3 5.5v2.2" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" /></g>),
  coin: (<g><circle cx="12" cy="12" r="8.5" fill="#fbbf24" {...P} /><circle cx="12" cy="12" r="5.8" fill="none" stroke="#b45309" strokeWidth="1.2" /><path d="M13.6 9.6c-.4-.6-1-.9-1.7-.9-1 0-1.7.6-1.7 1.4 0 1.9 3.5 1 3.5 2.9 0 .8-.8 1.5-1.8 1.5-.8 0-1.4-.3-1.8-.9M12 7.6v1.1M12 15.4v1.1" fill="none" stroke={INK} strokeWidth="1.4" strokeLinecap="round" /></g>),
  dumbbell: (<g><rect x="2.5" y="8" width="3.5" height="8" rx="1.2" fill="#64748b" {...P} /><rect x="18" y="8" width="3.5" height="8" rx="1.2" fill="#64748b" {...P} /><rect x="6" y="9.5" width="2.5" height="5" rx="0.8" fill="#94a3b8" {...P} /><rect x="15.5" y="9.5" width="2.5" height="5" rx="0.8" fill="#94a3b8" {...P} /><path d="M8.5 12h7" stroke={INK} strokeWidth="2.6" strokeLinecap="round" /></g>),
  heart: (<g><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#f43f5e" {...P} /><path d="M8 9.6a2 2 0 0 1 2-1.6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.85" fill="none" /></g>),
  yarn: (<g><circle cx="11" cy="12.5" r="7.5" fill="#22d3ee" {...P} /><path d="M5 10c3 .5 7 3 9.5 7.5M6.5 16.5c1.5-3.5 5.5-7 10.5-7.5M9 5.6c2.5 2 4.5 6 4.5 13.3" fill="none" stroke="#0e7490" strokeWidth="1.2" strokeLinecap="round" /><path d="M17.5 17.5c1.5 1 3 1.4 4 .8" fill="none" {...P} /></g>),
  granny: (<g><circle cx="12" cy="13" r="6.5" fill="#fcd9b6" {...P} /><path d="M5.6 11.5c.3-4 3-6.3 6.4-6.3s6.1 2.3 6.4 6.3c-1.6-1.7-3.5-2.3-6.4-2.3s-4.8.6-6.4 2.3z" fill="#e5e7eb" {...P} /><circle cx="12" cy="4.5" r="2" fill="#e5e7eb" {...P} /><circle cx="9.6" cy="13.4" r="1.6" fill="none" stroke={INK} strokeWidth="1.2" /><circle cx="14.4" cy="13.4" r="1.6" fill="none" stroke={INK} strokeWidth="1.2" /><path d="M10.5 16.6c.9.6 2.1.6 3 0" fill="none" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /><circle cx="7.9" cy="15.6" r="1.1" fill="#fb7185" opacity="0.7" /><circle cx="16.1" cy="15.6" r="1.1" fill="#fb7185" opacity="0.7" /></g>),
  rooster: (<g><path d="M6.5 13.5C4 12 2.8 9 3.5 6.2 5.3 7.7 6.4 9.7 6.8 11.6 7 8.7 8 6.4 9.6 5c.4 2.4.2 4.8-.4 6.8" fill="#15803d" {...P} /><path d="M7 20.5c-2-1.6-2.6-4.2-1.6-6.6 1.1-2.6 3.6-4.1 6.4-4l.6-2.8c.3-1.4 1.5-2.3 2.9-2.1 1.6.2 2.7 1.7 2.4 3.3l-.4 2.4 2.2 1.1-2.3.9c-.3 4.4-4.4 8.5-10.2 7.8z" fill="#f97316" {...P} /><path d="M14 5.5c-.5-1.4.2-2.6 1.4-2.9.2 1 .7 1.4 1.5 1.5-.1 1.1-.7 1.8-1.6 2" fill="#ef4444" {...P} /><path d="M18.3 9.6l2.6.7-2.5 1.2" fill="#facc15" {...P} /><circle cx="16" cy="8.4" r="0.95" fill={INK} /><path d="M17.5 11.6c.5 1.1.2 2.1-.7 2.6" fill="#ef4444" {...P} /><path d="M9 15.5c1.4.6 3 .5 4.3-.4" fill="none" stroke="#c2410c" strokeWidth="1.3" strokeLinecap="round" /><path d="M9.5 20.5v2M12 20.3v2.2" {...P} /></g>),
  battery: (<g><rect x="3" y="7" width="16" height="10" rx="2.2" fill="#fff" {...P} /><rect x="19" y="10" width="2.4" height="4" rx="0.8" fill={INK} /><rect x="5" y="9" width="9" height="6" rx="1" fill="#22c55e" /><path d="M11 8.6l-2.4 3.6h2.2l-1.2 3.4" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></g>),
  calendar: (<g><rect x="3.5" y="5" width="17" height="15" rx="2.5" fill="#fff" {...P} /><path d="M3.5 9.5h17" stroke={INK} strokeWidth={SW} /><rect x="3.5" y="5" width="17" height="4.5" rx="2" fill="#ef4444" {...P} /><path d="M8 3.5v3M16 3.5v3" {...P} /><circle cx="8.5" cy="13.5" r="1.1" fill={INK} /><circle cx="12" cy="13.5" r="1.1" fill={INK} /><circle cx="15.5" cy="13.5" r="1.1" fill="#f59e0b" /><circle cx="8.5" cy="17" r="1.1" fill={INK} /></g>),
  paper: (<g><path d="M4 5.5h13v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="#f4ecd8" {...P} /><path d="M17 8.5h2.5V18a2.5 2.5 0 0 1-2.5 2.5" fill="#e7dcc0" {...P} /><path d="M6.5 8.5h8" stroke={INK} strokeWidth="2" strokeLinecap="round" /><rect x="6.5" y="11" width="4" height="4" fill="#94a3b8" stroke={INK} strokeWidth="1" /><path d="M12 11.5h2.5M12 14h2.5M6.5 17.5h8" stroke={INK} strokeWidth="1.2" strokeLinecap="round" /></g>),
  medal: (<g><path d="M8 3.5h3l2 6h-3zM16 3.5h-3l-2 6h3z" fill="#3b82f6" {...P} /><circle cx="12" cy="15" r="5.5" fill="#fbbf24" {...P} /><path d="M12 12.2l.9 1.8 2 .3-1.4 1.4.3 2-1.8-1-1.8 1 .3-2-1.4-1.4 2-.3z" fill="#fff" stroke="#b45309" strokeWidth="0.8" strokeLinejoin="round" /></g>),
  chart: (<g><rect x="3.5" y="4" width="17" height="16" rx="2.5" fill="#fff" {...P} /><path d="M6.5 16l3.5-4 3 2.5 4.5-6" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><circle cx="17.5" cy="8.5" r="1.4" fill="#16a34a" /></g>),
  lances: (<g><path d="M4 20L16.5 7.5M20 20L7.5 7.5" stroke="#a16207" strokeWidth="2.6" strokeLinecap="round" /><path d="M16.5 7.5l3-4 .5.5-4 3zM7.5 7.5l-3-4-.5.5 4 3z" fill="#e5e7eb" {...P} /><circle cx="12" cy="13.8" r="2.3" fill="#ef4444" {...P} /></g>),
  crown: (<g><path d="M4 17.5L3 8l5 4 4-6.5 4 6.5 5-4-1 9.5z" fill="#facc15" {...P} /><rect x="4" y="17.5" width="16" height="2.5" rx="1" fill="#f59e0b" {...P} /><circle cx="12" cy="13.5" r="1.4" fill="#ef4444" /></g>),
  rank: (<g><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z" fill="#facc15" {...P} /></g>),
  home: (<g><path d="M4 11L12 4l8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 19.5z" fill="#fde68a" {...P} /><path d="M3 11.8L12 4l9 7.8" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><rect x="10" y="14" width="4" height="7" rx="1" fill="#a16207" {...P} /></g>),
  gear: (<g><path d="M12 3.5l1.6 1.9 2.4-.5.6 2.4 2.3 1-.9 2.3 1.5 2-2 1.5.2 2.4-2.4.4-1 2.3-2.2-1-2.2 1-1-2.3-2.4-.4.2-2.4-2-1.5 1.5-2-.9-2.3 2.3-1 .6-2.4 2.4.5z" fill="#94a3b8" {...P} /><circle cx="12" cy="12.4" r="2.8" fill="#fff" {...P} /></g>),
  target: (<g><circle cx="12" cy="12" r="8.5" fill="#fff" {...P} /><circle cx="12" cy="12" r="5.5" fill="#ef4444" {...P} /><circle cx="12" cy="12" r="2.4" fill="#fff" stroke={INK} strokeWidth="1.2" /><path d="M19.5 4.5l-6.6 6.6" stroke={INK} strokeWidth="1.8" strokeLinecap="round" /><path d="M17.5 3.5l2.5 1 1 2.5" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></g>),
  shield: (<g><path d="M12 3l7.5 2.8v5.6c0 4.6-3.2 8-7.5 9.6-4.3-1.6-7.5-5-7.5-9.6V5.8z" fill="#a78bfa" {...P} /><path d="M12 3v18" stroke="#7c3aed" strokeWidth="1.2" /><path d="M8 8.2c.6-.5 1.4-.9 2.2-1.1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" fill="none" /></g>),
  stamina: (<g><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" fill="#fb923c" {...P} /><path d="M5.5 12.2h3.2l1.4-2.6 2.2 5 1.6-3.4h4.6" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></g>),
  paw: (<g><ellipse cx="12" cy="15.5" rx="4.6" ry="3.9" fill="#f472b6" {...P} /><ellipse cx="6.2" cy="10.4" rx="1.9" ry="2.4" fill="#f472b6" {...P} /><ellipse cx="9.8" cy="6.8" rx="1.9" ry="2.5" fill="#f472b6" {...P} /><ellipse cx="14.2" cy="6.8" rx="1.9" ry="2.5" fill="#f472b6" {...P} /><ellipse cx="17.8" cy="10.4" rx="1.9" ry="2.4" fill="#f472b6" {...P} /></g>),
  chevron: (<g><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>),
  bolt: (<g><path d="M13.5 2.5L5 13.5h6l-1.5 8 8.5-11h-6z" fill="#facc15" {...P} /></g>)
};

export default function Icon(props) {
  var s = props.size || 22;
  return (<svg aria-hidden viewBox="0 0 24 24" width={s} height={s} style={Object.assign({ display: "inline-block", flexShrink: 0, verticalAlign: "middle", overflow: "visible" }, props.style || {})}>{DRAW[props.name] || null}</svg>);
}

/* A rounded tile with a soft tint behind an icon (list rows, stat chips) */
export function IconTile(props) {
  var s = props.size || 40;
  return (<span aria-hidden style={{ width: s, height: s, borderRadius: s * 0.32, background: props.tint || "#fef3c7", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "inset 0 -2px 0 rgba(63,42,29,0.06)" }}><Icon name={props.name} size={s * 0.62} /></span>);
}

/* The six stats as icons (Reflexes, Aim, Stubbornness, Stamina, Steady Stride, Bounce-back) */
export var STAT_ICON = { r: "bolt", f: "target", g: "shield", s: "stamina", p: "paw", b: "battery" };
export function StatIcon(props) { return (<Icon name={STAT_ICON[props.k] || "bolt"} size={props.size || 18} style={props.style} />); }
