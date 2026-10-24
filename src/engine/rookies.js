/* ═══ Engine / Rookies ═══ Fresh blood: the grannies who joined the tour this season (engine/aging brings one in for
   every retiree). The class is everyone in her first season (y = 1) from season 2 on — in season 1 the whole tour is
   new to you, so nobody is singled out. A rookie's potential (her ceiling, pot) is shown as it is, as on her profile.
   About one in three is outspoken: she says what she thinks of the people she's about to ride. */

import { getRanked } from "../models/formulas";

function h(id, salt) { var x = Math.imul(((id || 7) >>> 0) * 2654435761 + (salt || 0) * 40503, 2246822519) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2654435761) >>> 0; return (x ^ (x >>> 13)) >>> 0; }
function pk(arr, seed) { return arr[(seed >>> 0) % arr.length]; }
function sh(name) { return String(name || "").split(" the ")[0]; }

export function isRookie(S, n) { return !!n && !n.isP && (S.sNum || 1) > 1 && (n.y || 1) === 1; }
export function outspoken(id) { return h(id, 61) % 3 === 0; }

/* The class with their place in the world, best prospects first (by ceiling, then by rank) */
export function rookieClass(S) {
  var rank = {}; getRanked(S).forEach(function (p, i) { if (!p.isP) rank[p.id] = i + 1; });
  return S.npcs.filter(function (n) { return isRookie(S, n); }).map(function (n) {
    return { id: n.id, name: n.name, emoji: n.emoji || "", talent: Math.round(n.skill || 60), pot: Math.round(n.pot || 0), loud: outspoken(n.id), rank: rank[n.id] || 1000, titles: (n.best && n.best.titles) || 0, peak: (n.best && n.best.rank) || 1001 };
  }).sort(function (a, b) { return b.pot - a.pot || a.rank - b.rank; });
}
/* The ones to watch: the highest ceilings in the class */
export function prospects(S, n) { return rookieClass(S).slice(0, n || 4); }

/* ── Rookie watch, week by week ── the rookie story of the week, if there is one worth printing:
   a rookie lifting a title beats everything; then a rookie breaking into the top 300 / 200 / 100 / 50 for the first time;
   then the class's biggest climber, if she climbed at least 60 places. before/after: S either side of the week. */
var MARKS = [50, 100, 200, 300];
export function rookieWatch(before, after, parallel) {
  var rb = {}, ra = {};
  getRanked(before).forEach(function (p, i) { if (!p.isP) rb[p.id] = i + 1; });
  getRanked(after).forEach(function (p, i) { if (!p.isP) ra[p.id] = i + 1; });
  var byId = {}; after.npcs.forEach(function (n) { byId[n.id] = n; });
  function card(n, extra) { return Object.assign({ p: { id: n.id, name: n.name, emoji: n.emoji || "" }, from: rb[n.id] || 1000, to: ra[n.id] || 1000, loud: outspoken(n.id), talent: Math.round(n.skill || 60), pot: Math.round(n.pot || 0) }, extra || {}); }
  var champ = (parallel || []).filter(function (r) { return r && !r.playerEvent && r.winner && byId[r.winner.id] && isRookie(after, byId[r.winner.id]); })
    .sort(function (a, b) { return b.tier - a.tier; })[0];
  if (champ) return card(byId[champ.winner.id], { kind: "title", tier: champ.tier, event: champ.winner.event || null });
  var rookies = after.npcs.filter(function (n) { return isRookie(after, n) && rb[n.id] && ra[n.id]; });
  var broke = null;
  rookies.forEach(function (n) {
    MARKS.forEach(function (m) { if (rb[n.id] > m && ra[n.id] <= m && (!broke || m < broke.mark)) broke = { n: n, mark: m }; });
  });
  if (broke) return card(broke.n, { kind: "mark", mark: broke.mark });
  var up = rookies.map(function (n) { return { n: n, d: rb[n.id] - ra[n.id] }; }).sort(function (a, b) { return b.d - a.d; })[0];
  if (up && up.d >= 60) return card(up.n, { kind: "climb" });
  return null;
}

/* ── What an outspoken rookie posts ── about a named target: the player, the world No. 1, or the week's champion */
var LOUD = [
  "Everyone keeps telling me {target} is the one to beat. I'll let you know when I've met her. Briefly.",
  "{target} has been on tour since rationing. I've got a rooster younger than her lance.",
  "Respect to {target}. Really. Now please move over, dear, some of us are going places.",
  "Ranked #{rank} and already bored. Where's {target}? I'd like a proper match.",
  "Heard {target} needs a nap between sets. I'll try to keep it quick for her.",
  "They say experience matters. So does a bus pass. {target} has both.",
  "{target} won't remember my name yet. She will.",
  "My scouting report on {target}: lovely cardigan. That's it. That's the report.",
  "First season, #{rank}. {target}, I've circled your name in the programme. In red.",
  "Somebody tell {target} the lanes have a speed limit and I don't plan to keep to it.",
  "Nothing personal, {target}. Just business. And a little bit personal.",
  "I watched {target} on the telly when I was sixty. I'm not sixty any more, and neither is she."
];
var KEEN = [
  "First season on the big tour. Pinching myself. Then my rooster pinched me too.",
  "#{rank} in the world. My grandchildren have made a banner. It's spelt wrong.",
  "Up to #{rank}! Mum always said I'd come to something. She meant bingo caller, but still.",
  "New on tour and loving every bruise. Thank you for the lovely welcome!",
  "Still learning. Mostly learning where it hurts. #{rank} though!"
];
var TAGS = ["#FreshBlood", "#NewOnTour", "#RookieSeason", "#ClassOfS{s}", "#WatchThisSpace", "#NextBigThing"];
export function rookieKnit(r, target, s, seed) {
  var line = r.loud && target ? pk(LOUD, seed) : pk(KEEN, seed);
  var tag = pk(TAGS, seed >>> 4).replace("{s}", s);
  return line.replace(/\{target\}/g, target ? sh(target) : "the champion").replace(/\{rank\}/g, r.to || r.rank) + " " + tag;
}
