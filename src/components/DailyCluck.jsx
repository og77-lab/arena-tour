/* ═══ DailyCluck ═══ The weekly cartoon newspaper: you, your tournament, riders at your level, the world's best */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { TIERS } from "../models/constants";
import { sh } from "../models/formulas";
import { quote } from "../models/persona";
import { Face, Rider, PLAYER_PALETTE, paletteFor } from "./Rider";
import { REDUCED_MOTION } from "./fx";
import { playPaperFold } from "../sounds";

const { useState, useRef, useLayoutEffect } = React;

var PAPER = "#f4ecd8", INK = "#1c1917", SOFT = "#4a4038", RULE = "#2a211b";
var SERIF = "Georgia, 'Times New Roman', serif";

function money(m) { m = m || 0; return m >= 1000000 ? "$" + (m / 1000000).toFixed(1) + "M" : m >= 1000 ? "$" + Math.round(m / 1000) + "K" : "$" + m; }
function up(s) { return (s || "").toUpperCase(); }

/* Cartoon "photo": tilted frame, halftone dots, caption */
function Photo(props) {
  return (
    <figure style={{ margin: 0, flexShrink: 0, width: props.w || 96, transform: "rotate(" + (props.tilt || -2) + "deg)" }}>
      <div style={{ position: "relative", background: "#fff", border: "2px solid " + INK, padding: 3, boxShadow: "3px 3px 0 " + INK }}>
        <div style={{ position: "relative", height: (props.w || 96) * 0.78, overflow: "hidden", background: "linear-gradient(180deg,#e0f2fe,#fef3c7)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          {props.children}
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(28,25,23,0.18) 1px, transparent 1.3px)", backgroundSize: "4px 4px", mixBlendMode: "multiply", pointerEvents: "none" }} />
        </div>
      </div>
      {props.caption && (<figcaption style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 10.5, color: SOFT, marginTop: 5, lineHeight: 1.25, textAlign: "center" }}>{props.caption}</figcaption>)}
    </figure>
  );
}

function Bubble(props) {
  return (
    <div style={{ position: "relative", margin: "8px 0 2px 10px", background: "#fff", border: "2px solid " + INK, borderRadius: 14, padding: "6px 10px", fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: INK, boxShadow: "2px 2px 0 " + INK }}>
      “{props.children}”
      {props.by && (<span style={{ fontStyle: "normal", fontWeight: 700, fontSize: 11, color: SOFT }}> — {props.by}</span>)}
      <span aria-hidden style={{ position: "absolute", left: -9, top: 10, width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "9px solid " + INK }} />
      <span aria-hidden style={{ position: "absolute", left: -6, top: 11, width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "7px solid #fff" }} />
    </div>
  );
}

function Kicker(props) {
  return (<div style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: props.col || "#9a3412", textTransform: "uppercase", borderTop: "1px solid " + RULE, paddingTop: 7, marginTop: 12 }}>{props.children}</div>);
}

function Headline(props) {
  return (<h2 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: props.big ? 27 : 19, lineHeight: 1.05, letterSpacing: -0.4, margin: "3px 0 5px", color: INK, textTransform: "uppercase" }}>{props.children}</h2>);
}

function Body(props) { return (<p style={{ fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.45, color: INK, margin: "0 0 6px" }}>{props.children}</p>); }

function Arrow(props) {
  var d = (props.from || props.to) - props.to;
  if (!props.from || d === 0) return (<span style={{ color: SOFT, fontWeight: 700 }}>–</span>);
  return (<span style={{ color: d > 0 ? "#166534" : "#b91c1c", fontWeight: 900 }}>{d > 0 ? "▲" + d : "▼" + (-d)}</span>);
}

/* Rotating pick: each issue's variety counter v moves every pool on by one, so consecutive issues never share a line */
function pk(pool, v, off) { var n = pool.length; return pool[(((v + (off || 0)) % n) + n) % n]; }

