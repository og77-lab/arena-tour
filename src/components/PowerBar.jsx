/* ═══ PowerBar ═══ Strike mechanic: bouncing cursor + 3 strikes vs opponent */

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { bs } from "../models/formulas";
import { playStrike, playVictory, playDefeat } from "../sounds";

const { useState, useEffect, useRef } = React;

export default function PowerBar(props) {
  var _p = useState("ready"), ph = _p[0], setPh = _p[1];
  var _pos = useState(0), pos = _pos[0], setPos = _pos[1];
  var _my = useState([]), myH = _my[0], setMyH = _my[1];
  var _op = useState([]), opH = _op[0], setOpH = _op[1];
  var _cnt = useState(0), cnt = _cnt[0], setCnt = _cnt[1];
  var _res = useState(null), res = _res[0], setRes = _res[1];
  var _fx = useState(""), fx = _fx[0], setFx = _fx[1];
  var _pop = useState(null), pop = _pop[0], setPop = _pop[1];
  var raf = useRef(null);
  var tr = props.tr || {}, otr = props.otr || {};
  var nR=(tr.r||0)-(otr.r||0), nP=(tr.p||0)-(otr.p||0), nF=(tr.f||0)-(otr.f||0), nS=(tr.s||0)-(otr.s||0), nG=(tr.g||0)-(otr.g||0);
  var spd = useRef(Math.max(0.8, 2.4 + props.diff * 0.4 - nR * 0.12));
  var dir = useRef(1);
  var ctr = 72, sw = Math.max(3, 12 - props.diff * 1.5 + nP * 1.2), fb = nF * 1.5;
  var accel = Math.max(0.03, 0.3 - nS * 0.015), minSc = Math.max(0, 15 + nG * 1.5);

  useEffect(function () {
    if (ph !== "go") return;
    function tick() { setPos(function (p) { var n = p + dir.current * spd.current; if (n >= 100) { n = 100; dir.current = -1; } if (n <= 0) { n = 0; dir.current = 1; } return n; }); raf.current = requestAnimationFrame(tick); }
    raf.current = requestAnimationFrame(tick);
    return function () { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [ph]);

  function doStrike() {
    if (ph !== "go") return;
    if (raf.current) cancelAnimationFrame(raf.current);
    var d = Math.abs(pos - ctr), inZ = d <= sw / 2;
    var sc = Math.min(100, (inZ ? 85 + Math.random() * 12 : Math.max(minSc, 60 - d * 1.2 + Math.random() * 10)) + fb);
    var oB = ((otr.r||0)+(otr.p||0)+(otr.f||0)+(otr.s||0)+(otr.g||0)) * 0.9;
    var effSkill = (props.oppSkill||50) + oB;
    /* NPC scores: weak NPCs are beatable, elite NPCs are brutal */
    var oBase = Math.min(95, 55 + effSkill * 0.4);
    var osc = Math.min(99, oBase + (Math.random() * 14 - 5));
    setFx(sc > 75 ? "hit" : "miss"); setTimeout(function () { setFx(""); }, 350);
    var popId = Date.now() + Math.random();
    setPop({ id: popId, val: Math.round(sc), label: sc >= 85 ? "PERFECT!" : sc >= 75 ? "GREAT" : sc >= 60 ? "GOOD" : "MISS" });
    setTimeout(function(){ setPop(function(p){ return p && p.id === popId ? null : p; }); }, 900);
    playStrike(sc);
    var nm = myH.concat([sc]), no = opH.concat([osc]);
    setMyH(nm); setOpH(no);
    var nc = cnt + 1; setCnt(nc);
    if (nc >= 3) {
      var ap = (nm[0]+nm[1]+nm[2])/3, ao = (no[0]+no[1]+no[2])/3;
      var w = ap >= ao; setRes({ w: w, pa: ap, oa: ao, myStrikes: nm, opStrikes: no }); setPh("done");
      setTimeout(function(){ w ? playVictory() : playDefeat(); }, 250);
      /* NO auto-advance — player must click Continue */
    } else { setPos(0); dir.current = 1; spd.current += accel; setPh("wait"); setTimeout(function () { setPh("go"); }, 250); }
  }

  var sl = ctr - sw / 2;
  return (
    <div style={{ textAlign: "center", padding: "6px 0", position: "relative", animation: fx === "hit" ? "hit 0.3s ease" : fx === "miss" ? "miss 0.3s ease" : "none" }}>
      <AnimatePresence>
        {pop && (
          <motion.div key={pop.id}
            initial={{ opacity: 0, y: 0, scale: 0.7 }}
            animate={{ opacity: 1, y: -60, scale: 1.1 }}
            exit={{ opacity: 0, y: -80, scale: 0.9 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            style={{ position: "absolute", top: 40, left: 0, right: 0, pointerEvents: "none", zIndex: 20 }}>
            <div style={{ fontSize: 34, fontWeight: 900, color: pop.val >= 85 ? "#b45309" : pop.val >= 75 ? "#16a34a" : pop.val >= 60 ? "#b45309" : "#dc2626", textShadow: "0 2px 10px rgba(255,255,255,0.6)", letterSpacing: 1 }}>+{pop.val}</div>
            <div style={{ fontSize: 12, fontWeight: 800, color: pop.val >= 85 ? "#b45309" : pop.val >= 75 ? "#16a34a" : pop.val >= 60 ? "#ea580c" : "#dc2626", letterSpacing: 2, marginTop: 2 }}>{pop.label}</div>
          </motion.div>
        )}
      </AnimatePresence>
      {ph !== "done" && (
        <div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            {[{ a: myH, l: "YOU", c: "#b45309" }, { a: opH, l: "OPP", c: "#475569" }].map(function (s, si) {
              return (<div key={si}>{[0,1,2].map(function (i) { var v = s.a[i]; return (<span key={i} style={{ display: "inline-block", width: 26, height: 26, borderRadius: "50%", margin: "0 2px", background: v != null ? (v > 75 ? "#22c55e" : v > 50 ? "#eab308" : "#ef4444") : "#f1f5f9", border: "2px solid #e5e7eb", lineHeight: "26px", fontSize: 14, color: "#0f172a", fontWeight: 700, textAlign: "center" }}>{v != null ? Math.round(v) : ""}</span>); })}<div style={{ color: s.c, marginTop: 2, fontSize: 13, fontWeight: 700 }}>{s.l}</div></div>);
            })}
          </div>
          <div style={{ position: "relative", height: 30, background: "linear-gradient(90deg,#e2e8f0,#ffffff,#e2e8f0)", borderRadius: 15, overflow: "hidden", margin: "0 auto", maxWidth: 300, border: "1px solid #94a3b8" }}>
            <div style={{ position: "absolute", top: 2, bottom: 2, left: sl+"%", width: sw+"%", background: "linear-gradient(180deg,rgba(250,204,21,0.35),rgba(250,204,21,0.1))", borderRadius: 10, border: "1px solid rgba(250,204,21,0.3)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, width: 3, left: ctr+"%", background: "#b45309", borderRadius: 2 }} />
            {ph === "go" && (<div style={{ position: "absolute", top: -2, bottom: -2, width: 7, left: "calc(" + pos + "% - 3px)", background: "#1e40af", borderRadius: 4, boxShadow: "0 0 10px rgba(30,64,175,0.5)" }} />)}
          </div>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        {ph === "ready" && (<button onClick={function(){setPh("go")}} style={bs("#facc15","#000")}>⚔️ Strike {cnt+1}/3</button>)}
        {ph === "go" && (<button onClick={doStrike} style={Object.assign({},bs("#dc2626","#ffffff"),{animation:"pulse 0.5s ease infinite"})}>⚡ STRIKE!</button>)}
        {ph === "wait" && (<span style={{ color: "#64748b", fontSize: 14 }}>Next strike...</span>)}
        {ph === "done" && res && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: res.w ? "#b45309" : "#ef4444", marginBottom: 8 }}>
              {res.w ? "🏆 VICTORY!" : "💀 DEFEATED"}
            </div>
            {/* Strike-by-strike breakdown */}
            <div style={{ background: "#ffffff", borderRadius: 8, padding: 8, marginBottom: 8, maxWidth: 280, margin: "0 auto 8px" }}>
              {[0,1,2].map(function(i) {
                var my = res.myStrikes[i]; var op = res.opStrikes[i];
                var won = my >= op;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: i % 2 === 0 ? "#f8fafc" : "transparent", borderRadius: 4 }}>
                    <span style={{ fontSize: 14, color: "#64748b", width: 50 }}>Strike {i+1}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: won ? "#22c55e" : "#ef4444", width: 36, textAlign: "right" }}>{Math.round(my)}</span>
                    <span style={{ fontSize: 13, color: "#94a3b8", width: 20, textAlign: "center" }}>vs</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: won ? "#64748b" : "#0f172a", width: 36 }}>{Math.round(op)}</span>
                    <span style={{ fontSize: 13, width: 20, textAlign: "right" }}>{won ? "✓" : "✗"}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderTop: "1px solid #f1f5f9", marginTop: 4 }}>
                <span style={{ fontSize: 14, color: "#475569", fontWeight: 700, width: 50 }}>Average</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: res.w ? "#22c55e" : "#ef4444", width: 36, textAlign: "right" }}>{Math.round(res.pa)}</span>
                <span style={{ fontSize: 13, color: "#94a3b8", width: 20, textAlign: "center" }}>vs</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: res.w ? "#64748b" : "#0f172a", width: 36 }}>{Math.round(res.oa)}</span>
                <span style={{ fontSize: 14, width: 20, textAlign: "right" }}>{res.w ? "🏆" : "💀"}</span>
              </div>
            </div>
            {/* Why you won/lost */}
            <div style={{ fontSize: 14, color: "#475569", marginBottom: 8, maxWidth: 260, margin: "0 auto 8px", lineHeight: 1.4 }}>
              {(function() {
                var diff = Math.round(res.pa - res.oa);
                var badStrikes = res.myStrikes.filter(function(s){return s < 60;}).length;
                var greatStrikes = res.myStrikes.filter(function(s){return s >= 85;}).length;
                if (res.w) {
                  if (greatStrikes >= 2) return "Dominant performance — " + greatStrikes + " excellent strikes sealed the win.";
                  if (diff < 5) return "Razor-thin margin! Just " + Math.abs(diff) + " points separated you. Any miss could have flipped it.";
                  return "Solid win by " + diff + " points. Consistent timing made the difference.";
                } else {
                  if (badStrikes >= 2) return "Timing was off — " + badStrikes + " weak strikes cost you. The gold zone is key.";
                  if (diff > -5) return "So close! Lost by only " + Math.abs(diff) + " points. One better strike would have won it.";
                  return "Outmatched by " + Math.abs(diff) + " points. This opponent's skill and training were too strong.";
                }
              })()}
            </div>
            <button onClick={function(){props.onDone(res.w, res.pa, res.oa)}} style={Object.assign({}, bs(res.w ? "#22c55e" : "#94a3b8", res.w ? "#000" : "#0f172a"), { fontSize: 14 })}>
              {res.w ? "→ Next Match" : "→ Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
