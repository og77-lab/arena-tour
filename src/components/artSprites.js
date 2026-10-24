/* ═══ artSprites ═══ The painted art (public/art): a picture per rider and pose, and an arena per tier and lane.
   Every rider picture is 1250×1000 scaled to 625×500, facing right, the rooster's feet on the bottom edge; the
   foe is the same picture mirrored. The glove's tip sits on the right edge at about a third of the height. */

export var ART_ON = true;

/* the seven looks the player picks, in the order of PLAYER_LOOKS (saved as S.player.look, so new ones go at the end) */
var PLAYER_ART = ["player-floral", "player", "player-night", "player-kitchen", "player-sunday", "player-sport", "player-tweed"];
var RIVAL_ART = ["rival-colander", "rival-pot", "rival-pompom", "rival-plume", "rival-feather", "rival-shawl", "rival-bingo", "rival-teatime", "rival-duchess", "rival-rose"];
var POSE = { idle: "idle", charge: "charge", deflect: "deflect", knocked: "hit", fallen: "fallen", cheer: "cheer" };
export var POSES = ["idle", "charge", "deflect", "knocked", "fallen", "cheer"];

function hash(s) { s = String(s); var h = 7; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }

export function playerArt(look) { return ART_ON ? PLAYER_ART[look || 0] || PLAYER_ART[0] : null; }
export function rivalArt(id) { return ART_ON && id != null ? RIVAL_ART[hash(id) % RIVAL_ART.length] : null; }
/* A rival's rooster in a shade of its own, so the ten painted grannies make many more riders. Gentle shifts only:
   a strong hue turn paints the comb green or blue. Each is a CSS filter on the rooster layer. */
export var ROOSTER_TINTS = ["none", "hue-rotate(28deg)", "hue-rotate(-28deg)", "brightness(0.6) saturate(1.3)", "sepia(0.6) saturate(1.4)", "saturate(0.3) brightness(1.12)", "hue-rotate(14deg) brightness(0.85)"];
function mix(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return h >>> 0; }
export function rivalTint(id) { return ART_ON && id != null ? ROOSTER_TINTS[mix("tint/" + id) % ROOSTER_TINTS.length] : "none"; }
export function portraitSrc(key) { return key === "coach" ? "/art/coach-portrait.webp" : "/art/portrait-" + key + ".webp"; }
export function riderSrc(key, pose) { return "/art/granny-" + key + "-" + (POSE[pose] || "idle") + ".webp"; }

/* the arena: the lane's weather when it has one, otherwise the tier's ground */
var TIER_ARENA = ["futures", "challenger", "tour500", "tour500", "masters", "grandslam", "grandslam"];
var COND_ARENA = { mud: "muddy", heat: "heatwave", green: "green", wind: "coast" };
export function arenaName(tier, cond) { return ART_ON ? COND_ARENA[cond] || TIER_ARENA[tier] || "futures" : null; }
/* where the stands meet the lane in the arena pictures (share of the height) */
export var ARENA_GROUND = 0.5;

