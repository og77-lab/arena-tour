/* ═══ Profile ═══ Player/NPC profile modal: stats, talent bar, training, h2h, career timeline */

import { TIERS, RN5, RN6 } from "../models/constants";

export default function Profile(props) {
  var p = props.player; var rank = props.rank; var onClose = props.onClose;
  if (!p) return null;
  var t = p.tr || {};
  var totalTr = (t.r||0)+(t.p||0)+(t.f||0)+(t.s||0)+(t.g||0);
  var b = p.best || {};
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#ffffff", borderRadius: 14, padding: 18, maxWidth: 360, width: "100%", border: "1px solid #e5e7eb", maxHeight: "80vh", overflowY: "auto" }} onClick={function(e){e.stopPropagation();}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div><span style={{ fontSize: 20 }}>{p.emoji || "👤"}</span><span style={{ fontSize: 16, fontWeight: 800, color: p.isP ? "#b45309" : "#0f172a", marginLeft: 8 }}>{p.isP ? (props.playerName || "You") : p.name}</span></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[{ l: "Current Rank", v: "#" + rank, c: rank <= 10 ? "#b45309" : rank <= 50 ? "#22c55e" : "#475569" },
            { l: "Peak Rank", v: "#" + (b.rank < 1001 ? b.rank : "—"), c: "#4f46e5" },
            { l: "Season Pts", v: (p.sp||0).toLocaleString(), c: "#0891b2" },
            { l: "All-Time Pts", v: (p.ap||0).toLocaleString(), c: "#db2777" },
            { l: "Season Prize $", v: "$"+(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(p.isP?(p.seasonMoney||0):(Math.round((p.sp||0)*3))), c: "#22c55e" },
            { l: "Career Prize $", v: "$"+(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(p.isP?(p.money||0):((b.careerMoney||0))), c: "#16a34a" }
          ].map(function (s, i) {
            return (<div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "6px 8px" }}><div style={{ fontSize: 13, color: "#64748b", marginBottom: 1 }}>{s.l}</div><div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div></div>);
          })}
        </div>
        {/* Skill + Potential bar for NPCs */}
        {!p.isP && (
          <div style={{ marginBottom: 10, padding: 8, background: "#ffffff", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
              <span style={{ color: "#475569", fontWeight: 700 }}>Natural Talent</span>
              <span style={{ fontSize: 14 }}>
                <span style={{ color: "#0f172a", fontWeight: 800 }}>{Math.round(p.skill||0)}</span>
                <span style={{ color: "#94a3b8" }}> / </span>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{p.pot||92}</span>
                <span style={{ color: "#94a3b8", fontSize: 13, marginLeft: 3 }}>potential</span>
              </span>
            </div>
            <div style={{ position: "relative", height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}>
              {/* Potential ceiling marker */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: Math.round((p.pot||92)/95*100) + "%", borderRadius: 5, background: "rgba(245,158,11,0.12)", borderRight: "2px solid rgba(245,158,11,0.4)" }} />
              {/* Current skill fill */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: Math.round((p.skill||0)/95*100) + "%", borderRadius: 5, background: (p.skill||0) > 80 ? "linear-gradient(90deg,#ef4444,#f59e0b)" : (p.skill||0) > 60 ? "linear-gradient(90deg,#f59e0b,#facc15)" : (p.skill||0) > 40 ? "linear-gradient(90deg,#0891b2,#4f46e5)" : "#475569" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              <span>Developing</span><span>Average</span><span>Strong</span><span>Elite</span>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
              {Math.round(p.skill||0) >= (p.pot||92) - 1 ? (
                <span style={{color:"#f59e0b"}}>⚡ At peak potential — this warrior has maxed out their natural talent.</span>
              ) : (
                <span>Room to grow: <span style={{color:"#f59e0b"}}>{Math.round((p.pot||92) - (p.skill||0))}</span> points until peak potential.</span>
              )}
            </div>
          </div>
        )}
        {/* Training + training total */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 14, color: "#64748b", fontWeight: 700 }}>TRAINING LEVELS</span>
            <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700 }}>{totalTr}/100</span>
          </div>
          {[{k:"r",i:"⚡",l:"Reflexes",c:"#0891b2"},{k:"p",i:"💪",l:"Power",c:"#db2777"},{k:"f",i:"🎯",l:"Focus",c:"#16a34a"},{k:"s",i:"🫀",l:"Stamina",c:"#ea580c"},{k:"g",i:"🛡️",l:"Grit",c:"#7c3aed"}].map(function(s){
            var lv = t[s.k]||0;
            return (<div key={s.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ color: s.c, fontSize: 13, width: 70 }}>{s.i} {s.l}</span><div style={{ flex: 1, display: "flex", gap: 1 }}>{Array.from({length:20}).map(function(_,i){return (<div key={i} style={{flex:1,height:5,borderRadius:2,background:i<lv?s.c:"#f1f5f9"}}/>);})}</div><span style={{fontSize:14,color:"#475569",width:20,textAlign:"right"}}>{lv}</span></div>);
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[{ l: "🏆 Titles", v: b.titles||0 }, { l: "👑 GS Titles", v: b.gsTitles||0 }, { l: "⭐ Finals", v: b.finals||0 }].map(function(s,i){
            return (<div key={i} style={{ background: "#ffffff", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}><div style={{ fontSize: 16, fontWeight: 800, color: "#b45309" }}>{s.v}</div><div style={{ fontSize: 13, color: "#64748b" }}>{s.l}</div></div>);
          })}
        </div>
        {/* Head-to-Head */}
        {!p.isP && props.h2h && props.h2h.length > 0 && (function(){
          var wins = 0, losses = 0;
          for (var hi = 0; hi < props.h2h.length; hi++) { if (props.h2h[hi].w) wins++; else losses++; }
          var last5 = props.h2h.slice(-5).reverse();
          return (
            <div style={{ marginTop: 10, padding: 8, background: "#ffffff", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>Head-to-Head</span>
                <span style={{ fontSize: 14, fontWeight: 800 }}>
                  <span style={{ color: "#22c55e" }}>{wins}W</span>
                  <span style={{ color: "#94a3b8", margin: "0 3px" }}>–</span>
                  <span style={{ color: "#ef4444" }}>{losses}L</span>
                </span>
              </div>
              {last5.map(function(e, i){
                var tierInfo = TIERS[e.tier] || TIERS[0];
                var rNames6 = tierInfo.rounds === 6 ? RN6 : RN5;
                var rName = rNames6[Math.min(e.round, tierInfo.rounds - 1)] || ("R" + (e.round + 1));
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", borderRadius: 4, background: i % 2 === 0 ? "#f8fafc" : "transparent", marginBottom: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                      <span style={{ width: 18, height: 18, borderRadius: 4, background: e.w ? "#22c55e" : "#ef4444", color: "#000", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{e.w ? "W" : "L"}</span>
                      <span style={{ fontSize: 12, color: tierInfo.col, fontWeight: 700 }}>{tierInfo.short}</span>
                      <span style={{ fontSize: 12, color: "#475569" }}>{rName}</span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>S{e.s}</span>
                    </div>
                    {e.ma != null && e.oa != null && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#334155", letterSpacing: 0.5 }}>
                        <span style={{ color: e.w ? "#22c55e" : "#334155" }}>{e.ma}</span>
                        <span style={{ color: "#94a3b8", margin: "0 3px" }}>–</span>
                        <span style={{ color: e.w ? "#334155" : "#ef4444" }}>{e.oa}</span>
                      </span>
                    )}
                  </div>
                );
              })}
              {props.h2h.length > 5 && (
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 4 }}>showing last 5 of {props.h2h.length} meetings</div>
              )}
            </div>
          );
        })()}
        {/* Career timeline (player only) */}
        {p.isP && props.timeline && props.timeline.length > 0 && (function(){
          var events = props.timeline.slice().reverse();
          var shown = events.slice(0, 12);
          var iconFor = function(t){ return t === "title" ? "🏆" : t === "gs" ? "👑" : t === "peak" ? "📈" : t === "start" ? "🌱" : "•"; };
          var colorFor = function(t){ return t === "title" ? "#b45309" : t === "gs" ? "#f59e0b" : t === "peak" ? "#22c55e" : t === "start" ? "#4f46e5" : "#475569"; };
          return (
            <div style={{ marginTop: 10, padding: 10, background: "#ffffff", borderRadius: 8, border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 13, color: "#475569", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>📅 Career Timeline</div>
              <div style={{ position: "relative", paddingLeft: 20 }}>
                <div style={{ position: "absolute", left: 7, top: 4, bottom: 4, width: 2, background: "#f1f5f9" }} />
                {shown.map(function(ev, i){
                  var tierInfo = ev.tier != null ? TIERS[ev.tier] : null;
                  var roundName = "";
                  if (ev.type === "gs" && ev.pRound != null) { roundName = RN6[Math.min(ev.pRound, 5)] || ""; }
                  var label = "";
                  var detail = "";
                  if (ev.type === "title") {
                    label = "Won " + (tierInfo ? tierInfo.name : "Tournament");
                    detail = (ev.pts ? ev.pts + " pts" : "") + (ev.money ? " • $" + (ev.money >= 1000 ? Math.round(ev.money/1000) + "K" : ev.money) : "");
                  } else if (ev.type === "gs") {
                    label = "Grand Slam " + (ev.gsNum || "") + " — " + roundName;
                    detail = (ev.pts ? ev.pts + " pts" : "") + (ev.money ? " • $" + (ev.money >= 1000 ? Math.round(ev.money/1000) + "K" : ev.money) : "");
                  } else if (ev.type === "peak") {
                    label = "Reached career-high #" + ev.rank;
                  } else if (ev.type === "start") {
                    label = "Career started";
                  }
                  return (
                    <div key={i} style={{ position: "relative", marginBottom: 10 }}>
                      <div style={{ position: "absolute", left: -20, top: 0, width: 18, height: 18, borderRadius: "50%", background: "rgba(15,23,42,1)", border: "2px solid " + colorFor(ev.type), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>{iconFor(ev.type)}</div>
                      <div style={{ fontSize: 11, color: "#64748b", fontWeight: 700, letterSpacing: 0.3 }}>S{ev.s}{ev.w ? " • Wk " + ev.w : ""}</div>
                      <div style={{ fontSize: 14, color: colorFor(ev.type), fontWeight: 800, marginTop: 1 }}>{label}</div>
                      {detail && (<div style={{ fontSize: 12, color: "#334155", marginTop: 1 }}>{detail}</div>)}
                    </div>
                  );
                })}
              </div>
              {events.length > shown.length && (
                <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 4 }}>showing {shown.length} of {events.length} events</div>
              )}
            </div>
          );
        })()}
        {!p.isP && (
          <div style={{ marginTop: 8, padding: 6, background: "rgba(99,102,241,0.05)", borderRadius: 6, border: "1px solid rgba(129,140,248,0.08)" }}>
            <div style={{ fontSize: 13, color: "#4338ca", lineHeight: 1.5 }}>
              <b style={{color:"#4f46e5"}}>Talent</b> = innate combat rating. <b style={{color:"#f59e0b"}}>Potential</b> = their personal ceiling (the orange marker). Talent grows slowly through experience but can never exceed potential. <b style={{color:"#7c3aed"}}>Training</b> stacks on top — a low-talent warrior with elite training can beat a naturally gifted one.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
