/* ═══ Engine / Achievements ═══ Career counters (player.stats) and the badges they unlock (player.ach).
   checkAchievements only reads the save, so it can run after any change — a match, a training level,
   an interview, the Finals — and returns whatever has newly been earned. */

import { getRanked } from "../models/formulas";

var TIER_NAMES = ["Futures", "Challenger", "Tour 250", "Tour 500", "Masters", "Grand Slam"];

export var ACH_GROUPS = [
  { k: "tour", title: "On the tour" },
  { k: "lance", title: "With the lance" },
  { k: "ladder", title: "The ladder" },
  { k: "rival", title: "Feuds" },
  { k: "crowd", title: "Crowd & press" },
  { k: "gym", title: "Gym" }
];

function st(S) { return S.player.stats || {}; }
function tierTitles(S) { return st(S).tierTitles || {}; }
function trTotal(tr) { tr = tr || {}; return (tr.r || 0) + (tr.p || 0) + (tr.f || 0) + (tr.s || 0) + (tr.g || 0); }
function rankOf(S) { var r = 0; getRanked(S).forEach(function (p, i) { if (p.isP) r = i + 1; }); return r; }

/* g = group, t = title, d = how to earn it (shown on locked badges too), ok(S, rank) = earned? */
export var ACHIEVEMENTS = [
  { id: "first_win", g: "tour", icon: "🥚", t: "First Peck", d: "Win your first match", ok: function (S) { return (st(S).wins || 0) >= 1; } },
  { id: "wins_25", g: "tour", icon: "🐣", t: "Quarter Century", d: "Win 25 matches", ok: function (S) { return (st(S).wins || 0) >= 25; } },
  { id: "wins_100", g: "tour", icon: "🐓", t: "Cock of the Walk", d: "Win 100 matches", ok: function (S) { return (st(S).wins || 0) >= 100; } },
  { id: "first_title", g: "tour", icon: "🏆", t: "Silverware", d: "Win a tournament", ok: function (S) { return ((S.player.best || {}).titles || 0) >= 1; } },
  { id: "titles_5", g: "tour", icon: "🗄️", t: "Trophy Cabinet", d: "Win 5 titles at Tour 250 or above", ok: function (S) { var t = tierTitles(S); return (t[2] || 0) + (t[3] || 0) + (t[4] || 0) + (t[5] || 0) + ((S.player.best || {}).gsTitles && !t[5] ? S.player.best.gsTitles : 0) >= 5; } },
  { id: "title_0", g: "tour", icon: "⚪", t: "Futures Champion", d: "Win a Futures title", ok: function (S) { return !!tierTitles(S)[0]; } },
  { id: "title_1", g: "tour", icon: "🟢", t: "Challenger Champion", d: "Win a Challenger title", ok: function (S) { return !!tierTitles(S)[1]; } },
  { id: "title_2", g: "tour", icon: "🔵", t: "Tour 250 Champion", d: "Win a Tour 250 title", ok: function (S) { return !!tierTitles(S)[2]; } },
  { id: "title_3", g: "tour", icon: "🟣", t: "Tour 500 Champion", d: "Win a Tour 500 title", ok: function (S) { return !!tierTitles(S)[3]; } },
  { id: "title_4", g: "tour", icon: "💗", t: "Masters Champion", d: "Win a Masters title", ok: function (S) { return !!tierTitles(S)[4]; } },
  { id: "slam_debut", g: "tour", icon: "🎟️", t: "Slam Debut", d: "Ride in a Grand Slam", ok: function (S) { return (st(S).slams || 0) >= 1; } },
  { id: "slam_title", g: "tour", icon: "👑", t: "Slam Queen", d: "Win a Grand Slam", ok: function (S) { return ((S.player.best || {}).gsTitles || 0) >= 1; } },
  { id: "finals", g: "tour", icon: "🎩", t: "Sweet Sixteen", d: "Qualify for the Season Finals", ok: function (S) { return (st(S).finals || 0) >= 1; } },
  { id: "world_champ", g: "tour", icon: "🌍", t: "Queen of the World", d: "Win the Season Finals", ok: function (S) { return (S.champs || []).some(function (c) { return c.isP; }); } },

  { id: "gold_50", g: "lance", icon: "✨", t: "Golden Touch", d: "Land 50 strikes in the gold zone", ok: function (S) { return (st(S).gold || 0) >= 50; } },
  { id: "gold_250", g: "lance", icon: "🌟", t: "Midas Granny", d: "Land 250 strikes in the gold zone", ok: function (S) { return (st(S).gold || 0) >= 250; } },
  { id: "flawless", g: "lance", icon: "💎", t: "Flawless", d: "Win a set with all three strikes in gold", ok: function (S) { return (st(S).flawless || 0) >= 1; } },
  { id: "comeback", g: "lance", icon: "🔥", t: "Never Say Die", d: "Win a match after losing the first set", ok: function (S) { return (st(S).comebacks || 0) >= 1; } },
  { id: "decider_5", g: "lance", icon: "🧊", t: "Nerves of Steel", d: "Win 5 matches in a deciding set", ok: function (S) { return (st(S).deciders || 0) >= 5; } },
  { id: "giant", g: "lance", icon: "🪓", t: "Giant Killer", d: "Beat a rider ranked 100+ places above you", ok: function (S) { return (st(S).bestScalp || 0) >= 100; } },
  { id: "legends_3", g: "lance", icon: "⛑️", t: "Helmet Hunter", d: "Beat 3 golden-helmet legends (top 10)", ok: function (S) { return (st(S).legendWins || 0) >= 3; } },
  { id: "regicide", g: "lance", icon: "🗡️", t: "Regicide", d: "Beat the world number one", ok: function (S) { return (st(S).beatNo1 || 0) >= 1; } },

  { id: "top_500", g: "ladder", icon: "🪜", t: "Off the Bottom", d: "Reach the top 500", ok: function (S, r) { return r <= 500 || ((S.player.best || {}).rank || 1001) <= 500; } },
  { id: "top_100", g: "ladder", icon: "💯", t: "Top Hundred", d: "Reach the top 100", ok: function (S, r) { return r <= 100 || ((S.player.best || {}).rank || 1001) <= 100; } },
  { id: "top_10", g: "ladder", icon: "⛑️", t: "Golden Helmet", d: "Reach the top 10", ok: function (S, r) { return r <= 10 || ((S.player.best || {}).rank || 1001) <= 10; } },
  { id: "no_1", g: "ladder", icon: "🥇", t: "World Number One", d: "Become world number one", ok: function (S, r) { return r === 1 || ((S.player.best || {}).rank || 1001) === 1; } },
  { id: "season_2", g: "ladder", icon: "📆", t: "Old Hand", d: "Start a second season", ok: function (S) { return (S.sNum || 1) >= 2; } },

  { id: "rival", g: "rival", icon: "😤", t: "Arch-Enemy", d: "Gain a rival — keep meeting the same granny", ok: function (S) { return !!S.player.rival || (st(S).rivalsSettled || 0) > 0; } },
  { id: "revenge", g: "rival", icon: "😈", t: "Sweet Revenge", d: "Beat your rival", ok: function (S) { return (st(S).revenge || 0) >= 1; } },
  { id: "settled", g: "rival", icon: "🤝", t: "Feud Settled", d: "Lead a rival's head-to-head by 3 — she'll stop bothering you", ok: function (S) { return (st(S).rivalsSettled || 0) >= 1; } },

  { id: "fans_80", g: "crowd", icon: "❤️", t: "Darling of the Crowd", d: "Reach 80 fans", ok: function (S) { return (S.player.fans || 0) >= 80; } },
  { id: "viral", g: "crowd", icon: "📱", t: "Gone Viral", d: "Give an interview that goes viral", ok: function (S) { return (st(S).viral || 0) >= 1; } },
  { id: "promise", g: "crowd", icon: "🤞", t: "Woman of Her Word", d: "Keep a bold promise to the press", ok: function (S) { return (st(S).promises || 0) >= 1; } },

  { id: "gym_25", g: "gym", icon: "🏋️", t: "Gym Bunny", d: "Train 25 levels in total", ok: function (S) { return trTotal(S.player.tr) >= 25; } },
  { id: "gym_max", g: "gym", icon: "💪", t: "Maxed Out", d: "Take any stat to level 20", ok: function (S) { var t = S.player.tr || {}; return ["r", "p", "f", "s", "g"].some(function (k) { return (t[k] || 0) >= 20; }); } },
  { id: "gym_100", g: "gym", icon: "🦾", t: "Bionic Granny", d: "Train every stat to the max", ok: function (S) { return trTotal(S.player.tr) >= 100; } }
];

