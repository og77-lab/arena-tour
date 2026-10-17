/* ═══ Interview ═══ Post-tournament press conference. Answers show no tone; the crowd's reaction is revealed after. */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { FONT } from "../ui/theme";
import { Face, PLAYER_PALETTE } from "./Rider";
import { scoreAnswer, TONE_LABEL } from "../engine/interview";
import { REDUCED_MOTION } from "./fx";
import { playClash, playDefeat } from "../sounds";

const { useState, useRef } = React;

function Flashes() {
  var dots = useRef(null);
  if (!dots.current) { dots.current = []; for (var i = 0; i < 7; i++) dots.current.push({ x: 8 + Math.random() * 84, y: 6 + Math.random() * 30, d: Math.random() * 2.4, s: 30 + Math.random() * 40 }); }
  if (REDUCED_MOTION) return null;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
      {dots.current.map(function (f, i) {
        return (<motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: [0, 0.9, 0] }} transition={{ duration: 0.35, delay: f.d, repeat: Infinity, repeatDelay: 2.2 + i * 0.3 }}
          style={{ position: "absolute", left: f.x + "%", top: f.y + "%", width: f.s, height: f.s, marginLeft: -f.s / 2, borderRadius: "50%", background: "radial-gradient(circle,#fff 0%,rgba(255,255,255,0.4) 35%,transparent 70%)" }} />);
      })}
    </div>
  );
}

