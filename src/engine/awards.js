/* ═══ Engine / Awards ═══ The end-of-season gala: who won what this season, your season in numbers,
   the new hall of golden helmets, and a goal for next season. Measured from the snapshot taken on day one. */

import { getRanked } from "../models/formulas";
import { seasonSnapshot, trTotal } from "./seasonManager";
import { titleMix, titleValue, titleCount, diffTitles, seasonTitles } from "./titles";

function who(p, S) { return p.isP ? { id: 1, name: S.pName, emoji: "👵", isP: true } : { id: p.id, name: p.name, emoji: p.emoji || "" }; }
function best(list, f) { var b = null, bv = -Infinity; list.forEach(function (x) { var v = f(x); if (v > bv) { bv = v; b = x; } }); return b ? { p: b, v: bv } : null; }

/* Saves from before the snapshot existed: compare against now, so the awards still make sense (just milder) */
function startOf(S) { return S.start || seasonSnapshot(S); }

export function seasonAwards(S) {
  var start = startOf(S), ranked = getRanked(S), out = [];
  var rankNow = {}; ranked.forEach(function (p, i) { rankNow[p.isP ? 1 : p.id] = i + 1; });
  var idOf = function (p) { return p.isP ? 1 : p.id; };
  /* 🏆 The season's best haul of titles, weighed by the tournaments' champion points (a Masters beats four Challengers) */
  var mySeason = seasonTitles(S);
  function seasonOf(p) {
    if (p.isP) return mySeason;
    var now = (p.best && p.best.tt) || {}, before = (start.tt && start.tt[p.id]) || {};
    var d = diffTitles(now, before), n = ((p.best && p.best.titles) || 0) - (start.titles[p.id] || 0);
    if (titleCount(d) < n) d[0] = (d[0] || 0) + (n - titleCount(d));   /* titles from before types were kept count as Futures */
    return d;
  }
  var lance = best(ranked, function (p) { return titleValue(seasonOf(p)); });
  if (lance && lance.v > 0) out.push({ key: "lance", icon: "🏆", title: "The Golden Lance", sub: "The season's best haul of titles", who: who(lance.p, S), stat: titleMix(seasonOf(lance.p)),
    blurb: ["Her mantelpiece has filed for structural support.", "She's run out of shelf and started using the bath.", "Trophy polish sales are up 400% in her village."] });

  /* 🚀 Biggest climb */
  var climb = best(ranked, function (p) { var a = start.ranks[idOf(p)]; return a ? a - rankNow[idOf(p)] : 0; });
  if (climb && climb.v > 0) out.push({ key: "rocket", icon: "🚀", title: "The Rocket Rooster", sub: "Biggest climb of the season", who: who(climb.p, S),
    stat: "#" + start.ranks[idOf(climb.p)] + " → #" + rankNow[idOf(climb.p)],
    blurb: ["Her rooster has been tested. Twice. He's clean, just very motivated.", "Nobody's climbed that fast since Doris got stuck on the church roof.", "Nosebleeds reported at altitude."] });

  /* 🏋️ Most levels trained */
  var gym = best(ranked, function (p) { return trTotal(p.tr) - (start.tr[idOf(p)] || 0); });
  if (gym && gym.v > 0) out.push({ key: "gym", icon: "🏋️", title: "The Gym Rat", sub: "Most training levels gained", who: who(gym.p, S), stat: "+" + gym.v + " levels",
    blurb: ["The gym has named a treadmill after her. It's broken now.", "She does squats while the kettle boils. All of them.", "Her rooster has asked for a day off. Denied."] });

  /* 🎤 Your best line to the press this season */
  var quotes = (S.news || []).filter(function (n) { return n.s === S.sNum && n.interview && n.interview.quote; });
  var q = best(quotes, function (n) { return n.interview.delta || 0; });
  if (q) out.push({ key: "quote", icon: "🎤", title: "Quote of the Season", sub: "As voted by people who were there", who: who({ isP: true }, S), quote: q.p.interview.quote,
    stat: (q.v >= 0 ? "+" : "") + q.v + " fans", blurb: ["Printed on tea towels nationwide.", "Now a ringtone. Somehow.", "Read aloud at three separate weddings."] });

  /* ❤️ The crowd's favourite (you, if they love you) */
  var fans = S.player.fans != null ? S.player.fans : 20;
  if (fans >= 60) out.push({ key: "fans", icon: "❤️", title: "Fan Favourite", sub: "The crowd's darling", who: who({ isP: true }, S), stat: "❤️ " + fans + " / 100",
    blurb: ["Her fan club meets on Thursdays. There are biscuits.", "Grandchildren nationwide have her poster up. Upside down, but still."] });

  /* 🐌 Somebody has to be last */
  var last = ranked[ranked.length - 1];
  if (last && !last.isP) out.push({ key: "snail", icon: "🐌", title: "The Participation Ribbon", sub: "For turning up. Every week. Bless her.", who: who(last, S), stat: "#" + ranked.length,
    blurb: ["Her rooster is mostly decorative.", "She says she's \"playing the long game\". Very long.", "She's been asked to stop bringing a deckchair to the lanes."] });
  /* Every winner carries her world rank onto the stage */
  out.forEach(function (a) { a.who.rank = rankNow[a.who.isP ? 1 : a.who.id]; });
  return out;
}

/* Your season in numbers */
export function yourSeason(S) {
  var start = startOf(S), ranked = getRanked(S), me = 0;
  ranked.forEach(function (p, i) { if (p.isP) me = i + 1; });
  var played = S.cal.filter(function (e) { return e.done && e.result && (e.result.pPts || (e.result.parallel || []).length); });
  var titles = played.filter(function (e) { return e.result.won; }), tmix = titleMix(seasonTitles(S));
  var pts = played.reduce(function (a, e) { return a + (e.result.pPts || 0); }, 0);
  var scalp = null;
  (S.news || []).forEach(function (n) { if (n.s === S.sNum && n.you && n.you.bestWin && n.you.bestWin.foeRank && (!scalp || n.you.bestWin.foeRank < scalp.foeRank)) scalp = n.you.bestWin; });
  return { rankStart: start.ranks[1] || me, rankEnd: me, played: played.length, titles: titles.length, titlesMix: tmix, slamTitles: titles.filter(function (e) { return e.tier === 5; }).length,
    pts: pts, money: S.player.seasonMoney || 0, fans: S.player.fans != null ? S.player.fans : 20, scalp: scalp };
}

/* The top ten — golden helmets — and who's new among them */
export function hallOfHelmets(S) {
  var start = startOf(S);
  return getRanked(S).slice(0, 10).map(function (p, i) {
    var id = p.isP ? 1 : p.id;
    return Object.assign(who(p, S), { rank: i + 1, isNew: (start.ranks[id] || 999) > 10 });
  });
}

/* A target for next season, pitched just above where you finished */
export function nextGoal(rank, sNum) {
  var g = rank > 300 ? { rank: 300, text: "Break into the top 300 and ride in the Tour 250s" }
    : rank > 64 ? { rank: 64, text: "Reach the top 64 and ride in a Grand Slam" }
    : rank > 16 ? { rank: 16, text: "Make the top 16 and qualify for the Season Finals" }
    : rank > 10 ? { rank: 10, text: "Crack the top 10 and earn a golden helmet" }
    : rank > 1 ? { rank: 1, text: "Become world number one" }
    : { rank: 1, text: "Defend the crown. Everyone's coming for you now" };
  return Object.assign(g, { s: sNum });
}