function leadStory(y, v) {
  var T = up(y.tierName), N = up(y.name), t = y.tierName, n = y.name, R = up(y.reached), W = y.wins;
  var wins = W + (W === 1 ? " win" : " wins");
  if (y.champion) return { pose: "cheer",
    h: pk([N + " CONQUERS " + T + "!", "ALL HAIL QUEEN " + N, N + " TAKES " + T + " BY THE WATTLES", "TROPHY! " + N + " RULES " + T, "GRANNY GOLD: " + N + " SWEEPS " + T, "FEATHERS FLY AS " + N + " WINS " + T, "UNSTOPPABLE! " + N + " LIFTS " + T + " CUP"], v, 0),
    deck: pk(["Won all " + W + " matches. Roosters across the county weep.", W + " matches, " + W + " wins, not a single dropped stitch.", "The tea urn ran dry from all the celebrating.", "Rivals were spotted sobbing into their cardigans.", "Bookmakers are refunding bets out of sheer embarrassment.", "Her rooster has demanded a pay rise."], v, 3),
    say: pk(["Never bet against a granny with a boxing glove.", "I'd like to thank my hip surgeon.", "Somebody fetch me a cushion and a bigger shelf.", "Told you. I told ALL of you."], v, 1) };
  if (y.reached === "Final") return { pose: "knocked",
    h: pk(["HEARTBREAK IN THE " + T + " FINAL", "SO NEAR! " + N + " PIPPED AT " + T, "SILVER LINING FOR " + N, N + " FALLS AT THE FINAL FENCE", "ONE CHARGE TOO FAR FOR " + N, "RUNNER-UP " + N + " VOWS REVENGE"], v, 0),
    deck: pk([n + " falls one charge short of the trophy.", "The final was lost; the dignity, mostly, survived.", "Silver medal, gold-medal sulk.", n + " was last seen glaring at the trophy from a distance.", "A tissue-heavy evening in the " + t + " stands."], v, 2),
    say: pk(["Silver suits me. Gold would've suited me better.", "Second place is just first loser. Lovely ribbon, though.", "I'll be back. With sharper elbows."], v, 1) };
  if (W === 0) return { pose: "fallen",
    h: pk(["EARLY BATH FOR " + N, N + " HITS THE HAY", "SHORT AND NOT SWEET FOR " + N, "WHERE DID " + N + " GO?", "OOPS! " + N + " OUT IN A FLASH", "ROOSTER ROUT: " + N + " DUMPED EARLY"], v, 0),
    deck: pk(["Out in the " + y.reached + " of " + t + ". The tea was still warm.", "Spectators barely had time to unwrap their sandwiches.", "Her rooster has been seen hiding behind the stables.", "Over before the brass band finished tuning up.", "Not so much a run as a brisk stroll to the exit."], v, 4),
    say: pk(["My rooster had a cold. That's my story and I'm sticking to it.", "I was just checking the hay was soft. It is.", "Practice round. Everyone knows the real tournament is next week."], v, 2) };
  if (y.reached === "Semifinals" || y.reached === "Quarterfinals") return { pose: "idle",
    h: pk([N + " CHARGES INTO THE " + R, "GRANNY ON THE RISE: " + N + " IN " + T + " " + R, N + " MAKES THE " + T + " " + R, "WATCH OUT! " + N + " IS WARMING UP", "DEEP RUN FOR DETERMINED " + N, N + " RATTLES THE " + T + " DRAW"], v, 0),
    deck: pk([wins + " at " + t + " before the run finally ended.", wins + " and a rooster who's starting to believe.", "The bigger names are checking over their shoulders.", "A run that had the bingo hall on its feet.", "Knitting circles across the land are buzzing."], v, 1),
    say: pk(["Next week I'm bringing the good biscuits.", "We're only just getting started, dear.", "My rooster wants a bigger stable now. Typical."], v, 2) };
  return { pose: "idle",
    h: pk([N + " REACHES THE " + R, "STEADY DOES IT FOR " + N, N + " CLIMBS TO THE " + R, "PROGRESS! " + N + " PUSHES ON AT " + T, "QUIET WEEK, LOUD GRANNY: " + N, N + " LIVES TO JOUST ANOTHER DAY"], v, 0),
    deck: pk([wins + " at " + t + ". The lance is warming up.", wins + " and only one minor tantrum.", "Not the trophy, but the hat stayed on. Mostly.", "A respectable week, by anyone's standards. Except hers.", "Her rooster ate well, slept well and jousted reasonably."], v, 3),
    say: pk(["Small steps, dear. Small, determined steps.", "Rome wasn't built in a day. Neither was my left knee.", "Next week, the big one. Or the medium one."], v, 1) };
}

