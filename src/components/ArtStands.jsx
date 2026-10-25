/* ═══ ArtStands ═══ The painted ground with a live crowd. A ground is either one complete picture (the Slams and the
   Finals) or the riding surface with the stands laid over it (artSprites.arenaName); the stands are transparent below
   their front rail, at half the height. Then rows of spectators standing behind that rail — the back rows smaller —
   each row cut into groups that bob on their own beat; on a hit for you the front rows throw their arms up and jump,
   on a hit against you they sag. The big events add television: a camera crane swinging at the side, a cable camera
   over the lane, press photographers whose flashes go off on a hit, and at a Slam an airship drifting past. */

import * as React from "react";
import { REDUCED_MOTION } from "./fx";

/* where the top of the front rail is, as a share of the height (the crowd stands just behind it), by kind of ground */
var RAIL = { futures: 0.44, challenger: 0.41, tour250: 0.43, tour500: 0.42, masters: 0.44 };
var RAIL_FULL = 0.44;
var ROWS = [
  { file: "crowd-back", scale: 0.36, up: 0.1, beat: 1.9 },
  { file: "crowd-middle", scale: 0.42, up: 0.05, beat: 1.6 },
  { file: "crowd-front", scale: 0.5, up: 0, beat: 1.35, cheer: "crowd-front-cheer" }
];
/* the giant grounds have a third tier: one more row higher up */
var TOP_ROW = { file: "crowd-back", scale: 0.3, up: 0.16, beat: 2.1 };
/* the big stadiums (Tour 500 up) fill their upper tiers too: small, far-off rows, a little dimmer */
var FAR = [
  { file: "crowd-middle", scale: 0.22, up: 0.22, beat: 2.4, far: true },
  { file: "crowd-back", scale: 0.18, up: 0.29, beat: 2.7, far: true }
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
var ROW_FILL = [0.4, 0.55, 0.85, 1.25];

var KEYS = "@keyframes craneSwing{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(6deg)}}" +
  "@keyframes spiderHover{0%,100%{transform:translate(0,0)}25%{transform:translate(-40%,6%)}50%{transform:translate(10%,-4%)}75%{transform:translate(45%,5%)}}" +
  "@keyframes blimpDrift{from{transform:translateX(-30%)}to{transform:translateX(560%)}}" +
  "@keyframes pressFlash{0%,100%{filter:none}10%{filter:brightness(2.2)}25%{filter:none}40%{filter:brightness(1.9)}55%{filter:none}}";

export default function ArtStands(props) {
  var aw = props.width, ah = props.height, G = props.arena || {}, tier = props.tier || 0;
  var kind = G.key ? G.key.replace(/-\d+$/, "") : "";
  var rail = (G.full ? RAIL_FULL : RAIL[kind] || 0.43) * ah;
  var mood = props.cheer;   /* "cheer" | "big" | "party" | "groan" | null */
  var happy = mood === "cheer" || mood === "big" || mood === "party";
  var fill = props.fill == null ? 1 : props.fill;
  var big = tier >= 4, rows = fill < SPARSE_BELOW ? SPARSE : big ? [TOP_ROW].concat(ROWS) : ROWS;
  var fills = rows.length === 4 ? ROW_FILL : ROW_FILL.slice(1);
  if (tier >= 3 && rows !== SPARSE) { rows = FAR.concat(rows); fills = [0.5, 0.45].concat(fills); }
  var still = REDUCED_MOTION;
  var img = { position: "absolute", display: "block", maxWidth: "none", pointerEvents: "none", userSelect: "none" };
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <style>{KEYS}</style>
      {G.full ? (<img src={"/art/grounds/" + G.full + ".webp"} alt="" style={Object.assign({}, img, { left: 0, top: 0, width: aw, height: ah })} />) : (
        <React.Fragment>
          <img src={"/art/grounds/" + G.lane + ".webp"} alt="" style={Object.assign({}, img, { left: 0, top: ah * 0.5, width: aw, height: ah * 0.55 })} />
          <img src={"/art/grounds/" + G.backdrop + ".webp"} alt="" style={Object.assign({}, img, { left: 0, top: 0, width: aw, height: ah })} />
        </React.Fragment>
      )}
      {/* a Slam's airship, far off behind the stands */}
      {tier === 5 && (<img src="/art/grounds/prop-blimp.webp" alt="" style={Object.assign({}, img, { left: -aw * 0.18, top: ah * 0.03, width: aw * 0.16, height: aw * 0.08, animation: still ? "none" : "blimpDrift 46s linear infinite" })} />)}
      {rows.map(function (row, r) {
        var rw = aw * row.scale, rh = rw * 0.24, bottom = rail - row.up * ah + 2, gw = aw / GROUPS, pad = gw * 0.22;
        var fade = "linear-gradient(90deg, transparent 0, #000 " + (pad * 1.6) + "px, #000 calc(100% - " + (pad * 1.6) + "px), transparent 100%)";
        var src = "/art/layers/" + (happy && row.cheer ? row.cheer : row.file) + ".webp";
        return Array.from({ length: GROUPS }, function (_, g) {
          if (rows !== SPARSE && seat(G.key || "", r, g) >= fill * fills[r]) return null;
          if (row.far && G.full && g >= 2 && g <= 5) return null;   /* a Slam's or the Finals' sign sits up there, in the middle */
          var anim = still ? "none"
            : happy ? "crowdCheer " + (0.42 + ((g * 7 + r) % 4) * 0.05) + "s ease-in-out " + (((g * 3 + r) % 5) * 0.06) + "s " + (mood === "party" ? "infinite" : "3")
            : mood === "groan" ? "crowdGroan 0.9s ease-out " + (((g + r) % 3) * 0.08) + "s 1 both"
            : "crowdBob " + (row.beat + (g % 3) * 0.23) + "s ease-in-out " + (-(g * 0.37 + r * 0.5)) + "s infinite";
          return (
            <div key={r + "-" + g + (happy ? "h" : "")} style={{ position: "absolute", left: g * gw - pad, top: bottom - rh, width: gw + 2 * pad, height: rh,
              backgroundImage: "url(" + src + ")", backgroundSize: rw + "px " + rh + "px", backgroundRepeat: "repeat-x",
              backgroundPosition: (-(g * gw - pad) + r * rw * 0.31 + (row.far ? rw * 0.47 : 0)) + "px 0", animation: row.far && !happy ? "crowdBob " + row.beat + "s ease-in-out " + (-g * 0.4) + "s infinite" : anim, transformOrigin: "50% 100%",
              WebkitMaskImage: fade, maskImage: fade, filter: row.far ? "brightness(0.78) saturate(0.85)" : undefined }} />
          );
        });
      })}
      {/* television at the big events: the crane at the side, the cable camera over the lane, the press at the rail */}
      {big && (<img src="/art/grounds/prop-tv-crane.webp" alt="" style={Object.assign({}, img, { right: aw * 0.01, top: rail - aw * 0.15, width: aw * 0.2, height: aw * 0.2, transformOrigin: "70% 92%", animation: still ? "none" : "craneSwing 7s ease-in-out infinite" })} />)}
      {big && (<img src="/art/grounds/prop-spidercam.webp" alt="" style={Object.assign({}, img, { left: aw * 0.46, top: ah * 0.12, width: aw * 0.07, height: aw * 0.07, animation: still ? "none" : "spiderHover 11s ease-in-out infinite" })} />)}
      {big && (<img key={"press" + (happy ? "f" : "")} src="/art/grounds/prop-photographers.webp" alt="" style={Object.assign({}, img, { left: aw * 0.04, top: ah * 0.5 - aw * 0.035, width: aw * 0.34, height: aw * 0.068, animation: happy && !still ? "pressFlash 0.9s ease-out 1" : "none" })} />)}
    </div>
  );
}
