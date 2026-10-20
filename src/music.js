// Background music — separate from the synthesized sound effects (sounds.js), with its own on/off switch.
// Two channels, each a shuffled playlist where a tune never comes back within two tracks:
//   menu   — the screens around the match; fades out while a match is on screen
//   battle — only the match itself: starts when the opening animation ends, fades out when the match is decided
//   gala   — "Glory and Gravy", only during the end-of-season gala (menu music steps aside, then comes back)

var VOLUME = 0.35, FADE_MS = 900, GAP_MS = 1500;
var KEY_ON = "arena-music";

function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : v; } catch (e) { return d; } }
function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

var enabled = load(KEY_ON, "true") !== "false";
var unlocked = false;       /* browsers only allow audio after the first tap or key */
var hidden = function () { return typeof document !== "undefined" && document.hidden; };

/* One playlist with its own audio element, fades and no-repeat memory */
function Channel(tracks, recentKey, gapMs) {
  var ch = { want: false, audio: null, fade: null, gap: null };
  var recent = (function () { try { return JSON.parse(load(recentKey, "[]")) || []; } catch (e) { return []; } })();

  function pickNext() {
    var pool = tracks.filter(function (t) { return recent.indexOf(t) < 0; });
    if (!pool.length) pool = tracks.slice();
    var t = pool[Math.floor(Math.random() * pool.length)];
    recent = [t].concat(recent.filter(function (r) { return r !== t; })).slice(0, 2);
    store(recentKey, JSON.stringify(recent));
    return t;
  }
  function fadeTo(target, ms, then) {
    if (ch.fade) clearInterval(ch.fade);
    if (!ch.audio) { if (then) then(); return; }
    var a = ch.audio, start = a.volume, steps = Math.max(1, Math.round(ms / 50)), i = 0;
    ch.fade = setInterval(function () {
      i++;
      a.volume = Math.max(0, Math.min(1, start + (target - start) * (i / steps)));
      if (i >= steps) { clearInterval(ch.fade); ch.fade = null; if (then) then(); }
    }, 50);
  }
  function startTrack() {
    if (ch.audio) { ch.audio.pause(); ch.audio.onended = null; }
    var a = new Audio(pickNext());
    ch.audio = a; a.preload = "auto"; a.volume = 0;
    a.onended = function () { if (ch.audio !== a) return; ch.audio = null; ch.gap = setTimeout(function () { ch.gap = null; ch.sync(); }, gapMs); };
    var p = a.play();
    if (p && p.catch) p.catch(function () { unlocked = false; /* still locked: the next tap retries */ });
    fadeTo(VOLUME, FADE_MS);
  }
  /* Play if wanted and allowed, otherwise fade out and pause (keeping the place in the tune) */
  ch.sync = function () {
    if (ch.want && enabled && unlocked && !hidden()) {
      if (ch.gap) return;
      if (ch.audio && !ch.audio.ended) {
        if (ch.audio.paused) { var p = ch.audio.play(); if (p && p.catch) p.catch(function () {}); }
        fadeTo(VOLUME, FADE_MS);
      } else startTrack();
    } else {
      if (ch.gap) { clearTimeout(ch.gap); ch.gap = null; }
      if (ch.audio) { var a = ch.audio; fadeTo(0, FADE_MS, function () { if (a === ch.audio) a.pause(); }); }
    }
  };
  /* Fresh tune next time (used when a match ends: the next match gets a new one) */
  ch.drop = function () { var a = ch.audio; if (!a) return; fadeTo(0, FADE_MS, function () { a.pause(); if (ch.audio === a) ch.audio = null; }); };
  ch.peek = function () { return { want: ch.want, track: ch.audio ? ch.audio.src.split("/").pop() : null, paused: ch.audio ? ch.audio.paused : null, volume: ch.audio ? +ch.audio.volume.toFixed(2) : null, recent: recent.slice() }; };
  ch.skip = function () { if (ch.audio && ch.audio.duration) ch.audio.currentTime = Math.max(0, ch.audio.duration - 0.3); };
  return ch;
}

var menu = Channel(["/music/rooster.mp3", "/music/jousting.mp3", "/music/grandma.mp3", "/music/grandma-joust.mp3", "/music/roosters-and-sticks.mp3"], "arena-music-recent", GAP_MS);
var battle = Channel(["/music/fight-1.mp3", "/music/fight-2.mp3", "/music/fight-3.mp3", "/music/fight-4.mp3"], "arena-battle-recent", 300);
var gala = Channel(["/music/gala.mp3"], "arena-gala-recent", 800);
menu.want = true;

function syncAll() { menu.sync(); battle.sync(); gala.sync(); }

/* ── Public API ── */

export function isMusicOn() { return enabled; }
export function setMusicOn(v) { enabled = !!v; store(KEY_ON, enabled ? "true" : "false"); syncAll(); }

/* A match is on screen (PowerBar mounted): menu music bows out. Leaving is debounced so the gap between
   two matches in the same tournament doesn't bring the menu music back for a second */
var matchDepth = 0, leaveTimer = null;
export function enterMatch() {
  matchDepth++;
  if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }
  if (menu.want) { menu.want = false; menu.sync(); }
}
export function leaveMatch() {
  matchDepth = Math.max(0, matchDepth - 1);
  stopBattle();
  if (matchDepth > 0) return;
  if (leaveTimer) clearTimeout(leaveTimer);
  leaveTimer = setTimeout(function () { leaveTimer = null; if (matchDepth === 0) { menu.want = true; menu.sync(); } }, 1200);
}

/* Battle music: from the end of the opening animation until the match is decided */
export function startBattle() { if (!battle.want) { battle.want = true; battle.sync(); } }
export function stopBattle() { if (battle.want) { battle.want = false; battle.drop(); } }

/* The season gala has its own tune, and only the gala plays it */
export function enterGala() { menu.want = false; menu.sync(); gala.want = true; gala.sync(); }
export function leaveGala() { gala.want = false; gala.drop(); if (matchDepth === 0) { menu.want = true; menu.sync(); } }

/* First tap/key anywhere unlocks audio; music pauses while the app is in the background */
if (typeof window !== "undefined") {
  var unlock = function () { if (unlocked) return; unlocked = true; syncAll(); };
  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
  document.addEventListener("visibilitychange", function () {
    if (hidden()) { [menu, battle, gala].forEach(function (c) { if (c.audio) c.audio.pause(); }); } else syncAll();
  });
  /* Read-only peek and a skip, for debugging from the console */
  window.__gjMusic = function () { return { enabled: enabled, unlocked: unlocked, menu: menu.peek(), battle: battle.peek(), gala: gala.peek() }; };
  window.__gjMusicSkip = function (which) { (which === "battle" ? battle : menu).skip(); };
}
