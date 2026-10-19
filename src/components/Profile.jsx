/* ═══ Profile ═══ Player/NPC profile modal: stats, talent bar, training, h2h, career timeline */

import { TIERS, RN5, RN6, STATS } from "../models/constants";
import { Rider, PLAYER_PALETTE, paletteFor, withKit } from "./Rider";
import { roosterName, trait, quote, standing } from "../models/persona";
import { useState } from "react";
import { crowdLove, followersOf, crowdEdge, fmtFollowers, fanChain } from "../engine/social";
import { fansOf } from "../engine/fans";
import FanRules from "./FanRules";
import { handsTalent } from "../engine/joust";
import { titleMix, npcTitles } from "../engine/titles";
import Icon, { StatIcon } from "./Icons";
import { reachedName } from "../engine/history";

/* Fans and followers, and what they mean when you meet: the stands back whoever the crowd loves more */
function FanBox(props) {
  var p = props.p, me = props.me || {}, isMe = p.isP || p.id === 1;
  var love = isMe ? fansOf(me) : crowdLove(p, props.rank), fol = isMe ? followersOf(Object.assign({}, me, { isP: true })) : followersOf(p, props.rank);
  var line, rs = useState(false);
  if (isMe) { var c = fanChain(me, props.myRank || props.rank); line = (<span>Sponsors pay you <b style={{ color: "#15803d" }}>+{c.tp} training pts</b> a week · your ❤️ slides toward <b>{c.settle}</b></span>); }
  else {
    var mine = fansOf(me), e = crowdEdge(mine, love).d;
    line = (<span>When you meet (yours ❤️ {mine}): {e > 0.05 ? (<b style={{ color: "#15803d" }}>the stands back you, your gold zone +{e.toFixed(1)}%</b>) : e < -0.05 ? (<b style={{ color: "#b91c1c" }}>the stands back her, her gold zone +{(-e).toFixed(1)}%</b>) : (<b>the stands are split, no edge</b>)}{Math.abs(e) > 0.05 ? ", doubled on match point" : ""}</span>);
  }
  return (
    <div style={{ background: "#fff1f2", border: "1.5px solid #fecdd3", borderRadius: 8, padding: "7px 9px", marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 19, fontWeight: 600, color: "#be123c" }}><Icon name="heart" size={20} />{love}<span style={{ fontSize: 12, color: "#64748b" }}>/100 crowd love</span></span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 17, fontWeight: 600, color: "#0e7490" }}><Icon name="yarn" size={19} />{fmtFollowers(fol)} <span style={{ fontSize: 12, color: "#64748b" }}>followers</span></span>
      </div>
      <div style={{ fontSize: 12.5, color: "#44403c", marginTop: 3, lineHeight: 1.35 }}>{line} <button onClick={function () { rs[1](!rs[0]); }} style={{ border: "none", background: "none", padding: 0, color: "#be123c", fontWeight: 900, fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>{rs[0] ? "hide rules" : "📜 rules"}</button></div>
      {rs[0] && (<div style={{ marginTop: 6, background: "#fff", borderRadius: 6, padding: "6px 8px" }}><FanRules /></div>)}
    </div>
  );
}

