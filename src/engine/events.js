/* ═══ Engine / Events ═══ Each week the tour runs several tournaments per tier at once — every one of the 1,000 riders
   plays one of them. This builds that week's events: a name, the conditions on the lanes, and a field (who signed up),
   all seeded from the season and week so the list is the same every time it's opened. Fields differ on purpose:
   some events draw the tier's best, some are softer. The player picks one; the rest are simulated. */

import { TIERS } from "../models/constants";
import { getRanked } from "../models/formulas";
import { resting } from "./fitness";

/* Lane conditions: what they do to the match (for both riders), what they pay, and how the arena looks */
export var CONDITIONS = {
  classic: { key: "classic", icon: "☀️", name: "Classic", short: "Normal lanes", about: "Dry earth, fair weather. Nothing changes.", effect: "No weather tricks", blurb: "Dry lanes, fair weather. Nothing to blame but your timing.", zone: 0, speed: 1, accel: 1, pts: 1, money: 1, w: {} },
  mud: { key: "mud", icon: "🌧️", name: "Muddy lanes", short: "Mud: faster bar", about: "Rain and mud: the roosters slip, so the bar runs faster. Riders with Slower Bar do best.", effect: "Bar 10% faster · Slower Bar count double", blurb: "The rooster slips: the bar runs 10% faster for both riders, and Slower Bar count double — the sharper granny wins the slide.", zone: 0, speed: 1.1, accel: 1, pts: 1, money: 1, w: { r: 2 } },
  wind: { key: "wind", icon: "🌬️", name: "Windy coast", short: "Wind: smaller gold", about: "Sea gusts shake the lance, so the gold zone is smaller. Riders with Bigger Gold do best.", effect: "Zone 2% narrower · Bigger Gold counts double", blurb: "Gusts narrow the gold zone by 2% for both riders, and Bigger Gold counts double. Seaside sponsors pay 10% more prize money.", zone: -2, speed: 1, accel: 1, pts: 1, money: 1.1, w: { p: 2 } },
  heat: { key: "heat", icon: "🔥", name: "Heatwave", short: "Heat: bar speeds up more", about: "Baking sun: the bar speeds up more after every strike. Riders with Less Speed-up do best.", effect: "Speeds up 40% more · Less Speed-up counts double", blurb: "Roosters wilt: the bar speeds up 40% more with every strike for both riders, and Less Speed-up counts double.", zone: 0, speed: 1, accel: 1.4, pts: 1, money: 1, w: { s: 2 } },
  green: { key: "green", icon: "🌼", name: "Village green", short: "Grass: bigger gold, less pay", about: "Soft village grass: a bigger gold zone, and stats matter less. Good for underdogs; pays a little less.", effect: "Zone 1.5% wider · stat gaps halved", blurb: "Soft grass and a friendly crowd: the gold zone is 1.5% wider for both riders and every stat gap counts half — an underdog's day out. Points and prize money are 10% lower.", zone: 1.5, speed: 1, accel: 1, pts: 0.9, money: 0.9, w: { r: 0.5, p: 0.5, f: 0.5, s: 0.5, g: 0.5 } }
};
var COND_KEYS = ["classic", "classic", "mud", "wind", "heat", "green"];

/* Field strength: a field full of the tier's best pays more ranking points, a soft one less */
export var FIELDS = {
  strong: { key: "strong", label: "Tough entrants", stars: 3, pts: 1.1 },
  mixed: { key: "mixed", label: "Mixed entrants", stars: 2, pts: 1 },
  soft: { key: "soft", label: "Weaker entrants", stars: 1, pts: 0.9 }
};

var PLACES = ["Puddleby", "Little Clucking", "Bramblewick", "Lower Henswick", "Cobbleford", "Featherstone", "Marmalade Bay", "Thistledown", "Gooseberry Hill", "Kettlewell",
  "Crumpet Cross", "Honeydale", "Pickering Vale", "Biscuit Point", "Nettlebed", "Teacake Green", "Wimbledon-on-Wold", "Saffron Hollow", "Bumblecombe", "Whistledown", "Oddsock Moor",
  "Primrose Hill", "Hollyhock Lane", "Mossbottom", "Larkspur Fields", "Peppercorn Pier", "Clatterbuck", "Fiddlestick Farm", "Plumstead", "Quill Bay"];
var SUFFIX = [["Fete Cup", "Village Classic", "Garden Party Joust", "Allotment Open", "Bake-Off Trophy"],
  ["Challenger", "County Cup", "Market Day Trophy", "Harvest Challenger"],
  ["Open", "Trophy", "Seaside Classic"],
  ["Championships", "Grand Prix"],
  ["Masters"]];
