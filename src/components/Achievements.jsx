/* ═══ Achievements ═══ The unlock toast (slides down, one at a time) and the full badge sheet, grouped,
   with progress bars on the counted ones and how-to hints on the locked ones. */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { C, FONT, display, label, card } from "../ui/theme";
import { ACHIEVEMENTS, ACH_GROUPS, achievementById } from "../engine/achievements";
import { playRankUp } from "../sounds";
import { vibrate } from "./fx";

const { useEffect } = React;

function trTotal(tr) { tr = tr || {}; return (tr.r || 0) + (tr.p || 0) + (tr.f || 0) + (tr.s || 0) + (tr.g || 0); }

/* [current, target] for the badges that are a count */
function progress(id, S) {
  var s = S.player.stats || {}, b = S.player.best || {};
  var m = {
    wins_25: [s.wins, 25], wins_100: [s.wins, 100], titles_5: [b.titles, 5], gold_50: [s.gold, 50], gold_250: [s.gold, 250],
    decider_5: [s.deciders, 5], legends_3: [s.legendWins, 3], giant: [s.bestScalp, 100], fans_80: [S.player.fans, 80],
    gym_25: [trTotal(S.player.tr), 25], gym_100: [trTotal(S.player.tr), 100]
  }[id];
  return m ? [Math.max(0, Math.min(m[1], m[0] || 0)), m[1]] : null;
}

/* One toast at a time from the queue; several at once collapse into a summary */
export function AchToast(props) {
  var q = props.queue || [], id = q[0];
  useEffect(function () {
    if (!id) return;
    playRankUp(); vibrate(30);
    var t = setTimeout(props.onShown, 3200);
    return function () { clearTimeout(t); };
  }, [id]);
  var a = id && id.indexOf("+") === 0 ? { icon: "🏅", t: id.slice(1) + " achievements unlocked", d: "Open your badges to see them all" } : id ? achievementById(id) : null;
  return createPortal(
    <div style={{ position: "fixed", top: "calc(env(safe-area-inset-top) + 10px)", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 2100, pointerEvents: "none", padding: "0 12px" }}>
      <AnimatePresence>
        {a && (
          <motion.button key={id} onClick={props.onOpen} initial={{ y: -90, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: -90, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{ pointerEvents: "auto", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, width: "min(100%, 400px)", textAlign: "left", fontFamily: FONT,
              background: "linear-gradient(180deg,#fffbeb,#fde68a)", border: "2px solid " + C.ink, borderRadius: 16, boxShadow: "0 4px 0 " + C.ink + ", 0 12px 30px rgba(0,0,0,0.25)", padding: "8px 12px" }}>
            <motion.span initial={{ rotate: -30, scale: 0.4 }} animate={{ rotate: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 400, damping: 12 }}
              style={{ fontSize: 30, lineHeight: 1, flexShrink: 0 }}>{a.icon}</motion.span>
            <span style={{ minWidth: 0 }}>
              <span style={Object.assign(label(C.goldInk), { display: "block" })}>Achievement unlocked</span>
              <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{a.t}</span>
              <span style={{ display: "block", fontSize: 12, color: C.textSoft, fontWeight: 700 }}>{a.d}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
}

export function achCount(S) { var h = (S && S.player.ach) || {}; return ACHIEVEMENTS.filter(function (a) { return h[a.id]; }).length; }

export default function AchievementsSheet(props) {
  var S = props.S, have = S.player.ach || {};
  var n = achCount(S);
  return createPortal(
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 950, background: "rgba(28,25,23,0.55)", overflowY: "auto", padding: "calc(env(safe-area-inset-top) + 12px) 10px 30px", fontFamily: FONT }}>
      <motion.div onClick={function (e) { e.stopPropagation(); }} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 320, damping: 28 }}
        style={card({ maxWidth: 520, margin: "0 auto", padding: "14px 12px", background: C.page })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={display(26)}>🏅 Achievements</span>
          <button aria-label="Close" onClick={props.onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid " + C.ink, background: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", color: C.ink }}>×</button>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <div style={{ flex: 1, height: 10, borderRadius: 5, background: "#efe3c4", overflow: "hidden" }}>
            <div style={{ width: (n / ACHIEVEMENTS.length * 100) + "%", height: "100%", background: "linear-gradient(90deg,#fde68a,#f59e0b)" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 900, color: C.goldInk }}>{n} / {ACHIEVEMENTS.length}</span>
        </div>
        {ACH_GROUPS.map(function (g) {
          return (
            <div key={g.k} style={{ marginTop: 14 }}>
              <div style={Object.assign(label(C.textSoft), { margin: "0 2px 6px" })}>{g.title}</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {ACHIEVEMENTS.filter(function (a) { return a.g === g.k; }).map(function (a) {
                  var got = have[a.id], pr = got ? null : progress(a.id, S);
                  return (
                    <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "8px", borderRadius: 12, minWidth: 0,
                      background: got ? "linear-gradient(180deg,#fffbeb,#fef3c7)" : "#fff", border: "1.5px solid " + (got ? C.gold : C.line) }}>
                      <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, filter: got ? "none" : "grayscale(1)", opacity: got ? 1 : 0.45 }}>{a.icon}</span>
                      <span style={{ minWidth: 0, flex: 1 }}>
                        <span style={{ display: "block", fontSize: 13, fontWeight: 900, color: got ? C.text : C.textMuted, lineHeight: 1.15 }}>{a.t}</span>
                        <span style={{ display: "block", fontSize: 11.5, color: C.textSoft, lineHeight: 1.3, marginTop: 2 }}>{a.d}</span>
                        {got && got.s && (<span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: C.goldInk, marginTop: 3 }}>✓ Season {got.s}</span>)}
                        {pr && (
                          <span style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                            <span style={{ flex: 1, height: 5, borderRadius: 3, background: "#efe3c4", overflow: "hidden" }}><span style={{ display: "block", width: (pr[0] / pr[1] * 100) + "%", height: "100%", background: C.gold }} /></span>
                            <span style={{ fontSize: 10, fontWeight: 900, color: C.textMuted }}>{pr[0]}/{pr[1]}</span>
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>,
    document.body
  );
}
