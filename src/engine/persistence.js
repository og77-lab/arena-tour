/* ═══ Engine / Persistence ═══ LocalStorage save (every change) + throttled cloud sync */

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

/* Every save carries when it was written and whose it is, so load can pick the newest copy that belongs to this player */
export function stamp(state, owner) {
  return Object.assign({}, state, { _savedAt: Date.now(), _owner: owner || "guest" });
}

/* Local is written synchronously on every strike, so on this device it is usually the newest.
   It only beats the cloud copy when it belongs to the same player and is strictly newer;
   with no cloud save at all, any local save is used (lets a guest save carry over into a new account). */
export function pickNewest(local, cloud, owner) {
  var localOk = !!(local && local.player);
  var cloudOk = !!(cloud && cloud.player);
  if (!cloudOk) return localOk ? local : null;
  if (localOk && local._owner === (owner || "guest") && (local._savedAt || 0) > (cloud._savedAt || 0)) return local;
  return cloud;
}

/* Cloud writes upload the whole save (~250KB with the full NPC field), so they are coalesced:
   at most one write per CLOUD_DELAY, flushed early when the page is hidden or closed. */
var CLOUD_DELAY = 8000;
var pending = null, timer = null;

export function queueCloudSave(userId, state, writer) {
  if (!userId) return;
  pending = { userId: userId, state: state, writer: writer };
  if (!timer) timer = setTimeout(flushCloudSave, CLOUD_DELAY);
}

export function flushCloudSave() {
  if (timer) { clearTimeout(timer); timer = null; }
  if (!pending) return;
  var p = pending; pending = null;
  p.writer(p.userId, p.state).catch(function (e) { console.error("Cloud save failed:", e); });
}

export function cancelCloudSave() {
  if (timer) { clearTimeout(timer); timer = null; }
  pending = null;
}

if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flushCloudSave(); });
  window.addEventListener("pagehide", flushCloudSave);
}
