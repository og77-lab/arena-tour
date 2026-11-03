/* ═══ Engine / Commentary ═══ The booth's dialogue, built from the REAL match data.
   The emphasis is tactical: strengths, weaknesses, how the condition tilts the matchup, who has the edge and why.
   Career nods, head-to-head and age are flavour, picked only when they add colour on top of the analysis.

   STAGE 1 — the architecture: analyseMatchup() reads each rider's training levels (r/p/f/s/g), talent,
   fitness, gear fx and the day's condition weights (w = { r: 2, p: 2, s: 2, …}) and returns a structured read.
   buildPreMatch(ctx) picks one line from each of ~10 buckets, filling placeholders from the analysis. An
   anti-repeat memory in localStorage keeps the last 20 lines out of rotation so a tournament of five matches
   never says the same thing twice.
*/

/* Stat labels, matching models/constants.js. Reflexes = slower bar; Steady Stride = bigger gold;
   Aim = extra points on every strike; Stamina = less speed-up; Stubbornness = softer misses. */
/* ── Studio on/off: default ON, remembered in localStorage. Settings panel toggles it; ?studio=0 or ?studio=1
   remain as URL-param overrides from the opt-in days. */
export function isStudioOn() {
  try {
    if (typeof location !== "undefined" && location.search) {
      if (location.search.indexOf("studio=0") !== -1) { localStorage.setItem("studioOn", "0"); return false; }
      if (location.search.indexOf("studio=1") !== -1) { localStorage.setItem("studioOn", "1"); return true; }
    }
    var v = localStorage.getItem("studioOn");
    return v !== "0";
  } catch (e) { return true; }
}
export function setStudioOn(on) { try { localStorage.setItem("studioOn", on ? "1" : "0"); } catch (e) {} }

var STAT_INFO = {
  r: { label: "Reflexes",      what: "slows the bar",         condName: "mud"  },
  p: { label: "Steady Stride", what: "widens the gold zone",  condName: "wind" },
  f: { label: "Aim",           what: "adds points per strike" },
  s: { label: "Stamina",       what: "slows the speed-up",    condName: "heat" },
  g: { label: "Stubbornness",  what: "softens misses"         }
};
var STAT_KEYS = ["r", "p", "f", "s", "g"];
var MEM_KEY = "studioLineMem";
var MEM_SIZE = 20;