/* Her weeks this season and last (newest first), then a line per older season: best round and titles in each tier */
function WeekByWeek(props) {
  var st = useState(false), all = st[0];
  var weeks = props.weeks, past = props.past;
  if (!weeks.length && !past.length) return null;
  var shown = all ? weeks : weeks.slice(0, 8);
  var box = { marginTop: 10, background: "#ffffff", borderRadius: 14, padding: "8px 10px", boxShadow: "0 1px 2px rgba(63,42,29,0.06), 0 3px 10px rgba(63,42,29,0.06)" };
  return (
    <div style={box}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}><Icon name="calendar" size={18} /><span style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 16, fontWeight: 600, color: "#1c1917" }}>Week by week</span></div>
      {shown.map(function (w, i) {
        var t = w.none ? null : TIERS[w.tier], champ = !w.none && w.won >= t.rounds;
        return (
          <div key={w.s + "-" + w.c} onClick={!w.none && props.onTree ? function () { props.onTree(w); } : undefined}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 6px", borderRadius: 6, background: i % 2 === 0 ? "#f8fafc" : "transparent", cursor: w.none ? "default" : "pointer" }}>
            <span style={{ width: 62, flexShrink: 0, fontSize: 11, color: "#64748b", fontWeight: 700, lineHeight: 1.15 }}>S{w.s}<br />{(w.label || "").replace("Grand Slam", "Slam").replace("Week ", "Wk ")}</span>
            {w.none ? (<span style={{ flex: 1, fontSize: 12.5, color: "#94a3b8", fontStyle: "italic" }}>Didn't ride</span>) : (
              <span style={{ flex: 1, minWidth: 0, lineHeight: 1.2 }}>
                <span style={{ display: "block", fontSize: 12.5, fontWeight: 800, color: "#1c1917", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}><span style={{ color: t.col }}>{t.short}</span> {w.name}</span>
                <span style={{ display: "block", fontSize: 11.5, color: champ ? "#b45309" : "#475569", fontWeight: champ ? 900 : 600 }}>{w.rest ? "Rested (withdrew)" : champ ? "🏆 Champion" : w.won === 0 ? "Lost in the " + w.reached : "Reached the " + w.reached}</span>
              </span>
            )}
            {!w.none && (<span style={{ flexShrink: 0, fontSize: 12.5, fontWeight: 900, color: w.pts ? "#0891b2" : "#94a3b8" }}>{w.pts ? "+" + w.pts.toLocaleString() : "0"}</span>)}
            {!w.none && (<span aria-hidden style={{ flexShrink: 0, color: "#94a3b8", fontWeight: 900 }}>›</span>)}
          </div>
        );
      })}
      {weeks.length > 8 && (<button onClick={function () { st[1](!all); }} style={{ display: "block", margin: "4px auto 0", border: "none", background: "none", color: "#4f46e5", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>{all ? "Show fewer" : "Show all " + weeks.length + " weeks"}</button>)}
      {past.map(function (o) {
        var lbl = Array.isArray(o.s) ? "Seasons " + o.s[0] + "–" + o.s[1] : "Season " + o.s;
        return (
          <div key={lbl} style={{ fontSize: 12, color: "#475569", padding: "5px 6px", borderTop: "1px dashed #e5e7eb", lineHeight: 1.35 }}>
            <b style={{ color: "#1c1917" }}>{lbl}</b> · {o.tiers.slice().reverse().map(function (x) { var T = TIERS[x.tier]; return T.short + ": " + (x.titles ? x.titles + (x.titles === 1 ? " title" : " titles") : "best " + reachedName(x.tier, x.best)); }).join(" · ")}
          </div>
        );
      })}
      {!props.isMe && weeks.length > 0 && (<div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 4 }}>Tap a week to see that tournament's whole draw</div>)}
    </div>
  );
}

export default function Profile(props) {
  var _ed = useState(false), editing = _ed[0], setEditing = _ed[1];
  var _dr = useState(""), draft = _dr[0], setDraft = _dr[1];
  var _en = useState(false), editingName = _en[0], setEditingName = _en[1];
  var _nd = useState(""), nameDraft = _nd[0], setNameDraft = _nd[1];
  var p = props.player; var rank = props.rank; var onClose = props.onClose;
  if (!p) return null;
  var t = p.tr || {};
  var totalTr = (t.r||0)+(t.p||0)+(t.f||0)+(t.s||0)+(t.g||0);
  var b = p.best || {};
  var myRooster = props.roosterName || roosterName(1);
  return (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15,23,42,0.5)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} onClick={onClose}>
      <div style={{ background: "#ffffff", borderRadius: 14, padding: 18, maxWidth: 360, width: "100%", border: "1px solid #e5e7eb", maxHeight: "80vh", overflowY: "auto" }} onClick={function(e){e.stopPropagation();}}>
        {/* Portrait hero: who she is, what she rides, what she says */}
        <div style={{ position: "relative", margin: "-18px -18px 12px", padding: "12px 14px 12px", borderRadius: "14px 14px 0 0", background: "linear-gradient(180deg,#bae6fd 0%,#fef3c7 70%,#fde68a 100%)", borderBottom: "2px solid #e2c88e" }}>
          <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 8, right: 8, background: "rgba(255,255,255,0.8)", border: "1.5px solid #3f2a1d", color: "#3f2a1d", width: 30, height: 30, borderRadius: 15, fontSize: 15, fontWeight: 900, cursor: "pointer", lineHeight: "26px", padding: 0 }}>✕</button>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ filter: "drop-shadow(0 6px 8px rgba(63,42,29,0.25))" }}>
              <Rider palette={p.isP ? withKit(PLAYER_PALETTE, p.kit) : paletteFor(p.id, rank)} width={190} pose={rank === 1 ? "cheer" : "idle"} flip={!p.isP} />
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 4 }}>
            {p.isP && editingName ? (
              <form onSubmit={function (e) { e.preventDefault(); if (nameDraft.trim()) { props.onRenamePlayer && props.onRenamePlayer(nameDraft); } setEditingName(false); }} style={{ display: "flex", justifyContent: "center", gap: 6 }}>
                <input autoFocus value={nameDraft} maxLength={20} onChange={function (e) { setNameDraft(e.target.value); }} placeholder="Your granny's name"
                  style={{ fontSize: 16, padding: "6px 10px", borderRadius: 8, border: "2px solid #3f2a1d", width: 180, fontWeight: 800 }} />
                <button type="submit" style={{ fontSize: 13, fontWeight: 900, padding: "6px 12px", borderRadius: 8, border: "2px solid #3f2a1d", background: "#fde68a", color: "#3f2a1d", cursor: "pointer" }}>Save</button>
              </form>
            ) : (
              <div style={{ fontSize: 21, fontWeight: 900, fontStyle: "italic", color: "#1c1917", lineHeight: 1.1 }}>
                {p.isP ? (props.playerName || "You") : (p.emoji || "") + " " + p.name}
                {p.isP && props.onRenamePlayer && (<button onClick={function () { setNameDraft(props.playerName || ""); setEditingName(true); }} aria-label="Rename your granny" style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 0, fontStyle: "normal" }}>✏️</button>)}
              </div>
            )}
            {!p.isP && standing(rank) && (<div style={{ display: "inline-block", marginTop: 4, background: "#92400e", color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, padding: "2px 10px", borderRadius: 12 }}>{standing(rank).icon} {standing(rank).tag.toUpperCase()} OF THE TOUR</div>)}
            {props.isRival && (<div style={{ display: "inline-block", marginTop: 4, marginLeft: 4, background: "#be123c", color: "#fff", fontSize: 11, fontWeight: 900, letterSpacing: 1.5, padding: "2px 10px", borderRadius: 12 }}>😤 YOUR ARCH-RIVAL</div>)}
            {!p.isP && (<div style={{ fontSize: 13, color: "#57534e", fontWeight: 700, marginTop: 4 }}>🐓 Rides <b style={{ color: "#1c1917" }}>{roosterName(p.id)}</b></div>)}
            {p.isP && (editing ? (
              <form onSubmit={function (e) { e.preventDefault(); props.onRenameRooster && props.onRenameRooster(draft); setEditing(false); }} style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 6 }}>
                <input autoFocus value={draft} maxLength={24} onChange={function (e) { setDraft(e.target.value); }} placeholder="Your rooster's name"
                  style={{ fontSize: 14, padding: "6px 10px", borderRadius: 8, border: "2px solid #3f2a1d", width: 170, fontWeight: 700 }} />
                <button type="submit" style={{ fontSize: 13, fontWeight: 900, padding: "6px 12px", borderRadius: 8, border: "2px solid #3f2a1d", background: "#fde68a", color: "#3f2a1d", cursor: "pointer" }}>Save</button>
              </form>
            ) : (
              <div style={{ fontSize: 13, color: "#57534e", fontWeight: 700, marginTop: 4 }}>
                🐓 Rides <b style={{ color: "#1c1917" }}>{myRooster}</b>
                {props.onRenameRooster && (<button onClick={function () { setDraft(myRooster); setEditing(true); }} aria-label="Rename your rooster" style={{ marginLeft: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, padding: 0 }}>✏️</button>)}
              </div>
            ))}
            {!p.isP && (<div style={{ fontSize: 13, color: "#57534e", fontStyle: "italic", marginTop: 2 }}>{trait(p.id)}</div>)}
          </div>
          {!p.isP && (
            <div style={{ position: "relative", margin: "8px 6px 2px", background: "#fff", border: "2px solid #3f2a1d", borderRadius: 14, padding: "6px 10px", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13, color: "#1c1917", boxShadow: "2px 2px 0 #3f2a1d", textAlign: "center" }}>
              “{quote(p.id, 0)}”
            </div>
          )}
        </div>
        <FanBox p={p} rank={rank} me={props.me} myRank={props.myRank} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
          {[{ l: "Current Rank", v: "#" + rank, c: rank <= 10 ? "#b45309" : rank <= 50 ? "#22c55e" : "#475569" },
            { l: "Peak Rank", v: "#" + Math.min(b.rank || 1001, rank), c: "#4f46e5" },
            { l: "Season Pts", v: (p.sp||0).toLocaleString(), c: "#0891b2" },
            { l: "All-Time Pts", v: (p.ap||0).toLocaleString(), c: "#db2777" },
            { l: "Season Prize $", v: "$"+(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(p.isP?(p.seasonMoney||0):(Math.round((p.sp||0)*3))), c: "#22c55e" },
            { l: "Career Prize $", v: "$"+(function(m){return m>=1000000?(m/1000000).toFixed(1)+"M":m>=1000?Math.round(m/1000)+"K":m})(p.isP?(p.money||0):((b.careerMoney||0))), c: "#16a34a" }
          ].map(function (s, i) {
            return (<div key={i} style={{ background: "#ffffff", borderRadius: 14, padding: "8px 10px", boxShadow: "0 1px 2px rgba(63,42,29,0.06), 0 3px 10px rgba(63,42,29,0.06)" }}><div style={{ fontSize: 12, fontWeight: 800, color: "#78716c", marginBottom: 1 }}>{s.l}</div><div style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div></div>);
          })}
        </div>
        {/* Skill + Potential bar for NPCs */}
        {p.isP && (function () { var me = props.me || p, ht = handsTalent(me.hm), n = (me.hm && me.hm.n) || 0; return (
          <div style={{ marginBottom: 10, padding: 8, background: "#ffffff", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#475569", fontWeight: 700 }}>🎯 Your accuracy</span>
              <span style={{ color: "#0f172a", fontWeight: 800 }}>{ht != null ? "≈ " + ht : "—"}</span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 1.35 }}>{ht != null ? "How close to the centre you usually stop, from your last " + n + " strikes: 20 a beginner · 50 an average practised player · 90 elite. Rivals' talent uses the same scale." : "Measured from your strikes — ready after 30 (" + n + " so far)."}</div>
          </div>); })()}
        {!p.isP && (
          <div style={{ marginBottom: 10, padding: 8, background: "#ffffff", borderRadius: 6 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, marginBottom: 4 }}>
              <span style={{ color: "#475569", fontWeight: 700 }}>🎯 Accuracy <span style={{ fontWeight: 600, fontSize: 12 }}>(her natural talent)</span></span>
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
                <span style={{color:"#f59e0b"}}>⚡ At peak potential — this granny has maxed out her natural talent.</span>
              ) : (
                <span>Room to grow: <span style={{color:"#f59e0b"}}>{Math.round((p.pot||92) - (p.skill||0))}</span> points until peak potential.</span>
              )}
            </div>
          </div>
        )}
        {/* Training + training total */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 16, fontWeight: 600, color: "#1c1917" }}>Training levels</span>
            <span style={{ fontSize: 13, color: "#7c3aed", fontWeight: 700 }}>{totalTr}/100</span>
          </div>
          {STATS.map(function(st){ return { k: st.k, i: st.icon, l: st.label, el: st.el, c: st.col, who: st.who }; }).map(function(s, si, all){
            var lv = t[s.k]||0;
            var head = si === 0 || all[si - 1].who !== s.who;
            return (<div key={s.k}>{head && (<div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.2, color: "#57534e", margin: si ? "6px 0 2px" : "0 0 2px" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5, letterSpacing: 0.3, fontSize: 12, fontWeight: 800 }}><Icon name={s.who === "granny" ? "granny" : s.who === "rooster" ? "rooster" : "battery"} size={16} />{s.who === "granny" ? "Granny" : s.who === "rooster" ? "Rooster" : "Both"}</span></div>)}<div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}><span style={{ color: "#1c1917", fontWeight: 700, fontSize: 13, width: 112, flexShrink: 0, lineHeight: 1.1 }}><StatIcon k={s.k} size={15} style={{ verticalAlign: "-3px", marginRight: 3 }} />{s.l}{s.el && (<span style={{ display: "block", fontSize: 10.5, fontWeight: 600, color: "#78716c", paddingLeft: 18 }}>({s.el})</span>)}</span><div style={{ flex: 1, display: "flex", gap: 1 }}>{Array.from({length:20}).map(function(_,i){return (<div key={i} style={{flex:1,height:5,borderRadius:2,background:i<lv?s.c:"#f1f5f9"}}/>);})}</div><span style={{fontSize:14,color:"#475569",width:20,textAlign:"right"}}>{lv}</span></div></div>);
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          {[{ l: "Titles", ic: "trophy", v: b.titles||0 }, { l: "Slam titles", ic: "crown", v: b.gsTitles||0 }, { l: "Finals", ic: "rank", v: b.finals||0 }].map(function(s,i){
            return (<div key={i} style={{ background: "#ffffff", borderRadius: 14, padding: "8px 10px", boxShadow: "0 1px 2px rgba(63,42,29,0.06), 0 3px 10px rgba(63,42,29,0.06)", textAlign: "center" }}><Icon name={s.ic} size={22} /><div style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 20, fontWeight: 600, color: "#b45309", lineHeight: 1.1 }}>{s.v}</div><div style={{ fontSize: 12, fontWeight: 800, color: "#78716c" }}>{s.l}</div></div>);
          })}
        </div>
        {(function () { var mix = titleMix(p.isP ? (props.myTitles || {}) : npcTitles(p)); return mix ? (<div style={{ fontSize: 12.5, fontWeight: 800, color: "#92400e", textAlign: "center", marginTop: 6 }}>{mix}</div>) : null; })()}
        {/* Week by week: every tournament she rode (tour history), tap one for its draw */}
        <WeekByWeek weeks={props.weeks || []} past={props.past || []} onTree={props.onTree} isMe={p.isP} />
        {/* Head-to-Head */}
        {!p.isP && props.h2h && props.h2h.length > 0 && (function(){
          var wins = 0, losses = 0;
          for (var hi = 0; hi < props.h2h.length; hi++) { if (props.h2h[hi].w) wins++; else losses++; }
          var last5 = props.h2h.slice(-5).reverse();
          return (
            <div style={{ marginTop: 10, padding: 10, background: "#ffffff", borderRadius: 14, padding: "8px 10px", boxShadow: "0 1px 2px rgba(63,42,29,0.06), 0 3px 10px rgba(63,42,29,0.06)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name="lances" size={18} /><span style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 16, fontWeight: 600, color: "#1c1917" }}>Head-to-head</span></span>
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
                /* Line 1: the result in sets. Line 2: every set's average score (older matches only kept the match average) */
                return (
                  <div key={i} style={{ padding: "5px 6px", borderRadius: 6, background: i % 2 === 0 ? "#f8fafc" : "transparent", marginBottom: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1 }}>
                        <span style={{ width: 18, height: 18, borderRadius: 4, background: e.w ? "#22c55e" : "#ef4444", color: "#000", fontSize: 11, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{e.w ? "W" : "L"}</span>
                        <span style={{ fontSize: 12, color: tierInfo.col, fontWeight: 700 }}>{tierInfo.short}</span>
                        <span style={{ fontSize: 12, color: "#475569" }}>{rName}</span>
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>S{e.s}</span>
                      </div>
                      {e.sc && (<span style={{ fontSize: 12.5, fontWeight: 900, color: e.w ? "#16a34a" : "#dc2626" }}>{e.w ? "Won" : "Lost"} {e.sc.replace("-", "–")}</span>)}
                    </div>
                    {e.sets && e.sets.length ? (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4, paddingLeft: 24 }}>
                        {e.sets.map(function (st, si) {
                          var won = st[0] >= st[1];
                          return (<span key={si} style={{ fontSize: 11, fontWeight: 800, padding: "1px 6px", borderRadius: 6, background: won ? "#dcfce7" : "#fee2e2", color: won ? "#166534" : "#991b1b" }}>Set {si + 1}: {st[0]}–{st[1]}</span>);
                        })}
                      </div>
                    ) : e.ma != null && e.oa != null ? (
                      <div style={{ fontSize: 11, color: "#64748b", marginTop: 2, paddingLeft: 24 }}>Average strike {e.ma} vs {e.oa} <span style={{ opacity: 0.7 }}>(set scores weren't recorded back then)</span></div>
                    ) : null}
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
            <div style={{ marginTop: 10, padding: 12, background: "#ffffff", borderRadius: 14, padding: "8px 10px", boxShadow: "0 1px 2px rgba(63,42,29,0.06), 0 3px 10px rgba(63,42,29,0.06)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}><Icon name="calendar" size={18} /><span style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif", fontSize: 16, fontWeight: 600, color: "#1c1917" }}>Career timeline</span></div>
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
              <b style={{color:"#4f46e5"}}>Talent</b> = innate combat rating. <b style={{color:"#f59e0b"}}>Potential</b> = their personal ceiling (the orange marker). Talent grows slowly through experience but can never exceed potential. <b style={{color:"#7c3aed"}}>Training</b> stacks on top — a low-talent granny with elite training can beat a naturally gifted one.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
