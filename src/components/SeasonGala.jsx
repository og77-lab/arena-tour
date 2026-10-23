/* ═══ SeasonGala ═══ The end-of-season ceremony: curtain up, the world champion crowned, the season's awards
   one envelope at a time, your season in numbers, the hall of golden helmets, and next season's goal.
   Tap anywhere (or Next) to move on; Skip jumps to the end. Same cinematic language as the joust. */

import * as React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FONT } from "../ui/theme";
import { Rider, Face, PLAYER_PALETTE, paletteFor, LookPicker } from "./Rider";
import { Sparks, CountUp, REDUCED_MOTION, vibrate } from "./fx";
import { sh } from "../models/formulas";
import { playVictoryBig, playRankUp, playClang, playTitle, playWhoosh } from "../sounds";
import { HOF_RULE } from "../engine/aging";
import { enterGala, leaveGala } from "../music";
import FarewellNotice from "./FarewellNotice";
import RetireCeremony from "./RetireCeremony";

const { useState, useEffect } = React;

var GOLD = "#fbbf24", CREAM = "#fef3c7", SOFT = "#c4b5fd";

function pal(p, rank) { return p.isP ? PLAYER_PALETTE : paletteFor(p.id, rank); }
function pick(a, n) { return Array.isArray(a) ? a[((n % a.length) + a.length) % a.length] : a; }

function Kicker(props) { return (<div style={{ fontSize: 12, fontWeight: 900, letterSpacing: 4, color: SOFT, textTransform: "uppercase" }}>{props.children}</div>); }
function Big(props) {
  return (<div style={{ fontSize: props.size || 34, fontWeight: 900, fontStyle: "italic", lineHeight: 1.02, color: CREAM, letterSpacing: 0.5,
    textShadow: "0 2px 0 #f59e0b, 0 4px 0 #b45309, 0 8px 16px rgba(0,0,0,0.45)" }}>{props.children}</div>);
}

/* Velvet curtains that part on the first stage */
function Curtains() {
  var side = function (left) {
    return (<motion.div aria-hidden initial={{ x: 0 }} animate={{ x: left ? "-102%" : "102%" }} transition={{ delay: 0.5, duration: 1.1, ease: [0.6, 0, 0.3, 1] }}
      style={{ position: "absolute", top: 0, bottom: 0, [left ? "left" : "right"]: 0, width: "51%", zIndex: 6,
        background: "repeating-linear-gradient(90deg,#7f1d1d 0px,#991b1b 18px,#7f1d1d 36px)", boxShadow: "inset " + (left ? "-" : "") + "18px 0 30px rgba(0,0,0,0.5)" }} />);
  };
  return (<>{side(true)}{side(false)}</>);
}

function Spotlight() {
  return (<div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none",
    background: "radial-gradient(ellipse 60% 45% at 50% 38%, rgba(253,230,138,0.22), transparent 70%)" }} />);
}

function Stage(props) {
  return (
    <motion.div key={props.k} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: REDUCED_MOTION ? 0.15 : 0.45, ease: [0.2, 0.8, 0.3, 1] }}
      style={{ width: "min(100%, 440px)", margin: "0 auto", textAlign: "center", position: "relative" }}>
      {props.children}
    </motion.div>
  );
}

