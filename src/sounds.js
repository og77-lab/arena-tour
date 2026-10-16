// Web Audio API sound effects — no external files needed.
// Sounds are synthesized on the fly with short oscillator envelopes.

let audioCtx = null;
let muted = typeof localStorage !== "undefined" && localStorage.getItem("arena-muted") === "true";

function getCtx() {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) { return null; }
  }
  // Browsers suspend the context until a user gesture — resume if needed.
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(function(){});
  }
  return audioCtx;
}

export function setMuted(val) {
  muted = !!val;
  try { localStorage.setItem("arena-muted", muted ? "true" : "false"); } catch (e) {}
}

export function isMuted() { return muted; }

function tone(opts) {
  if (muted) return;
  try {
    var ctx = getCtx(); if (!ctx) return;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();
    osc.type = opts.type || "sine";
    var t = ctx.currentTime;
    var duration = opts.duration || 0.15;
    osc.frequency.setValueAtTime(opts.freq, t);
    if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    var volume = opts.volume != null ? opts.volume : 0.2;
    var attack = opts.attack != null ? opts.attack : 0.008;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch (e) {}
}

var noiseBuf = null;
function getNoise(ctx) {
  if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf;
  var len = ctx.sampleRate;
  var b = ctx.createBuffer(1, len, ctx.sampleRate);
  var d = b.getChannelData(0);
  for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  return b;
}

function noise(opts) {
  if (muted) return;
  try {
    var ctx = getCtx(); if (!ctx) return;
    var t = ctx.currentTime;
    var duration = opts.duration || 0.2;
    var src = ctx.createBufferSource();
    src.buffer = getNoise(ctx);
    var f = ctx.createBiquadFilter();
    f.type = opts.filter || "lowpass";
    f.frequency.setValueAtTime(opts.freq || 800, t);
    if (opts.freqEnd) f.frequency.exponentialRampToValueAtTime(opts.freqEnd, t + duration);
    f.Q.value = opts.q || 1;
    var g = ctx.createGain();
    var vol = opts.volume != null ? opts.volume : 0.2;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + (opts.attack || 0.005));
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(t);
    src.stop(t + duration + 0.05);
  } catch (e) {}
}

/* The announcer's shout on FIGHT! — a recorded clip, loaded ahead of time so it lands exactly on the title */
var FIGHT_VOICE = "/sfx/fight.mp3";
var fightVoice = null;
export function preloadFightVoice() {
  if (fightVoice || typeof Audio === "undefined") return;
  fightVoice = new Audio(FIGHT_VOICE); fightVoice.preload = "auto"; fightVoice.volume = 1;
  try { fightVoice.load(); } catch (e) {}
}
export function playFightVoice() {
  if (muted) return;
  preloadFightVoice();
  if (!fightVoice) return;
  try { fightVoice.currentTime = 0; var p = fightVoice.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
}

export function playWhoosh() {
  noise({ filter: "bandpass", freq: 300, freqEnd: 3200, duration: 0.4, volume: 0.22, q: 0.8, attack: 0.15 });
}

/* Newspaper fold — two crisp paper crinkles and a soft swish as it's tossed aside */
export function playPaperFold() {
  noise({ filter: "highpass", freq: 2400, duration: 0.16, volume: 0.12, attack: 0.02 });
  setTimeout(function () { noise({ filter: "highpass", freq: 3000, duration: 0.14, volume: 0.11, attack: 0.02 }); }, 380);
  setTimeout(function () { noise({ filter: "bandpass", freq: 1800, freqEnd: 500, duration: 0.3, volume: 0.1, q: 0.7, attack: 0.08 }); }, 720);
}

export function playImpact(heavy) {
  tone({ freq: heavy ? 150 : 180, freqEnd: 38, duration: heavy ? 0.5 : 0.3, volume: heavy ? 0.45 : 0.32, type: "sine" });
  noise({ filter: "lowpass", freq: 1600, freqEnd: 150, duration: heavy ? 0.35 : 0.2, volume: heavy ? 0.3 : 0.2 });
}

export function playBeep() {
  tone({ freq: 523, duration: 0.11, volume: 0.13, type: "square" });
  noise({ filter: "lowpass", freq: 500, duration: 0.1, volume: 0.12 });
}

export function playFight() {
  playImpact(true);
  tone({ freq: 220, duration: 0.5, volume: 0.1, type: "sawtooth" });
  tone({ freq: 659, duration: 0.45, volume: 0.14, type: "triangle" });
  tone({ freq: 988, duration: 0.45, volume: 0.11, type: "triangle" });
}

export function playTick() {
  tone({ freq: 1900, duration: 0.025, volume: 0.035, type: "square" });
}

export function playClash(won) {
  playImpact(false);
  noise({ filter: "highpass", freq: 3000, duration: 0.18, volume: 0.13 });
  if (won) {
    tone({ freq: 1250, duration: 0.3, volume: 0.14, type: "triangle" });
    tone({ freq: 1875, duration: 0.24, volume: 0.09, type: "triangle" });
  } else {
    tone({ freq: 330, freqEnd: 180, duration: 0.35, volume: 0.13, type: "sawtooth" });
  }
}

export function playVictoryBig() {
  playImpact(true);
  [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) {
    setTimeout(function () { tone({ freq: f, duration: i === 3 ? 0.7 : 0.18, volume: 0.2, type: "triangle" }); }, 140 + i * 110);
  });
  setTimeout(function () { tone({ freq: 261.6, duration: 0.9, volume: 0.07, type: "sawtooth" }); }, 470);
}

