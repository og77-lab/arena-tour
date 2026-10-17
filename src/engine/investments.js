/* ═══ Engine / Investments ═══ What prize money buys. One investment per tournament week — a private session,
   a paid entry into a higher tier, or a pedigree certificate — so money speeds you up without replacing
   the grind. Prices follow the prizes at your level, so they stay meaningful as you climb. */

import { TIERS } from "../models/constants";

export var COACH_TP = 10;
export var BASE_CAP = 20;
/* Rooster pedigree: each certificate lifts the cap on the rooster's stats (Stamina, Steady Stride) */
export var PEDIGREE = [{ cap: 22, price: 250000 }, { cap: 24, price: 1000000 }, { cap: 26, price: 3000000 }];
var ROOSTER_STATS = { s: true, p: true };

function nice(n) { var m = n >= 100000 ? 5000 : n >= 10000 ? 500 : 50; return Math.max(m, Math.round(n / m) * m); }
/* What a champion of this tier takes home over the whole draw */
export function champPrize(ti) { return (TIERS[ti].money || []).reduce(function (a, b) { return a + b; }, 0); }

export function coachPrice(bestTier) { return nice(champPrize(Math.max(0, Math.min(4, bestTier))) * 0.2); }
export function entryFee(ti) { return nice(champPrize(ti) * 0.35); }

export function pedigreeLevel(player) { return (player && player.pedigree) || 0; }
export function nextPedigree(player) { return PEDIGREE[pedigreeLevel(player)] || null; }
/* Highest level a stat can be trained to */
export function statCap(player, k) { return ROOSTER_STATS[k] ? (pedigreeLevel(player) ? PEDIGREE[pedigreeLevel(player) - 1].cap : BASE_CAP) : BASE_CAP; }

/* This week's investment, if one has been made already */
export function weekInvestment(S) {
  var iv = S.player.invest;
  return iv && iv.s === S.sNum && iv.cal === S.calIdx ? iv : null;
}
export function stampInvestment(S, kind, extra) { return Object.assign({ s: S.sNum, cal: S.calIdx, kind: kind }, extra || {}); }

/* A paid entry into this week's tournament tier */
export function paidEntryTier(S) { var iv = weekInvestment(S); return iv && iv.kind === "entry" ? iv.tier : -1; }