var SLAMS = [{ name: "The Coop Open", cond: "classic" }, { name: "The Swamp Slam", cond: "mud" }, { name: "Wimbledon-on-Wold", cond: "green" }, { name: "The Gale Cup", cond: "wind" }];

/* Small seeded random, so a week's events never change once seen */
function rng(seed) { var x = seed >>> 0 || 1; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }

var PER_TIER = [10, 5, 3, 2, 1];

/* The week's events, by tier. Grand Slam weeks have a single named Slam. */
export function weekEvents(S) {
  var ev = S.cal && S.cal[S.calIdx];
  if (!ev) return [];
  var ranked = getRanked(S), rankOf = {};
  ranked.forEach(function (p, i) { if (!p.isP) rankOf[p.id] = i + 1; });
  if (ev.type === "gs") {
    var sl = SLAMS[((ev.gsNum || 1) - 1) % SLAMS.length], t5 = TIERS[5];
    var field = ranked.filter(function (p) { return !p.isP && !resting(p); }).slice(0, t5.size).map(function (p) { return p.id; });
    return [mk(S, 5, 0, sl.name, sl.cond, "strong", field, rankOf, ranked)];
  }
  var out = [], used = {};
  for (var ti = 4; ti >= 0; ti--) { /* top tiers first, so riders who could play two tiers play the higher one */
    var T = TIERS[ti], n = PER_TIER[ti], r = rng(S.sNum * 100003 + S.calIdx * 1009 + ti * 97 + 7);
    var elig = ranked.filter(function (p, i) { return !p.isP && !used[p.id] && !resting(p) && i + 1 >= T.rankRange[0] && i + 1 <= T.rankRange[1]; });
    /* Each event centres on a slice of the tier's ranks: strong events on the top, soft ones lower down */
    var centres = []; for (var e = 0; e < n; e++) centres.push(n === 1 ? 0.2 : e / (n - 1));
    var pool = elig.slice();
    for (e = 0; e < n && pool.length >= 8; e++) {
      var c = centres[e];
      var pick = pool.map(function (p, idx) { return { p: p, d: Math.abs(idx / Math.max(1, pool.length - 1) - c) + r() * 0.35 }; })
        .sort(function (a, b) { return a.d - b.d; }).slice(0, T.size).map(function (x) { return x.p; });
      var ids = {}; pick.forEach(function (p) { ids[p.id] = 1; used[p.id] = 1; });
      pool = pool.filter(function (p) { return !ids[p.id]; });
      var fieldKey = c < 0.3 ? "strong" : c > 0.7 ? "soft" : "mixed";
      var cond = COND_KEYS[Math.floor(r() * COND_KEYS.length)];
      var name = PLACES[Math.floor(r() * PLACES.length)] + " " + SUFFIX[ti][Math.floor(r() * SUFFIX[ti].length)];
      out.push(mk(S, ti, e, name, cond, fieldKey, pick.map(function (p) { return p.id; }), rankOf, ranked));
    }
  }
  /* Names stay unique within a week */
  var seenName = {};
  out.forEach(function (x) { if (seenName[x.name]) x.name = x.name + " II"; seenName[x.name] = 1; });
  return out;
}

function mk(S, tier, idx, name, cond, fieldKey, field, rankOf, ranked) {
  var C = CONDITIONS[cond], F = FIELDS[fieldKey], T = TIERS[tier];
  var byRank = field.slice().sort(function (a, b) { return (rankOf[a] || 9999) - (rankOf[b] || 9999); });
  var npc = {}; ranked.forEach(function (p) { if (!p.isP) npc[p.id] = p; });
  return {
    id: S.sNum + "-" + S.calIdx + "-" + tier + "-" + idx, tier: tier, name: name, cond: cond, field: fieldKey, ids: field,
    ptsMul: Math.round(C.pts * F.pts * 100) / 100, moneyMul: C.money,
    champPts: Math.round(T.pts.reduce(function (a, b) { return a + b; }, 0) * C.pts * F.pts),
    champMoney: Math.round(T.money.reduce(function (a, b) { return a + b; }, 0) * C.money),
    seeds: byRank.slice(0, 2).map(function (id) { var p = npc[id] || {}; return { id: id, name: p.name, emoji: p.emoji || "", rank: rankOf[id] }; })
  };
}

export function conditionOf(key) { return CONDITIONS[key] || CONDITIONS.classic; }