/* ── RNG & utils ───────────────────────────────────────────────────────────── */
function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function ord(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function estimateMs(text) { var w = text.split(/\s+/).filter(Boolean).length; return Math.max(1500, Math.round(w * 320) + 500); }

/* Read & write the anti-repeat memory. ids like "opener:3" or "strength:7" — bucket+index. */
function memGet() { try { return JSON.parse(localStorage.getItem(MEM_KEY) || "[]"); } catch (e) { return []; } }
function memPush(id) { try { var m = memGet(); m.unshift(id); localStorage.setItem(MEM_KEY, JSON.stringify(m.slice(0, MEM_SIZE))); } catch (e) {} }
/* Pick an entry from a bucket that isn't in recent memory. Falls back to any if all are used. */
function pickFresh(bucket, bucketName, rnd) {
  var mem = memGet(), tried = {};
  for (var tries = 0; tries < bucket.length * 2; tries++) {
    var i = Math.floor(rnd() * bucket.length);
    if (tried[i]) continue; tried[i] = 1;
    if (mem.indexOf(bucketName + ":" + i) === -1) { memPush(bucketName + ":" + i); return bucket[i]; }
  }
  var fi = Math.floor(rnd() * bucket.length);
  memPush(bucketName + ":" + fi);
  return bucket[fi];
}

/* ── 1 · Analyse a rider ───────────────────────────────────────────────────── */
/* Takes training levels, talent and the condition's weight map. Returns the single top stat and bottom stat,
   each with its level and label; a "condition favour" number saying how much this condition rewards her kit. */
function analyseRider(tr, talent, condW) {
  tr = tr || {};
  var ranked = STAT_KEYS.map(function (k) { return { k: k, v: tr[k] || 0 }; }).sort(function (a, b) { return b.v - a.v; });
  var best = ranked[0], worst = ranked[ranked.length - 1];
  /* Condition favour: sum of (level × weight) over all stats; higher = this day's lanes play to her kit */
  var fav = 0; STAT_KEYS.forEach(function (k) { fav += (tr[k] || 0) * ((condW && condW[k]) || 1); });
  return { best: best, worst: worst, talent: talent || 50, favour: Math.round(fav * 10) / 10, levels: tr };
}

/* ── 2 · Analyse the matchup ───────────────────────────────────────────────── */
/* ctx shape expected:
   { playerName, oppName, playerRank, oppRank,
     playerTr, oppTr, playerTalent, oppTalent,
     playerFit, oppFit, playerAge, oppAge,
     condKey, condW, condName,  (condW is from events.CONDITIONS[cond].w)
     tierName, tierIdx, roundLabel, bestOf, venue,
     h2hWins, h2hLosses, firstMeeting,
     oppCareer, playerCareer   (each: { peakRank, titles, gsTitles, finals })
   }
*/
export function analyseMatchup(ctx) {
  var p = analyseRider(ctx.playerTr, ctx.playerTalent, ctx.condW);
  var o = analyseRider(ctx.oppTr, ctx.oppTalent, ctx.condW);
  /* Who the condition favours more */
  var condFavoursPlayer = p.favour > o.favour + 2, condFavoursOpp = o.favour > p.favour + 2;
  /* Rank gap, player minus opp. Positive = player is weaker. */
  var rankGap = (ctx.playerRank || 500) - (ctx.oppRank || 500);
  /* Fitness read: a rider is "tired" if either meter below 60 */
  function fitRead(f) { if (!f) return "fresh"; var low = Math.min(f.g || 100, f.r || 100); return low < 45 ? "ragged" : low < 60 ? "tired" : low < 80 ? "serviceable" : "fresh"; }
  var pFit = fitRead(ctx.playerFit), oFit = fitRead(ctx.oppFit);
  /* The real tactical edge: who's got the leaning stat on the lanes */
  var edgeNote = null;
  if (ctx.condKey && ctx.condKey !== "classic" && ctx.condW) {
    var doubled = Object.keys(ctx.condW).filter(function (k) { return ctx.condW[k] >= 2; })[0];
    if (doubled) {
      var pL = (ctx.playerTr || {})[doubled] || 0, oL = (ctx.oppTr || {})[doubled] || 0;
      if (pL - oL >= 3) edgeNote = { who: "player", stat: doubled, diff: pL - oL };
      else if (oL - pL >= 3) edgeNote = { who: "opp", stat: doubled, diff: oL - pL };
    }
  }
  return {
    player: p, opp: o,
    rankGap: rankGap,
    condFavoursPlayer: condFavoursPlayer,
    condFavoursOpp: condFavoursOpp,
    pFit: pFit, oFit: oFit,
    edgeNote: edgeNote
  };
}

/* ── 3 · Line banks (tactical first, flavour second) ───────────────────────── */
/* Each line is a text template referencing the ctx and analysis fields. Keep lines short — ~2 sentences max. */

/* OPENER — one line sets the scene (Barry) */
var OPENERS = [
  "Right. {round} here at {venue}. {player} drawn against {opp} — number {oppRank} in the world.",
  "Welcome back to {venue}, {round} of the {tier}. Best of {bestOf}, {player} and {opp}.",
  "Here we are, {round}, {venue}. {player}, {playerRankOrd}, versus {opp}, {oppRankOrd}.",
  "{round}, {venue}. {player} against {opp}. Lanes look fast.",
  "Good evening from {venue}. {round}, {player} and {opp} on the warm-up.",
  "Afternoon all. {round} of the {tier} at {venue}. {player} and {opp} up next.",
  "The lanes are chalked, Barry. {round}, {venue}, {player} against {opp}.",
  "You're very welcome back. {round}, {venue}. {player} versus {opp}, {oppRankOrd} in the world.",
  "Hello from {venue}, where the {round} brings us {player} and {opp}. Best of {bestOf}.",
  "The grannies are warming up, Barry. {round} at {venue}. {player} and {opp}.",
  "Full house at {venue}. {round} of the {tier}, {player} and {opp}, lances up any minute.",
  "The roosters are out, Barry. {round}, {venue}, {player} against the number {oppRank}.",
  "From {venue}, this is the {round}. {player}, {playerRankOrd}, drawn against {opp}, {oppRankOrd}.",
  "Good to see you back with us at {venue}. {round}, {player} v {opp}, best of {bestOf}.",
  "The sun's up at {venue}, Barry, and so are the grannies. {round}: {player} and {opp}.",
  "A warm hello from the booth at {venue}. {round}, {player} drawn against {opp}, {oppRankOrd} in the world.",
  "The crowd is in, the roosters are fed. {round} at {venue} — {player} v {opp}.",
  "Settle in, Barry. {round}, {venue}, {player} and {opp} about to be announced.",
  "Here we go. {round} of the {tier}, {venue}. {player} versus {opp}.",
  "The umpire's at the line, the grannies are mounted. {round}, {venue}: {player} and {opp}."
];

/* STRENGTH FOCUS — Reggie zeroes in on one of the player's or opponent's top stats */
var STRENGTHS_OPP = [
  "The thing with {opp}, Barry, is her {oppBestLabel} — level {oppBestLv}. On this bar that's a monster.",
  "{opp}'s got {oppBestLabel} at {oppBestLv}, Barry. It {oppBestWhat}. {player} will feel that.",
  "Watch {opp}'s {oppBestLabel}. Level {oppBestLv} — that's not a stat, that's a weapon.",
  "{oppBestLabel} level {oppBestLv} on {opp}. Few riders on tour {oppBestWhat} like she does.",
  "{opp} built this kit around her {oppBestLabel}, Barry — level {oppBestLv}. It {oppBestWhat}. {player} knows what's coming.",
  "{opp}'s {oppBestLabel}, Barry — level {oppBestLv}. On a good day she's untouchable there.",
  "{oppBestLv} in {oppBestLabel}. That's elite, Barry. {player} has to find a way around it.",
  "What makes {opp} dangerous? {oppBestLabel} level {oppBestLv}. It {oppBestWhat}, and she knows it.",
  "{opp}'s weapon is {oppBestLabel}, Barry. {oppBestLv} levels of it. That's the match on the line.",
  "Reggie, if you had one stat to be scared of on {opp}, it's {oppBestLabel} at {oppBestLv}.",
  "The {oppBestLabel} on {opp} — level {oppBestLv} — is why she's {oppRankOrd}, Barry.",
  "Everyone on tour knows {opp}'s {oppBestLabel}, Barry. Level {oppBestLv} and it {oppBestWhat}.",
  "{opp}'s calling card: {oppBestLabel}. Level {oppBestLv}. {player} will have seen the tape.",
  "If I had to bet one stat for {opp}, Barry, it's {oppBestLabel} at {oppBestLv}. Match-winning on its day.",
  "You can't talk about {opp} without the {oppBestLabel} — level {oppBestLv}. The signature.",
  "{opp}'s whole career is built on {oppBestLabel}. Level {oppBestLv}, Barry. Hard to argue with.",
  "The scouts' first page on {opp} says {oppBestLabel} level {oppBestLv}. Everything after is detail.",
  "If {player} underestimates {opp}'s {oppBestLabel}, Barry, she'll pay the price. Level {oppBestLv}.",
  "Three words to describe {opp}: {oppBestLabel}. Level {oppBestLv}. That's it.",
  "{oppBestLabel} at {oppBestLv} on {opp} — that stat has decided more matches than I can count."
];
var STRENGTHS_PLAYER = [
  "{player} brings her {playerBestLabel} to this one, Barry. Level {playerBestLv}. That {playerBestWhat}.",
  "If {player} wins this, it's on her {playerBestLabel}. Level {playerBestLv}, Barry. Not an accident.",
  "The {playerBestLabel} is where {player} lives — level {playerBestLv}.",
  "{player}'s got {playerBestLabel} at {playerBestLv}, Barry. That'll be the engine today.",
  "You can see where {player} spent her training points: {playerBestLabel}, level {playerBestLv}.",
  "{playerBestLabel} level {playerBestLv} on {player}. She'll ride that stat all day.",
  "{player}'s strength is in her {playerBestLabel}, Barry. {playerBestLv} is top-shelf.",
  "The thing about {player}'s kit — {playerBestLabel} level {playerBestLv}. That's where she lives.",
  "{player}'s {playerBestLabel} is match-winning, Barry. Level {playerBestLv}.",
  "Everything flows from {player}'s {playerBestLabel}, Reggie — level {playerBestLv}. It {playerBestWhat}.",
  "If you back {player}, Barry, you back her {playerBestLabel}. Level {playerBestLv} says why.",
  "The {playerBestLabel} is {player}'s weapon of choice, Barry — level {playerBestLv}.",
  "Watch {player}'s {playerBestLabel} today, Reggie. Level {playerBestLv} is where she makes her money.",
  "{player}'s kit is a {playerBestLabel} kit, Barry — level {playerBestLv}. Her coach knew what she was doing.",
  "On form, {player}'s {playerBestLabel} will carry her — {playerBestLv} levels and she rides it hard.",
  "The {playerBestLabel} on {player} — level {playerBestLv} — tells you everything about her game.",
  "{player}'s {playerBestLabel} is her engine, Barry. {playerBestLv} is a good season of training.",
  "You know what wins {player} matches? {playerBestLabel}, level {playerBestLv}. Keep it simple.",
  "{player}'s been building her {playerBestLabel} for years, Reggie. Level {playerBestLv}. Pays off today.",
  "If {player}'s {playerBestLabel} fires, Barry, this match is over. Level {playerBestLv}."
];

/* WEAKNESS FOCUS — one of them has a glaring hole */
var WEAKNESS_OPP = [
  "But {opp}'s {oppWorstLabel}, Barry — level {oppWorstLv}. That's a door. If {player} finds it, she walks in.",
  "{opp}'s weak spot: {oppWorstLabel}, level {oppWorstLv}. It {oppWorstWhat} — barely at all, in her case.",
  "Mind {opp}'s {oppWorstLabel} though. Level {oppWorstLv} — that's thin ice.",
  "The hole in {opp}'s kit: {oppWorstLabel} at {oppWorstLv}. Every top rider has a weakness and that's hers.",
  "If I'm {player}, Barry, I'm aiming at {opp}'s {oppWorstLabel}. Level {oppWorstLv} is embarrassing.",
  "{opp} skipped training on {oppWorstLabel}, by the look of it — level {oppWorstLv}. {player} should notice.",
  "There's one soft spot on {opp}: {oppWorstLabel} level {oppWorstLv}. It won't carry her through a long match.",
  "The crack in {opp}'s armour, Barry: {oppWorstLabel}, level {oppWorstLv}. Keep hitting it.",
  "{opp}'s nowhere on {oppWorstLabel} — level {oppWorstLv}. {player} should be licking her lips.",
  "If there's a chink, it's {opp}'s {oppWorstLabel} — level {oppWorstLv}. Make her defend it.",
  "{opp}'s {oppWorstLabel} is a liability, Barry. {oppWorstLv} is sub-tour level.",
  "The scouts flag {opp}'s {oppWorstLabel} on every page, Reggie. Level {oppWorstLv}.",
  "You beat {opp} by hitting her {oppWorstLabel}, Barry. Level {oppWorstLv} and nowhere to hide.",
  "{opp} has been meaning to train {oppWorstLabel} for three seasons. Level {oppWorstLv}. Still waiting.",
  "A top-{oppRank} rider with {oppWorstLabel} at {oppWorstLv}? Someone should have a word with her coach.",
  "{player}'s route to victory, Barry: {opp}'s {oppWorstLabel}. Level {oppWorstLv} tells the story."
];
var WEAKNESS_PLAYER = [
  "{player}'s got a crack: {playerWorstLabel} at level {playerWorstLv}. {opp} will test it.",
  "Keep an eye on {player}'s {playerWorstLabel}. Level {playerWorstLv} is not where a top-{playerRank} should be.",
  "{player}'s been dodging {playerWorstLabel} in training, Barry. Level {playerWorstLv}. {opp} will find it.",
  "The weakness in {player}'s kit: {playerWorstLabel}, level {playerWorstLv}. Not where you want to be exposed.",
  "{player}'s {playerWorstLabel} is thin, Barry. {playerWorstLv} levels. {opp} ought to lean on it.",
  "If {player} loses this, it'll be on {playerWorstLabel}, Barry — level {playerWorstLv}.",
  "{opp} will target {player}'s {playerWorstLabel}, Reggie. Level {playerWorstLv} is the opening.",
  "There's one soft spot on {player}: {playerWorstLabel}, level {playerWorstLv}. {opp} will know.",
  "{player}'s {playerWorstLabel} is behind the curve, Barry — level {playerWorstLv}. Match-losing on a bad day.",
  "The hole {opp} is looking at, Barry: {player}'s {playerWorstLabel}. {playerWorstLv} levels.",
  "{player} has not trained {playerWorstLabel}. Level {playerWorstLv}. {opp} will punish it.",
  "If {player}'s {playerWorstLabel} gets exposed today, Barry — and it will — it's a long afternoon.",
  "{player}'s {playerWorstLabel} is a known weakness, Reggie — level {playerWorstLv}. {opp} came prepared.",
  "The scouts have {player}'s {playerWorstLabel} underlined, Barry. Level {playerWorstLv}.",
  "{player} relies on {playerBestLabel} to hide her {playerWorstLabel}. Level {playerWorstLv}. {opp} will try to drag it out."
];

/* CONDITION TILT — who does the ground reward */
var COND_TILT_PLAYER = [
  "And it's a {condName} day. That rewards {playerBestLabel}, Barry, and look who's got it: {player} at level {playerBestLv}.",
  "The {condName} will do half the work for {player}. Her kit is built for this.",
  "{opp} picked a bad week for {condName}, Barry. {player}'s stats line up like a prayer.",
  "{condName} on the lanes — a gift to {player}'s {playerBestLabel}. The ground doubles its weight.",
  "{player} ordered this weather, by the look of it. {condName} is her kit, head to toe.",
  "The {condName} tilts the match {player}'s way. Her {playerBestLabel} just got doubled.",
  "{player} on a {condName} day, Barry — that's a woman in her element.",
  "You'd think {player} chose the ground. {condName} rewards exactly her kit.",
  "The {condName} is {player}'s weather. Her {playerBestLabel} runs the lanes today.",
  "{opp} rode in to find {condName} waiting. {player}'s stats sing in these conditions.",
  "A {condName} day for {player}, Barry — the ground is her second lance.",
  "{player}'s {playerBestLabel} gets a double portion today. {condName}'s on her side.",
  "The schedule did {player} a favour, Barry. {condName} suits her like a glove.",
  "{opp} has to beat the ground before she beats {player}. {condName} is not her friend.",
  "{player} loves {condName}, Barry. The stats line up. The gold grows for her.",
  "The umpire didn't need to look at the kits — {condName} already tells us {player}'s got the edge.",
  "{player}'s rooster, {player}'s lance, and now {condName}'s rewarding her {playerBestLabel}. A perfect storm.",
  "{opp} would have preferred a classic day, Barry. {condName} rewards everything {player} brings.",
  "{player} wakes up to {condName} and smiles. Her kit was built for this.",
  "On {condName}, {player}'s {playerBestLabel} is a two-for-one. {opp} is on the back foot."
];
var COND_TILT_OPP = [
  "The {condName} suits {opp}, Barry. Her stat line matches the day — {oppBestLabel} level {oppBestLv} and it counts double.",
  "{player} has to fight the ground AND the woman today. {condName} is {opp}'s weather.",
  "This {condName} is on {opp}'s side. {player} needed anything but this.",
  "The {condName} just handed {opp} a dividend, Barry. Her {oppBestLabel} gets paid twice.",
  "{opp} prayed for {condName}, Barry. She got it. {player} will suffer for it.",
  "{condName} on the lanes — bad news for {player}. {opp}'s stats were built for exactly this.",
  "{opp} on {condName} is like {opp} with extra batteries. {player} will have to be clever.",
  "The ground is on {opp}'s side today, Barry. {condName} doubles her {oppBestLabel}.",
  "{player} would have preferred classic lanes, Reggie. {condName} is {opp}'s weather.",
  "{opp}'s kit was built for {condName}. {player} will have to out-ride the ground as well.",
  "A rough draw for {player}, Barry — {condName} suits {opp} and nothing else.",
  "The {condName} is a bonus for {opp}, Barry. {player} is up against two opponents.",
  "{opp}'s stats bloom in {condName}. {player} will have to accept half the gold.",
  "{player} drew the short stick with the weather, Barry. {condName} is {opp}'s best friend.",
  "A {condName} day for {opp}, Reggie — her {oppBestLabel} rules the lanes.",
  "{opp}'s on home turf today, Barry — not literally, but {condName} may as well be her living room.",
  "The ground is tilted against {player}, Reggie. {condName} rewards {opp}'s {oppBestLabel} every strike.",
  "{opp} came in with a smile. {condName} will do that to you when you've got {oppBestLabel} level {oppBestLv}.",
  "{player}'s task doubles today, Barry. Beat {opp} AND beat the {condName}.",
  "{opp}'s {oppBestLabel} on {condName} is a hard thing to stop, Barry. {player} knows it."
];
var COND_TILT_EVEN = [
  "{condName} day — rewards no one in particular. A fair fight, then.",
  "The {condName}'s a wash, Barry. Both riders built the same for it.",
  "On the lanes today: {condName}. Doesn't tip the hat either way.",
  "Neither of them has the stat the {condName} rewards. A pure jousting match, then.",
  "The ground stays out of it today. {condName} doesn't help either side.",
  "{condName}, Barry — but their kits don't lean on it. May the better hands win.",
  "The {condName} is neutral between these two. Hands, nerve, and nothing else.",
  "{condName} on the lanes, but neither of them wired for it. Even start.",
  "The ground abstains, Barry. {condName} rewards a stat neither of them prioritised.",
  "{condName} today — but these two are built for every weather. It'll come down to the hands.",
  "A {condName} day, Reggie, but neither {player} nor {opp} will care much. Equal footing.",
  "The {condName} is window dressing today, Barry. Both kits leave it on the shelf."
];
var COND_CLASSIC_LINES = [
  "Classic lanes, Barry. No weather tricks. If someone wins it, she earned it.",
  "Nothing from the ground today. Just the stats and the hands.",
  "Classic conditions — a pure test, Barry. No ground to blame if it goes wrong.",
  "Dry lanes, no gusts, no mud. Honest jousting weather.",
  "No excuses from the lanes today. Classic conditions reward whoever rides best.",
  "Classic lanes, Reggie — a jouster's weather. No tricks.",
  "The ground is honest today, Barry. Classic conditions, no favours.",
  "A clean sheet from the weather, Barry. Classic lanes. Pure jousting.",
  "No wind, no mud, no sun. Classic conditions. The stats say what they say.",
  "Dry, mild, honest — classic conditions. Nobody's hiding behind the ground today.",
  "The lanes won't help anyone, Reggie. Classic jousting weather.",
  "A proper classic day, Barry. Lanes clean, stats as advertised."
];

/* MATCHUP EDGE — the sharp tactical read when one rider's lead on the key stat is clear */
var EDGE_PLAYER = [
  "The number to watch: {edgeStat}. {player} has it {edgeDiff} levels above {opp}. On these lanes, that's the match.",
  "Look at {edgeStat}, Barry. {player} is {edgeDiff} levels up — and the condition doubles its weight. Game over on paper.",
  "{player} wins this on {edgeStat} alone, Barry. {edgeDiff} levels of edge, doubled by the ground.",
  "The single number that matters today: {edgeStat}. {player} is {edgeDiff} ahead. Match over before it starts.",
  "If {player} loses this, Barry, write me out of the booth. {edgeStat} is {edgeDiff} levels in her favour and doubled.",
  "{player}'s {edgeStat} lead is {edgeDiff} levels, Barry. On a {condName} day that's not a lead, that's a chasm.",
  "There's your match-winner, Barry: {edgeStat}. {player} by {edgeDiff}, and the lanes make it count twice.",
  "The {edgeStat} gap is {edgeDiff} in {player}'s favour, Reggie. The {condName} day decides this one before the bar runs.",
  "{player} has {edgeStat} by {edgeDiff} and {condName} rewards it. The scoreboard is drawn before the first strike.",
  "If you want the one stat that wins this, Barry — {edgeStat}. {player} is {edgeDiff} up and the ground pays double.",
  "{edgeDiff} levels of {edgeStat} in {player}'s pocket, Barry. {condName} doubles the yield.",
  "The lanes and the kit are both on {player}'s side today. {edgeStat} by {edgeDiff}. {opp} is cooked.",
  "A {edgeDiff}-level advantage in {edgeStat} on a {condName} day, Reggie — that's the match done.",
  "I've seen smaller edges win titles, Barry. {player}'s {edgeStat} is {edgeDiff} up and doubled."
];
var EDGE_OPP = [
  "{opp}'s got the edge where it matters: {edgeStat}, {edgeDiff} levels above {player}. And doubled today.",
  "{edgeStat} is {opp}'s. {edgeDiff} levels, counted twice. {player} will have to be clever.",
  "The edge is {opp}'s, Barry — {edgeStat} is {edgeDiff} above {player}, and the {condName} doubles it. {player} needs an upset in the hands.",
  "Watch {edgeStat}, Barry. {opp} is {edgeDiff} up and the ground pays twice. {player} is on the back foot before the bar runs.",
  "{opp}'s {edgeStat} dominance is {edgeDiff} levels. On {condName}, that's the whole match.",
  "The one stat that matters today: {edgeStat}, {opp} by {edgeDiff}. The {condName} doesn't help {player}.",
  "A {edgeDiff}-level {edgeStat} edge for {opp}, Barry. On a {condName} day that's a mountain.",
  "{opp} has {edgeStat} by {edgeDiff}. {player} has to be perfect in the hands to overcome it.",
  "The ground and the stats both back {opp}, Barry. {edgeStat} edge of {edgeDiff}. {player}'s task is steep.",
  "{edgeDiff} in {edgeStat} is {opp}'s cushion today, Reggie — and {condName} tells you it counts double.",
  "{opp}'s advantage is where the ground pays: {edgeStat}. {edgeDiff} up and doubled.",
  "You can see the scoreboard already, Barry — {opp}'s {edgeStat} edge of {edgeDiff} on a {condName} day.",
  "{player} needs a miracle in the hands today, Barry. {opp} has {edgeStat} by {edgeDiff}, doubled.",
  "The whole analysis today is one number: {edgeStat}, {opp} by {edgeDiff}. {condName} seals it."
];

/* FITNESS NOTE — only if someone is ragged or tired */
var FITNESS_OPP_TIRED = [
  "{opp}'s legs went last week, Barry. She's riding in {oFit} shape today.",
  "The scouts have {opp} at {oFit} — a Masters final two days ago and it shows.",
  "{opp}'s fitness is {oFit}. {player} should press the gas.",
  "{opp} is {oFit}, Barry — a long week's catching her up. {player} picks her moment.",
  "She's not fresh, {opp}. {oFit} on the meter. {player} to extend the sets, if she's clever.",
  "Watch {opp}'s legs late, Barry — {oFit} fitness coming in. The bar runs away from tired grannies."
];
var FITNESS_PLAYER_TIRED = [
  "{player} comes in {pFit}, Barry. Not what she needed facing {opp}.",
  "The grannies' meter has {player} at {pFit}. {opp} will know, and she will push.",
  "{player}'s {pFit} — the week has caught her. She needs to end this quick.",
  "{pFit} on the fitness, Barry. {player} will feel the third set.",
  "{player} is riding tired, {pFit}. {opp} should make her chase the bar."
];

/* RANK GAP (short, for underdog energy — only when ranks diverge sharply) */
var RANK_UPSET_WATCH = [
  "{gap} places between them, Barry. On paper it's not a match. Then again, we don't play on paper.",
  "An upset here would make the Monday paper. {opp} is {gap} rungs below.",
  "{opp} shouldn't be close. If she is, that's the story of the day."
];
var RANK_CLASS_GAP = [ /* when player is far favourite */
  "{player} doesn't lose this one, Barry. Not with {gap} places between them.",
  "{opp} is here to make up the numbers. The gap is {gap} places."
];

/* FLAVOUR: career nod (Reggie) */
var CAREER_OPP_TITLED = [
  "Mind, {opp} isn't just any granny. {oppTitles} tour titles in her kit, Barry.",
  "{opp}'s got {oppTitles} titles and {oppGs} Slams behind her. Not a woman to take lightly.",
  "A past world number {oppPeak}, this one. Days gone, but she remembers.",
  "{opp} with {oppTitles} titles already, Barry. That's not an opponent, that's a résumé.",
  "She's done it before, {opp}. {oppGs} Slams in the cabinet. {player} meets history today.",
  "Don't be fooled by the current rank — {opp} peaked at {oppPeak}. The talent's still in there.",
  "{opp}'s got {oppTitles} titles and the scars to go with them. {player} has her hands full."
];
var CAREER_PLAYER_CAMPAIGN = [
  "{player}'s chasing her {playerTitles}-plus-first title today. Shall we see?",
  "A Slam for {player}'s record this would be, Barry. One to add to the lot.",
  "{player}'s already got {playerTitles} titles, Barry. The appetite's clearly intact."
];

/* FLAVOUR: head-to-head (Reggie) */
var H2H_FIRST = [
  "First meeting between them, Barry. Nothing to go on but ranks and nerve.",
  "They haven't crossed lances before. We'll see how they read each other.",
  "Never met, these two. A fresh page, Barry.",
  "Their first time on the same card. {player} and {opp} meet properly today."
];
var H2H_LEAD_PLAYER = [
  "{player} leads this one {h2hWins}-{h2hLosses}. {opp} will have remembered.",
  "History's with {player}: {h2hWins} and {h2hLosses}. The last was a decider.",
  "{player} is up {h2hWins} to {h2hLosses} on {opp}. The ghost of past matches is in the saddle.",
  "{opp}'s pattern against {player}: lose. {h2hWins} to {h2hLosses} in {player}'s favour."
];
var H2H_LEAD_OPP = [
  "{opp} owns this fixture, Barry — {h2hWins}-{h2hLosses} the wrong way for {player}.",
  "{player} has not beaten {opp} yet. Not once in {h2hTotal} tries.",
  "{h2hWins} to {h2hLosses} — the wrong way for {player}. {opp} knows how to beat her.",
  "{player} has a Jedi-opponent in {opp}, Barry. The series is {h2hWins}-{h2hLosses} against her."
];
var H2H_LEVEL = [
  "Level in their series, {h2hWins} apiece. The next one tips it. A grudge if ever I saw one.",
  "{h2hWins} and {h2hWins}. One of them walks out with the lead.",
  "Dead even, Barry. {h2hWins} wins each. Today's the decider of the decade.",
  "You can't separate them on the record: {h2hWins} apiece. The crowd is in for a scrap."
];

/* FLAVOUR: form — peak rank vs current rank */
var FORM_OPP_HOT = [
  "{opp}'s climbing fast, Barry. Peaked at {oppPeak}, back near it now at {oppRank}.",
  "{opp} is in form — her peak was {oppPeak}, and she's knocking on the door again.",
  "A hot run from {opp}, Reggie. The world's seen her at {oppPeak} and she's getting there once more."
];
var FORM_OPP_SLUMPING = [
  "{opp} isn't the woman she was, Barry. Peaked at {oppPeak}, sitting {oppRank} now. The years catch everyone.",
  "A long way down for {opp} — from {oppPeak} to {oppRank}. Still dangerous, but not what she was.",
  "The decline is on {opp}, Reggie. Peak rank {oppPeak}, now down at {oppRank}. {player} should press."
];
var FORM_PLAYER_HOT = [
  "{player} is climbing, Barry. Her peak is {playerPeak}, and she's close enough to see it.",
  "{player}'s in form, Reggie. The world has her at {playerRank}, with a peak of {playerPeak}. The direction is clear."
];

/* FLAVOUR: rooster and personal trait */
var ROOSTER_TRAIT = [
  "{opp}'s rooster today is {oppRooster}, Barry. {oppTrait} — fitting, isn't it.",
  "You know {opp}? {oppTrait}. And her rooster {oppRooster} is as odd as she is.",
  "{oppRooster} in the saddle for {opp}. {oppTrait}. The booth loves this pairing.",
  "{opp} on {oppRooster} — a famous pairing, Reggie. {oppTrait}.",
  "Keep an eye on {opp}'s mount, Barry — {oppRooster}. Not a bird to be underestimated."
];
var ROOSTER_PLAIN = [
  "{opp} rides out on {oppRooster} today. A steady bird, from what the stable says.",
  "{oppRooster} is {opp}'s mount, Barry. They've been together a few seasons."
];

/* FLAVOUR: specific gear references (lance + saddle). Keyed by item id. */
var GEAR_LANCE = {
  needle:   ["{opp} on the Knitting-Needle Lance today — small gold bonus but mean on misses.", "The Knitting-Needle on {opp}, Barry. Expensive kit, every strike counts.", "{opp} brought the Knitting-Needle Lance. A statement, Reggie."],
  oak:      ["The Grandpa's Oak Lance on {opp} — durable, heavy, no apologies.", "{opp} rides with the Oak Lance. Old school. Never let her down."],
  bamboo:   ["{opp} on the Featherlight Bamboo — fast swing, generous zone.", "The Bamboo on {opp}, Barry. Fastest lance in the lanes."],
  baguette: ["A Day-Old Baguette on {opp}, Barry. Novelty, or genius?", "{opp} rode in on a Baguette lance. Reggie, that's confidence or madness."],
  broom:    ["{opp} on the basic Broom-Handle. Trust and tradition."]
};
var GEAR_SADDLE = {
  foam:     ["{opp} on the Memory-Foam Cushion — a wider gold, Barry, but the bar starts faster.", "The Memory-Foam Cushion is {opp}'s pick. Comfort has a price."],
  racing:   ["{opp} on the Racing Saddle today — leaning into speed, giving up accuracy.", "The Racing Saddle on {opp}. She wants a fast bar."],
  rocking:  ["{opp} rides a Rocking-Chair Saddle, Reggie. The gold stays wide all match.", "The Rocking-Chair on {opp}. She came for a long one."],
  skates:   ["Roller-Skate Saddle on {opp} — Barry, I never thought I'd say those words.", "{opp} on skates. The crowd is laughing. The bar is terrified."],
  teacosy:  ["Basic Tea-Cosy for {opp}. No tricks, no spend."]
};

/* FLAVOUR: experience / seasons on tour (Reggie or Barry) */
var VETERAN_OPP = [
  "{opp}'s in her {oppSeasonsOrd} season on tour, Barry. She's seen every ground on the calendar.",
  "A veteran, {opp}. {oppSeasons} seasons up. Youth in her kit left years ago.",
  "{oppSeasons} seasons on tour for {opp}. She knows what every bar does before it moves.",
  "The experience is {opp}'s, Barry — {oppSeasons} seasons in the saddle. {player} will have to be sharper."
];
var VETERAN_PLAYER = [
  "{player} has {playerSeasons} seasons on tour behind her now, Barry. That's a working career.",
  "{playerSeasons} seasons in and still going. {player}'s not here by accident."
];
var ROOKIE_OPP = [
  "{opp}'s only in her {oppSeasonsOrd} season on tour. Promise and nerves in equal measure.",
  "Fresh legs, {opp} — only {oppSeasons} season{oppSeasonPlural} up. Experience may bite today."
];
var ROOKIE_PLAYER = [
  "{playerSeasons} season{playerSeasonPlural} on tour for {player}, Barry. Everything to prove.",
  "{player}'s a fresh name, Barry — {oppSeasonsOrd} season in. Hungry eyes."
];

/* FLAVOUR: match stakes (final / Slam / Masters) */
var STAKES_SLAM = [
  "A Slam, Barry. Four of these a year, and {opp} knows what it means.",
  "The {tier}. Hearts rate higher on these courses, Reggie, you know it.",
  "Grand Slam weather. Everything in a career either passes through here or it doesn't."
];
var STAKES_FINAL = [
  "The final, Barry. Nothing bigger than this in the next month.",
  "A title on the line here. Four weeks of training points for the winner, pride for the loser.",
  "The {round} — all week's work in the next hour."
];
var STAKES_MASTERS = [
  "{tier} points up for grabs, Barry. These are the matches careers are measured on.",
  "A Masters round. Rankings move after these."
];
var STAKES_EARLY = [
  "{round}, early days of the tournament. Winners go on, losers go home.",
  "Still the opening rounds, Barry. {player} wants no slips here."
];

/* CLOSER (hand off to the lanes) */
var CLOSERS = [
  { s: "barry",  t: "Right then. Over to the lanes." },
  { s: "barry",  t: "No more from the booth. The chickens are warm." },
  { s: "reggie", t: "To the lanes, Barry. About time." },
  { s: "barry",  t: "Good luck to both of them. Let's see what they bring." },
  { s: "reggie", t: "If they fall asleep I'm leaving." },
  { s: "barry",  t: "Over to the stands. The grannies are mounted." },
  { s: "reggie", t: "Enough chat. Lances up." },
  { s: "barry",  t: "That's enough from us. Lances up and off they go." },
  { s: "reggie", t: "Right, I'm done talking. Ride, you two." },
  { s: "barry",  t: "The crowd is up. Over to the lanes." },
  { s: "reggie", t: "I'll keep the kettle warm. Lances up." },
  { s: "barry",  t: "And we hand you over. May the better granny win." },
  { s: "reggie", t: "Pack it in, Barry. Time to ride." },
  { s: "barry",  t: "The umpire's finger is up. Over to you." },
  { s: "reggie", t: "No more talking. On your mounts, ladies." },
  { s: "barry",  t: "The booth will see you on the other side. Ride." },
  { s: "reggie", t: "Right, I'm thirsty. Lances up." },
  { s: "barry",  t: "The crowd will carry them from here. Over." },
  { s: "reggie", t: "Enough. The ground awaits." },
  { s: "barry",  t: "That's our bit done. The grannies take it from here." }
];

/* ── 4 · Placeholder filler ────────────────────────────────────────────────── */
function fill(text, ctx, a) {
  if (!text) return "";
  return text
    .replace(/{player}/g, ctx.playerName || "the player")
    .replace(/{opp}/g, ctx.oppName || "the challenger")
    .replace(/{playerRankOrd}/g, ord(ctx.playerRank || 999))
    .replace(/{oppRankOrd}/g, ord(ctx.oppRank || 999))
    .replace(/{playerRank}/g, String(ctx.playerRank || "?"))
    .replace(/{oppRank}/g, String(ctx.oppRank || "?"))
    .replace(/{venue}/g, ctx.venue || "the ground")
    .replace(/{tier}/g, ctx.tierName || "tournament")
    .replace(/{round}/g, ctx.roundLabel || "Match")
    .replace(/{bestOf}/g, String(ctx.bestOf || 3))
    .replace(/{condName}/g, ctx.condName || "classic")
    .replace(/{gap}/g, String(Math.abs((ctx.playerRank || 0) - (ctx.oppRank || 0))))
    .replace(/{playerBestLabel}/g, (STAT_INFO[a.player.best.k] || {}).label || "")
    .replace(/{playerBestLv}/g, String(a.player.best.v))
    .replace(/{playerBestWhat}/g, (STAT_INFO[a.player.best.k] || {}).what || "")
    .replace(/{playerWorstLabel}/g, (STAT_INFO[a.player.worst.k] || {}).label || "")
    .replace(/{playerWorstLv}/g, String(a.player.worst.v))
    .replace(/{playerWorstWhat}/g, (STAT_INFO[a.player.worst.k] || {}).what || "")
    .replace(/{oppBestLabel}/g, (STAT_INFO[a.opp.best.k] || {}).label || "")
    .replace(/{oppBestLv}/g, String(a.opp.best.v))
    .replace(/{oppBestWhat}/g, (STAT_INFO[a.opp.best.k] || {}).what || "")
    .replace(/{oppWorstLabel}/g, (STAT_INFO[a.opp.worst.k] || {}).label || "")
    .replace(/{oppWorstLv}/g, String(a.opp.worst.v))
    .replace(/{oppWorstWhat}/g, (STAT_INFO[a.opp.worst.k] || {}).what || "")
    .replace(/{edgeStat}/g, a.edgeNote ? (STAT_INFO[a.edgeNote.stat] || {}).label || "" : "")
    .replace(/{edgeDiff}/g, a.edgeNote ? String(a.edgeNote.diff) : "")
    .replace(/{pFit}/g, a.pFit || "fresh").replace(/{oFit}/g, a.oFit || "fresh")
    .replace(/{h2hWins}/g, String(ctx.h2hWins || 0))
    .replace(/{h2hLosses}/g, String(ctx.h2hLosses || 0))
    .replace(/{h2hTotal}/g, String((ctx.h2hWins || 0) + (ctx.h2hLosses || 0)))
    .replace(/{oppTitles}/g, String((ctx.oppCareer || {}).titles || 0))
    .replace(/{oppGs}/g, String((ctx.oppCareer || {}).gsTitles || 0))
    .replace(/{oppPeak}/g, String((ctx.oppCareer || {}).peakRank || 999))
    .replace(/{playerTitles}/g, String((ctx.playerCareer || {}).titles || 0))
    .replace(/{oppSeasonsOrd}/g, ord(ctx.oppSeasons || 1))
    .replace(/{playerSeasonsOrd}/g, ord(ctx.playerSeasons || 1))
    .replace(/{oppSeasons}/g, String(ctx.oppSeasons || 1))
    .replace(/{playerSeasons}/g, String(ctx.playerSeasons || 1))
    .replace(/{oppSeasonPlural}/g, (ctx.oppSeasons || 1) === 1 ? "" : "s")
    .replace(/{playerSeasonPlural}/g, (ctx.playerSeasons || 1) === 1 ? "" : "s")
    .replace(/{oppRooster}/g, ctx.oppRooster || "her rooster")
    .replace(/{oppTrait}/g, ctx.oppTrait || "")
    .replace(/{playerPeak}/g, String((ctx.playerCareer || {}).peakRank || 999))
    /* Set-score, between-sets and post-match placeholders */
    .replace(/{setsWon}/g, String(ctx.setsWon != null ? ctx.setsWon : "?"))
    .replace(/{setsLost}/g, String(ctx.setsLost != null ? ctx.setsLost : "?"))
    .replace(/{setGapAbs}/g, String(ctx.setGapAbs != null ? ctx.setGapAbs : "?"))
    .replace(/{setWinner}/g, ctx.setWinner || "")
    .replace(/{flawlessSets}/g, String(ctx.flawlessSets != null ? ctx.flawlessSets : "?"))
    .replace(/{perfectStrikes}/g, String(ctx.perfectStrikes != null ? ctx.perfectStrikes : "?"))
    .replace(/{playerLead}/g, String(Math.max(ctx.h2hWins || 0, ctx.h2hLosses || 0)));
}

/* ── 5 · Composer ──────────────────────────────────────────────────────────── */
export function buildPreMatch(ctx) {
  ctx = ctx || {};
  var seed = (ctx.playerRank || 1) * 10007 + (ctx.oppRank || 1) * 97 + (ctx.tierIdx || 0) * 13 + (ctx.round || 0) + Date.now() % 1000;
  var rnd = rng(seed);
  var a = analyseMatchup(ctx);

  var out = [];
  /* 1. Opener (Barry) */
  out.push({ speaker: "barry", text: fill(pickFresh(OPENERS, "opener", rnd), ctx, a) });

  /* 2. Strength focus (Reggie), prefer opponent if her best stat level is higher than player's best */
  var strOpp = a.opp.best.v >= a.player.best.v;
  var strBank = strOpp ? STRENGTHS_OPP : STRENGTHS_PLAYER;
  out.push({ speaker: "reggie", text: fill(pickFresh(strBank, strOpp ? "strOpp" : "strPlayer", rnd), ctx, a) });

  /* 3. Condition tilt — three branches: player favoured / opp favoured / even / classic */
  if (ctx.condKey === "classic") {
    out.push({ speaker: "barry", text: fill(pickFresh(COND_CLASSIC_LINES, "condClassic", rnd), ctx, a) });
  } else if (a.condFavoursPlayer) {
    out.push({ speaker: "barry", text: fill(pickFresh(COND_TILT_PLAYER, "condPlayer", rnd), ctx, a) });
  } else if (a.condFavoursOpp) {
    out.push({ speaker: "barry", text: fill(pickFresh(COND_TILT_OPP, "condOpp", rnd), ctx, a) });
  } else {
    out.push({ speaker: "barry", text: fill(pickFresh(COND_TILT_EVEN, "condEven", rnd), ctx, a) });
  }

  /* 4. The sharp tactical edge if there is one, else weakness focus on whichever side it fits.
        Fifth slot gets a flavour layer (career / h2h / fitness / rank-gap) when the context sings. */
  if (a.edgeNote) {
    var eBank = a.edgeNote.who === "player" ? EDGE_PLAYER : EDGE_OPP;
    out.push({ speaker: "reggie", text: fill(pickFresh(eBank, "edge" + a.edgeNote.who, rnd), ctx, a) });
  } else {
    /* Pick weakness depending on whose worst is more dire */
    var wBank = a.opp.worst.v <= a.player.worst.v ? WEAKNESS_OPP : WEAKNESS_PLAYER;
    out.push({ speaker: "reggie", text: fill(pickFresh(wBank, "weak", rnd), ctx, a) });
  }

  /* 5. One flavour line — pick what the context actually gives us, in priority order:
        · Slam/final stakes come first (biggest matches get the biggest nods)
        · Then fitness if someone is tired, then h2h with meaningful history
        · Then career titles, veteran/rookie seasons, first meeting, or a sharp rank gap */
  var flavourBank = null, flavourKey = null;
  if (ctx.isSlam) { flavourBank = STAKES_SLAM; flavourKey = "stakSlam"; }
  else if (ctx.isFinal) { flavourBank = STAKES_FINAL; flavourKey = "stakFinal"; }
  else if (a.oFit === "ragged" || a.oFit === "tired") { flavourBank = FITNESS_OPP_TIRED; flavourKey = "fitOpp"; }
  else if (a.pFit === "ragged" || a.pFit === "tired") { flavourBank = FITNESS_PLAYER_TIRED; flavourKey = "fitPlayer"; }
  else if (!ctx.firstMeeting && (ctx.h2hWins || 0) + (ctx.h2hLosses || 0) >= 2) {
    if ((ctx.h2hWins || 0) > (ctx.h2hLosses || 0)) { flavourBank = H2H_LEAD_PLAYER; flavourKey = "h2hP"; }
    else if ((ctx.h2hWins || 0) < (ctx.h2hLosses || 0)) { flavourBank = H2H_LEAD_OPP; flavourKey = "h2hO"; }
    else { flavourBank = H2H_LEVEL; flavourKey = "h2hL"; }
  }
  else if (((ctx.oppCareer || {}).titles || 0) >= 3) { flavourBank = CAREER_OPP_TITLED; flavourKey = "carOpp"; }
  else if ((ctx.oppSeasons || 0) >= 10) { flavourBank = VETERAN_OPP; flavourKey = "vetOpp"; }
  else if ((ctx.oppSeasons || 99) <= 2) { flavourBank = ROOKIE_OPP; flavourKey = "rookOpp"; }
  else if ((ctx.playerSeasons || 99) <= 2) { flavourBank = ROOKIE_PLAYER; flavourKey = "rookP"; }
  else if (ctx.isMasters) { flavourBank = STAKES_MASTERS; flavourKey = "stakM"; }
  /* Form: opp sitting notably below her peak (slumping), or climbing back toward it (hot) */
  else if ((ctx.oppCareer || {}).peakRank && ctx.oppRank && ctx.oppRank - (ctx.oppCareer.peakRank || 999) >= 60) {
    flavourBank = FORM_OPP_SLUMPING; flavourKey = "formSl";
  }
  else if ((ctx.oppCareer || {}).peakRank && ctx.oppRank && ctx.oppRank - (ctx.oppCareer.peakRank || 999) <= 10 && (ctx.oppCareer.peakRank || 999) > 1) {
    flavourBank = FORM_OPP_HOT; flavourKey = "formHot";
  }
  /* Specific gear: lance of the opponent, if it's not the basic broom */
  else if (ctx.oppLance && ctx.oppLance !== "broom" && GEAR_LANCE[ctx.oppLance]) {
    flavourBank = GEAR_LANCE[ctx.oppLance]; flavourKey = "lance" + ctx.oppLance;
  }
  else if (ctx.oppSaddle && ctx.oppSaddle !== "teacosy" && GEAR_SADDLE[ctx.oppSaddle]) {
    flavourBank = GEAR_SADDLE[ctx.oppSaddle]; flavourKey = "sad" + ctx.oppSaddle;
  }
  /* Rooster trait — colour nod when the opponent has a memorable mount/personality */
  else if (ctx.oppRooster) { flavourBank = ROOSTER_TRAIT; flavourKey = "rooster"; }
  else if (ctx.firstMeeting) { flavourBank = H2H_FIRST; flavourKey = "h2hFirst"; }
  else if (Math.abs(a.rankGap) >= 100) {
    flavourBank = a.rankGap > 0 ? RANK_UPSET_WATCH : RANK_CLASS_GAP;
    flavourKey = a.rankGap > 0 ? "rankUp" : "rankCls";
  }
  if (flavourBank) out.push({ speaker: "reggie", text: fill(pickFresh(flavourBank, flavourKey, rnd), ctx, a) });

  /* 6. Closer */
  var closer = pickFresh(CLOSERS, "closer", rnd);
  out.push({ speaker: closer.s, text: fill(closer.t, ctx, a) });

  /* Attach durations and starts */
  var acc = 0;
  out.forEach(function (l) { l.durMs = estimateMs(l.text); l.startMs = acc; acc += l.durMs; });
  return { lines: out, totalMs: acc, analysis: a };
}

/* ── 6 · Between-sets commentary ───────────────────────────────────────────── */
/* Shorter — 2–3 lines, ~6 seconds. Called after each set finishes except the last. The caller passes:
     setsCtx = { sets: [{ my:[strikes], op:[strikes], won }…], need, youLeading, perfectCount } */

/* How we read the latest set */
var SET_CLOSE_WIN = [
  "Set to {player}, by a whisker — {setGapAbs} points.",
  "{player} edges it. {setGapAbs}-point margin.",
  "A tight one — {player} by {setGapAbs}.",
  "{player} nicks it, {setGapAbs} points.",
  "{setGapAbs} points, {player} takes it.",
  "Hold on, {player} has it — {setGapAbs} points.",
  "{player} by a hair, {setGapAbs} points.",
  "The thinnest of sets — {player} by {setGapAbs}.",
  "{player} with a scrappy set win, {setGapAbs} points.",
  "The margins hold for {player}, {setGapAbs} points.",
  "{setGapAbs} points separates them — {player}'s set.",
  "{player} finds enough — {setGapAbs} points.",
  "A nervy set win for {player}, {setGapAbs} points.",
  "{player} grinds the set out, {setGapAbs} points.",
  "{setGapAbs} points the right way — {player}'s set.",
  "Just enough from {player}, {setGapAbs} points.",
  "{player} snatches the set, {setGapAbs} points.",
  "The whisker belongs to {player}, {setGapAbs} points.",
  "A close-run set for {player}, {setGapAbs} points.",
  "{player} on the right side, {setGapAbs} points."
];
var SET_WIDE_WIN = [
  "Set to {player}, by a mile — {setGapAbs} points.",
  "A clean set, {player} by {setGapAbs}.",
  "Dominant — {player} by {setGapAbs}.",
  "{player} with a statement set, {setGapAbs} clear.",
  "{opp} wasn't invited — {player} by {setGapAbs}.",
  "{player} dismantles her, {setGapAbs} points.",
  "A clinic from {player}, {setGapAbs} points.",
  "{player} runs away with it, {setGapAbs}.",
  "No contest — {player} by {setGapAbs}.",
  "{opp} had no answer, {player} by {setGapAbs}.",
  "{player} with a crushing set, {setGapAbs}.",
  "A total set for {player}, {setGapAbs} points.",
  "{opp} fell apart — {player} by {setGapAbs}.",
  "{player} showing why she's seeded, {setGapAbs} up.",
  "A proper hiding — {player} by {setGapAbs}.",
  "{player} with the air of a champion, {setGapAbs} clear.",
  "{setGapAbs} points of daylight — {player}'s set.",
  "A set to remember from {player}, {setGapAbs} ahead.",
  "{opp}'s rooster never got off the mark — {player} by {setGapAbs}.",
  "A statement, Barry — {player} by {setGapAbs}."
];
var SET_CLOSE_LOSS = [
  "Set to {opp}, {setGapAbs} points. {player} had chances.",
  "A hard one for {player}, {setGapAbs} short.",
  "{opp} by {setGapAbs}. {player} within touching distance.",
  "A thin set lost — {setGapAbs} points.",
  "{setGapAbs} the wrong way for {player}.",
  "A nervy set to {opp}, {setGapAbs} points.",
  "{player} loses on fine margins, {setGapAbs}.",
  "A frustrating set for {player}, {setGapAbs} short.",
  "{opp} edges it, {setGapAbs} points.",
  "The whisker belongs to {opp} — {setGapAbs}.",
  "{player} with a set that got away, {setGapAbs}.",
  "A close set in {opp}'s column, {setGapAbs}.",
  "{player} will replay that one — {setGapAbs} short.",
  "A thin loss for {player}, {setGapAbs} points.",
  "{opp} on the right side, {setGapAbs} up.",
  "{player} within a strike or two — set gone, {setGapAbs}.",
  "A set lost by nothing much, {setGapAbs}.",
  "{opp} grinds it out, {setGapAbs} points.",
  "A tight set to {opp}, {setGapAbs} the margin.",
  "The margins beat {player}, {setGapAbs} points."
];
var SET_WIDE_LOSS = [
  "{opp} takes it, {setGapAbs} clear. {player} needs an answer.",
  "A rough set, {setGapAbs}-point beating.",
  "{opp} with a dominant set, {setGapAbs} points.",
  "That's a hiding — {opp} by {setGapAbs}.",
  "A reality-check set for {player}, {setGapAbs} down.",
  "{opp} with a clinic, {setGapAbs} ahead.",
  "A one-way set for {opp}, {setGapAbs} points.",
  "{player} needs to regroup — {setGapAbs} the margin.",
  "{opp} rolls, {setGapAbs} points.",
  "A set to put away quickly — {setGapAbs} down.",
  "{player} outclassed in that set, {setGapAbs}.",
  "{opp} by {setGapAbs}, Barry. {player}'s rooster is unsettled.",
  "A tough set for {player}, {setGapAbs} points.",
  "{opp} runs the ground, {setGapAbs} ahead.",
  "{player} needs an answer in the next, {setGapAbs} down.",
  "A proper beating of a set — {setGapAbs}.",
  "{opp}'s set, no question. {setGapAbs} points.",
  "{player} in trouble now — {setGapAbs} down this set.",
  "A wide one to {opp}, {setGapAbs} points clear.",
  "{opp} dominates, {setGapAbs} points. {player} must reset."
];

/* Pattern reads over all sets so far */
var MOMENTUM_STREAK_PLAYER = [
  "Two on the trot for {player}. The booth smells blood.",
  "{player} is in a rhythm now, Barry. Hard to stop a granny once she starts.",
  "That's two straight. {opp}'s head is somewhere else.",
  "Two in a row, {player}. The rooster has found its stride.",
  "{opp} can't buy a set now. Two straight for {player}."
];
var MOMENTUM_STREAK_OPP = [
  "Two in a row for {opp}. {player}'s running out of road.",
  "{opp} building a wall. {player} has to break something to come back.",
  "Trouble for {player}. Two sets down and the bar getting faster.",
  "{opp} with the momentum, Barry — two on the bounce. {player} is in trouble.",
  "{player}'s needs a miracle now. Two sets to {opp}."
];
var MOMENTUM_SWING = [
  "Trading sets, Barry. One each. This is what we came for.",
  "Set apiece. The next one tips it.",
  "Even now. Pick your side and hold on.",
  "Punch and counter-punch. {setsWon}-{setsLost} and even.",
  "They're matching each other set for set. The crowd is loving it."
];

/* Come-back reads: player lost set 1, won set 2 */
var COMEBACK_PLAYER = [
  "{player} answers back. From one down to level.",
  "A response from {player}, Barry. She wasn't going quietly.",
  "There's the fight in {player}. Levels the match."
];
var COMEBACK_OPP = [
  "{opp} with the response, Barry. {player}'s lead didn't last.",
  "{opp} wasn't finished. The match is level again.",
  "{player}'s cushion gone. {opp} draws level."
];

/* Perfect-strike call-outs */
var PERFECT_HAIL_PLAYER = [
  "Three gold strikes in that set from {player}. Three. On this bar. Reggie, that's not jousting, that's clockwork.",
  "A flawless set from {player}, Barry. Every strike on the line.",
  "{player} with a perfect set. On {condName} day. She's reading the bar like a book.",
  "Three for three in gold, {player}. The booth takes a bow.",
  "A perfect set from {player}, Barry. The crowd knows what it's seen."
];
var PERFECT_HAIL_OPP = [
  "{opp} just posted a flawless set. {player}'s got to go up a gear or go home.",
  "Three straight gold for {opp}. That'll be in the papers.",
  "A clean sheet from {opp} that set. Ominous for {player}.",
  "{opp} with three on the line. {player} needs to shake her nerve.",
  "A perfect set from {opp}. Reggie, we've got a serious opponent on our hands."
];

/* Decider framing (if next set is match-decider) */
var DECIDER_INCOMING = [
  "Deciding set up next, Barry. Everything on this one.",
  "Here we go — all or nothing from here.",
  "The decider. If {player} wants this, she takes it now.",
  "Match-point set coming up, Barry. The booth isn't breathing.",
  "This is for the match. The decider.",
  "Winner-takes-all set. {player} and {opp} with nothing left but the hands."
];

/* Flat read (if nothing dramatic to say) */
var FLAT_SET = [
  "Set done. {player} leads {setsWon}–{setsLost}.",
  "One more in the books. {setsWon}–{setsLost} on the scorecard.",
  "Set to {setWinner}. Score reads {setsWon}–{setsLost}.",
  "That's a set, Barry. {setsWon}–{setsLost} and they ride on.",
  "Set complete. {setWinner} with it, {setsWon}–{setsLost} overall."
];

export function buildBetweenSets(ctx, setsCtx) {
  ctx = ctx || {}; setsCtx = setsCtx || {};
  var sets = setsCtx.sets || [], need = setsCtx.need || 2;
  var lastSet = sets[sets.length - 1];
  if (!lastSet) return { lines: [], totalMs: 0 };
  var youWonLast = !!lastSet.won;
  var lastMy = Math.round((lastSet.my || []).reduce(function(s,x){return s+x;},0) / Math.max(1, (lastSet.my || []).length));
  var lastOp = Math.round((lastSet.op || []).reduce(function(s,x){return s+x;},0) / Math.max(1, (lastSet.op || []).length));
  var setGap = lastMy - lastOp, setGapAbs = Math.abs(setGap);
  var close = setGapAbs <= 4, wide = setGapAbs >= 10;
  var setsWon = sets.filter(function (s) { return s.won; }).length;
  var setsLost = sets.length - setsWon;
  var youLeading = setsWon > setsLost, matchTied = setsWon === setsLost;
  var deciderNext = setsWon === need - 1 && setsLost === need - 1;

  /* Streak: last two sets same winner */
  var streak = sets.length >= 2 && sets[sets.length - 1].won === sets[sets.length - 2].won;
  var flawless = (lastSet.my || []).length >= 3 && (lastSet.my || []).every(function (s) { return s >= 85; });
  var oppFlawless = (lastSet.op || []).length >= 3 && (lastSet.op || []).every(function (s) { return s >= 85; });

  var seed = (ctx.playerRank || 1) * 10007 + (ctx.oppRank || 1) * 97 + sets.length * 1013;
  var rnd = rng(seed);
  var extCtx = Object.assign({}, ctx, {
    setGapAbs: setGapAbs, setsWon: setsWon, setsLost: setsLost,
    setWinner: youWonLast ? (ctx.playerName || "the player") : (ctx.oppName || "the challenger")
  });
  var a = analyseMatchup(ctx);
  var out = [];

  /* 1. Score the set */
  var bank;
  if (youWonLast && close) bank = SET_CLOSE_WIN;
  else if (youWonLast && wide) bank = SET_WIDE_WIN;
  else if (youWonLast) bank = SET_CLOSE_WIN;
  else if (!youWonLast && close) bank = SET_CLOSE_LOSS;
  else if (!youWonLast && wide) bank = SET_WIDE_LOSS;
  else bank = SET_CLOSE_LOSS;
  out.push({ speaker: "barry", text: fill(pickFresh(bank, "setScore", rnd), extCtx, a) });

  /* 2. Flawless call-out → comeback → streak/momentum → flat */
  var comeback = sets.length >= 2 && sets[sets.length - 1].won !== sets[sets.length - 2].won;
  if (flawless) out.push({ speaker: "reggie", text: fill(pickFresh(PERFECT_HAIL_PLAYER, "flawP", rnd), extCtx, a) });
  else if (oppFlawless) out.push({ speaker: "reggie", text: fill(pickFresh(PERFECT_HAIL_OPP, "flawO", rnd), extCtx, a) });
  else if (streak && youLeading) out.push({ speaker: "reggie", text: fill(pickFresh(MOMENTUM_STREAK_PLAYER, "momP", rnd), extCtx, a) });
  else if (streak && !youLeading) out.push({ speaker: "reggie", text: fill(pickFresh(MOMENTUM_STREAK_OPP, "momO", rnd), extCtx, a) });
  else if (comeback && youWonLast) out.push({ speaker: "reggie", text: fill(pickFresh(COMEBACK_PLAYER, "cbP", rnd), extCtx, a) });
  else if (comeback && !youWonLast) out.push({ speaker: "reggie", text: fill(pickFresh(COMEBACK_OPP, "cbO", rnd), extCtx, a) });
  else if (matchTied) out.push({ speaker: "reggie", text: fill(pickFresh(MOMENTUM_SWING, "momE", rnd), extCtx, a) });
  else out.push({ speaker: "reggie", text: fill(pickFresh(FLAT_SET, "flat", rnd), extCtx, a) });

  /* 3. Decider framing if the next one is match-point */
  if (deciderNext) out.push({ speaker: "barry", text: fill(pickFresh(DECIDER_INCOMING, "decide", rnd), extCtx, a) });

  var acc = 0;
  out.forEach(function (l) { l.durMs = estimateMs(l.text); l.startMs = acc; acc += l.durMs; });
  return { lines: out, totalMs: acc };
}

/* ── 7 · Post-match commentary ─────────────────────────────────────────────── */
/* 4–5 lines, ~12 seconds. result shape:
     { won, setsWon, setsLost, pa, oa, sets: [{my,op,won}…], myStrikes:[…] } (what PowerBar's res carries) */

/* Opening frame */
var POST_WIN_EASY = [
  "{player} comes through, Barry. {setsWon}–{setsLost}, and little drama with it.",
  "A workmanlike win from {player}. {setsWon}–{setsLost}, business done.",
  "{player} runs out {setsWon}–{setsLost} winner. Rarely in doubt.",
  "A tidy performance from {player}, Barry. {setsWon}–{setsLost}. No alarms.",
  "{player} does the job. {setsWon}–{setsLost} on the scorecard, and off to the next round.",
  "A win in the diary for {player}, {setsWon}–{setsLost}. Nothing much to review.",
  "Business as usual for {player}. {setsWon}–{setsLost}. Next.",
  "Clean work from {player}, Barry — {setsWon}–{setsLost} and off.",
  "{player} does what she had to. {setsWon}–{setsLost}. The seeds hold.",
  "A win without a sweat, Barry — {player} by {setsWon}–{setsLost}.",
  "{player} with the professional job. {setsWon}–{setsLost}, see you tomorrow.",
  "No scare for {player} today, Barry. {setsWon}–{setsLost} on the card.",
  "{player}'s through, {setsWon}–{setsLost}. The crowd barely needed to shout.",
  "A straightforward {setsWon}–{setsLost} for {player}. Rest the lance and move on.",
  "{player} ticks the box, Barry. {setsWon}–{setsLost}. Nothing to detain us.",
  "The seed holds — {player} by {setsWon}–{setsLost}. Clean.",
  "Routine win for {player}, {setsWon}–{setsLost}. The next round is where the test begins.",
  "{player} does her job and leaves, Barry. {setsWon}–{setsLost}.",
  "An expected result, delivered on time: {player} {setsWon}–{setsLost}.",
  "{player} with a cruise, Reggie. {setsWon}–{setsLost} and the energy saved."
];
var POST_WIN_TIGHT = [
  "{player} edges it, {setsWon}–{setsLost}. The scorecard says comfortable, the match said anything but.",
  "A gritty win for {player}. {setsWon}–{setsLost}, every set a scrap.",
  "{player} finds a way. {setsWon}–{setsLost}, and she'll know she was in a fight.",
  "The hard way home for {player} — {setsWon}–{setsLost}. {opp} earned every point.",
  "{player} on the right side of a close one, Barry. {setsWon}–{setsLost}. The booth needs a sit-down.",
  "A proper fight. {player} takes it {setsWon}–{setsLost}. We earned our tea on that one.",
  "{player} wins the dogfight, Barry — {setsWon}–{setsLost}. The margins were nothing.",
  "A nervy {setsWon}–{setsLost} for {player}. She'll take it and move on.",
  "{player} grinds it out, Barry. {setsWon}–{setsLost} and the crowd is spent.",
  "A win on fine margins, Reggie — {player} by {setsWon}–{setsLost}.",
  "{player} with a result from the trenches, Barry. {setsWon}–{setsLost}.",
  "Four or five strikes decided this one, Barry. {player} by {setsWon}–{setsLost}.",
  "{player} outlasted {opp}, Barry. {setsWon}–{setsLost}. Both of them should sit down.",
  "A hard-earned {setsWon}–{setsLost} for {player}. On another day she loses this.",
  "The result is in {player}'s column, Barry — {setsWon}–{setsLost}. The match deserved more drama.",
  "{player} with the sort of win that builds a career, Barry. {setsWon}–{setsLost} the hard way.",
  "A proper tussle. {player} takes it {setsWon}–{setsLost}. Hats off to both.",
  "{player} on the edge of her saddle for most of that one. {setsWon}–{setsLost} and relief.",
  "{setsWon}–{setsLost} to {player}, Barry — a brawler of a match.",
  "A gritty one for {player}. {setsWon}–{setsLost}. Nothing came easy."
];
var POST_WIN_UPSET = [
  "Upset at {venue}, Barry. {player} ranked {playerRank}, {opp} ranked {oppRank}, and the lower rank wins. The ladder shook today.",
  "{player} knocks out {opp}! The {oppRankOrd} in the world goes home. That'll be a bruise on {opp}'s season.",
  "{player} with the shock of the round. {setsWon}–{setsLost} against the number {oppRank}. Reggie, I need a seat.",
  "The giant falls. {player} beats {opp} — the {oppRankOrd}-ranked woman in the world.",
  "A result that'll run in the papers tomorrow: {player} by {setsWon}–{setsLost} over {opp}.",
  "Not many saw this coming, Barry. {player} dismisses {opp}, who was {oppRankOrd} in the world.",
  "An upset for the ages. {player}, ranked {playerRank}, finishes off {opp}, number {oppRank}. {setsWon}–{setsLost}.",
  "Someone wake the editors — {player} just beat {opp}, Barry. The {oppRankOrd} in the world is out.",
  "The booth is on its feet, Barry. {player}, {playerRankOrd}, dumps {opp} out of the tournament.",
  "{opp} will not sleep tonight. {player} with the upset, {setsWon}–{setsLost}.",
  "A result that writes itself: {player} over {opp}, Barry. The ladder got a shake.",
  "The press box is scribbling. {player}, ranked {playerRank}, with the win over {opp} the {oppRankOrd}.",
  "A moment, Barry — {player} just beat a top-{oppRank} rider. That doesn't happen every week.",
  "The {opp} machine breaks down against {player}, Barry. {setsWon}–{setsLost}. Nobody expected it.",
  "What a story. {player}, {playerRankOrd} in the world, dispatches {opp}, the {oppRankOrd}. {setsWon}–{setsLost}.",
  "If you weren't watching, Barry, you missed one. {player} knocks over {opp}, {setsWon}–{setsLost}.",
  "The underdog bites. {player} beats {opp} at {venue}. The season just got interesting.",
  "{opp}'s weekend is ruined, Barry. {player} with the shock result, {setsWon}–{setsLost}.",
  "A career-making win for {player}: {setsWon}–{setsLost} over {opp}, the {oppRankOrd} in the world.",
  "The crowd is making noise, Barry. {player} just beat {opp} and the whole venue knows it."
];
var POST_LOSS_TIGHT = [
  "{opp} takes it, {setsWon}–{setsLost}. {player} fought every point. On another day, Barry.",
  "A hard one for {player} — {setsWon}–{setsLost} to {opp}. She was a strike away in two of those sets.",
  "{player} loses the tight one. {setsWon}–{setsLost}. The crowd stays on their feet for her.",
  "{opp} gets the W, {setsWon}–{setsLost}. {player} will not have slept well on that defeat.",
  "The thinnest of losses for {player}, Barry. {setsWon}–{setsLost}. The margins ate her alive.",
  "{player} did everything but win, {setsWon}–{setsLost}. Pride intact, Barry.",
  "A heartbreaking {setsWon}–{setsLost} for {player}, Barry. Nothing to blame but the margins.",
  "{opp} with the W by the slimmest of margins, {setsWon}–{setsLost}. {player}'s head will be spinning.",
  "The booth hurts for {player}. {setsWon}–{setsLost}. Any one of those sets could have flipped.",
  "{player} loses a scrap, Barry — {setsWon}–{setsLost}. Both of them deserved to win.",
  "Three points across three sets, Barry — and {player} loses {setsWon}–{setsLost}. Brutal.",
  "A match that could've gone either way, and {player}'s on the wrong side of it, {setsWon}–{setsLost}.",
  "{opp} by {setsWon}–{setsLost} the hard way, Barry. {player}'s campaign ends here.",
  "{player} rode well enough to win most days, Barry. Not this one. {setsWon}–{setsLost}.",
  "A photo-finish loss for {player}, Reggie. {setsWon}–{setsLost}. The ground was unkind.",
  "The hands held, the margins didn't. {player} out {setsWon}–{setsLost}.",
  "A hard one on the clipboard: {player} {setsWon}–{setsLost}. Earned nothing but respect.",
  "{setsWon}–{setsLost} to {opp}, and {player} will be rehearsing those two strikes in her sleep.",
  "{opp} just about takes it, {setsWon}–{setsLost}. {player}'s head will take a while to clear.",
  "A loss that'll sting for weeks, Barry. {player} by {setsWon}–{setsLost}, four points over the match."
];
var POST_LOSS_BLOWOUT = [
  "{opp} rolls through, Barry. {setsWon}–{setsLost}. {player} never found her bar.",
  "A tough afternoon for {player}. {setsWon}–{setsLost} and never on terms.",
  "{player} outclassed today. {setsWon}–{setsLost}. Back to the training lanes.",
  "{opp} with a message, Barry — {setsWon}–{setsLost}. {player} will want to forget this one.",
  "A one-sided result. {setsWon}–{setsLost} to {opp}. {player}'s rooster never got going.",
  "A heavy loss for {player}, {setsWon}–{setsLost}. {opp} was on another level.",
  "{setsWon}–{setsLost} to {opp}, Barry — a hiding, in old money.",
  "{player} outclassed, Barry. {setsWon}–{setsLost}. There'll be a long walk back to the stables.",
  "A proper beating, Reggie. {opp} by {setsWon}–{setsLost}.",
  "{player} never had a sniff, Barry. {setsWon}–{setsLost} and the match was over by set two.",
  "A heavy afternoon for {player}, Barry. {setsWon}–{setsLost}. Nothing worked.",
  "{opp} with the clinic, Barry. {setsWon}–{setsLost}. {player} will replay nothing fondly.",
  "A one-way match, Reggie. {setsWon}–{setsLost} to {opp}. {player}'s season takes a hit.",
  "{setsWon}–{setsLost} the wrong way, Barry. {player} was second to every strike.",
  "{opp} on another level today, Reggie. {setsWon}–{setsLost}.",
  "A loss that'll leave a mark, Barry. {player} {setsWon}–{setsLost}. The scouts will have noted everything.",
  "No contest in the end, Barry. {opp} by {setsWon}–{setsLost}.",
  "{player} was outplayed from the first strike, Reggie. {setsWon}–{setsLost} to {opp}.",
  "A result to put away quickly, Barry — {player} by {setsWon}–{setsLost}. Nothing to review.",
  "{opp} rode a clinic, Barry. {setsWon}–{setsLost}. {player}'s coach has work to do."
];
var POST_LOSS_UPSET = [
  "{player} out at the hands of {opp} — ranked {oppRank}, Barry. The ladder bites back.",
  "Shock in the booth: {player} beaten by {opp}. {setsWon}–{setsLost} the wrong way for the favourite.",
  "{opp} with the upset of the day. {player}, {playerRankOrd} in the world, bows out.",
  "The {oppRank}-ranked {opp} knocks over {player}. One for the paper.",
  "{player} loses to {opp}, {setsWon}–{setsLost}. The {oppRankOrd} woman wins a famous one.",
  "A dark day for {player}, Barry. {opp}, ranked {oppRank}, takes the match {setsWon}–{setsLost}.",
  "Nobody expected this — {opp}, the {oppRankOrd} in the world, beats {player}. {setsWon}–{setsLost}.",
  "{player} out at {venue}, Barry. {opp} with the career win of her month, {setsWon}–{setsLost}.",
  "The underdog bites hard. {opp} dumps {player}, {playerRankOrd} in the world, {setsWon}–{setsLost}.",
  "A result {player} will want to forget: beaten by {opp}, ranked {oppRank}. {setsWon}–{setsLost}.",
  "The ladder shook, Barry — {opp} knocks {player}, {playerRankOrd}, out of the tournament.",
  "{player}'s day ends early at the hands of {opp}, the {oppRankOrd}. {setsWon}–{setsLost}.",
  "A banana skin for {player}, Barry. {opp} ranked {oppRank}, now ranked 'victor'.",
  "The press is already asking what happened. {player} out to {opp}, {setsWon}–{setsLost}.",
  "{opp} will dine out on this one for years. {player}, {playerRankOrd}, beaten {setsWon}–{setsLost}."
];

/* The tactical read of the match (Reggie) — ties to the pre-match analysis */
var POST_READ_STAT_WON = [
  "Her {playerBestLabel} did the work, Barry. Level {playerBestLv}, and it showed every strike.",
  "{player}'s {playerBestLabel} was always going to decide this — level {playerBestLv}, written on the scoreboard.",
  "You said it before the match: {playerBestLabel}. And there it was.",
  "{player} rode her {playerBestLabel} to the finish, Barry. {playerBestLv} levels of it, every point.",
  "The engine today was {player}'s {playerBestLabel}, level {playerBestLv}. You could see her lean on it."
];
var POST_READ_COND_WON = [
  "The {condName} did half the job for {player}. Her kit lined up with the ground.",
  "{player} was built for this ground, Barry. {condName} rewarded {playerBestLabel} and she had it.",
  "{condName} day, {player}'s kit — a match made in heaven. The result was never in doubt.",
  "{player} prayed for {condName} this morning, Barry. Looks like someone was listening."
];
var POST_READ_UPSET_WHY = [
  "{opp}'s {oppWorstLabel} came home to roost, Barry. Level {oppWorstLv} — {player} found the door and walked through.",
  "The upset was in the stats. {opp}'s {oppWorstLabel} level {oppWorstLv}. On these lanes that's a crack, and {player} swung the hammer.",
  "{opp} got away with {oppWorstLabel} level {oppWorstLv} for too long, Barry. {player} punished it.",
  "The crack in {opp}'s armour: {oppWorstLabel}, level {oppWorstLv}. {player} saw it and rode through."
];
var POST_READ_LOSS_STAT = [
  "{opp}'s {oppBestLabel} level {oppBestLv} was the match, Barry. {player} didn't have an answer.",
  "You can see where it went: {opp}'s {oppBestLabel}. Level {oppBestLv}. Not many on tour have more.",
  "{opp}'s {oppBestLabel} wrote the result today, Barry. Level {oppBestLv}, uncatchable.",
  "{player} had no counter to {opp}'s {oppBestLabel}, level {oppBestLv}. These things decide matches."
];
var POST_READ_LOSS_FITNESS = [
  "{player}'s legs went in the third set, Barry. The bar runs away from a tired granny.",
  "{player} ran out of road, Barry. Fitness told in the end.",
  "The tank was empty on {player}, Barry. The schedule beat her before {opp} did.",
  "A week catches up with you at this level. {player}'s fitness was the losing margin."
];

/* The strike pattern — perfects / flawless etc. */
var POST_PATTERN_FLAWLESS = [
  "{flawlessSets} flawless sets from {player}, Barry. {perfectStrikes} perfect strikes. That's going in the paper.",
  "A tidy card: {perfectStrikes} perfect strikes. {player} was reading the bar like a map.",
  "{flawlessSets} flawless sets. {perfectStrikes} perfect strikes. {player} was in another gear today, Barry.",
  "Ice in her hands, {player}. {flawlessSets} flawless sets and {perfectStrikes} perfects."
];
var POST_PATTERN_CLUTCH = [
  "She found it when she had to, Barry. {perfectStrikes} perfect strikes, most in the sets that mattered.",
  "The {playerBestLabel} came out at the right time. {perfectStrikes} perfects over the match.",
  "{perfectStrikes} perfect strikes, Barry — and most on the big points. A nerveless performance.",
  "The hands held, {player}. {perfectStrikes} perfects when it counted."
];

/* Closer — hand off to Interview */
var POST_CLOSERS = [
  { s: "barry",  t: "And we'll hear from {player} in the interview room. Over to you." },
  { s: "reggie", t: "Right, pass me the kettle. Over to the presser." },
  { s: "barry",  t: "That's your match. Interviews next." },
  { s: "reggie", t: "I'll be surprised if she doesn't thank her rooster." },
  { s: "barry",  t: "A word from the winner coming up." },
  { s: "barry",  t: "The press room is next. Over to the microphones." },
  { s: "reggie", t: "Good match. Pass me a biscuit." },
  { s: "barry",  t: "And so to the interview. That'll do us from the booth." },
  { s: "reggie", t: "Right, I need the kettle on. See you after the presser." },
  { s: "barry",  t: "A result, a story, and off to the press. Thanks for being with us." },
  { s: "barry",  t: "The interview room beckons. Over to our colleagues." },
  { s: "reggie", t: "Done and dusted. I'm off for a cup." },
  { s: "barry",  t: "That's your lot from the booth. The microphones take over." },
  { s: "reggie", t: "Match done, Barry. The presser will have the quotes." },
  { s: "barry",  t: "The scribes are waiting with pencils up. Over to the interview." },
  { s: "reggie", t: "I need biscuits. See you after the presser." },
  { s: "barry",  t: "A fine match, well-fought. Over to the press room." },
  { s: "reggie", t: "Right, I'm off to the back. Enjoy the interview." },
  { s: "barry",  t: "That'll do us. Thanks for sharing it with us. Over." },
  { s: "reggie", t: "Match in the book. The quotes come next." }
];

export function buildPostMatch(ctx, result) {
  ctx = ctx || {}; result = result || {};
  var won = !!result.won, setsWon = result.setsWon || 0, setsLost = result.setsLost || 0;
  var sets = result.sets || [];
  /* Was it tight or a blowout? Tight = decider or margin of 1 */
  var tight = Math.abs(setsWon - setsLost) <= 1;
  var upset = (ctx.playerRank && ctx.oppRank) ? (won ? (ctx.playerRank > ctx.oppRank + 80) : (ctx.playerRank + 80 < ctx.oppRank)) : false;

  /* Pattern reads */
  var flawlessSets = sets.filter(function (s) { return s.my && s.my.length >= 3 && s.my.every(function (x) { return x >= 85; }); }).length;
  var perfectStrikes = (result.myStrikes || []).filter(function (s) { return s >= 85; }).length;

  var a = analyseMatchup(ctx);
  var seed = (ctx.playerRank || 1) * 10007 + (ctx.oppRank || 1) * 97 + (won ? 1 : 2) * 1009 + setsWon * 13 + setsLost;
  var rnd = rng(seed);
  var extCtx = Object.assign({}, ctx, {
    setsWon: setsWon, setsLost: setsLost,
    flawlessSets: flawlessSets, perfectStrikes: perfectStrikes
  });
  var out = [];

  /* 1. Opening frame — win/loss × upset/tight/easy */
  var frameBank;
  if (won && upset) frameBank = POST_WIN_UPSET;
  else if (won && tight) frameBank = POST_WIN_TIGHT;
  else if (won) frameBank = POST_WIN_EASY;
  else if (!won && upset) frameBank = POST_LOSS_UPSET;
  else if (!won && tight) frameBank = POST_LOSS_TIGHT;
  else frameBank = POST_LOSS_BLOWOUT;
  out.push({ speaker: "barry", text: fill(pickFresh(frameBank, "postFrame", rnd), extCtx, a) });

  /* 2. Tactical read tied to the pre-match analysis */
  var readBank;
  if (won && upset) readBank = POST_READ_UPSET_WHY;
  else if (won && a.condFavoursPlayer) readBank = POST_READ_COND_WON;
  else if (won) readBank = POST_READ_STAT_WON;
  else if (!won && (a.pFit === "tired" || a.pFit === "ragged")) readBank = POST_READ_LOSS_FITNESS;
  else readBank = POST_READ_LOSS_STAT;
  out.push({ speaker: "reggie", text: fill(pickFresh(readBank, "postRead", rnd), extCtx, a) });

  /* 3. Strike pattern — flawless or clutch, only if there's something to say */
  if (perfectStrikes >= 5 || flawlessSets >= 1) {
    var patBank = flawlessSets >= 1 ? POST_PATTERN_FLAWLESS : POST_PATTERN_CLUTCH;
    out.push({ speaker: "barry", text: fill(pickFresh(patBank, "postPat", rnd), extCtx, a) });
  }

  /* 4. Closer handoff to interview */
  var cl = pickFresh(POST_CLOSERS, "postClose", rnd);
  out.push({ speaker: cl.s, text: fill(cl.t, extCtx, a) });

  var acc = 0;
  out.forEach(function (l) { l.durMs = estimateMs(l.text); l.startMs = acc; acc += l.durMs; });
  return { lines: out, totalMs: acc };
}
