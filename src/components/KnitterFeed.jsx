/* ═══ KnitterFeed ═══ 🧶 Knitter, the granny social network, as a feed of its own (News tab): every week's knits from
   the papers you still have, newest first, with selfies, likes and replies — plus what's trending and what your
   followers do for you. The paper itself only points here. */

import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import Icon from "./Icons";
import Selfie from "./Selfie";
import { fmtFollowers as fmtK } from "../engine/social";
import { Face, PLAYER_PALETTE as BASE_PAL, paletteFor, withKit } from "./Rider";
import { REDUCED_MOTION } from "./fx";
import { C, FONT } from "../ui/theme";

var TEAL = "#0e7490";

/* hashtags in blue, the rest plain */
function Text(props) {
  var parts = String(props.t || "").split(/(#[A-Za-z0-9_]+)/g);
  return (<span>{parts.map(function (p, i) { return p.charAt(0) === "#" ? (<b key={i} style={{ color: TEAL, fontWeight: 800 }}>{p}</b>) : p; })}</span>);
}

function Knit(props) {
  var k = props.k, pal = k.isP ? props.myPal : paletteFor(k.id, k.rank || 500);
  return (
    <motion.div initial={REDUCED_MOTION ? false : { opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.35 }}
      style={{ display: "flex", gap: 9, padding: "10px 12px", background: "#fff", borderBottom: "1px solid #e7e5e4" }}>
      {k.fan ? (<span aria-hidden style={{ width: 38, height: 38, borderRadius: "50%", background: "#e0f2fe", border: "1.5px solid #3f2a1d", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 19, flexShrink: 0 }}>📣</span>) : (<Face palette={pal} size={38} />)}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, lineHeight: 1.25 }}>
          <b style={{ color: C.text }}>{k.emoji} {k.name}</b>{k.isP && (<span style={{ marginLeft: 4, fontSize: 10, fontWeight: 900, color: "#fff", background: TEAL, borderRadius: 6, padding: "1px 5px" }}>YOU</span>)}
          <div style={{ color: C.textMuted, fontSize: 11.5 }}>{k.handle || "@" + (k.name || "").split(" ")[0] + "Jousts"} · {fmtK(k.followers)} followers · S{k.s} {k.wk}</div>
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.4, marginTop: 3, color: C.text }}><Text t={k.text} /></div>
        {k.photo && (<div style={{ marginTop: 6 }}><Selfie seed={k.photo.seed} text={k.photo.place} who={k.photo.who || undefined} palette={pal} h={150} /></div>)}
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: C.textMuted, marginTop: 5, fontWeight: 700 }}>
          <span>❤️ {fmtK(k.likes)}</span><span>🔁 {fmtK(Math.round(k.likes / 6))}</span><span>💬 {k.reply ? 1 : 0}</span>
        </div>
        {k.reply && (<div style={{ fontSize: 13, marginTop: 6, padding: "6px 9px", background: "#f5f5f4", borderRadius: 10, color: "#44403c" }}><b>{k.reply.name}</b> <Text t={k.reply.text} /></div>)}
      </div>
    </motion.div>
  );
}

