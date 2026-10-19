/* ═══ Models / Constants ═══ Pure data used across the whole game */

/* LocalStorage key */
export const SK = "arena-t3";

/* Root screen wrapper style */
export const W = { minHeight: "calc(100dvh / var(--z, 1))", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#0f172a", padding: 10, boxSizing: "border-box" };

/* CSS keyframes injected via <style> tag */
export const CSS = "@keyframes stageShakeB{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,1px)}40%{transform:translate(3px,-1px)}60%{transform:translate(-2px,1px)}80%{transform:translate(1px,0)}}@keyframes stageShakeBigB{0%,100%{transform:translate(0,0) rotate(0)}15%{transform:translate(-6px,2px) rotate(-0.6deg)}30%{transform:translate(6px,-2px) rotate(0.6deg)}45%{transform:translate(-4px,1px)}60%{transform:translate(4px,-1px)}80%{transform:translate(-1px,0)}}@keyframes zoomPunchB{0%{transform:scale(1)}25%{transform:scale(1.07)}100%{transform:scale(1)}}@keyframes stageShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,1px)}40%{transform:translate(3px,-1px)}60%{transform:translate(-2px,1px)}80%{transform:translate(1px,0)}}@keyframes stageShakeBig{0%,100%{transform:translate(0,0) rotate(0)}15%{transform:translate(-6px,2px) rotate(-0.6deg)}30%{transform:translate(6px,-2px) rotate(0.6deg)}45%{transform:translate(-4px,1px)}60%{transform:translate(4px,-1px)}80%{transform:translate(-1px,0)}}@keyframes zoomPunch{0%{transform:scale(1)}25%{transform:scale(1.07)}100%{transform:scale(1)}}@keyframes dustTrail{0%{transform:translate(0,0) scale(0.5);opacity:0.75}100%{transform:translate(-26px,-10px) scale(1.9);opacity:0}}@keyframes dustRing{0%{transform:scale(0.3);opacity:0.85}100%{transform:scale(1.8);opacity:0}}@keyframes goldBurst{0%{transform:scale(0.2);opacity:1}70%{opacity:0.9}100%{transform:scale(2.6);opacity:0}}@keyframes scoreGlow{0%,100%{text-shadow:0 0 10px rgba(250,204,21,0.55)}50%{text-shadow:0 0 22px rgba(250,204,21,0.95)}}@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes beltRun{from{background-position:0 0}to{background-position:-12px 0}}@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(250,204,21,0.15)}50%{box-shadow:0 0 24px rgba(250,204,21,0.4)}}@keyframes hit{0%{transform:scale(1)}30%{transform:scale(1.12)}100%{transform:scale(1)}}@keyframes miss{0%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}@keyframes cg{0%,100%{text-shadow:0 0 10px rgba(250,204,21,0.5)}50%{text-shadow:0 0 30px rgba(250,204,21,0.9)}}@keyframes confetti-fall{0%{transform:translateY(-10vh) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}@keyframes arenaShake{0%,100%{transform:translate(0,0)}20%{transform:translate(-3px,2px)}40%{transform:translate(3px,-1px)}60%{transform:translate(-2px,1px)}80%{transform:translate(2px,0)}}@keyframes arenaShakeHard{0%,100%{transform:translate(0,0)}10%{transform:translate(-6px,3px)}30%{transform:translate(6px,-3px)}50%{transform:translate(-4px,2px)}70%{transform:translate(4px,-2px)}90%{transform:translate(-2px,1px)}}@keyframes slashIn{0%{transform:translateX(-100%) skewX(-20deg);opacity:0}20%{opacity:1}100%{transform:translateX(100%) skewX(-20deg);opacity:0}}@keyframes slashInRev{0%{transform:translateX(100%) skewX(20deg);opacity:0}20%{opacity:1}100%{transform:translateX(-100%) skewX(20deg);opacity:0}}@keyframes flashBoom{0%{transform:scale(0.4);opacity:0}30%{opacity:1}100%{transform:scale(2.4);opacity:0}}@keyframes portraitHit{0%,100%{transform:scale(1) rotate(0)}30%{transform:scale(0.88) rotate(-4deg)}60%{transform:scale(1.06) rotate(3deg)}}@keyframes portraitWin{0%{transform:scale(1)}50%{transform:scale(1.1)}100%{transform:scale(1.05)}}@keyframes aura{0%,100%{box-shadow:0 0 0 0 rgba(250,204,21,0),inset 0 0 0 0 rgba(250,204,21,0)}50%{box-shadow:0 0 24px 4px rgba(250,204,21,0.45),inset 0 0 20px rgba(250,204,21,0.15)}}@keyframes auraFoe{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0),inset 0 0 0 0 rgba(239,68,68,0)}50%{box-shadow:0 0 24px 4px rgba(239,68,68,0.4),inset 0 0 20px rgba(239,68,68,0.12)}}@keyframes orbPop{0%{transform:scale(0.4);opacity:0}60%{transform:scale(1.25);opacity:1}100%{transform:scale(1);opacity:1}}@keyframes orbPulse{0%,100%{box-shadow:0 0 6px rgba(250,204,21,0.6)}50%{box-shadow:0 0 14px rgba(250,204,21,1)}}@keyframes vsEntrance{0%{transform:scale(0.3) rotate(-20deg);opacity:0}60%{transform:scale(1.3) rotate(5deg);opacity:1}100%{transform:scale(1) rotate(0);opacity:1}}@keyframes cursorGlide{0%,100%{filter:drop-shadow(0 0 4px rgba(30,64,175,0.6))}50%{filter:drop-shadow(0 0 10px rgba(59,130,246,1))}}@keyframes zoneBreathe{0%,100%{opacity:0.75}50%{opacity:1}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes legRunA{0%,100%{transform:rotate(30deg)}50%{transform:rotate(-30deg)}}@keyframes legRunB{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(30deg)}}@keyframes wingFlap{0%,100%{transform:rotate(-30deg)}50%{transform:rotate(12deg)}}@keyframes wingIdle{0%,100%{transform:rotate(0deg)}50%{transform:rotate(-6deg)}}@keyframes riderBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}@keyframes riderIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}@keyframes dustPuff{0%{transform:translate(0,0) scale(0.4);opacity:0.7}100%{transform:translate(-26px,-10px) scale(1.6);opacity:0}}@keyframes comicPop{0%{transform:translate(-50%,-50%) scale(0.2) rotate(-12deg);opacity:0}40%{transform:translate(-50%,-50%) scale(1.25) rotate(-6deg);opacity:1}100%{transform:translate(-50%,-62%) scale(1) rotate(-6deg);opacity:0}}@keyframes rankBanner{0%{transform:translateY(-20px);opacity:0}100%{transform:translateY(0);opacity:1}}@keyframes crowdBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-1.5px)}}@keyframes crowdCheer{0%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}@keyframes flagWave{0%,100%{transform:skewY(0deg) scaleX(1)}50%{transform:skewY(-12deg) scaleX(0.85)}}@keyframes cloudDrift{from{transform:translateX(-60px)}to{transform:translateX(420px)}}@keyframes crowdGroan{0%{transform:translateY(0)}30%{transform:translateY(2px) rotate(-4deg)}70%{transform:translateY(2px) rotate(4deg)}100%{transform:translateY(1px)}}@keyframes crowdHop{0%,88%,100%{transform:translateY(0)}93%{transform:translateY(-6px)}}@keyframes crowdWave{0%,10%,100%{transform:translateY(0)}4%{transform:translateY(-8px)}}@keyframes camFlash{0%,92%,100%{opacity:0}94%{opacity:1}}@keyframes spotSweep{0%,100%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}}@keyframes screenGlow{0%,100%{opacity:1}50%{opacity:0.55}}@keyframes camPan{0%,100%{transform:rotate(-6deg)}50%{transform:rotate(8deg)}}@keyframes rainFall{from{background-position:0 0}to{background-position:-12px 40px}}@keyframes windStreak{from{transform:translateX(0)}to{transform:translateX(480px)}}@keyframes leafBlow{0%{transform:translate(0,0) rotate(0)}100%{transform:translate(460px,30px) rotate(720deg)}}@keyframes heatShimmer{0%,100%{transform:scaleY(1) translateY(0);opacity:0.5}50%{transform:scaleY(1.4) translateY(-3px);opacity:0.9}}@keyframes mudSplash{0%{transform:translate(0,0);opacity:0.9}100%{transform:translate(-18px,-16px);opacity:0}}@keyframes miniSweep{from{left:2%}to{left:90%}}@keyframes miniAccel{0%{left:2%}100%{left:92%}}@keyframes laneGust{from{transform:translateX(0)}to{transform:translateX(90px)}}@keyframes hatToss{0%{transform:translateY(0) rotate(0);opacity:1}60%{transform:translateY(-34px) rotate(260deg);opacity:1}100%{transform:translateY(-10px) rotate(420deg);opacity:0}}";

/* Framer Motion preset for screen entrance transitions */
export const screenAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: "easeOut" }
};

