/* ═══ Engine / NPC brain ═══ How the 999 rivals spend their prize money, by the player's rules.
   Each week a rider looks at her lanes and her purse and picks the kit with the best expected value — but her
   judgement is only as good as her standing: the tour's best read the conditions almost perfectly, the lower
   ranks guess. She never spends money she hasn't won, keeps a reserve, and books the physio when she's worn out.

   Expected value of a kit = how many points per strike it adds over the basic broom + tea-cosy, for a rider of
   average timing, in those lanes. Worked out once, when the game loads, from the same scoring rules as the match. */

import { GEAR, BY_ID, kitFx, priceOf } from "./gear";
import { conditionOf, softZone } from "./events";
import { fitOf, STAFF } from "./fitness";
import { TIERS } from "../models/constants";

var CONDS = ["classic", "mud", "wind", "heat", "green"];
var LANCES = GEAR.filter(function (g) { return g.slot === "lance"; }).map(function (g) { return g.id; });
var SADDLES = GEAR.filter(function (g) { return g.slot === "saddle"; }).map(function (g) { return g.id; });

/* Expected strike score for a landing spread of sd around the centre, zone half-width h (deterministic quadrature) */
function expScore(sd, h, fx) {
  var tot = 0, wsum = 0;
  for (var i = 0; i <= 60; i++) {
    var d = (i / 60) * 4 * sd, w = Math.exp(-0.5 * (d / sd) * (d / sd)) * (i === 0 ? 0.5 : 1);
    var inZ = d <= h, s = inZ ? 100 - 15 * d / h : Math.max(15 + fx.floor, 70 - (d - h) * 2.2);
    s += fx.aim + (inZ ? fx.gold : fx.miss);
    tot += w * Math.max(0, Math.min(100, s)); wsum += w;
  }
  return tot / wsum;
}
function kitScore(kit, cond) {
  var C = conditionOf(cond), K = kitFx(kit, cond), diff = 1.5, tot = 0;
  var sw = softZone(13 - diff * 1.5 + C.zone + K.zone), acc = 0.3 * C.accel * K.accel, base = (2.4 + diff * 0.4) * C.speed * K.speed;
  for (var set = 0; set < 3; set++) for (var k = 0; k < 3; k++) { var spd = base + set * acc * 0.6 + k * acc; tot += expScore(6 * spd / 2.4, sw / 2, K); }
  return tot / 9;
}
/* EV table: points per strike over the basic kit, per lanes and kit */
export var KIT_EV = {};
CONDS.forEach(function (c) {
  var base = kitScore({ lance: "broom", saddle: "teacosy" }, c); KIT_EV[c] = {};
  LANCES.forEach(function (l) { SADDLES.forEach(function (s) { KIT_EV[c][l + "|" + s] = kitScore({ lance: l, saddle: s }, c) - base; }); });
});

/* Small seeded random so a rider's choice for a given week never changes, wherever it's looked up */
function rnd(a, b, c) { var x = Math.imul((a | 0) * 2654435761 + (b | 0) * 40503 + (c | 0) * 9973 + 17, 2246822519) >>> 0; x ^= x >>> 15; x = Math.imul(x, 3266489917) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; }
function noise(a, b, c) { return (rnd(a, b, c) + rnd(a, b, c + 7) + rnd(a, b, c + 13) - 1.5) * 2; } /* ≈ N(0,1) */

/* How well she reads the lanes: misjudgement in points per strike, from ±0.3 (world #1) to ±2.5 (#1000) */
export function judgement(rank) { return 0.3 + Math.min(1, (rank || 1000) / 1000) * 2.2; }

/* Cost of riding one tournament with an item (her rental per tournament, same prices the player pays per use) */
function useCost(id, tier) { var g = BY_ID[id]; return g && !g.basic ? Math.round(priceOf(id, tier) / g.uses) : 0; }

/* Her kit for this week's event. week = season*100 + calendar slot (keeps it stable) */
export function npcKit(n, cond, tier, rank, week) {
  var cash = (n && n.money) || 0, sd = judgement(rank), best = { lance: "broom", saddle: "teacosy", ev: 0, cost: 0 };
  /* Lower ranks are warier with money: a bigger reserve and a higher bar before they rent anything */
  var rr = Math.min(1, (rank || 1000) / 1000), reserve = 4 + 8 * rr, bestV = 0.25 + 0.5 * rr;
  var c = KIT_EV[cond] ? cond : "classic";
  LANCES.forEach(function (l, li) {
    SADDLES.forEach(function (s, si) {
      if (l === "broom" && s === "teacosy") return;
      var cost = useCost(l, tier) + useCost(s, tier);
      if (cost * reserve > cash) return;                 /* keeps a reserve for more tournaments */
      var ev = KIT_EV[c][l + "|" + s];
      var seen = ev + noise(n.id, week, li * 7 + si) * sd; /* what she thinks it's worth */
      var v = seen - cost / Math.max(1, cash) * 6;        /* the poorer she is, the more the price weighs */
      if (v > bestV) { bestV = v; best = { lance: l, saddle: s, ev: ev, cost: cost }; }
    });
  });
  return best;
}

/* Physio for next week: worn-out riders with money book it; the better ones book earlier */
export function npcStaff(n, rank, tier, week) {
  var f = fitOf(n), cash = (n && n.money) || 0, low = Math.min(f.g, f.r);
  var line = 50 + (1 - Math.min(1, (rank || 1000) / 1000)) * 20 + noise(n.id, week, 99) * 6; /* #1 books under ~70, #1000 under ~50 */
  if (low >= line) return null;
  var pick = f.g < 70 && f.r < 70 ? "spa" : f.g < f.r ? "nurse" : "doctor";
  var st = STAFF.filter(function (x) { return x.id === pick; })[0];
  var price = staffPrice(st, tier);
  if (price * 3 > cash) return null;
  return { staff: st, price: price };
}
export function staffPrice(st, tier) {
  var t = TIERS[Math.max(0, Math.min(4, tier))], c = t.money.reduce(function (a, b) { return a + b; }, 0) * st.priceMul;
  var m = c >= 100000 ? 5000 : c >= 10000 ? 500 : 50; return Math.max(m, Math.round(c / m) * m);
}

/* Prize money for the rounds she reached (matches ridden), same table the player is paid from */
export function prizeFor(tier, matches, moneyMul) {
  var T = TIERS[tier]; if (!T || !matches) return 0;
  var m = 0; for (var i = 0; i < Math.min(matches, T.money.length); i++) m += T.money[i] || 0;
  return Math.round(m * (moneyMul || 1));
}

/* Her kit's effect in the quick NPC-vs-NPC sim: expected points per strike, on nW's strength scale */
export function kitStrength(ev) { return (ev || 0) * 0.7; } /* 1 point per strike ≈ +5% match win, as in the real match */
