/* ═══ Engine / News ═══ Builds one weekly issue of The Daily Cluck from what happened this week.
   Pure data: the newspaper component turns it into stories. */

import { getRanked } from "../models/formulas";

export function rankMap(S) {
  var m = {}; getRanked(S).forEach(function (p, i) { m[p.isP ? 1 : p.id] = i + 1; });
  return m;
}

function who(p) { return { id: p.id, name: p.name, emoji: p.emoji || "" }; }

/* An issue that's always available: the tour as it stands, before (or between) your own stories */
export function buildSpecialEdition(S) {
  var ranked = getRanked(S), me = rankMap(S)[1];
  var last = S.calIdx > 0 ? S.cal[S.calIdx - 1] : null;
  var big = last && last.result && last.result.parallel ? last.result.parallel.filter(function (r) { return r && !r.playerEvent && r.winner; }).sort(function (a, b) { return b.tier - a.tier; })[0] : null;
  return {
    special: true, s: S.sNum, wk: "Special edition", at: 0, v: 0,
    you: { name: S.pName, rankAfter: me },
    world: { top: ranked.slice(0, 5).map(function (p, i) { return { p: p.isP ? { id: 1, name: S.pName, isP: true } : who(p), rank: i + 1, from: null }; }), newNo1: false, bigEvent: big ? { tier: big.tier, count: big.count, winner: big.winner } : null },
    legends: ranked.slice(0, 10).map(function (p, i) { return { p: p, rank: i + 1 }; }).filter(function (x) { return !x.p.isP; })
      .map(function (x) { return { id: x.p.id, name: x.p.name, emoji: x.p.emoji || "", rank: x.rank, titles: (x.p.best && x.p.best.titles) || 0 }; })
  };
}

/* The front page goes to the week's biggest story — not always you. Each candidate gets a newsworthiness score;
   a dash of luck and a penalty for repeating last issue's kind of lead keep the paper unpredictable.
   Lead types: you | slam | no1 | upsetTitle | shock | bigTitle */
export function pickLead(c, rnd) {
  rnd = rnd || Math.random;
  var y = c.you, cands = [];
  /* You: titles and finals sell papers; a quiet week rarely does */
  var youScore = y.champion ? 74 + y.tierIdx * 8 : y.final ? 56 + y.tierIdx * 6 : 46 + y.wins * 5 + y.tierIdx * 4 + Math.min(12, Math.max(0, y.rankJump) / 8);
  cands.push({ type: "you", score: youScore });
  /* A Grand Slam champion who isn't you is always big news */
  var slam = c.parallel.filter(function (r) { return r && r.tier === 5 && !r.playerEvent && r.winner; })[0];
  if (slam) cands.push({ type: "slam", score: 78, winner: slam.winner, upset: slam.upset || null });
  else if (y.tierIdx === 5 && c.myChamp) cands.push({ type: "slam", score: 74, winner: { id: c.myChamp.id, name: c.myChamp.name, emoji: c.myChamp.emoji || "" }, upset: null });
  if (c.newNo1 && !c.newNo1.p.isP) cands.push({ type: "no1", score: 72, p: c.newNo1.p });
  /* The most surprising champion of the week (big seed gap, bigger at higher tiers) */
  /* Gaps are measured against how wide the tier's field is, so a Futures long-shot isn't worth a Masters one */
  var span = [400, 400, 300, 170, 100, 64];
  var ups = c.parallel.filter(function (r) { return r && r.tier >= 1 && r.upset && r.upset.gap / span[r.tier] >= 0.3; })
    .map(function (r) { return { r: r, s: Math.min(24, (r.upset.gap / span[r.tier]) * 30) + r.tier * 5 }; }).sort(function (a, b) { return b.s - a.s; })[0];
  if (ups) cands.push({ type: "upsetTitle", score: 22 + ups.s, tier: ups.r.tier, upset: ups.r.upset });
  /* The single biggest giant-killing on tour */
  var sh = c.shock, rel = sh ? sh.gap / span[sh.tier] : 0;
  if (sh && sh.tier >= 1 && rel >= 0.5) cands.push({ type: "shock", score: 20 + Math.min(22, rel * 22) + sh.tier * 5, shock: sh });
  /* Otherwise the week's most prestigious title elsewhere */
  var big = c.parallel.filter(function (r) { return r && !r.playerEvent && r.winner && r.tier >= 3; }).sort(function (a, b) { return b.tier - a.tier; })[0];
  if (big && big.tier < 5) cands.push({ type: "bigTitle", score: 30 + big.tier * 6, tier: big.tier, winner: big.winner, count: big.count });

  cands.forEach(function (x) { x.score += rnd() * 14 - (x.type === c.prevLead ? 18 : 0); });
  cands.sort(function (a, b) { return b.score - a.score; });
  return cands[0];
}

