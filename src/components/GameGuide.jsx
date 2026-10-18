/* ═══ GameGuide ═══ The full player's guide: every tab, every rule, every number that matters.
   Opens from More (and from the match help). Chapters jump from the contents strip at the top.
   Numbers here mirror the game's formulas — keep them in step when the rules change. */

import * as React from "react";
import { createPortal } from "react-dom";
import { C, FONT, display, label, card } from "../ui/theme";
import { Rider, PLAYER_PALETTE, paletteFor } from "./Rider";
import { effectsOf, EffectList, Legend, statEffect } from "./Effect";
import { CompareLanes } from "./Lanes";
import FanRules from "./FanRules";
import { CONDITIONS, FIELDS } from "../engine/events";
import { GEAR } from "../engine/gear";
import { fatigueFx } from "../engine/fitness";

/* One row per thing: icon + name on the left, its effect chips on the right */
function ChipRows(props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "6px 0 10px" }}>
      {props.rows.map(function (r) {
        return (
          <div key={r.k} style={{ display: "grid", gridTemplateColumns: "112px 1fr", gap: 8, alignItems: "center", padding: "6px 8px", background: "#fff", border: "1.5px solid " + C.line, borderRadius: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{r.name}{r.sub && (<span style={{ display: "block", fontSize: 10.5, fontWeight: 800, color: C.textMuted }}>{r.sub}</span>)}</span>
            <EffectList list={r.list} empty={r.empty || "No change"} />
          </div>
        );
      })}
    </div>
  );
}

const { useRef } = React;

function H(props) { return (<div style={{ fontSize: 15, fontWeight: 900, color: C.text, margin: "14px 0 4px" }}>{props.children}</div>); }
function P(props) { return (<p style={{ fontSize: 14, color: C.textSoft, lineHeight: 1.6, margin: "0 0 8px" }}>{props.children}</p>); }
function B(props) { return (<b style={{ color: C.text }}>{props.children}</b>); }
function List(props) {
  return (<ul style={{ margin: "0 0 8px", paddingLeft: 20, fontSize: 14, color: C.textSoft, lineHeight: 1.6 }}>{props.items.map(function (it, i) { return (<li key={i} style={{ marginBottom: 3 }}>{it}</li>); })}</ul>);
}
function Table(props) {
  return (
    <div style={{ overflowX: "auto", margin: "4px 0 10px" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, color: C.text }}>
        <thead><tr>{props.head.map(function (h, i) { return (<th key={i} style={{ textAlign: "left", padding: "6px 6px", background: C.night, color: "#fff", fontWeight: 900, fontSize: 11, letterSpacing: 0.5, whiteSpace: "nowrap" }}>{h}</th>); })}</tr></thead>
        <tbody>{props.rows.map(function (r, ri) {
          return (<tr key={ri} style={{ background: ri % 2 ? "transparent" : C.cardWarm }}>{r.map(function (c, ci) { return (<td key={ci} style={{ padding: "6px 6px", borderBottom: "1px solid " + C.line, verticalAlign: "top", fontWeight: ci === 0 ? 800 : 500 }}>{c}</td>); })}</tr>);
        })}</tbody>
      </table>
    </div>
  );
}
function Tip(props) {
  return (<div style={{ display: "flex", gap: 8, background: "#ecfeff", border: "1.5px solid #a5f3fc", borderRadius: 12, padding: "8px 10px", margin: "6px 0 10px", fontSize: 13.5, color: "#155e75", lineHeight: 1.5 }}>
    <span aria-hidden>📣</span><span>{props.children}</span></div>);
}

