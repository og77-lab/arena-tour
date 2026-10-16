/* ═══ Engine / Migrate ═══ Older tours reused first names ("two Lunas"). Give every NPC her unique full name, keeping
   her title ("…the Bold"), and update every place the save mentions her: brackets, head-to-head, rival, the paper. */

import { npcName } from "../models/persona";
import { sh } from "../models/formulas";

export function needsUniqueNames(S) {
  if (!S || !S.npcs) return false;
  var seen = {};
  for (var i = 0; i < S.npcs.length; i++) { var k = sh(S.npcs[i].name); if (seen[k]) return true; seen[k] = 1; }
  return false;
}

export function uniqueNames(S) {
  if (!needsUniqueNames(S)) return S;
  var map = {};
  S.npcs.forEach(function (n) {
    var title = (n.name || "").split(" the ")[1];
    map[n.id] = npcName(Math.max(0, n.id - 2) % 999) + (title ? " the " + title.replace(/ \d+$/, "") : "");
  });
  /* Walk the whole save: any object with an NPC id and a name gets the new name */
  function walk(v) {
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      var o = {};
      Object.keys(v).forEach(function (k) { o[k] = walk(v[k]); });
      if (typeof o.id === "number" && o.id !== 1 && typeof o.name === "string" && map[o.id]) o.name = map[o.id];
      return o;
    }
    return v;
  }
  var out = walk(S);
  /* Head-to-head is keyed by id; its entries carry only the name */
  var h2h = out.player && out.player.h2h;
  if (h2h) Object.keys(h2h).forEach(function (id) { if (map[id]) h2h[id] = h2h[id].map(function (e) { return Object.assign({}, e, { name: map[id] }); }); });
  return out;
}
