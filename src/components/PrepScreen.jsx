/* ═══ PrepScreen ═══ After picking a tournament: choose a lance and a saddle from the locker, or shop for new ones at
   Mavis's. Nothing is paid or used up until the one Confirm button — change your mind as often as you like. */

import { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { GEAR, BY_ID, BASIC, fxLines, condNotes, priceOf, usesLeft } from "../engine/gear";
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
        {cd && (<div style={{ fontSize: 11.5, fontWeight: 800, color: C.textSoft }}>{cd.name}: {cd.effect} · {"★".repeat(fd.stars)} {fd.label}</div>)}
        <div style={{ fontSize: 11.5, fontWeight: 800, color: C.textSoft }}>Fitness <FitnessMini player={p} /></div>
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          {[["locker", "🎒 Your locker"], ["shop", "🛒 Mavis's shop"]].map(function (t) {
            var on = tab === t[0];
            return (<button key={t[0]} onClick={function () { setTab(t[0]); }} style={button(on ? "night" : "ghost", { flex: 1, padding: "8px 6px", fontSize: 13 })}>{t[1]}{t[0] === "shop" && Object.keys(cart).length ? " (" + Object.keys(cart).reduce(function (a, k) { return a + cart[k]; }, 0) + ")" : ""}</button>);
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px 16px" }}>
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
                          <div aria-hidden style={{ fontSize: 50, lineHeight: 1.1 }}>{g.icon}</div>
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
                  <Effects g={sel} />
                </div>
              );
            })}
          </div>
        ) : (
          <div>
            {/* Mavis behind the counter */}
            <div style={card({ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", marginBottom: 10, background: "#fdf2f8", borderColor: "#f9a8d4" })}>
              <motion.div aria-hidden animate={REDUCED_MOTION ? {} : { rotate: [0, -6, 6, 0] }} transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }} style={{ fontSize: 42 }}>👵🏼</motion.div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>Mavis Bodkin's Jousting Emporium</div>
                <div style={{ fontSize: 12, fontStyle: "italic", color: C.textSoft, lineHeight: 1.35 }}>"{quote}"</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: C.textSoft, margin: "0 2px 8px" }}>You have <b style={{ color: C.greenInk }}>{money(cash)}</b>. Each item lasts a set number of tournaments, one used per tournament you enter with it.</div>
            {GEAR.filter(function (g) { return !g.basic; }).map(function (g, i) {
              var n = cart[g.id] || 0, price = priceOf(g.id, props.topTier), own = locker[g.id] || 0;
              return (
                <div key={g.id} style={card({ display: "flex", gap: 10, padding: "10px 10px", marginBottom: 8 })}>
                  <motion.div aria-hidden animate={REDUCED_MOTION ? {} : { rotate: [0, -7, 7, -3, 0], y: [0, -4, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2 + (i % 4) * 0.7, delay: i * 0.35 }}
                    style={{ fontSize: 46, width: 58, textAlign: "center", flexShrink: 0, alignSelf: "flex-start" }}>{g.icon}</motion.div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{g.name}</span>
                      <span style={{ fontSize: 10.5, fontWeight: 800, color: C.textMuted }}>{g.slot}</span>
                    </div>
                    <div style={{ fontSize: 11.5, color: C.textSoft, lineHeight: 1.35, marginTop: 1 }}>{g.pitch}</div>
                    <Effects g={g} compact />
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: C.goldInk }}>Lasts {g.uses} tournament{g.uses > 1 ? "s" : ""}{own ? " · you own " + own : ""}</span>
                      <span style={{ flex: 1 }} />
                      {n > 0 && (<button onClick={function () { addCart(g.id, -1); }} aria-label={"Remove " + g.name} style={button("ghost", { padding: "5px 10px", fontSize: 14 })}>−</button>)}
                      {n > 0 && (<span style={{ fontSize: 13, fontWeight: 900 }}>{n}</span>)}
                      {(function () { var ok = cost + price <= cash; return (<button disabled={!ok} onClick={function () { if (ok) addCart(g.id, 1); }} style={button(ok ? "gold" : "ghost", { padding: "6px 10px", fontSize: 12.5, opacity: ok ? 1 : 0.55, cursor: ok ? "pointer" : "default" })}>{ok ? (n ? "+" : "Add") + " " + money(price) : money(price) + " · can't afford"}</button>); })()}
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
          <span aria-hidden style={{ fontSize: 22 }}>{BY_ID[kit.lance].icon}{BY_ID[kit.saddle].icon}</span>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{BY_ID[kit.lance].name} + {BY_ID[kit.saddle].name}</span>
          {cost > 0 && (<span style={{ color: canPay ? C.text : C.redInk, fontWeight: 900 }}>Basket {money(cost)}</span>)}
        </div>
        <button onClick={confirm} disabled={!canPay} style={button(canPay ? "gold" : "ghost", { width: "100%", padding: "12px 10px", fontSize: 16, opacity: canPay ? 1 : 0.6 })}>
          {canPay ? (cost > 0 ? "✅ Pay " + money(cost) + " & ride" : "✅ Confirm & ride") : "Not enough money — take something out"}
        </button>
      </div>
    </div>,
    document.body
  );
}

/* What an item does: its plain effects (green good, red bad), then how each lane changes it */
function Effects(props) {
  var g = props.g; if (!g) return null;
  var lines = fxLines(Object.assign({ zone: 0, speed: 1, accel: 1, floor: 0, aim: 0, gold: 0, miss: 0 }, g.fx)), notes = condNotes(g.id);
  if (g.basic) return (<div style={{ fontSize: 11.5, color: C.textMuted, marginTop: props.compact ? 4 : 8 }}>{g.pitch}</div>);
  return (
    <div style={{ marginTop: props.compact ? 4 : 8, fontSize: 11.5, lineHeight: 1.45 }}>
      {!props.compact && (<div style={{ fontSize: 12, color: C.textSoft, marginBottom: 2 }}>{g.pitch}</div>)}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
        {lines.map(function (l) { return (<span key={l.text} style={{ fontWeight: 900, color: l.good ? C.greenInk : C.redInk }}>{l.good ? "▲" : "▼"} {l.text}</span>); })}
      </div>
      {notes.map(function (n) {
        return (<div key={n.cond} style={{ color: C.textSoft }}><b>{n.label}:</b> {n.lines.map(function (l) { return l.text; }).join(", ")}</div>);
      })}
    </div>
  );
}