/* After a tournament: the paper spins onto the screen over everything, and folds itself away when you're done */
export default function DailyCluck(props) {
  var _f = useState(false), folding = _f[0], setFolding = _f[1];
  var closed = useRef(false);
  function close() { if (closed.current) return; closed.current = true; props.onClose(); }
  function fold() {
    if (folding) return;
    if (REDUCED_MOTION) { close(); return; }
    playPaperFold(); setFolding(true);
    setTimeout(close, 1600); /* safety net if the animation never reports back */
  }
  return createPortal(
    <motion.div onClick={fold} animate={{ opacity: folding ? 0 : 1 }} transition={{ duration: 0.35, delay: folding ? 0.85 : 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(28,25,23,0.6)", overflowY: folding ? "hidden" : "auto", overflowX: "hidden", padding: "14px 10px 30px", boxSizing: "border-box" }}>
      <CluckPaper issue={props.issue} onClose={fold} folding={folding} onFolded={close} />
    </motion.div>,
    document.body
  );
}

/* The fold: bottom half over the top (horizontal crease), then left over right (vertical crease), then tossed off-screen.
   Creases sit on the middle of what's on screen, wherever the reader has scrolled to. */
var FOLD = { duration: 1.15, times: [0, 0.32, 0.36, 0.66, 0.7, 1], ease: "easeInOut" };
function foldAnim() {
  return {
    scale: 1, /* hold the entry scale, or it falls back to its tiny starting value */
    scaleY: [1, 0.5, 0.5, 0.5, 0.5, 0.32], scaleX: [1, 1, 1, 0.5, 0.5, 0.32],
    rotateX: [0, 28, 0, 0, 0, 0], rotateY: [0, 0, 0, -28, 0, 0],
    rotate: [-1, -1, -1, -2, -2, -24], y: [0, 0, 0, 0, 0, 520], opacity: [1, 1, 1, 1, 1, 0]
  };
}

function Creases(props) {
  /* Shading that sweeps over the folding half, plus the crease lines that stay once folded */
  var t = { duration: FOLD.duration, times: FOLD.times };
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0.15, 0.15, 0.15, 0.15] }} transition={t}
        style={{ position: "absolute", left: 0, right: 0, top: props.y, height: "50vh", background: "linear-gradient(180deg, rgba(60,40,20,0.55), rgba(60,40,20,0.05))" }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 1, 1, 1] }} transition={t}
        style={{ position: "absolute", left: 0, right: 0, top: props.y - 3, height: 6, background: "linear-gradient(180deg, transparent, rgba(40,25,10,0.45), rgba(255,255,255,0.5), transparent)" }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0, 0.5, 0.15, 0.15] }} transition={t}
        style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "50%", background: "linear-gradient(90deg, rgba(60,40,20,0.05), rgba(60,40,20,0.55))" }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0, 1, 1, 1] }} transition={t}
        style={{ position: "absolute", top: 0, bottom: 0, left: "calc(50% - 3px)", width: 6, background: "linear-gradient(90deg, transparent, rgba(40,25,10,0.45), rgba(255,255,255,0.5), transparent)" }} />
    </div>
  );
}

