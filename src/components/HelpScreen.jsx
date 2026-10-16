/* ═══ HelpScreen ═══ "How to Play" overlay with strike mechanic, NPC scores, training explanation */

import { bs } from "../models/formulas";
import { STATS } from "../models/constants";

export default function HelpScreen(props) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 999, overflowY: "auto", padding: 16 }} onClick={props.onClose}>
      <div style={{ maxWidth: 360, margin: "0 auto", background: "#ffffff", borderRadius: 14, padding: 16, border: "1px solid #e5e7eb" }} onClick={function(e){e.stopPropagation();}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#b45309" }}>🐓 How To Play</span>
          <button onClick={props.onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#b45309", fontWeight: 700, marginBottom: 6 }}>THE STRIKE SYSTEM</div>
          <div style={{ fontSize: 14, color: "#4338ca", lineHeight: 1.6, marginBottom: 8 }}>
            A cursor bounces left-right across the power bar. Tap <b style={{color:"#ef4444"}}>STRIKE</b> (or press Space) to stop it. Your score depends on where it lands:
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
              { zone: "🎯 Centre line", score: "100", col: "#16a34a", desc: "Perfect!" },
              { zone: "Gold zone, towards its edge", score: "99 — 85", col: "#22c55e", desc: "The closer, the more" },
              { zone: "Just outside the gold", score: "70", col: "#eab308", desc: "A sharp drop" },
              { zone: "Further out", score: "70 → floor", col: "#ef4444", desc: "Falls as you stray" }
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
            <b style={{color:"#0f172a"}}>Your opponent strikes on the same bar</b>, scored the same way — her red ▲ shows where she landed. The more talented she is, the closer to the centre she tends to hit; Aim adds points on top of your score, Stubbornness raises your lowest possible score.
          </div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, marginTop: 6 }}>
            Matches are played in <b style={{color:"#0f172a"}}>sets</b>. Each set is <b style={{color:"#0f172a"}}>3 strikes</b> — the <b style={{color:"#22c55e"}}>higher average takes the set</b>, so one bad strike can still be rescued.
          </div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5, marginTop: 6 }}>
            Win the majority of sets to win the match: <b style={{color:"#0f172a"}}>best of 3</b> in Futures → Tour 500, <b style={{color:"#0f172a"}}>best of 5</b> in Masters, Grand Slams and the Season Finals.
          </div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginTop: 6 }}>
            Progress is saved after every strike — close the game mid-match and you'll pick up exactly where you left off. For every rule and number, open <b style={{color:"#0f172a"}}>📖 Game Guide</b> in the More tab.
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
              { what: "Acceleration", desc: "Bar speeds up strike by strike, resets each set", icon: "📈" },
              { what: "Fatigue", desc: "Every new set starts a little faster than the last", icon: "🥵" }
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
            {STATS.map(function(s, i, all) {
              var head = i === 0 || all[i - 1].who !== s.who;
              return (<div key={s.k}>{head && (<div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 1, color: "#57534e", margin: i ? "6px 0 2px" : "0 0 2px" }}>{s.who === "granny" ? "👵 GRANNY — rider skills" : "🐓 ROOSTER — mount conditioning"}</div>)}<div style={{ fontSize: 13, padding: "2px 0", color: "#475569" }}><b style={{color:"#0f172a"}}>{s.icon} {s.label}</b> — {s.what}. <i>Each level ahead: {s.per.charAt(0).toLowerCase() + s.per.slice(1)}.</i></div></div>);
            })}
          </div>
          <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>Example: You have ⚡8, opponent has ⚡5 → net +3 → bar is noticeably slower for you. If both are ⚡8 → cancels out completely.</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, color: "#be123c", fontWeight: 700, marginBottom: 4 }}>❤️ THE CROWD</div>
          <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.5 }}>
            Fans (0–100) love wins — especially clean sweeps, comebacks, upsets and titles — and slowly forget you if you go quiet. After every tournament the press asks you a question: <b style={{color:"#0f172a"}}>how the crowd takes your answer depends on who's asking and how your week went</b>, so read the room. Big promises get checked the following week.
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 1.5 }}>Fans pay off: sponsors add training points every week, 70+ earns a wildcard into the tier above, 80+ a Grand Slam wildcard, and with the match on the line a loud crowd widens your gold zone.</div>
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
