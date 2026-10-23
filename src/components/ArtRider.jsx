/* ═══ ArtRider ═══ A painted rider. Where the art comes in layers (rooster, granny) she's put together here with the
   kit she rides with: the rooster, then her saddle on its back, then the granny, then her lance in her fist. Otherwise
   it's the one flat picture of her pose. Every layer shares the 1250×1000 canvas, facing right; flip mirrors it all.
   Places are shares of that canvas, measured on the pictures: where her fist closes, where the rooster's back dips. */

import * as React from "react";
import { riderSrc } from "./artSprites";
import { RIGS, HEADS } from "./artRigs";

var FILE = { idle: "idle", charge: "charge", deflect: "deflect", knocked: "hit", fallen: "fallen", cheer: "cheer" };

/* per pose: the lance's tilt and the saddle's size (share of the width); where her fist closes and where the saddle
   sits come from artRigs, measured on each granny. In a fall the lance lies on the ground. */
var POSE_KIT = {
  idle: { tilt: -6, saddle: 0.34 }, charge: { tilt: 0, saddle: 0.34 }, deflect: { tilt: -14, saddle: 0.34 },
  knocked: { tilt: -34, saddle: 0.34 }, fallen: { tilt: 4, saddle: 0.26, drop: [0.40, 0.93] }, cheer: { tilt: -42, saddle: 0.34 }
};
/* rank hats sit over her own hat: this wide (share of the canvas), dropped this far over the top of her head */
var HAT_W = 0.2, HAT_SINK = 0.11;
/* the lance: its length (share of the width) and where along it the fist holds it; in the lance pictures the lance
   itself runs from 25.5% to 74.5% of the width, the glove at the right end */
var LANCE_LEN = 1.0, LANCE_GRIP = 0.62, LANCE_FROM = 0.255, LANCE_SPAN = 0.49;
function rigOf(key, pose) { var r = RIGS[key]; return r && r.poses[pose] ? r : null; }
/* how far right of her picture the glove reaches when she charges (in the flat pictures it's the right edge) */
export function gloveReach(key) { var r = rigOf(key, "charge"); return r ? r.poses.charge.fist[0] + LANCE_LEN * (1 - LANCE_GRIP) : 1; }

export default function ArtRider(props) {
  var w = props.width, h = w * 0.8, pose = props.pose || "idle", key = props.art;
  var img = { position: "absolute", display: "block", maxWidth: "none", pointerEvents: "none", userSelect: "none" };
  var base = { position: "relative", display: "block", width: w, height: h, transform: props.flip ? "scaleX(-1)" : "none" };
  var R = rigOf(key, pose);
  /* her rank on her head: the golden helmet for the top 10, the crown for No. 1; it flies off in a fall */
  var head = R ? R.poses[pose].head : (HEADS[key] || {})[pose];
  var hatSrc = props.hat && head && pose !== "fallen" ? "/art/layers/hat-" + (props.hat === "crown" ? "crown" : "golden-helmet") + ".webp" : null;
  var hw = HAT_W * w, hh = hw * 500 / 600;
  var hat = hatSrc ? (<img src={hatSrc} alt="" draggable={false} style={Object.assign({}, img, { left: head[0] * w - hw / 2, top: (head[1] + HAT_SINK) * h - hh, width: hw, height: hh })} />) : null;
  if (!R) return (
    <span style={base}><img src={riderSrc(key, pose)} alt="" draggable={false} loading="lazy" style={Object.assign({}, img, { left: 0, top: 0, width: w, height: h })} />{hat}</span>
  );
  var name = R.name, f = FILE[pose] || "idle", P = R.poses[pose], rig = { tilt: POSE_KIT[pose].tilt, saddle: POSE_KIT[pose].saddle, seat: P.seat, fist: POSE_KIT[pose].drop ? null : P.fist, drop: POSE_KIT[pose].drop };
  var lance = props.lance || "broom", saddle = props.saddle || "teacosy";
  var sw = rig.saddle * w, sh = sw * 0.625;
  var lw = LANCE_LEN * w / LANCE_SPAN, lh = lw * 0.2, gripAt = LANCE_FROM + LANCE_GRIP * LANCE_SPAN;
  var at = rig.fist || rig.drop;
  return (
    <span style={base}>
      <img src={"/art/layers/rooster-" + name + "-" + f + ".webp"} alt="" draggable={false} style={Object.assign({}, img, { left: 0, top: 0, width: w, height: h })} />
      <img src={"/art/saddle-" + saddle + ".webp"} alt="" draggable={false} style={Object.assign({}, img, { left: rig.seat[0] * w - sw / 2, top: rig.seat[1] * h - sh * 0.4, width: sw, height: sh })} />
      <img src={"/art/layers/rider-" + name + "-" + f + ".webp"} alt="" draggable={false} style={Object.assign({}, img, { left: 0, top: 0, width: w, height: h })} />
      <img src={"/art/lance-" + lance + ".webp"} alt="" draggable={false} style={Object.assign({}, img, { left: at[0] * w - lw * gripAt, top: at[1] * h - lh / 2, width: lw, height: lh, transformOrigin: (gripAt * 100) + "% 50%", transform: "rotate(" + rig.tilt + "deg)" })} />
      {hat}
    </span>
  );
}

/* every picture a rider needs, fetched ahead so no pose blinks in late */
export function artFiles(key, kit) {
  if (!key) return [];
  var R = RIGS[key];
  if (!R) return Object.keys(FILE).map(function (p) { return riderSrc(key, p); });
  var name = R.name, out = ["/art/lance-" + ((kit && kit.lance) || "broom") + ".webp", "/art/saddle-" + ((kit && kit.saddle) || "teacosy") + ".webp"];
  Object.keys(FILE).forEach(function (p) { if (R.poses[p]) out.push("/art/layers/rooster-" + name + "-" + FILE[p] + ".webp", "/art/layers/rider-" + name + "-" + FILE[p] + ".webp"); else out.push(riderSrc(key, p)); });
  return out;
}
