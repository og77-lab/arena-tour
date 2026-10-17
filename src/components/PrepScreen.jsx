/* ═══ PrepScreen ═══ After picking a tournament: choose a lance and a saddle from the locker, or shop for new ones at
   Mavis's. Nothing is paid or used up until the one Confirm button — change your mind as often as you like. */

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { GEAR, BY_ID, BASIC, itemFx, kitFx, priceOf, usesLeft, COND_LABEL } from "../engine/gear";
import { effectsOf, EffectList, Legend } from "./Effect";
import { LaneRow } from "./Lanes";
import { MiniBar } from "./Effect";
import ItemArt from "./ItemArt";
import { matchNumbers } from "../engine/profile";
import { fitOf } from "../engine/fitness";
import { conditionOf, FIELDS } from "../engine/events";
import { TIERS } from "../models/constants";
import { C, FONT, display, label, card, button, money } from "../ui/theme";
import { REDUCED_MOTION } from "./fx";
import { FitnessMini } from "./Fitness";

var MAVIS = [
  "No refunds. No crying. Biscuits for regulars.",
  "Everything's a bargain if you squint, dear.",
  "That baguette? Fresh Tuesday. Which Tuesday, I couldn't say.",
  "My late husband rode the oak lance. Lovely man. Terrible timing.",
  "Touch it, you've bought it. I'm joking. Mostly.",
  "The roller-skates are back by popular demand. Nobody demanded them.",
  "Knitting needles: for jousting, and for jabbing the queue-jumpers."
];

