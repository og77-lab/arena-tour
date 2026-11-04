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
/* Openers — Phase 1 of the finite-audio refactor. No placeholders at all: no names, no rank numbers, no venue,
   tier, round or best-of in the template itself. Barry sets the scene generically; the match-specific detail
   lives in the lines that follow. One recording per voice, forever. */
var OPENERS = [
  "Right. Welcome back to the booth. Two riders on the warm-up and plenty to talk about.",
  "A warm hello from the booth. The lanes are chalked, the crowd is in, and we have a match on the way.",
  "Good afternoon. The grannies are mounted, the roosters are fed, and we're a few minutes from first strike.",
  "You're very welcome back, Barry. The umpire's at the line and both lances are up.",
  "Hello from the booth. The courses look fast, the crowd is settling, and the two riders are about to be announced.",
  "Settle in, Barry. The chairs are warm, the kettle's on, and the match is about to start.",
  "The sun's up over the ground, and the grannies are warming up. A short wait before the first strike.",
  "Good to see you back with us. The lanes are honest, the stands are full, and both riders are ready.",
  "Right then. The booth is open, the mics are warm, and the first strike is a few minutes off.",
  "Here we go. The ground is set, the lances are up, and the booth is yours for the next half hour.",
  "A warm hello from the box. A proper afternoon of jousting coming up, if the lanes behave.",
  "The crowd is in good voice, Barry. The grannies are stretching, and we have a match in a minute.",
  "Welcome back, you're among friends. The booth has a view and the lanes have a story.",
  "Afternoon all. Two riders about to come out, and I'm not going to spoil it before the walk-out.",
  "The roosters are preened, the lances are chalked, and the booth is where it needs to be.",
  "Right. The umpire's in position, the chairs are oiled, and we're seconds from the ride.",
  "A proper broadcast afternoon, Barry. Two riders, one ground, one of them walking away a winner.",
  "Hello from the box. The programme is set, the lanes are swept, and the first ride is on its way.",
  "You're very welcome. The booth's a tidy perch and the ground's a good one today.",
  "Right then, from the booth. The air is clean, the lanes are open, and we have a match about to start."
];

/* STRENGTH FOCUS — Reggie zeroes in on one of the player's or opponent's top stats */
/* Strengths — Phase 1 rewrite: no names, no level numbers. Only the stat label (one of five, finite) and generic
   references to the rider ("The opponent" / "The home rider"). Each line × 5 stats × 2 voices = 2 × line-count
   recordings per stat; one-time cost once the batch runs. */
var STRENGTHS_OPP = [
  "The thing with the opponent, Barry, is her {oppBestLabel}. On this bar that's a monster.",
  "The opponent's got a strong {oppBestLabel}. It {oppBestWhat}. The home rider will feel that.",
  "Watch the opponent's {oppBestLabel}. That's not a stat, that's a weapon.",
  "Elite {oppBestLabel} on the opponent, Barry. Few riders on tour {oppBestWhat} like she does.",
  "The opponent built this kit around her {oppBestLabel}, Barry. It {oppBestWhat}. The home rider knows what's coming.",
  "The opponent's {oppBestLabel} is her signature, Barry. On a good day she's untouchable there.",
  "A top-shelf {oppBestLabel} on the opponent. That's elite, Barry. The home rider has to find a way around it.",
  "What makes the opponent dangerous? Her {oppBestLabel}. It {oppBestWhat}, and she knows it.",
  "The opponent's weapon is her {oppBestLabel}, Barry. That's the match on the line.",
  "Reggie, if you had one stat to be scared of on the opponent, it's her {oppBestLabel}.",
  "The {oppBestLabel} on the opponent is why she's where she is in the rankings, Barry.",
  "Everyone on tour knows the opponent's {oppBestLabel}. Elite stuff, and it {oppBestWhat}.",
  "The opponent's calling card is her {oppBestLabel}. The home rider will have seen the tape.",
  "If I had to bet one stat for the opponent, Barry, it's her {oppBestLabel}. Match-winning on its day.",
  "You can't talk about the opponent without the {oppBestLabel}. The signature.",
  "The opponent's whole career is built on {oppBestLabel}, Barry. Hard to argue with.",
  "The scouts' first page on the opponent says {oppBestLabel}. Everything after is detail.",
  "If the home rider underestimates the opponent's {oppBestLabel}, Barry, she'll pay the price.",
  "Three words to describe the opponent: strong {oppBestLabel}. That's it.",
  "An elite {oppBestLabel} on the opponent — that stat has decided more matches than I can count."
];
var STRENGTHS_PLAYER = [
  "The home rider brings her {playerBestLabel} to this one, Barry. That {playerBestWhat}.",
  "If the home rider wins this, it's on her {playerBestLabel}, Barry. Not an accident.",
  "The {playerBestLabel} is where the home rider lives.",
  "The home rider's got a strong {playerBestLabel}, Barry. That'll be the engine today.",
  "You can see where the home rider spent her training points. {playerBestLabel}, Barry.",
  "A top-shelf {playerBestLabel} on the home rider. She'll ride that stat all day.",
  "The home rider's strength is in her {playerBestLabel}, Barry. It's elite.",
  "The thing about the home rider's kit, Barry — {playerBestLabel}. That's where she lives.",
  "The home rider's {playerBestLabel} is match-winning, Barry.",
  "Everything flows from the home rider's {playerBestLabel}, Reggie. It {playerBestWhat}.",
  "If you back the home rider, Barry, you back her {playerBestLabel}.",
  "The {playerBestLabel} is the home rider's weapon of choice, Barry.",
  "Watch the home rider's {playerBestLabel} today, Reggie. That's where she makes her money.",
  "The home rider's kit is a {playerBestLabel} kit, Barry. Her coach knew what she was doing.",
  "On form, the home rider's {playerBestLabel} will carry her. She rides it hard.",
  "The {playerBestLabel} on the home rider tells you everything about her game.",
  "The home rider's {playerBestLabel} is her engine, Barry. A good season of training.",
  "You know what wins the home rider matches? Her {playerBestLabel}. Keep it simple.",
  "The home rider's been building her {playerBestLabel} for years, Reggie. Pays off today.",
  "If the home rider's {playerBestLabel} fires, Barry, this match is over."
];

/* WEAKNESS FOCUS — one of them has a glaring hole */
var WEAKNESS_OPP = [
  "But the opponent's {oppWorstLabel}, Barry — level {oppWorstLv}. That's a door. If the home rider finds it, she walks in.",
  "The opponent's weak spot: {oppWorstLabel}, level {oppWorstLv}. It {oppWorstWhat} — barely at all, in her case.",
  "Mind the opponent's {oppWorstLabel} though. Level {oppWorstLv} — that's thin ice.",
  "The hole in the opponent's kit: {oppWorstLabel} at {oppWorstLv}. Every top rider has a weakness and that's hers.",
  "If I'm the home rider, Barry, I'm aiming at the opponent's {oppWorstLabel}. Level {oppWorstLv} is embarrassing.",
  "The opponent skipped training on {oppWorstLabel}, by the look of it — level {oppWorstLv}. The home rider should notice.",
  "There's one soft spot on the opponent: {oppWorstLabel} level {oppWorstLv}. It won't carry her through a long match.",
  "The crack in the opponent's armour, Barry: {oppWorstLabel}, level {oppWorstLv}. Keep hitting it.",
  "The opponent's nowhere on {oppWorstLabel} — level {oppWorstLv}. The home rider should be licking her lips.",
  "If there's a chink, it's the opponent's {oppWorstLabel} — level {oppWorstLv}. Make her defend it.",
  "The opponent's {oppWorstLabel} is a liability, Barry. {oppWorstLv} is sub-tour level.",
  "The scouts flag the opponent's {oppWorstLabel} on every page, Reggie. Level {oppWorstLv}.",
  "You beat the opponent by hitting her {oppWorstLabel}, Barry. Level {oppWorstLv} and nowhere to hide.",
  "The opponent has been meaning to train {oppWorstLabel} for three seasons. Level {oppWorstLv}. Still waiting.",
  "A top-{oppRank} rider with {oppWorstLabel} at {oppWorstLv}? Someone should have a word with her coach.",
  "The home rider's route to victory, Barry: the opponent's {oppWorstLabel}. Level {oppWorstLv} tells the story."
];
var WEAKNESS_PLAYER = [
  "The home rider's got a crack: {playerWorstLabel} at level {playerWorstLv}. The opponent will test it.",
  "Keep an eye on the home rider's {playerWorstLabel}. Level {playerWorstLv} is not where a top-{playerRank} should be.",
  "The home rider's been dodging {playerWorstLabel} in training, Barry. Level {playerWorstLv}. The opponent will find it.",
  "The weakness in the home rider's kit: {playerWorstLabel}, level {playerWorstLv}. Not where you want to be exposed.",
  "The home rider's {playerWorstLabel} is thin, Barry. {playerWorstLv} levels. The opponent ought to lean on it.",
  "If the home rider loses this, it'll be on {playerWorstLabel}, Barry — level {playerWorstLv}.",
  "The opponent will target the home rider's {playerWorstLabel}, Reggie. Level {playerWorstLv} is the opening.",
  "There's one soft spot on the home rider: {playerWorstLabel}, level {playerWorstLv}. The opponent will know.",
  "The home rider's {playerWorstLabel} is behind the curve, Barry — level {playerWorstLv}. Match-losing on a bad day.",
  "The hole the opponent is looking at, Barry: the home rider's {playerWorstLabel}. {playerWorstLv} levels.",
  "The home rider has not trained {playerWorstLabel}. Level {playerWorstLv}. The opponent will punish it.",
  "If the home rider's {playerWorstLabel} gets exposed today, Barry — and it will — it's a long afternoon.",
  "The home rider's {playerWorstLabel} is a known weakness, Reggie — level {playerWorstLv}. The opponent came prepared.",
  "The scouts have the home rider's {playerWorstLabel} underlined, Barry. Level {playerWorstLv}.",
  "The home rider relies on {playerBestLabel} to hide her {playerWorstLabel}. Level {playerWorstLv}. The opponent will try to drag it out."
];

