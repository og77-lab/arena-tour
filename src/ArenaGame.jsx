import * as React from "react";
import { syncAchievements, saveGameToCloud, loadGameFromCloud } from "./firebase";
const { useState, useEffect, useRef } = React;

/* ═══ CONSTANTS ═══ */
const SK = "arena-t3";
const W = { minHeight: "100vh", background: "linear-gradient(180deg,#080810 0%,#0f172a 50%,#080810 100%)", fontFamily: "'Trebuchet MS',sans-serif", color: "#fff", padding: 10, boxSizing: "border-box" };
const CSS = "@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(250,204,21,0.15)}50%{box-shadow:0 0 24px rgba(250,204,21,0.4)}}@keyframes hit{0%{transform:scale(1)}30%{transform:scale(1.12)}100%{transform:scale(1)}}@keyframes miss{0%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}@keyframes cg{0%,100%{text-shadow:0 0 10px rgba(250,204,21,0.5)}50%{text-shadow:0 0 30px rgba(250,204,21,0.9)}}";
const EMO = ["⚔️","🛡️","🗡️","🏹","🔱","⚡","🔥","💀","👑","🐉","🦅","🐺","🦁","🐍","🦊","🎭","🐻","🦈","🦂","🐲","🏴","🎪","🔮","🌀","☠️","🦇","🐗","🐅","🦏","🐊"];

/* Tiers: Futures, Challenger, Tour250, Tour500, Masters, GrandSlam */
var TIERS = [
  { name: "Futures", short: "FUT", col: "#94a3b8", size: 32, rounds: 5, pts: [5,12,25,50,100], money: [50,150,400,1000,3000], rankRange: [601,1001] },
  { name: "Challenger", short: "CHL", col: "#4ade80", size: 32, rounds: 5, pts: [12,30,60,125,250], money: [200,500,1500,4000,10000], rankRange: [301,700] },
  { name: "Tour 250", short: "250", col: "#22d3ee", size: 32, rounds: 5, pts: [40,80,160,320,600], money: [800,2000,6000,15000,40000], rankRange: [101,400] },
  { name: "Tour 500", short: "500", col: "#818cf8", size: 32, rounds: 5, pts: [80,160,320,600,1200], money: [2000,5000,15000,40000,100000], rankRange: [31,200] },
  { name: "Masters", short: "MST", col: "#f472b6", size: 32, rounds: 5, pts: [150,300,600,1200,2500], money: [5000,15000,40000,100000,300000], rankRange: [1,100] },
  { name: "Grand Slam", short: "GS", col: "#facc15", size: 64, rounds: 6, pts: [250,500,1000,2000,4000,8000], money: [10000,25000,60000,150000,400000,1000000], rankRange: [1,64] }
];
var RN5 = ["Round of 32","Round of 16","Quarterfinals","Semifinals","Final"];
var RN6 = ["Round of 64","Round of 32","Round of 16","Quarterfinals","Semifinals","Final"];
var HN = ["Phoenix","Kraken","Wyvern","Chimera"], HC = ["#ef4444","#3b82f6","#22c55e","#a855f7"], HI = ["🔥","🌊","🐉","⚡"];

/* Season calendar: 4 blocks × (4 swing weeks + 1 Grand Slam) = 20 events */
function mkCalendar() {
  var cal = [];
  for (var gs = 0; gs < 4; gs++) {
    for (var sw = 0; sw < 4; sw++) { cal.push({ type: "swing", block: gs + 1, week: sw + 1, tier: null, done: false, result: null }); }
    cal.push({ type: "gs", block: gs + 1, gsNum: gs + 1, tier: 5, done: false, result: null });
  }
  return cal;
}
var TOTAL_EVENTS = 20;

/* ─── NPC Generation (1000) ─── */
var FN = ["Kai","Zara","Riven","Nova","Cael","Luna","Drex","Mira","Volt","Freya","Jett","Lyra","Onyx","Talon","Vex","Ash","Blaze","Ember","Hex","Jade","Knox","Lux","Nyx","Orion","Pike","Quinn","Rex","Storm","Vale","Wren","Yuki","Sage","Echo","Fang","Iris","Kira","Neon","Pyro","Shade","Wolf","Rook","Dusk","Moss","Opal","Rift","Uma","Xena","Crux","Haze","Jinx"];
var TT = ["Swift","Fierce","Bold","Shadow","Flame","Iron","Storm","Frost","Crimson","Silent","Phantom","Arcane","Cunning","Venom","Warden","Wraith","Savage","Void","Mystic","Dire"];

function mkNPCs() {
  var npcs = [];
  for (var i = 0; i < 999; i++) {
    var fi = i % FN.length, ti = Math.floor(i / FN.length) % TT.length;
    var suffix = Math.floor(i / (FN.length * TT.length));
    var name = FN[fi] + " the " + TT[ti] + (suffix > 0 ? " " + (suffix + 1) : "");
    var pct = i / 999;
    var skill = pct < 0.03 ? 82 + Math.random() * 10 : pct < 0.1 ? 70 + Math.random() * 14 : pct < 0.25 ? 55 + Math.random() * 18 : pct < 0.5 ? 38 + Math.random() * 20 : 15 + Math.random() * 28;
    /* Seed SP based on rank position — quadratic decay, everyone has base points */
    var pot = Math.min(95, Math.round(skill + 8 + Math.random() * 15));
    npcs.push({ id: i + 2, name: name, skill: skill, pot: pot, sp: 0, ap: 0, isP: false, emoji: EMO[i % EMO.length], tr: { r: 0, p: 0, f: 0, s: 0, g: 0 }, best: { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0, careerMoney: 0 } });
  }
  /* Sort by skill descending, then assign seed SP by position */
  npcs.sort(function(a, b) { return (b.skill||0) - (a.skill||0); });
  for (var si = 0; si < npcs.length; si++) {
    var rank = si + 1;
    var seed = Math.round(5000 * Math.pow(Math.max(0, (1000 - rank) / 999), 2.5) + Math.random() * 10);
    npcs[si].sp = seed;
    npcs[si].ap = seed;
  }
  return npcs;
}

function mkSeason(name, num, prev) {
  var emptyRes = []; for (var zi = 0; zi < TOTAL_EVENTS; zi++) emptyRes.push(0);
  var npcs, def = emptyRes.slice();
  if (prev) {
    npcs = prev.npcs.map(function (n) { return Object.assign({}, n); });
    def = prev.player.res || def;
  } else {
    npcs = mkNPCs();
  }
  var ptr = prev ? Object.assign({ s: 0, g: 0 }, prev.player.tr) : { r: 0, p: 0, f: 0, s: 0, g: 0, tp: 0 };
  var pBest = prev ? prev.player.best : { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0 };
  var pSP = 0; for (var di = 0; di < TOTAL_EVENTS; di++) pSP += (def[di] || 0);
  var res = []; for (var ri = 0; ri < TOTAL_EVENTS; ri++) res.push(0);
  return {
    pName: name || "Champion", sNum: num || 1, npcs: npcs, cal: mkCalendar(), calIdx: 0,
    player: { id: 1, isP: true, sp: pSP, ap: prev ? prev.player.ap : 0, tr: ptr, best: pBest, def: def, res: res, money: prev ? prev.player.money : 0, seasonMoney: 0 },
    champs: prev ? prev.champs : [], tHist: prev ? prev.tHist : [], phase: "hub"
  };
}

