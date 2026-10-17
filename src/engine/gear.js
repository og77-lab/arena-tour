/* ═══ Engine / Gear ═══ Lances and saddles. The Trusty Broom and the Tea-Cosy are free, neutral and always in the
   locker. Everything else is bought for a number of tournaments and used up one per tournament. Every item helps one
   thing and hurts another, and the lanes (mud, wind, heat, green) shift that balance — so which one is worth riding
   is the player's call, never the game's.

   Effects (yours only — they never touch the opponent's bar):
     zone  — gold zone width, in % of the bar (+ is wider)
     speed — bar speed multiplier at the start of each set (below 1 is slower)
     accel — how much the bar speeds up after every strike, as a multiplier (below 1 is gentler)
     floor — points added to the worst a miss can score (the Stubbornness floor)
     aim   — points added to every strike
     gold  — points added only to strikes that land in the gold
     miss  — points added only to strikes that land outside the gold */

import { TIERS } from "../models/constants";

var NEUTRAL = { zone: 0, speed: 1, accel: 1, floor: 0, aim: 0, gold: 0, miss: 0 };

export var GEAR = [
  { id: "broom", slot: "lance", icon: "🧹", name: "Trusty Broom-Handle", uses: 0, priceMul: 0, basic: true,
    pitch: "Swept three kitchens and one county final. Does exactly nothing special, and never lets you down.",
    fx: {}, cond: {} },
  { id: "needle", slot: "lance", icon: "🧶", name: "Knitting-Needle Lance", uses: 3, priceMul: 2.5,
    pitch: "Sharp as Granny's tongue at Christmas. Hit the gold and it really counts — if you can find it.",
    fx: { gold: 3, zone: -0.6 }, cond: { wind: { zone: -1 }, heat: { gold: 4 } } },
  { id: "baguette", slot: "lance", icon: "🥖", name: "Day-Old Baguette", uses: 1, priceMul: 1,
    pitch: "Rock hard, crusty, forgiving. Misses hurt far less, but nobody's impressed by a bread strike. Stale after one tournament.",
    fx: { miss: 3, gold: -2 }, cond: { mud: { miss: 1 }, heat: { miss: 4 } } },
  { id: "oak", slot: "lance", icon: "🪵", name: "Grandpa's Oak Lance", uses: 5, priceMul: 4,
    pitch: "He carved it in 1952 and hasn't stopped mentioning it. Heavy: every strike lands harder, but it slows your swing.",
    fx: { aim: 2, speed: 1.09 }, cond: { wind: { zone: 0.3 }, heat: { accel: 1.12 } } },
  { id: "bamboo", slot: "lance", icon: "🎋", name: "Featherlight Bamboo", uses: 3, priceMul: 2.5,
    pitch: "So light the panda wants it back. A big friendly gold zone, but strikes land like a feather duster.",
    fx: { zone: 1.2, aim: -2 }, cond: { wind: { zone: 0.4 }, mud: { zone: 1.4 } } },

  { id: "teacosy", slot: "saddle", icon: "🫖", name: "Tea-Cosy Saddle", uses: 0, priceMul: 0, basic: true,
    pitch: "Knitted by your sister in 1987. Warm, lumpy, perfectly ordinary.",
    fx: {}, cond: {} },
  { id: "racing", slot: "saddle", icon: "🏁", name: "Racing Saddle", uses: 3, priceMul: 2.5,
    pitch: "Go-faster stripes and a cup holder. The bar starts slow and lazy — then it gets very, very keen.",
    fx: { speed: 0.96, accel: 1.2 }, cond: { mud: { speed: 0.99 }, heat: { accel: 1.35 }, green: { speed: 0.97 } } },
  { id: "rocking", slot: "saddle", icon: "🪑", name: "Rocking-Chair Saddle", uses: 5, priceMul: 4,
    pitch: "Your rooster barely notices the miles. The bar hardly speeds up all match, but it never starts slow.",
    fx: { speed: 1.03, accel: 0.78 }, cond: { heat: { speed: 1.05 }, mud: { accel: 0.88 } } },
  { id: "foam", slot: "saddle", icon: "🧽", name: "Memory-Foam Cushion", uses: 2, priceMul: 1.8,
    pitch: "Remembers every bump so your hips don't have to. A steadier lance, a slightly sleepier rooster.",
    fx: { zone: 0.5, speed: 1.03 }, cond: { mud: { zone: 0.1 }, green: { zone: 0.7 } } },
  { id: "skates", slot: "saddle", icon: "🛼", name: "Roller-Skate Saddle", uses: 1, priceMul: 1,
    pitch: "Wheels. On a saddle. On a rooster. The bar crawls, but you wobble all over the gold. One tournament before the wheels fall off.",
    fx: { speed: 0.94, zone: -0.6 }, cond: { mud: { speed: 0.99 }, wind: { zone: -0.9 } } }
];

