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
/* the near rows are whole strips of 14 spectators laid side by side (they tile without cutting anyone); there are
   twelve different casts (crowd-a … crowd-l, each with a cheering twin), and each strip in a row is a different cast,
   chosen by the ground, so the faces don't repeat along a row or from one ground to the next */
var CASTS = "abcdefghijkl".split("");
var ROWS = [
  { scale: 0.36, up: 0.1, beat: 1.9 },
  { scale: 0.42, up: 0.05, beat: 1.6 },
  { scale: 0.5, up: 0, beat: 1.35 }
];
/* the upper tiers of the big grounds, measured on each picture: [top, bottom] as shares of its height, and the part
   of the width kept clear where a sign or a royal box sits in the middle. Each tier is filled with a distant crowd
   (crowd-far-1…3), clipped to the tier, so it sits in the seats and never floats over the roof or the screens */
var BANDS = {
  "tour500-1": [[0.17, 0.25]], "tour500-2": [[0.11, 0.19]], "tour500-3": [[0.16, 0.22]], "tour500-4": [[0.16, 0.21]], "tour500-5": [[0.10, 0.18]], "tour500-6": [[0.21, 0.29], [0.36, 0.43]],
  "masters-1": [[0.13, 0.19], [0.20, 0.27]], "masters-2": [[0.08, 0.17], [0.20, 0.26]], "masters-3": [[0.09, 0.15], [0.17, 0.25]],
  "masters-4": [[0.04, 0.10], [0.12, 0.18], [0.20, 0.28]], "masters-5": [[0.06, 0.12], [0.14, 0.20], [0.21, 0.27]], "masters-6": [[0.13, 0.18], [0.19, 0.26]],
  "slam-coop": [[0.20, 0.27]], "slam-swamp": [[0.18, 0.25, 0.38, 0.62]], "slam-wimblehen": [[0.20, 0.28, 0.36, 0.64]], "slam-gale": [[0.18, 0.24, 0.30, 0.70]],
  "finals": [[0.18, 0.24, 0.36, 0.64]]
};
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
  /* a row is there or not, never a strip on its own: the front row first, then the middle, then the back as the
     stands fill up; from Tour 500 up every row is full and the upper tiers are full too */
  var big = tier >= 4, rows = fill < SPARSE_BELOW ? SPARSE : ROWS.filter(function (_, r) { return tier >= 3 || fill >= [0.7, 0.55, 0][r]; });
  var bands = tier >= 3 ? BANDS[G.key] || [] : [];
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
      {bands.map(function (b, k) {
        var bh = (b[1] - b[0]) * ah, th = bh * 1.15, tw = th * 5, clear = b.length > 2;
        var gap = clear ? "linear-gradient(90deg, #000 0, #000 " + (b[2] * 100 - 3) + "%, transparent " + (b[2] * 100) + "%, transparent " + (b[3] * 100) + "%, #000 " + (b[3] * 100 + 3) + "%, #000 100%)" : null;
        return (
          <div key={"band" + k} style={{ position: "absolute", left: 0, top: b[0] * ah, width: aw, height: bh, overflow: "hidden", WebkitMaskImage: gap || undefined, maskImage: gap || undefined }}>
            <div style={{ position: "absolute", left: -tw * 0.5, right: -tw * 0.5, bottom: -2, height: th, backgroundImage: "url(/art/layers/crowd-far-" + (1 + (k % 3)) + ".webp)", backgroundSize: tw + "px " + th + "px", backgroundRepeat: "repeat-x", backgroundPosition: (seat(G.key || "", "band", k) * tw) + "px 100%",
              animation: still ? "none" : happy ? "crowdCheer 0.5s ease-in-out " + (k * 0.07) + "s 3" : "crowdBob " + (2.3 + k * 0.4) + "s ease-in-out " + (-k * 0.6) + "s infinite", transformOrigin: "50% 100%" }} />
          </div>
        );
      })}
      {rows.map(function (row, r) {
        if (!row.far && !row.file) {
          /* a near row: whole strips, a different cast each, starting a little off the left edge */
          var tw = aw * row.scale, th = tw * 0.24, tb = rail - row.up * ah + 2, n = Math.ceil(aw / tw) + 1, x0 = -seat(G.key || "", r, 99) * tw * 0.6, prev = -1, used = {};
          return Array.from({ length: n }, function (_, i) {
            var ci = Math.floor(seat(G.key || "", r, "c" + i) * CASTS.length), tries = 0;
            while ((ci === prev || used[ci]) && tries++ < CASTS.length) ci = (ci + 1) % CASTS.length;
            prev = ci; used[ci] = 1;
            var anim = still ? "none"
              : happy ? "crowdCheer " + (0.42 + ((i * 7 + r) % 4) * 0.05) + "s ease-in-out " + (((i * 3 + r) % 5) * 0.06) + "s " + (mood === "party" ? "infinite" : "3")
              : mood === "groan" ? "crowdGroan 0.9s ease-out " + (((i + r) % 3) * 0.08) + "s 1 both"
              : "crowdBob " + (row.beat + (i % 3) * 0.23) + "s ease-in-out " + (-(i * 0.37 + r * 0.5)) + "s infinite";
            return (<img key={r + "-" + i + (happy ? "h" : "")} src={"/art/layers/crowd-" + CASTS[ci] + (happy ? "-cheer" : "") + ".webp"} alt="" style={Object.assign({}, img, { left: x0 + i * tw, top: tb - th, width: tw, height: th, animation: anim, transformOrigin: "50% 100%" })} />);
          });
        }
        var rw = aw * row.scale, rh = rw * (row.far ? 0.2 : 0.24), bottom = rail - row.up * ah + 2, gw = aw / GROUPS, pad = gw * 0.22;
        var fade = "linear-gradient(90deg, transparent 0, #000 " + (pad * 1.6) + "px, #000 calc(100% - " + (pad * 1.6) + "px), transparent 100%)";
        var src = "/art/layers/" + (happy && row.cheer ? row.cheer : row.file) + ".webp";
        return Array.from({ length: GROUPS }, function (_, g) {
          var anim = still ? "none"
            : happy ? "crowdCheer " + (0.42 + ((g * 7 + r) % 4) * 0.05) + "s ease-in-out " + (((g * 3 + r) % 5) * 0.06) + "s " + (mood === "party" ? "infinite" : "3")
            : mood === "groan" ? "crowdGroan 0.9s ease-out " + (((g + r) % 3) * 0.08) + "s 1 both"
            : "crowdBob " + (row.beat + (g % 3) * 0.23) + "s ease-in-out " + (-(g * 0.37 + r * 0.5)) + "s infinite";
          return (
            <div key={r + "-" + g + (happy ? "h" : "")} style={{ position: "absolute", left: g * gw - pad, top: bottom - rh, width: gw + 2 * pad, height: rh,
              backgroundImage: "url(" + src + ")", backgroundSize: rw + "px " + rh + "px", backgroundRepeat: "repeat-x",
              backgroundPosition: (-(g * gw - pad) + r * rw * 0.31 + (row.far ? rw * 0.47 : 0)) + "px 0", animation: row.far && !happy ? "crowdBob " + row.beat + "s ease-in-out " + (-g * 0.4) + "s infinite" : anim, transformOrigin: "50% 100%",
              WebkitMaskImage: fade, maskImage: fade, filter: row.far ? "brightness(0.95)" : undefined }} />
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