/* CONDITION TILT — who does the ground reward */
var COND_TILT_PLAYER = [
  "And it's a {condName} day. That rewards {playerBestLabel}, Barry, and look who's got it.",
  "The {condName} will do half the work for the home rider. Her kit is built for this.",
  "The opponent picked a bad week for {condName}, Barry. The home rider's stats line up like a prayer.",
  "{condName} on the lanes — a gift to the home rider's {playerBestLabel}. The ground doubles its weight.",
  "The home rider ordered this weather, by the look of it. {condName} is her kit, head to toe.",
  "The {condName} tilts the match the home rider's way. Her {playerBestLabel} just got doubled.",
  "The home rider on a {condName} day, Barry — that's a woman in her element.",
  "You'd think the home rider chose the ground. {condName} rewards exactly her kit.",
  "The {condName} is the home rider's weather. Her {playerBestLabel} runs the lanes today.",
  "The opponent rode in to find {condName} waiting. The home rider's stats sing in these conditions.",
  "A {condName} day for the home rider, Barry — the ground is her second lance.",
  "The home rider's {playerBestLabel} gets a double portion today. {condName}'s on her side.",
  "The schedule did the home rider a favour, Barry. {condName} suits her like a glove.",
  "The opponent has to beat the ground before she beats the home rider. {condName} is not her friend.",
  "The home rider loves {condName}, Barry. The stats line up. The gold grows for her.",
  "The umpire didn't need to look at the kits — {condName} already tells us the home rider's got the edge.",
  "The home rider's rooster, the home rider's lance, and now {condName}'s rewarding her {playerBestLabel}. A perfect storm.",
  "The opponent would have preferred a classic day, Barry. {condName} rewards everything the home rider brings.",
  "The home rider wakes up to {condName} and smiles. Her kit was built for this.",
  "On {condName}, the home rider's {playerBestLabel} is a two-for-one. The opponent is on the back foot."
];
var COND_TILT_OPP = [
  "The {condName} suits the opponent, Barry. Her {oppBestLabel} counts double today.",
  "The home rider has to fight the ground AND the woman today. {condName} is the opponent's weather.",
  "This {condName} is on the opponent's side. The home rider needed anything but this.",
  "The {condName} just handed the opponent a dividend, Barry. Her {oppBestLabel} gets paid twice.",
  "The opponent prayed for {condName}, Barry. She got it. The home rider will suffer for it.",
  "{condName} on the lanes — bad news for the home rider. The opponent's stats were built for exactly this.",
  "The opponent on {condName} is like the opponent with extra batteries. The home rider will have to be clever.",
  "The ground is on the opponent's side today, Barry. {condName} doubles her {oppBestLabel}.",
  "The home rider would have preferred classic lanes, Reggie. {condName} is the opponent's weather.",
  "The opponent's kit was built for {condName}. The home rider will have to out-ride the ground as well.",
  "A rough draw for the home rider, Barry — {condName} suits the opponent and nothing else.",
  "The {condName} is a bonus for the opponent, Barry. The home rider is up against two opponents.",
  "The opponent's stats bloom in {condName}. The home rider will have to accept half the gold.",
  "The home rider drew the short stick with the weather, Barry. {condName} is the opponent's best friend.",
  "A {condName} day for the opponent, Reggie — her {oppBestLabel} rules the lanes.",
  "The opponent's on home turf today, Barry — not literally, but {condName} may as well be her living room.",
  "The ground is tilted against the home rider, Reggie. {condName} rewards the opponent's {oppBestLabel} every strike.",
  "The opponent came in with a smile. {condName} will do that to you when you've got the right stats.",
  "The home rider's task doubles today, Barry. Beat the opponent AND beat the {condName}.",
  "The opponent's {oppBestLabel} on {condName} is a hard thing to stop, Barry. The home rider knows it."
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
  "A {condName} day, Reggie, but neither the home rider nor the opponent will care much. Equal footing.",
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
  "The number to watch: {edgeStat}. The home rider has the edge on these lanes.",
  "Look at {edgeStat}, Barry. The home rider is up — and the condition doubles its weight. Game over on paper.",
  "The home rider wins this on {edgeStat} alone, Barry. Edge, and doubled by the ground.",
  "The single stat that matters today: {edgeStat}. The home rider leads. Match over before it starts.",
  "If the home rider loses this, Barry, write me out of the booth. {edgeStat} is in her favour and doubled.",
  "The home rider's {edgeStat} lead is clear, Barry. On a {condName} day that's not a lead, that's a chasm.",
  "There's your match-winner, Barry: {edgeStat}. The lanes make it count twice.",
  "The {edgeStat} gap is in the home rider's favour, Reggie. The {condName} day decides this one before the bar runs.",
  "The home rider has {edgeStat} and {condName} rewards it. The scoreboard is drawn before the first strike.",
  "If you want the one stat that wins this, Barry — {edgeStat}. The ground pays double.",
  "A clear {edgeStat} advantage in the home rider's pocket, Barry. {condName} doubles the yield.",
  "The lanes and the kit are both on the home rider's side today. The opponent is cooked.",
  "A real advantage in {edgeStat} on a {condName} day, Reggie — that's the match done.",
  "I've seen smaller edges win titles, Barry. The home rider's {edgeStat} is up and doubled."
];
var EDGE_OPP = [
  "The opponent's got the edge where it matters: {edgeStat}. And doubled today.",
  "{edgeStat} is the opponent's. The home rider will have to be clever.",
  "The edge is the opponent's, Barry — {edgeStat}, and the {condName} doubles it. The home rider needs an upset in the hands.",
  "Watch {edgeStat}, Barry. The opponent is up and the ground pays twice. The home rider is on the back foot before the bar runs.",
  "The opponent's {edgeStat} dominance is real. On {condName}, that's the whole match.",
  "The one stat that matters today: {edgeStat}, the opponent's. The {condName} doesn't help the home rider.",
  "A clear {edgeStat} edge for the opponent, Barry. On a {condName} day that's a mountain.",
  "The opponent has {edgeStat}. The home rider has to be perfect in the hands to overcome it.",
  "The ground and the stats both back the opponent, Barry. The home rider's task is steep.",
  "The opponent's cushion today is {edgeStat}, Reggie — and {condName} tells you it counts double.",
  "The opponent's advantage is where the ground pays: {edgeStat}. Doubled.",
  "You can see the scoreboard already, Barry — the opponent's {edgeStat} on a {condName} day.",
  "The home rider needs a miracle in the hands today, Barry. The opponent has {edgeStat}, doubled.",
  "The whole analysis today is one number: {edgeStat}, the opponent's. {condName} seals it."
];

/* FITNESS NOTE — only if someone is ragged or tired */
var FITNESS_OPP_TIRED = [
  "The opponent's legs went last week, Barry. She's riding in {oFit} shape today.",
  "The scouts have the opponent at {oFit} — a Masters final two days ago and it shows.",
  "The opponent's fitness is {oFit}. The home rider should press the gas.",
  "The opponent is {oFit}, Barry — a long week's catching her up. The home rider picks her moment.",
  "She's not fresh, the opponent. {oFit} on the meter. The home rider to extend the sets, if she's clever.",
  "Watch the opponent's legs late, Barry — {oFit} fitness coming in. The bar runs away from tired grannies."
];
var FITNESS_PLAYER_TIRED = [
  "The home rider comes in {pFit}, Barry. Not what she needed facing the opponent.",
  "The grannies' meter has the home rider at {pFit}. The opponent will know, and she will push.",
  "The home rider's {pFit} — the week has caught her. She needs to end this quick.",
  "{pFit} on the fitness, Barry. The home rider will feel the third set.",
  "The home rider is riding tired, {pFit}. The opponent should make her chase the bar."
];

/* RANK GAP (short, for underdog energy — only when ranks diverge sharply) */
var RANK_UPSET_WATCH = [
  "A wide gap between them, Barry. On paper it's not a match. Then again, we don't play on paper.",
  "An upset here would make the Monday paper. The opponent is well below in the rankings.",
  "The opponent shouldn't be close. If she is, that's the story of the day."
];
var RANK_CLASS_GAP = [
  "The home rider doesn't lose this one, Barry. Not with the gap between them.",
  "The opponent is here to make up the numbers. The gap is wide."
];

/* FLAVOUR: career nod (Reggie) */
var CAREER_OPP_TITLED = [
  "Mind, the opponent isn't just any granny. A proper résumé in the cabinet, Barry.",
  "The opponent's got silverware behind her, Barry. Not a woman to take lightly.",
  "A past world top-tenner, this one. Days gone, but she remembers.",
  "She's done it before, the opponent. Slams in the cabinet. The home rider meets history today.",
  "Don't be fooled by the current rank — the opponent peaked much higher. The talent's still in there.",
  "The opponent's got titles and the scars to go with them. The home rider has her hands full.",
  "A former top rider, the opponent. The rank today doesn't tell the whole story."
];
var CAREER_PLAYER_CAMPAIGN = [
  "The home rider's chasing her next title today. Shall we see?",
  "A Slam for the home rider's record this would be, Barry. One to add to the lot.",
  "The home rider's cabinet is filling up nicely, Barry. The appetite's clearly intact."
];