export default function PrepScreen(props) {
  var S = props.S, p = S.player, ev = props.ev, T = TIERS[props.tier];
  var locker = p.locker || {};
  var start = p.kit || BASIC;
  function ready(id) { return usesLeft(locker, {}, id) > 0; }
  var [kit, setKit] = useState({ lance: ready(start.lance) ? start.lance : BASIC.lance, saddle: ready(start.saddle) ? start.saddle : BASIC.saddle });
  var [cart, setCart] = useState({});
  var [tab, setTab] = useState("locker");
  var [slotTab, setSlotTab] = useState("lance");
  var [legend, setLegend] = useState(false);
  var condKey = ev ? ev.cond : "classic";
  /* Tap an item in the shop to try it on: the numbers below show it before you buy */
  var [preview, setPreview] = useState(null);
  var [laneInfo, setLaneInfo] = useState(false);
  var shown = preview ? Object.assign({}, kit, (function () { var o = {}; o[BY_ID[preview].slot] = preview; return o; })()) : kit;
  var [quote] = useState(function () { return MAVIS[Math.floor(Math.random() * MAVIS.length)]; });
  var cash = p.money || 0;
  var cost = Object.keys(cart).reduce(function (a, id) { return a + priceOf(id, props.topTier) * cart[id]; }, 0);
  var canPay = cost <= cash;
  var cd = ev ? conditionOf(ev.cond) : null, fd = ev ? FIELDS[ev.field] : null;

  function addCart(id, n) {
    setCart(function (c) { var o = Object.assign({}, c); o[id] = Math.max(0, (o[id] || 0) + n); if (!o[id]) delete o[id]; return o; });
    /* Taking the last one out of the basket unselects it if you didn't already own any */
    if (n < 0 && (cart[id] || 0) + n <= 0 && !(locker[id] > 0)) {
      var g = BY_ID[id]; if (kit[g.slot] === id) setKit(function (k) { var o = Object.assign({}, k); o[g.slot] = BASIC[g.slot]; return o; });
    }
    if (n > 0) { var g2 = BY_ID[id]; setKit(function (k) { var o = Object.assign({}, k); o[g2.slot] = id; return o; }); }
  }

  function confirm() { if (canPay) props.onConfirm({ kit: kit, cart: cart, cost: cost }); }

  return createPortal(
    <div style={{ position: "fixed", inset: 0, zIndex: 950, background: C.page, fontFamily: FONT, display: "flex", flexDirection: "column" }}>
      {/* Header: the tournament you picked */}
      <div style={{ padding: "calc(env(safe-area-inset-top) + 10px) 12px 8px", borderBottom: "2px solid " + C.line, background: C.cardWarm }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={display(20)}>🧰 Get ready</span>
          <span style={{ flex: 1 }} />
          <button onClick={props.onCancel} aria-label="Back to the tournament list" style={{ background: "none", border: "none", fontSize: 22, color: C.textSoft, cursor: "pointer", padding: 4 }}>✕</button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 900, color: C.text, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {cd ? cd.icon + " " : ""}{ev ? ev.name : T.name} <span style={{ color: T.col }}>· {T.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, fontWeight: 800, color: C.textSoft, marginTop: 2 }}>
          {fd && (<span>{"★".repeat(fd.stars)} {fd.label}</span>)}
          <span>Fitness <FitnessMini player={p} /></span>
          <span style={{ flex: 1 }} />
          <button onClick={function () { setLegend(!legend); }} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 900, color: C.goldInk, background: "none", border: "none", cursor: "pointer", padding: 0, whiteSpace: "nowrap" }}>ⓘ {legend ? "Hide" : "What these mean"}</button>
        </div>
        {cd && (<div onClick={function () { setLaneInfo(!laneInfo); }} style={{ marginTop: 6, cursor: "pointer" }}><LaneRow cond={ev.cond} w={36} h={28} gaps={props.gaps || null} compact={true} label={cd.name + ":"} />
          <div style={{ fontSize: 11, color: C.textSoft, lineHeight: 1.35, marginTop: 3 }}>{laneInfo ? cd.about + " ▲" : "ⓘ What are " + cd.name.toLowerCase() + "? tap"}</div></div>)}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[["locker", "🎒 Your locker"], ["shop", "🛒 Mavis's shop"]].map(function (t) {
            var on = tab === t[0];
            return (<button key={t[0]} onClick={function () { setTab(t[0]); }} style={button(on ? "night" : "ghost", { flex: 1, padding: "8px 6px", fontSize: 13 })}>{t[1]}{t[0] === "shop" && Object.keys(cart).length ? " (" + Object.keys(cart).reduce(function (a, k) { return a + cart[k]; }, 0) + ")" : ""}</button>);
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 16px" }}>
        {legend && (<Legend />)}
        {tab === "locker" ? (
          <div>
            {["lance", "saddle"].map(function (slot) {
              var items = GEAR.filter(function (g) { return g.slot === slot && usesLeft(locker, cart, g.id) > 0; });
              var sel = BY_ID[kit[slot]];
              return (
                <div key={slot} style={{ marginBottom: 14 }}>
                  <div style={Object.assign(label(C.textSoft), { marginBottom: 6 })}>{slot === "lance" ? "Lance" : "Saddle"}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {items.map(function (g) {
                      var on = kit[slot] === g.id, left = usesLeft(locker, cart, g.id), inCart = (cart[g.id] || 0) > 0 && !(locker[g.id] > 0);
                      return (
                        <motion.button key={g.id} whileTap={{ scale: 0.95 }} onClick={function () { setKit(function (k) { var o = Object.assign({}, k); o[slot] = g.id; return o; }); }}
                          style={Object.assign(card({ padding: "8px 4px", borderColor: on ? C.gold : C.line, boxShadow: on ? "0 0 0 3px " + C.goldSoft + ", 0 3px 0 " + C.goldInk : "0 3px 0 " + C.shadow }),
                            { cursor: "pointer", fontFamily: FONT, background: on ? C.cardWarm : C.card, position: "relative", textAlign: "center" })}>
                          {on && (<span style={{ position: "absolute", top: 4, right: 6, fontSize: 14, fontWeight: 900, color: C.greenInk }}>✓</span>)}
                          <div aria-hidden style={{ display: "flex", justifyContent: "center", height: 60, alignItems: "center" }}><ItemArt id={g.id} size={g.slot === "lance" ? 66 : 58} /></div>
                          <div style={{ fontSize: 11.5, fontWeight: 900, color: C.text, lineHeight: 1.2, minHeight: 28 }}>{g.name}</div>
                          <div style={{ fontSize: 10.5, fontWeight: 800, color: g.basic ? C.textMuted : inCart ? "#7c3aed" : C.goldInk, marginTop: 2 }}>
                            {g.basic ? "Always yours" : inCart ? "In basket · " + left : left + " tournament" + (left === 1 ? "" : "s") + " left"}
                          </div>
                        </motion.button>
                      );
                    })}
                    {items.length < 2 && (
                      <button onClick={function () { setTab("shop"); }} style={Object.assign(card({ padding: "8px 4px", borderStyle: "dashed" }), { cursor: "pointer", fontFamily: FONT, background: "transparent", color: C.textMuted, fontSize: 12, fontWeight: 800 })}>
                        <div aria-hidden style={{ fontSize: 30 }}>🛒</div>Shop for more
                      </button>
                    )}
                  </div>
                  <Effects g={sel} cond={condKey} />
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Mavis behind the counter */}
            <div style={card({ display: "flex", gap: 10, alignItems: "center", padding: "6px 10px", marginBottom: 8, background: "#fdf2f8", borderColor: "#f9a8d4" })}>
              <motion.div aria-hidden animate={REDUCED_MOTION ? {} : { rotate: [0, -6, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }} style={{ fontSize: 34 }}>👵🏼</motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Mavis Bodkin's Jousting Emporium</div>
                <div style={{ fontSize: 12, fontStyle: "italic", color: C.textSoft, lineHeight: 1.3 }}>"{quote}"</div>
                <div style={{ fontSize: 11.5, fontWeight: 900, color: C.greenInk, marginTop: 2 }}>💰 You have {money(cash)}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
              {[["lance", "Lances"], ["saddle", "Saddles"]].map(function (t) { var on = slotTab === t[0]; return (<button key={t[0]} onClick={function () { setSlotTab(t[0]); }} style={button(on ? "gold" : "ghost", { flex: 1, padding: "7px 6px", fontSize: 12.5 })}>{t[1]}</button>); })}
            </div>
            <div style={{ fontSize: 11, fontWeight: 800, color: C.textMuted, margin: "0 2px 6px" }}>Cheapest per tournament first · effects shown for {COND_LABEL[condKey] || "these"} lanes</div>
            {GEAR.filter(function (g) { return !g.basic && g.slot === slotTab; }).sort(function (a, b) { return priceOf(a.id, props.topTier) / a.uses - priceOf(b.id, props.topTier) / b.uses; }).map(function (g, i) {
              var n = cart[g.id] || 0, price = priceOf(g.id, props.topTier), own = locker[g.id] || 0;
              return (
                <div key={g.id} onClick={function () { setPreview(preview === g.id ? null : g.id); }} style={Object.assign(card({ display: "flex", gap: 10, padding: "10px 10px", marginBottom: 8, borderColor: preview === g.id ? "#38bdf8" : C.line, boxShadow: preview === g.id ? "0 0 0 3px #bae6fd, 0 3px 0 " + C.shadow : "0 3px 0 " + C.shadow }), { cursor: "pointer" })}>
                  <motion.div aria-hidden animate={REDUCED_MOTION ? {} : { rotate: [0, -7, 7, -3, 0], y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 + (i % 4) * 0.7, delay: i * 0.35 }}
                    style={{ width: 72, display: "flex", justifyContent: "center", flexShrink: 0, alignSelf: "flex-start" }}><ItemArt id={g.id} size={g.slot === "lance" ? 74 : 62} /></motion.div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{g.name}</div>
                    <div style={{ fontSize: 11, fontStyle: "italic", color: C.textMuted, lineHeight: 1.3, marginTop: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{g.pitch}</div>
                    <Effects g={g} cond={condKey} compact />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: C.goldInk, lineHeight: 1.25 }}>{g.uses} tournament{g.uses > 1 ? "s" : ""} · {money(Math.round(price / g.uses))} each{own ? <span style={{ display: "block", color: C.textMuted }}>you own {own}</span> : null}</span>
                      <span style={{ flex: 1 }} />
                      {preview !== g.id && n === 0 && (<span style={{ fontSize: 10.5, fontWeight: 900, color: "#0369a1" }}>tap to try</span>)}
                      {n > 0 && (<button onClick={function (e) { e.stopPropagation(); addCart(g.id, -1); }} aria-label={"Remove " + g.name} style={button("ghost", { padding: "5px 10px", fontSize: 14 })}>−</button>)}
                      {n > 0 && (<span style={{ fontSize: 13, fontWeight: 900 }}>{n}</span>)}
                      {(function () { var ok = cost + price <= cash; return (<button disabled={!ok} onClick={function (e) { e.stopPropagation(); if (ok) { addCart(g.id, 1); setPreview(null); } }} style={button(ok ? "gold" : "ghost", { padding: "6px 10px", fontSize: 12.5, opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" })}>{ok ? (n ? "+" : "Add") + " " + money(price) : money(price) + " · can't afford"}</button>); })()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Your kit and the one button that pays and rides */}
      <div style={{ borderTop: "2px solid " + C.line, background: C.card, padding: "8px 12px calc(env(safe-area-inset-bottom) + 10px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, fontSize: 12, fontWeight: 800, color: C.textSoft }}>
          <span aria-hidden style={{ display: "inline-flex", gap: 2 }}><ItemArt id={shown.lance} size={28} /><ItemArt id={shown.saddle} size={28} /></span>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: preview ? "#0369a1" : C.textSoft }}>{preview ? "Trying on " + BY_ID[preview].name : BY_ID[kit.lance].name + " + " + BY_ID[kit.saddle].name}</span>
          {cost > 0 && (<span style={{ color: canPay ? C.text : C.redInk, fontWeight: 900 }}>Basket {money(cost)}</span>)}
        </div>
        <Numbers S={S} ev={ev} tier={props.tier} gaps={props.gaps} kit={shown} preview={preview} />
        <button onClick={confirm} disabled={!canPay} style={button(canPay ? "gold" : "ghost", { width: "100%", padding: "12px 10px", fontSize: 16, opacity: canPay ? 1 : 0.6 })}>
          {canPay ? (cost > 0 ? "✅ Pay " + money(cost) + " & ride" : "✅ Confirm & ride") : "Not enough money — take something out"}
        </button>
      </div>
    </div>,
    document.body
  );
}

/* What an item does in these lanes, as chips; the icons say which other lanes would change it */
function Effects(props) {
  var g = props.g; if (!g) return null;
  if (g.basic) return (<div style={{ fontSize: 11.5, fontWeight: 800, color: C.textMuted, marginTop: props.compact ? 4 : 8 }}>Neutral — changes nothing, in any lanes.</div>);
  var others = Object.keys(g.cond || {}).filter(function (c) { return c !== props.cond; }).map(function (c) { return (COND_LABEL[c] || "").split(" ")[0]; }).join(" ");
  return (
    <div style={{ marginTop: props.compact ? 5 : 8 }}>
      <EffectList list={effectsOf(itemFx(g.id, props.cond))} />
      {others && (<div style={{ fontSize: 10.5, fontWeight: 800, color: C.textMuted, marginTop: 3 }}>Works differently in {others}</div>)}
    </div>
  );
}

/* Your numbers in this tournament (round 1, these lanes, your stats against the entrants, your fitness): with the
   plain broom and tea-cosy, and with the kit you've picked or are trying on — every change in green or red */
function Numbers(props) {
  var p = props.S.player, cond = props.ev ? props.ev.cond : "classic";
  var o = { cond: cond, tier: props.tier, gaps: props.gaps || {}, fit: fitOf(p) };
  var base = matchNumbers(Object.assign({ kit: BASIC }, o)), now = matchNumbers(Object.assign({ kit: props.kit }, o));
  function f1(v) { return (Math.round(v * 10) / 10).toFixed(1); }
  function sgn(v) { return (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v); }
  var rows = [
    { k: "zone", v: 2, label: "Gold zone", val: f1(now.zone) + "% of bar", d: Math.round((now.zone - base.zone) * 10) / 10, up: true, unit: "%" },
    { k: "speed", v: 1.2, label: "Bar speed", val: Math.round(now.speed) + "%", d: Math.round(now.speed - base.speed), up: false, unit: "%" },
    { k: "accel", v: 1.3, label: "Speed-up", val: Math.round(now.accel) + "%", d: Math.round(now.accel - base.accel), up: false, unit: "%" },
    { k: "gold", v: 1, label: "Gold hits", val: sgn(Math.round(now.gold)) + " pts", d: Math.round(now.gold - base.gold), up: true, unit: "" },
    { k: "miss", v: 1, label: "Misses", val: sgn(Math.round(now.miss)) + " pts", d: Math.round(now.miss - base.miss), up: true, unit: "" }
  ];
  return (
    <div style={{ marginBottom: 7 }}>
      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1.2, color: C.textMuted, textTransform: "uppercase", marginBottom: 3 }}>Your numbers here · change from the plain kit</div>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", columnGap: 8, rowGap: 2, alignItems: "center", fontSize: 12 }}>
        {rows.map(function (r) {
          var good = r.d === 0 ? null : (r.d > 0) === r.up;
          return [
            <MiniBar key={r.k + "b"} k={r.k} v={r.v} />,
            <span key={r.k + "l"} style={{ fontWeight: 800, color: C.text }}>{r.label}</span>,
            <span key={r.k + "v"} style={{ fontWeight: 900, color: C.text, textAlign: "right" }}>{r.val}</span>,
            <span key={r.k + "d"} style={{ fontWeight: 900, minWidth: 44, textAlign: "right", color: good === true ? C.greenInk : good === false ? C.redInk : C.textMuted }}>{r.d === 0 ? "—" : (r.d > 0 ? "▲ +" : "▼ −") + Math.abs(r.d) + r.unit}</span>
          ];
        })}
      </div>
    </div>
  );
}
