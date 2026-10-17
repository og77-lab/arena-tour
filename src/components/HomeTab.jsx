/* ═══ HomeTab ═══ Hub home: who you are, the one thing to do next, how the season is going */

import { motion } from "framer-motion";
import { TIERS, TOTAL_EVENTS } from "../models/constants";
import { sh } from "../models/formulas";
import { C, FONT, display, label, card, button, pill, money } from "../ui/theme";
import { Rider, Face, PLAYER_PALETTE, paletteFor, withKit } from "./Rider";
import RankSparkline from "./RankSparkline";
import { FitnessCard, FansCard } from "./Fitness";

function Bunting(props) {
  var n = 18, flags = [];
  for (var i = 0; i < n; i++) {
    var x = i * (100 / n);
    flags.push(<polygon key={i} points={x + ",0 " + (x + 100 / n) + ",0 " + (x + 50 / n) + ",10"} fill={i % 2 ? "#ffffff" : props.color} stroke="rgba(63,42,29,0.35)" strokeWidth="0.3" />);
  }
  return (
    <svg aria-hidden viewBox="0 0 100 10" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 12 }}>{flags}</svg>
  );
}

function Stat(props) {
  return (
    <div style={{ background: C.cardWarm, border: "1.5px solid " + C.line, borderRadius: 10, padding: "4px 8px", minWidth: 0 }}>
      <div style={label()}>{props.k}</div>
      <div style={{ fontSize: 15, fontWeight: 900, color: props.color || C.text, whiteSpace: "nowrap" }}>{props.v}</div>
    </div>
  );
}

/* 20 segments: done (green / gold for slams), current (pulsing), upcoming; slams marked with a crown */
function SeasonStrip(props) {
  var S = props.S;
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
      {S.cal.map(function (ev, i) {
        var isGS = ev.type === "gs", cur = i === S.calIdx;
        var bg = ev.done ? (isGS ? C.gold : "#4ade80") : cur ? C.night : "#efe3c4";
        return (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            {isGS && (<div aria-hidden style={{ fontSize: 9, lineHeight: "10px" }}>👑</div>)}
            <div style={{ height: cur ? 10 : 7, borderRadius: 3, background: bg, boxShadow: cur ? "0 0 0 2px " + C.goldSoft : "none", animation: cur ? "pulse 1.4s ease infinite" : "none" }} />
          </div>
        );
      })}
    </div>
  );
}

