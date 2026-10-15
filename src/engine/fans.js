/* ═══ Engine / Fans ═══ Crowd support (0–100): earned on the lance, won or lost in interviews, and it pays back */

export var FAN_START = 20;

export function fansOf(player) { return player && player.fans != null ? player.fans : FAN_START; }
export function clampFans(f) { return Math.max(0, Math.min(100, Math.round(f))); }

/* Fans slowly forget: 5% of the way back toward 30 each week */
export function weeklyDrift(f) { return f + Math.round((30 - f) * 0.05); }

/* How the week's riding moved the crowd. log = this tournament's matches (see onTR) */
export function performanceDelta(log, title, isGS) {
  var d = 0, notes = [];
  (log || []).forEach(function (m) {
    if (m.won) {
      d += 2;
      if (m.seq && m.seq.indexOf("L") < 0) d += 1;
      if (m.seq && m.seq.charAt(0) === "L") { d += 2; notes.push("comeback"); }
      if (m.oppRank && m.myRank && m.myRank - m.oppRank >= 50) { d += 3; notes.push("upset"); }
    } else d -= 1;
  });
  if (log && log.length === 1 && !log[0].won) d -= 1;
  if (title) d += isGS ? 12 : 6;
  return { d: d, notes: notes };
}

/* ── What fans buy you ── */
export function sponsorTP(f) { return Math.floor(f / 10); }
export function hasTierWildcard(f) { return f >= 70; }
export function hasSlamWildcard(f) { return f >= 80; }
/* Extra gold-zone width on a deciding strike */
export function crowdRoar(f) { return f >= 85 ? 2 : f >= 60 ? 1 : 0; }
