/* ═══ HomeTab ═══ Hub home: who you are, the one thing to do next, how the season is going */

import { motion } from "framer-motion";
import { TIERS, TOTAL_EVENTS, champTotal } from "../models/constants";
import { sh } from "../models/formulas";
import { C, FONT, display, label, card, button, pill, money, BODY, HEAD, card2, title2, cap2, button2 } from "../ui/theme";
import Icon, { IconTile } from "./Icons";
import { KnitterPreview } from "./KnitterFeed";
import { Rider, Face, PLAYER_PALETTE, paletteFor, withKit } from "./Rider";
import RankSparkline from "./RankSparkline";
import { FitnessCard, FansCard } from "./Fitness";
import { causeText } from "../engine/aging";

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
    <div onClick={props.onClick} style={{ background: props.tint || "#fef3c7", borderRadius: 12, padding: "6px 4px 5px", minWidth: 0, textAlign: "center", cursor: props.onClick ? "pointer" : "default" }}>
      <Icon name={props.icon} size={18} />
      <div style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 15, color: props.color || C.text, whiteSpace: "nowrap", lineHeight: 1.15, marginTop: 1 }}>{props.v}</div>
      <div style={{ fontSize: 10, fontWeight: 800, color: C.textMuted }}>{props.k}</div>
    </div>
  );
}
/* A tappable row: tinted icon tile, title, one short line, chevron */
function Row(props) {
  return (
    <button onClick={props.onClick} style={Object.assign(card2({ padding: "11px 12px", background: props.bg || "#fff" }), { display: "flex", alignItems: "center", gap: 12, width: "100%", cursor: "pointer", textAlign: "left" })}>
      {props.lead || (<IconTile name={props.icon} tint={props.tint} size={42} />)}
      <span style={{ flex: 1, minWidth: 0 }}>
        {props.kicker && (<span style={Object.assign(cap2(props.kickerCol), { display: "block", fontSize: 11 })}>{props.kicker}</span>)}
        <span style={Object.assign(title2(16), { display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{props.title}</span>
        {props.sub && (<span style={{ display: "block", fontSize: 12.5, color: C.textSoft, fontWeight: 700, marginTop: 1 }}>{props.sub}</span>)}
        {props.extra}
      </span>
      <span style={{ color: props.chev || C.goldInk, display: "inline-flex" }}><Icon name="chevron" size={18} /></span>
    </button>
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
            {isGS && (<div style={{ lineHeight: 0, marginBottom: 2 }}><Icon name="crown" size={11} /></div>)}
            <div style={{ height: cur ? 10 : 7, borderRadius: 5, background: bg, boxShadow: cur ? "0 0 0 2.5px " + C.goldSoft : "none", animation: cur ? "pulse 1.4s ease infinite" : "none" }} />
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
  var gsWild = isGS && pRank > 64 && pRank <= 74 && fans >= 80;
  var gsOk = isGS && (pRank <= 64 || gsWild);
  var heroColor = seasonDone ? "#a855f7" : isGS ? C.gold : "#0ea5e9";

  var hero;
  if (seasonDone) {
    hero = pRank <= 16
      ? { kicker: "Season " + S.sNum + " complete", title: "Season Finals", sub: "You made the top 16. Four houses, one crown.", cta: "Enter the Finals", act: props.onFinals, kind: "gold" }
      : { kicker: "Season " + S.sNum + " complete", title: "Finished #" + pRank, sub: "Top 16 qualify for the Finals. Train up and go again.", cta: "To the Season Gala →", act: props.onNextSeason, kind: "gold" };
  } else if (isGS) {
    hero = gsOk
      ? { kicker: "Next event · Grand Slam " + ev.gsNum, title: "Grand Slam", sub: gsWild ? "Your crowd got you a wildcard! 64 riders · best of 5 · " + champTotal(5).toLocaleString() + " pts to the champion" : "64 riders · best of 5 sets · " + champTotal(5).toLocaleString() + " pts to the champion", cta: "Enter the Grand Slam", act: props.onPlay, kind: "gold" }
      : { kicker: "Next event · Grand Slam " + ev.gsNum, title: "Not qualified", sub: "Only the top 64 ride in a Slam — you're #" + pRank + ". The tour moves on.", cta: "Skip this week →", act: props.onPlay, kind: "ghost" };
  } else {
    hero = { kicker: "Next event · Week " + ev.block + "." + ev.week, title: "Weekly Tournament", sub: "Pick a tier that fits your rank. Win rounds to earn points & prize money.", cta: "Choose tournament →", act: props.onPlay, kind: "gold" };
  }

  var last = S.calIdx > 0 ? S.cal[S.calIdx - 1] : null;
  var news = last && last.result && last.result.parallel ? last.result.parallel.filter(Boolean) : [];

  return (
    <div style={{ fontFamily: BODY, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Player card */}
      <button onClick={props.onOpenProfile} style={Object.assign(card2({ padding: "12px" }), { display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", width: "100%" })}>
        <div style={{ flexShrink: 0, width: 88, height: 84, borderRadius: 16, background: "radial-gradient(circle at 50% 30%, #e0f2fe 0%, #bae6fd 55%, #7dd3fc 100%)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden" }}>
          <Rider palette={withKit(PLAYER_PALETTE, S.player.kit)} width={84} pose="idle" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 6 }}>
            <span style={Object.assign(title2(21), { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" })}>{S.pName}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "linear-gradient(180deg,#fff7d6,#fde68a)", borderRadius: 999, padding: "2px 10px 2px 6px", boxShadow: "inset 0 -1px 0 rgba(146,64,14,0.15)" }}><Icon name="rank" size={16} /><span style={title2(18, C.goldInk)}>#{pRank}</span></span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5, marginTop: 8 }}>
            <Stat k="points" icon="trophy" tint="#fef3c7" v={(S.player.sp || 0).toLocaleString()} />
            <Stat k="prize" icon="coin" tint="#dcfce7" v={money(S.player.money)} color={C.greenInk} />
            <Stat k="to train" icon="dumbbell" tint="#e0e7ff" v={(tr.tp || 0) + " TP"} color="#3730a3" />
            <Stat k="crowd" icon="heart" tint="#ffe4e6" v={fans} color="#be123c" onClick={function (e) { e.stopPropagation(); var el = document.getElementById("fans-card"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }} />
          </div>
        </div>
      </button>

      {/* Next event hero */}
      <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
        style={card2({ position: "relative", overflow: "hidden", padding: "26px 16px 16px", background: "linear-gradient(180deg," + heroColor + "22 0%, #ffffff 46%)" })}>
        <Bunting color={heroColor} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(28,25,23,0.86)", color: "#fff", fontSize: 12, fontWeight: 800, padding: "4px 11px", borderRadius: 999 }}><span aria-hidden style={{ width: 8, height: 8, borderRadius: "50%", background: heroColor, boxShadow: "0 0 0 2px rgba(255,255,255,0.25)" }} />{hero.kicker}</span>
          {def > 0 && !seasonDone && (<span style={{ fontSize: 11, fontWeight: 800, color: C.redInk }} title="Points you earned at this event last season drop off after it">Defending {def} pts</span>)}
        </div>
        <div style={Object.assign(title2(31), { marginTop: 12, fontWeight: 700 })}>{hero.title}</div>
        <div style={{ fontSize: 13.5, color: C.textSoft, marginTop: 5, lineHeight: 1.4, fontWeight: 700 }}>{hero.sub}</div>
        <button onClick={hero.act} style={button2(hero.kind === "gold" ? "gold" : "ghost", { width: "100%", marginTop: 14, fontSize: 18, padding: "15px 18px" })}>{hero.cta}</button>
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={cap2(C.textSoft)}>Season {S.sNum}</span>
            <span style={cap2(C.textSoft)}>Event {Math.min(S.calIdx + 1, TOTAL_EVENTS)} of {TOTAL_EVENTS}</span>
          </div>
          <SeasonStrip S={S} />
        </div>
      </motion.div>

      <FitnessCard player={S.player} roosterName={S.player.roosterName} onTrain={props.onTrain} />
      <div id="fans-card"><FansCard player={S.player} rank={props.pRank} /></div>
      <KnitterPreview issues={S.news || []} kit={S.player.kit} onOpen={props.onKnitter} />

      {/* Training nudge when points are waiting */}
      {(tr.tp || 0) >= 15 && (<Row onClick={props.onTrain} icon="dumbbell" tint="#e0e7ff" title={tr.tp + " training points to spend"} sub="Every level makes your own bar easier" />)}

      {/* Your rival: the feud at a glance */}
      {props.rival && (<Row onClick={props.onRival} bg="linear-gradient(180deg,#fff 0%,#fff1f2 100%)" chev="#be123c" kicker="Your rival" kickerCol="#be123c"
        lead={(<div style={{ position: "relative", flexShrink: 0 }}><Face palette={paletteFor(props.rival.p.id, props.rival.rank)} size={42} /><span style={{ position: "absolute", right: -6, bottom: -6 }}><Icon name="lances" size={20} /></span></div>)}
        title={props.rival.p.emoji + " " + props.rival.p.name}
        sub={(<span>World #{props.rival.rank} · head-to-head <b style={{ color: props.rival.rec && props.rival.rec.w >= props.rival.rec.l ? C.greenInk : C.redInk }}>{props.rival.rec ? props.rival.rec.w + "–" + props.rival.rec.l : "—"}</b></span>)} />)}

      {/* Badges */}
      {props.ach && (<Row onClick={props.onAch} icon="medal" tint="#fef3c7" title={"Achievements · " + props.ach.n + " of " + props.ach.total}
        extra={(<span style={{ display: "block", height: 7, borderRadius: 4, background: "#f3ead3", marginTop: 6, overflow: "hidden" }}><span style={{ display: "block", width: (props.ach.n / props.ach.total * 100) + "%", height: "100%", borderRadius: 4, background: "linear-gradient(90deg,#fde68a,#f59e0b)" }} /></span>)} />)}

      <RankSparkline history={S.player.rankHist || []} />

      {/* Latest issue of the paper */}
      <Row onClick={function () { props.onReadPaper(); }} icon="paper" tint="#f4ecd8" bg="#fbf6ea" chev="#9a3412" title={(<span style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 900 }}>The Daily Cluck</span>)}
        sub={S.news && S.news[0] ? S.news[0].wk + " · your week, your rivals, the world's best" : "Special edition · the legends and the tour ahead"} />

      {/* The off-season's farewells (engine/aging): who left, your rival if she did, and what your age cap did */}
      {S.farewell && S.farewell.s === S.sNum - 1 && S.calIdx < 4 && (function () {
        var f = S.farewell, byId = {}; (S.gone || []).forEach(function (g) { byId[g.id] = g; });
        var riv = f.rival ? byId[f.rival] : null;
        return (
          <div style={card({ padding: "10px 12px" })}>
            <div style={label(C.textSoft)}>🌅 Farewells · after Season {f.s}</div>
            <div style={{ fontSize: 13.5, fontWeight: 800, color: C.text, marginTop: 4 }}>{f.n} grannies hung up their lances. {f.n} newcomers start at the bottom of the ranking.</div>
            {f.heir && (<div style={{ fontSize: 13, fontWeight: 800, color: C.goldInk, marginTop: 5 }}>{f.heir} has retired — her portrait is on the family wall. Welcome, {S.pName}: first season on tour, from the very bottom.</div>)}
            {riv && (<div style={{ fontSize: 13, fontWeight: 800, color: "#be123c", marginTop: 5 }}>Your rival {riv.emoji} {riv.name} has retired. A new grudge will find you soon.</div>)}
            <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 3 }}>
              {f.top.map(function (id) { var g = byId[id]; if (!g) return null; return (
                <div key={id} style={{ fontSize: 12.5, borderTop: "1px dashed " + C.line, paddingTop: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontWeight: 800, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{g.emoji} {g.name}{g.hof ? " 🏛️" : ""}</span>
                    <span style={{ color: C.textSoft, whiteSpace: "nowrap" }}>#{g.rank} · {g.y} seasons · {g.titles} {g.titles === 1 ? "title" : "titles"}{g.gsTitles ? " · " + g.gsTitles + " Slam" + (g.gsTitles > 1 ? "s" : "") : ""}</span>
                  </div>
                  <div style={{ fontSize: 11.5, fontStyle: "italic", color: C.textMuted }}>{causeText(g)}</div>
                </div>); })}
            </div>
            {f.lost > 0 && (<div style={{ fontSize: 12.5, color: C.redInk, fontWeight: 800, marginTop: 6 }}>You're a season older too: every stat now stops at {f.cap}, and you lost {f.lost} {f.lost === 1 ? "level" : "levels"}.</div>)}
          </div>
        );
      })()}

      {/* Tour results: every tournament's draw, week by week, and any granny's results (engine/history) */}
      <Row onClick={props.onResults} icon="trophy" tint="#e0f2fe" title="Tour results"
        sub={S.hist && S.hist.wk && S.hist.wk.length ? "Every tournament's draw, week by week · find any granny" : "Every draw is kept from your next tournament on"} />

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
