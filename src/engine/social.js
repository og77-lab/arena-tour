/* ═══ Engine / Social ═══ Knitter 🧶 — the granny social network. Everyone on tour has followers; posts are "knits".
   Followers grow with results, big titles and viral interviews, and they lift your fans: the more followers, the
   higher the crowd love your fans settle back to each week. In the stands, the crowd backs whichever rider it loves
   more — a small, steady edge (a slightly wider gold zone) for the crowd favourite, doubled on match-point strikes. */

import { fanBaseline, fansOf } from "./fans";
import { KNITS, REPLIES, HASHTAGS, PLACES } from "./knitPool";

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
function fill(t, v) { return t.replace(/\{(\w+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
export function handle(name) { var first = (name || "Granny").split(" ")[0].replace(/[^A-Za-z]/g, ""); return "@" + first + "Jousts"; }

/* The week's knits, from the big pool (engine/knitPool): yours (by how your week went), the champion's, your rival's,
   a random rider's, and one from the fan accounts. Many come with a selfie; some get a reply. Seeded by the week so
   the paper never changes once printed, and the slots use different salts so pools are walked independently. */
function mix(a, b) { var x = Math.imul((a >>> 0) ^ 0x9e3779b9, 2654435761) + Math.imul(b | 0, 40503); x ^= x >>> 15; x = Math.imul(x, 2246822519); x ^= x >>> 13; return x >>> 0; }
function from(arr, seed) { return arr && arr.length ? arr[(seed >>> 0) % arr.length] : ""; }
function dress(text, seed, vars) {
  var t = fill(text, vars);
  if (seed % 3 === 0) t += " " + from(HASHTAGS, seed >>> 4);
  return t;
}
function photo(seed, cat, vars) {
  /* selfie posts always have one; others about half the time */
  if (cat !== "selfie" && (seed >>> 7) % 2) return null;
  var place = from(PLACES, seed >>> 9);
  return { seed: seed, place: place, who: cat === "rooster" ? "rooster" : null };
}
export function weekKnits(o) {
  var base = (o.seed || 1) >>> 0, out = [], V = Object.assign({}, o.vars || {});
  function post(who, cat, salt, likesShare, replyFrom) {
    var sd = mix(base, salt), pool = KNITS[cat] || KNITS.random, place = from(PLACES, sd >>> 9);
    var vars = Object.assign({}, V, { place: place });
    var ph = photo(sd, cat, vars);
    if (ph && cat !== "selfie") vars.place = ph.place;
    var k = { who: who, text: dress(from(pool, sd), sd, vars), likes: Math.max(2, Math.round((who.followers || 100) * likesShare * (0.6 + (sd % 50) / 50))), photo: ph };
    if ((sd >>> 11) % 3 === 0 && replyFrom) k.reply = { name: replyFrom, text: from(REPLIES, sd >>> 13) };
    out.push(k);
  }
  var y = o.you;
  var myCat = y.rest ? "rest" : y.injured ? "injury" : y.title ? "win" : y.tired ? "tired" : y.wins >= 2 ? "deep" : "loss";
  if (base % 4 === 1 && !y.title && !y.rest) myCat = "selfie";
  post({ name: y.name, isP: true, followers: y.followers }, myCat, 1, 0.05, o.rival ? o.rival.name : null);
  if (o.champ && !o.champ.isP) post(Object.assign({}, o.champ, { followers: followersOf(o.champ, o.champ.rank) }), "champion", 2, 0.08, y.name);
  if (o.rival) post(Object.assign({}, o.rival, { followers: followersOf(o.rival, o.rival.rank) }), mix(base, 3) % 3 === 0 ? "selfie" : "rivalDig", 3, 0.06, y.name);
  if (o.random) post(Object.assign({}, o.random, { followers: followersOf(o.random, o.random.rank) }), ["random", "rooster", "selfie"][mix(base, 4) % 3], 4, 0.05, null);
  var fan = from(KNITS.fanAccounts, mix(base, 5));
  if (fan) out.push({ who: { name: fan.name, handle: fan.handle, fan: true, followers: 800 + (mix(base, 6) % 9000) }, text: fill(fan.text, V), likes: 20 + (mix(base, 7) % 600), photo: null });
  return out;
}