export default function Interview(props) {
  var iv = props.iv;
  var _pick = useState(null), pick = _pick[0], setPick = _pick[1];
  var _res = useState(null), res = _res[0], setRes = _res[1];
  /* The coach tip is marked seen as soon as you answer — keep it on screen for this interview so nothing jumps */
  var coachOn = useState(!!props.coach)[0];

  function choose(a) {
    if (pick) return;
    var outcome = scoreAnswer(iv, a.tone, props.recentTones, null, props.fans);
    var after = Math.max(0, Math.min(100, props.fans + outcome.delta));
    var issue = props.onAnswer(a, outcome);
    setPick(a); setRes({ outcome: outcome, issue: issue, after: after });
    outcome.delta >= 0 ? playClash(true) : playDefeat();
  }

  var after = res ? res.after : props.fans;

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 955, background: "radial-gradient(circle at 50% 20%,#1e3a8a 0%,#0f172a 65%)", fontFamily: FONT, overflowY: "auto", display: "flex" }}>
      <Flashes />
      <div style={{ margin: "auto", width: "min(100%, 460px)", padding: "18px 14px 24px", boxSizing: "border-box", position: "relative" }}>
        <div style={{ textAlign: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#1c1917", borderRadius: 20, padding: "4px 12px", fontWeight: 900, fontSize: 12, letterSpacing: 1, boxShadow: "0 3px 0 #0b1226" }}>
            {iv.outlet.icon} {iv.outlet.name.toUpperCase()} · LIVE
          </span>
          <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 3, color: "#93c5fd", marginTop: 10 }}>POST-TOURNAMENT PRESS</div>
          {iv.outlet.likes && (function () {
            var ks = Object.keys(iv.outlet.likes).sort(function (a, b) { return iv.outlet.likes[b] - iv.outlet.likes[a]; });
            var love = ks.filter(function (k) { return iv.outlet.likes[k] >= 2; }), hate = ks.filter(function (k) { return iv.outlet.likes[k] < 0; });
            return (<div style={{ marginTop: 8, fontSize: 12.5, fontWeight: 800, color: "#e0e7ff", lineHeight: 1.5 }}>
              Their readers love {love.map(function (k) { return TONE_LABEL[k].icon + " " + TONE_LABEL[k].plural; }).join(" and ") || "a bit of everything"}
              {hate.length ? (<span style={{ color: "#fca5a5" }}> · dislike {hate.map(function (k) { return TONE_LABEL[k].icon + " " + TONE_LABEL[k].plural; }).join(" and ")}</span>) : null}
              {(props.recentTones || []).length ? (<div style={{ color: "#93c5fd", fontWeight: 700 }}>Repeat the same kind of answer as last time and it counts less.</div>) : null}
            </div>);
          })()}
        </div>
        {coachOn && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, background: "rgba(255,255,255,0.1)", border: "1.5px solid #fde68a", borderRadius: 12, padding: "7px 10px", color: "#fff", fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>
            <span aria-hidden style={{ fontSize: 20 }}>📣</span>
            <span>Coach Hettie: after every tournament the press wants a word. Each outlet's crowd likes different things — and nobody likes the same joke twice. Your fans go up or down with the answer.</span>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 14 }}>
          <span aria-hidden style={{ fontSize: 34, lineHeight: 1 }}>🎤</span>
          <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 320, damping: 20 }}
            style={{ flex: 1, background: "#fff", color: "#1c1917", borderRadius: 16, padding: "12px 14px", fontWeight: 800, fontSize: 16, lineHeight: 1.35, boxShadow: "0 4px 0 #0b1226" }}>
            {iv.question}
          </motion.div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 8px" }}>
          <Face palette={PLAYER_PALETTE} size={34} />
          <span style={{ color: "#e0e7ff", fontWeight: 900, fontSize: 13, letterSpacing: 1 }}>{res ? "YOU SAID" : "YOUR ANSWER"}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {iv.answers.map(function (a, i) {
            var chosen = pick && pick.text === a.text, dim = pick && !chosen;
            return (
              <motion.button key={i} onClick={function () { choose(a); }} disabled={!!pick}
                initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: dim ? 0.35 : 1 }} transition={{ delay: 0.15 + i * 0.08 }}
                style={{ textAlign: "left", fontFamily: FONT, fontSize: 15, fontWeight: 700, lineHeight: 1.35, padding: "12px 14px", borderRadius: 14, cursor: pick ? "default" : "pointer",
                  background: chosen ? "#fde68a" : "rgba(255,255,255,0.1)", color: chosen ? "#1c1917" : "#fff", border: "2px solid " + (chosen ? "#3f2a1d" : "rgba(255,255,255,0.3)") }}>
                <span style={{ display: "block", fontSize: 11, fontWeight: 900, letterSpacing: 0.5, marginBottom: 3, color: chosen ? "#57534e" : "#fde68a" }}>{(TONE_LABEL[a.tone] || {}).icon} {((TONE_LABEL[a.tone] || {}).name || "").toUpperCase()}</span>
                “{a.text}”
              </motion.button>
            );
          })}
        </div>

        {res && (
          <motion.div initial={{ y: 20, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{ marginTop: 18, background: "#fff", borderRadius: 16, padding: "12px 14px", textAlign: "center", boxShadow: "0 4px 0 #0b1226" }}>
            <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 2, color: "#57534e" }}>THE CROWD'S VERDICT</div>
            <div style={{ fontSize: 30, fontWeight: 900, color: res.outcome.delta >= 0 ? "#be123c" : "#57534e", marginTop: 2 }}>
              ❤️ {res.outcome.delta >= 0 ? "+" : "−"}{Math.abs(res.outcome.delta)}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#1c1917" }}>{res.outcome.reaction}</div>
            <div style={{ fontSize: 12.5, color: "#44403c", marginTop: 6, textAlign: "left", lineHeight: 1.5 }}>
              {(res.outcome.parts || []).map(function (x, i) { return (<div key={i}><b style={{ color: x.v > 0 ? "#15803d" : "#b91c1c" }}>{x.v > 0 ? "+" : "−"}{Math.abs(x.v)}</b> {x.why}</div>); })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#57534e", marginTop: 4 }}>Fans now <b style={{ color: "#1c1917" }}>{after}</b> / 100{pick && pick.tone === "bold" ? " · They'll remember that promise next week." : ""}</div>
            <button onClick={function () { props.onDone(res.issue); }}
              style={{ marginTop: 12, width: "100%", background: "#1c1917", color: "#f4ecd8", border: "none", borderRadius: 12, padding: "12px 16px", fontFamily: "Georgia, serif", fontWeight: 900, fontSize: 15, letterSpacing: 1, cursor: "pointer" }}>
              📰 Read The Daily Cluck →
            </button>
          </motion.div>
        )}
      </div>
    </div>,
    document.body
  );
}