export function playDefeatBig() {
  playImpact(true);
  noise({ filter: "lowpass", freq: 400, freqEnd: 60, duration: 1.3, volume: 0.22, attack: 0.05 });
  setTimeout(function () { tone({ freq: 196, freqEnd: 92, duration: 0.95, volume: 0.15, type: "sawtooth" }); }, 160);
}

/* Chicken feet pattering during the charge */
export function playGallop() {
  for (var i = 0; i < 5; i++) {
    (function (n) {
      setTimeout(function () { noise({ filter: "bandpass", freq: 900 + (n % 2) * 300, duration: 0.04, volume: 0.12, q: 3 }); }, n * 70);
    })(i);
  }
}

/* Indignant "bawk!" at the clash */
export function playCluck() {
  tone({ freq: 700, freqEnd: 1500, duration: 0.07, volume: 0.1, type: "square" });
  setTimeout(function () { tone({ freq: 1300, freqEnd: 600, duration: 0.14, volume: 0.1, type: "square" }); }, 70);
}

/* Colander helmet flying off */
export function playClang() {
  tone({ freq: 1480, duration: 0.35, volume: 0.09, type: "triangle" });
  tone({ freq: 2210, duration: 0.25, volume: 0.06, type: "triangle" });
  tone({ freq: 3170, duration: 0.18, volume: 0.04, type: "sine" });
}

export function playHeartbeat() {
  tone({ freq: 70, freqEnd: 45, duration: 0.18, volume: 0.4, type: "sine" });
  setTimeout(function () { tone({ freq: 62, freqEnd: 40, duration: 0.22, volume: 0.32, type: "sine" }); }, 190);
}

export function playCrack() {
  noise({ filter: "highpass", freq: 2200, duration: 0.12, volume: 0.25 });
  setTimeout(function () { noise({ filter: "bandpass", freq: 1200, freqEnd: 300, duration: 0.3, volume: 0.15, q: 2 }); }, 40);
}

// Strike sounds — score-based
export function playStrike(score) {
  if (muted) return;
  if (score >= 85) {
    // Perfect / gold zone — bright two-tone chirp
    tone({ freq: 880, duration: 0.12, volume: 0.22, type: "triangle" });
    setTimeout(function(){ tone({ freq: 1320, duration: 0.18, volume: 0.2, type: "triangle" }); }, 55);
  } else if (score >= 60) {
    // Good hit — medium tap
    tone({ freq: 520, duration: 0.1, volume: 0.18, type: "square" });
  } else {
    // Bad miss — low dull thud
    tone({ freq: 110, duration: 0.2, volume: 0.18, type: "sawtooth" });
  }
}

// Victory — short rising arpeggio (C-E-G)
export function playVictory() {
  if (muted) return;
  tone({ freq: 523.25, duration: 0.14, volume: 0.2, type: "triangle" });
  setTimeout(function(){ tone({ freq: 659.25, duration: 0.14, volume: 0.2, type: "triangle" }); }, 120);
  setTimeout(function(){ tone({ freq: 783.99, duration: 0.32, volume: 0.23, type: "triangle" }); }, 240);
}

// Defeat — low descending tone
export function playDefeat() {
  if (muted) return;
  tone({ freq: 220, duration: 0.22, volume: 0.18, type: "sawtooth" });
  setTimeout(function(){ tone({ freq: 165, duration: 0.38, volume: 0.18, type: "sawtooth" }); }, 160);
}

// Tournament title won — extended victory fanfare
export function playTitle() {
  if (muted) return;
  playVictory();
  setTimeout(function(){ tone({ freq: 1046.5, duration: 0.5, volume: 0.25, type: "triangle" }); }, 560);
}

// Rank-up chime — bright ascending two-tone
export function playRankUp() {
  if (muted) return;
  tone({ freq: 659.25, duration: 0.12, volume: 0.2, type: "triangle" });
  setTimeout(function(){ tone({ freq: 987.77, duration: 0.18, volume: 0.22, type: "triangle" }); }, 90);
  setTimeout(function(){ tone({ freq: 1318.51, duration: 0.28, volume: 0.2, type: "triangle" }); }, 210);
}

// Subtle click for button taps
export function playClick() {
  if (muted) return;
  tone({ freq: 600, duration: 0.04, volume: 0.08, type: "square" });
}