/* NPC/player emojis */
export const EMO = ["⚔️","🛡️","🗡️","🏹","🔱","⚡","🔥","💀","👑","🐉","🦅","🐺","🦁","🐍","🦊","🎭","🐻","🦈","🦂","🐲","🏴","🎪","🔮","🌀","☠️","🦇","🐗","🐅","🦏","🐊"];

/* Tournament tiers: Futures, Challenger, Tour250, Tour500, Masters, GrandSlam.
   pts and money are what each round WON adds; they add up. Champions: 100 · 250 · 500 · 1,000 · 2,000 · 4,000 —
   each tier doubles the one below, and reaching a round is a fixed share of the title, as on the ATP tour. */
export const TIERS = [
  { name: "Futures", short: "FUT", col: "#6b7280", size: 32, rounds: 5, bo: 3, pts: [10,10,15,25,40], money: [50,150,400,1000,3000], rankRange: [601,1001] },
  { name: "Challenger", short: "CHL", col: "#22c55e", size: 32, rounds: 5, bo: 3, pts: [20,25,45,60,100], money: [200,500,1500,4000,10000], rankRange: [301,700] },
  { name: "Tour 250", short: "250", col: "#0ea5e9", size: 32, rounds: 5, bo: 3, pts: [40,50,90,120,200], money: [800,2000,6000,15000,40000], rankRange: [101,400] },
  { name: "Tour 500", short: "500", col: "#8b5cf6", size: 32, rounds: 5, bo: 3, pts: [80,100,180,240,400], money: [2000,5000,15000,40000,100000], rankRange: [31,200] },
  { name: "Masters", short: "MST", col: "#ec4899", size: 32, rounds: 5, bo: 5, pts: [160,200,360,480,800], money: [5000,15000,40000,100000,300000], rankRange: [1,100] },
  { name: "Grand Slam", short: "GS", col: "#f59e0b", size: 64, rounds: 6, bo: 5, pts: [160,160,400,720,960,1600], money: [10000,25000,60000,150000,400000,1000000], rankRange: [1,64] }
];

