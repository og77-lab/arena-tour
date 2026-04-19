/* ═══ RankSparkline ═══ Inline SVG trend chart of the player's rank over the last 20 events */

export default function RankSparkline(props) {
  var hist = props.history || [];
  if (hist.length < 2) return null;
  var pts = hist.slice(-20);
  var W = 260, H = 44;
  var min = Math.min.apply(null, pts);
  var max = Math.max.apply(null, pts);
  var range = Math.max(1, max - min);
  /* Lower rank number = better, so invert y (higher-on-chart = better rank) */
  var coords = pts.map(function(r, i){
    return {
      x: (i / Math.max(1, pts.length - 1)) * W,
      y: 6 + ((r - min) / range) * (H - 12)
    };
  });
  var pathLine = coords.map(function(p, i){ return (i === 0 ? "M" : "L") + p.x.toFixed(1) + "," + p.y.toFixed(1); }).join(" ");
  var pathArea = pathLine + " L" + W + "," + H + " L0," + H + " Z";
  /* Improving = newer rank is a smaller number */
  var improving = pts[pts.length - 1] <= pts[0];
  var color = improving ? "#22c55e" : "#ef4444";
  var last = coords[coords.length - 1];
  var first = pts[0], latest = pts[pts.length - 1];
  var delta = first - latest;
  return (
    <div style={{ background: "#ffffff", borderRadius: 10, padding: "8px 12px", marginBottom: 6, border: "1px solid #f8fafc", display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Trend</div>
        <div style={{ fontSize: 15, color: color, fontWeight: 800, marginTop: 1 }}>
          {delta > 0 ? "▲ " + delta : delta < 0 ? "▼ " + Math.abs(delta) : "— 0"}
        </div>
        <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600 }}>last {pts.length} events</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <svg viewBox={"0 0 " + W + " " + H} preserveAspectRatio="none" style={{ width: "100%", height: 40, display: "block" }}>
          <path d={pathArea} fill={color} fillOpacity={0.18} />
          <path d={pathLine} stroke={color} strokeWidth={1.8} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
          <circle cx={last.x} cy={last.y} r={6} fill={color} fillOpacity={0.25} />
        </svg>
      </div>
    </div>
  );
}
