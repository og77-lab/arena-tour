/* ═══ DailyCluck ═══ The weekly cartoon newspaper: you, your tournament, riders at your level, the world's best */

import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { TIERS } from "../models/constants";
import { sh } from "../models/formulas";
import { quote } from "../models/persona";
import { Face, Rider, PLAYER_PALETTE, paletteFor } from "./Rider";
import { REDUCED_MOTION } from "./fx";

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

function leadStory(y) {
  var T = up(y.tierName), N = up(y.name);
  if (y.champion) return { h: N + " CONQUERS " + T + "!", deck: "Won all " + y.wins + " matches. Roosters across the county weep.", say: "Never bet against a granny with a boxing glove.", pose: "cheer" };
  if (y.reached === "Final") return { h: "HEARTBREAK IN THE " + T + " FINAL", deck: y.name + " falls one charge short of the trophy.", say: "Silver suits me. Gold would've suited me better.", pose: "knocked" };
  if (y.wins === 0) return { h: "EARLY BATH FOR " + N, deck: "Out in the " + y.reached + " of " + y.tierName + ". The tea was still warm.", say: "My rooster had a cold. That's my story and I'm sticking to it.", pose: "fallen" };
  if (y.reached === "Semifinals" || y.reached === "Quarterfinals") return { h: N + " CHARGES INTO THE " + up(y.reached), deck: y.wins + " wins at " + y.tierName + " before the run finally ended.", say: "Next week I'm bringing the good biscuits.", pose: "idle" };
  return { h: N + " REACHES THE " + up(y.reached), deck: y.wins + (y.wins === 1 ? " win" : " wins") + " at " + y.tierName + ". The lance is warming up.", say: "Small steps, dear. Small, determined steps.", pose: "idle" };
}

export default function DailyCluck(props) {
  var is = props.issue, y = is.you, w = is.world, pe = is.peers, ev = is.myEvent;
  var lead = leadStory(y);
  var rankLine = !y.rankBefore || y.rankBefore === y.rankAfter
    ? "In the world rankings she holds steady at #" + y.rankAfter + "."
    : "In the world rankings she " + (y.rankAfter < y.rankBefore ? "climbs" : "slips") + " from #" + y.rankBefore + " to #" + y.rankAfter + ".";
  var top1 = w.top[0];

  return createPortal(
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(28,25,23,0.6)", overflowY: "auto", padding: "14px 10px 30px", boxSizing: "border-box" }}>
      <motion.article onClick={function (e) { e.stopPropagation(); }}
        initial={REDUCED_MOTION ? { opacity: 0 } : { rotate: -720, scale: 0.05, opacity: 0 }}
        animate={{ rotate: -1, scale: 1, opacity: 1 }} transition={{ duration: REDUCED_MOTION ? 0.2 : 0.85, ease: [0.2, 0.8, 0.3, 1] }}
        style={{ maxWidth: 520, margin: "0 auto", background: PAPER, color: INK, padding: "14px 16px 18px", boxShadow: "0 18px 40px rgba(0,0,0,0.45)", border: "1px solid #d6c7a1",
          backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.5), transparent 40%), radial-gradient(circle at 80% 90%, rgba(120,90,40,0.10), transparent 45%)" }}>
        {/* Masthead */}
        <header style={{ textAlign: "center", borderBottom: "3px double " + RULE, paddingBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontSize: 9.5, letterSpacing: 1, color: SOFT, textTransform: "uppercase" }}>
            <span>Est. 1952</span><span>Season {is.s} · {is.wk}</span><span>2 corn kernels</span>
          </div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: "clamp(30px, 10vw, 44px)", letterSpacing: -1, lineHeight: 1, margin: "4px 0 2px" }}>The Daily Cluck</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: SOFT }}>All the jousting news that's fit to peck</div>
        </header>

        {/* Lead: you */}
        <section>
          <Kicker>{y.champion ? "Extra! Extra!" : "This week on the tour"}</Kicker>
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
        </section>

        {/* Your tournament */}
        {ev.champ && !ev.champ.isP && (
          <section>
            <Kicker col="#1d4ed8">{ev.tierName}</Kicker>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Headline>{sh(ev.champ.name)} lifts the {ev.tierName} trophy</Headline>
                <Body>The week's {ev.tierName} draw belonged to {ev.champ.emoji} {sh(ev.champ.name)}, who rode through the bracket untouched.</Body>
                <Bubble by={sh(ev.champ.name)}>{quote(ev.champ.id, 0)}</Bubble>
              </div>
              <Photo w={86} tilt={2.5} caption="Champion's lap"><div style={{ marginBottom: -3 }}><Rider palette={paletteFor(ev.champ.id)} width={82} pose="cheer" flip={true} /></div></Photo>
            </div>
          </section>
        )}

        {/* Riders at your level */}
        {(pe.climber || pe.faller || pe.gym) && (
          <section>
            <Kicker col="#166534">Around your ranking</Kicker>
            <Headline>On the move near #{y.rankAfter}</Headline>
            {[pe.climber && { m: pe.climber, txt: "rockets up the rankings" }, pe.faller && { m: pe.faller, txt: "takes a tumble" }].filter(Boolean).map(function (r) {
              return (
                <div key={r.m.p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px dotted " + RULE }}>
                  <Face palette={paletteFor(r.m.p.id, r.m.to)} size={34} />
                  <div style={{ fontFamily: SERIF, fontSize: 13.5, flex: 1, minWidth: 0 }}><b>{r.m.p.emoji} {r.m.p.name}</b> {r.txt}: #{r.m.from} → #{r.m.to}</div>
                  <Arrow from={r.m.from} to={r.m.to} />
                </div>
              );
            })}
            {pe.gym && (
              <Body><span style={{ display: "inline-block", marginTop: 6 }}><b>Gym gossip:</b> {pe.gym.p.emoji} {pe.gym.p.name} (#{pe.gym.rank}) spent the week training — <b>+{pe.gym.lv} {pe.gym.lv === 1 ? "level" : "levels"}</b>. The rivals aren't resting, dear.</span></Body>
            )}
          </section>
        )}

        {/* The world's best */}
        <section>
          <Kicker col="#7c2d12">World tour</Kicker>
          <Headline>{w.newNo1 ? "New world number one! " + sh(top1.p.name) + " seizes the crown" : sh(top1.p.name) + " still rules the tour"}</Headline>
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

        <footer style={{ marginTop: 14, borderTop: "3px double " + RULE, paddingTop: 10, textAlign: "center" }}>
          <button onClick={props.onClose} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", background: INK, color: PAPER, border: "none", padding: "11px 22px", cursor: "pointer", boxShadow: "3px 3px 0 #9a3412" }}>
            Fold the paper →
          </button>
        </footer>
      </motion.article>
    </div>,
    document.body
  );
}
