/* ═══ ArtStands ═══ The painted arena with a live crowd: the empty ground, then three rows of spectators standing
   behind its front rail — the back row smaller, the front row biggest. Each row is cut into a few groups that bob on
   their own beat; on a hit for you the front rows throw their arms up and jump, on a hit against you they sag. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

/* where the rail along the front of the stands starts, as a share of each picture's height (the crowd stands on it) */
var RAIL = { futures: 0.36, challenger: 0.37, tour500: 0.37, masters: 0.36, grandslam: 0.36, muddy: 0.37, green: 0.37, heatwave: 0.37, coast: 0.37 };
var ROWS = [
  { file: "crowd-back", scale: 0.36, up: 0.1, beat: 1.9 },
  { file: "crowd-middle", scale: 0.42, up: 0.05, beat: 1.6 },
  { file: "crowd-front", scale: 0.5, up: 0, beat: 1.35, cheer: "crowd-front-cheer" }
];
/* a small event: a few locals dotted about the benches, in their own strips */
var SPARSE = [
  { file: "crowd-sparse-back", scale: 0.42, up: 0.06, beat: 1.8 },
  { file: "crowd-sparse-front", scale: 0.5, up: 0, beat: 1.4 }
];
var SPARSE_BELOW = 0.45;
var GROUPS = 8;
/* which groups turn up: the front rows fill first, the back rows last; the same seats every match at a ground */
function seat(name, r, g) { var h = 2166136261, s = name + "/" + r + "/" + g; for (var i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); h ^= h >>> 15; h = Math.imul(h, 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; }
var ROW_FILL = [0.55, 0.85, 1.25];

export default function ArtStands(props) {
  var aw = props.width, ah = props.height, name = props.arena;
  var rail = (RAIL[name] || 0.37) * ah;
  var mood = props.cheer;   /* "cheer" | "big" | "party" | "groan" | null */
  var happy = mood === "cheer" || mood === "big" || mood === "party";
  var fill = props.fill == null ? 1 : props.fill;
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/art/layers/arena-" + name + "-empty.webp)", backgroundSize: "100% 100%" }}>
      {(fill < SPARSE_BELOW ? SPARSE : ROWS).map(function (row, r, rows) {
        var rw = aw * row.scale, rh = rw * 0.24, bottom = rail - row.up * ah + 2, gw = aw / GROUPS;
        var src = "/art/layers/" + (happy && row.cheer ? row.cheer : row.file) + ".webp";
        return Array.from({ length: GROUPS }, function (_, g) {
          if (rows === ROWS && seat(name, r, g) >= fill * ROW_FILL[r]) return null;
          var anim = REDUCED_MOTION ? "none"
            : happy ? "crowdCheer " + (0.42 + ((g * 7 + r) % 4) * 0.05) + "s ease-in-out " + (((g * 3 + r) % 5) * 0.06) + "s " + (mood === "party" ? "infinite" : "3")
            : mood === "groan" ? "crowdGroan 0.9s ease-out " + (((g + r) % 3) * 0.08) + "s 1 both"
            : "crowdBob " + (row.beat + (g % 3) * 0.23) + "s ease-in-out " + (-(g * 0.37 + r * 0.5)) + "s infinite";
          return (
            <div key={r + "-" + g + (happy ? "h" : "")} style={{ position: "absolute", left: g * gw, top: bottom - rh, width: gw + 1, height: rh,
              backgroundImage: "url(" + src + ")", backgroundSize: rw + "px " + rh + "px", backgroundRepeat: "repeat-x",
              backgroundPosition: (-(g * gw) + r * rw * 0.31) + "px 0", animation: anim, transformOrigin: "50% 100%" }} />
          );
        });
      })}
    </div>
  );
}
