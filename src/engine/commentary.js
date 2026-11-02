/* ═══ Engine / Commentary ═══ The booth's dialogue, picked and templated from the real match data.
   buildPreMatch(ctx) returns an array of lines: [{ speaker: "barry" | "reggie", text, durMs }, …],
   stitched from one opener, one rank-gap take, one condition line, one head-to-head take, one closer.
   Text only — no TTS. Durations are estimated so the studio can time the subtitles and the talking
   portrait swap. When we have a shortlist that works, this same bank feeds the batch TTS generation.

   ctx shape — PowerBar builds it from its props:
     { playerName, oppName, playerRank, oppRank,
       tierName, tierIdx, roundLabel, bestOf, cond,
       h2hWins, h2hLosses, firstMeeting,
       isFinal, isSlam, isMasters }
*/

/* How long a line is on screen: a steady reading pace + a small gap at the end. */
function estimateMs(text) {
  var words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1500, Math.round(words * 320) + 500);
}

function pick(arr, rnd) { return arr[Math.floor(rnd() * arr.length)]; }
/* Seeded RNG from a match id so a given matchup always reads the same if replayed */
function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

/* Ordinal: 44 → "44th", 3 → "3rd", 1 → "1st" */
function ord(n) {
  var s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/* Barry = B, Reggie = R. Placeholders:
     {player} {opp} {playerRank} {oppRank} {oppRankOrd} {playerRankOrd}
     {tier} {round} {bestOf} {venue}
     {h2hWins} {h2hLosses}
*/

/* ── 1 · OPENERS (Barry sets the scene) ─────────────────────────────────────── */
var OPENERS = [
  "Right. {round} here at {venue}, and we've got {player} — ranked {oppRankOrdPlayer} — against {opp}, number {oppRank} in the world.",
  "Welcome back to {venue}. {round} of the {tier}, best of {bestOf}. {player} and {opp} on the lanes any moment now.",
  "Good afternoon. We're at {venue} for the {tier}, {round}. {player} drawn against {opp} — {oppRankOrd} in the world.",
  "Here we are, {round} at {venue}. {player} on one side, {opp} on the other. Lovely day for it.",
  "{round}, {venue}. {player} against {opp}. Best of {bestOf}. Shall we?",
  "Evening all. {venue} tonight, {round}, {player} versus {opp}. The lanes are warm."
];

/* ── 2 · RANK GAP (Reggie weighs the mismatch) ──────────────────────────────── */
/* These are picked by |playerRank - oppRank| direction */
var GAP_FAR_UNDERDOG = [ /* player's rank far HIGHER number than opp (player is weaker) */
  "{playerRankOrd} against {oppRankOrd}? Barry, that's a mountain. {player} doesn't climb mountains, she knits them.",
  "Barry, there's {gap} places between them. {player} is here on the lift up, nothing more.",
  "The bookies have {opp} at a drop of a hat. {player}'s meant to be the warm-up act."
];
var GAP_SLIGHT_UNDERDOG = [ /* player ranked lower by a bit */
  "Close enough on paper, Barry. {player} a touch behind, but on grass that's nothing.",
  "{gap} places between them. In my day that'd be the difference between a cup of tea and a strong one. Nowadays? Nothing."
];
var GAP_EVEN = [
  "Nothing between them, Barry. Any flinch and it's over.",
  "Even on the dot. Rank {playerRank} and rank {oppRank}, that's a coin flip."
];
var GAP_SLIGHT_FAVOURITE = [ /* player ranked higher by a bit */
  "{player} the favourite, but only just. {opp} is a stubborn one on grass.",
  "On paper {player} wins this, Barry. Then again, paper doesn't ride roosters."
];
var GAP_FAR_FAVOURITE = [ /* player's rank far better */
  "{opp} shouldn't be on this card, Barry. {gap} places below. We'll see if she brought a chair.",
  "Barry, if {player} loses this one I'll eat my moustache.",
  "An upset here would be the knit of the week. {opp} is {gap} rungs below, pure and simple."
];

/* ── 3 · CONDITION (Barry reads the ground) ─────────────────────────────────── */
var COND_CLASSIC = [
  "Classic lanes today. No surprises from the ground, Barry.",
  "A fair ground. If someone wins it, she earned it."
];
var COND_MUD = [
  "Mud today. Points are low and gear counts for more.",
  "Mud on the lanes. The underdog's weather, if there is one."
];
var COND_WIND = [
  "A proper breeze on the course. Precision gets the cold shoulder today.",
  "Wind rising, Barry. Even the roosters are leaning."
];
var COND_HEAT = [
  "Heat. The lances feel heavier, the bar runs hotter.",
  "A warm one. Someone's cardigan is coming off before the second set."
];
var COND_GREEN = [
  "Village green today. Bigger gold zone, smaller purse — a treat for the underdog.",
  "Soft grass. Stats matter half as much, and the underdog thanks the village council."
];

/* ── 4 · HEAD-TO-HEAD (Reggie remembers) ────────────────────────────────────── */
var H2H_FIRST = [
  "First meeting between them, Barry. Nothing to go on but their ranks and their nerve.",
  "They haven't met. We're writing the first page of this one."
];
var H2H_LEAD_PLAYER = [ /* player has h2hWins > h2hLosses */
  "{player} leads the series {h2hWins} to {h2hLosses}. {opp} hasn't forgotten.",
  "{playerLead} to {h2hLosses} in {player}'s favour. The last one went to a decider."
];
var H2H_LEAD_OPP = [ /* opp leads */
  "{opp} has the better of this one — {h2hWins} to {h2hLosses} the wrong way for {player}.",
  "{player} has not beaten {opp} yet. Not once. {h2hWins} to {h2hLosses}."
];
var H2H_LEVEL = [
  "Level in their meetings, Barry. {h2hWins} apiece. A grudge if ever I saw one.",
  "Shared history. {h2hWins} and {h2hWins}. The next one tips it."
];

/* ── 5 · CLOSERS ────────────────────────────────────────────────────────────── */
var CLOSERS = [
  { s: "barry",  t: "Right, then. Over to the lanes." },
  { s: "barry",  t: "No more from the booth. The chickens are warm." },
  { s: "reggie", t: "To the lanes, Barry. About time." },
  { s: "barry",  t: "And we'll see you after. Good luck to both of them." },
  { s: "reggie", t: "If they fall asleep I'm leaving." },
  { s: "barry",  t: "Let's see what they've got." }
];

/* ── Fill placeholders ─────────────────────────────────────────────────────── */
function fill(text, ctx) {
  return text
    .replace(/{playerRankOrdPlayer}/g, ord(ctx.playerRank || 999))
    .replace(/{oppRankOrdPlayer}/g, ord(ctx.playerRank || 999))
    .replace(/{playerRankOrd}/g, ord(ctx.playerRank || 999))
    .replace(/{oppRankOrd}/g, ord(ctx.oppRank || 999))
    .replace(/{playerRank}/g, String(ctx.playerRank || "?"))
    .replace(/{oppRank}/g, String(ctx.oppRank || "?"))
    .replace(/{player}/g, ctx.playerName || "the player")
    .replace(/{opp}/g, ctx.oppName || "the challenger")
    .replace(/{venue}/g, ctx.venue || "the ground")
    .replace(/{tier}/g, ctx.tierName || "tournament")
    .replace(/{round}/g, ctx.roundLabel || "Match")
    .replace(/{bestOf}/g, String(ctx.bestOf || 3))
    .replace(/{gap}/g, String(Math.abs((ctx.playerRank || 0) - (ctx.oppRank || 0))))
    .replace(/{h2hWins}/g, String(ctx.h2hWins || 0))
    .replace(/{h2hLosses}/g, String(ctx.h2hLosses || 0))
    .replace(/{playerLead}/g, String(Math.max(ctx.h2hWins || 0, ctx.h2hLosses || 0)));
}

/* ── Pick a rank-gap bucket from the actual rank difference ─────────────────── */
function rankGapBucket(ctx) {
  var p = ctx.playerRank || 500, o = ctx.oppRank || 500, d = p - o;
  /* positive d = player ranked LOWER (worse) than opp */
  if (d > 80) return GAP_FAR_UNDERDOG;
  if (d > 20) return GAP_SLIGHT_UNDERDOG;
  if (d > -20) return GAP_EVEN;
  if (d > -80) return GAP_SLIGHT_FAVOURITE;
  return GAP_FAR_FAVOURITE;
}

function condBucket(cond) {
  if (cond === "mud") return COND_MUD;
  if (cond === "wind") return COND_WIND;
  if (cond === "heat") return COND_HEAT;
  if (cond === "green") return COND_GREEN;
  return COND_CLASSIC;
}

function h2hBucket(ctx) {
  if (ctx.firstMeeting || (!ctx.h2hWins && !ctx.h2hLosses)) return H2H_FIRST;
  if ((ctx.h2hWins || 0) > (ctx.h2hLosses || 0)) return H2H_LEAD_PLAYER;
  if ((ctx.h2hWins || 0) < (ctx.h2hLosses || 0)) return H2H_LEAD_OPP;
  return H2H_LEVEL;
}

/* ── Main: build the segment ────────────────────────────────────────────────── */
export function buildPreMatch(ctx) {
  ctx = ctx || {};
  var seed = (ctx.playerRank || 1) * 10007 + (ctx.oppRank || 1) * 97 + (ctx.tierIdx || 0) * 13 + (ctx.round || 0);
  var rnd = rng(seed);

  var openerText = fill(pick(OPENERS, rnd), ctx);
  var gapText = fill(pick(rankGapBucket(ctx), rnd), ctx);
  var condText = fill(pick(condBucket(ctx.cond), rnd), ctx);
  var h2hText = fill(pick(h2hBucket(ctx), rnd), ctx);
  var closer = pick(CLOSERS, rnd);

  var lines = [
    { speaker: "barry",  text: openerText },
    { speaker: "reggie", text: gapText },
    { speaker: "barry",  text: condText },
    { speaker: "reggie", text: h2hText },
    { speaker: closer.s, text: fill(closer.t, ctx) }
  ];

  var acc = 0;
  lines.forEach(function (l) { l.durMs = estimateMs(l.text); l.startMs = acc; acc += l.durMs; });
  return { lines: lines, totalMs: acc };
}
