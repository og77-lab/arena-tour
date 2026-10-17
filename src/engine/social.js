/* ═══ Engine / Social ═══ Knitter 🧶 — the granny social network. Everyone on tour has followers; posts are "knits".
   Followers grow with results, big titles and viral interviews, and they lift your fans: the more followers, the
   higher the crowd love your fans settle back to each week. In the stands, the crowd backs whichever rider it loves
   more — a small, steady edge (a slightly wider gold zone) for the crowd favourite, doubled on match-point strikes. */

import { fanBaseline, fansOf } from "./fans";

export var NETWORK = { name: "Knitter", icon: "🧶", post: "knit" };
export var START_FOLLOWERS = 120;

function h(id, salt) { var x = Math.imul((id || 7) * 2654435761 + (salt || 0) * 40503, 2246822519) >>> 0; x ^= x >>> 15; return x >>> 0; }

/* ── Followers ── */
export function followersOf(p, rank) {
  if (!p) return 0;
  if (p.isP || p.id === 1) return p.followers != null ? p.followers : START_FOLLOWERS;
  var r = Math.max(1, rank || 1000), titles = (p.best && p.best.titles) || 0;
  var base = 200 + 420000 / Math.pow(r, 1.12) + titles * 400;
  return Math.round(base * (0.6 + (h(p.id, 3) % 100) / 100));   /* some grannies are just more online */
}
export function fmtFollowers(n) { return n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e4 ? Math.round(n / 1000) + "K" : n >= 1000 ? (n / 1000).toFixed(1) + "K" : String(n); }

/* How many follow you this week: results, a title (huge for a Slam), a viral moment, all scaled by your fame */
export function followersGain(o) {
  var fame = o.rank <= 10 ? 6 : o.rank <= 50 ? 3 : o.rank <= 200 ? 1.6 : o.rank <= 500 ? 1 : 0.6;
  var g = 6 + Math.max(0, o.fanDelta || 0) * 18 + (o.wins || 0) * 8 + (o.title ? (o.slam ? 2500 : 250) : 0);
  var lose = Math.min(0, o.fanDelta || 0) * 12;
  return Math.round((g + lose) * fame);
}

/* Followers lift the crowd love you drift back to each week: 100 followers → +0, 1K → +3, 10K → +6, 100K → +9 */
export function followersLift(f) { return Math.max(0, Math.min(15, Math.round(Math.log10(Math.max(1, f)) * 3 - 6))); }

/* ── Crowd love for any rider (yours is tracked; a rival's comes from her fame and following) ── */
export function crowdLove(p, rank) {
  if (!p) return 0;
  if (p.isP || p.id === 1) return fansOf(p);
  return Math.max(5, Math.min(95, fanBaseline(rank) + followersLift(followersOf(p, rank)) - 4 + (h(p.id, 5) % 9)));
}
/* The stands back the crowd favourite: up to +1.5% gold zone for her (or you), from the gap in crowd love */
export function crowdEdge(myLove, herLove) {
  var d = Math.max(-1.5, Math.min(1.5, (myLove - herLove) / 25));
  return { me: Math.max(0, d), her: Math.max(0, -d), d: d };
}

/* ── Knits for the paper ── */
var MINE_WIN = [
  "Trophy's on the mantelpiece next to the biscuit tin. Both are mine. #Champion #{tier}",
  "Told the girls at bingo I'd win {tier}. Now they owe me a custard cream each. 🏆",
  "{rooster} would like everyone to know he did most of the work. He did not. 🐓",
  "Won {tier}! Going to have a little lie down now. A long one. 😴"
];
var MINE_DEEP = [
  "{round} at {tier}! My knees have filed a formal complaint. #StillGotIt",
  "Not the trophy this week but {rooster} got a lovely compliment on his comb. 💅",
  "Beat {beat} today. Sent her a sympathy scone. 🧁"
];
var MINE_LOSS = [
  "Lost to {foe} at {tier}. In my defence, the sun was in my eyes. Indoors. 🙄",
  "{rooster} and I are taking a moment. And a biscuit. And another moment. #NextWeek",
  "Out early at {tier}. Used the spare time to reorganise my button tin. Productive week really.",
  "{foe} won fair and square. I'm still writing her a strongly worded letter. ✉️"
];
var MINE_REST = [
  "Week off. Feet up, slippers on, rooster in the bath. Do NOT call. 🛁",
  "Physio says rest. So I am resting. Aggressively. 😤🧶",
  "Skipping this week to knit {rooster} a little cardigan. Priorities. 🐓🧥"
];
var CHAMP = [
  "{tier} CHAMPION! Dedicating this to my late husband's moustache. 🥇",
  "Who's got two thumbs and a {tier} trophy? This granny. 👍👍",
  "Big thank you to my rooster, my physio, and whoever left the gate open at the bakery. 🏆"
];
var RIVAL = [
  "Funny how some grannies only win when I'm not in the draw. No names. 👀 #{you}",
  "Spotted {you} at the garden centre. Buying a new lance? Won't help, dear. 🌷",
  "My rooster asked who {you} is. I said 'nobody important, darling'. 🐓"
];
var RANDOM = [
  "Rooster refused to joust today because a pigeon looked at him funny. Professional athlete, apparently.",
  "New knitting pattern: a tea-cosy saddle with go-faster stripes. DM for details. 🧶",
  "Physio says I need to rest. Physio clearly hasn't met me. 💪",
  "Mud lanes again next week. My good cardigan is NOT coming. 🌧️",
  "Reminder: the lance goes at the OTHER granny. Asking for a friend. 🤦",
  "Hot take: the village green is just a big lawn with ambition. 🌼",
  "Got an autograph request today! It was a parking ticket, but still."
];
function pick(arr, seed) { return arr[seed % arr.length]; }
function fill(t, v) { return t.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
export function handle(name) { var first = (name || "Granny").split(" ")[0].replace(/[^A-Za-z]/g, ""); return "@" + first + "Jousts"; }

/* Three knits for the week: yours, the week's big champion's, and your rival's (or someone random) */
export function weekKnits(o) {
  var seed = (o.seed || 1) >>> 0, out = [];
  var mine = o.you.rest ? MINE_REST : o.you.title ? MINE_WIN : o.you.wins >= 2 ? MINE_DEEP : MINE_LOSS;
  out.push({ who: { name: o.you.name, isP: true }, text: fill(pick(mine, seed), o.vars), likes: Math.max(3, Math.round(o.you.followers * (0.04 + (seed % 7) / 100))) });
  if (o.champ && !o.champ.isP) out.push({ who: o.champ, text: fill(pick(CHAMP, seed >> 3), o.vars), likes: Math.round(followersOf(o.champ, o.champ.rank) * 0.08) });
  if (o.rival) out.push({ who: o.rival, text: fill(pick(RIVAL, seed >> 5), o.vars), likes: Math.round(followersOf(o.rival, o.rival.rank) * 0.06) });
  else if (o.random) out.push({ who: o.random, text: pick(RANDOM, seed >> 7), likes: Math.round(followersOf(o.random, o.random.rank) * 0.05) });
  return out;
}
