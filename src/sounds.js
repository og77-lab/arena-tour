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
    osc.frequency.value = opts.freq;
    osc.connect(gain); gain.connect(ctx.destination);
    var t = ctx.currentTime;
    var duration = opts.duration || 0.15;
    var volume = opts.volume != null ? opts.volume : 0.2;
    var attack = opts.attack != null ? opts.attack : 0.008;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(volume, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  } catch (e) {}
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
