// Background music — separate from the synthesized sound effects (sounds.js), with its own on/off switch.
// Menu music: four tunes shuffled so the same tune never comes back within two tracks.
// During a match the menu music fades out; the match will get its own track (playBattle hook below).

var MENU_TRACKS = ["/music/rooster.mp3", "/music/jousting.mp3", "/music/grandma.mp3", "/music/grandma-joust.mp3"];
var VOLUME = 0.35, FADE_MS = 900, GAP_MS = 1500;
var KEY_ON = "arena-music", KEY_RECENT = "arena-music-recent";

function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var enabled = load(KEY_ON, "true") !== "false";
var recent = (function () { try { return JSON.parse(load(KEY_RECENT, "[]")) || []; } catch (e) { return []; } })();
var mode = "menu";          /* "menu" | "match" */
var unlocked = false;       /* browsers only allow audio after the first tap or key */
var audio = null, fadeTimer = null, gapTimer = null, leaveTimer = null, matchDepth = 0;

/* Never the current tune or the one before it */
function pickNext() {
  var pool = MENU_TRACKS.filter(function (t) { return recent.indexOf(t) < 0; });
  if (!pool.length) pool = MENU_TRACKS.slice();
  var t = pool[Math.floor(Math.random() * pool.length)];
  recent = [t].concat(recent.filter(function (r) { return r !== t; })).slice(0, 2);
  store(KEY_RECENT, JSON.stringify(recent));
  return t;
}

function fadeTo(target, ms, then) {
  if (fadeTimer) clearInterval(fadeTimer);
  if (!audio) { if (then) then(); return; }
  var a = audio, start = a.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
  fadeTimer = setInterval(function () {
    i++;
    a.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
    if (i >= steps) { clearInterval(fadeTimer); fadeTimer = null; if (then) then(); }
  }, 50);
}

function startTrack(src) {
  if (audio) { audio.pause(); audio.onended = null; }
  audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = 0;
  audio.onended = function () { audio = null; gapTimer = setTimeout(function () { gapTimer = null; playMenu(); }, GAP_MS); };
  var p = audio.play();
  if (p && p.catch) p.catch(function () { /* still locked — the next tap will retry */ unlocked = false; });
  fadeTo(VOLUME, FADE_MS);
}

function shouldPlay() { return enabled && unlocked && mode === "menu" && !(typeof document !== "undefined" && document.hidden); }

/* Start or resume the menu music if everything allows it */
function playMenu() {
  if (!shouldPlay() || gapTimer) return;
  if (audio && !audio.ended) {
    if (audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
    fadeTo(VOLUME, FADE_MS);
    return;
  }
  startTrack(pickNext());
}

function pauseMenu() {
  if (gapTimer) { clearTimeout(gapTimer); gapTimer = null; }
  if (!audio) return;
  var a = audio;
  fadeTo(0, FADE_MS, function () { if (a === audio) a.pause(); });
}

/* ── Public API ── */

export function isMusicOn() { return enabled; }
export function setMusicOn(v) {
  enabled = !!v; store(KEY_ON, enabled ? "true" : "false");
  if (enabled) playMenu(); else pauseMenu();
}

/* A match is on screen (PowerBar mounted): menu music bows out. Leaving is debounced so the gap between
   two matches in the same tournament doesn't bring the music back for a second */
export function enterMatch() {
  matchDepth++;
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
  if (mode !== "match") { mode = "match"; pauseMenu(); }
}
export function leaveMatch() {
  matchDepth = Math.max(0, matchDepth - 1);
  if (matchDepth > 0) return;
  if (leaveTimer) clearTimeout(leaveTimer);
  leaveTimer = setTimeout(function () { leaveTimer = null; if (matchDepth === 0) { mode = "menu"; playMenu(); } }, 1200);
}

/* First tap/key anywhere unlocks audio; music pauses while the app is in the background */
if (typeof window !== "undefined") {
  var unlock = function () { if (unlocked) return; unlocked = true; playMenu(); };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  document.addEventListener("visibilitychange", function () { if (document.hidden) { if (audio) audio.pause(); } else playMenu(); });
  /* Read-only peek for debugging from the console */
  window.__gjMusic = function () { return { mode: mode, enabled: enabled, unlocked: unlocked, track: audio ? audio.src.split("/").pop() : null, paused: audio ? audio.paused : null, volume: audio ? +audio.volume.toFixed(2) : null, recent: recent.slice() }; };
  window.__gjMusicSkip = function () { if (audio && audio.duration) audio.currentTime = Math.max(0, audio.duration - 0.3); };
}
