/* ═══ HelpScreen ═══ "How to Play": the strike, sets, how a rival scores, what gets harder, training, the crowd and
   points — short, in the game's own look. Every number matches the engine (engine/joust); the Game Guide has the rest. */

import { STATS } from "../models/constants";
import FanRules from "./FanRules";
import Icon, { IconTile, StatIcon } from "./Icons";
import { C, FONT } from "../ui/theme";

var HF = "'Fredoka','Nunito',sans-serif";

function Section(props) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
        <IconTile name={props.icon} tint={props.tint} size={34} />
        <span style={{ fontFamily: HF, fontSize: 18, fontWeight: 600, color: C.text }}>{props.title}</span>
      </div>
      {props.children}
    </div>
  );
}
function Text(props) { return (<div style={{ fontSize: 14, color: C.textSoft, lineHeight: 1.5, margin: "0 0 6px" }}>{props.children}</div>); }
function B(props) { return (<b style={{ color: C.text }}>{props.children}</b>); }
function Rows(props) {
  return (
    <div style={{ background: "#fffbeb", borderRadius: 14, padding: "4px 10px", margin: "4px 0 6px" }}>
      {props.rows.map(function (r, i) {
        return (<div key={i} style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "5px 0", borderTop: i ? "1px solid #f3ead3" : "none", fontSize: 13.5 }}>
          <span style={{ flex: 1, color: C.textSoft }}>{r[0]}</span><b style={{ fontFamily: HF, fontWeight: 600, fontSize: 15, color: r[2] || C.text, textAlign: "right" }}>{r[1]}</b>
        </div>);
      })}
    </div>
  );
}

export default function HelpScreen(props) {
  var groups = [["granny", "Granny"], ["rooster", "Rooster"], ["recovery", "Both"]];
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(28,25,23,0.5)", zIndex: 999, overflowY: "auto", padding: 14, fontFamily: FONT }} onClick={props.onClose}>
      <div style={{ maxWidth: 380, margin: "0 auto", background: "#ffffff", borderRadius: 22, padding: "16px 16px 18px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: HF, fontSize: 22, fontWeight: 700, color: C.text }}><Icon name="question" size={26} />How to Play</span>
          <button onClick={props.onClose} aria-label="Close" style={{ width: 34, height: 34, borderRadius: "50%", border: "none", background: "#f3ead3", fontSize: 18, fontWeight: 900, cursor: "pointer", color: C.ink }}>×</button>
        </div>

        <Section icon="target" tint="#fee2e2" title="The strike">
          <Text>A marker sweeps across the bar. Tap <B>STRIKE</B> (or press Space) to stop it. Where it lands sets the score:</Text>
          <svg viewBox="0 0 100 12" preserveAspectRatio="none" style={{ width: "100%", height: 22, display: "block", margin: "2px 0 6px" }} aria-hidden>
            <rect x="0.5" y="1.5" width="99" height="9" rx="4.5" fill="#292524" />
            <rect x="64" y="1.5" width="16" height="9" fill="#facc15" />
            <line x1="72" y1="1.5" x2="72" y2="10.5" stroke="#1c1917" strokeWidth="0.6" />
          </svg>
          <Rows rows={[["Dead on the centre line", "100", C.greenInk], ["Inside the gold, towards its edge", "99 → 85", C.greenInk], ["Just outside the gold", "70", C.goldInk], ["Further out", "70 → your floor", C.redInk]]} />
          <Text>On top of that come your <B>bonuses</B> — Aim, gear, minus tiredness — with no ceiling, so a near-perfect strike can read 103. The line under each score adds it up.</Text>
          <Text>A <B>set</B> is 3 strikes and the higher average takes it (level averages go to tie-break strikes). <B>Best of 3</B> sets up to Tour 500, <B>best of 5</B> in Masters, Slams and the Season Finals. Every strike is saved as you go.</Text>
        </Section>

        <Section icon="lances" tint="#e0f2fe" title="Your rival">
          <Text>She rides on <B>her own bar</B>, built from her own levels, kit and tiredness, by the same rules as yours. Where she stops comes from her <B>talent</B> (her hands), with a form for the day. Typical set averages in round 1 of each tier:</Text>
          <Rows rows={[["Futures", "about 75"], ["Challenger", "about 76"], ["Tour 250", "about 81"], ["Tour 500", "about 80"], ["Masters", "about 83"], ["The world's very best", "93+"]]} />
        </Section>

        <Section icon="chart" tint="#ede9fe" title="What gets harder">
          <Rows rows={[["Each round and each tier up", "smaller gold, faster bar"], ["Every strike in a set", "the bar speeds up"], ["Every new set", "starts a little faster"], ["Tiredness", "smaller gold, faster bar, weaker misses"], ["Facing a much higher rank or a star", "nerves: up to −1% gold"]]} />
        </Section>

        <Section icon="dumbbell" tint="#e0e7ff" title="Training">
          <Text>Every level makes <B>your own bar</B> easier; her levels make hers easier. Each level gives a little less than the one before.</Text>
          <div style={{ background: "#fffbeb", borderRadius: 14, padding: "6px 10px" }}>
            {groups.map(function (g) {
              var list = STATS.filter(function (s) { return s.who === g[0]; });
              return (<div key={g[0]} style={{ marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 900, color: C.textMuted, margin: "4px 0 2px" }}><Icon name={g[0] === "recovery" ? "battery" : g[0]} size={15} />{g[1]}</div>
                {list.map(function (s) {
                  return (<div key={s.k} style={{ display: "flex", alignItems: "flex-start", gap: 6, padding: "3px 0", fontSize: 13 }}>
                    <StatIcon k={s.k} size={16} style={{ marginTop: 1 }} />
                    <span><b style={{ color: C.text }}>{s.label}</b> <span style={{ color: C.goldInk, fontWeight: 800 }}>({s.el})</span><span style={{ color: C.textSoft }}> — each level: {s.per}</span></span>
                  </div>);
                })}
              </div>);
            })}
          </div>
        </Section>

        <Section icon="heart" tint="#ffe4e6" title="The crowd">
          <FanRules />
        </Section>

        <Section icon="trophy" tint="#fef3c7" title="Points & rankings">
          <Text>Win matches to earn points — <B>a first-round loss earns nothing</B>. Higher tiers pay more. Your rank is your season points; from season 2 you <B>defend</B> last season's points at each week of the calendar.</Text>
          <Text>For every rule and number, open the <B>Game Guide</B> in the More tab.</Text>
        </Section>

        <button onClick={props.onClose} style={{ width: "100%", marginTop: 4, padding: "14px", borderRadius: 14, border: "none", cursor: "pointer", fontFamily: HF, fontSize: 18, fontWeight: 600, color: C.ink, background: "linear-gradient(180deg,#ffd75e 0%,#f5a311 100%)", boxShadow: "0 2px 0 #c97a06, 0 8px 18px rgba(245,158,11,0.3)" }}>Got it!</button>
      </div>
    </div>
  );
}
