/* ═══ Engine / Rivalry ═══ Your arch-rival: the granny you keep running into, preferably the one who keeps beating you.
   Picked from the head-to-head book after every tournament. Lead her by 3 and the feud is settled — she retires
   from the role and the next grudge can take her place. */

function record(list) { var w = list.filter(function (m) { return m.w; }).length; return { w: w, l: list.length - w, n: list.length }; }

/* How much of a grudge each opponent is: meetings count, losses count double, recent meetings matter more */
function grudge(list, sNum) {
  var r = record(list), recent = list.filter(function (m) { return m.s >= sNum - 1; }).length;
  return r.n * 2 + r.l * 3 + recent - Math.max(0, r.w - r.l) * 2;
}

/* Returns { rival, settled } — rival is the new value for player.rival (or null), settled the rival who was just put to bed */
export function updateRival(player, sNum, wk) {
  var h2h = player.h2h || {}, cur = player.rival || null, settled = null;
  var done = player.settledRivals || [];
  if (cur) {
    var rc = record(h2h[cur.id] || []);
    if (rc.w - rc.l >= 3) { settled = cur; cur = null; }
  }
  if (!cur) {
    var best = null, bestG = 0;
    Object.keys(h2h).forEach(function (id) {
      if (settled && String(settled.id) === id) return;
      if (done.indexOf(+id) >= 0 || done.indexOf(id) >= 0) return;
      var list = h2h[id], r = record(list);
      if (r.n < 2 || r.l < 1) return; /* a grudge needs history and at least one sting */
      var g = grudge(list, sNum);
      if (g > bestG) { bestG = g; best = { id: isNaN(+id) ? id : +id, name: list[list.length - 1].name, emoji: list[list.length - 1].emoji || "", since: { s: sNum, wk: wk } }; }
    });
    cur = best;
  }
  return { rival: cur, settled: settled };
}

export function rivalRecord(player) {
  if (!player.rival) return null;
  return record((player.h2h || {})[player.rival.id] || []);
}