function AwardCard(props) {
  var a = props.a, n = props.n;
  return (
    <div style={{ position: "relative" }}>
      <motion.div initial={{ rotateY: 90 }} animate={{ rotateY: 0 }} transition={{ delay: 0.35, duration: 0.55, ease: "easeOut" }}
        style={{ transformPerspective: 800, background: "linear-gradient(180deg,#fffbeb,#fde68a)", color: "#1c1917", border: "3px solid #3f2a1d", borderRadius: 18, boxShadow: "0 6px 0 #3f2a1d, 0 18px 40px rgba(0,0,0,0.45)", padding: "14px 14px 16px" }}>
        <div style={{ fontSize: 46, lineHeight: 1 }}>{a.icon}</div>
        <div style={{ fontSize: 23, fontWeight: 900, fontStyle: "italic", marginTop: 6 }}>{a.title}</div>
        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase", color: "#92400e", marginTop: 2 }}>{a.sub}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 12 }}>
          <div style={{ width: 96, height: 78, borderRadius: 12, background: "linear-gradient(180deg,#e0f2fe,#fef3c7)", border: "2px solid #3f2a1d", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
            <Rider palette={pal(a.who, 50)} width={92} pose="cheer" />
          </div>
          <div style={{ textAlign: "left", minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{a.who.isP ? "YOU!" : a.who.emoji + " " + sh(a.who.name)}</div>
            {a.who.isP && (<div style={{ fontSize: 12, fontWeight: 800, color: "#57534e" }}>{a.who.name}</div>)}
            {a.who.rank && (<div style={{ fontSize: 12, fontWeight: 800, color: "#57534e" }}>World #{a.who.rank}</div>)}
            <div style={{ fontSize: 16, fontWeight: 900, color: "#b45309", marginTop: 3 }}>{a.stat}</div>
          </div>
        </div>
        {a.quote && (<div style={{ marginTop: 10, background: "#fff", border: "2px solid #3f2a1d", borderRadius: 14, padding: "8px 10px", fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 14 }}>“{a.quote}”</div>)}
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 13.5, color: "#44403c", marginTop: 10 }}>{pick(a.blurb, n)}</div>
      </motion.div>
      {a.who.isP && (<Sparks count={20} spread={200} delay={0.8} colors={[GOLD, "#ffffff", "#f472b6"]} zIndex={3} />)}
    </div>
  );
}

function Num(props) {
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(253,230,138,0.25)", borderRadius: 14, padding: "8px 6px" }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.6, color: SOFT, textTransform: "uppercase" }}>{props.k}</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: props.c || CREAM, marginTop: 2 }}>{props.children}</div>
    </div>
  );
}

export default function SeasonGala(props) {
  var S = props.S, champ = props.champ, awards = props.awards || [], ys = props.you, hall = props.hall || [], goal = props.goal;
  var fw = props.farewell, ret = props.retire;
  var _h = useState(""), heir = _h[0], setHeir = _h[1];
  var _hl = useState(0), heirLook = _hl[0], setHeirLook = _hl[1];
  var _r = useState(false), retiring = _r[0], setRetiring = _r[1];
  var _c = useState(false), ceremony = _c[0], setCeremony = _c[1]; /* your retirement ceremony (RetireCeremony) */
  /* After the helmets: who left the tour this year, then anyone who walked into the Hall of Fame */
  var stages = ["intro", "champ"].concat(awards.map(function (_, i) { return "award" + i; }), ["you", "hall"], fw && fw.n ? ["farewell"] : [], fw && fw.hof.length ? ["hof"] : [], ["goal"]);
  var _i = useState(0), i = _i[0], setI = _i[1];
  var st = stages[i], last = i === stages.length - 1;
  var champRank = props.champRank || 1;
  /* "Glory and Gravy" plays for the whole ceremony, and only here */
  useEffect(function () { enterGala(); return leaveGala; }, []);

  useEffect(function () {
    if (st === "intro") playWhoosh();
    else if (st === "champ") { playVictoryBig(); vibrate([40, 60, 40]); }
    else if (st.indexOf("award") === 0) { playClang(); setTimeout(function () { (awards[+st.slice(5)].who.isP ? playTitle : playRankUp)(); }, 450); }
    else if (st === "hall" || st === "hof") playRankUp();
  }, [st]);

  function next() { if (!last) setI(i + 1); }
  var climbed = ys.rankStart - ys.rankEnd;

  /* retiring: the gala hands over to the ceremony, which starts the new granny's career at its end */
  if (ceremony && ret) return (<RetireCeremony name={props.pName} heir={heir.trim()} heirLook={heirLook} career={ret.career} kit={ret.kit} generation={ret.generation} onDone={function () { props.onDone(heir.trim(), heirLook); }} />);

  return createPortal(
    <div onClick={next} style={{ position: "fixed", inset: 0, zIndex: 970, fontFamily: FONT, overflow: "hidden", userSelect: "none", WebkitUserSelect: "none", cursor: last ? "default" : "pointer",
      background: "radial-gradient(circle at 50% 30%,#4c1d95 0%,#2e1065 45%,#0f0a1e 100%)", color: CREAM }}>
      <Spotlight />
      {i === 0 && <Curtains />}
      <div style={{ position: "absolute", inset: 0, overflowY: "auto", display: "flex", flexDirection: "column", padding: "calc(env(safe-area-inset-top) + 18px) 16px calc(env(safe-area-inset-bottom) + 96px)" }}>
        <div style={{ margin: "auto 0", width: "100%" }}>
          <AnimatePresence mode="wait">
            {st === "intro" && (
              <Stage k="intro">
                <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 16 }}>
                  <div style={{ fontSize: 54 }}>🎩</div>
                  <Kicker>Season {S.sNum} · The Grand Gala</Kicker>
                  <div style={{ marginTop: 8 }}><Big size={38}>AN EVENING OF<br />GLORY & GRAVY</Big></div>
                  <div style={{ fontSize: 14, color: SOFT, marginTop: 14, lineHeight: 1.5 }}>Black tie. Clean roosters. No lances at the buffet.</div>
                </motion.div>
              </Stage>
            )}

            {st === "champ" && (
              <Stage k="champ">
                <Kicker>Season {S.sNum} · World Champion</Kicker>
                <div style={{ position: "relative", width: 230, height: 190, margin: "10px auto 0" }}>
                  <motion.div initial={{ y: -260 }} animate={{ y: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 140, damping: 14 }}
                    style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%" }}>
                    <Rider palette={pal(champ, champRank)} width={220} pose="cheer" crown={true} />
                  </motion.div>
                  <Sparks count={30} spread={240} delay={0.6} colors={[GOLD, "#ffffff", "#fde68a", "#f472b6"]} zIndex={3} />
                </div>
                <motion.div initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.75, type: "spring", stiffness: 300, damping: 14 }}>
                  <Big size={champ.isP ? 40 : 34}>{champ.isP ? "IT'S YOU!" : (champ.emoji || "") + " " + champ.name.toUpperCase()}</Big>
                </motion.div>
                <div style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 900, letterSpacing: 1.5, color: "#1c1917", background: GOLD, borderRadius: 14, padding: "3px 12px" }}>WORLD #{champRank}</div>
                <div style={{ fontSize: 14, color: SOFT, marginTop: 12, lineHeight: 1.5 }}>
                  {champ.isP ? S.pName + " is the champion of the world. Somebody fetch the good sherry." : "Crowned in the Season Finals" + (props.runnerUp ? ", beating " + (props.runnerUp.isP ? "you" : sh(props.runnerUp.name)) + " in the final." : ".")}
                </div>
              </Stage>
            )}

            {st.indexOf("award") === 0 && (function () {
              var k = +st.slice(5), a = awards[k];
              return (
                <Stage k={st}>
                  <Kicker>Award {k + 1} of {awards.length} · and the winner is…</Kicker>
                  <div style={{ marginTop: 12 }}><AwardCard a={a} n={S.sNum + k} /></div>
                </Stage>
              );
            })()}

            {st === "you" && (
              <Stage k="you">
                <Kicker>Your season</Kicker>
                <div style={{ marginTop: 6 }}><Big size={30}>{S.pName.toUpperCase()}</Big></div>
                <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 4px" }}><Rider palette={PLAYER_PALETTE} width={150} pose={climbed > 0 || ys.titles ? "cheer" : "idle"} /></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: CREAM }}>
                  World #{ys.rankStart} → <span style={{ color: GOLD, fontSize: 22 }}>#<CountUp to={ys.rankEnd} /></span>
                </div>
                <div style={{ fontSize: 13, color: climbed > 0 ? "#86efac" : climbed < 0 ? "#fca5a5" : SOFT, fontWeight: 800, marginTop: 2 }}>
                  {climbed > 0 ? "▲ " + climbed + " places climbed" : climbed < 0 ? "▼ " + (-climbed) + " places — next year, dear" : "Held steady"}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginTop: 12 }}>
                  <Num k="Events">{ys.played}</Num>
                  <Num k="Titles" c={ys.titles ? GOLD : CREAM}>{ys.titles}{ys.slamTitles ? " 👑" : ""}</Num>
                  <Num k="Points"><CountUp to={ys.pts} /></Num>
                  <Num k="Prize">${ys.money >= 1000 ? Math.round(ys.money / 1000) + "K" : ys.money}</Num>
                  <Num k="Fans" c="#f9a8d4">❤️ {ys.fans}</Num>
                  <Num k="Best scalp">{ys.scalp && ys.scalp.foeRank ? "#" + ys.scalp.foeRank : "—"}</Num>
                </div>
                {ys.titlesMix && (<div style={{ fontSize: 13, color: GOLD, fontWeight: 800, marginTop: 8 }}>Titles: {ys.titlesMix}</div>)}
                {ys.scalp && (<div style={{ fontSize: 12.5, color: SOFT, marginTop: 8 }}>Biggest win: {ys.scalp.foe.emoji} {sh(ys.scalp.foe.name)} in the {ys.scalp.round}.</div>)}
              </Stage>
            )}

            {st === "hall" && (
              <Stage k="hall">
                <Kicker>Hall of the golden helmets</Kicker>
                <div style={{ marginTop: 6 }}><Big size={28}>THE TOP TEN</Big></div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14, textAlign: "left" }}>
                  {hall.map(function (h, j) {
                    return (
                      <motion.div key={h.id} initial={{ opacity: 0, x: j % 2 ? 20 : -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + j * 0.09 }}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 12, minWidth: 0,
                          background: h.isP ? "rgba(251,191,36,0.25)" : "rgba(255,255,255,0.06)", border: "1.5px solid " + (h.isP ? GOLD : "rgba(253,230,138,0.2)") }}>
                        <span style={{ fontWeight: 900, color: GOLD, width: 24, flexShrink: 0 }}>{h.rank === 1 ? "👑" : "#" + h.rank}</span>
                        <Face palette={pal(h, h.rank)} size={32} />
                        <span style={{ minWidth: 0, fontSize: 13, fontWeight: 800, lineHeight: 1.15, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {h.isP ? "YOU" : sh(h.name)}
                          {h.isNew && (<span style={{ display: "block", fontSize: 9.5, fontWeight: 900, letterSpacing: 1, color: "#86efac" }}>NEW HELMET</span>)}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                <div style={{ fontSize: 13, color: SOFT, marginTop: 12 }}>
                  {hall.some(function (h) { return h.isP; }) ? "You've earned a golden helmet. Wear it to the shops." : "Ten golden helmets. None of them yours — yet."}
                </div>
              </Stage>
            )}

            {st === "farewell" && (
              <Stage k="farewell">
                <Kicker>Season {S.sNum} · In memoriam (mostly)</Kicker>
                <div style={{ marginTop: 6 }}><Big size={28}>FAREWELL, LADIES</Big></div>
                <div style={{ fontSize: 13.5, color: SOFT, marginTop: 8 }}>{fw.n} grannies hang up their lances this year. {fw.n} newcomers take their places at the bottom.</div>
                {fw.rival && (<div style={{ fontSize: 13.5, fontWeight: 900, color: "#fda4af", marginTop: 8 }}>Your arch-rival {fw.rival.emoji} {sh(fw.rival.name)} is leaving. Who will you argue with now?</div>)}
                {/* The notices, pinned up one by one like the back page of the parish paper */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 12 }}>
                  {fw.top.map(function (g, j) {
                    return (
                      <motion.div key={g.id} initial={{ opacity: 0, y: 14, rotate: j % 2 ? 1.5 : -1.5 }} animate={{ opacity: 1, y: 0, rotate: j % 2 ? 0.6 : -0.6 }} transition={{ delay: 0.2 + j * 0.25 }}>
                        <FarewellNotice g={g} />
                      </motion.div>
                    );
                  })}
                </div>
              </Stage>
            )}

            {st === "hof" && (
              <Stage k="hof">
                <Kicker>The Hall of Fame</Kicker>
                <div style={{ marginTop: 6 }}><Big size={30}>{fw.hof.length > 1 ? "NEW LEGENDS" : "A NEW LEGEND"}</Big></div>
                {fw.hof.map(function (g, j) {
                  return (
                    <motion.div key={g.id} initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 + j * 0.4, type: "spring", stiffness: 200, damping: 15 }} style={{ marginTop: 12 }}>
                      <div style={{ display: "flex", justifyContent: "center" }}><Rider palette={paletteFor(g.id, 1)} width={150} pose="cheer" crown={true} /></div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: CREAM }}>{g.emoji} {g.name}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: GOLD, marginTop: 2 }}>{g.hof}</div>
                      <div style={{ fontSize: 12.5, color: SOFT, marginTop: 2 }}>{g.y} seasons · best #{g.peak} · {g.titles} titles · {g.gsTitles} Slams</div>
                    </motion.div>
                  );
                })}
                <Sparks count={26} spread={240} delay={0.5} colors={[GOLD, "#ffffff", "#fde68a"]} zIndex={3} />
                <div style={{ fontSize: 12, color: SOFT, marginTop: 14 }}>The bar: {HOF_RULE}.</div>
              </Stage>
            )}

            {st === "goal" && (
              <Stage k="goal">
                <Kicker>Season {S.sNum + 1} awaits</Kicker>
                <div style={{ fontSize: 48, marginTop: 6 }}>🎯</div>
                <Big size={28}>YOUR GOAL</Big>
                <div style={{ fontSize: 18, fontWeight: 900, color: CREAM, marginTop: 10, lineHeight: 1.3 }}>{goal.text}.</div>
                <div style={{ fontSize: 13, color: SOFT, marginTop: 8, lineHeight: 1.5 }}>Last season's points carry over — and you'll defend them week by week. The rivals are already back at the gym.</div>
                {ret && (
                  <div onClick={function (e) { e.stopPropagation(); }} style={{ marginTop: 16, padding: "10px 12px", borderRadius: 14, background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(253,230,138,0.3)", textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: CREAM }}>👵 {ret.y} seasons on the tour.</div>
                    <div style={{ fontSize: 12.5, color: SOFT, marginTop: 3, lineHeight: 1.45 }}>You can retire now: your career goes up on the family wall{ret.hof ? (<b style={{ color: GOLD }}> and into the Hall of Fame ({ret.hof})</b>) : " (the Hall of Fame asks for: " + HOF_RULE + ")"}, and a new granny of the family starts from the very bottom, in this same tour.</div>
                    {!retiring ? (
                      <button onClick={function () { setRetiring(true); }} style={{ marginTop: 8, fontFamily: FONT, fontWeight: 900, fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: "pointer", background: "transparent", color: CREAM, border: "1.5px solid " + SOFT }}>Retire and pass the lance…</button>
                    ) : (<>
                      <div style={{ marginTop: 10 }}><LookPicker value={heirLook} onChange={setHeirLook} dark={true} /></div>
                      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                        <input autoFocus value={heir} maxLength={20} onChange={function (e) { setHeir(e.target.value); }} placeholder="Her name"
                          style={{ flex: 1, minWidth: 0, fontSize: 15, padding: "8px 10px", borderRadius: 10, border: "2px solid #3f2a1d", fontWeight: 800 }} />
                        <button disabled={!heir.trim()} onClick={function () { setCeremony(true); }} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: heir.trim() ? "pointer" : "default", opacity: heir.trim() ? 1 : 0.5, background: GOLD, color: "#3f2a1d", border: "2px solid #3f2a1d" }}>Pass it on</button>
                      </div>
                    </>)}
                  </div>
                )}
                <button onClick={function (e) { e.stopPropagation(); props.onDone(); }}
                  style={{ marginTop: 18, width: "100%", fontFamily: FONT, fontWeight: 900, fontSize: 17, letterSpacing: 1, textTransform: "uppercase", padding: "15px 18px", borderRadius: 14, cursor: "pointer",
                    background: "linear-gradient(180deg,#fde68a,#f59e0b)", color: "#3f2a1d", border: "2px solid #3f2a1d", boxShadow: "0 5px 0 #3f2a1d" }}>
                  🐓 Saddle up for Season {S.sNum + 1}
                </button>
              </Stage>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Progress dots + controls (fixed: never moves between stages) */}
      {!last && (
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 16px calc(env(safe-area-inset-bottom) + 14px)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, zIndex: 8 }}>
          <button onClick={function (e) { e.stopPropagation(); setI(stages.length - 1); }} style={{ background: "none", border: "none", color: SOFT, fontFamily: FONT, fontWeight: 800, fontSize: 13, cursor: "pointer", padding: 8 }}>Skip</button>
          <div style={{ display: "flex", gap: 5 }}>
            {stages.map(function (_, j) { return (<span key={j} style={{ width: j === i ? 16 : 6, height: 6, borderRadius: 3, background: j <= i ? GOLD : "rgba(255,255,255,0.25)", transition: "width 0.2s" }} />); })}
          </div>
          <button onClick={function (e) { e.stopPropagation(); next(); }} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 14, letterSpacing: 1, padding: "10px 16px", borderRadius: 12, cursor: "pointer", background: GOLD, color: "#3f2a1d", border: "2px solid #3f2a1d", boxShadow: "0 3px 0 #3f2a1d" }}>NEXT ›</button>
        </div>
      )}
    </div>,
    document.body
  );
}