/* Training stats. Save keys (k) are unchanged; each stat belongs to the granny (rider) or the rooster (mount).
   Each level builds the rider's own bar (engine/joust); higher levels give a little less.
   what = what it does in the joust; per = the effect of one level ahead of your opponent (mirrors PowerBar's formulas);
   best = who should train it */
export const STATS = [
  { k: "r", icon: "⚡", label: "Reflexes", el: "slower bar", who: "granny", col: "#0891b2", what: "The marker sweeps slower, so it's easier to stop it in the gold",
    per: "your bar 3% slower", best: "You keep overshooting the gold zone" },
  { k: "f", icon: "🎯", label: "Aim", el: "extra points", who: "granny", col: "#16a34a", what: "Extra points on every single strike — hit or miss",
    per: "+0.5 points on every strike", best: "You want steady gains no matter how you tap" },
  { k: "g", icon: "🛡️", label: "Stubbornness", el: "softer misses", who: "granny", col: "#7c3aed", what: "Your bad strikes aren't as bad: misses lose fewer points and the worst strike is higher. Counts most when the bar is hard — late rounds and finals",
    per: "misses lose 5% fewer points, worst strike +1.5", best: "Your misses are wild and cost you whole sets" },
  { k: "s", icon: "🫀", label: "Stamina", el: "less speed-up", who: "rooster", col: "#ea580c", what: "The bar speeds up less as a match goes on — strike after strike, set after set. Counts most in long matches and late sets",
    per: "7% less speed-up each strike", best: "Long best-of-5 matches get away from you late on" },
  { k: "p", icon: "🐾", label: "Steady Stride", el: "bigger gold", who: "rooster", col: "#db2777", what: "A wider gold zone — a steady mount is easier to aim from",
    per: "gold zone +0.4% of the bar wider", best: "You often stop just next to the gold" },
  { k: "b", icon: "🔋", label: "Bounce-back", el: "recovery", who: "recovery", col: "#0d9488", what: "Granny and rooster win back more fitness between tournaments. It counts on its own, not against your opponent",
    per: "+0.5% fitness back after every tournament", best: "Deep runs leave you running on empty the week after" }
];
export const STAT_GROUPS = [
  { who: "granny", icon: "👵", title: "Granny", sub: "Rider skills" },
  { who: "rooster", icon: "🐓", title: "Rooster", sub: "Mount conditioning" },
  { who: "recovery", icon: "🔋", title: "Recovery", sub: "Fitness between tournaments" }
];