/* before/after: S before this week's results and the saved S after them */
export function buildIssue(o) {
  var before = rankMap(o.before), after = rankMap(o.after);
  var npcById = {}; o.after.npcs.forEach(function (n) { npcById[n.id] = n; });

  /* Your matches this week, straight from the bracket */
  var matches = [];
  (o.bracket || []).forEach(function (rd, ri) {
    (rd || []).forEach(function (m) {
      if (!m || !m.w || !m.a || !m.b) return;
      if (m.a.isP || m.b.isP) { var foe = m.a.isP ? m.b : m.a; matches.push({ round: o.roundNames[ri], won: m.w.isP || m.w.id === 1, foe: who(foe), foeRank: before[foe.id] }); }
    });
  });
  var lostTo = matches.filter(function (m) { return !m.won; })[0] || null;
  var bestWin = matches.filter(function (m) { return m.won; }).sort(function (a, b) { return (a.foeRank || 9999) - (b.foeRank || 9999); })[0] || null;
  var h2h = lostTo && o.after.player.h2h && o.after.player.h2h[lostTo.foe.id] ? o.after.player.h2h[lostTo.foe.id] : [];

  /* Neighbours: riders who started the week within ±40 of you — who moved most (a big climber leaves the window, that's the story) */
  var myAfter = after[1], myBefore = before[1];
  var movers = o.after.npcs.filter(function (n) { return before[n.id] && Math.abs(before[n.id] - myBefore) <= 40; })
    .map(function (n) { return { p: who(n), from: before[n.id], to: after[n.id], d: before[n.id] - after[n.id] }; });
  var climber = movers.slice().sort(function (a, b) { return b.d - a.d; })[0];
  var faller = movers.slice().sort(function (a, b) { return a.d - b.d; })[0];
  var gym = Object.keys(o.trainLog || {}).map(function (id) { return { id: +id, lv: o.trainLog[id] }; })
    .filter(function (t) { return Math.abs((before[t.id] || 9999) - myBefore) <= 60; })
    .sort(function (a, b) { return b.lv - a.lv; })[0];

  /* World: top 5 with movement, the #1, and the week's biggest event */
  var top = getRanked(o.after).slice(0, 5).map(function (p, i) { return { p: p.isP ? { id: 1, name: o.after.pName, isP: true } : who(p), rank: i + 1, from: before[p.isP ? 1 : p.id] }; });
  var prevTop = getRanked(o.before)[0];
  var no1Before = prevTop && (prevTop.sp || 0) > 0 ? (prevTop.isP ? 1 : prevTop.id) : null;
  var bigEvent = (o.parallel || []).filter(function (r) { return r && !r.playerEvent && r.winner; }).sort(function (a, b) { return b.tier - a.tier; })[0] || null;

  /* Variety counter: each issue steps it by one, so every headline pool rotates and back-to-back issues never repeat */
  var prev = o.before.news && o.before.news[0];
  var v = prev && prev.v != null ? prev.v + 1 : Math.floor(Math.random() * 1000);

  var newNo1 = no1Before && String(no1Before) !== String(top[0].p.id);
  var lead = pickLead({
    you: { champion: !!o.wonTitle, tierIdx: o.tierIdx, final: !o.wonTitle && o.roundNames[o.pRound] === "Final", wins: matches.filter(function (m) { return m.won; }).length, rankJump: (before[1] || myAfter) - myAfter },
    myChamp: o.champ && !(o.champ.isP || o.champ.id === 1) ? o.champ : null,
    newNo1: newNo1 ? top[0] : null, parallel: o.parallel || [], shock: o.shock, prevLead: prev && prev.lead ? prev.lead.type : null
  });

  return {
    s: o.after.sNum, wk: o.weekLabel, at: Date.now(), v: v, lead: lead,
    you: {
      name: o.after.pName, kit: (o.after.player && o.after.player.kit) || null, tierIdx: o.tierIdx, tierName: o.tierName, reached: o.wonTitle ? "Champion" : o.roundNames[o.pRound], champion: !!o.wonTitle,
      wins: matches.filter(function (m) { return m.won; }).length, losses: matches.filter(function (m) { return !m.won; }).length,
      pts: o.pts, net: o.net, money: o.money, rankBefore: before[1], rankAfter: myAfter,
      bestWin: bestWin, lostTo: lostTo, rivalry: lostTo ? { w: h2h.filter(function (e) { return e.w; }).length, l: h2h.filter(function (e) { return !e.w; }).length } : null,
      away: o.away || null /* "rest" (a week off) or "slam" (not in the Slam): you didn't ride */
    },
    myEvent: { tierIdx: o.tierIdx, tierName: o.tierName, champ: o.champ ? (o.champ.isP || o.champ.id === 1 ? { id: 1, name: o.after.pName, isP: true } : who(o.champ)) : null },
    peers: { climber: climber && climber.d > 0 ? climber : null, faller: faller && faller.d < 0 ? faller : null, gym: gym ? { p: who(npcById[gym.id]), lv: gym.lv, rank: after[gym.id] } : null },
    world: { top: top, newNo1: newNo1, bigEvent: bigEvent ? { tier: bigEvent.tier, count: bigEvent.count, winner: bigEvent.winner, rank: after[bigEvent.winner.id] } : null }
  };
}