export var BY_ID = {}; GEAR.forEach(function (g) { BY_ID[g.id] = g; });
export var BASIC = { lance: "broom", saddle: "teacosy" };

/* One item's effects in these lanes: its base effects with the lane's overrides on top */
export function itemFx(id, cond) {
  var g = BY_ID[id]; if (!g) return Object.assign({}, NEUTRAL);
  return Object.assign({}, NEUTRAL, g.fx, (g.cond && g.cond[cond]) || {});
}

/* The whole kit in these lanes (lance + saddle); multipliers multiply, the rest add up */
export function kitFx(kit, cond) {
  var a = itemFx(kit && kit.lance, cond), b = itemFx(kit && kit.saddle, cond);
  return { zone: a.zone + b.zone, speed: a.speed * b.speed, accel: a.accel * b.accel, floor: a.floor + b.floor, aim: a.aim + b.aim, gold: a.gold + b.gold, miss: a.miss + b.miss };
}

/* Readable effect lines, each marked good or bad for you */
export function fxLines(fx) {
  var out = [];
  function pct(m) { return Math.round(Math.abs(m - 1) * 100); }
  if (fx.zone) out.push({ good: fx.zone > 0, text: zoneText(fx.zone) });
  if (fx.speed && fx.speed !== 1) out.push({ good: fx.speed < 1, text: "Bar starts " + pct(fx.speed) + "% " + (fx.speed < 1 ? "slower" : "faster") });
  if (fx.accel && fx.accel !== 1) out.push({ good: fx.accel < 1, text: "Speeds up " + pct(fx.accel) + "% " + (fx.accel < 1 ? "less" : "more") + " each strike" });
  if (fx.floor) out.push({ good: fx.floor > 0, text: "Misses score " + (fx.floor > 0 ? "+" : "−") + Math.abs(fx.floor) + " (floor)" });
  if (fx.aim) out.push({ good: fx.aim > 0, text: (fx.aim > 0 ? "+" : "−") + Math.abs(fx.aim) + " points every strike" });
  if (fx.miss) out.push({ good: fx.miss > 0, text: (fx.miss > 0 ? "+" : "−") + Math.abs(fx.miss) + " points on misses" });
  if (fx.gold) out.push({ good: fx.gold > 0, text: (fx.gold > 0 ? "+" : "−") + Math.abs(fx.gold) + " points on gold hits" });
  return out;
}
export function zoneText(z) { return "Gold zone " + Math.abs(z) + "% " + (z > 0 ? "wider" : "narrower"); }

/* How each lane changes an item, in words (only the lanes that change it) */
export var COND_LABEL = { classic: "☀️ Classic", mud: "🌧️ Mud", wind: "🌬️ Wind", heat: "🔥 Heat", green: "🌼 Green" };
export function condNotes(id) {
  var g = BY_ID[id]; if (!g || !g.cond) return [];
  return Object.keys(g.cond).map(function (c) {
    var fx = Object.assign({}, NEUTRAL, g.fx, g.cond[c]), base = Object.assign({}, NEUTRAL, g.fx);
    var changed = fxLines(fx).filter(function (l) { return fxLines(base).every(function (b) { return b.text !== l.text; }); });
    return { cond: c, label: COND_LABEL[c], lines: changed };
  }).filter(function (n) { return n.lines.length; });
}

/* Prices follow the best tier you can enter: one tournament's rental costs 6% of that tier's champion prize */
export function perUse(topTier) {
  var t = TIERS[Math.max(0, Math.min(4, topTier))];
  return Math.max(50, Math.round(t.money.reduce(function (a, b) { return a + b; }, 0) * 0.06 / 10) * 10);
}
export function priceOf(id, topTier) { var g = BY_ID[id]; return g && !g.basic ? Math.round(perUse(topTier) * g.priceMul / 10) * 10 : 0; }

/* Which kit is ready to ride: owned uses (locker) plus anything in the basket */
export function usesLeft(locker, cart, id) { var g = BY_ID[id]; if (!g) return 0; if (g.basic) return Infinity; return ((locker || {})[id] || 0) + ((cart || {})[id] || 0) * g.uses; }