export default function KnitterFeed(props) {
  var issues = props.issues || [], myPal = withKit(BASE_PAL, props.kit);
  var feed = [];
  issues.forEach(function (it) { (it.knits || []).forEach(function (k) { feed.push(Object.assign({}, k, { s: it.s, wk: it.wk })); }); });
  /* trending: the hashtags used most across the feed */
  var count = {};
  feed.forEach(function (k) { (String(k.text).match(/#[A-Za-z0-9_]+/g) || []).forEach(function (h) { count[h] = (count[h] || 0) + 1; }); });
  var trending = Object.keys(count).sort(function (a, b) { return count[b] - count[a]; }).slice(0, 6);
  var chain = issues[0] && issues[0].fanChain;
  return (
    <div style={{ fontFamily: FONT, margin: "0 -2px" }}>
      <div style={{ borderRadius: 14, overflow: "clip", border: "1.5px solid #d6d3d1", background: "#fff" }}>
        {!props.bare && (<div style={{ position: "sticky", top: 0, zIndex: 2, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #e7e5e4" }}>
          <span style={{ fontWeight: 900, fontSize: 18, color: TEAL }}>🧶 Knitter</span>
          {chain && (<span style={{ fontSize: 12, fontWeight: 800, color: C.textSoft }}>You: {fmtK(chain.fol)} followers</span>)}
        </div>)}
        {chain && (<div style={{ padding: "8px 12px", background: "#ecfeff", borderBottom: "1px solid #e7e5e4", fontSize: 12.5, color: "#155e75", lineHeight: 1.4 }}>
          📌 {fmtK(chain.fol)} followers {chain.lift ? "lift your crowd love's resting level by +" + chain.lift + " (to " + chain.settle + ")" : "— not enough yet to lift your crowd love (that starts at 1K)"}. ❤️ {chain.fans} pays <b>+{chain.tp} training pts</b> a week.
        </div>)}
        {trending.length > 0 && (<div style={{ padding: "8px 12px", borderBottom: "1px solid #e7e5e4", fontSize: 12 }}>
          <span style={{ fontWeight: 900, color: C.textMuted, letterSpacing: 1 }}>TRENDING </span>
          {trending.map(function (h) { return (<span key={h} style={{ display: "inline-block", margin: "3px 6px 0 0", padding: "2px 8px", borderRadius: 12, background: "#f0f9ff", color: TEAL, fontWeight: 800 }}>{h}</span>); })}
        </div>)}
        {feed.length === 0 && (<div style={{ padding: "26px 14px", textAlign: "center", color: C.textMuted, fontSize: 14 }}>No knits yet — the grannies start posting after your first tournament.</div>)}
        {feed.map(function (k, i) {
          var first = i === 0 || feed[i - 1].wk !== k.wk || feed[i - 1].s !== k.s;
          return (<div key={i}>{first && (<div style={{ padding: "5px 12px", background: "#fafaf9", fontSize: 11, fontWeight: 900, letterSpacing: 1, color: C.textMuted, borderBottom: "1px solid #e7e5e4" }}>SEASON {k.s} · {String(k.wk || "").toUpperCase()}</div>)}<Knit k={k} myPal={myPal} /></div>);
        })}
      </div>
    </div>
  );
}

/* Knitter opened from Home: the feed over everything, like a phone app sliding up */
export function KnitterSheet(props) {
  return createPortal(
    <motion.div initial={REDUCED_MOTION ? false : { y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.25 }}
      style={{ position: "fixed", inset: 0, zIndex: 4000, background: "#f5f5f4", overflowY: "auto", fontFamily: FONT }}>
      <div style={{ position: "sticky", top: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "rgba(255,255,255,0.96)", borderBottom: "1px solid #e7e5e4" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: "'Fredoka','Nunito',sans-serif", fontWeight: 600, fontSize: 20, color: TEAL }}><Icon name="yarn" size={24} />Knitter</span>
        <button onClick={props.onClose} aria-label="Close" style={{ border: "none", background: "#f5f5f4", borderRadius: 999, width: 34, height: 34, fontSize: 18, fontWeight: 900, cursor: "pointer", color: C.text }}>✕</button>
      </div>
      <div style={{ maxWidth: 520, margin: "0 auto", padding: "10px 10px 30px" }}><KnitterFeed issues={props.issues} kit={props.kit} bare={true} /></div>
    </motion.div>, document.body);
}

/* Home's Knitter section: the two newest knits, a tap opens the feed */
export function KnitterPreview(props) {
  var issues = props.issues || [], latest = (issues[0] && issues[0].knits) || [], myPal = withKit(BASE_PAL, props.kit);
  return (
    <button onClick={props.onOpen} style={{ display: "block", width: "100%", textAlign: "left", cursor: "pointer", padding: 0, border: "1px solid rgba(63,42,29,0.07)", borderRadius: 18, background: "#fff", boxShadow: "0 1px 2px rgba(63,42,29,0.07), 0 6px 18px rgba(63,42,29,0.09)", overflow: "hidden", fontFamily: FONT }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 13px 6px" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "'Fredoka','Nunito',sans-serif", fontWeight: 600, fontSize: 17, color: TEAL }}><Icon name="yarn" size={22} />Knitter</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: C.textMuted }}>{latest.length ? latest.length + " new knits ›" : "open ›"}</span>
      </div>
      {latest.length === 0 && (<div style={{ padding: "4px 13px 13px", fontSize: 13, color: C.textMuted, fontWeight: 700 }}>The grannies start posting after your first tournament.</div>)}
      {latest.slice(0, 2).map(function (k2, i) {
        var pal = k2.isP ? myPal : paletteFor(k2.id, k2.rank || 500);
        return (<div key={i} style={{ display: "flex", gap: 9, padding: "8px 13px", borderTop: "1px solid #f1efe9" }}>
          {k2.fan ? (<span aria-hidden style={{ width: 30, height: 30, borderRadius: "50%", background: "#e0f2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 }}>📣</span>) : (<Face palette={pal} size={30} />)}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{k2.emoji} {k2.name}{k2.isP ? " · you" : ""}</div>
            <div style={{ fontSize: 13, color: C.textSoft, lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}><Text t={k2.text} /></div>
          </div>
        </div>);
      })}
    </button>
  );
}
