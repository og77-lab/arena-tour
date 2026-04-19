/* ═══ HelpScreen ═══ "How to Play" overlay with strike mechanic, NPC scores, training explanation */

import { bs } from "../models/formulas";

export default function HelpScreen(props) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 999, overflowY: "auto", padding: 16 }} onClick={props.onClose}>
      <div style={{ maxWidth: 360, margin: "0 auto", background: "#ffffff", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }} onClick={function(e){e.stopPropagation();}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#b45309" }}>⚔️ How To Play</span>
          <button onClick={props.onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#b45309", fontWeight: 700, marginBottom: 6 }}>THE STRIKE SYSTEM</div>
          <div style={{ fontSize: 14, color: "#4338ca", lineHeight: 1.6, marginBottom: 8 }}>
            Each match is <b style={{color:"#0f172a"}}>3 strikes</b>. A white cursor bounces left-right across the power bar. Tap <b style={{color:"#ef4444"}}>STRIKE</b> to stop it. Your score depends on where it lands:
          </div>
          <div style={{ background: "#ffffff", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ position: "relative", height: 24, background: "linear-gradient(90deg,#e2e8f0,#ffffff,#e2e8f0)", borderRadius: 12, overflow: "hidden", marginBottom: 8, border: "1px solid #94a3b8" }}>
              <div style={{ position: "absolute", top: 2, bottom: 2, left: "62%", width: "16%", background: "rgba(250,204,21,0.3)", borderRadius: 8, border: "1px solid rgba(250,204,21,0.4)" }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, width: 3, left: "70%", background: "#b45309", borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ color: "#ef4444" }}>← Far miss</span>
              <span style={{ color: "#eab308" }}>Near →</span>
              <span style={{ color: "#b45309", fontWeight: 700 }}>GOLD ZONE</span>
            </div>
            {[
              { zone: "🎯 Gold zone (center)", score: "88 — 100", col: "#22c55e", desc: "Perfect timing!" },
              { zone: "Near miss (just outside)", score: "65 — 77", col: "#eab308", desc: "Decent, can still win" },
              { zone: "Medium miss", score: "55 — 67", col: "#f59e0b", desc: "Risky against good NPCs" },
              { zone: "Far miss", score: "25 — 50", col: "#ef4444", desc: "Almost certainly loses" }
            ].map(function(r, i) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: i < 3 ? "1px solid #f8fafc" : "none" }}>
                  <span style={{ fontSize: 13, color: "#475569", flex: 1 }}>{r.zone}</span>
                  <span style={{ fontSize: 14, color: r.col, fontWeight: 700, width: 60, textAlign: "center" }}>{r.score}</span>
                  <span style={{ fontSize: 13, color: "#94a3b8", width: 70, textAlign: "right" }}>{r.desc}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
            After 3 strikes, your <b style={{color:"#0f172a"}}>average</b> is compared to the NPC's average. <b style={{color:"#22c55e"}}>Higher average wins.</b>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#0891b2", fontWeight: 700, marginBottom: 4 }}>NPC SCORES</div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
            NPCs auto-generate scores based on their <b style={{color:"#0f172a"}}>natural talent</b> + <b style={{color:"#7c3aed"}}>training</b>. You never see their bar — just their final scores.
          </div>
          <div style={{ background: "#ffffff", borderRadius: 6, padding: 6, marginTop: 6 }}>
            {[
              { tier: "Futures", range: "49 — 63", col: "#475569" },
              { tier: "Challenger", range: "58 — 72", col: "#22c55e" },
              { tier: "Tour 250", range: "65 — 79", col: "#0891b2" },
              { tier: "Tour 500", range: "72 — 86", col: "#4f46e5" },
              { tier: "Masters", range: "78 — 92", col: "#db2777" },
              { tier: "Grand Slam", range: "78 — 95", col: "#b45309" }
            ].map(function(r, i) {
              return (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px", fontSize: 13 }}><span style={{ color: r.col, fontWeight: 600 }}>{r.tier}</span><span style={{ color: "#0f172a" }}>{r.range}</span></div>);
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#db2777", fontWeight: 700, marginBottom: 4 }}>WHAT GETS HARDER</div>
          <div style={{ background: "#ffffff", borderRadius: 6, padding: 6 }}>
            {[
              { what: "Bar speed", desc: "Cursor moves faster → harder to time", icon: "⚡" },
              { what: "Gold zone", desc: "Target shrinks → less room for error", icon: "🎯" },
              { what: "NPC scores", desc: "Higher tier = stronger opponents", icon: "💀" },
              { what: "Acceleration", desc: "Bar speeds up between strikes 1→2→3", icon: "📈" }
            ].map(function(r, i) {
              return (<div key={i} style={{ display: "flex", gap: 6, padding: "3px 0", fontSize: 13 }}><span>{r.icon}</span><span><b style={{color:"#0f172a"}}>{r.what}</b><span style={{color:"#475569"}}> — {r.desc}</span></span></div>);
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700, marginBottom: 4 }}>TRAINING (RELATIVE)</div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
            Your 5 training stats are compared <b style={{color:"#b45309"}}>against your opponent's</b> each match. Only the <b style={{color:"#0f172a"}}>difference</b> matters:
          </div>
          <div style={{ background: "#ffffff", borderRadius: 6, padding: 6, marginTop: 4 }}>
            {[
              { stat: "⚡ Reflexes", effect: "Slows/speeds bar relative to opponent" },
              { stat: "💪 Power", effect: "Widens/shrinks gold zone relative to opponent" },
              { stat: "🎯 Focus", effect: "Adds/subtracts from your strike score" },
              { stat: "🫀 Stamina", effect: "Reduces bar acceleration between strikes" },
              { stat: "🛡️ Grit", effect: "Raises your minimum score on bad misses" }
            ].map(function(r, i) {
              return (<div key={i} style={{ fontSize: 13, padding: "2px 0", color: "#475569" }}><b style={{color:"#0f172a"}}>{r.stat}</b> — {r.effect}</div>);
            })}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Example: You have ⚡8, opponent has ⚡5 → net +3 → bar is noticeably slower for you. If both are ⚡8 → cancels out completely.</div>
        </div>

        <div>
          <div style={{ fontSize: 13, color: "#22c55e", fontWeight: 700, marginBottom: 4 }}>POINTS & RANKINGS</div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
            Win matches to earn points. <b style={{color:"#ef4444"}}>R1 losers get nothing</b> — you must win to earn. Higher tiers pay more. Rankings update after each event based on total season points. In season 2+, you <b style={{color:"#f59e0b"}}>defend</b> last season's points at each calendar slot.
          </div>
        </div>

        <button onClick={props.onClose} style={Object.assign({}, bs("linear-gradient(135deg,#facc15,#f59e0b)", "#000"), { width: "100%", marginTop: 12 })}>Got it!</button>
      </div>
    </div>
  );
}