/* The strike bar, labelled: where you land decides the score */
function ScoreBar() {
  return (
    <div style={{ margin: "8px 0 12px" }}>
      <svg viewBox="0 0 320 70" style={{ width: "100%", display: "block" }} aria-label="Strike scoring diagram">
        <rect x="4" y="18" width="312" height="24" rx="12" fill="#1e293b" />
        <rect x="190" y="21" width="42" height="18" rx="9" fill="#facc15" />
        <line x1="211" y1="16" x2="211" y2="44" stroke="#fff" strokeWidth="2" />
        <path d="M200 50 L196 58 L204 58 Z" fill="#ef4444" />
        <text x="211" y="12" fontSize="10" fontWeight="900" textAnchor="middle" fill="#166534">100</text>
        <text x="186" y="12" fontSize="9" fontWeight="800" textAnchor="middle" fill="#15803d">85</text>
        <text x="236" y="12" fontSize="9" fontWeight="800" textAnchor="middle" fill="#15803d">85</text>
        <text x="172" y="66" fontSize="9" fontWeight="800" textAnchor="middle" fill="#a16207">70</text>
        <text x="110" y="66" fontSize="9" fontWeight="800" textAnchor="middle" fill="#b91c1c">↓ falls further out</text>
        <text x="270" y="66" fontSize="9" fontWeight="800" textAnchor="middle" fill="#b91c1c">↓</text>
        <text x="200" y="68" fontSize="8" fontWeight="700" textAnchor="middle" fill="#ef4444">her strike</text>
      </svg>
    </div>
  );
}

var CHAPTERS = [
  { id: "welcome", icon: "👵", title: "Welcome" },
  { id: "tabs", icon: "🧭", title: "Getting around" },
  { id: "season", icon: "📅", title: "The season" },
  { id: "tourney", icon: "🏟️", title: "Tournaments" },
  { id: "match", icon: "⚔️", title: "The match" },
  { id: "score", icon: "🎯", title: "Scoring" },
  { id: "difficulty", icon: "📈", title: "Difficulty" },
  { id: "training", icon: "🏋️", title: "Stats & training" },
  { id: "money", icon: "💰", title: "Prize money" },
  { id: "gear", icon: "🧰", title: "Lances & saddles" },
  { id: "fitness", icon: "💪", title: "Fitness & physio" },
  { id: "fans", icon: "❤️", title: "Fans & the press" },
  { id: "paper", icon: "📰", title: "The Daily Cluck" },
  { id: "rivals", icon: "😤", title: "Rivals" },
  { id: "ranks", icon: "🏆", title: "Rankings & profiles" },
  { id: "ach", icon: "🏅", title: "Achievements" },
  { id: "gala", icon: "🎩", title: "End of season" },
  { id: "settings", icon: "⚙️", title: "Settings & saves" },
  { id: "tips", icon: "📣", title: "Coach's tips" }
];

