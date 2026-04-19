/* ═══ Engine / Persistence ═══ LocalStorage load/save for the game state */

import { SK } from "../models/constants";

export function sSet(v) {
  try {
    if (v === null) { localStorage.removeItem(SK); }
    else { localStorage.setItem(SK, JSON.stringify(v)); }
  } catch (e) {}
}

export function sGet() {
  try {
    var r = localStorage.getItem(SK);
    return r ? JSON.parse(r) : null;
  } catch (e) { return null; }
}