/* FLAVOUR: head-to-head (Reggie) */
var H2H_FIRST = [
  "First meeting between them, Barry. Nothing to go on but ranks and nerve.",
  "They haven't crossed lances before. We'll see how they read each other.",
  "Never met, these two. A fresh page, Barry.",
  "Their first time on the same card. The home rider and the opponent meet properly today."
];
var H2H_LEAD_PLAYER = [
  "The home rider leads this one {h2hWins}-{h2hLosses}. The opponent will have remembered.",
  "History's with the home rider: {h2hWins} and {h2hLosses}. The last was a decider.",
  "The home rider is up {h2hWins} to {h2hLosses} on the opponent. The ghost of past matches is in the saddle.",
  "The opponent's pattern against the home rider: lose. {h2hWins} to {h2hLosses} in the home rider's favour."
];
var H2H_LEAD_OPP = [
  "The opponent owns this fixture, Barry — {h2hWins}-{h2hLosses} the wrong way for the home rider.",
  "The home rider has not beaten the opponent yet. Not once in {h2hTotal} tries.",
  "{h2hWins} to {h2hLosses} — the wrong way for the home rider. The opponent knows how to beat her.",
  "The home rider has a Jedi-opponent in the opponent, Barry. The series is {h2hWins}-{h2hLosses} against her."
];
var H2H_LEVEL = [
  "Level in their series, {h2hWins} apiece. The next one tips it. A grudge if ever I saw one.",
  "{h2hWins} and {h2hWins}. One of them walks out with the lead.",
  "Dead even, Barry. {h2hWins} wins each. Today's the decider of the decade.",
  "You can't separate them on the record: {h2hWins} apiece. The crowd is in for a scrap."
];

/* FLAVOUR: form — peak rank vs current rank */
var FORM_OPP_HOT = [
  "The opponent's climbing fast, Barry. Back near her peak.",
  "The opponent is in form — knocking on the door of her peak again.",
  "A hot run from the opponent, Reggie. The world's seen her higher and she's getting there once more."
];
var FORM_OPP_SLUMPING = [
  "The opponent isn't the woman she was, Barry. The years catch everyone.",
  "A long way down for the opponent — still dangerous, but not what she was.",
  "The decline is on the opponent, Reggie. The home rider should press."
];
var FORM_PLAYER_HOT = [
  "The home rider is climbing, Barry. Her peak is close enough to see.",
  "The home rider's in form, Reggie. The direction is clear."
];

/* FLAVOUR: rooster and personal trait */
var ROOSTER_TRAIT = [
  "The opponent's rooster is a famous one, Barry. The pairing is well known on tour.",
  "You know the opponent — a character in her own right. And the rooster is as odd as she is.",
  "A classic pairing of granny and rooster in the saddle today. The booth loves this one.",
  "The opponent on her usual mount — a famous pairing, Reggie.",
  "Keep an eye on the opponent's mount, Barry. Not a bird to be underestimated."
];
var ROOSTER_PLAIN = [
  "The opponent rides out on her usual mount today. A steady bird, from what the stable says.",
  "The opponent's rooster is her partner for the season, Barry. They've been together a while."
];

/* FLAVOUR: specific gear references (lance + saddle). Keyed by item id. */
var GEAR_LANCE = {
  needle:   ["The opponent on the Knitting-Needle Lance today — small gold bonus but mean on misses.", "The Knitting-Needle on the opponent, Barry. Expensive kit, every strike counts.", "The opponent brought the Knitting-Needle Lance. A statement, Reggie."],
  oak:      ["The Grandpa's Oak Lance on the opponent — durable, heavy, no apologies.", "The opponent rides with the Oak Lance. Old school. Never let her down."],
  bamboo:   ["The opponent on the Featherlight Bamboo — fast swing, generous zone.", "The Bamboo on the opponent, Barry. Fastest lance in the lanes."],
  baguette: ["A Day-Old Baguette on the opponent, Barry. Novelty, or genius?", "The opponent rode in on a Baguette lance. Reggie, that's confidence or madness."],
  broom:    ["The opponent on the basic Broom-Handle. Trust and tradition."]
};
var GEAR_SADDLE = {
  foam:     ["The opponent on the Memory-Foam Cushion — a wider gold, Barry, but the bar starts faster.", "The Memory-Foam Cushion is the opponent's pick. Comfort has a price."],
  racing:   ["The opponent on the Racing Saddle today — leaning into speed, giving up accuracy.", "The Racing Saddle on the opponent. She wants a fast bar."],
  rocking:  ["The opponent rides a Rocking-Chair Saddle, Reggie. The gold stays wide all match.", "The Rocking-Chair on the opponent. She came for a long one."],
  skates:   ["Roller-Skate Saddle on the opponent — Barry, I never thought I'd say those words.", "The opponent on skates. The crowd is laughing. The bar is terrified."],
  teacosy:  ["Basic Tea-Cosy for the opponent. No tricks, no spend."]
};

/* FLAVOUR: experience / seasons on tour (Reggie or Barry) */
var VETERAN_OPP = [
  "The opponent's been on tour a long time, Barry. She's seen every ground on the calendar.",
  "A veteran, the opponent. Youth in her kit left years ago.",
  "Many seasons on tour for the opponent. She knows what every bar does before it moves.",
  "The experience is the opponent's, Barry. The home rider will have to be sharper."
];
var VETERAN_PLAYER = [
  "The home rider has a working career behind her now, Barry.",
  "Many seasons in and still going. The home rider's not here by accident."
];
var ROOKIE_OPP = [
  "The opponent's new on tour, Barry. Promise and nerves in equal measure.",
  "Fresh legs, the opponent. Experience may bite today."
];
var ROOKIE_PLAYER = [
  "A fresh season on tour for the home rider, Barry. Everything to prove.",
  "The home rider's a fresh name, Barry. Hungry eyes."
];

/* FLAVOUR: match stakes (final / Slam / Masters) */
var STAKES_SLAM = [
  "A Slam, Barry. Four of these a year, and the opponent knows what it means.",
  "The {tier}. Hearts rate higher on these courses, Reggie, you know it.",
  "Grand Slam weather. Everything in a career either passes through here or it doesn't."
];
var STAKES_FINAL = [
  "The final, Barry. Nothing bigger than this in the next month.",
  "A title on the line here. Four weeks of training points for the winner, pride for the loser.",
  "The {round} — all week's work in the next hour."
];
var STAKES_MASTERS = [
  "Big points up for grabs, Barry. These are the matches careers are measured on.",
  "A Masters round. Rankings move after these."
];
var STAKES_EARLY = [
  "Early days of the tournament. Winners go on, losers go home.",
  "Still the opening rounds, Barry. The home rider wants no slips here."
];

/* FLAVOUR: granny-sport humour. Dry Barry-wit, cranky-but-fond Reggie-wit, plenty of self-deprecation from
   both of them. Universal to any match — no stats, no names, no numbers. One recording per voice, forever. */
