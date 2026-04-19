/* ═══ Confetti ═══ Full-screen emoji particle burst (used on tournament title wins) */

export default function Confetti() {
  var pieces = [];
  var emojis = ["🎉","⭐","🏆","💫","✨","🎊"];
  var colors = ["#facc15","#22c55e","#3b82f6","#ef4444","#a855f7","#f472b6"];
  for (var i = 0; i < 48; i++) {
    pieces.push({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      duration: 1.8 + Math.random() * 1.6,
      emoji: emojis[i % emojis.length],
      color: colors[i % colors.length],
      size: 18 + Math.random() * 14
    });
  }
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 9999, overflow: "hidden" }}>
      {pieces.map(function(p){
        return (
          <div key={p.id} style={{
            position: "absolute",
            left: p.left + "%",
            top: 0,
            fontSize: p.size,
            color: p.color,
            animation: "confetti-fall " + p.duration + "s cubic-bezier(0.2,0.7,0.4,1) " + p.delay + "s forwards",
            willChange: "transform, opacity"
          }}>{p.emoji}</div>
        );
      })}
    </div>
  );
}
