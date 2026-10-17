/* ═══ TierSheet ═══ Bottom sheet for choosing this week's tournament tier */

import { createPortal } from "react-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { CONDITIONS, FIELDS } from "../engine/events";
import { TIERS } from "../models/constants";
import { C, FONT, display, label, card, money, button } from "../ui/theme";
import { effectsOf, EffectList, Legend } from "./Effect";
import { LaneTile, CompareLanes, Verdict } from "./Lanes";

export default function TierSheet(props) {
  var avail = props.available || [];
  var best = avail.length ? Math.max.apply(null, avail) : -1;
  var events = props.events || [];
  var [open, setOpen] = useState(props.paid >= 0 ? props.paid : best);
  var [legend, setLegend] = useState(false);
  var [lanes, setLanes] = useState(false);
  function evOf(ti) { return events.filter(function (x) { return x.tier === ti; }); }
  return createPortal(
    <div onClick={props.onClose} style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(28,25,23,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", fontFamily: FONT }}>
      <motion.div onClick={function (e) { e.stopPropagation(); }}
        initial={{ y: 400 }} animate={{ y: 0 }} transition={{ type: "spring", stiffness: 320, damping: 32 }}
        style={{ width: "100%", maxWidth: 520, maxHeight: "86vh", overflowY: "auto", background: C.page, borderRadius: "20px 20px 0 0", border: "2px solid " + C.lineStrong, borderBottom: "none", padding: "10px 14px 22px", boxSizing: "border-box" }}>
        <div aria-hidden style={{ width: 44, height: 5, borderRadius: 3, background: C.lineStrong, margin: "0 auto 10px" }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <span style={display(22)}>Choose your tournament</span>
          <button onClick={props.onClose} aria-label="Close" style={{ background: "none", border: "none", fontSize: 22, color: C.textSoft, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, margin: "2px 0 10px" }}>
          <span style={{ fontSize: 13, color: C.textSoft }}>You're <b style={{ color: C.goldInk }}>#{props.rank}</b>. Tiers open as you climb.</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <button onClick={function () { setLanes(!lanes); setLegend(false); }} style={{ flex: 1, fontFamily: FONT, fontSize: 12, fontWeight: 900, color: lanes ? "#fff" : C.ink, background: lanes ? C.night : C.card, border: "2px solid " + (lanes ? C.nightDeep : C.lineStrong), borderRadius: 10, padding: "6px 4px", cursor: "pointer" }}>🗺 Compare the 5 lanes</button>
          
        </div>
        {lanes && (<CompareLanes verdictOf={props.laneVerdict || null} />)}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[4, 3, 2, 1, 0].filter(function (ti) { return avail.indexOf(ti) >= 0; }).concat([4, 3, 2, 1, 0].filter(function (ti) { return avail.indexOf(ti) < 0; })).map(function (ti) {
            var t = TIERS[ti], ok = avail.indexOf(ti) >= 0;
            var top = t.pts[t.pts.length - 1], prize = t.money[t.money.length - 1];
            return (
              <div key={ti}>
              <button disabled={!ok} onClick={function () { if (!ok) return; if (evOf(ti).length && props.onPickEvent) setOpen(open === ti ? -1 : ti); else props.onPick(ti); }}
                style={Object.assign(card({ padding: "10px 12px", borderColor: ok ? t.col : C.line, boxShadow: ok ? "0 3px 0 " + t.col : "none", opacity: ok ? 1 : 0.55 }), { display: "flex", alignItems: "center", gap: 12, textAlign: "left", width: "100%", cursor: ok ? "pointer" : "default", fontFamily: FONT, background: ok ? C.card : C.cardWarm })}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: t.col, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0, border: "2px solid " + C.ink, textShadow: "0 1px 2px rgba(0,0,0,0.6)" }}>{t.short}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 900, color: C.text }}>{t.name}</span>
                    {ok && ti === props.paid && (<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#fff", background: "#7c3aed", padding: "2px 6px", borderRadius: 10 }}>🎟 PAID ENTRY</span>)}
                    {ok && ti === props.wildcard && ti !== props.paid && (<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#fff", background: "#be123c", padding: "2px 6px", borderRadius: 10 }}>🎟 FAN WILDCARD</span>)}
                    {ok && ti === best && ti !== props.wildcard && ti !== props.paid && (<span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 1, color: "#fff", background: C.greenInk, padding: "2px 6px", borderRadius: 10 }}>BEST FOR YOU</span>)}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSoft, marginTop: 2 }}>
                    Best of {t.bo || 3} sets · {t.size} riders · ranks {t.rankRange[0]}–{t.rankRange[1] > 1000 ? "1000" : t.rankRange[1]}
                  </div>
                  {!ok && (<div style={{ fontSize: 11, fontWeight: 800, color: C.redInk, marginTop: 2 }}>🔒 Not open at #{props.rank}</div>)}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  {ok && evOf(ti).length > 0 ? (<span style={{ fontSize: 12, fontWeight: 900, color: t.col }}>{evOf(ti).length} event{evOf(ti).length > 1 ? "s" : ""} {open === ti ? "▲" : "▼"}</span>) : (<span>
                  <div style={label()}>Champion</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: C.goldInk }}>{top.toLocaleString()} pts</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.greenInk }}>{money(prize)}</div></span>)}
                </div>
              </button>
              {ok && open === ti && evOf(ti).length > 0 && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", flexDirection: "column", gap: 6, margin: "6px 0 4px 14px", paddingLeft: 10, borderLeft: "3px solid " + t.col }}>
                  {evOf(ti).map(function (ev) { return (<EventCard key={ev.id} ev={ev} col={t.col} bo={t.bo || 3} verdict={props.verdictOf ? props.verdictOf(ev) : null} onPick={function () { props.onPickEvent(ev); }} />); })}
                </motion.div>
              )}
              </div>
            );
          })}
        </div>

        {/* Rest this week instead of riding */}
        {props.rest && props.onRest && (
          <div style={card({ marginTop: 12, padding: "10px 12px", background: "#f0f9ff", borderColor: "#bae6fd" })}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span aria-hidden style={{ fontSize: 28 }}>😴</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Rest this week</div>
                <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.4 }}>
                  You're at 👵{props.rest.fit.g}% 🐓{props.rest.fit.r}%. Resting brings back <b style={{ color: C.greenInk }}>👵+{props.rest.g} 🐓+{props.rest.r}</b> (after a tournament: +{props.rest.ng} / +{props.rest.nr}). No points this week{props.rest.def ? ", and the " + props.rest.def + " points you won here last season drop off" : ""}.
                </div>
              </div>
              <button onClick={props.onRest} style={button("ghost", { padding: "8px 12px", fontSize: 13, flexShrink: 0 })}>Rest</button>
            </div>
          </div>
        )}

        {/* Buy your way into the tier above — this week's investment */}
        {props.entry && (function () {
          var e = props.entry, t = TIERS[e.tier];
          return (
            <div style={card({ marginTop: 12, padding: "10px 12px", background: "#faf5ff", borderColor: "#d8b4fe" })}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span aria-hidden style={{ fontSize: 26 }}>🎟️</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Buy your way into {t.name}</div>
                  <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.35 }}>
                    {e.used ? "You've already made this week's investment." : "Entry for this week only — it uses this week's investment. You have " + money(e.cash) + "."}
                  </div>
                </div>
                <button disabled={!e.can} onClick={function () { props.onBuyEntry(e.tier); }}
                  style={{ fontFamily: FONT, fontWeight: 900, fontSize: 13, padding: "8px 12px", borderRadius: 10, cursor: e.can ? "pointer" : "default", flexShrink: 0,
                    background: e.can ? "#7c3aed" : "#fff", color: e.can ? "#fff" : C.textMuted, border: "2px solid " + (e.can ? "#4c1d95" : C.line), boxShadow: e.can ? "0 3px 0 #4c1d95" : "none" }}>
                  {money(e.fee)}
                </button>
              </div>
            </div>
          );
        })()}
      </motion.div>
    </div>,
    document.body
  );
}

/* One named event: the lanes as a picture and one line, the payout, and whether it suits you */
function EventCard(props) {
  var ev = props.ev, cd = CONDITIONS[ev.cond] || CONDITIONS.classic, fd = FIELDS[ev.field] || FIELDS.mixed;
  return (
    <button onClick={props.onPick} style={Object.assign(card({ padding: "8px 10px", borderColor: props.col, boxShadow: "0 2px 0 " + props.col }), { width: "100%", textAlign: "left", cursor: "pointer", fontFamily: FONT, background: C.card, display: "block" })}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <LaneTile cond={ev.cond} w={50} h={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.name}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.textSoft }}>{cd.short} · <span style={{ color: C.goldInk }}>{"★".repeat(fd.stars)}<span style={{ opacity: 0.22 }}>{"★".repeat(3 - fd.stars)}</span></span></div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 900, color: C.goldInk }}>{ev.champPts.toLocaleString()} pts</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.greenInk }}>{money(ev.champMoney)}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <Verdict v={props.verdict} />
        <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, color: C.textSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          Top seeds: {(ev.seeds || []).map(function (sd) { return (sd.name || "").split(" ")[0] + " #" + sd.rank; }).join(", ")}
        </span>
      </div>
    </button>
  );
}