var BARRY_DRY = [
  "The lanes are warm. The grannies, debatable.",
  "A classic set of knees out there today, Reggie.",
  "Two riders, four hips. Generous bookies would even the odds.",
  "I've had my tea. The grannies have had theirs. We're all ready.",
  "The umpire's been doing this longer than the grannies, which is saying something.",
  "Someone's cardigan has gone missing from the stables. Pre-match rumours.",
  "A lovely afternoon, if your definition of lovely includes two women over eighty on roosters.",
  "The physio hasn't been seen for an hour. Always a good sign before a match.",
  "The rules say no knitting on the lance. The rules are tested every week.",
  "Both of them have been practising all week. Or napping. Hard to tell at this age.",
  "A proper afternoon of jousting ahead, assuming nobody misplaces their reading glasses.",
  "The grannies have been briefed on the rules. They had them explained to the grannies, then to me.",
  "I have a note from the producers. It says 'be nicer than Reggie.' Which is a low bar.",
  "The crowd is settled. The grannies are mounted. The commentators are lightly sedated.",
  "The lanes are chalked, the lances are wrapped, and the kettle is on. All systems go.",
  "A handshake earlier, Barry notes — brief, because the grannies have arthritis.",
  "The opponent's helmet is on backwards. I'll let the umpire mention it.",
  "Someone's granddaughter in the front row is on her phone. The grandmother will have words.",
  "A quiet word from the rulebook: no biscuits in the saddle. Ignored, as every week.",
  "We are moments from first strike. The grannies are moments from everything.",
  "A doctor's note from the home rider says she is fine. The doctor's note is older than I am.",
  "The umpire has signalled 'ready'. The grannies have signalled 'in a minute, dear.'",
  "I've been told to keep my commentary tight. I will try, though the grannies are ample.",
  "There is a note of calm in the air. Possibly because the grannies cannot hear us.",
  "A lovely light breeze. Perfect weather, if your bones don't object to light breezes.",
  "The lanes have been swept, the roosters fed, and the booth is almost awake.",
  "A long week on tour for both of them. And it's only Tuesday.",
  "Both grannies have waved to the crowd. Both grannies are not entirely sure where the crowd is.",
  "A reminder from the sponsors: Cluck Cola supports the sport. The sport cautiously tolerates Cluck Cola.",
  "We've been promised a thrilling match. We've been promised that most weeks. Sometimes it's even true."
];
var REGGIE_CRANK = [
  "In my day we jousted uphill. Both ways. And nobody complained.",
  "If they get through this without a hip giving out, I'll be the one surprised.",
  "Modern kit, modern lances. Nothing modern about either of these grannies.",
  "The two of them together have been riding for a hundred years. Combined, mind. Not each.",
  "They've got comfortable saddles now. We used to sit on the rooster.",
  "The grannies today — all show and no stride. Well, that one's got stride, I'll admit.",
  "Nobody's getting younger, Barry. Especially not these two.",
  "I'd be more scared of the queue at the post office than either of them. But a job's a job.",
  "They've both got fifty years on the youngest rider on tour. Not a flex. A fact.",
  "Someone remind me why we cover these again. Oh — the tea's free. Right.",
  "In my day the lances were wooden and the grannies were younger. Now it's the other way round.",
  "A rider used to walk out. Now they wheel out the chair, then they walk out.",
  "Grannies today complain the saddle is uncomfortable. Try riding without one, girls.",
  "I've been doing this forty years and the grannies keep getting older. Explain that to me.",
  "There's no fight in the modern game. Not literally — there used to be, actually.",
  "You can't do a proper joust on grass. You need gravel. And blood. Used to, anyway.",
  "The umpires let them restart if they fall off. In my time, if you fell off, the next rider took your chicken.",
  "A granny today asks for a cushion. A granny in my day asked for a lance.",
  "They give out medals for turning up now. I turned up for forty years and got a watch that doesn't work.",
  "The home rider has a sports psychologist. We had a flask of gin and a shout from the sidelines.",
  "A moment of silence for the real jousting, which died in 1986. The rest is theatre.",
  "The crowd clap politely now. Used to boo properly. Took skill. Lost art.",
  "You tell me these two are competitive. I say two grannies in a row are competitive — about who sits down first.",
  "No proper fall today, I'll wager. Just a graceful dismount and a hand from the umpire.",
  "Even the rooster looks bored, Barry. He's seen this before.",
  "The pensions out there are eye-watering. More than the prize money, mind.",
  "Both grannies have had the physio in all week. We never had a physio. We had whisky.",
  "Children these days don't play rough. Then they grow up and expect the grannies to.",
  "Two overbooked schedules, Barry. Bingo Tuesday, joust Wednesday, back rub Thursday.",
  "The modern joust has lost its edge. Partly because the grannies' knives are kept at reception."
];
var AGE_GAGS = [
  "The home rider has been riding since before colour television, Barry.",
  "Both of them remember the first joust. Not the first one they rode in — the first one ever.",
  "The opponent's been on tour longer than some of the crowd have been alive.",
  "You can hear the knees from here, Reggie.",
  "The grannies have more surgical pins between them than the rooster has feathers.",
  "The home rider won her first title when her grandchildren were in nappies.",
  "The opponent's warm-up is longer than the match. Eighty-two years to loosen up.",
  "If you stacked the years of both riders, you'd be looking back at Victoria.",
  "The home rider has a season ticket to the physio. Earned it.",
  "The opponent remembers when roosters cost sixpence. Yes, really.",
  "The two of them have seen eight prime ministers. Disliked seven.",
  "The home rider learnt to joust on a draft horse. They weren't fussy back then.",
  "The opponent's first lance was a broom. Still her favourite, by the sound of it.",
  "Both grannies were riding before penicillin, Reggie. Imagine the recoveries.",
  "A reminder: the home rider is older than the sport's governing body. By a lot.",
  "The opponent's grandchildren are also grandparents. Let that settle.",
  "You can read the home rider's age on her lance. It has rings, like a tree.",
  "The opponent still signs cheques. Younger riders have never seen a cheque.",
  "Both of them remember rationing. Both of them remember rations. Both of them ate biscuits.",
  "The home rider's doctor is older than most spectators. They go on holiday together."
];
var ROOSTER_GAGS = [
  "The opponent's rooster is older than most of the crowd, Barry.",
  "The home rider's rooster just yawned. These aren't young birds.",
  "Both roosters have had second breakfast, by the look of them.",
  "The opponent's rooster is on day three of a four-day diet. He's not pleased.",
  "The roosters have been together more years than most marriages, Reggie.",
  "The home rider's rooster went to bed early last night. The stable boy swears it.",
  "There's a rumour the opponent's rooster is thinking of retirement. The rider has not been told.",
  "The roosters out there today have seen more trophies than any rider on tour. From below, usually.",
  "Two roosters, five feathers between them. Approximately.",
  "The home rider's rooster appears to be moulting. Not ideal before a match.",
  "The opponent's rooster can count to three. The opponent is very proud of this.",
  "Both roosters have been to the vet this month. Both on friendly terms with the needle.",
  "The home rider's rooster won a county show in 1998. The trophy is in a drawer.",
  "There's a biscuit stashed in the opponent's saddle. The rooster knows.",
  "Both of these birds are fed better than I am, Reggie. Possibly better than you."
];
var TEA_GAGS = [
  "I've had three cups of tea, Reggie. The booth is caffeinated.",
  "The booth's biscuits are nearly gone. We need a quick match.",
  "Someone sent us a tin of custard creams, Barry. I'm not sharing.",
  "Let the record show the tea is at optimum temperature. Rare day.",
  "The kettle's been on for twenty minutes. Someone forgot to pour.",
  "I'd fight for the last ginger nut. Nobody in the booth should be surprised.",
  "A fresh pot has arrived. The match can begin.",
  "The biscuits, Reggie, are shortbread. Civilisation holds.",
  "Darjeeling in the pot today. Barry has standards.",
  "The intern has been dispatched for Hobnobs. The intern is ninety years old. We may be some time.",
  "I'll have a biscuit, you have your moment. Deal?",
  "The commentary tea has a slight thyme note. We're not sure why."
];
var BINGO_GAGS = [
  "If the match ends early, both grannies can make bingo night.",
  "I've heard it's a full house at Bramblewick tonight. Priorities, really.",
  "The home rider calls bingo on Thursdays. The crowd is terrified of her.",
  "The opponent would rather be at bingo. Who wouldn't.",
  "Two fat ladies, eighty-eight. The grannies prefer not to comment.",
  "Legs eleven, the home rider — those are not her stats, those are her bingo numbers.",
  "I'm told a bingo hall offered the opponent sponsorship. She accepted immediately.",
  "The joust ends, the bingo starts, the grannies run the circuit.",
  "In the crowd today: three bingo callers, one retired. Looking for work."
];
var KNITTING_GAGS = [
  "The home rider has been knitting through the week. Her scarf is longer than her career.",
  "The opponent's cardigan today is her own work. She is undefeated in cardigans.",
  "Both grannies could knit a jumper during the match if you gave them a longer bar.",
  "There's a knitting needle rule in the lance regulations. Yes, there is. No, it doesn't work.",
  "The home rider's grandchildren all wear her jumpers. Reluctantly.",
  "Someone in the booth has had a scarf made. It is Reggie. The scarf is purple.",
  "The opponent knits at the stables between matches. The rooster has three jumpers.",
  "If the match goes to five sets, both grannies will have finished a hat by the end."
];
var COMMENTATOR_AGE = [
  "I've been doing this match for forty years, Barry. The grannies look less tired than I feel.",
  "Reggie and I are older than the sport. I'd like a seat next to a radiator.",
  "A long week in the booth. My own hip has opinions about these matches.",
  "The booth stairs are steep, Reggie. One day I won't make it up.",
  "My own grandchildren are watching this. They'll want to know why I'm still working.",
  "I remember when this booth had a fireplace. Health and safety took it. Not sure why.",
  "Reggie, we've got fewer teeth between us than the grannies. I counted.",
  "The home rider is in better shape than I am, and I'm sitting down.",
  "I was told to lose weight before this season. The producers have given up.",
  "There's a note on the desk saying 'don't fall asleep'. It's for me.",
  "I've been in this booth longer than most grannies have been grannies.",
  "My knees are offering retirement advice. The booth is louder than my knees.",
  "A memo came round about mandatory hearing tests. I refused to open it.",
  "The young commentators are polite. I miss being disliked.",
  "A reminder from the physio: the booth chairs are not endorsed by chiropractors.",
  "I passed up a golf day for this. The grannies had better justify it.",
  "I've been covering this granny since she was middle-aged. That was decades ago.",
  "If you pay attention, Reggie, I can retire at the end of this set.",
  "A fact: the booth ceiling fan is older than the opponent. And more reliable.",
  "I've been given a company pen. It doesn't work. Neither do I, really."
];
var GRANNY_PRAISE = [
  "I'll say this for them, Reggie — eighty years old and still climbing on a rooster.",
  "Credit where it's due: both of them train harder than most of the junior tour.",
  "You can laugh, Reggie, but these grannies kept the sport alive through the lean years.",
  "A standing ovation for both of them, Barry. From the standing, that is.",
  "The home rider has forgotten more about jousting than you or I will ever know, Reggie.",
  "There's dignity out there, Reggie. Grey hair, iron hands, no complaints.",
  "Both of these grannies are legends. The sport should remember it more often.",
  "I'd watch either of them ride any day. And I'm not easy to please, Reggie.",
  "You tease them, Reggie, but they're out there and you're in here. Think about it.",
  "A respectful nod from the booth. Two grandmothers at the top of the game.",
  "Say what you like about the modern joust — these two have carried it.",
  "There's class in both of them, Barry. Quiet class. The best kind.",
  "I've seen younger riders come and go. These two stay. For a reason.",
  "Two careers measured in decades, Reggie. The least we can do is behave.",
  "Both of them stood for the national anthem earlier. Both of them stood. That counts."
];
var GRANNY_GENTLE_RIB = [
  "The home rider's taken a tactical seat in the saddle. Very tactical.",
  "The opponent is wearing a scarf. It isn't cold. It's a lifestyle.",
  "A small adjustment to the home rider's reading glasses. The lance is now visible.",
  "The opponent has decided to wave at the camera. The camera isn't on her.",
  "The home rider's shoulder bag is on the saddle. The rules allow it. Barely.",
  "The opponent's rooster has drifted sideways. The opponent hasn't noticed.",
  "A stewardess has corrected the home rider's helmet strap. Twice.",
  "The opponent's lance has a thank-you note taped to it. From the stable, apparently.",
  "The home rider waved to someone in the fifth row. It was her bank manager.",
  "The opponent has a packet of boiled sweets. Inside her gauntlet, Barry.",
  "The home rider is seated side-saddle for the warm-up. Elegant. Impractical.",
  "A photograph of the opponent with her grandchildren is tucked into the saddle. It falls out every match.",
  "The home rider's cardigan is buttoned up wrong. Her coach is in despair.",
  "A late request from the opponent for the rooster to be renamed 'Sir Peckington the Second'. Denied.",
  "The home rider has stashed a thermos behind the saddle. The rules are mysteriously silent on thermoses.",
  "Both grannies have waved to each other. Then forgotten which one they were fighting.",
  "A reminder from the opponent to the umpire: she has to leave by six for her programme.",
  "The home rider is wearing lipstick. It's a Tuesday. We don't know why.",
  "The opponent's lance is slightly short. Nobody has the heart to mention it.",
  "A small bag of knitting hangs from the home rider's saddle. It is almost a shawl."
];
var BOOTH_BANTER_BARRY = [
  "Reggie, that's unkind. — No, it's fair. Those are different.",
  "A bit harsh, Reggie. — Not harsh. Honest.",
  "I'd defend the grannies, Reggie, but they're grannies.",
  "The booth has a duty to be impartial. — I'm impartial. I dislike them equally.",
  "You've got to admire the courage, Reggie. — I'd admire a cup of tea more.",
  "Reggie, the sponsors won't like that. — The sponsors have given up on me, Barry.",
  "Please be gentle, Reggie, these are my notes. — I'm being gentler than I'd like.",
  "The young viewers are listening, Reggie. — They should learn something, then.",
  "I'll have to apologise for that one later. — Not for the first time, Barry.",
  "The producers are in your ear, Reggie. — I have the volume down.",
  "I was hoping for a nicer line, Reggie. — I was hoping for a biscuit.",
  "You know she's listening, Reggie. — She can't hear me. I checked.",
  "Reggie, the mother-in-law listens to this show. — My mother-in-law has moved on, Barry.",
  "You're getting cheeky, Reggie. — It's late. My cheekiness is up and my judgement is down.",
  "I had a note from the network, Reggie. — I've had several. I framed the rudest one."
];
var BOOTH_BANTER_REGGIE = [
  "Barry, you're a soft touch. — The grannies appreciate it, Reggie.",
  "You'll say they're brave next, Barry. — They are brave. Certifiably.",
  "I give the match ten minutes before someone naps. — Reggie, that's uncalled for.",
  "You lot in London booths — all polish, no teeth. — Reggie, we're in the same booth.",
  "I remember when the sport meant something. — It still does, Reggie. Just not to you.",
  "You're defending them again, Barry. — Someone has to. The booth lost the vote.",
  "Barry, you've gone soft since the hip replacement. — I was always soft, Reggie.",
  "I've met tougher opposition in bakeries. — Reggie, the bakery lady is also a former rider.",
  "You smile too much on camera, Barry. — Someone has to. You bring me down.",
  "That tea's too milky, Barry. — Milky tea is a sign of civilisation, Reggie.",
  "Your watch is wrong, Barry. — My watch is accurate. Time is wrong.",
  "You're going to apologise for me later, Barry. — I always apologise for you later.",
  "Say something sensible, Barry. Just once. — I did. You weren't listening.",
  "A booth with a view, Barry. And I have to look at you. — Thank you, Reggie.",
  "You are the sweetest man in sports, Barry. — That is not a compliment, Reggie."
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
/* Fill: only the finite dimensions (five stats, five conditions, four fitness states) get real substitutions.
   Every other placeholder — ranks, level numbers, set scores, head-to-head counts, career totals, venue,
   round, rooster name, trait — is stripped by the scrub pass below. The audio bank stays finite, the booth
   says "the opponent" and "the home rider" verbatim (that's a feature of the architecture, not a bug), and
   the surrounding grammar is normalised so sentences never read "ranked , and" or " — ." */
function fill(text, ctx, a) {
  if (!text) return "";
  var statLbl = function (k) { return (STAT_INFO[k] || {}).label || ""; };
  var statWhat = function (k) { return (STAT_INFO[k] || {}).what || ""; };
  return text
    .replace(/{condName}/g, ctx.condName || "classic")
    .replace(/{playerBestLabel}/g, statLbl(a && a.player && a.player.best && a.player.best.k))
    .replace(/{playerBestWhat}/g,  statWhat(a && a.player && a.player.best && a.player.best.k))
    .replace(/{playerWorstLabel}/g, statLbl(a && a.player && a.player.worst && a.player.worst.k))
    .replace(/{playerWorstWhat}/g,  statWhat(a && a.player && a.player.worst && a.player.worst.k))
    .replace(/{oppBestLabel}/g, statLbl(a && a.opp && a.opp.best && a.opp.best.k))
    .replace(/{oppBestWhat}/g,  statWhat(a && a.opp && a.opp.best && a.opp.best.k))
    .replace(/{oppWorstLabel}/g, statLbl(a && a.opp && a.opp.worst && a.opp.worst.k))
    .replace(/{oppWorstWhat}/g,  statWhat(a && a.opp && a.opp.worst && a.opp.worst.k))
    .replace(/{edgeStat}/g, a && a.edgeNote ? statLbl(a.edgeNote.stat) : "")
    .replace(/{pFit}/g, (a && a.pFit) || "fresh")
    .replace(/{oFit}/g, (a && a.oFit) || "fresh")
    /* Scrub pass: drop every other placeholder (`{foo}`, `{h2hWins}`, …) and the "level …" / "ranked …" /
       "…-…" scaffolding around it, then normalise whitespace and dangling punctuation. */
    .replace(/\s*(?:at\s+level|at\s+Level|level|Level|at|ranked|peaked at)\s+\{\w+\}/g, "")
    .replace(/\s+(?:at|at level|ranked|peaked at|by)\s*(?=[.,!?])/g, "")
    .replace(/\{\w+\}[–\-]\{\w+\}/g, "")
    .replace(/\{\w+\}-point/g, "narrow")
    .replace(/\{\w+\}-plus-first/g, "next")
    .replace(/\{\w+\}/g, "")
    /* Em-dash and dangling punctuation cleanup must come BEFORE whitespace cleanup so the leftover
       space before a period gets collapsed too. */
    .replace(/—\s*(?=[.,!?])/g, "")
    .replace(/\s+—\s+(?=[.,!?])/g, "")
    .replace(/—\s*—/g, "—")
    .replace(/,\s*,/g, ",")
    .replace(/\.,/g, ".")
    .replace(/,\s*\./g, ".")
    .replace(/\s+,/g, ",")
    .replace(/\s*\(\s*\)/g, "")
    .replace(/:\s*and\.?/g, ".")
    .replace(/:\s*\./g, ".")
    .replace(/\?\./g, "?")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+\./g, ".")
    .replace(/\s+\?/g, "?")
    .replace(/\s+!/g, "!")
    .replace(/\s+'s\b/g, "'s")
    .replace(/\.\s*\./g, ".")
    .replace(/^\s*[\.,!?—]+\s*/g, "")
    .replace(/\.\s+([a-z])/g, function (_, c) { return ". " + c.toUpperCase(); })
    .trim();
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

  /* 2. Strength focus — randomise WHO gets the spotlight so a long run of matches with the same best stat
     doesn't always talk about the same rider. Weighted by whose stat is actually higher but not deterministic. */
  var oppHigher = a.opp.best.v >= a.player.best.v;
  var strOpp = oppHigher ? rnd() < 0.7 : rnd() < 0.3;
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
  /* Slot 4 rotates so the booth doesn't harp on the same stat every match. 40% edge/weakness, 60% split between
     opp-weakness and a fresh perspective on either rider. Keeps the analysis varied even when the player's
     top stat never changes. */
  var slot4Pick = rnd();
  if (a.edgeNote && slot4Pick < 0.4) {
    var eBank = a.edgeNote.who === "player" ? EDGE_PLAYER : EDGE_OPP;
    out.push({ speaker: "reggie", text: fill(pickFresh(eBank, "edge" + a.edgeNote.who, rnd), ctx, a) });
  } else if (slot4Pick < 0.7) {
    var wBank = a.opp.worst.v <= a.player.worst.v ? WEAKNESS_OPP : WEAKNESS_PLAYER;
    out.push({ speaker: "reggie", text: fill(pickFresh(wBank, "weak", rnd), ctx, a) });
  } else {
    /* Swap in a granny-humour line instead of the analytical read, so the pre-match doesn't become
       a stats-only report. */
    var hBank = slot4Pick < 0.85 ? REGGIE_CRANK : AGE_GAGS;
    out.push({ speaker: "reggie", text: fill(pickFresh(hBank, slot4Pick < 0.85 ? "crank" : "age", rnd), ctx, a) });
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

  /* 5b. Humour layer — 65% of matches get a quick quip just before the closer. Barry dry-wit, Reggie cranky,
     age/rooster/tea gags, or a short booth banter line that reads like a reaction. Keeps the segment feeling
     like a conversation and not a scouting brief. */
  var humRoll = rnd();
  if (humRoll < 0.65) {
    var humBanks = [
      { s: "barry",  b: BARRY_DRY,            k: "bdry"  },
      { s: "reggie", b: REGGIE_CRANK,         k: "rcrank"},
      { s: "barry",  b: AGE_GAGS,             k: "age"   },
      { s: "barry",  b: ROOSTER_GAGS,         k: "roost" },
      { s: "barry",  b: TEA_GAGS,             k: "tea"   },
      { s: "barry",  b: BINGO_GAGS,           k: "bingo" },
      { s: "barry",  b: KNITTING_GAGS,        k: "knit"  },
      { s: "barry",  b: COMMENTATOR_AGE,      k: "comAge"},
      { s: "barry",  b: GRANNY_PRAISE,        k: "praise"},
      { s: "barry",  b: GRANNY_GENTLE_RIB,    k: "rib"   },
      { s: "barry",  b: BOOTH_BANTER_BARRY,   k: "bbar"  },
      { s: "reggie", b: BOOTH_BANTER_REGGIE,  k: "breg"  }
    ];
    var pick = humBanks[Math.floor(rnd() * humBanks.length)];
    out.push({ speaker: pick.s, text: fill(pickFresh(pick.b, pick.k, rnd), ctx, a) });
  }

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
  "Set to the home rider, by a whisker.",
  "The home rider edges it. The thinnest of margins.",
  "A tight one — the home rider takes it.",
  "The home rider nicks it. The crowd barely breathed.",
  "Hold on — the home rider has it.",
  "The home rider by a hair.",
  "The thinnest of sets to the home rider.",
  "The home rider with a scrappy set win.",
  "The margins hold for the home rider.",
  "The home rider finds enough.",
  "A nervy set win for the home rider.",
  "The home rider grinds the set out.",
  "That's the right way for the home rider.",
  "Just enough from the home rider.",
  "The home rider snatches the set.",
  "The whisker belongs to the home rider.",
  "A close-run set for the home rider.",
  "The home rider on the right side of the margins.",
  "A nail-biter — set to the home rider.",
  "The home rider holds her nerve."
];
var SET_WIDE_WIN = [
  "Set to the home rider, by a mile.",
  "A clean set from the home rider.",
  "Dominant from the home rider.",
  "The home rider with a statement set.",
  "The opponent wasn't invited to that set.",
  "The home rider dismantles her.",
  "A clinic from the home rider.",
  "The home rider runs away with it.",
  "No contest — the home rider's set.",
  "The opponent had no answer.",
  "The home rider with a crushing set.",
  "A total set for the home rider.",
  "The opponent fell apart in that set.",
  "The home rider showing why she's seeded.",
  "A proper hiding — the home rider rolls.",
  "The home rider with the air of a champion.",
  "Daylight — that's the home rider's set.",
  "A set to remember from the home rider.",
  "The opponent's rooster never got off the mark.",
  "A statement, Barry — the home rider at her best."
];
var SET_CLOSE_LOSS = [
  "Set to the opponent. The home rider had chances.",
  "A hard one for the home rider — nothing in it.",
  "The opponent takes it. The home rider within touching distance.",
  "A thin set lost by the home rider.",
  "The wrong way for the home rider.",
  "A nervy set to the opponent.",
  "The home rider loses on fine margins.",
  "A frustrating set for the home rider.",
  "The opponent edges it.",
  "The whisker belongs to the opponent.",
  "The home rider with a set that got away.",
  "A close set in the opponent's column.",
  "The home rider will replay that one.",
  "A thin loss for the home rider.",
  "The opponent on the right side of the margins.",
  "The home rider within a strike or two — set gone.",
  "A set lost by nothing much.",
  "The opponent grinds it out.",
  "A tight set to the opponent.",
  "The margins beat the home rider."
];
var SET_WIDE_LOSS = [
  "The opponent takes it clean. The home rider needs an answer.",
  "A rough set for the home rider.",
  "The opponent with a dominant set.",
  "That's a hiding from the opponent.",
  "A reality-check set for the home rider.",
  "The opponent with a clinic.",
  "A one-way set for the opponent.",
  "The home rider needs to regroup.",
  "The opponent rolls through.",
  "A set to put away quickly.",
  "The home rider outclassed in that set.",
  "A rough set for the home rider. The rooster is unsettled.",
  "A tough set for the home rider.",
  "The opponent runs the ground.",
  "The home rider needs an answer in the next.",
  "A proper beating of a set.",
  "The opponent's set, no question.",
  "The home rider in trouble now.",
  "A wide one to the opponent.",
  "The opponent dominates. The home rider must reset."
];

/* Pattern reads over all sets so far */
var MOMENTUM_STREAK_PLAYER = [
  "Two on the trot for the home rider. The booth smells blood.",
  "The home rider is in a rhythm now, Barry. Hard to stop a granny once she starts.",
  "That's two straight. The opponent's head is somewhere else.",
  "Two in a row, the home rider. The rooster has found its stride.",
  "The opponent can't buy a set now. Two straight for the home rider."
];
var MOMENTUM_STREAK_OPP = [
  "Two in a row for the opponent. The home rider's running out of road.",
  "The opponent building a wall. The home rider has to break something to come back.",
  "Trouble for the home rider. Two sets down and the bar getting faster.",
  "The opponent with the momentum, Barry — two on the bounce. The home rider is in trouble.",
  "The home rider's needs a miracle now. Two sets to the opponent."
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
  "The home rider answers back. From one down to level.",
  "A response from the home rider, Barry. She wasn't going quietly.",
  "There's the fight in the home rider. Levels the match."
];
var COMEBACK_OPP = [
  "The opponent with the response, Barry. The home rider's lead didn't last.",
  "The opponent wasn't finished. The match is level again.",
  "The home rider's cushion gone. The opponent draws level."
];

/* Perfect-strike call-outs */
var PERFECT_HAIL_PLAYER = [
  "Three gold strikes in that set from the home rider. Three. On this bar. Reggie, that's not jousting, that's clockwork.",
  "A flawless set from the home rider, Barry. Every strike on the line.",
  "The home rider with a perfect set. On {condName} day. She's reading the bar like a book.",
  "Three for three in gold, the home rider. The booth takes a bow.",
  "A perfect set from the home rider, Barry. The crowd knows what it's seen."
];
var PERFECT_HAIL_OPP = [
  "The opponent just posted a flawless set. The home rider's got to go up a gear or go home.",
  "Three straight gold for the opponent. That'll be in the papers.",
  "A clean sheet from the opponent that set. Ominous for the home rider.",
  "The opponent with three on the line. The home rider needs to shake her nerve.",
  "A perfect set from the opponent. Reggie, we've got a serious opponent on our hands."
];

/* Decider framing (if next set is match-decider) */
var DECIDER_INCOMING = [
  "Deciding set up next, Barry. Everything on this one.",
  "Here we go — all or nothing from here.",
  "The decider. If the home rider wants this, she takes it now.",
  "Match-point set coming up, Barry. The booth isn't breathing.",
  "This is for the match. The decider.",
  "Winner-takes-all set. The home rider and the opponent with nothing left but the hands."
];

/* Flat read (if nothing dramatic to say) */
var FLAT_SET = [
  "Set done. The home rider leads {setsWon}–{setsLost}.",
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
  "The home rider comes through, Barry. Little drama with it.",
  "A workmanlike win from the home rider. Business done.",
  "The home rider runs out winner, Barry. Rarely in doubt.",
  "A tidy performance from the home rider. No alarms.",
  "The home rider does the job. Off to the next round.",
  "A win in the diary for the home rider. Nothing much to review.",
  "Business as usual for the home rider. Next.",
  "Clean work from the home rider, Barry — and off.",
  "The home rider does what she had to. The seeds hold.",
  "A win without a sweat, Barry — the home rider through.",
  "The home rider with the professional job. See you tomorrow.",
  "No scare for the home rider today, Barry.",
  "The home rider's through. The crowd barely needed to shout.",
  "A straightforward win for the home rider. Rest the lance and move on.",
  "The home rider ticks the box, Barry. Nothing to detain us.",
  "The seed holds — the home rider through. Clean.",
  "Routine win for the home rider. The next round is where the test begins.",
  "The home rider does her job and leaves, Barry.",
  "An expected result, delivered on time.",
  "The home rider with a cruise, Reggie. Energy saved."
];
var POST_WIN_TIGHT = [
  "The home rider edges it. The scorecard says comfortable, the match said anything but.",
  "A gritty win for the home rider. Every set a scrap.",
  "The home rider finds a way, and she'll know she was in a fight.",
  "The hard way home for the home rider. The opponent earned every point.",
  "The home rider on the right side of a close one, Barry. The booth needs a sit-down.",
  "A proper fight. The home rider takes it. We earned our tea on that one.",
  "The home rider wins the dogfight, Barry. The margins were nothing.",
  "A nervy win for the home rider. She'll take it and move on.",
  "The home rider grinds it out, Barry. The crowd is spent.",
  "A win on fine margins, Reggie — the home rider through.",
  "The home rider with a result from the trenches, Barry.",
  "A handful of strikes decided this one, Barry. The home rider through.",
  "The home rider outlasted the opponent, Barry. Both of them should sit down.",
  "A hard-earned win for the home rider. On another day she loses this.",
  "The result is in the home rider's column, Barry. The match deserved more drama.",
  "The home rider with the sort of win that builds a career, Barry. The hard way.",
  "A proper tussle. The home rider takes it. Hats off to both.",
  "The home rider on the edge of her saddle for most of that one. Relief at the end.",
  "A win for the home rider, Barry — a brawler of a match.",
  "A gritty one for the home rider. Nothing came easy."
];
var POST_WIN_UPSET = [
  "Upset in the booth, Barry. The home rider beats the opponent. The ladder shook today.",
  "The home rider knocks out the opponent! That'll be a bruise on the opponent's season.",
  "The home rider with the shock of the round. Reggie, I need a seat.",
  "The giant falls. The home rider beats the opponent — a top-ranked rider going home.",
  "A result that'll run in the papers tomorrow: the home rider over the opponent.",
  "Not many saw this coming, Barry. The home rider dismisses the opponent.",
  "An upset for the ages. The home rider finishes off the opponent.",
  "Someone wake the editors — the home rider just beat the opponent, Barry. The favourite is out.",
  "The booth is on its feet, Barry. The home rider dumps the opponent out of the tournament.",
  "The opponent will not sleep tonight. The home rider with the upset.",
  "A result that writes itself: the home rider over the opponent, Barry. The ladder got a shake.",
  "The press box is scribbling. The home rider with the famous win.",
  "A moment, Barry — the home rider just beat a top rider. That doesn't happen every week.",
  "The opponent's machine breaks down against the home rider, Barry. Nobody expected it.",
  "What a story. The home rider dispatches the opponent.",
  "If you weren't watching, Barry, you missed one. The home rider knocks over the opponent.",
  "The underdog bites. The home rider beats the opponent. The season just got interesting.",
  "The opponent's weekend is ruined, Barry. The home rider with the shock result.",
  "A career-making win for the home rider over a top-ranked opponent.",
  "The crowd is making noise, Barry. The home rider just beat the opponent and the whole venue knows it."
];
var POST_LOSS_TIGHT = [
  "The opponent takes it. The home rider fought every point. On another day, Barry.",
  "A hard one for the home rider. She was a strike away in two of those sets.",
  "The home rider loses the tight one. The crowd stays on their feet for her.",
  "The opponent gets the W. The home rider will not have slept well on that defeat.",
  "The thinnest of losses for the home rider, Barry. The margins ate her alive.",
  "The home rider did everything but win. Pride intact, Barry.",
  "A heartbreaking loss for the home rider, Barry. Nothing to blame but the margins.",
  "The opponent with the W by the slimmest of margins. The home rider's head will be spinning.",
  "The booth hurts for the home rider. Any one of those sets could have flipped.",
  "The home rider loses a scrap, Barry. Both of them deserved to win.",
  "A handful of points across the match — and the home rider loses. Brutal.",
  "A match that could've gone either way, and the home rider's on the wrong side of it.",
  "The opponent the hard way, Barry. The home rider's campaign ends here.",
  "The home rider rode well enough to win most days, Barry. Not this one.",
  "A photo-finish loss for the home rider, Reggie. The ground was unkind.",
  "The hands held, the margins didn't. The home rider out.",
  "A hard one on the clipboard. Earned nothing but respect.",
  "A tight loss to the opponent, and the home rider will be rehearsing those strikes in her sleep.",
  "The opponent just about takes it. The home rider's head will take a while to clear.",
  "A loss that'll sting for weeks, Barry. The home rider on the wrong side of a few points."
];
var POST_LOSS_BLOWOUT = [
  "The opponent rolls through, Barry. The home rider never found her bar.",
  "A tough afternoon for the home rider. Never on terms.",
  "The home rider outclassed today. Back to the training lanes.",
  "The opponent with a message, Barry. The home rider will want to forget this one.",
  "A one-sided result. The home rider's rooster never got going.",
  "A heavy loss for the home rider. The opponent was on another level.",
  "A hiding, in old money. The home rider has nothing to review.",
  "The home rider outclassed, Barry. There'll be a long walk back to the stables.",
  "A proper beating, Reggie. The opponent runs the show.",
  "The home rider never had a sniff, Barry. The match was over by set two.",
  "A heavy afternoon for the home rider, Barry. Nothing worked.",
  "The opponent with the clinic, Barry. The home rider will replay nothing fondly.",
  "A one-way match, Reggie. The home rider's season takes a hit.",
  "The wrong way, Barry. The home rider was second to every strike.",
  "The opponent on another level today, Reggie.",
  "A loss that'll leave a mark, Barry. The scouts will have noted everything.",
  "No contest in the end, Barry.",
  "The home rider was outplayed from the first strike, Reggie.",
  "A result to put away quickly, Barry. Nothing to review.",
  "The opponent rode a clinic, Barry. The home rider's coach has work to do."
];
var POST_LOSS_UPSET = [
  "The home rider out at the hands of a lower-ranked opponent. The ladder bites back.",
  "Shock in the booth: the home rider beaten. The wrong way for the favourite.",
  "The opponent with the upset of the day. The home rider bows out.",
  "A lower-ranked opponent knocks over the home rider. One for the paper.",
  "The home rider loses to the opponent. A famous win for the underdog.",
  "A dark day for the home rider, Barry. The opponent takes the match.",
  "Nobody expected this — the opponent beats the home rider.",
  "The home rider out, Barry. The opponent with a career win.",
  "The underdog bites hard. The opponent dumps the home rider out of the tournament.",
  "A result the home rider will want to forget: beaten by a lower-ranked opponent.",
  "The ladder shook, Barry. The opponent knocks the home rider out.",
  "The home rider's day ends early at the hands of the opponent.",
  "A banana skin for the home rider, Barry. A lower-ranked opponent ends her run.",
  "The press is already asking what happened. The home rider out.",
  "The opponent will dine out on this one for years."
];

/* The tactical read of the match (Reggie) — ties to the pre-match analysis */
var POST_READ_STAT_WON = [
  "Her {playerBestLabel} did the work, Barry. Level {playerBestLv}, and it showed every strike.",
  "The home rider's {playerBestLabel} was always going to decide this — level {playerBestLv}, written on the scoreboard.",
  "You said it before the match: {playerBestLabel}. And there it was.",
  "The home rider rode her {playerBestLabel} to the finish, Barry. {playerBestLv} levels of it, every point.",
  "The engine today was the home rider's {playerBestLabel}, level {playerBestLv}. You could see her lean on it."
];
var POST_READ_COND_WON = [
  "The {condName} did half the job for the home rider. Her kit lined up with the ground.",
  "The home rider was built for this ground, Barry. {condName} rewarded {playerBestLabel} and she had it.",
  "{condName} day, the home rider's kit — a match made in heaven. The result was never in doubt.",
  "The home rider prayed for {condName} this morning, Barry. Looks like someone was listening."
];
var POST_READ_UPSET_WHY = [
  "The opponent's {oppWorstLabel} came home to roost, Barry. The home rider found the door and walked through.",
  "The upset was in the stats. The opponent's {oppWorstLabel} is a weakness, and the home rider swung the hammer.",
  "The opponent got away with {oppWorstLabel} for too long, Barry. The home rider punished it.",
  "The crack in the opponent's armour was {oppWorstLabel}. The home rider saw it and rode through."
];
var POST_READ_LOSS_STAT = [
  "The opponent's {oppBestLabel} level {oppBestLv} was the match, Barry. The home rider didn't have an answer.",
  "You can see where it went: the opponent's {oppBestLabel}. Level {oppBestLv}. Not many on tour have more.",
  "The opponent's {oppBestLabel} wrote the result today, Barry. Level {oppBestLv}, uncatchable.",
  "The home rider had no counter to the opponent's {oppBestLabel}, level {oppBestLv}. These things decide matches."
];
var POST_READ_LOSS_FITNESS = [
  "The home rider's legs went in the third set, Barry. The bar runs away from a tired granny.",
  "The home rider ran out of road, Barry. Fitness told in the end.",
  "The tank was empty on the home rider, Barry. The schedule beat her before the opponent did.",
  "A week catches up with you at this level. The home rider's fitness was the losing margin."
];

/* The strike pattern — perfects / flawless etc. */
var POST_PATTERN_FLAWLESS = [
  "Flawless sets from the home rider, Barry. Perfect strikes stacked up. That's going in the paper.",
  "A tidy card from the home rider. She was reading the bar like a map.",
  "Flawless work. The home rider was in another gear today, Barry.",
  "Ice in her hands, the home rider. Flawless sets and perfect strikes to spare."
];
var POST_PATTERN_CLUTCH = [
  "She found it when she had to, Barry. Perfect strikes in the sets that mattered.",
  "The {playerBestLabel} came out at the right time. Perfects over the match.",
  "Perfect strikes, Barry — and most on the big points. A nerveless performance.",
  "The hands held, the home rider. Perfects when it counted."
];

/* Closer — hand off to Interview */
var POST_CLOSERS = [
  { s: "barry",  t: "And we'll hear from the home rider in the interview room. Over to you." },
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

/* ── 8 · Enumerate every final text for the one-time batch TTS generation ────── */
/* Walks every bank, expands every placeholder that still varies (stat labels, condition name, fitness state)
   against its full value set, and yields the Cartesian product. The result is the complete, finite set of
   sentences the booth can ever say — ready to feed to ElevenLabs once, then cache in Vercel Blob.
   Returns [{ voice, text, bank, templateIndex, choice }…]. */
var FITNESS_STATES = ["fresh", "serviceable", "tired", "ragged"];
var COND_KEYS = ["classic", "mud", "wind", "heat", "green"];

function fillForEnumeration(template, choice) {
  var ctx = { condName: choice.cond || "classic" };
  var a = {
    player: { best: { k: choice.bestStat || "r", v: 10 }, worst: { k: choice.worstStat || "r", v: 10 }, favour: 0, talent: 70 },
    opp:    { best: { k: choice.bestStat || "r", v: 10 }, worst: { k: choice.worstStat || "r", v: 10 }, favour: 0, talent: 70 },
    rankGap: 0, condFavoursPlayer: false, condFavoursOpp: false,
    pFit: choice.pFit || "fresh", oFit: choice.oFit || "fresh",
    edgeNote: choice.edgeStat ? { who: "player", stat: choice.edgeStat, diff: 5 } : null
  };
  return fill(template, ctx, a);
}

function dimChoices(dims) {
  var options = { bestStat: STAT_KEYS, worstStat: STAT_KEYS, edgeStat: STAT_KEYS, cond: COND_KEYS, pFit: FITNESS_STATES, oFit: FITNESS_STATES };
  var sets = dims.map(function (d) { return options[d]; });
  if (sets.length === 0) return [{}];
  var out = [{}];
  dims.forEach(function (d, i) {
    var next = [];
    out.forEach(function (prefix) { sets[i].forEach(function (v) { var o = Object.assign({}, prefix); o[d] = v; next.push(o); }); });
    out = next;
  });
  return out;
}

function allBanks() {
  return [
    { bank: "OPENERS",              lines: OPENERS,              speaker: "barry",  dims: [] },
    { bank: "STRENGTHS_OPP",        lines: STRENGTHS_OPP,        speaker: "reggie", dims: ["bestStat"] },
    { bank: "STRENGTHS_PLAYER",     lines: STRENGTHS_PLAYER,     speaker: "reggie", dims: ["bestStat"] },
    { bank: "WEAKNESS_OPP",         lines: WEAKNESS_OPP,         speaker: "reggie", dims: ["worstStat"] },
    { bank: "WEAKNESS_PLAYER",      lines: WEAKNESS_PLAYER,      speaker: "reggie", dims: ["worstStat"] },
    { bank: "COND_TILT_PLAYER",     lines: COND_TILT_PLAYER,     speaker: "barry",  dims: ["cond", "bestStat"] },
    { bank: "COND_TILT_OPP",        lines: COND_TILT_OPP,        speaker: "barry",  dims: ["cond", "bestStat"] },
    { bank: "COND_TILT_EVEN",       lines: COND_TILT_EVEN,       speaker: "barry",  dims: ["cond"] },
    { bank: "COND_CLASSIC_LINES",   lines: COND_CLASSIC_LINES,   speaker: "barry",  dims: [] },
    { bank: "EDGE_PLAYER",          lines: EDGE_PLAYER,          speaker: "reggie", dims: ["edgeStat", "cond"] },
    { bank: "EDGE_OPP",             lines: EDGE_OPP,             speaker: "reggie", dims: ["edgeStat", "cond"] },
    { bank: "FITNESS_OPP_TIRED",    lines: FITNESS_OPP_TIRED,    speaker: "reggie", dims: ["oFit"] },
    { bank: "FITNESS_PLAYER_TIRED", lines: FITNESS_PLAYER_TIRED, speaker: "reggie", dims: ["pFit"] },
    { bank: "CAREER_OPP_TITLED",    lines: CAREER_OPP_TITLED,    speaker: "reggie", dims: [] },
    { bank: "CAREER_PLAYER_CAMPAIGN", lines: CAREER_PLAYER_CAMPAIGN, speaker: "reggie", dims: [] },
    { bank: "H2H_FIRST",            lines: H2H_FIRST,            speaker: "reggie", dims: [] },
    { bank: "H2H_LEAD_PLAYER",      lines: H2H_LEAD_PLAYER,      speaker: "reggie", dims: [] },
    { bank: "H2H_LEAD_OPP",         lines: H2H_LEAD_OPP,         speaker: "reggie", dims: [] },
    { bank: "H2H_LEVEL",            lines: H2H_LEVEL,            speaker: "reggie", dims: [] },
    { bank: "FORM_OPP_HOT",         lines: FORM_OPP_HOT,         speaker: "reggie", dims: [] },
    { bank: "FORM_OPP_SLUMPING",    lines: FORM_OPP_SLUMPING,    speaker: "reggie", dims: [] },
    { bank: "FORM_PLAYER_HOT",      lines: FORM_PLAYER_HOT,      speaker: "reggie", dims: [] },
    { bank: "ROOSTER_TRAIT",        lines: ROOSTER_TRAIT,        speaker: "reggie", dims: [] },
    { bank: "ROOSTER_PLAIN",        lines: ROOSTER_PLAIN,        speaker: "reggie", dims: [] },
    { bank: "VETERAN_OPP",          lines: VETERAN_OPP,          speaker: "reggie", dims: [] },
    { bank: "VETERAN_PLAYER",       lines: VETERAN_PLAYER,       speaker: "reggie", dims: [] },
    { bank: "ROOKIE_OPP",           lines: ROOKIE_OPP,           speaker: "reggie", dims: [] },
    { bank: "ROOKIE_PLAYER",        lines: ROOKIE_PLAYER,        speaker: "reggie", dims: [] },
    { bank: "STAKES_SLAM",          lines: STAKES_SLAM,          speaker: "reggie", dims: [] },
    { bank: "STAKES_FINAL",         lines: STAKES_FINAL,         speaker: "reggie", dims: [] },
    { bank: "STAKES_MASTERS",       lines: STAKES_MASTERS,       speaker: "reggie", dims: [] },
    { bank: "STAKES_EARLY",         lines: STAKES_EARLY,         speaker: "reggie", dims: [] },
    { bank: "RANK_UPSET_WATCH",     lines: RANK_UPSET_WATCH,     speaker: "reggie", dims: [] },
    { bank: "RANK_CLASS_GAP",       lines: RANK_CLASS_GAP,       speaker: "reggie", dims: [] },
    { bank: "BARRY_DRY",            lines: BARRY_DRY,            speaker: "barry",  dims: [] },
    { bank: "REGGIE_CRANK",         lines: REGGIE_CRANK,         speaker: "reggie", dims: [] },
    { bank: "AGE_GAGS",             lines: AGE_GAGS,             speaker: "barry",  dims: [] },
    { bank: "ROOSTER_GAGS",         lines: ROOSTER_GAGS,         speaker: "barry",  dims: [] },
    { bank: "TEA_GAGS",             lines: TEA_GAGS,             speaker: "barry",  dims: [] },
    { bank: "BINGO_GAGS",           lines: BINGO_GAGS,           speaker: "barry",  dims: [] },
    { bank: "KNITTING_GAGS",        lines: KNITTING_GAGS,        speaker: "barry",  dims: [] },
    { bank: "COMMENTATOR_AGE",      lines: COMMENTATOR_AGE,      speaker: "barry",  dims: [] },
    { bank: "GRANNY_PRAISE",        lines: GRANNY_PRAISE,        speaker: "barry",  dims: [] },
    { bank: "GRANNY_GENTLE_RIB",    lines: GRANNY_GENTLE_RIB,    speaker: "barry",  dims: [] },
    { bank: "BOOTH_BANTER_BARRY",   lines: BOOTH_BANTER_BARRY,   speaker: "barry",  dims: [] },
    { bank: "BOOTH_BANTER_REGGIE",  lines: BOOTH_BANTER_REGGIE,  speaker: "reggie", dims: [] },
    { bank: "SET_CLOSE_WIN",        lines: SET_CLOSE_WIN,        speaker: "barry",  dims: [] },
    { bank: "SET_WIDE_WIN",         lines: SET_WIDE_WIN,         speaker: "barry",  dims: [] },
    { bank: "SET_CLOSE_LOSS",       lines: SET_CLOSE_LOSS,       speaker: "barry",  dims: [] },
    { bank: "SET_WIDE_LOSS",        lines: SET_WIDE_LOSS,        speaker: "barry",  dims: [] },
    { bank: "MOMENTUM_STREAK_PLAYER", lines: MOMENTUM_STREAK_PLAYER, speaker: "reggie", dims: [] },
    { bank: "MOMENTUM_STREAK_OPP",  lines: MOMENTUM_STREAK_OPP,  speaker: "reggie", dims: [] },
    { bank: "MOMENTUM_SWING",       lines: MOMENTUM_SWING,       speaker: "reggie", dims: [] },
    { bank: "COMEBACK_PLAYER",      lines: COMEBACK_PLAYER,      speaker: "reggie", dims: [] },
    { bank: "COMEBACK_OPP",         lines: COMEBACK_OPP,         speaker: "reggie", dims: [] },
    { bank: "PERFECT_HAIL_PLAYER",  lines: PERFECT_HAIL_PLAYER,  speaker: "reggie", dims: ["cond"] },
    { bank: "PERFECT_HAIL_OPP",     lines: PERFECT_HAIL_OPP,     speaker: "reggie", dims: [] },
    { bank: "DECIDER_INCOMING",     lines: DECIDER_INCOMING,     speaker: "barry",  dims: [] },
    { bank: "FLAT_SET",             lines: FLAT_SET,             speaker: "barry",  dims: [] },
    { bank: "CLOSERS",              lines: CLOSERS.map(function (c) { return c.t; }), speaker: null, speakerArr: CLOSERS.map(function (c) { return c.s; }), dims: [] },
    { bank: "POST_WIN_EASY",        lines: POST_WIN_EASY,        speaker: "barry",  dims: [] },
    { bank: "POST_WIN_TIGHT",       lines: POST_WIN_TIGHT,       speaker: "barry",  dims: [] },
    { bank: "POST_WIN_UPSET",       lines: POST_WIN_UPSET,       speaker: "barry",  dims: [] },
    { bank: "POST_LOSS_TIGHT",      lines: POST_LOSS_TIGHT,      speaker: "barry",  dims: [] },
    { bank: "POST_LOSS_BLOWOUT",    lines: POST_LOSS_BLOWOUT,    speaker: "barry",  dims: [] },
    { bank: "POST_LOSS_UPSET",      lines: POST_LOSS_UPSET,      speaker: "barry",  dims: [] },
    { bank: "POST_READ_STAT_WON",   lines: POST_READ_STAT_WON,   speaker: "reggie", dims: ["bestStat"] },
    { bank: "POST_READ_COND_WON",   lines: POST_READ_COND_WON,   speaker: "reggie", dims: ["cond", "bestStat"] },
    { bank: "POST_READ_UPSET_WHY",  lines: POST_READ_UPSET_WHY,  speaker: "reggie", dims: ["worstStat"] },
    { bank: "POST_READ_LOSS_STAT",  lines: POST_READ_LOSS_STAT,  speaker: "reggie", dims: ["bestStat"] },
    { bank: "POST_READ_LOSS_FITNESS", lines: POST_READ_LOSS_FITNESS, speaker: "reggie", dims: [] },
    { bank: "POST_PATTERN_FLAWLESS", lines: POST_PATTERN_FLAWLESS, speaker: "barry", dims: [] },
    { bank: "POST_PATTERN_CLUTCH",  lines: POST_PATTERN_CLUTCH,  speaker: "barry",  dims: ["bestStat"] },
    { bank: "POST_CLOSERS",         lines: POST_CLOSERS.map(function (c) { return c.t; }), speaker: null, speakerArr: POST_CLOSERS.map(function (c) { return c.s; }), dims: [] }
  ];
}

export function enumerateAllFinals() {
  var out = [], seen = {};
  allBanks().forEach(function (b) {
    var choices = dimChoices(b.dims);
    b.lines.forEach(function (tpl, i) {
      var speaker = b.speaker || (b.speakerArr && b.speakerArr[i]) || "barry";
      choices.forEach(function (choice) {
        var text = fillForEnumeration(tpl, choice);
        if (!text) return;
        var key = speaker + "|" + text;
        if (seen[key]) return; seen[key] = 1;
        out.push({ voice: speaker, text: text, bank: b.bank, templateIndex: i, choice: choice });
      });
    });
  });
  return out;
}