export function achievementById(id) { return ACHIEVEMENTS.filter(function (a) { return a.id === id; })[0]; }

/* Newly earned achievement ids (not yet in player.ach) */
export function checkAchievements(S) {
  if (!S || !S.player) return [];
  var have = S.player.ach || {}, r = rankOf(S);
  return ACHIEVEMENTS.filter(function (a) { return !have[a.id] && a.ok(S, r); }).map(function (a) { return a.id; });
}

/* Fold one finished tournament into the career counters. log = the tournament's match log */
export function tallyTournament(stats, log, opts) {
  var s = Object.assign({}, stats || {});
  s.tierTitles = Object.assign({}, s.tierTitles || {});
  (log || []).forEach(function (m) {
    s.gold = (s.gold || 0) + (m.gold || 0);
    s.flawless = (s.flawless || 0) + (m.flawless || 0);
    if (!m.won) return;
    s.wins = (s.wins || 0) + 1;
    var seq = m.seq || "";
    if (seq.charAt(0) === "L") s.comebacks = (s.comebacks || 0) + 1;
    var sc = (m.sc || "").split("-"), need = Math.ceil((opts.bo || 3) / 2);
    if (sc.length === 2 && +sc[0] === need && +sc[1] === need - 1) s.deciders = (s.deciders || 0) + 1;
    if (m.oppRank && m.myRank) {
      s.bestScalp = Math.max(s.bestScalp || 0, m.myRank - m.oppRank);
      if (m.oppRank <= 10) s.legendWins = (s.legendWins || 0) + 1;
      if (m.oppRank === 1) s.beatNo1 = (s.beatNo1 || 0) + 1;
    }
    if (opts.rivalId && m.oppId === opts.rivalId) s.revenge = (s.revenge || 0) + 1;
  });
  if (opts.tierIdx === 5) s.slams = (s.slams || 0) + 1;
  if (opts.wonTitle) s.tierTitles[opts.tierIdx] = (s.tierTitles[opts.tierIdx] || 0) + 1;
  if (opts.promiseKept) s.promises = (s.promises || 0) + 1;
  return s;
}

export { TIER_NAMES };
