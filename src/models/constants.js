/* ═══ Models / Constants ═══ Pure data used across the whole game */

/* LocalStorage key */
export const SK = "arena-t3";

/* Root screen wrapper style */
export const W = { minHeight: "100vh", background: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "#0f172a", padding: 10, boxSizing: "border-box" };

/* CSS keyframes injected via <style> tag */
export const CSS = "@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}@keyframes glow{0%,100%{box-shadow:0 0 10px rgba(250,204,21,0.15)}50%{box-shadow:0 0 24px rgba(250,204,21,0.4)}}@keyframes hit{0%{transform:scale(1)}30%{transform:scale(1.12)}100%{transform:scale(1)}}@keyframes miss{0%{transform:translateX(0)}25%{transform:translateX(-5px)}75%{transform:translateX(5px)}100%{transform:translateX(0)}}@keyframes cg{0%,100%{text-shadow:0 0 10px rgba(250,204,21,0.5)}50%{text-shadow:0 0 30px rgba(250,204,21,0.9)}}@keyframes confetti-fall{0%{transform:translateY(-10vh) rotate(0deg);opacity:1}100%{transform:translateY(110vh) rotate(720deg);opacity:0}}";

/* Framer Motion preset for screen entrance transitions */
export const screenAnim = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.22, ease: "easeOut" }
};

/* NPC/player emojis */
export const EMO = ["⚔️","🛡️","🗡️","🏹","🔱","⚡","🔥","💀","👑","🐉","🦅","🐺","🦁","🐍","🦊","🎭","🐻","🦈","🦂","🐲","🏴","🎪","🔮","🌀","☠️","🦇","🐗","🐅","🦏","🐊"];

/* Tournament tiers: Futures, Challenger, Tour250, Tour500, Masters, GrandSlam */
export const TIERS = [
  { name: "Futures", short: "FUT", col: "#6b7280", size: 32, rounds: 5, pts: [5,12,25,50,100], money: [50,150,400,1000,3000], rankRange: [601,1001] },
  { name: "Challenger", short: "CHL", col: "#22c55e", size: 32, rounds: 5, pts: [12,30,60,125,250], money: [200,500,1500,4000,10000], rankRange: [301,700] },
  { name: "Tour 250", short: "250", col: "#0ea5e9", size: 32, rounds: 5, pts: [40,80,160,320,600], money: [800,2000,6000,15000,40000], rankRange: [101,400] },
  { name: "Tour 500", short: "500", col: "#8b5cf6", size: 32, rounds: 5, pts: [80,160,320,600,1200], money: [2000,5000,15000,40000,100000], rankRange: [31,200] },
  { name: "Masters", short: "MST", col: "#ec4899", size: 32, rounds: 5, pts: [150,300,600,1200,2500], money: [5000,15000,40000,100000,300000], rankRange: [1,100] },
  { name: "Grand Slam", short: "GS", col: "#f59e0b", size: 64, rounds: 6, pts: [250,500,1000,2000,4000,8000], money: [10000,25000,60000,150000,400000,1000000], rankRange: [1,64] }
];

/* Round-name labels for 5-round and 6-round tournaments */
export const RN5 = ["Round of 32","Round of 16","Quarterfinals","Semifinals","Final"];
export const RN6 = ["Round of 64","Round of 32","Round of 16","Quarterfinals","Semifinals","Final"];

/* Finals: four "houses" each running a group stage */
export const HN = ["Phoenix","Kraken","Wyvern","Chimera"];
export const HC = ["#ef4444","#3b82f6","#22c55e","#a855f7"];
export const HI = ["🔥","🌊","🐉","⚡"];

/* Season is 20 events long */
export const TOTAL_EVENTS = 20;

/* Name components for NPC generation */
export const FN = ["Kai","Zara","Riven","Nova","Cael","Luna","Drex","Mira","Volt","Freya","Jett","Lyra","Onyx","Talon","Vex","Ash","Blaze","Ember","Hex","Jade","Knox","Lux","Nyx","Orion","Pike","Quinn","Rex","Storm","Vale","Wren","Yuki","Sage","Echo","Fang","Iris","Kira","Neon","Pyro","Shade","Wolf","Rook","Dusk","Moss","Opal","Rift","Uma","Xena","Crux","Haze","Jinx"];
export const TT = ["Swift","Fierce","Bold","Shadow","Flame","Iron","Storm","Frost","Crimson","Silent","Phantom","Arcane","Cunning","Venom","Warden","Wraith","Savage","Void","Mystic","Dire"];
