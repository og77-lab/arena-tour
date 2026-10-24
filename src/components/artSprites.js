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

/* ── The ground ── every event rides at a ground that fits its name and its level: a fete on a village green with one
   bench, a county showground, a seaside town, a city stadium, a giant Masters arena, and a stadium of its own for each
   Grand Slam and the Season Finals. Each kind lists the grounds it may use, best first; a ground is used once its
   picture is in (HAVE), so new grounds slot in by name. Where a kind has several, the place name picks one, so the
   same event always rides at the same ground. The weather plays over it; only a muddy week at a small event moves it
   to the muddy ground. */
var HAVE = { futures: 1, challenger: 1, tour500: 1, masters: 1, grandslam: 1, muddy: 1, green: 1, heatwave: 1, coast: 1 };
var BY_SUFFIX = [
  ["Fete Cup", [["fete", "futures"]]], ["Village Classic", [["village", "green"]]], ["Garden Party Joust", [["garden", "green"]]],
  ["Allotment Open", [["allotment", "futures"]]], ["Bake-Off Trophy", [["bakeoff", "futures"]]],
  ["County Cup", [["county", "challenger"]]], ["Market Day Trophy", [["market", "challenger"]]], ["Harvest Challenger", [["harvest", "challenger"]]], ["Challenger", [["challenger"]]],
  ["Seaside Classic", [["seaside", "coast"]]], ["Open", [["town-open", "heatwave"]]], ["Trophy", [["town-trophy", "heatwave"]]],
  ["Championships", [["city", "tour500"], ["city-night", "tour500"]]], ["Grand Prix", [["grandprix", "tour500"]]],
  ["Masters", [["masters"], ["masters-night", "masters"], ["masters-dome", "masters"]]]
];
var SLAM_GROUND = { "The Coop Open": ["slam-coop", "grandslam"], "The Swamp Slam": ["slam-swamp", "grandslam"], "Wimblehen-on-Wold": ["slam-wimblehen", "grandslam"], "The Gale Cup": ["slam-gale", "grandslam"] };
var TIER_GROUND = [["futures"], ["challenger"], ["heatwave"], ["tour500"], ["masters"], ["grandslam"], ["finals", "grandslam"]];
function firstHave(list) { for (var i = 0; i < list.length; i++) if (HAVE[list[i]]) return list[i]; return null; }
export function arenaName(tier, cond, eventName) {
  if (!ART_ON) return null;
  var name = String(eventName || "").replace(/ II$/, "");
  if (tier >= 6) return firstHave(TIER_GROUND[6]);
  if (SLAM_GROUND[name]) return firstHave(SLAM_GROUND[name]);
  if (cond === "mud" && tier <= 2) return "muddy";
  for (var i = 0; i < BY_SUFFIX.length; i++) {
    var sfx = BY_SUFFIX[i][0];
    if (name.slice(-sfx.length) === sfx) { var opts = BY_SUFFIX[i][1]; return firstHave(opts[mix("ground/" + name) % opts.length]) || firstHave(TIER_GROUND[tier] || []) || "futures"; }
  }
  return firstHave(TIER_GROUND[tier] || []) || "futures";
}
/* where the stands meet the lane in the arena pictures (share of the height) */
export var ARENA_GROUND = 0.5;