function body(id) {
  switch (id) {
    case "welcome": return (<>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, margin: "0 0 8px" }}>
        <Rider palette={PLAYER_PALETTE} width={120} pose="cheer" /><Rider palette={paletteFor(57, 7)} width={120} pose="idle" flip={true} />
      </div>
      <P>You're a granny on a rooster, starting at <B>#1000 of 1,000</B> on the world jousting tour. Every week you ride in a tournament, win matches with well-timed strikes, earn ranking points, prize money and training, and climb — from the dusty Futures lanes to the golden helmets of the top ten.</P>
      <P>Every one of the 999 other grannies is a full rider too: she plays her own tournaments, earns points, trains by the same rules as you, and has her own face, rooster, trait and opinions.</P>
      <Tip>The whole game rests on one skill: stopping the moving marker on the centre of the gold zone. Everything else — training, money, fans — shifts the odds, but your timing decides matches.</Tip>
    </>);

    case "tabs": return (<>
      <P>Six tabs live in the bar at the bottom of the screen:</P>
      <Table head={["Tab", "What's there"]} rows={[
        ["🏠 Home", "Your granny card (tap it for your profile), the next event and its button, your rival, achievements, the latest newspaper and your ranking chart."],
        ["🏋️ Train", "Spend training points on six stats, this week's investment (private coach, physio, pedigree), and how you compare with the riders near your rank. A red badge shows how many stats you can afford."],
        ["📅 Season", "The season road map: progress through the four blocks, what's up next, what you're chasing (Grand Slam entry, the Finals), and every week's result."],
        ["📰 News", "The Daily Cluck — a fresh issue after every tournament, plus the archive. A ! badge means an unread issue."],
        ["🏆 Ranks", "The world rankings, opening on your own row. Toggle 'Around me' or 'Top 50', and tap any granny for her profile."],
        ["⚙️ More", "Your account, the world leaderboard, achievements, replaying the tutorial, the rules, music and sound switches, and saves."]
      ]} />
    </>);

    case "season": return (<>
      <P>A season is <B>20 events</B> in four blocks. Each block is four weekly tournaments followed by a <B>Grand Slam</B>. After the 20th event, the top 16 ride in the <B>Season Finals</B>, then the season ends with a gala.</P>
      <H>Ranking points and defending</H>
      <P>Your world rank is your <B>season points</B>. Points carry over into the next season, but the points you won at a given week last season <B>drop off</B> when that week comes round again. You "defend" them: win more than last time and you climb, less and you slip. The Season tab shows what you're defending, in red.</P>
      <H>Grand Slams</H>
      <P>Only the <B>top 64</B> may enter a Slam. A rider ranked 65–74 with <B>80+ fans</B> gets a fan wildcard. If you can't enter, you sit the week out. Slams are 64 riders, best of 5 sets, and worth enormous points.</P>
      <H>Season Finals</H>
      <P>The top 16 after event 20 are split into four houses of four (🔥 Phoenix, 🌊 Kraken, 🐉 Wyvern, ⚡ Chimera). Everyone plays everyone in her house (3 points a win); the four house winners meet in the semifinals and then the World Final. Every Finals match is best of 5, and every one tires you (and her). If you don't qualify, the Finals are played without you and a world champion is crowned all the same.</P>
    </>);

    case "tourney": return (<>
      <P>Tap <B>Choose tournament</B> on Home or Season. Your rank decides which tiers are open:</P>
      <Table head={["Tier", "Open to ranks", "Sets", "Champion's points", "Champion's prize"]} rows={[
        ["Futures", "601–1000", "Best of 3", "192", "$4.6K"],
        ["Challenger", "301–700", "Best of 3", "477", "$16K"],
        ["Tour 250", "101–400", "Best of 3", "1,200", "$64K"],
        ["Tour 500", "31–200", "Best of 3", "2,360", "$162K"],
        ["Masters", "1–100", "Best of 5", "4,750", "$460K"],
        ["Grand Slam", "1–64", "Best of 5", "15,750", "$1.6M"]
      ]} />
      <P>Each tournament is a knockout bracket (32 riders, 64 at a Slam). Every round you win adds points and prize money; the totals above are for winning the whole thing. Lose and your week is over.</P>
      <H>Named events: pick your week</H>
      <P>Each week several tournaments run at once in every tier, and all 1,000 riders play one of them. Tap a tier to see its events. Each card shows:</P>
      <List items={[
        <span key="n"><B>Name and lanes</B> — the conditions change the match for both riders:</span>,
                <span key="ln"><B>The lanes</B> change the match for both riders:</span>,
        <span key="e"><B>Entrants (★)</B> — who signed up. ★★★ tough entrants: mostly the tier's top-ranked riders, +10% points. ★★ mixed. ★ weaker entrants: mostly lower-ranked riders, −10% points.</span>,
        <span key="s"><B>Top seeds</B> — the two best-ranked riders in the draw, and what the champion takes home.</span>
      ]} />
      <CompareLanes />
      <ChipRows rows={Object.keys(FIELDS).map(function (k) { var f = FIELDS[k]; return { k: k, name: "★".repeat(f.stars) + " " + f.label, list: effectsOf({ pts: f.pts }), empty: "Normal points" }; })} />
      <P>Grand Slam weeks have a single named Slam (The Coop Open, The Swamp Slam, Wimbledon-on-Wold, The Gale Cup), each with its own lanes.</P>
      <H>Getting into a higher tier early</H>
      <List items={[
        <span key="a"><B>Fan wildcard:</B> if you're ranked just outside the tier above (within 15% of its cut) and have 70+ fans, it opens for free.</span>,
        <span key="b"><B>Paid entry:</B> at the bottom of the tournament list you can buy your way into the tier above for this week only (it uses this week's investment).</span>
      ]} />
      <P>During a tournament, the header shows the tier, the round, best-of and the bracket path. <B>Scout</B> opens the opponent's full report; 🌐 opens the bracket.</P>
    </>);

    case "match": return (<>
      <H>The match elements</H>
      <P>Everything in the game that changes a match — lanes, gear, tiredness, training — changes one of these. The same little chips are used everywhere.</P>
      <Legend />
      <H>1 · The scouting report</H>
      <P>Before every match a "tale of the tape" compares you side by side: world rank, season points, her talent, every stat (green where you're stronger, red where she is), the difficulty, your head-to-head and her rooster. A red banner marks your arch-rival. Take your time, then tap <B>To the lanes!</B></P>
      <H>2 · The opening</H>
      <P>The VS splash plays in full, then 3–2–1 and the announcer's <B>FIGHT!</B> Before a <B>final</B> (only a final) you first get a special build-up: the trophy, your road to the final, and your opponent revealed from the shadows.</P>
      <H>3 · Sets and strikes</H>
      <List items={[
        <span key="1">A match is played in <B>sets</B>; each set is <B>3 strikes</B>.</span>,
        <span key="2">Each strike, you and she both score. The set goes to whoever has the <B>higher average</B> of the three, rounded as the screen shows it — one bad strike can be rescued. <B>Level averages (say 83–83) go to tie-break strikes</B> until one rider is ahead.</span>,
        <span key="3">Win the majority of sets: best of 3 (first to 2) up to Tour 500, best of 5 (first to 3) at Masters, Slams and the Finals. A deciding set only happens if it's needed.</span>
      ]} />
      <H>4 · Striking</H>
      <P>A blue marker sweeps back and forth across the bar. Tap the big round <B>STRIKE</B> button (or the arena, or press Space) when it's in the gold zone — as close to the white centre line as you can. The bar gets a little faster with every strike and every set; a new set starts a touch faster than the last.</P>
      <H>5 · Reading the screen</H>
      <List items={[
        <span key="a">The chip at the top shows the set and strike. On the last strike of a set it turns into <B>Set point</B>, <B>Match point</B>, <B>Save the match</B> or <B>All on the line</B>, with the score you need.</span>,
        <span key="b">Coloured orbs under each name are that set's strikes. The bar below them is the set's running gap.</span>,
        <span key="c">Your strike leaves a tick on the bar, hers a red ▲. Between sets a break screen shows the set result.</span>,
        <span key="d">When the match is decided, the loser is unseated and the outro shows the score, points and prize.</span>
      ]} />
      <Tip>Progress is saved after every strike. Close the game mid-match and you'll pick up exactly where you left off.</Tip>
    </>);

    case "score": return (<>
      <P>Both of you are scored the same way: <B>where the lance lands on the bar</B>.</P>
      <ScoreBar />
      <Table head={["Where you land", "Score"]} rows={[
        ["On the centre line", "100"],
        ["Inside the gold zone", "Slides from 100 down to 85 at the zone's edge"],
        ["Just outside the gold", "A sharp drop to 70"],
        ["Further out", "Falls about 2 points for every % of the bar, down to your floor"]
      ]} />
      <List items={[
        <span key="a"><B>Aim (extra points)</B> adds points on top of every strike — 1.5 per level you're ahead of her (or takes them away if she has more Aim). That's why you can see, say, 83: a gold-edge 85 minus a little Aim, or a just-outside 70 plus a lot of Aim (extra points).</span>,
        <span key="b"><B>Stubbornness (softer misses)</B> sets your floor — the lowest a strike can score (15 at even levels).</span>,
        <span key="gr"><B>Gear</B> adds or takes points (on gold hits, on misses, or every strike), and <B>tiredness</B> takes points off your misses — the line under your score shows both: <i>In the gold 92 + 2 Aim (extra points) + 3 Gear − 0 Tired</i>.</span>,
        <span key="c">There's almost no luck: ±1 point. The same strike always scores about the same.</span>,
        <span key="d">Labels: <B>PERFECT!</B> 96+, <B>GOLD!</B> inside the zone, <B>CLOSE</B> just outside, <B>MISS</B> beyond.</span>
      ]} />
      <H>How your opponent scores</H>
      <P>She strikes on the same kind of bar and is scored by the same rule. Her <B>talent</B> decides how tightly she groups around the centre — a gifted granny lands near 100 time after time, a developing one sprays all over. The round's speed spreads her out just as it does you.</P>
      <H>The crowd's roar</H>
      <P>On the last strike of a set with the match on the line, a crowd that loves you widens your gold zone: <B>+1%</B> of the bar with 60+ fans, <B>+2%</B> with 85+.</P>
    </>);

    case "difficulty": return (<>
      <P>How hard a strike is comes from three things:</P>
      <Table head={["What", "What it does"]} rows={[
        ["1 · Your levels", "Your own levels build your own bar: a slower bar, a wider gold zone, extra points, softer misses. Her levels build her bar, never yours."],
        ["2 · The round", "Each tier starts a step harder, and each round within a tournament adds a little more. This narrows the gold zone and speeds the bar for both of you."],
        ["3 · Hands", "Where you stop on your bar is your finger. Where she stops is her talent: how close to the centre she lands, a little worse when her bar runs faster, with a form for the day."],
        ["4 · Nerves", "Facing a rider ranked many times higher (×30 or more) shrinks the underdog's gold zone by up to 1%, less with every set she wins. Close ranks: nothing."]
      ]} />
      <P>An example — the width of your gold zone with Steady Stride (bigger gold):</P>
      <Table head={["Situation", "Gold zone"]} rows={[
        ["Futures round 1, no training", "12% of the bar"],
        ["Same, Steady Stride 5", "13.7%"],
        ["Same, Steady Stride 10", "15%"],
        ["Masters final, Steady Stride 15", "about 6.6%"]
      ]} />
      <P>The gold zone never shrinks to nothing: once it is under 8% of the bar, every further squeeze (a late round, wind, tiredness, gear, nerves) counts less and less, so it bottoms out around 4–5%. The bar never gets impossibly fast or slow either.</P>
    </>);

    case "training": return (<>
      <P>Six stats, each from level 0 to 20: three for the granny, two for the rooster, and Bounce-back for recovery. Every level builds <B>your own bar</B>; her levels build hers. Each level gives a little less than the one before (level 20 works like 11).</P>
      <ChipRows rows={[["r", "⚡ Reflexes (slower bar)"], ["f", "🎯 Aim (extra points)"], ["g", "🛡️ Stubbornness (softer misses)"], ["s", "🫀 Stamina (less speed-up)"], ["p", "🐾 Steady Stride (bigger gold)"], ["b", "🔋 Bounce-back"]].map(function (x) { return { k: x[0], name: x[1], sub: x[0] === "b" ? "counts on its own" : "each level ahead", list: statEffect(x[0]) }; })} />
      <H>Training points (TP)</H>
      <P>Everyone on tour — you and every rival — earns TP by the same rule every week: <B>8 for turning up, plus a third of the ranking points you won</B>. A deep run buys you a few levels on the riders who went out early; the edge fades once you move up to a tier where everyone is winning that much. You also get <B>sponsor TP</B> from your fans (one per 10 fans).</P>
      <P>Each level costs more than the last: 15 TP for level 1, 30 for level 2, 45 for level 3… and from level 9 the price climbs faster still.</P>
      <H>On the Train tab</H>
      <List items={[
        <span key="a">Each stat shows what it does, its exact per-level effect, and when it's worth training.</span>,
        <span key="b">The dark tick on each bar, and the "Vs rivals" line, show the average level of the riders ranked near you — ahead, behind or level.</span>,
        <span key="c">Every level you buy plays a quick gag: a swatted fly, a bullseye, a bounced pillow, a treadmill, a balance beam.</span>
      ]} />
    </>);

    case "gear": return (<>
      <P>After you pick a tournament you land on <B>Get ready</B>. Choose a lance and a saddle from <B>your locker</B>, or buy new ones at <B>Mavis's shop</B>. Nothing is paid or used up until you press <B>Confirm & ride</B>, so change your mind as often as you like; ✕ goes back to the tournament list.</P>
      <List items={[
        <span key="a">The <B>🧹 Trusty Broom-Handle</B> and the <B>🫖 Tea-Cosy Saddle</B> are free, neutral and always yours.</span>,
        <span key="b">Everything else lasts a set number of tournaments (1, 2, 3 or 5). Each tournament you enter with it uses one, however many rounds you play.</span>,
        <span key="c">Prices follow the best tier you can enter: one tournament's worth costs about 6% of that tier's champion prize.</span>,
        <span key="d">Gear changes <B>your</B> bar only, never your opponent's. After each strike the breakdown shows its points as <B>Gear</B>.</span>,
        <span key="r"><B>Rivals shop too</B>, with prize money they actually won: each picks the kit she thinks suits the lanes (the tour's best judge it well, lower ranks guess), keeps a reserve, and books physio when worn out. Her kit shows in the tale of the tape.</span>,
        <span key="e">Every item helps one thing and hurts another, and the lanes shift the balance. Precise riders tend to love the needle; riders who miss a lot get more from the baguette.</span>
      ]} />
      <ChipRows rows={GEAR.filter(function (g) { return !g.basic; }).map(function (g) { return { k: g.id, name: g.icon + " " + g.name, sub: "Lasts " + g.uses + " · differs in " + Object.keys(g.cond || {}).map(function (c) { return (CONDITIONS[c] || {}).icon; }).join(" "), list: effectsOf(g.fx) }; })} />
    </>);

    case "fitness": return (<>
      <P>You have <B>two fitness meters</B>, 0–100%: 👵 the granny's and 🐓 the rooster's. They're on Home, in the Get ready screen, in the match header and in the tale of the tape (hers too).</P>
      <List items={[
        <span key="a"><B>Every match tires both of you:</B> −2.8% granny and −3.4% rooster for every set you ride, so a three-set match tires you more than a two-set one, and a long tournament more than a short one. A deep run leaves you tired in the later rounds — and so is the rider who got there with you.</span>,
        <span key="b"><B>A tired granny:</B> the gold zone gets narrower (up to −4% at 0) and misses score less (up to −10). The strike breakdown shows it as <B>Tired</B>.</span>,
        <span key="c"><B>A tired rooster:</B> the bar starts faster (up to +18%) and speeds up more after every strike (up to +60%).</span>,
        <span key="d"><B>Fitness only comes back between tournaments:</B> 40% of whatever is missing comes back after every tournament, plus 0.7% per level of 🔋 <B>Bounce-back</B>. A **rest week** brings back 80% of what's missing (and double the Bounce-back): tap **😴 Rest this week** at the bottom of the tournament list, or skip a Grand Slam you can't enter. You score no points that week and last season's points for it drop off. Only part comes back, so tiredness builds up for anyone who keeps going deep.</span>,
        <span key="e"><B>🔋 Bounce-back</B> is the sixth stat (0–20). Unlike the others it counts on its own, not against your opponent.</span>,
        <span key="f"><B>Physio staff</B> (Train tab, as the week's one investment): 👩‍⚕️ Nurse Nellie +35% granny, 🩺 Dr. Featherby the rooster chiropractor +35% rooster, 🛁 a spa weekend at Bingo-on-Sea +20% both — straight away.</span>,
        <span key="i"><B>Injuries:</B> ride on under 35% and every match risks one (up to 25% a match at 0). An injury knocks 2–3 levels off one or two stats for 2–3 tournaments: 🦵 pulled hamstring (Reflexes), 💪 jouster's elbow (Aim), 🪑 creaky back (Stubbornness), 🐾 sprained claw (Steady Stride), 🪽 pulled wing (Stamina), 🦴 bruised wishbone (both rooster stats). Physio on that side shortens it by a tournament.</span>,
        <span key="sf">The Season Finals tire you too.</span>,
        <span key="g">Every rider on tour plays by the same fitness rules.</span>
      ]} />
      <ChipRows rows={[80, 60, 40].map(function (v) { var x = fatigueFx({ g: v, r: v }); return { k: v, name: "At " + v + "% fitness", sub: v === 60 ? "≈ a final" : null, list: effectsOf({ zone: Math.round(x.zone * 10) / 10, miss: Math.round(x.miss), speed: Math.round(x.speed * 100) / 100, accel: Math.round(x.accel * 100) / 100 }) }; })} />
    </>);

    case "money": return (<>
      <P>Prize money buys <B>one investment per tournament week</B>. After you make one, the rest lock until you play that week's tournament. Prices follow the prizes at your level, so they stay meaningful as you climb.</P>
      <Table head={["Investment", "What you get", "Price"]} rows={[
        ["📣 Private session", "+10 TP (Train tab)", "20% of a champion's prize at your top open tier — about $900 at Futures, $90K at Masters"],
        ["🎟️ Paid entry", "The tier above your range, this week only (tournament list)", "35% of that tier's champion's prize — about $5.7K for Challenger"],
        ["🩺 Physio", "Fitness back now, injuries heal a tournament sooner (Train tab)", "12–18% of a champion's prize"],
        ["🧬 Pedigree certificate", "Raises the cap on Stamina (less speed-up) and Steady Stride (bigger gold): 20 → 22 → 24 → 26", "$250K, $1M, $3M"]
      ]} />
      <P>The world leaderboard counts everything you've ever earned, so spending never costs you places there.</P>
    </>);

    case "fans": return (<>
      <P><B>Crowd love</B> (❤️, 0–100, starting at 20) is a score of how much the crowd loves you, not a head count. Your Knitter followers are the people.</P>
      <FanRules />
      <H>🧶 Knitter</H>
      <P>The granny social network (posts are <i>knits</i>). Everyone has followers; yours grow with wins, titles, liked interviews and viral moments, faster the more famous you are. They lift the level your fans settle at, and the paper prints the week's best knits.</P>
      <H>The press conference</H>
      <P>Before you answer you see what this outlet's readers love and dislike, and every answer is labelled: 😏 cheeky dig, 🙈 daft excuse, 😇 good sport, 💪 bold promise. No dice: the result comes from the readers' taste, the moment (a humble winner, a gracious loser, a dig at your rival) and whether you repeat last week's kind of answer. A well-liked answer can go viral and double. Afterwards you see every point and why.</P>
    </>);

    case "paper": return (<>
      <P>A new issue of <B>The Daily Cluck</B> prints after every tournament, and you can read it any time in the News tab (with the archive of recent issues).</P>
      <List items={[
        <span key="a"><B>The front page</B> goes to the week's biggest story — a Slam champion, a new world #1, a Cinderella title, a giant-killing, or you if you earned it.</span>,
        <span key="b"><B>Your week:</B> points, prize money, your best win, who knocked you out, and your interview quote with the crowd's verdict.</span>,
        <span key="c"><B>The feud:</B> what your rival did this week and your head-to-head.</span>,
        <span key="d"><B>Around your ranking:</B> who's climbing and falling near you, and gym gossip.</span>,
        <span key="e"><B>World tour:</B> the top five and the week's biggest title.</span>
      ]} />
      <P>When it opens after a tournament, tap <B>Fold the paper</B> to put it away.</P>
    </>);

    case "rivals": return (<>
      <P>Your <B>arch-rival</B> is the granny you keep meeting — preferably the one who keeps beating you. She's picked from your head-to-head record after each tournament (at least two meetings and one loss to her).</P>
      <List items={[
        <span key="a">She shows on Home, with a red banner before your matches, a badge on her profile, and her own column in the paper.</span>,
        <span key="b">Beat her for <B>Sweet Revenge</B> (+3 fans).</span>,
        <span key="c">Lead her head-to-head by three and the feud is <B>settled</B> — she stops bothering you, and the next grudge can take her place.</span>
      ]} />
    </>);

    case "ranks": return (<>
      <P>The Ranks tab lists all 1,000 riders by season points and opens on your own row, with 25 above and below ("show 25 more" to see further). Switch to <B>Top 50</B> to see the leaders. Golden helmets mark the top ten; the world #1 wears the crown.</P>
      <H>Profiles</H>
      <P>Tap any granny for her profile: her rider and rooster, trait and quote, ranks and points, natural talent and potential, training levels, titles, and your head-to-head — every match with its result in sets and each set's score.</P>
      <P>Tap your own card on Home for your profile. The ✏️ buttons rename your granny and your rooster.</P>
    </>);

    case "ach": return (<>
      <P><B>35 achievements</B> in six groups — on the tour, with the lance, the ladder, feuds, crowd & press, and the gym. A badge slides down from the top when you earn one; Home and More show your collection, with progress bars on the counted ones and how to earn the ones you're missing.</P>
    </>);

    case "gala": return (<>
      <P>When the season is over, the <B>Grand Gala</B> plays: the world champion is crowned, the season's awards are handed out one envelope at a time (most titles, biggest climb, most training, your best quote, fan favourite — and the participation ribbon), your season in numbers, the hall of the golden helmets, and a goal for next season. Your training, prize money, badges, fans, rival and newspaper archive all carry over into the new season — and so do last season's points, which you'll defend week by week.</P>
    </>);

    case "settings": return (<>
      <Table head={["In More", "What it does"]} rows={[
        ["👤 Account", "Sign in to keep your career in the cloud and on the world leaderboard, or log out. Guests are saved on this device only."],
        ["🌍 World Leaderboard", "Real players ranked by best rank, career prize money or titles."],
        ["🏅 Achievements", "Your badge collection."],
        ["🎓 Replay the tutorial", "Coach Hettie's tips again, on this save — your season isn't touched."],
        ["❓ How to Play", "The quick rules card (also the ? button in matches)."],
        ["🎵 Music / 🔊 Sound Effects", "Separate switches. Menu tunes play around the matches, battle tunes only during a match."],
        ["💾 Export / 📂 Import", "Download your save as a file, or load one back."],
        ["🔄 Restart Game", "Erases this save and starts over."]
      ]} />
      <P>The game saves after every change — every strike, every level, every answer.</P>
    </>);

    case "tips": return (<>
      <List items={[
        "Aim for the white line, not just the gold. 100 against 86 is the difference between winning and losing a set.",
        "If you keep overshooting, train Reflexes (slower bar). If you land just next to the gold, train Steady Stride (bigger gold). If your misses are wild, Stubbornness (softer misses).",
        "Long best-of-5 matches get faster as they go: Stamina (less speed-up) keeps them under control.",
        "Watch the 'Vs rivals' line — falling behind the riders near you is felt immediately.",
        "A title is worth far more training than a quarterfinal. Stay in a tier you can win before you jump up.",
        "Save the paid entry and wildcards for weeks you feel sharp.",
        "Keep your interviews varied — the crowd gets bored of the same joke.",
        "Promises are risky: only make a bold promise if you really expect a semifinal."
      ]} />
    </>);
  }
  return null;
}

export default function GameGuide(props) {
  var refs = useRef({});
  var scroller = useRef(null);
  function jump(id) {
    var el = refs.current[id], box = scroller.current;
    var head = box.firstChild ? box.firstChild.offsetHeight : 90;
    if (el && box) box.scrollTo({ top: el.offsetTop - head - 8, behavior: "smooth" });
  }
  return createPortal(
    <div ref={scroller} style={{ position: "fixed", inset: 0, zIndex: 965, background: C.page, overflowY: "auto", fontFamily: FONT }}>
      <div style={{ position: "sticky", top: 0, zIndex: 2, background: "rgba(255,248,231,0.97)", borderBottom: "1.5px solid " + C.line, padding: "calc(env(safe-area-inset-top) + 8px) 12px 8px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={display(22)}>📖 Game Guide</span>
            <button aria-label="Close" onClick={props.onClose} style={{ width: 34, height: 34, borderRadius: "50%", border: "2px solid " + C.ink, background: "#fff", fontSize: 18, fontWeight: 900, cursor: "pointer", color: C.ink }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingTop: 8 }}>
            {CHAPTERS.map(function (c) {
              return (<button key={c.id} onClick={function () { jump(c.id); }} style={{ flexShrink: 0, fontFamily: FONT, fontSize: 12, fontWeight: 800, padding: "5px 10px", borderRadius: 16, border: "1.5px solid " + C.line, background: "#fff", color: C.text, cursor: "pointer" }}>{c.icon} {c.title}</button>);
            })}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "10px 12px 40px" }}>
        {CHAPTERS.map(function (c) {
          return (
            <section key={c.id} ref={function (el) { refs.current[c.id] = el; }} style={card({ marginBottom: 12, padding: "12px 14px" })}>
              <div style={label(C.goldInk)}>{c.icon} {c.title}</div>
              <div style={{ marginTop: 6 }}>{body(c.id)}</div>
            </section>
          );
        })}
        <div style={{ textAlign: "center", fontSize: 12, color: C.textMuted }}>The Grand Granny Rooster Joust · Good luck on the lanes, dear.</div>
      </div>
    </div>,
    document.body
  );
}