export default function HomeTab(props) {
  var S = props.S, pRank = props.pRank, ev = props.curEvent, seasonDone = props.seasonDone;
  var tr = S.player.tr || {};
  var def = ev && S.player.def ? (S.player.def[S.calIdx] || 0) : 0;
  var isGS = ev && ev.type === "gs";
  var fans = S.player.fans != null ? S.player.fans : 20;
  var gsWild = isGS && pRank > 64 && fans >= 80;
  var gsOk = isGS && (pRank <= 64 || gsWild);
  var heroColor = seasonDone ? "#a855f7" : isGS ? C.gold : "#0ea5e9";

  var hero;
  if (seasonDone) {
    hero = pRank <= 16
      ? { kicker: "Season " + S.sNum + " complete", title: "Season Finals", sub: "You made the top 16. Four houses, one crown.", cta: "👑 Enter the Finals", act: props.onFinals, kind: "gold" }
      : { kicker: "Season " + S.sNum + " complete", title: "Finished #" + pRank, sub: "Top 16 qualify for the Finals. Train up and go again.", cta: "🎩 To the Season Gala →", act: props.onNextSeason, kind: "gold" };
  } else if (isGS) {
    hero = gsOk
      ? { kicker: "Next event · Grand Slam " + ev.gsNum, title: "Grand Slam", sub: gsWild ? "🎟 Your fans got you a wildcard! 64 riders · best of 5 · 8,000 pts to the champion" : "64 riders · best of 5 sets · 8,000 pts to the champion", cta: "👑 Enter Grand Slam", act: props.onPlay, kind: "gold" }
      : { kicker: "Next event · Grand Slam " + ev.gsNum, title: "Not qualified", sub: "Only the top 64 ride in a Slam — you're #" + pRank + ". The tour moves on.", cta: "Skip this week →", act: props.onPlay, kind: "ghost" };
  } else {
    hero = { kicker: "Next event · Week " + ev.block + "." + ev.week, title: "Weekly Tournament", sub: "Pick a tier that fits your rank. Win rounds to earn points & prize money.", cta: "Choose tournament →", act: props.onPlay, kind: "gold" };
  }

  var last = S.calIdx > 0 ? S.cal[S.calIdx - 1] : null;
  var news = last && last.result && last.result.parallel ? last.result.parallel.filter(Boolean) : [];

  return (
    <div style={{ fontFamily: FONT, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Player card */}
      <button onClick={props.onOpenProfile} style={Object.assign(card({ padding: "10px 12px" }), { display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left", width: "100%", fontFamily: FONT })}>
        <div style={{ flexShrink: 0, width: 86, height: 70, borderRadius: 12, background: "linear-gradient(180deg,#fef3c7,#fde68a)", border: "1.5px solid " + C.line, display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
          <Rider palette={withKit(PLAYER_PALETTE, S.player.kit)} width={84} pose="idle" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
            <span style={Object.assign(display(19), { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{S.pName}</span>
            <span style={display(22, C.goldInk)}>#{pRank}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 4, marginTop: 6 }}>
            <Stat k="Points" v={(S.player.sp || 0).toLocaleString()} />
            <Stat k="Prize" v={money(S.player.money)} color={C.greenInk} />
            <Stat k="Train" v={(tr.tp || 0) + " TP"} color={C.goldInk} />
            <Stat k="Fans" v={"❤️ " + fans} color="#be123c" />
          </div>
        </div>
      </button>

      {/* Next event hero */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
        style={card({ position: "relative", overflow: "hidden", padding: "22px 14px 14px", background: "linear-gradient(180deg,#ffffff 0%,#fffbeb 100%)", borderColor: C.lineStrong })}>
        <Bunting color={heroColor} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={pill()}><span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: heroColor }} />{hero.kicker}</span>
          {def > 0 && !seasonDone && (<span style={{ fontSize: 11, fontWeight: 800, color: C.redInk }} title="Points you earned at this event last season drop off after it">Defending {def} pts</span>)}
        </div>
        <div style={Object.assign(display(30), { marginTop: 10 })}>{hero.title}</div>
        <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>{hero.sub}</div>
        <button onClick={hero.act} style={button(hero.kind, { width: "100%", marginTop: 12, fontSize: 16, padding: "14px 18px" })}>{hero.cta}</button>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={label(C.textSoft)}>Season {S.sNum}</span>
            <span style={label(C.textSoft)}>Event {Math.min(S.calIdx + 1, TOTAL_EVENTS)} / {TOTAL_EVENTS}</span>
          </div>
          <SeasonStrip S={S} />
        </div>
      </motion.div>

      <FitnessCard player={S.player} roosterName={S.player.roosterName} onTrain={props.onTrain} />
      <FansCard player={S.player} />

      {/* Training nudge when points are waiting */}
      {(tr.tp || 0) >= 15 && (
        <button onClick={props.onTrain} style={Object.assign(card({ padding: "10px 12px" }), { display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer", width: "100%", fontFamily: FONT, textAlign: "left" })}>
          <span>
            <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>🏋️ {tr.tp} training points to spend</span>
            <span style={{ display: "block", fontSize: 12, color: C.textSoft, marginTop: 2 }}>Stats only count relative to your opponent — keep up!</span>
          </span>
          <span style={{ fontSize: 20, color: C.goldInk, fontWeight: 900 }}>›</span>
        </button>
      )}

      {/* Your rival: the feud at a glance */}
      {props.rival && (
        <button onClick={props.onRival} style={Object.assign(card({ padding: "10px 12px", background: "linear-gradient(180deg,#fff,#fff1f2)", borderColor: "#fecdd3" }), { display: "flex", alignItems: "center", gap: 10, width: "100%", cursor: "pointer", textAlign: "left", fontFamily: FONT })}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <Face palette={paletteFor(props.rival.p.id, props.rival.rank)} size={46} />
            <span aria-hidden style={{ position: "absolute", right: -4, bottom: -4, fontSize: 16 }}>😤</span>
          </div>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={label("#be123c")}>Your rival</span>
            <span style={{ display: "block", fontSize: 16, fontWeight: 900, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{props.rival.p.emoji} {props.rival.p.name}</span>
            <span style={{ display: "block", fontSize: 12, color: C.textSoft, fontWeight: 700 }}>
              World #{props.rival.rank} · Head-to-head <b style={{ color: props.rival.rec && props.rival.rec.w >= props.rival.rec.l ? C.greenInk : C.redInk }}>{props.rival.rec ? props.rival.rec.w + "–" + props.rival.rec.l : "—"}</b> · lead by 3 to settle it
            </span>
          </span>
          <span style={{ fontSize: 20, color: "#be123c", fontWeight: 900 }}>›</span>
        </button>
      )}

      {/* Badges */}
      {props.ach && (
        <button onClick={props.onAch} style={Object.assign(card({ padding: "10px 12px" }), { display: "flex", alignItems: "center", gap: 10, width: "100%", cursor: "pointer", textAlign: "left", fontFamily: FONT })}>
          <span aria-hidden style={{ fontSize: 28 }}>🏅</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 15, fontWeight: 900, color: C.text }}>Achievements · {props.ach.n} / {props.ach.total}</span>
            <span style={{ display: "block", height: 7, borderRadius: 4, background: "#efe3c4", marginTop: 5, overflow: "hidden" }}>
              <span style={{ display: "block", width: (props.ach.n / props.ach.total * 100) + "%", height: "100%", background: "linear-gradient(90deg,#fde68a,#f59e0b)" }} />
            </span>
          </span>
          <span style={{ fontSize: 20, color: C.goldInk, fontWeight: 900 }}>›</span>
        </button>
      )}

      <RankSparkline history={S.player.rankHist || []} />

      {/* Latest issue of the paper */}
      {(
        <button onClick={function () { props.onReadPaper(); }}
          style={Object.assign(card({ padding: "10px 12px", background: "#f4ecd8", borderColor: "#d6c7a1" }), { display: "flex", alignItems: "center", gap: 10, width: "100%", cursor: "pointer", textAlign: "left", fontFamily: FONT })}>
          <span aria-hidden style={{ fontSize: 30, transform: "rotate(-8deg)" }}>📰</span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900, fontSize: 17, color: "#1c1917" }}>The Daily Cluck</span>
            <span style={{ display: "block", fontSize: 12, color: "#4a4038", fontWeight: 700 }}>{S.news && S.news[0] ? S.news[0].wk + " · your week, your rivals and the world's best" : "Special edition · the legends and the tour ahead"}</span>
          </span>
          <span style={{ fontSize: 13, fontWeight: 900, color: "#9a3412", whiteSpace: "nowrap" }}>Read ›</span>
        </button>
      )}

      {/* Around the tour last week (shown until the first issue is printed) */}
      {!(S.news && S.news[0]) && news.length > 0 && (
        <div style={card({ padding: "10px 12px" })}>
          <div style={label(C.textSoft)}>📰 Around the tour last week</div>
          <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
            {news.map(function (pr, i) {
              var t = TIERS[pr.tier];
              var who = pr.playerEvent ? "You · " + (last.result.pPts || 0) + " pts" : pr.winner && pr.winner.name ? (pr.winner.emoji || "") + " " + sh(pr.winner.name) + " won" : "—";
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "3px 0", borderTop: i ? "1px dashed " + C.line : "none" }}>
                  <span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: t.col, flexShrink: 0 }} />
                  <span style={{ fontWeight: 800, color: C.text, width: 92, flexShrink: 0 }}>{t.name}{pr.count > 1 ? " ×" + pr.count : ""}</span>
                  <span style={{ color: pr.playerEvent ? C.goldInk : C.textSoft, fontWeight: pr.playerEvent ? 900 : 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{who}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
