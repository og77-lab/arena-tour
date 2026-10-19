/* ═══ SeasonTab ═══ The season at a glance: what's next, what you're chasing (Slam entry, the Finals), and a
   week-by-week timeline of the whole season — results behind you, points you're defending ahead. */

import { motion } from "framer-motion";
import { TIERS, RN5, RN6, TOTAL_EVENTS } from "../models/constants";
import { getRanked, sh } from "../models/formulas";
import { C, FONT, display, label, card, button, pill } from "../ui/theme";
import Icon from "./Icons";
import { titleMix as seasonMixOf, seasonTitles } from "../engine/titles";
function seasonMix(S) { return seasonMixOf(seasonTitles(S)); }

var GS_CUT = 64, FINALS_CUT = 16;

function roundName(ev) {
  var r = ev.result, t = TIERS[ev.tier];
  if (!r || !t) return "";
  if (r.won) return "Champion";
  return (t.rounds === 6 ? RN6 : RN5)[r.pRound] || "";
}
function skipped(ev) { return ev.type === "gs" && ev.result && !ev.result.pPts && !(ev.result.parallel || []).length; }

/* A target on the ladder: am I in, and if not, how many points short of the rider holding the cut-off spot */
function Goal(props) {
  var inside = props.rank <= props.cut;
  var pct = inside ? 100 : Math.max(4, Math.min(96, (props.cutPts > 0 ? props.myPts / props.cutPts : 0) * 100));
  return (
    <div style={{ padding: "8px 0", borderTop: props.first ? "none" : "1px dashed " + C.line }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{props.icon} {props.title}</span>
        <span style={{ fontSize: 12, fontWeight: 900, color: inside ? C.greenInk : C.goldInk, whiteSpace: "nowrap" }}>{inside ? "✓ In · #" + props.rank : "#" + props.rank + " → top " + props.cut}</span>
      </div>
      <div style={{ height: 8, borderRadius: 4, background: "#efe3c4", marginTop: 6, overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: pct + "%" }} transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 4, background: inside ? "#4ade80" : "linear-gradient(90deg,#fde68a,#f59e0b)" }} />
      </div>
      <div style={{ fontSize: 12, color: C.textSoft, marginTop: 4, lineHeight: 1.4 }}>
        {inside
          ? props.safe
          : (<span>Need <b style={{ color: C.text }}>+{Math.max(1, props.cutPts - props.myPts + 1).toLocaleString()} pts</b> to pass #{props.cut} {props.cutName ? sh(props.cutName) : ""} · {props.when}</span>)}
      </div>
    </div>
  );
}

export default function SeasonTab(props) {
  var S = props.S, pRank = props.pRank, ev = props.curEvent, done = props.seasonDone;
  var ranked = getRanked(S), myPts = S.player.sp || 0;
  var at = function (n) { var p = ranked[n - 1]; return p ? { pts: p.sp || 0, name: p.isP ? null : p.name } : { pts: 0, name: null }; };
  var gsCut = at(GS_CUT), fCut = at(FINALS_CUT);
  var isGS = ev && ev.type === "gs";
  var nextGS = done ? -1 : S.cal.findIndex(function (e, i) { return i >= S.calIdx && e.type === "gs"; });
  var weeksToGS = nextGS < 0 ? -1 : nextGS - S.calIdx;
  var def = ev && S.player.def ? S.player.def[S.calIdx] || 0 : 0;
  var avail = props.avail || [], wild = props.wildcard;
  var wins = S.cal.filter(function (e) { return e.result && e.result.won; }).length;
  var seasonPts = S.cal.reduce(function (a, e) { return a + (e.result ? e.result.pPts || 0 : 0); }, 0);

  return (
    <div style={{ fontFamily: FONT, display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Header: where we are in the season */}
      <div style={card({ padding: "12px 12px 10px" })}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={display(26)}>Season {S.sNum}</span>
          <span style={label(C.textSoft)}>{done ? "Complete" : "Event " + (S.calIdx + 1) + " of " + TOTAL_EVENTS}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: 6, marginTop: 10, alignItems: "end" }}>
          {[0, 1, 2, 3].map(function (b) {
            return (
              <div key={b}>
                <div style={Object.assign(label(), { textAlign: "center", marginBottom: 3 })}>Block {b + 1}</div>
                <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                  {S.cal.slice(b * 5, b * 5 + 5).map(function (e, j) {
                    var i = b * 5 + j, cur = i === S.calIdx && !done, gs = e.type === "gs";
                    var bg = e.done ? (skipped(e) ? "#d6d3d1" : e.result && e.result.won ? C.gold : gs ? "#fbbf24" : "#4ade80") : cur ? C.night : "#efe3c4";
                    return (<div key={i} title={gs ? "Grand Slam " + e.gsNum : "Week " + e.block + "." + e.week}
                      style={{ flex: gs ? 1.5 : 1, height: gs ? 14 : cur ? 11 : 8, borderRadius: 3, background: bg, boxShadow: cur ? "0 0 0 2px " + C.goldSoft : "none", animation: cur ? "pulse 1.4s ease infinite" : "none" }} />);
                  })}
                </div>
              </div>
            );
          })}
          <div aria-label="Season Finals" style={{ fontSize: 18, lineHeight: 1, paddingBottom: 1, filter: done && pRank <= FINALS_CUT ? "none" : "grayscale(0.7)", opacity: done && pRank <= FINALS_CUT ? 1 : 0.6 }}>🏆</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSoft, marginTop: 8, fontWeight: 700 }}>
          <span>{seasonPts.toLocaleString()} pts earned this season</span>
          <span>{wins > 0 ? (<span><Icon name="trophy" size={16} style={{ verticalAlign: "-3px", marginRight: 4 }} />{seasonMix(props.S) || (wins + (wins === 1 ? " title" : " titles"))}</span>) : "No titles yet"}</span>
        </div>
      </div>

      {/* Up next */}
      {!done && ev && (
        <motion.div initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          style={card({ padding: "12px", background: "linear-gradient(180deg,#ffffff,#fffbeb)", borderColor: C.lineStrong })}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <span style={pill()}><span aria-hidden style={{ width: 7, height: 7, borderRadius: "50%", background: isGS ? C.gold : "#0ea5e9" }} />Up next</span>
            {def > 0 && (<span style={{ fontSize: 12, fontWeight: 800, color: C.redInk }}>Defending {def} pts</span>)}
          </div>
          <div style={Object.assign(display(24), { marginTop: 8 })}>{isGS ? (<span><Icon name="crown" size={24} style={{ verticalAlign: "-3px", marginRight: 4 }} />{"Grand Slam " + ev.gsNum}</span>) : "Week " + ev.block + "." + ev.week}</div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 3, lineHeight: 1.4 }}>
            {isGS
              ? (props.gsOk ? "64 riders, best of 5 sets, 8,000 points to the champion." : "Only the top 64 ride in a Slam — you're #" + pRank + ". This week you sit it out.")
              : "Every rider plays one tournament this week. Pick the tier that fits your rank:"}
          </div>
          {!isGS && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
              {avail.map(function (ti) {
                var t = TIERS[ti], w = ti === wild;
                return (
                  <span key={ti} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.cardWarm, border: "1.5px solid " + C.line, borderRadius: 10, padding: "5px 9px", fontSize: 13, fontWeight: 900, color: C.text }}>
                    <span aria-hidden style={{ width: 9, height: 9, borderRadius: "50%", background: t.col }} />{t.name}
                    <span style={{ fontSize: 11, color: C.textSoft, fontWeight: 700 }}>· {t.pts[t.pts.length - 1].toLocaleString()} pts</span>
                    {w && (<span style={{ fontSize: 10, fontWeight: 900, color: "#be123c" }}>WILDCARD</span>)}
                  </span>
                );
              })}
            </div>
          )}
          <button onClick={props.onPlay} style={button(isGS && !props.gsOk ? "ghost" : "gold", { width: "100%", marginTop: 12 })}>
            {isGS ? (props.gsOk ? "Enter the Grand Slam" : "Skip this week →") : "Choose tournament →"}
          </button>
        </motion.div>
      )}
      {done && (
        <div style={card({ padding: 12, background: "linear-gradient(180deg,#ffffff,#f5f3ff)" })}>
          <div style={display(22)}>{pRank <= FINALS_CUT ? (<span><Icon name="crown" size={22} style={{ verticalAlign: "-3px", marginRight: 4 }} />You're in the Finals!</span>) : "Season over · #" + pRank}</div>
          <div style={{ fontSize: 13, color: C.textSoft, marginTop: 4 }}>{pRank <= FINALS_CUT ? "Sixteen riders, four houses, one crown." : "Only the top 16 ride in the Finals. Train up and go again."}</div>
          <button onClick={pRank <= FINALS_CUT ? props.onFinals : props.onNextSeason} style={button("gold", { width: "100%", marginTop: 10 })}>
            {pRank <= FINALS_CUT ? "Enter the Finals" : "To the Season Gala →"}
          </button>
        </div>
      )}

      {/* What you're chasing */}
      {!done && (
        <div style={card({ padding: "8px 12px" })}>
          <div style={label(C.goldInk)}>What you're chasing</div>
          {S.player.goal && S.player.goal.s === S.sNum && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 2px", padding: "7px 9px", borderRadius: 10, background: pRank <= S.player.goal.rank ? "#ecfdf5" : C.cardWarm, border: "1.5px solid " + (pRank <= S.player.goal.rank ? "#86efac" : C.line) }}>
              <Icon name={pRank <= S.player.goal.rank ? "check" : "target"} size={20} />
              <span style={{ fontSize: 13, fontWeight: 800, color: C.text, lineHeight: 1.3 }}>Season goal: {S.player.goal.text}{pRank <= S.player.goal.rank ? " — done right now!" : ""}</span>
            </div>
          )}
          <Goal first icon={<Icon name="crown" size={18} />} title="Grand Slam entry" cut={GS_CUT} rank={pRank} myPts={myPts} cutPts={gsCut.pts} cutName={gsCut.name}
            when={weeksToGS === 0 ? "the Slam is this week" : weeksToGS > 0 ? "next Slam in " + weeksToGS + (weeksToGS === 1 ? " week" : " weeks") : "no Slams left"}
            safe={weeksToGS >= 0 ? "You're in the next Grand Slam" + (weeksToGS === 0 ? " — it's this week!" : " (in " + weeksToGS + (weeksToGS === 1 ? " week)." : " weeks).")) : "Qualified — see you next season."} />
          <Goal icon={<Icon name="trophy" size={18} />} title="Season Finals" cut={FINALS_CUT} rank={pRank} myPts={myPts} cutPts={fCut.pts} cutName={fCut.name}
            when={(TOTAL_EVENTS - S.calIdx) + " events left"} safe={"Top 16 right now — hold on for " + (TOTAL_EVENTS - S.calIdx) + " more events."} />
        </div>
      )}

      {/* Week by week */}
      <div style={card({ padding: "8px 10px" })}>
        <div style={Object.assign(label(C.textSoft), { margin: "2px 2px 6px" })}>Week by week</div>
        {[0, 1, 2, 3].map(function (b) {
          return (
            <div key={b} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1.4, color: C.textMuted, textTransform: "uppercase", padding: "4px 4px 2px" }}>Block {b + 1}</div>
              {S.cal.slice(b * 5, b * 5 + 5).map(function (e, j) {
                var i = b * 5 + j, cur = i === S.calIdx && !done, gs = e.type === "gs", t = e.done && e.tier != null ? TIERS[e.tier] : null;
                var d = S.player.def ? S.player.def[i] || 0 : 0, r = e.result;
                return (
                  <div key={i} onClick={cur ? props.onPlay : undefined}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 10, cursor: cur ? "pointer" : "default",
                      background: cur ? C.goldSoft : gs ? "#fffbeb" : "transparent", border: cur ? "2px solid " + C.ink : "2px solid transparent", boxShadow: cur ? "0 3px 0 " + C.ink : "none" }}>
                    <span aria-hidden style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 900,
                      background: e.done ? (r && r.won ? C.gold : skipped(e) ? "#d6d3d1" : "#4ade80") : cur ? C.night : "#efe3c4", color: cur ? "#fff" : C.ink }}>
                      {e.done ? (r && r.won ? "★" : skipped(e) ? "–" : "✓") : cur ? "▶" : ""}
                    </span>
                    <span style={{ width: 92, flexShrink: 0, fontSize: 13, fontWeight: 900, color: gs ? C.goldInk : C.text }}>{gs ? (<span><Icon name="crown" size={14} style={{ verticalAlign: "-3px", marginRight: 4 }} />{"Slam " + e.gsNum}</span>) : "Week " + e.block + "." + e.week}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: C.textSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {e.done
                        ? (skipped(e) ? "Not qualified" : (<span><span aria-hidden style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: t ? t.col : "#ccc", marginRight: 5 }} />{r && r.eventName ? r.eventName : t ? t.name : ""} · <b style={{ color: r && r.won ? C.goldInk : C.text }}>{roundName(e)}</b></span>))
                        : cur ? (<b style={{ color: C.text }}>This week — tap to play</b>) : gs ? "64 riders · best of 5" : "Open week"}
                    </span>
                    <span style={{ textAlign: "right", flexShrink: 0, fontSize: 12.5, fontWeight: 900, lineHeight: 1.15 }}>
                      {e.done && r && !skipped(e)
                        ? (<span>{(r.pPts || 0).toLocaleString()}<span style={{ display: "block", fontSize: 11, color: r.net > 0 ? C.greenInk : r.net < 0 ? C.redInk : C.textMuted }}>{r.net > 0 ? "+" + r.net : r.net === 0 ? "±0" : r.net}</span></span>)
                        : !e.done && d > 0 ? (<span style={{ color: C.redInk, fontSize: 11.5 }} title="Points from last season that drop off when this event is played">−{d} def.</span>) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px", borderRadius: 10, background: "#f5f3ff", marginTop: 2 }}>
          <Icon name="trophy" size={20} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 900, color: C.text }}>Season Finals <span style={{ fontWeight: 700, color: C.textSoft }}>· top 16 · four houses, then semis and a final</span></span>
        </div>
        <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 8, lineHeight: 1.4, padding: "0 4px" }}>
          Red numbers are points you're <b style={{ color: C.text }}>defending</b> from last season — they drop off when that week is played, so beat them to climb.
        </div>
      </div>
    </div>
  );
}
