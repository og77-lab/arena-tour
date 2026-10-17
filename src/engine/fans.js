/* ═══ Engine / Fans ═══ Crowd support (0–100): earned on the lance, won or lost in interviews, and it pays back */

export var FAN_START = 20;

export function fansOf(player) { return player && player.fans != null ? player.fans : FAN_START; }
export function clampFans(f) { return Math.max(0, Math.min(100, Math.round(f))); }

/* Fans slowly drift back toward a baseline each week (10% of the way). Fame sets the baseline:
   the world's best always have a following, an unknown granny starts from a handful of loyal neighbours */
export function fanBaseline(rank) { return !rank ? 30 : rank <= 10 ? 60 : rank <= 50 ? 50 : rank <= 200 ? 40 : 30; }
export function weeklyDrift(f, rank, lift) { return f + Math.round((fanBaseline(rank) + (lift || 0) - f) * 0.1); }

/* How the week's riding moved the crowd. log = this tournament's matches (see onTR), fans = support before the week.
   Wins, comebacks and real upsets (beating someone ranked well above you, not just anyone when you're near the bottom)
   add up to at most +6 a week, a title adds on top, and the closer you are to 100 the harder each point comes —
   so a wildcard into the Slams takes a proper run of form, not three good weeks. */
export function performanceDelta(log, title, isGS, fans) {
  var d = 0, notes = [], upsets = 0, comeback = false;
  (log || []).forEach(function (m) {
    if (m.won) {
      d += 1;
      if (m.seq && m.seq.charAt(0) === "L" && !comeback) { comeback = true; d += 2; notes.push("comeback"); }
      if (m.oppRank && m.myRank && m.myRank - m.oppRank >= Math.max(50, m.myRank * 0.4) && upsets < 2) { upsets++; d += 2; if (upsets === 1) notes.push("upset"); }
    } else d -= 1;
  });
  if (log && log.length === 1 && !log[0].won) d -= 1;
  d = Math.min(d, 6);
  if (title) d += isGS ? 10 : 4;
  if (d > 0) d = Math.round(d * Math.max(0.3, Math.min(1, (100 - fansOf({ fans: fans })) / 80)));
  return { d: d, notes: notes };
}

/* ── What fans buy you ── */
export function sponsorTP(f) { return Math.floor(f / 10); }
/* Wildcards are earned on the ranking first: only a rider just outside the cut (within 15% of it) can be let in,
   and only if the crowd is loudly behind her. cut = the worst rank that gets in on merit */
export var TIER_WILD_FANS = 70, SLAM_WILD_FANS = 80, SLAM_CUT = 64;
export function wildcardReach(cut) { return Math.round(cut * 1.15); }
export function hasTierWildcard(f, rank, cut) { return f >= TIER_WILD_FANS && rank > cut && rank <= wildcardReach(cut); }
export function hasSlamWildcard(f, rank) { return f >= SLAM_WILD_FANS && rank > SLAM_CUT && rank <= wildcardReach(SLAM_CUT); }
/* Extra gold-zone width on a deciding strike */
export function crowdRoar(f) { return f >= 85 ? 2 : f >= 60 ? 1 : 0; }