function sh(n) { return (n || "?").split(" the ")[0]; }
function bs(bg, c) { return { background: bg, color: c, border: "none", padding: "10px 18px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }; }

function getRanked(S) {
  var all = [Object.assign({}, S.player, { name: S.pName })].concat(S.npcs);
  all.sort(function (a, b) { return (b.sp || 0) - (a.sp || 0); });
  return all;
}
function getARanked(S) {
  var all = [Object.assign({}, S.player, { name: S.pName })].concat(S.npcs);
  all.sort(function (a, b) { return (b.ap || 0) - (a.ap || 0); });
  return all;
}
function pRankOf(S) { var r = getRanked(S); for (var i = 0; i < r.length; i++) { if (r[i].isP) return i + 1; } return 1001; }

function nW(a, b) {
  var ta = a.tr || {}, tb = b.tr || {};
  var bA = ((ta.r||0)+(ta.p||0)+(ta.f||0)+(ta.s||0)+(ta.g||0)) * 0.9;
  var bB = ((tb.r||0)+(tb.p||0)+(tb.f||0)+(tb.s||0)+(tb.g||0)) * 0.9;
  var sA = Math.min(95, 55 + ((a.skill||50)+bA) * 0.4);
  var sB = Math.min(95, 55 + ((b.skill||50)+bB) * 0.4);
  return (sA + Math.random() * 14 - 5) >= (sB + Math.random() * 14 - 5) ? a : b;
}
function trainCost(lv) { return (lv + 1) * 25 + Math.max(0, lv - 5) * 20; }

function sSet(v) { try { if (v === null) { localStorage.removeItem(SK); } else { localStorage.setItem(SK, JSON.stringify(v)); } } catch(e){} }
function sGet() { try { var r = localStorage.getItem(SK); return r ? JSON.parse(r) : null; } catch(e){ return null; } }

/* ═══ PowerBar ═══ */
function PowerBar(props) {
  var _p = useState("ready"), ph = _p[0], setPh = _p[1];
  var _pos = useState(0), pos = _pos[0], setPos = _pos[1];
  var _my = useState([]), myH = _my[0], setMyH = _my[1];
  var _op = useState([]), opH = _op[0], setOpH = _op[1];
  var _cnt = useState(0), cnt = _cnt[0], setCnt = _cnt[1];
  var _res = useState(null), res = _res[0], setRes = _res[1];
  var _fx = useState(""), fx = _fx[0], setFx = _fx[1];
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
    var nm = myH.concat([sc]), no = opH.concat([osc]);
    setMyH(nm); setOpH(no);
    var nc = cnt + 1; setCnt(nc);
    if (nc >= 3) {
      var ap = (nm[0]+nm[1]+nm[2])/3, ao = (no[0]+no[1]+no[2])/3;
      var w = ap >= ao; setRes({ w: w, pa: ap, oa: ao, myStrikes: nm, opStrikes: no }); setPh("done");
      /* NO auto-advance — player must click Continue */
    } else { setPos(0); dir.current = 1; spd.current += accel; setPh("wait"); setTimeout(function () { setPh("go"); }, 250); }
  }

  var sl = ctr - sw / 2;
  return (
    <div style={{ textAlign: "center", padding: "6px 0", animation: fx === "hit" ? "hit 0.3s ease" : fx === "miss" ? "miss 0.3s ease" : "none" }}>
      {ph !== "done" && (
        <div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 8 }}>
            {[{ a: myH, l: "YOU", c: "#facc15" }, { a: opH, l: "OPP", c: "#94a3b8" }].map(function (s, si) {
              return (<div key={si}>{[0,1,2].map(function (i) { var v = s.a[i]; return (<span key={i} style={{ display: "inline-block", width: 26, height: 26, borderRadius: "50%", margin: "0 2px", background: v != null ? (v > 75 ? "#22c55e" : v > 50 ? "#eab308" : "#ef4444") : "rgba(255,255,255,0.08)", border: "2px solid rgba(255,255,255,0.12)", lineHeight: "26px", fontSize: 10, color: "#fff", fontWeight: 700, textAlign: "center" }}>{v != null ? Math.round(v) : ""}</span>); })}<div style={{ color: s.c, marginTop: 2, fontSize: 9, fontWeight: 700 }}>{s.l}</div></div>);
            })}
          </div>
          <div style={{ position: "relative", height: 30, background: "linear-gradient(90deg,#1e293b,#334155,#1e293b)", borderRadius: 15, overflow: "hidden", margin: "0 auto", maxWidth: 300, border: "1px solid #475569" }}>
            <div style={{ position: "absolute", top: 2, bottom: 2, left: sl+"%", width: sw+"%", background: "linear-gradient(180deg,rgba(250,204,21,0.35),rgba(250,204,21,0.1))", borderRadius: 10, border: "1px solid rgba(250,204,21,0.3)" }} />
            <div style={{ position: "absolute", top: 0, bottom: 0, width: 3, left: ctr+"%", background: "#facc15", borderRadius: 2 }} />
            {ph === "go" && (<div style={{ position: "absolute", top: -2, bottom: -2, width: 7, left: "calc(" + pos + "% - 3px)", background: "#fff", borderRadius: 4, boxShadow: "0 0 10px rgba(255,255,255,0.8)" }} />)}
          </div>
        </div>
      )}
      <div style={{ marginTop: 10 }}>
        {ph === "ready" && (<button onClick={function(){setPh("go")}} style={bs("#facc15","#000")}>⚔️ Strike {cnt+1}/3</button>)}
        {ph === "go" && (<button onClick={doStrike} style={Object.assign({},bs("#ef4444","#fff"),{animation:"pulse 0.5s ease infinite"})}>⚡ STRIKE!</button>)}
        {ph === "wait" && (<span style={{ color: "#64748b", fontSize: 12 }}>Next strike...</span>)}
        {ph === "done" && res && (
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: res.w ? "#facc15" : "#ef4444", marginBottom: 8 }}>
              {res.w ? "🏆 VICTORY!" : "💀 DEFEATED"}
            </div>
            {/* Strike-by-strike breakdown */}
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 8, marginBottom: 8, maxWidth: 280, margin: "0 auto 8px" }}>
              {[0,1,2].map(function(i) {
                var my = res.myStrikes[i]; var op = res.opStrikes[i];
                var won = my >= op;
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 8px", background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent", borderRadius: 4 }}>
                    <span style={{ fontSize: 10, color: "#64748b", width: 50 }}>Strike {i+1}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: won ? "#22c55e" : "#ef4444", width: 36, textAlign: "right" }}>{Math.round(my)}</span>
                    <span style={{ fontSize: 9, color: "#475569", width: 20, textAlign: "center" }}>vs</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: won ? "#64748b" : "#e2e8f0", width: 36 }}>{Math.round(op)}</span>
                    <span style={{ fontSize: 11, width: 20, textAlign: "right" }}>{won ? "✓" : "✗"}</span>
                  </div>
                );
              })}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 4 }}>
                <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, width: 50 }}>Average</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: res.w ? "#22c55e" : "#ef4444", width: 36, textAlign: "right" }}>{Math.round(res.pa)}</span>
                <span style={{ fontSize: 9, color: "#475569", width: 20, textAlign: "center" }}>vs</span>
                <span style={{ fontSize: 13, fontWeight: 900, color: res.w ? "#64748b" : "#e2e8f0", width: 36 }}>{Math.round(res.oa)}</span>
                <span style={{ fontSize: 12, width: 20, textAlign: "right" }}>{res.w ? "🏆" : "💀"}</span>
              </div>
            </div>
            {/* Why you won/lost */}
            <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8, maxWidth: 260, margin: "0 auto 8px", lineHeight: 1.4 }}>
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
            <button onClick={function(){props.onDone(res.w)}} style={Object.assign({}, bs(res.w ? "#22c55e" : "#475569", res.w ? "#000" : "#e2e8f0"), { fontSize: 12 })}>
              {res.w ? "→ Next Match" : "→ Continue"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Player Profile Modal ═══ */
function Profile(props) {
  var p = props.player; var rank = props.rank; var onClose = props.onClose;
  if (!p) return null;
  var t = p.tr || {};
  var totalTr = (t.r||0)+(t.p||0)+(t.f||0)+(t.s||0)+(t.g||0);
  var b = p.best || {};
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.85)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: 14, padding: 18, maxWidth: 360, width: "100%", border: "1px solid rgba(255,255,255,0.1)", maxHeight: "80vh", overflowY: "auto" }} onClick={function(e){e.stopPropagation();}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div><span style={{ fontSize: 20 }}>{p.emoji || "👤"}</span><span style={{ fontSize: 16, fontWeight: 800, color: p.isP ? "#facc15" : "#e2e8f0", marginLeft: 8 }}>{p.isP ? (props.playerName || "You") : p.name}</span></div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[{ l: "Current Rank", v: "#" + rank, c: rank <= 10 ? "#facc15" : rank <= 50 ? "#22c55e" : "#94a3b8" },
            { l: "Peak Rank", v: "#" + (b.rank < 1001 ? b.rank : "—"), c: "#818cf8" },
            { l: "Season Pts", v: (p.sp||0).toLocaleString(), c: "#22d3ee" },
            { l: "All-Time Pts", v: (p.ap||0).toLocaleString(), c: "#f472b6" },
            { l: "Season Prize $", v: "$"+(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(p.isP?(p.seasonMoney||0):(Math.round((p.sp||0)*3))), c: "#22c55e" },
            { l: "Career Prize $", v: "$"+(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(p.isP?(p.money||0):((b.careerMoney||0))), c: "#4ade80" }
          ].map(function (s, i) {
            return (<div key={i} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "6px 8px" }}><div style={{ fontSize: 8, color: "#64748b", marginBottom: 1 }}>{s.l}</div><div style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.v}</div></div>);
          })}
        </div>
        {/* Skill + Potential bar for NPCs */}
        {!p.isP && (
          <div style={{ marginBottom: 10, padding: 8, background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, marginBottom: 4 }}>
              <span style={{ color: "#94a3b8", fontWeight: 700 }}>Natural Talent</span>
              <span style={{ fontSize: 10 }}>
                <span style={{ color: "#e2e8f0", fontWeight: 800 }}>{Math.round(p.skill||0)}</span>
                <span style={{ color: "#475569" }}> / </span>
                <span style={{ color: "#f59e0b", fontWeight: 700 }}>{p.pot||92}</span>
                <span style={{ color: "#475569", fontSize: 8, marginLeft: 3 }}>potential</span>
              </span>
            </div>
            <div style={{ position: "relative", height: 10, background: "rgba(255,255,255,0.06)", borderRadius: 5, overflow: "hidden" }}>
              {/* Potential ceiling marker */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: Math.round((p.pot||92)/95*100) + "%", borderRadius: 5, background: "rgba(245,158,11,0.12)", borderRight: "2px solid rgba(245,158,11,0.4)" }} />
              {/* Current skill fill */}
              <div style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: Math.round((p.skill||0)/95*100) + "%", borderRadius: 5, background: (p.skill||0) > 80 ? "linear-gradient(90deg,#ef4444,#f59e0b)" : (p.skill||0) > 60 ? "linear-gradient(90deg,#f59e0b,#facc15)" : (p.skill||0) > 40 ? "linear-gradient(90deg,#22d3ee,#818cf8)" : "#94a3b8" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 7, color: "#475569", marginTop: 2 }}>
              <span>Developing</span><span>Average</span><span>Strong</span><span>Elite</span>
            </div>
            <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>
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
            <span style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>TRAINING LEVELS</span>
            <span style={{ fontSize: 9, color: "#a78bfa", fontWeight: 700 }}>{totalTr}/100</span>
          </div>
          {[{k:"r",i:"⚡",l:"Reflexes",c:"#22d3ee"},{k:"p",i:"💪",l:"Power",c:"#f472b6"},{k:"f",i:"🎯",l:"Focus",c:"#4ade80"},{k:"s",i:"🫀",l:"Stamina",c:"#fb923c"},{k:"g",i:"🛡️",l:"Grit",c:"#a78bfa"}].map(function(s){
            var lv = t[s.k]||0;
            return (<div key={s.k} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ color: s.c, fontSize: 11, width: 70 }}>{s.i} {s.l}</span><div style={{ flex: 1, display: "flex", gap: 1 }}>{Array.from({length:20}).map(function(_,i){return (<div key={i} style={{flex:1,height:5,borderRadius:2,background:i<lv?s.c:"rgba(255,255,255,0.06)"}}/>);})}</div><span style={{fontSize:10,color:"#94a3b8",width:20,textAlign:"right"}}>{lv}</span></div>);
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[{ l: "🏆 Titles", v: b.titles||0 }, { l: "👑 GS Titles", v: b.gsTitles||0 }, { l: "⭐ Finals", v: b.finals||0 }].map(function(s,i){
            return (<div key={i} style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}><div style={{ fontSize: 14, fontWeight: 800, color: "#facc15" }}>{s.v}</div><div style={{ fontSize: 9, color: "#64748b" }}>{s.l}</div></div>);
          })}
        </div>
        {!p.isP && (
          <div style={{ marginTop: 8, padding: 6, background: "rgba(99,102,241,0.05)", borderRadius: 6, border: "1px solid rgba(129,140,248,0.08)" }}>
            <div style={{ fontSize: 9, color: "#c7d2fe", lineHeight: 1.5 }}>
              <b style={{color:"#818cf8"}}>Talent</b> = innate combat rating. <b style={{color:"#f59e0b"}}>Potential</b> = their personal ceiling (the orange marker). Talent grows slowly through experience but can never exceed potential. <b style={{color:"#a78bfa"}}>Training</b> stacks on top — a low-talent warrior with elite training can beat a naturally gifted one.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ HELP / TUTORIAL ═══ */
function HelpScreen(props) {
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.9)", zIndex: 999, overflowY: "auto", padding: 16 }} onClick={props.onClose}>
      <div style={{ maxWidth: 360, margin: "0 auto", background: "linear-gradient(135deg,#1e293b,#0f172a)", borderRadius: 14, padding: 16, border: "1px solid rgba(255,255,255,0.1)" }} onClick={function(e){e.stopPropagation();}}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 900, color: "#facc15" }}>⚔️ How To Play</span>
          <button onClick={props.onClose} style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#facc15", fontWeight: 700, marginBottom: 6 }}>THE STRIKE SYSTEM</div>
          <div style={{ fontSize: 10, color: "#c7d2fe", lineHeight: 1.6, marginBottom: 8 }}>
            Each match is <b style={{color:"#e2e8f0"}}>3 strikes</b>. A white cursor bounces left-right across the power bar. Tap <b style={{color:"#ef4444"}}>STRIKE</b> to stop it. Your score depends on where it lands:
          </div>
          {/* Visual bar explanation */}
          <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
            <div style={{ position: "relative", height: 24, background: "linear-gradient(90deg,#1e293b,#334155,#1e293b)", borderRadius: 12, overflow: "hidden", marginBottom: 8, border: "1px solid #475569" }}>
              <div style={{ position: "absolute", top: 2, bottom: 2, left: "62%", width: "16%", background: "rgba(250,204,21,0.3)", borderRadius: 8, border: "1px solid rgba(250,204,21,0.4)" }} />
              <div style={{ position: "absolute", top: 0, bottom: 0, width: 3, left: "70%", background: "#facc15", borderRadius: 2 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginBottom: 4 }}>
              <span style={{ color: "#ef4444" }}>← Far miss</span>
              <span style={{ color: "#eab308" }}>Near →</span>
              <span style={{ color: "#facc15", fontWeight: 700 }}>GOLD ZONE</span>
            </div>
            {[
              { zone: "🎯 Gold zone (center)", score: "88 — 100", col: "#22c55e", desc: "Perfect timing!" },
              { zone: "Near miss (just outside)", score: "65 — 77", col: "#eab308", desc: "Decent, can still win" },
              { zone: "Medium miss", score: "55 — 67", col: "#f59e0b", desc: "Risky against good NPCs" },
              { zone: "Far miss", score: "25 — 50", col: "#ef4444", desc: "Almost certainly loses" }
            ].map(function(r, i) {
              return (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ fontSize: 9, color: "#94a3b8", flex: 1 }}>{r.zone}</span>
                  <span style={{ fontSize: 10, color: r.col, fontWeight: 700, width: 60, textAlign: "center" }}>{r.score}</span>
                  <span style={{ fontSize: 8, color: "#475569", width: 70, textAlign: "right" }}>{r.desc}</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
            After 3 strikes, your <b style={{color:"#e2e8f0"}}>average</b> is compared to the NPC's average. <b style={{color:"#22c55e"}}>Higher average wins.</b>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#22d3ee", fontWeight: 700, marginBottom: 4 }}>NPC SCORES</div>
          <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
            NPCs auto-generate scores based on their <b style={{color:"#e2e8f0"}}>natural talent</b> + <b style={{color:"#a78bfa"}}>training</b>. You never see their bar — just their final scores.
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 6, marginTop: 6 }}>
            {[
              { tier: "Futures", range: "49 — 63", col: "#94a3b8" },
              { tier: "Challenger", range: "58 — 72", col: "#4ade80" },
              { tier: "Tour 250", range: "65 — 79", col: "#22d3ee" },
              { tier: "Tour 500", range: "72 — 86", col: "#818cf8" },
              { tier: "Masters", range: "78 — 92", col: "#f472b6" },
              { tier: "Grand Slam", range: "78 — 95", col: "#facc15" }
            ].map(function(r, i) {
              return (<div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 4px", fontSize: 9 }}><span style={{ color: r.col, fontWeight: 600 }}>{r.tier}</span><span style={{ color: "#e2e8f0" }}>{r.range}</span></div>);
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#f472b6", fontWeight: 700, marginBottom: 4 }}>WHAT GETS HARDER</div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 6 }}>
            {[
              { what: "Bar speed", desc: "Cursor moves faster → harder to time", icon: "⚡" },
              { what: "Gold zone", desc: "Target shrinks → less room for error", icon: "🎯" },
              { what: "NPC scores", desc: "Higher tier = stronger opponents", icon: "💀" },
              { what: "Acceleration", desc: "Bar speeds up between strikes 1→2→3", icon: "📈" }
            ].map(function(r, i) {
              return (<div key={i} style={{ display: "flex", gap: 6, padding: "3px 0", fontSize: 9 }}><span>{r.icon}</span><span><b style={{color:"#e2e8f0"}}>{r.what}</b><span style={{color:"#94a3b8"}}> — {r.desc}</span></span></div>);
            })}
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 700, marginBottom: 4 }}>TRAINING (RELATIVE)</div>
          <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
            Your 5 training stats are compared <b style={{color:"#facc15"}}>against your opponent's</b> each match. Only the <b style={{color:"#e2e8f0"}}>difference</b> matters:
          </div>
          <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 6, padding: 6, marginTop: 4 }}>
            {[
              { stat: "⚡ Reflexes", effect: "Slows/speeds bar relative to opponent" },
              { stat: "💪 Power", effect: "Widens/shrinks gold zone relative to opponent" },
              { stat: "🎯 Focus", effect: "Adds/subtracts from your strike score" },
              { stat: "🫀 Stamina", effect: "Reduces bar acceleration between strikes" },
              { stat: "🛡️ Grit", effect: "Raises your minimum score on bad misses" }
            ].map(function(r, i) {
              return (<div key={i} style={{ fontSize: 9, padding: "2px 0", color: "#94a3b8" }}><b style={{color:"#e2e8f0"}}>{r.stat}</b> — {r.effect}</div>);
            })}
          </div>
          <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>Example: You have ⚡8, opponent has ⚡5 → net +3 → bar is noticeably slower for you. If both are ⚡8 → cancels out completely.</div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, marginBottom: 4 }}>POINTS & RANKINGS</div>
          <div style={{ fontSize: 10, color: "#94a3b8", lineHeight: 1.5 }}>
            Win matches to earn points. <b style={{color:"#ef4444"}}>R1 losers get nothing</b> — you must win to earn. Higher tiers pay more. Rankings update after each event based on total season points. In season 2+, you <b style={{color:"#f59e0b"}}>defend</b> last season's points at each calendar slot.
          </div>
        </div>

        <button onClick={props.onClose} style={Object.assign({}, bs("linear-gradient(135deg,#facc15,#f59e0b)", "#000"), { width: "100%", marginTop: 12 })}>Got it!</button>
      </div>
    </div>
  );
}

