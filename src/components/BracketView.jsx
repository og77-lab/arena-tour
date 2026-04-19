/* ═══ BracketView ═══ Full-screen tournament bracket tree with player's path highlighted */

import { TIERS, RN5, RN6 } from "../models/constants";

export default function BracketView(props) {
  var ts = props.ts;
  var playerName = props.playerName || "You";
  if (!ts || !ts.bracket) return null;
  var tier = TIERS[ts.tierIdx] || TIERS[0];
  var rNames = tier.rounds === 6 ? RN6 : RN5;
  var shortName = function(n){ return (n || "?").split(" the ")[0]; };

  /* Find all matches on the player's path through the bracket */
  var pathMatchIds = {};
  for (var rr = 0; rr < ts.bracket.length; rr++) {
    var rd = ts.bracket[rr]; if (!rd) continue;
    for (var mi = 0; mi < rd.length; mi++) {
      var m = rd[mi];
      if ((m.a && m.a.isP) || (m.b && m.b.isP) || (m.w && m.w.isP)) {
        pathMatchIds[rr + "-" + mi] = true;
      }
    }
  }

  function matchCard(m, ri, mi) {
    var isCurrent = ri === ts.round && mi === ts.pending && !ts.done;
    var isPath = pathMatchIds[ri + "-" + mi];
    var a = m && m.a, b = m && m.b, w = m && m.w;
    return (
      <div key={ri + "-" + mi} style={{
        background: isCurrent ? "rgba(250,204,21,0.12)" : isPath ? "rgba(129,140,248,0.08)" : "#f8fafc",
        border: "1px solid " + (isCurrent ? "#b45309" : isPath ? "rgba(129,140,248,0.35)" : "#f1f5f9"),
        borderRadius: 6,
        padding: "4px 6px",
        fontSize: 11,
        minWidth: 110,
        animation: isCurrent ? "pulse 1.5s ease infinite" : "none"
      }}>
        {[a, b].map(function(p, pi){
          if (!p) return (<div key={pi} style={{ color: "#94a3b8", fontSize: 10 }}>—</div>);
          var thisWon = w && w.id === p.id;
          var label = p.isP ? playerName : shortName(p.name);
          return (
            <div key={pi} style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "2px 0",
              color: p.isP ? "#b45309" : thisWon ? "#0f172a" : (w ? "#64748b" : "#334155"),
              fontWeight: p.isP ? 800 : thisWon ? 700 : 500,
              borderBottom: pi === 0 ? "1px dashed #f1f5f9" : "none"
            }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 85 }}>
                {p.emoji ? p.emoji + " " : ""}{label}
              </span>
              {thisWon && (<span style={{ color: "#22c55e", fontSize: 11, marginLeft: 4 }}>✓</span>)}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }} onClick={props.onClose}>
      <div style={{ background: "#ffffff", borderRadius: 14, padding: 14, maxWidth: "95vw", width: "100%", border: "1px solid #e5e7eb", maxHeight: "90vh", display: "flex", flexDirection: "column" }} onClick={function(e){e.stopPropagation();}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div>
            <span style={{ fontSize: 15, color: tier.col, fontWeight: 800 }}>{tier.name}</span>
            <span style={{ color: "#94a3b8", margin: "0 6px" }}>•</span>
            <span style={{ fontSize: 13, color: "#475569" }}>Draw of {tier.size}</span>
          </div>
          <button onClick={props.onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: 3, fontSize: 11, color: "#64748b", marginBottom: 8 }}>
          <span style={{ padding: "2px 6px", borderRadius: 3, background: "rgba(129,140,248,0.1)", color: "#4f46e5" }}>Your path</span>
          <span style={{ padding: "2px 6px", borderRadius: 3, background: "rgba(250,204,21,0.12)", color: "#b45309" }}>Current match</span>
        </div>
        <div style={{ overflowX: "auto", overflowY: "auto", flex: 1, paddingBottom: 6 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "stretch", minHeight: "100%" }}>
            {ts.bracket.map(function(rd, ri){
              if (!rd) return null;
              return (
                <div key={ri} style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 6, minWidth: 120, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase", textAlign: "center", padding: "2px 0", position: "sticky", top: 0, background: "#ffffff" }}>{rNames[ri] || ("R" + (ri + 1))}</div>
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-around", gap: 6, flex: 1 }}>
                    {rd.map(function(m, mi){ return matchCard(m, ri, mi); })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
