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

/* ── The ground ── every event rides at a ground of its own level, built from two pictures: the stands (a backdrop,
   transparent below its front rail) and the riding surface under them. Futures ride at village grounds (a bench, a
   fete, an allotment), Challengers at small local stands, Tour 250s at town grounds, Tour 500s at big city stadiums,
   Masters at giant televised arenas; each Grand Slam and the Season Finals has a complete arena of its own. The
   event's name picks which stands, so the same event always rides at the same ground and the week's other events at
   others. The surface follows the weather (dry, mud, grass, baked hot; wind blows over dry ground), rustic for the
   two small levels and groomed above them. Returns { key, full } or { key, backdrop, lane }: files in /art/grounds. */
var STANDS = [["futures", 8], ["challenger", 8], ["tour250", 8], ["tour500", 6], ["masters", 6]];
var SLAM_ARENA = { "The Coop Open": "slam-coop", "The Swamp Slam": "slam-swamp", "Wimblehen-on-Wold": "slam-wimblehen", "The Gale Cup": "slam-gale" };
/* names that promise a kind of place keep to stands that fit it (the numbers of those backdrops) */
var THEMED = [["Seaside Classic", [1, 7]], ["Harvest Challenger", [3, 1]], ["Market Day Trophy", [2, 8]], ["Garden Party Joust", [3, 1]], ["Allotment Open", [4, 6]], ["Bake-Off Trophy", [5, 1]]];
var SURFACE = { classic: "dry", wind: "dry", mud: "mud", green: "grass", heat: "hot" };
export function arenaName(tier, cond, eventName) {
  if (!ART_ON) return null;
  var name = String(eventName || "").replace(/ II$/, "");
  if (tier >= 6) return { key: "finals", full: "arena-finals-empty" };
  if (tier === 5) { var sl = SLAM_ARENA[name] || "slam-coop"; return { key: sl, full: "arena-" + sl + "-empty" }; }
  var st = STANDS[Math.max(0, Math.min(4, tier || 0))], pickN = mix("stands/" + name + "/" + tier), n = 1 + (pickN % st[1]);
  for (var i = 0; i < THEMED.length; i++) if (name.slice(-THEMED[i][0].length) === THEMED[i][0]) n = THEMED[i][1][pickN % THEMED[i][1].length];
  return { key: st[0] + "-" + n, backdrop: "backdrop-" + st[0] + "-" + n, lane: "lane-" + (tier <= 1 ? "rustic" : "groomed") + "-" + (SURFACE[cond] || "dry") };
}
/* where the stands meet the lane in the arena pictures (share of the height) */
export var ARENA_GROUND = 0.5;