/* Every match in the Season Finals is best of 5 sets */
export const FINALS_BO = 5;

/* Strikes per set — the set is won on the higher average */
export const STRIKES_PER_SET = 3;

/* Round-name labels for 5-round and 6-round tournaments */
export const RN5 = ["Round of 32","Round of 16","Quarterfinals","Semifinals","Final"];
export const RN6 = ["Round of 64","Round of 32","Round of 16","Quarterfinals","Semifinals","Final"];
/* What you hold after winning each round (× the event's points multiplier): [{ r: "R32", pts: 40 }, … { r: "F", pts: 500 }] */
var RSHORT = { "Round of 64": "R64", "Round of 32": "R32", "Round of 16": "R16", "Quarterfinals": "QF", "Semifinals": "SF", "Final": "F" };
export function ptsLadder(ti, mul) {
  var T = TIERS[ti], names = T.rounds === 6 ? RN6 : RN5, sum = 0;
  return T.pts.map(function (p, i) { sum += p; return { r: RSHORT[names[i]], pts: Math.round(sum * (mul || 1)) }; });
}
export function champTotal(ti, key) { return (TIERS[ti][key || "pts"] || []).reduce(function (a, b) { return a + b; }, 0); }

/* Finals: four "houses" each running a group stage */
export const HN = ["Phoenix","Kraken","Wyvern","Chimera"];
export const HC = ["#ef4444","#3b82f6","#22c55e","#a855f7"];
export const HI = ["🔥","🌊","🐉","⚡"];

/* Season is 20 events long */
export const TOTAL_EVENTS = 20;

/* Name components for NPC generation */
export const FN = ["Kai","Zara","Riven","Nova","Cael","Luna","Drex","Mira","Volt","Freya","Jett","Lyra","Onyx","Talon","Vex","Ash","Blaze","Ember","Hex","Jade","Knox","Lux","Nyx","Orion","Pike","Quinn","Rex","Storm","Vale","Wren","Yuki","Sage","Echo","Fang","Iris","Kira","Neon","Pyro","Shade","Wolf","Rook","Dusk","Moss","Opal","Rift","Uma","Xena","Crux","Haze","Jinx"];
export const TT = ["Swift","Fierce","Bold","Shadow","Flame","Iron","Storm","Frost","Crimson","Silent","Phantom","Arcane","Cunning","Venom","Warden","Wraith","Savage","Void","Mystic","Dire"];