/* The paper itself — also shown inline in the News tab (inline: no spin, no close button) */
export function CluckPaper(props) {
  var is = props.issue, y = is.special ? null : is.you, w = is.world, pe = is.peers || {}, ev = is.myEvent || {};
  var v = is.v != null ? is.v : Math.floor((is.at || 0) / 1000) % 997;
  var lead = y ? leadStory(y, v) : null;
  var rankLine = !y ? "" : !y.rankBefore || y.rankBefore === y.rankAfter
    ? "In the world rankings she holds steady at #" + y.rankAfter + "."
    : "In the world rankings she " + (y.rankAfter < y.rankBefore ? "climbs" : "slips") + " from #" + y.rankBefore + " to #" + y.rankAfter + ".";
  var top1 = w.top[0];
  var art = useRef(null);
  var _oy = useState(null), oy = _oy[0], setOy = _oy[1];
  /* Fold around the middle of what's on screen */
  useLayoutEffect(function () {
    if (!props.folding || !art.current) return;
    var r = art.current.getBoundingClientRect();
    setOy(Math.max(0, Math.min(r.height, window.innerHeight / 2 - r.top)));
  }, [props.folding]);
  var folding = props.folding && oy != null;

  return (
      <motion.article ref={art} onClick={function (e) { e.stopPropagation(); }}
        initial={props.inline ? false : REDUCED_MOTION ? { opacity: 0 } : { rotate: -720, scale: 0.05, opacity: 0 }}
        animate={folding ? foldAnim() : { rotate: props.inline ? 0 : -1, scale: 1, opacity: 1 }}
        transition={folding ? FOLD : { duration: REDUCED_MOTION ? 0.2 : 0.85, ease: [0.2, 0.8, 0.3, 1] }}
        onAnimationComplete={function () { if (folding && props.onFolded) props.onFolded(); }}
        style={{ position: "relative", transformPerspective: 900, transformOrigin: "50% " + (oy != null ? oy + "px" : "50%"), maxWidth: 520, margin: "0 auto", background: PAPER, color: INK, padding: "14px 16px 18px", boxShadow: "0 18px 40px rgba(0,0,0,0.45)", border: "1px solid #d6c7a1",
          backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.5), transparent 40%), radial-gradient(circle at 80% 90%, rgba(120,90,40,0.10), transparent 45%)" }}>
        {folding && (<Creases y={oy} />)}
        {/* Masthead */}
        <header style={{ textAlign: "center", borderBottom: "3px double " + RULE, paddingBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontSize: 9.5, letterSpacing: 1, color: SOFT, textTransform: "uppercase" }}>
            <span>Est. 1952</span><span>Season {is.s} · {is.wk}</span><span>2 corn kernels</span>
          </div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: "clamp(30px, 10vw, 44px)", letterSpacing: -1, lineHeight: 1, margin: "4px 0 2px" }}>The Daily Cluck</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: SOFT }}>All the jousting news that's fit to peck</div>
        </header>

        {/* Special edition lead: before your first tournament */}
        {is.special && (
          <section>
            <Kicker>Special edition</Kicker>
            <Headline big>{up(is.you.name)} SADDLES UP</Headline>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: SOFT, marginBottom: 8 }}>A new granny joins a tour of a thousand. The roosters are restless.</div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Photo w={118} tilt={-2.5} caption={is.you.name + " at the stables"}><div style={{ marginBottom: -4 }}><Rider palette={PLAYER_PALETTE} width={112} pose="idle" /></div></Photo>
              <div style={{ minWidth: 0 }}>
                <Body>Ranked <b>#{is.you.rankAfter}</b> in the world, {is.you.name} sets out to climb from the dusty Futures lanes to the golden helmets of the top ten.</Body>
                <Body>Every tournament earns a fresh issue of this paper: your results, your rivals, and the gossip from the gym.</Body>
              </div>
            </div>
            <Bubble by={is.you.name}>I didn't come here to knit. Well — not only to knit.</Bubble>
          </section>
        )}

        {/* Lead: you */}
        {y && (<section>
          <Kicker>{y.champion ? pk(["Extra! Extra!", "Stop the presses!", "Hold the front page!"], v, 0) : pk(["This week on the tour", "From the jousting lanes", "Our granny of the week", "Dispatches from the stables"], v, 0)}</Kicker>
          <Headline big>{lead.h}</Headline>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: SOFT, marginBottom: 8 }}>{lead.deck}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Photo w={118} tilt={-2.5} caption={y.name + (y.champion ? " with the spoils" : " after the dust settled")}>
              <div style={{ marginBottom: -4 }}><Rider palette={PLAYER_PALETTE} width={112} pose={lead.pose === "fallen" ? "knocked" : lead.pose} crown={y.champion} hatOff={lead.pose === "fallen"} /></div>
            </Photo>
            <div style={{ minWidth: 0 }}>
              <Body>{y.name} collected <b>{y.pts} points</b>{y.money ? " and " + money(y.money) + " in prize money" : ""} at {y.tierName}. {rankLine}</Body>
              {y.bestWin && (<Body>Highlight of the week: victory over {y.bestWin.foe.emoji} {sh(y.bestWin.foe.name)}{y.bestWin.foeRank ? " (world #" + y.bestWin.foeRank + ")" : ""} in the {y.bestWin.round}.</Body>)}
              {y.lostTo && (<Body>{y.lostTo.foe.emoji} {sh(y.lostTo.foe.name)} ended the run in the {y.lostTo.round}{y.rivalry ? " — the head-to-head now reads " + y.rivalry.w + "–" + y.rivalry.l + (y.rivalry.l > y.rivalry.w ? ". A rivalry is brewing." : ".") : "."}</Body>)}
            </div>
          </div>
          {is.interview ? (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 11.5, color: SOFT, marginTop: 6 }}>Asked by {is.interview.outlet.icon} <i>{is.interview.outlet.name}</i>: “{is.interview.question}”</div>
              <Bubble by={y.name}>{is.interview.quote}</Bubble>
            </div>
          ) : (<Bubble by={y.name}>{lead.say}</Bubble>)}
          {is.fans && (
            <div style={{ marginTop: 10, border: "2px solid " + INK, background: "rgba(255,255,255,0.55)", padding: "7px 10px", fontFamily: SERIF }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>❤️ The crowd</b>
                <span style={{ fontSize: 18, fontWeight: 900 }}>{is.fans.after}<span style={{ fontSize: 12, color: SOFT }}> / 100</span></span>
              </div>
              <div style={{ fontSize: 12.5, color: SOFT, lineHeight: 1.5, marginTop: 2 }}>
                On the lance <b style={{ color: is.fans.perf >= 0 ? "#166534" : "#b91c1c" }}>{is.fans.perf >= 0 ? "+" : ""}{is.fans.perf}</b>
                {is.fans.notes && is.fans.notes.length ? " (" + is.fans.notes.join(", ") + ")" : ""}
                {is.fans.interview != null && (<span> · Interview <b style={{ color: is.fans.interview >= 0 ? "#166534" : "#b91c1c" }}>{is.fans.interview >= 0 ? "+" : ""}{is.fans.interview}</b></span>)}
                {is.fans.promise && (<span> · {is.fans.promise.kept ? "Promise kept" : "Broken promise"} <b style={{ color: is.fans.promise.kept ? "#166534" : "#b91c1c" }}>{is.fans.promise.delta > 0 ? "+" : ""}{is.fans.promise.delta}</b></span>)}
                {is.fans.sponsor > 0 && (<span> · Sponsors chipped in <b>+{is.fans.sponsor} TP</b></span>)}
              </div>
              {is.interview && (<div style={{ fontSize: 12.5, fontStyle: "italic", color: INK, marginTop: 3 }}>{is.interview.reaction}</div>)}
            </div>
          )}
        </section>)}

        {/* Your tournament */}
        {ev.champ && !ev.champ.isP && (
          <section>
            <Kicker col="#1d4ed8">{ev.tierName}</Kicker>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Headline>{pk([sh(ev.champ.name) + " lifts the " + ev.tierName + " trophy", sh(ev.champ.name) + " is queen of " + ev.tierName, "Nobody could catch " + sh(ev.champ.name), sh(ev.champ.name) + " storms " + ev.tierName, "Hats off to " + sh(ev.champ.name), sh(ev.champ.name) + " bags the " + ev.tierName + " cup"], v, 2)}</Headline>
                <Body>{pk(["The week's " + ev.tierName + " draw belonged to " + ev.champ.emoji + " " + sh(ev.champ.name) + ", who rode through the bracket untouched.",
                  ev.champ.emoji + " " + sh(ev.champ.name) + " left a trail of feathers and bruised egos all the way to the " + ev.tierName + " title.",
                  "Rivals tried everything — flattery, fruitcake, mild threats — but " + ev.champ.emoji + " " + sh(ev.champ.name) + " took the title regardless.",
                  ev.champ.emoji + " " + sh(ev.champ.name) + "'s rooster did a lap of honour. Then another. Officials had to step in."], v, 1)}</Body>
                <Bubble by={sh(ev.champ.name)}>{quote(ev.champ.id, v)}</Bubble>
              </div>
              <Photo w={86} tilt={2.5} caption="Champion's lap"><div style={{ marginBottom: -3 }}><Rider palette={paletteFor(ev.champ.id)} width={82} pose="cheer" flip={true} /></div></Photo>
            </div>
          </section>
        )}

        {/* Riders at your level */}
        {(pe.climber || pe.faller || pe.gym) && (
          <section>
            <Kicker col="#166534">Around your ranking</Kicker>
            <Headline>{pk(["On the move near #" + (y ? y.rankAfter : ""), "Shake-up around #" + (y ? y.rankAfter : ""), "Your neighbours are restless", "Comings and goings in your corner", "Elbows out near #" + (y ? y.rankAfter : "")], v, 1)}</Headline>
            {[pe.climber && { m: pe.climber, txt: pk(["rockets up the rankings", "is flying up the ladder", "climbs like a startled hen", "can't stop climbing"], v, 0) }, pe.faller && { m: pe.faller, txt: pk(["takes a tumble", "slides down the ladder", "has a week to forget", "is in free fall"], v, 2) }].filter(Boolean).map(function (r) {
              return (
                <div key={r.m.p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px dotted " + RULE }}>
                  <Face palette={paletteFor(r.m.p.id, r.m.to)} size={34} />
                  <div style={{ fontFamily: SERIF, fontSize: 13.5, flex: 1, minWidth: 0 }}><b>{r.m.p.emoji} {r.m.p.name}</b> {r.txt}: #{r.m.from} → #{r.m.to}</div>
                  <Arrow from={r.m.from} to={r.m.to} />
                </div>
              );
            })}
            {pe.gym && (
              <Body><span style={{ display: "inline-block", marginTop: 6 }}><b>Gym gossip:</b> {pe.gym.p.emoji} {pe.gym.p.name} (#{pe.gym.rank}) {pk(["spent the week training", "was spotted lifting feed sacks at dawn", "has been sprinting her rooster up hills", "skipped bingo to practise"], v, 1)} — <b>+{pe.gym.lv} {pe.gym.lv === 1 ? "level" : "levels"}</b>. {pk(["The rivals aren't resting, dear.", "Best get to the gym yourself.", "Consider yourself warned.", "Something to think about over your cocoa."], v, 3)}</span></Body>
            )}
          </section>
        )}

        {/* The world's best */}
        <section>
          <Kicker col="#7c2d12">World tour</Kicker>
          <Headline>{w.newNo1
            ? pk(["New world number one! " + sh(top1.p.name) + " seizes the crown", "Long live Queen " + sh(top1.p.name) + "!", "A new #1: " + sh(top1.p.name) + " takes the throne", "The crown changes heads: " + sh(top1.p.name)], v, 0)
            : pk([sh(top1.p.name) + " still rules the tour", sh(top1.p.name) + " keeps the crown polished", "Nobody can shift " + sh(top1.p.name), sh(top1.p.name) + "'s throne: still warm, still hers", "Week after week, it's " + sh(top1.p.name), sh(top1.p.name) + " reigns on"], v, 4)}</Headline>
          <div style={{ border: "2px solid " + INK, background: "rgba(255,255,255,0.45)", marginTop: 4 }}>
            {w.top.map(function (t) {
              return (
                <div key={t.p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderTop: t.rank > 1 ? "1px solid " + RULE : "none", fontFamily: SERIF, fontSize: 13.5 }}>
                  <b style={{ width: 22 }}>{t.rank}.</b>
                  <Face palette={t.p.isP ? PLAYER_PALETTE : paletteFor(t.p.id, t.rank)} size={28} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.p.emoji} {t.p.name}{t.rank === 1 ? " 👑" : ""}</span>
                  <Arrow from={t.from} to={t.rank} />
                </div>
              );
            })}
          </div>
          {w.bigEvent && w.bigEvent.winner && (
            <Body><span style={{ display: "inline-block", marginTop: 8 }}><b>{TIERS[w.bigEvent.tier].name}:</b> {w.bigEvent.winner.emoji} {sh(w.bigEvent.winner.name)}{w.bigEvent.rank ? " (#" + w.bigEvent.rank + ")" : ""} took the week's biggest title{w.bigEvent.count > 1 ? " among " + w.bigEvent.count + " events" : ""}.</span></Body>
          )}
        </section>

        {/* Legends column (special edition) */}
        {is.legends && is.legends.length > 0 && (
          <section>
            <Kicker col="#92400e">Hall of the golden helmets</Kicker>
            <Headline>The legends you'll have to unseat</Headline>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {is.legends.map(function (l) {
                return (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: SERIF, fontSize: 12.5, minWidth: 0 }}>
                    <Face palette={paletteFor(l.id, l.rank)} size={32} />
                    <span style={{ minWidth: 0, lineHeight: 1.2 }}><b>#{l.rank}</b> {l.emoji} {sh(l.name)}<br /><span style={{ color: SOFT, fontStyle: "italic" }}>{l.titles} {l.titles === 1 ? "title" : "titles"}</span></span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer style={{ marginTop: 14, borderTop: "3px double " + RULE, paddingTop: 10, textAlign: "center" }}>
          {props.onClose ? (
            <button onClick={props.onClose} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", background: INK, color: PAPER, border: "none", padding: "11px 22px", cursor: "pointer", boxShadow: "3px 3px 0 #9a3412" }}>
              Fold the paper →
            </button>
          ) : (
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: SOFT }}>Printed on recycled hen-house paper · Next issue after your next tournament</div>
          )}
        </footer>
      </motion.article>
  );
}
