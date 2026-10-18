/* ═══ FanRules ═══ Every fan rule in one place, as a short numbered list with the exact numbers. Shown from the
   Fans card on Home and in the guide, so there is one set of rules and they always match the engine. */

import { TIERS } from "../models/constants";
import { wildcardReach, TIER_WILD_FANS, SLAM_WILD_FANS, SLAM_CUT } from "../engine/fans";
import { C, FONT } from "../ui/theme";

var UP = [
  ["Win a match", "+1"],
  ["Lose a match", "−1 (out in your first match: −2)"],
  ["Win after losing the first set", "+2, once a week"],
  ["Beat someone ranked far above you", "+2, up to twice a week"],
  ["Riding adds at most", "+6 a week"],
  ["Win the tournament", "+4 (a Slam: +10)"],
  ["Beat your rival", "+3"],
  ["Interview answer", "+ or −: each paper says what it likes"],
  ["A promise in the interview", "reach the semis: +6 · fall short: −5"]
];

function Row(props) {
  return (<div style={{ display: "flex", gap: 8, fontSize: 12, lineHeight: 1.35, padding: "2px 0" }}><span style={{ flex: 1, color: C.textSoft }}>{props.a}</span><b style={{ textAlign: "right", maxWidth: "55%" }}>{props.b}</b></div>);
}
function Head(props) { return (<div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: "#be123c", marginTop: 8, textTransform: "uppercase" }}>{props.children}</div>); }

export default function FanRules() {
  var wild = [1, 2, 3, 4].map(function (t) { var cut = TIERS[t].rankRange[1]; return [TIERS[t].name, "rank " + (cut + 1) + "–" + wildcardReach(cut) + " and ❤️ " + TIER_WILD_FANS + "+"]; });
  wild.push(["Grand Slam", "rank " + (SLAM_CUT + 1) + "–" + wildcardReach(SLAM_CUT) + " and ❤️ " + SLAM_WILD_FANS + "+"]);
  return (
    <div style={{ fontFamily: FONT, color: C.text }}>
      <div style={{ fontSize: 12, color: C.textSoft }}>Crowd love is a score from 0 to 100 (not a number of people). You start at 20.</div>
      <Head>1 · What moves it each tournament</Head>
      {UP.map(function (r) { return (<Row key={r[0]} a={r[0]} b={r[1]} />); })}
      <div style={{ fontSize: 11.5, color: C.textMuted, marginTop: 2 }}>The closer you are to 100, the smaller each gain (at ❤️ 60, about half).</div>

      <Head>2 · Every week: the pull back to your resting level</Head>
      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.4 }}>It slides 10% of the way toward your resting level: up if you're below it, down if you're above it.</div>
      <Row a="Resting level from your rank" b="30 · top 200: 40 · top 50: 50 · top 10: 60" />
      <Row a="Plus your Knitter followers" b="1K: +3 · 10K: +6 · 100K: +9" />

      <Head>3 · What it gives you</Head>
      <Row a="Sponsors" b="+1 training point a week for every 10 ❤️" />
      <Row a="The stands, if your ❤️ is higher than hers" b="+1% gold zone per 25 ❤️ more (max +1.5%), ×2 on match point" />
      <div style={{ fontSize: 11.5, color: C.textMuted }}>The same for her if her ❤️ is higher.</div>

      <Head>4 · Wildcards: only if you're nearly in</Head>
      <div style={{ fontSize: 12, color: C.textSoft, lineHeight: 1.4 }}>Your rank decides where you play. Crowd love only gets you in when you're just outside a cut:</div>
      {wild.map(function (r) { return (<Row key={r[0]} a={r[0]} b={r[1]} />); })}
    </div>
  );
}
