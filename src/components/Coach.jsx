/* ═══ Coach ═══ Coach Hettie walks a new granny through the game: a card for each screen the first time it opens,
   and a bubble during the first joust. Every tip shows once (player.tips); "Skip all tips" turns them off. */

import { createPortal } from "react-dom";
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { C, FONT, display, button } from "../ui/theme";
import { Face, paletteFor } from "./Rider";

const { useState } = React;

export var COACH_NAME = "Coach Hettie";
var COACH_PAL = paletteFor(4242, 1);

/* Each tip: one or more pages. {name} and {rival} are filled in by the caller */
export var TIPS = {
  welcome: [
    { t: "Welcome to the tour, {name}!", b: "I'm Coach Hettie — three Grand Slams in my day (1971, '74, and the one we don't talk about). You've just joined a tour of 1,000 jousting grannies, and you're ranked #1000. Let's fix that." },
    { t: "How a season works", b: "A season is 20 weeks. Each week you ride in one tournament that fits your rank: win matches to earn ranking points and prize money. Every fifth week is a Grand Slam — top 64 only — and the top 16 at the end ride in the Season Finals." },
    { t: "Your first step", b: "Tap Choose tournament and pick one. I'll be right there for your first joust." }
  ],
  tiers: [{ t: "Picking a tournament", b: "You can only enter tiers that suit your rank. Bigger tiers pay more points, but the grannies there are tougher. Everyone starts at the bottom, dear — pick the one on offer." }],
  train: [{ t: "The gym", b: "Every tournament earns you training points (TP), and the deeper you go the more you get — everyone on tour earns them by the same rule. Spend them here. A level only counts against your opponent's level in the same stat: if you both have 5 Aim, it cancels out. The dark tick on each bar is what the riders near you have." }],
  season: [{ t: "Your road map", b: "Every week of the season, the points you're defending from last season, and what you're chasing: a Grand Slam spot and the Finals. Tap this week's row to play." }],
  rankings: [{ t: "The rankings", b: "Your rank is your season points. Points you won at a week last season drop off when that week comes round again — so you have to keep winning just to stay put. Tap any granny for her profile." }],
  news: [{ t: "The Daily Cluck", b: "A fresh issue prints after every tournament: your week, your rival, the upsets and the world's best. The front page goes to the biggest story of the week — make it you." }],
  rival: [{ t: "You've got a rival!", b: "{rival} keeps turning up in your draws — and beating you. Beat her for Sweet Revenge (the crowd loves it). Lead her head-to-head by three and she'll leave you alone." }]
};

function fill(s, v) { return s.replace("{name}", (v && v.name) || "dear").replace("{rival}", (v && v.rival) || "One granny"); }

/* Modal card, one page at a time */
export function CoachCard(props) {
  var pages = TIPS[props.id] || [];
  var _i = useState(0), i = _i[0], setI = _i[1];
  var p = pages[i], last = i === pages.length - 1;
  if (!p) return null;
  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 2050, background: "rgba(28,25,23,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 10px calc(env(safe-area-inset-bottom) + 84px)", fontFamily: FONT }}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 340, damping: 26 }}
        style={{ width: "min(100%, 440px)", background: "#fff", border: "2px solid " + C.ink, borderRadius: 18, boxShadow: "0 5px 0 " + C.ink + ", 0 18px 40px rgba(0,0,0,0.3)", padding: "14px 14px 12px", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Face palette={COACH_PAL} size={52} />
            <span aria-hidden style={{ position: "absolute", right: -6, bottom: -4, fontSize: 18 }}>📣</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: C.goldInk, textTransform: "uppercase" }}>{COACH_NAME}{pages.length > 1 ? " · " + (i + 1) + "/" + pages.length : ""}</div>
            <AnimatePresence mode="wait">
              <motion.div key={i} initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -14 }} transition={{ duration: 0.18 }}
                style={display(19)}>{fill(p.t, props.vars)}</motion.div>
            </AnimatePresence>
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ fontSize: 14.5, color: C.text, lineHeight: 1.5, marginTop: 10 }}>{fill(p.b, props.vars)}</motion.div>
        </AnimatePresence>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 12 }}>
          <button onClick={function () { props.onDone(true); }} style={{ background: "none", border: "none", color: C.textMuted, fontFamily: FONT, fontWeight: 800, fontSize: 12.5, cursor: "pointer", padding: "6px 2px" }}>Skip all tips</button>
          <button onClick={function () { if (last) props.onDone(false); else setI(i + 1); }} style={button("gold", { padding: "10px 18px", fontSize: 14 })}>{last ? "Got it" : "Next ›"}</button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}

/* In-match bubble: sits over the arena, never takes layout space, never blocks a tap */
export function CoachBubble(props) {
  return (
    <AnimatePresence>
      {props.text && (
        <motion.div key={props.text} initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}
          style={Object.assign({ position: "absolute", left: 8, right: 8, zIndex: 6, pointerEvents: "none", display: "flex", alignItems: "center", gap: 8,
            background: "rgba(15,23,42,0.92)", color: "#fff", borderRadius: 12, padding: "7px 10px", boxShadow: "0 6px 16px rgba(0,0,0,0.25)", border: "1.5px solid #fde68a" }, props.style || { bottom: 8 })}>
          <Face palette={COACH_PAL} size={30} />
          <span style={{ fontSize: 13, fontWeight: 800, lineHeight: 1.35 }}>{props.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
