/* ═══ Engine / Season Manager ═══ Calendar + season creation + cross-season carryover */

import { TOTAL_EVENTS } from "../models/constants";
import { mkNPCs } from "./npcGenerator";

/* Season calendar: 4 blocks × (4 swing weeks + 1 Grand Slam) = 20 events */
export function mkCalendar() {
  var cal = [];
  for (var gs = 0; gs < 4; gs++) {
    for (var sw = 0; sw < 4; sw++) {
      cal.push({ type: "swing", block: gs + 1, week: sw + 1, tier: null, done: false, result: null });
    }
    cal.push({ type: "gs", block: gs + 1, gsNum: gs + 1, tier: 5, done: false, result: null });
  }
  return cal;
}

/* Build a fresh season. If `prev` is passed, carries over NPCs, player career data, defending slots, etc. */
export function mkSeason(name, num, prev) {
  var emptyRes = []; for (var zi = 0; zi < TOTAL_EVENTS; zi++) emptyRes.push(0);
  var npcs, def = emptyRes.slice();
  if (prev) {
    npcs = prev.npcs.map(function (n) { return Object.assign({}, n); });
    def = prev.player.res || def;
  } else {
    npcs = mkNPCs();
  }
  var ptr = prev ? Object.assign({ s: 0, g: 0 }, prev.player.tr) : { r: 0, p: 0, f: 0, s: 0, g: 0, tp: 0 };
  var pBest = prev ? prev.player.best : { rank: 1001, peakS: 0, titles: 0, gsTitles: 0, finals: 0 };
  var pSP = 0; for (var di = 0; di < TOTAL_EVENTS; di++) pSP += (def[di] || 0);
  var res = []; for (var ri = 0; ri < TOTAL_EVENTS; ri++) res.push(0);
  /* Rank history — carry over last 20 entries from previous season */
  var rankHist = prev && prev.player.rankHist ? prev.player.rankHist.slice(-20) : [];
  /* Head-to-head records persist across seasons */
  var h2h = prev && prev.player.h2h ? prev.player.h2h : {};
  /* Career timeline persists across seasons; seed on fresh game */
  var timeline = prev && prev.player.timeline ? prev.player.timeline.slice() : [{ type: "start", s: num || 1, w: 0 }];
  return {
    pName: name || "Champion", sNum: num || 1, npcs: npcs, cal: mkCalendar(), calIdx: 0,
    player: {
      id: 1, isP: true,
      sp: pSP, ap: prev ? prev.player.ap : 0,
      tr: ptr, best: pBest,
      def: def, res: res,
      money: prev ? prev.player.money : 0, seasonMoney: 0,
      rankHist: rankHist, h2h: h2h, timeline: timeline
    },
    champs: prev ? prev.champs : [],
    tHist: prev ? prev.tHist : [],
    phase: "hub"
  };
}