/* ═══ MAIN APP ═══ */
export default function Arena(props) {
  var userId = props.userId;
  var _scr = useState("loading"), scr = _scr[0], setScr = _scr[1];
  var _S = useState(null), S = _S[0], setS = _S[1];
  var _tab = useState("calendar"), tab = _tab[0], setTab = _tab[1];
  var _inp = useState(""), inp = _inp[0], setInp = _inp[1];
  var _ts = useState(null), ts = _ts[0], setTS = _ts[1];
  var _fs = useState(null), fs = _fs[0], setFS = _fs[1];
  var _ttab = useState("match"), ttab = _ttab[0], setTtab = _ttab[1];
  var _prof = useState(null), prof = _prof[0], setProf = _prof[1];
  var _picking = useState(false), picking = _picking[0], setPicking = _picking[1];
  var _help = useState(false), showHelp = _help[0], setHelp = _help[1];
  var fileRef = useRef(null);

  useEffect(function () {
    var done = false;
    function fin(d) { if (done) return; done = true; if (d && d.player) { setS(d); setScr("hub"); } else setScr("title"); }
    if (userId) {
      loadGameFromCloud(userId).then(function(cloud) {
        if (cloud && cloud.player) { fin(cloud); sSet(cloud); }
        else fin(sGet());
      }).catch(function() { fin(sGet()); });
    } else {
      fin(sGet());
    }
  }, []);

  function save(s) { setS(s); sSet(s); if (userId) saveGameToCloud(userId, s).catch(function(e){ console.error("Cloud save failed:", e); }); }
  function exportSave() { if (!S) return; var b = new Blob([JSON.stringify(S)],{type:"application/json"}); var u = URL.createObjectURL(b); var a = document.createElement("a"); a.href = u; a.download = "arena-"+S.pName+"-s"+S.sNum+".json"; a.click(); URL.revokeObjectURL(u); }
  function importSave(e) { var f = e.target.files && e.target.files[0]; if (!f) return; var r = new FileReader(); r.onload = function(ev){ try { var d = JSON.parse(ev.target.result); if (d && d.player) { save(d); setScr("hub"); } } catch(err){} }; r.readAsText(f); }
  var _syncing = useState(false), syncing = _syncing[0], setSyncing = _syncing[1];
  var _syncMsg = useState(""), syncMsg = _syncMsg[0], setSyncMsg = _syncMsg[1];

  function doSync(seasonData) {
    if (!userId || !seasonData) return;
    setSyncing(true); setSyncMsg("");
    var sd = Object.assign({}, seasonData, { _lastRank: pRankOf(seasonData) });
    syncAchievements(userId, seasonData.pName, "⚔️", sd)
      .then(function() { setSyncMsg("Synced!"); setTimeout(function(){ setSyncMsg(""); }, 2000); })
      .catch(function(e) { setSyncMsg("Sync failed"); console.error(e); })
      .finally(function() { setSyncing(false); });
  }

  function newSeason() { save(mkSeason(inp, 1, null)); setScr("hub"); }
  function nextSeason() { if (!S) return; doSync(S); save(mkSeason(S.pName, (S.sNum||1)+1, S)); setScr("hub"); }
  function newGame() { if (confirm("Start a brand new game? Your current save will be erased.")) { sSet(null); if (userId) saveGameToCloud(userId, null).catch(function(){}); setS(null); setTS(null); setFS(null); setScr("title"); } }

  function doTrain(stat) {
    if (!S) return;
    var t = Object.assign({s:0,g:0}, S.player.tr);
    var cost = trainCost(t[stat]||0);
    if (t.tp < cost || (t[stat]||0) >= 20) return;
    t.tp -= cost; t[stat] = (t[stat]||0) + 1;
    save(Object.assign({}, S, { player: Object.assign({}, S.player, { tr: t }) }));
  }

  /* ─── Available tiers for player ─── */
  function availableTiers(S) {
    var rank = pRankOf(S);
    var avail = [];
    for (var i = 0; i < 5; i++) {
      if (rank >= TIERS[i].rankRange[0] && rank <= TIERS[i].rankRange[1]) avail.push(i);
    }
    /* If nothing matches, find closest tier for this rank */
    if (avail.length === 0) {
      if (rank > 700) avail.push(0);
      else if (rank > 400) avail.push(1);
      else if (rank > 200) avail.push(2);
      else if (rank > 100) avail.push(3);
      else avail.push(4);
    }
    return avail;
  }

  /* ─── Bracket logic ─── */
  function runBk(bk, round, alive, maxRound) {
    var rd = bk[round]; if (!rd) return { bracket: bk, round: round, pending: null, done: true };
    for (var i = 0; i < rd.length; i++) { var m = rd[i]; if (m.w) continue; if ((m.a.isP || m.b.isP) && alive) return { bracket: bk, round: round, pending: i, done: false }; var w = nW(m.a, m.b); w.tP = (w.tP||0) + (bk._pts ? bk._pts[round] : 0); m.w = w; }
    if (round >= maxRound - 1) return { bracket: bk, round: round, pending: null, done: true };
    var nx = []; for (var j = 0; j < rd.length; j += 2) { if (j+1 < rd.length) nx.push({ a: rd[j].w, b: rd[j+1].w, w: null }); }
    bk[round + 1] = nx;
    return runBk(bk, round + 1, alive, maxRound);
  }

  function startTourney(tierIdx) {
    if (!S) return;
    var tier = TIERS[tierIdx];
    var ranked = getRanked(S);
    var pool = [];
    for (var i = 0; i < ranked.length && pool.length < tier.size; i++) {
      var r = i + 1;
      if (r >= tier.rankRange[0] && r <= tier.rankRange[1]) pool.push(Object.assign({}, ranked[i], { tP: 0 }));
    }
    /* Ensure player is in pool */
    var hasP = pool.some(function(p){return p.isP;});
    if (!hasP) { pool[pool.length - 1] = Object.assign({}, S.player, { name: S.pName, tP: 0 }); }
    /* Fill if needed */
    while (pool.length < tier.size) {
      var extra = ranked[pool.length + tier.rankRange[0] - 1];
      if (extra) pool.push(Object.assign({}, extra, { tP: 0 }));
      else break;
    }
    /* Shuffle */
    for (var k = pool.length - 1; k > 0; k--) { var j = Math.floor(Math.random()*(k+1)); var t = pool[k]; pool[k] = pool[j]; pool[j] = t; }
    var pi = -1; for (var x = 0; x < pool.length; x++) { if (pool[x].isP) { pi = x; break; } }
    if (pi > 0) { var tmp = pool[0]; pool[0] = pool[pi]; pool[pi] = tmp; }
    var r0 = []; for (var m = 0; m < pool.length; m += 2) r0.push({ a: pool[m], b: pool[m+1], w: null });
    var bk = [r0]; bk._pts = tier.pts; bk._tier = tierIdx;
    var result = runBk(bk, 0, true, tier.rounds);
    setTS({ bracket: result.bracket, round: result.round, pending: result.pending, done: result.done, alive: true, log: [], tierIdx: tierIdx });
    setTtab("match"); setScr("tourney");
  }

  function onTR(won) {
    if (!ts) return;
    var tier = TIERS[ts.tierIdx]; var rNames = tier.rounds === 6 ? RN6 : RN5;
    var bk = JSON.parse(JSON.stringify(ts.bracket)); bk._pts = tier.pts; bk._tier = ts.tierIdx;
    var m = bk[ts.round][ts.pending]; var opp = m.a.isP ? m.b : m.a;
    var winner = won ? (m.a.isP ? m.a : m.b) : (m.a.isP ? m.b : m.a);
    winner.tP = (winner.tP||0) + tier.pts[ts.round]; m.w = winner;
    var log = ts.log.concat([{ round: rNames[ts.round], opp: opp.name, won: won, pts: won ? tier.pts[ts.round] : 0 }]);
    var r = runBk(bk, ts.round, won, tier.rounds);
    setTS({ bracket: r.bracket, round: r.round, pending: r.pending, done: r.done, alive: won, log: log, tierIdx: ts.tierIdx });
  }

  function finishT() {
    if (!S || !ts) return;
    var tier = TIERS[ts.tierIdx]; var isGS = ts.tierIdx === 5;
    var tally = function(pid) { var p = 0; for (var ri = 0; ri < ts.bracket.length; ri++) { var rd = ts.bracket[ri]; if (rd) for (var mi = 0; mi < rd.length; mi++) { if (rd[mi].w && rd[mi].w.id === pid) p += tier.pts[ri]; } } return p; };
    var pp = tally(1);
    /* No points for R1 losers — you must win to earn */
    var pRound = 0; for (var ri = 0; ri < ts.bracket.length; ri++) { var rd = ts.bracket[ri]; if (rd) for (var mi = 0; mi < rd.length; mi++) { var mm = rd[mi]; if ((mm.a && mm.a.id===1)||(mm.b && mm.b.id===1)) pRound = ri; } }
    var champM = ts.bracket[tier.rounds - 1] && ts.bracket[tier.rounds - 1][0]; var champW = champM && champM.w;
    var wonTitle = champW && champW.id === 1;
    var newNpcs = S.npcs.map(function(n){
      var e = tally(n.id);
      var tr = Object.assign({s:0,g:0}, n.tr||{});
      var stats = ["r","p","f","s","g"];
      /* Only NPCs who competed in THIS bracket train. Others train from parallel sim below. */
      if (e > 0) {
        var trainR = e > 1000 ? 2 : e > 200 ? 1 : (Math.random() < 0.5 ? 1 : 0);
        for (var ti = 0; ti < trainR; ti++) { var st = stats[Math.floor(Math.random()*5)]; if ((tr[st]||0) < 20) tr[st] = (tr[st]||0) + 1; }
      }
      var nb = Object.assign({}, n.best||{});
      if (champW && champW.id === n.id) { nb.titles = (nb.titles||0) + 1; if (isGS) nb.gsTitles = (nb.gsTitles||0) + 1; }
      var nb2 = Object.assign({}, nb, { careerMoney: (nb.careerMoney||0) + Math.round(e * 3) });
      return Object.assign({}, n, { sp: (n.sp||0)+e, ap: (n.ap||0)+e, skill: Math.min(n.pot||92, (n.skill||30)+(Math.random()*0.3-0.05)), tr: tr, best: nb2 });
    });
    /* Update player with DEFENDING POINTS system */
    var pb = Object.assign({}, S.player.best||{});
    if (wonTitle) { pb.titles = (pb.titles||0) + 1; if (isGS) pb.gsTitles = (pb.gsTitles||0) + 1; }
    /* Defending: points earned at this calendar slot last season */
    var defending = (S.player.def && S.player.def[S.calIdx]) || 0;
    var netChange = pp - defending;
    var newSP = (S.player.sp||0) + netChange;
    if (newSP < 0) newSP = 0;
    var curRank = pRankOf(S);
    if (curRank < (pb.rank||1001)) pb.rank = curRank;
    if (newSP > (pb.peakS||0)) pb.peakS = newSP;
    var newRes = (S.player.res || [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]).slice();
    newRes[S.calIdx] = pp;
    var newP = Object.assign({}, S.player, { sp: newSP, ap: (S.player.ap||0)+pp, tr: Object.assign({}, S.player.tr, { tp: (S.player.tr.tp||0) + Math.round(pp/8) + 5 }), best: pb, res: newRes });
    /* Update NPC peak ranks */
    var tempS = Object.assign({}, S, { player: newP, npcs: newNpcs });
    var ranked = getRanked(tempS);
    for (var ri2 = 0; ri2 < ranked.length; ri2++) {
      if (!ranked[ri2].isP) {
        var npc = newNpcs.find(function(n){return n.id===ranked[ri2].id;});
        if (npc && (ri2+1) < ((npc.best||{}).rank||1001)) { npc.best = Object.assign({}, npc.best||{}); npc.best.rank = ri2+1; }
      }
    }
    var rNames = tier.rounds === 6 ? RN6 : RN5;
    /* ── FULL TOUR SIMULATION: ALL 1000 players compete every week ── */
    var parallelResults = [];
    var curEvent = S.cal && S.cal[S.calIdx];
    var isGSweek = curEvent && curEvent.type === "gs";
    var tempRanked = getRanked(Object.assign({}, S, { player: newP, npcs: newNpcs }));
    /* Mark which NPCs played in player's tournament (they already got points above) */
    var playedIds = {};
    for (var bri = 0; bri < ts.bracket.length; bri++) {
      var brd = ts.bracket[bri]; if (!brd) continue;
      for (var bmi = 0; bmi < brd.length; bmi++) { if (brd[bmi].a) playedIds[brd[bmi].a.id] = true; if (brd[bmi].b) playedIds[brd[bmi].b.id] = true; }
    }
    /* Run multiple tournaments at each tier for remaining NPCs */
    var tierCounts = isGSweek ? [0,0,0,0,0,1] : [10,5,3,2,1,0];
    for (var pti = 0; pti < 6; pti++) {
      var numEvents = tierCounts[pti];
      if (numEvents === 0 || pti === ts.tierIdx) { if (pti === ts.tierIdx) parallelResults.push({ tier: pti, playerEvent: true, count: 1 }); continue; }
      var pt = TIERS[pti];
      /* Collect eligible NPCs not in player's tournament */
      var eligible = [];
      for (var ei = 0; ei < tempRanked.length; ei++) {
        var er = ei + 1;
        if (!tempRanked[ei].isP && !playedIds[tempRanked[ei].id] && er >= pt.rankRange[0] && er <= pt.rankRange[1]) eligible.push(tempRanked[ei]);
      }
      if (eligible.length < 8) continue;
      /* Shuffle eligible pool */
      for (var ek = eligible.length - 1; ek > 0; ek--) { var ej = Math.floor(Math.random()*(ek+1)); var et = eligible[ek]; eligible[ek] = eligible[ej]; eligible[ej] = et; }
      var topWinner = null;
      var trainStats = ["r","p","f","s","g"];
      for (var ev = 0; ev < numEvents; ev++) {
        var poolStart = ev * pt.size;
        var pool = eligible.slice(poolStart, poolStart + pt.size);
        if (pool.length < 4) break;
        /* Track each participant's deepest round */
        var deepRound = {};
        for (var dp = 0; dp < pool.length; dp++) deepRound[pool[dp].id] = 0;
        /* Sim full bracket */
        var brackets = [pool.slice()];
        for (var rd2 = 0; rd2 < pt.rounds && brackets[brackets.length-1].length > 1; rd2++) {
          var cur = brackets[brackets.length-1]; var nxt = [];
          for (var mi2 = 0; mi2 < cur.length; mi2 += 2) {
            if (mi2+1 < cur.length) {
              var w2 = nW(cur[mi2], cur[mi2+1]);
              var l2 = w2.id === cur[mi2].id ? cur[mi2+1] : cur[mi2];
              deepRound[w2.id] = rd2 + 1;
              /* Loser gets points for round reached */
              var loserNpc = newNpcs.find(function(n){return n.id===l2.id;});
              if (loserNpc && rd2 > 0) { var lPts = Math.round(pt.pts[rd2-1] * 0.6); loserNpc.sp = (loserNpc.sp||0)+lPts; loserNpc.ap = (loserNpc.ap||0)+lPts; }
              nxt.push(w2);
            } else { nxt.push(cur[mi2]); }
          }
          brackets.push(nxt);
        }
        /* Winner gets full points + titles */
        var winner = brackets[brackets.length-1][0];
        if (winner) {
          var wNpc = newNpcs.find(function(n){return n.id===winner.id;});
          if (wNpc) {
            var totalWin = 0; for (var wp = 0; wp < pt.pts.length; wp++) totalWin += pt.pts[wp];
            wNpc.sp = (wNpc.sp||0)+totalWin; wNpc.ap = (wNpc.ap||0)+totalWin;
            wNpc.best = Object.assign({},wNpc.best||{}); wNpc.best.titles = (wNpc.best.titles||0)+1;
            if (pti === 5) wNpc.best.gsTitles = (wNpc.best.gsTitles||0)+1;
            if (!topWinner || totalWin > (topWinner.pts||0)) topWinner = { name: winner.name, emoji: winner.emoji, id: winner.id, pts: totalWin };
          }
          /* Semifinalists get partial points */
          if (brackets.length >= 3) {
            var semis2 = brackets[brackets.length - 2];
            for (var si2 = 0; si2 < semis2.length; si2++) {
              var sNpc = newNpcs.find(function(n){return n.id===semis2[si2].id && n.id!==winner.id;});
              if (sNpc) { var sPts = Math.round(pt.pts[pt.pts.length-2] * 0.7); sNpc.sp=(sNpc.sp||0)+sPts; sNpc.ap=(sNpc.ap||0)+sPts; }
            }
          }
        }
        /* ── TRAINING for ALL participants based on how far they went ── */
        for (var tp2 = 0; tp2 < pool.length; tp2++) {
          var tNpc = newNpcs.find(function(n){return n.id===pool[tp2].id;});
          if (!tNpc) continue;
          var dr = deepRound[pool[tp2].id] || 0;
          var trainLevels = 0;
          if (dr >= pt.rounds) trainLevels = 2;       /* Winner: 2 levels */
          else if (dr >= pt.rounds - 1) trainLevels = 2; /* Finalist: 2 levels */
          else if (dr >= pt.rounds - 2) trainLevels = 1; /* Semifinalist: 1 level */
          else if (dr >= 1) trainLevels = 1;             /* Won at least 1 match: 1 level */
          else trainLevels = Math.random() < 0.3 ? 1 : 0; /* R1 loser: 30% chance */
          tNpc.tr = Object.assign({s:0,g:0}, tNpc.tr||{});
          for (var tl = 0; tl < trainLevels; tl++) {
            var tSt = trainStats[Math.floor(Math.random()*5)];
            if ((tNpc.tr[tSt]||0) < 20) tNpc.tr[tSt] = (tNpc.tr[tSt]||0)+1;
          }
        }
      }
      parallelResults.push({ tier: pti, count: numEvents, winner: topWinner });
    }
    /* Background training: NPCs who didn't play still have small chance */
    var trainStats2 = ["r","p","f","s","g"];
    for (var bgI = 0; bgI < newNpcs.length; bgI++) {
      if (playedIds[newNpcs[bgI].id]) continue;
      if (Math.random() < 0.12) {
        newNpcs[bgI].tr = Object.assign({s:0,g:0}, newNpcs[bgI].tr||{});
        var bgSt = trainStats2[Math.floor(Math.random()*5)];
        if ((newNpcs[bgI].tr[bgSt]||0) < 20) newNpcs[bgI].tr[bgSt] = (newNpcs[bgI].tr[bgSt]||0)+1;
      }
    }
    /* Calculate money earned */
    var moneyEarned = 0;
    for (var mri = 0; mri <= pRound; mri++) { moneyEarned += (tier.money || [])[mri] || 0; }
    var hist = (S.tHist||[]).concat([{ num: (S.tHist||[]).length + 1, season: S.sNum, tier: ts.tierIdx, tierName: tier.name, pPts: pp, defending: defending, netChange: netChange, pRound: pRound, roundName: rNames[pRound], money: moneyEarned, winner: champW ? { name: champW.isP ? S.pName : champW.name, emoji: champW.emoji||"👑", isP: champW.isP } : null }]);
    var cal = S.cal.slice(); cal[S.calIdx].done = true; cal[S.calIdx].tier = ts.tierIdx; cal[S.calIdx].result = { pPts: pp, defending: defending, net: netChange, pRound: pRound, parallel: parallelResults };
    newP.money = (newP.money || 0) + moneyEarned;
    newP.seasonMoney = (newP.seasonMoney || 0) + moneyEarned;
    save(Object.assign({}, S, { player: newP, npcs: newNpcs, tHist: hist, cal: cal, calIdx: S.calIdx + 1 }));
    setScr("hub"); setTS(null);
  }

  /* ─── Finals ─── */
  function startFinals() {
    if (!S) return;
    var ranked = getRanked(S);
    var t16 = ranked.slice(0,16).map(function(p){return Object.assign({},p,{gP:0,gW:0,gL:0});});
    var houses = [[],[],[],[]];
    for (var i = 0; i < t16.length; i++) { var row = Math.floor(i/4); var col = row%2===0?i%4:3-i%4; houses[col].push(t16[i]); }
    var gm = [];
    for (var hi = 0; hi < 4; hi++) for (var a = 0; a < houses[hi].length; a++) for (var b = a+1; b < houses[hi].length; b++) gm.push({hi:hi,a:houses[hi][a],b:houses[hi][b],w:null});
    var st = {houses:houses,gm:gm,gi:0,phase:"groups",semis:[],final:null,champ:null,pending:null,log:[]};
    advF(st); setFS(st); setScr("finals");
  }
  function advF(st) {
    if (st.champ) return;
    if (st.phase==="groups") {
      while (st.gi < st.gm.length) { var m = st.gm[st.gi]; if (m.a.isP||m.b.isP){st.pending=st.gi;return;} var w=nW(m.a,m.b),l=w.id===m.a.id?m.b:m.a;m.w=w; var h=st.houses[m.hi]; for(var x=0;x<h.length;x++){if(h[x].id===w.id){h[x].gP+=3;h[x].gW++;}if(h[x].id===l.id){h[x].gL++;}} st.gi++; }
      var hw=st.houses.map(function(h){return h.slice().sort(function(a,b){return(b.gP-a.gP)||(b.gW-a.gW);})[0];}); st.semis=[{a:hw[0],b:hw[2],w:null},{a:hw[1],b:hw[3],w:null}]; st.phase="semis"; st.pending=null; advF(st);
    } else if (st.phase==="semis") {
      for(var i=0;i<st.semis.length;i++){var sm=st.semis[i];if(sm.w)continue;if(sm.a.isP||sm.b.isP){st.pending=i;return;}sm.w=nW(sm.a,sm.b);} if(st.semis[0].w&&st.semis[1].w){st.final={a:st.semis[0].w,b:st.semis[1].w,w:null};st.phase="final";st.pending=null;advF(st);}
    } else if (st.phase==="final"&&st.final&&!st.final.w) { if(st.final.a.isP||st.final.b.isP){st.pending="final";return;} st.final.w=nW(st.final.a,st.final.b);st.champ=st.final.w; }
  }
  function onFR(won) {
    if (!fs) return;
    var st = JSON.parse(JSON.stringify(fs)); var m, opp, winner, loser;
    if (st.phase==="groups") { m=st.gm[st.pending]; opp=m.a.isP?m.b:m.a; winner=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); loser=winner.id===m.a.id?m.b:m.a; m.w=winner; var h=st.houses[m.hi]; for(var x=0;x<h.length;x++){if(h[x].id===winner.id){h[x].gP+=3;h[x].gW++;}if(h[x].id===loser.id){h[x].gL++;}} st.gi++; }
    else if (st.phase==="semis") { m=st.semis[st.pending]; opp=m.a.isP?m.b:m.a; m.w=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); }
    else if (st.phase==="final") { m=st.final; opp=m.a.isP?m.b:m.a; winner=won?(m.a.isP?m.a:m.b):(m.a.isP?m.b:m.a); m.w=winner; st.champ=winner;
      if(S){ var pb=Object.assign({},S.player.best||{}); pb.finals=(pb.finals||0)+1; save(Object.assign({},S,{player:Object.assign({},S.player,{best:pb}),champs:(S.champs||[]).concat([{name:winner.isP?S.pName:winner.name,s:S.sNum,isP:winner.isP}])})); }
    }
    st.log=st.log.concat([{phase:st.phase,opp:(opp&&opp.name)||"?",won:won}]); st.pending=null; advF(st); setFS(st);
  }

  /* ═══ RENDER ═══ */
  if (scr === "loading") return (<div style={Object.assign({},W,{display:"flex",alignItems:"center",justifyContent:"center"})}><style dangerouslySetInnerHTML={{__html:CSS}} /><span style={{color:"#facc15",fontSize:16}}>⚔️ Loading Arena Tour...</span></div>);

  if (scr === "title") return (
    <div style={Object.assign({},W,{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"})}>
      <style dangerouslySetInnerHTML={{__html:CSS}} />
      <div style={{fontSize:48}}>⚔️</div>
      <h1 style={{fontSize:22,fontWeight:900,letterSpacing:3,background:"linear-gradient(135deg,#facc15,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:"8px 0 4px"}}>ARENA TOUR</h1>
      <p style={{color:"#64748b",fontSize:11,margin:"0 0 16px"}}>1000 Warriors • 5 Tournament Tiers • Grand Slams • Season Finals</p>
      <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:18,maxWidth:320,width:"100%"}}>
        <div style={{fontSize:10,color:"#94a3b8",fontWeight:700,letterSpacing:1,marginBottom:4,textTransform:"uppercase"}}>Enter Your Warrior Name</div>
        <input value={inp} onChange={function(e){setInp(e.target.value)}} placeholder="e.g. Novak, Rafa, Serena..." onKeyDown={function(e){if(e.key==="Enter"&&inp.trim())newSeason()}}
          style={{width:"100%",padding:10,borderRadius:8,border:"1px solid rgba(250,204,21,0.3)",background:"rgba(0,0,0,0.4)",color:"#facc15",fontSize:16,fontWeight:700,outline:"none",boxSizing:"border-box",textAlign:"center",marginBottom:8}} />
        <button onClick={function(){if(inp.trim())newSeason();}} disabled={!inp.trim()} style={Object.assign({},bs("linear-gradient(135deg,#facc15,#f59e0b)","#000"),{width:"100%",marginBottom:6,opacity:inp.trim()?1:0.4})}>Begin Season 1</button>
        <button onClick={function(){fileRef.current&&fileRef.current.click()}} style={Object.assign({},bs("rgba(255,255,255,0.05)","#94a3b8"),{width:"100%",fontSize:11,border:"1px solid rgba(255,255,255,0.1)"})}>📂 Load Save</button>
        <input ref={fileRef} type="file" accept=".json" onChange={importSave} style={{display:"none"}} />
      </div>
      <div style={{marginTop:14,maxWidth:320,background:"rgba(99,102,241,0.05)",border:"1px solid rgba(129,140,248,0.1)",borderRadius:10,padding:10,textAlign:"left"}}>
        <div style={{color:"#818cf8",fontSize:9,fontWeight:700,letterSpacing:1,marginBottom:4}}>ATP-STYLE SEASON</div>
        <div style={{color:"#c7d2fe",fontSize:10,lineHeight:1.6}}>20-event season: <b>4 blocks</b> of 4 weekly tournaments + <b>Grand Slam</b>. Climb tiers from Futures → Masters as your rank improves. <b>Top 16</b> contest Season Finals. All 1000 players compete every week.</div>
      </div>
    </div>
  );

  if (!S) return (<div style={W}><p>Loading...</p></div>);

  var pRank = pRankOf(S);
  var ranked = getRanked(S);
  var seasonDone = S.calIdx >= S.cal.length;
  var curEvent = !seasonDone ? S.cal[S.calIdx] : null;
  var avTiers = availableTiers(S);

  /* ─── HUB ─── */
  if (scr === "hub") {
    var lastDone = S.calIdx > 0 ? S.cal[S.calIdx - 1] : null;
    return (
      <div style={W}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        {prof && (<Profile player={prof.p} rank={prof.rank} playerName={S.pName} onClose={function(){setProf(null)}} />)}
        {showHelp && (<HelpScreen onClose={function(){setHelp(false)}} />)}

        {/* ── Status Bar ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 10px",background:"rgba(0,0,0,0.3)",borderRadius:8,marginBottom:6,border:"1px solid rgba(255,255,255,0.04)"}}>
          <div>
            <div style={{fontSize:12,color:"#facc15",fontWeight:800}}>{S.pName}<span style={{color:"#475569",fontWeight:400,marginLeft:6,fontSize:10}}>S{S.sNum} Wk{Math.min(S.calIdx+1,TOTAL_EVENTS)}</span></div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",fontSize:11}}>
            <span style={{color:"#facc15",fontWeight:900}}>#{pRank}</span>
            <span style={{color:"#64748b"}}>{(S.player.sp||0).toLocaleString()}p</span>
            <span style={{color:"#22c55e",fontWeight:700}}>💰{(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(S.player.money||0)}</span>
          </div>
        </div>
        {/* Season progress mini-bar */}
        <div style={{display:"flex",gap:1,marginBottom:6,height:3}}>
          {S.cal.map(function(ev,i){return (<div key={i} style={{flex:1,borderRadius:2,background:ev.done?(ev.type==="gs"?"#facc15":"#22c55e"):i===S.calIdx?"#818cf8":"rgba(255,255,255,0.04)"}}/>);})}
        </div>

        {/* ── Next Event ── */}
        {!seasonDone && curEvent && !picking && (
          <div style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:8,border:"1px solid "+(curEvent.type==="gs"?"rgba(250,204,21,0.12)":"rgba(255,255,255,0.04)"),marginBottom:6}}>
            {curEvent.type === "gs" ? (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                <div><span style={{fontSize:12,fontWeight:900,color:"#facc15"}}>👑 Grand Slam {curEvent.gsNum}</span><span style={{fontSize:9,color:"#64748b",marginLeft:6}}>64p • 16K</span></div>
                {pRank <= 64 ? (
                  <button onClick={function(){startTourney(5)}} style={Object.assign({},bs("linear-gradient(135deg,#facc15,#f59e0b)","#000"),{fontSize:11,padding:"7px 14px"})}>⚔️ Enter</button>
                ) : (
                  <button onClick={function(){
                    var cal=S.cal.slice();cal[S.calIdx].done=true;cal[S.calIdx].result={pPts:0,defending:0,net:0,pRound:0,parallel:[]};
                    save(Object.assign({},S,{cal:cal,calIdx:S.calIdx+1}));
                  }} style={Object.assign({},bs("rgba(255,255,255,0.05)","#94a3b8"),{fontSize:10,padding:"6px 12px",border:"1px solid rgba(255,255,255,0.06)"})}>⏭ Skip (#{pRank})</button>
                )}
              </div>
            ) : (
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><span style={{fontSize:11,fontWeight:700,color:"#e2e8f0"}}>Week {curEvent.block}.{curEvent.week}</span>{(function(){var def=(S.player.def&&S.player.def[S.calIdx])||0;return def>0?(<span style={{fontSize:9,color:"#f59e0b",marginLeft:6}}>def:{def}</span>):null;})()}</div>
                <button onClick={function(){setPicking(true)}} style={Object.assign({},bs("linear-gradient(135deg,#22d3ee,#818cf8)","#000"),{fontSize:11,padding:"7px 14px"})}>⚔️ Play</button>
              </div>
            )}
          </div>
        )}

        {/* ── Tier Picker ── */}
        {!seasonDone && picking && (
          <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:8,border:"1px solid rgba(129,140,248,0.12)",marginBottom:6}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:700,color:"#818cf8"}}>Select Tier <span style={{color:"#64748b",fontWeight:400}}>(#{pRank})</span></span>
              <button onClick={function(){setPicking(false)}} style={{background:"none",border:"none",color:"#64748b",fontSize:14,cursor:"pointer"}}>✕</button>
            </div>
            {[0,1,2,3,4].map(function(ti){
              var t = TIERS[ti]; var canEnter = avTiers.indexOf(ti) >= 0;
              return (
                <button key={ti} onClick={function(){if(canEnter){setPicking(false);startTourney(ti);}}} disabled={!canEnter}
                  style={{display:"flex",justifyContent:"space-between",alignItems:"center",width:"100%",padding:"6px 8px",borderRadius:5,marginBottom:2,border:"1px solid "+(canEnter?t.col+"44":"rgba(255,255,255,0.03)"),background:canEnter?"rgba(0,0,0,0.2)":"transparent",cursor:canEnter?"pointer":"default",opacity:canEnter?1:0.3}}>
                  <span style={{fontSize:10,color:t.col,fontWeight:700}}>{t.name} <span style={{color:"#64748b",fontWeight:400}}>({t.rankRange[0]}-{t.rankRange[1]})</span></span>
                  <span style={{fontSize:9,color:"#94a3b8"}}>{t.pts[t.pts.length-1]}p / 💰{(t.money[t.money.length-1]/1000).toFixed(0)}K</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Season Done ── */}
        {seasonDone && (
          <div style={{background:"rgba(0,0,0,0.25)",borderRadius:8,padding:10,border:"1px solid rgba(250,204,21,0.1)",marginBottom:6,textAlign:"center"}}>
            <button onClick={pRank<=16?startFinals:nextSeason} style={Object.assign({},bs(pRank<=16?"linear-gradient(135deg,#f59e0b,#ef4444,#a855f7)":"linear-gradient(135deg,#334155,#475569)",pRank<=16?"#fff":"#94a3b8"),{width:"100%",animation:pRank<=16?"pulse 1.5s ease infinite":"none"})}>
              {pRank <= 16 ? "👑 Season Finals" : "🔄 Season " + ((S.sNum||1)+1)}
            </button>
          </div>
        )}

        {/* ── Quick Actions ── */}
        <div style={{display:"flex",gap:4,marginBottom:6}}>
          <button onClick={function(){setScr("training")}} style={Object.assign({},bs("rgba(99,102,241,0.08)","#818cf8"),{flex:1,fontSize:10,border:"1px solid rgba(129,140,248,0.12)",padding:"6px 8px"})}>🏋️ Train ({S.player.tr.tp||0})</button>
          <button onClick={function(){setHelp(true)}} style={{padding:"6px 8px",borderRadius:6,border:"1px solid rgba(250,204,21,0.15)",background:"rgba(250,204,21,0.05)",color:"#facc15",fontSize:10,cursor:"pointer",fontWeight:700}}>?</button>
          <button onClick={function(){doSync(S)}} disabled={syncing} style={{padding:"6px 8px",borderRadius:6,border:"1px solid rgba(34,197,94,0.15)",background:"rgba(34,197,94,0.05)",color:syncing?"#475569":"#22c55e",fontSize:9,cursor:syncing?"default":"pointer",fontWeight:700}}>{syncing?"...":"☁️ Sync"}</button>
          <button onClick={exportSave} style={{padding:"6px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.05)",background:"transparent",color:"#475569",fontSize:9,cursor:"pointer"}}>💾</button>
          <button onClick={function(){fileRef.current&&fileRef.current.click()}} style={{padding:"6px 8px",borderRadius:6,border:"1px solid rgba(255,255,255,0.05)",background:"transparent",color:"#475569",fontSize:9,cursor:"pointer"}}>📂</button>
          <button onClick={newGame} style={{padding:"6px 8px",borderRadius:6,border:"1px solid rgba(239,68,68,0.15)",background:"rgba(239,68,68,0.05)",color:"#ef4444",fontSize:8,cursor:"pointer"}}>New</button>
          <input ref={fileRef} type="file" accept=".json" onChange={importSave} style={{display:"none"}} />
        </div>
        {syncMsg && (<div style={{fontSize:10,color:syncMsg==="Synced!"?"#22c55e":"#ef4444",textAlign:"center",marginBottom:4,fontWeight:700}}>{syncMsg}</div>)}

        {/* ── Last Week ── */}
        {lastDone && lastDone.result && lastDone.result.parallel && lastDone.result.parallel.length > 0 && (
          <div style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:6,border:"1px solid rgba(255,255,255,0.03)",marginBottom:6}}>
            <div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>📰 LAST WEEK</div>
            <div style={{display:"flex",gap:3,flexWrap:"wrap"}}>
              {lastDone.result.parallel.map(function(pr, i){
                if (!pr) return null; var t = TIERS[pr.tier];
                return (<span key={i} style={{fontSize:8,padding:"2px 5px",borderRadius:3,background:pr.playerEvent?"rgba(250,204,21,0.08)":"rgba(0,0,0,0.2)",color:pr.playerEvent?"#facc15":t.col}}>{t.short}{pr.count>1?"×"+pr.count:""}: {pr.playerEvent?"You "+(lastDone.result.pPts||0)+"p":(pr.winner&&pr.winner.name)?sh(pr.winner.name):"—"}</span>);
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{display:"flex",gap:2,marginBottom:6}}>
          {["calendar","rankings","history"].map(function(t){
            return (<button key={t} onClick={function(){setTab(t)}} style={{flex:1,padding:"6px",borderRadius:5,border:"none",cursor:"pointer",background:tab===t?"rgba(250,204,21,0.12)":"rgba(255,255,255,0.02)",color:tab===t?"#facc15":"#64748b",fontSize:10,fontWeight:700,letterSpacing:1}}>{t==="calendar"?"📅 Calendar":t==="rankings"?"🏆 Rankings":"📊 Results"}</button>);
          })}
        </div>

        {tab === "calendar" && (
          <div style={{background:"rgba(0,0,0,0.2)",borderRadius:8,padding:8,border:"1px solid rgba(255,255,255,0.04)"}}>
            {[0,1,2,3].map(function(block){
              var startIdx = block * 5;
              return (
                <div key={block} style={{marginBottom:block<3?8:0}}>
                  <div style={{fontSize:9,color:"#475569",fontWeight:700,marginBottom:3}}>BLOCK {block+1}</div>
                  <div style={{display:"flex",gap:4}}>
                    {[0,1,2,3,4].map(function(w){
                      var idx = startIdx + w;
                      var ev = S.cal[idx]; if (!ev) return null;
                      var isCur = idx === S.calIdx && !seasonDone;
                      var isGS = ev.type === "gs";
                      var tier = ev.tier != null ? TIERS[ev.tier] : null;
                      var def = (S.player.def && S.player.def[idx]) || 0;
                      var net = ev.result ? ev.result.net : null;
                      var bg = isCur ? "rgba(250,204,21,0.15)" : ev.done ? (isGS ? "rgba(250,204,21,0.06)" : "rgba(34,197,94,0.06)") : "rgba(255,255,255,0.02)";
                      var bord = isCur ? "1px solid #facc15" : isGS ? "1px solid rgba(250,204,21,0.2)" : ev.done ? "1px solid rgba(34,197,94,0.1)" : "1px solid rgba(255,255,255,0.03)";
                      return (
                        <div key={w} style={{flex:isGS?1.4:1,background:bg,border:bord,borderRadius:5,padding:"6px 3px",textAlign:"center",minWidth:0,animation:isCur?"pulse 2s ease infinite":"none"}}>
                          <div style={{fontSize:isGS?9:8,fontWeight:isGS?800:600,color:isGS?"#facc15":"#94a3b8",lineHeight:1.2}}>
                            {isGS?"👑GS":"Wk"+(w+1)}
                          </div>
                          {ev.done && ev.result ? (
                            <div>
                              <div style={{fontSize:9,fontWeight:700,color:tier?tier.col:"#64748b",marginTop:2}}>{tier?tier.short:"—"}</div>
                              <div style={{fontSize:8,color:"#e2e8f0",marginTop:1}}>{ev.result.pPts}</div>
                              {net!=null&&net!==0&&(<div style={{fontSize:7,color:net>0?"#22c55e":"#ef4444",fontWeight:700}}>{net>0?"+":""}{net}</div>)}
                            </div>
                          ) : (
                            <div style={{marginTop:2}}>
                              {def > 0 && (<div style={{fontSize:7,color:"#f59e0b"}}>d:{def}</div>)}
                              {isCur && (<div style={{fontSize:9,color:"#facc15"}}>▶</div>)}
                              {!def && !isCur && (<div style={{fontSize:8,color:"#1e293b"}}>—</div>)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",marginTop:6,fontSize:8,color:"#475569"}}>
              <span>{S.calIdx}/{TOTAL_EVENTS} played</span>
              <span>{seasonDone?"→ Season Finals":"Next: "+(S.cal[S.calIdx]?S.cal[S.calIdx].type==="gs"?"Grand Slam":"Week "+(S.cal[S.calIdx].block||"")+"."+((S.cal[S.calIdx].week||"")):"")}</span>
            </div>
          </div>
        )}

        {tab === "rankings" && (function(){
          var pIdx = -1; for (var pi = 0; pi < ranked.length; pi++) { if (ranked[pi].isP) { pIdx = pi; break; } }
          var showTop = 50;
          var nearStart = Math.max(showTop, pIdx - 3);
          var nearEnd = Math.min(ranked.length - 1, pIdx + 7);
          var needNear = pIdx >= showTop;
          function renderRow(p, i) {
            var t = p.tr||{};
            return (
              <div key={p.id+"-"+i} onClick={function(){setProf({p:p,rank:i+1})}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"3px 5px",background:p.isP?"rgba(250,204,21,0.08)":i%2===0?"rgba(255,255,255,0.012)":"transparent",borderRadius:3,marginBottom:1,cursor:"pointer",borderLeft:i<16?"2px solid "+(i<4?"#facc15":i<8?"#22c55e":i<12?"#3b82f6":"#94a3b8"):"2px solid transparent"}}>
                <div style={{minWidth:0,flex:1}}>
                  <div style={{fontSize:10,color:p.isP?"#facc15":"#e2e8f0",fontWeight:p.isP?700:400,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    <span style={{color:i<3?["#facc15","#94a3b8","#cd7f32"][i]:"#475569",fontWeight:700,marginRight:3,width:26,display:"inline-block",textAlign:"right"}}>#{i+1}</span>
                    {p.isP?S.pName+" ⭐":(p.emoji||"")+" "+sh(p.name)}
                  </div>
                  <div style={{fontSize:8,color:"#475569",marginTop:1}}>
                    {p.isP?"":"Talent:"}{p.isP?"":((p.skill||0)>80?(<span style={{color:"#ef4444"}}>Elite</span>):(p.skill||0)>60?(<span style={{color:"#f59e0b"}}>Strong</span>):(p.skill||0)>40?(<span style={{color:"#22d3ee"}}>Avg</span>):(<span style={{color:"#94a3b8"}}>Dev</span>))} <span style={{color:"#22d3ee"}}>⚡{t.r||0}</span> <span style={{color:"#f472b6"}}>💪{t.p||0}</span> <span style={{color:"#4ade80"}}>🎯{t.f||0}</span> <span style={{color:"#fb923c"}}>🫀{t.s||0}</span> <span style={{color:"#a78bfa"}}>🛡{t.g||0}</span>
                  </div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:10,fontWeight:600,color:p.isP?"#facc15":"#cbd5e1"}}>{(p.sp||0).toLocaleString()}</div>
                  <div style={{fontSize:8,color:"#475569"}}>AT:{(p.ap||0).toLocaleString()}</div>
                </div>
              </div>
            );
          }
          return (
            <div style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:4,border:"1px solid rgba(255,255,255,0.03)",maxHeight:380,overflowY:"auto"}}>
              {ranked.slice(0, showTop).map(function(p, i){ return renderRow(p, i); })}
              {needNear && (
                <div>
                  <div style={{textAlign:"center",padding:"4px",color:"#475569",fontSize:8}}>··· {nearStart - showTop} more ···</div>
                  {ranked.slice(nearStart, nearEnd + 1).map(function(p, i){ return renderRow(p, nearStart + i); })}
                </div>
              )}
              <div style={{textAlign:"center",fontSize:8,color:"#475569",padding:3}}>Tap any player for profile • {ranked.length} total</div>
            </div>
          );
        })()}

        {tab === "history" && (
          <div style={{background:"rgba(0,0,0,0.25)",borderRadius:8,padding:6,border:"1px solid rgba(255,255,255,0.04)",maxHeight:380,overflowY:"auto"}}>
            {(S.tHist||[]).length===0?(<div style={{color:"#475569",fontSize:11,padding:6}}>No events yet.</div>):
            (S.tHist||[]).slice().reverse().map(function(t,i){
              var tier = TIERS[t.tier]||TIERS[0];
              return (
                <div key={i} style={{padding:"5px 7px",background:i%2?"transparent":"rgba(255,255,255,0.015)",borderRadius:4,marginBottom:1}}>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}>
                    <span><span style={{color:tier.col,fontWeight:700}}>{tier.short}</span><span style={{color:"#64748b",marginLeft:4}}>S{t.season}</span></span>
                    <div style={{textAlign:"right"}}>
                      <span style={{color:"#e2e8f0",fontWeight:600}}>{(t.pPts||0).toLocaleString()}</span>
                      {t.netChange != null && (<span style={{color:t.netChange>0?"#22c55e":t.netChange<0?"#ef4444":"#64748b",fontWeight:700,marginLeft:4,fontSize:9}}>{t.netChange>0?"+"+t.netChange:t.netChange===0?"±0":t.netChange}</span>)}
                    </div>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#64748b",marginTop:1}}>
                    <span>Reached: <span style={{color:"#94a3b8"}}>{t.roundName||"R1"}</span>{t.defending>0 && (<span style={{color:"#f59e0b",marginLeft:4}}>(def:{t.defending})</span>)}{t.money>0&&(<span style={{color:"#22c55e",marginLeft:4}}>💰{(t.money/1000).toFixed(0)}K</span>)}</span>
                    {t.winner&&(<span style={{color:t.winner.isP?"#facc15":"#94a3b8"}}>🏆 {t.winner.isP?"YOU":sh(t.winner.name)}</span>)}
                  </div>
                </div>
              );
            })}
            {(S.champs||[]).length>0&&(<div style={{marginTop:4,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:4}}><div style={{fontSize:9,color:"#facc15",fontWeight:700,marginBottom:2}}>👑 Season Champions</div>{S.champs.map(function(c,i){return(<div key={i} style={{fontSize:9,color:c.isP?"#facc15":"#94a3b8"}}>S{c.s}: {c.isP?"🌟 YOU":c.name}</div>);})}</div>)}
          </div>
        )}
      </div>
    );
  }

  /* ─── TRAINING ─── */
  if (scr === "training") return (
    <div style={W}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:13,color:"#818cf8",fontWeight:800}}>🏋️ TRAINING CAMP</span>
        <button onClick={function(){setScr("hub")}} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",color:"#94a3b8",padding:"5px 10px",borderRadius:6,fontSize:10,cursor:"pointer"}}>← Hub</button>
      </div>
      <div style={{textAlign:"center",marginBottom:14}}><span style={{fontSize:22,color:"#facc15",fontWeight:900}}>{S.player.tr.tp||0}</span><span style={{color:"#94a3b8",fontSize:12,marginLeft:6}}>TP</span></div>
      {[{k:"r",l:"Reflexes",i:"⚡",d:"Slows bar speed (relative)",c:"#22d3ee"},{k:"p",l:"Power",i:"💪",d:"Widens sweet spot (relative)",c:"#f472b6"},{k:"f",l:"Focus",i:"🎯",d:"Strike score bonus (relative)",c:"#4ade80"},{k:"s",l:"Stamina",i:"🫀",d:"Less bar acceleration between strikes",c:"#fb923c"},{k:"g",l:"Grit",i:"🛡️",d:"Raises minimum score on bad hits",c:"#a78bfa"}].map(function(st){
        var lv=S.player.tr[st.k]||0,cost=trainCost(lv),can=(S.player.tr.tp||0)>=cost&&lv<20;
        return (
          <div key={st.k} style={{marginBottom:8,padding:10,background:"rgba(255,255,255,0.025)",borderRadius:8,border:"1px solid "+(can?st.c+"33":"rgba(255,255,255,0.04)")}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
              <div><span style={{color:st.c,fontWeight:700,fontSize:13}}>{st.i} {st.l}</span><span style={{color:"#64748b",fontSize:10,marginLeft:6}}>Lv.{lv}/20</span></div>
              <button onClick={function(){doTrain(st.k)}} disabled={!can} style={{background:can?st.c:"rgba(255,255,255,0.04)",color:can?"#000":"#475569",border:"none",padding:"4px 10px",borderRadius:5,fontSize:9,fontWeight:700,cursor:can?"pointer":"default",opacity:can?1:0.5}}>{lv>=20?"MAX":cost+" TP"}</button>
            </div>
            <div style={{display:"flex",gap:1,marginBottom:3}}>{Array.from({length:20}).map(function(_,i){return(<div key={i} style={{flex:1,height:5,borderRadius:2,background:i<lv?st.c:"rgba(255,255,255,0.05)"}}/>);})}</div>
            <div style={{fontSize:9,color:"#64748b"}}>{st.d}</div>
          </div>
        );
      })}
      {(function(){
        var tr = S.player.tr;
        var total = (tr.r||0)+(tr.p||0)+(tr.f||0)+(tr.s||0)+(tr.g||0);
        var maxed = total >= 100;
        return (
          <div style={{background:"rgba(99,102,241,0.05)",borderRadius:6,padding:8,border:"1px solid rgba(129,140,248,0.08)",marginTop:4}}>
            <div style={{fontSize:9,color:"#818cf8",fontWeight:700,marginBottom:3}}>TRAINING GUIDE</div>
            <div style={{fontSize:9,color:"#94a3b8",lineHeight:1.5}}>
              All stats are <span style={{color:"#facc15"}}>relative</span> — only the gap vs your opponent matters. If you both have ⚡10, it cancels out.
            </div>
            {maxed ? (
              <div style={{marginTop:6,padding:6,background:"rgba(250,204,21,0.06)",borderRadius:4,border:"1px solid rgba(250,204,21,0.1)"}}>
                <div style={{fontSize:10,color:"#facc15",fontWeight:700}}>🏅 TRAINING COMPLETE</div>
                <div style={{fontSize:9,color:"#94a3b8",lineHeight:1.5,marginTop:2}}>
                  All stats maxed! But top NPCs also train heavily — elite opponents with skill 85+ and 15+ training still score <span style={{color:"#ef4444"}}>89-99</span> against you. Masters and Grand Slam difficulty (speed 4.5-6.5×, zone 3-6px) ensures you still need <span style={{color:"#22c55e"}}>near-perfect timing</span> to beat the best. Your advantage is the gap closes — not that you become invincible.
                </div>
              </div>
            ) : (
              <div style={{fontSize:8,color:"#475569",marginTop:3}}>
                Total: {total}/100 • NPCs gain 0-2 levels per tournament • Tournament winners gain 1 level
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );

  /* ─── TOURNAMENT ─── */
  if (scr === "tourney" && ts) {
    var tier = TIERS[ts.tierIdx]; var rNames = tier.rounds === 6 ? RN6 : RN5;
    var pm = ts.pending != null && ts.bracket[ts.round] ? ts.bracket[ts.round][ts.pending] : null;
    var opp = pm ? (pm.a.isP ? pm.b : pm.a) : null;
    var oppRank = 0; if (opp) { for (var oi = 0; oi < ranked.length; oi++) if (ranked[oi].id===opp.id){oppRank=oi+1;break;} }
    return (
      <div style={W}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        {prof && (<Profile player={prof.p} rank={prof.rank} playerName={S.pName} onClose={function(){setProf(null)}} />)}
        {showHelp && (<HelpScreen onClose={function(){setHelp(false)}} />)}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <div><span style={{fontSize:11,color:tier.col,fontWeight:700}}>{tier.name}</span><span style={{color:"#475569",margin:"0 4px"}}>•</span><span style={{fontSize:10,color:"#94a3b8"}}>{rNames[Math.min(ts.round,tier.rounds-1)]}</span></div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <button onClick={function(){setHelp(true)}} style={{background:"none",border:"1px solid rgba(250,204,21,0.15)",color:"#facc15",fontSize:9,padding:"2px 6px",borderRadius:4,cursor:"pointer",fontWeight:700}}>?</button>
            <span style={{fontSize:9,color:"#94a3b8"}}>{S.pName} <span style={{color:"#facc15"}}>#{pRank}</span></span>
          </div>
        </div>
        <div style={{display:"flex",gap:2,marginBottom:6}}>
          {rNames.map(function(_,i){return(<div key={i} style={{flex:1,height:3,borderRadius:2,background:i<ts.round?tier.col:i===ts.round?tier.col+"66":"rgba(255,255,255,0.04)"}}/>);})}
        </div>

        {pm && ts.alive && opp && (
          <div style={{background:"rgba(0,0,0,0.4)",border:"1px solid "+tier.col+"22",borderRadius:10,padding:10,marginBottom:6,animation:"glow 2s ease infinite"}}>
            <div style={{textAlign:"center",marginBottom:4}}>
              <div style={{fontSize:14,fontWeight:900,color:tier.col}}>⚔️ {rNames[ts.round]}</div>
              <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}><span style={{color:"#facc15"}}>{S.pName}</span> vs <span style={{color:"#e2e8f0",cursor:"pointer",textDecoration:"underline"}} onClick={function(){setProf({p:opp,rank:oppRank})}}>{opp.emoji} {opp.name}</span></div>
              <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:3,fontSize:9}}>
                <span style={{color:"#64748b"}}>Rank: <span style={{color:"#e2e8f0"}}>#{oppRank}</span></span>
                <span style={{color:"#64748b"}}>Talent: <span style={{color:(opp.skill||0)>80?"#ef4444":(opp.skill||0)>60?"#f59e0b":(opp.skill||0)>40?"#22d3ee":"#94a3b8"}}>{(opp.skill||0)>80?"Elite":(opp.skill||0)>60?"Strong":(opp.skill||0)>40?"Average":"Developing"}</span></span>
                <span style={{color:"#64748b"}}>Pts: <span style={{color:"#e2e8f0"}}>{(opp.sp||0).toLocaleString()}</span></span>
              </div>
              {(function(){var ot=opp.tr||{},pt=S.player.tr||{}; return (
                <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:3,fontSize:8,padding:"3px 6px",background:"rgba(0,0,0,0.3)",borderRadius:4}}>
                  {[{k:"r",i:"⚡",c:"#22d3ee"},{k:"p",i:"💪",c:"#f472b6"},{k:"f",i:"🎯",c:"#4ade80"},{k:"s",i:"🫀",c:"#fb923c"},{k:"g",i:"🛡",c:"#a78bfa"}].map(function(s){var d=(pt[s.k]||0)-(ot[s.k]||0);return(<span key={s.k} style={{color:s.c}}>{s.i}<span style={{color:"#facc15"}}>{pt[s.k]||0}</span><span style={{color:"#475569"}}>v</span><span style={{color:"#e2e8f0"}}>{ot[s.k]||0}</span>{d!==0&&(<span style={{color:d>0?"#22c55e":"#ef4444",marginLeft:1}}>{d>0?"+"+d:d}</span>)}</span>);})}
                </div>
              );})()}
              {(function(){
                var d = ts.round + [0,1,2,3,4,3][ts.tierIdx];
                var barSpd = Math.max(0.8, 2.4 + d * 0.4).toFixed(1);
                var sweet = Math.max(3, 12 - d * 1.5);
                var diffLabel = d <= 1 ? "Easy" : d <= 3 ? "Medium" : d <= 5 ? "Hard" : d <= 7 ? "Very Hard" : "Extreme";
                var diffCol = d <= 1 ? "#4ade80" : d <= 3 ? "#22d3ee" : d <= 5 ? "#f59e0b" : d <= 7 ? "#ef4444" : "#dc2626";
                return (
                  <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:3,fontSize:8,color:"#475569"}}>
                    <span>Difficulty: <span style={{color:diffCol,fontWeight:700}}>{diffLabel}</span></span>
                    <span>Bar: {barSpd}×</span>
                    <span>Zone: {sweet}px</span>
                  </div>
                );
              })()}
            </div>
            <PowerBar key={"t-"+ts.round} onDone={onTR} oppSkill={opp.skill||50} diff={ts.round + [0,1,2,3,4,3][ts.tierIdx]} tr={S.player.tr} otr={opp.tr||{}} />
          </div>
        )}
        {ts.done && (
          <div style={{background:"rgba(0,0,0,0.5)",borderRadius:10,padding:14,textAlign:"center",border:"1px solid "+tier.col+"22",marginBottom:6}}>
            <div style={{fontSize:18,fontWeight:900,color:ts.alive?tier.col:"#94a3b8"}}>{ts.alive?"🏆 "+tier.name+" Champion!":"Tournament Complete"}</div>
            <div style={{color:"#94a3b8",fontSize:11,marginTop:3}}>{ts.log.filter(function(m){return m.won}).length}W-{ts.log.filter(function(m){return !m.won}).length}L • {ts.log.reduce(function(a,m){return a+m.pts},0).toLocaleString()} pts</div>
            {(function(){ var ptsE = ts.log.reduce(function(a,m){return a+m.pts},0); var moneyE = 0; var t = TIERS[ts.tierIdx]; for(var mi=0;mi<ts.log.length;mi++){if(ts.log[mi].won&&t.money)moneyE+=(t.money[mi]||0);} return moneyE > 0 ? (<div style={{fontSize:10,color:"#22c55e",marginTop:2}}>💰 +${moneyE.toLocaleString()}</div>) : null; })()}
            {(function(){ var def = (S.player.def && S.player.def[S.calIdx]) || 0; var earned = ts.log.reduce(function(a,m){return a+m.pts},0); var net = earned - def; return def > 0 ? (<div style={{fontSize:10,marginTop:3}}><span style={{color:"#f59e0b"}}>Defending: {def}</span><span style={{color:"#475569",margin:"0 4px"}}>→</span><span style={{color:net>=0?"#22c55e":"#ef4444",fontWeight:700}}>Net: {net>=0?"+"+net:net}</span></div>) : null; })()}
            <button onClick={finishT} style={Object.assign({},bs("linear-gradient(135deg,"+tier.col+",#f59e0b)","#000"),{marginTop:10})}>Return to Hub →</button>
          </div>
        )}
        {ts.log.length>0&&(<div style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:6,marginTop:4}}><div style={{fontSize:9,color:"#64748b",fontWeight:700,marginBottom:3}}>MATCH LOG</div>{ts.log.map(function(m,i){return(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"2px 4px",fontSize:10,color:m.won?"#22c55e":"#ef4444"}}><span>{m.won?"W":"L"} {m.round} vs {sh(m.opp)}</span><span>+{m.pts}</span></div>);})}</div>)}
      </div>
    );
  }

  /* ─── FINALS ─── */
  if (scr === "finals" && fs) {
    var fpm=null,fopp=null; if(fs.pending!=null&&!fs.champ){if(fs.phase==="groups")fpm=fs.gm[fs.pending];else if(fs.phase==="semis")fpm=fs.semis[fs.pending];else if(fs.phase==="final")fpm=fs.final;if(fpm)fopp=fpm.a.isP?fpm.b:fpm.a;} var pQ=false;for(var hi=0;hi<fs.houses.length;hi++)for(var pi=0;pi<fs.houses[hi].length;pi++)if(fs.houses[hi][pi].isP)pQ=true;
    return (
      <div style={W}>
        <style dangerouslySetInnerHTML={{__html:CSS}} />
        <div style={{textAlign:"center",marginBottom:8}}>
          <div style={{fontSize:13,fontWeight:900,letterSpacing:3,background:"linear-gradient(90deg,#ef4444,#f59e0b,#22c55e,#3b82f6,#a855f7)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>SEASON {S.sNum} FINALS</div>
          <div style={{fontSize:10,color:"#94a3b8",marginTop:2}}>{fs.champ?"Champion Crowned":fs.phase==="groups"?"Group Stage":fs.phase==="semis"?"Semifinals":"World Championship"}</div>
        </div>
        {fs.champ&&(<div style={{textAlign:"center",padding:16}}><div style={{fontSize:48}}>👑</div><div style={{fontSize:20,fontWeight:900,color:"#facc15",letterSpacing:3,animation:"cg 2s ease infinite"}}>{fs.champ.isP?"YOU ARE WORLD CHAMPION!":"WORLD CHAMPION"}</div>{!fs.champ.isP&&(<div style={{fontSize:13,color:"#94a3b8",marginTop:4}}>{fs.champ.emoji} {fs.champ.name}</div>)}<button onClick={nextSeason} style={Object.assign({},bs("linear-gradient(135deg,#facc15,#f59e0b)","#000"),{marginTop:14})}>🔄 Season {(S.sNum||1)+1}</button></div>)}
        {fpm&&fopp&&!fs.champ&&(<div style={{background:"rgba(0,0,0,0.4)",border:"1px solid rgba(250,204,21,0.12)",borderRadius:10,padding:10,marginBottom:6,animation:"glow 2s ease infinite"}}><div style={{textAlign:"center",marginBottom:4}}><div style={{fontSize:14,fontWeight:900,color:"#facc15"}}>{fs.phase==="final"?"👑 WORLD CHAMPIONSHIP":"⚔️ "+fs.phase.toUpperCase()}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}><span style={{color:"#facc15"}}>{S.pName}</span> vs <span style={{color:"#e2e8f0"}}>{fopp.emoji} {fopp.name}</span></div></div><PowerBar key={"f-"+fs.phase+"-"+fopp.id} onDone={onFR} oppSkill={fopp.skill||60} diff={fs.phase==="final"?5:fs.phase==="semis"?4:3} tr={S.player.tr} otr={fopp.tr||{}} /></div>)}
        {!fs.champ&&(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4,marginBottom:6}}>{fs.houses.map(function(h,hi){return(<div key={hi} style={{background:"rgba(0,0,0,0.25)",borderRadius:6,padding:5,border:"1px solid "+HC[hi]+"33"}}><div style={{fontSize:10,fontWeight:700,color:HC[hi],marginBottom:2}}>{HI[hi]} {HN[hi]}</div>{h.slice().sort(function(a,b){return(b.gP||0)-(a.gP||0)}).map(function(p){return(<div key={p.id} style={{display:"flex",justifyContent:"space-between",fontSize:9,padding:"1px 3px",background:p.isP?"rgba(250,204,21,0.06)":"transparent",borderRadius:2,color:p.isP?"#facc15":"#cbd5e1"}}><span style={{maxWidth:60,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.isP?"You":sh(p.name)}</span><span style={{fontWeight:600}}>{(p.gW||0)}W-{(p.gL||0)}L</span></div>);})}</div>);})}</div>)}
        {!fs.champ&&fs.semis.length>0&&(<div style={{background:"rgba(0,0,0,0.25)",borderRadius:6,padding:6,marginBottom:6}}><div style={{fontSize:10,color:"#facc15",fontWeight:700,marginBottom:3}}>Semifinals</div>{fs.semis.map(function(m,i){return(<div key={i} style={{fontSize:10,color:"#cbd5e1",padding:"2px 0",display:"flex",justifyContent:"space-between"}}><span>{m.a.isP?"You":sh(m.a.name)} vs {m.b.isP?"You":sh(m.b.name)}</span><span style={{color:m.w?"#22c55e":"#64748b",fontWeight:600}}>{m.w?(m.w.isP?"You!":sh(m.w.name)):"—"}</span></div>);})}</div>)}
        {!pQ&&!fs.champ&&(<div style={{textAlign:"center",padding:10,background:"rgba(239,68,68,0.05)",borderRadius:8}}><div style={{color:"#ef4444",fontWeight:700,fontSize:12}}>You didn't qualify</div></div>)}
      </div>
    );
  }

  return (<div style={W}><div style={{textAlign:"center",padding:40,color:"#475569"}}>Loading...</div></div>);
}
