/* ═══ Engine / Codec ═══ A compact save. 999 rivals stored as objects repeat every field name a thousand times, so on
   disk (and in the cloud) each rival becomes a short array of numbers instead; the live tournament bracket keeps
   only ids. pack() is used on every save, unpack() on every load; saves written before this (plain objects) load
   as they are. Anything unknown on a rival is kept in a trailing "extras" object, so nothing is ever lost. */

var VERSION = 2;
var TR = ["r", "p", "f", "s", "g", "b", "tp"];
var BEST = ["rank", "peakS", "titles", "gsTitles", "finals", "careerMoney"];
var KNOWN = { id: 1, name: 1, emoji: 1, isP: 1, skill: 1, pot: 1, sp: 1, ap: 1, tr: 1, best: 1, money: 1, fg: 1, fr: 1, inj: 1 };

function num(v) { return typeof v === "number" ? v : 0; }
function trimNulls(a) { while (a.length && (a[a.length - 1] === null || a[a.length - 1] === 0)) a.pop(); return a; }

function packNpc(n) {
  var tr = n.tr || {}, b = n.best || {}, extra = null;
  Object.keys(n).forEach(function (k) { if (!KNOWN[k] && n[k] !== undefined) { extra = extra || {}; extra[k] = n[k]; } });
  var bestArr = BEST.map(function (k) { return b[k] == null ? null : b[k]; });
  /* best fields not in the list ride along too */
  Object.keys(b).forEach(function (k) { if (BEST.indexOf(k) < 0) { extra = extra || {}; extra._best = extra._best || {}; extra._best[k] = b[k]; } });
  return trimNulls([
    n.id, n.name, n.emoji || "", Math.round(num(n.skill) * 10), num(n.pot), Math.round(num(n.sp)), Math.round(num(n.ap)),
    trimNulls(TR.map(function (k) { return num(tr[k]); })), trimNulls(bestArr),
    Math.round(num(n.money)), n.fg == null ? null : n.fg, n.fr == null ? null : n.fr,
    n.inj && n.inj.length ? n.inj.map(function (x) { return [x.id, x.left]; }) : null,
    extra
  ]);
}
function unpackNpc(a) {
  var n = { id: a[0], name: a[1], emoji: a[2] || "", isP: false, skill: num(a[3]) / 10, pot: num(a[4]), sp: num(a[5]), ap: num(a[6]) };
  var tr = {}; TR.forEach(function (k, i) { tr[k] = num((a[7] || [])[i]); }); n.tr = tr;
  var best = {}; BEST.forEach(function (k, i) { var v = (a[8] || [])[i]; best[k] = v != null ? v : (k === "rank" ? 1001 : 0); }); n.best = best;
  n.money = num(a[9]);
  if (a[10] != null) n.fg = a[10];
  if (a[11] != null) n.fr = a[11];
  if (a[12]) n.inj = a[12].map(function (x) { return { id: x[0], left: x[1] }; });
  if (a[13]) { var ex = a[13]; Object.keys(ex).forEach(function (k) { if (k === "_best") Object.assign(n.best, ex._best); else n[k] = ex[k]; }); }
  return n;
}

/* Bracket riders: rivals become { i: id, t: points so far }, you become { p: 1, t } */
function packRider(r) { if (!r) return r; if (r.isP) return { p: 1, t: r.tP || 0 }; return { i: r.id, t: r.tP || 0 }; }
function unpackRider(r, byId, S) {
  if (!r || (r.i == null && !r.p)) return r;
  if (r.p) return Object.assign({}, S.player, { name: S.pName, isP: true, tP: r.t || 0 });
  return Object.assign({}, byId[r.i] || { id: r.i, name: "?" }, { tP: r.t || 0 });
}
function mapBracket(bk, f) { return (bk || []).map(function (rd) { return rd ? rd.map(function (m) { return { a: f(m.a), b: f(m.b), w: m.w ? f(m.w) : null }; }) : rd; }); }

/* Season-start snapshot { ranks, titles, tr } keyed by id → dense arrays indexed by id */
function packMap(m) { if (!m || Array.isArray(m)) return m; var a = []; Object.keys(m).forEach(function (k) { a[+k] = m[k]; }); for (var i = 0; i < a.length; i++) if (a[i] === undefined) a[i] = null; return a; }
function unpackMap(a) { if (!Array.isArray(a)) return a; var m = {}; a.forEach(function (v, i) { if (v != null) m[i] = v; }); return m; }
function mapStart(st, f) { if (!st) return st; var o = Object.assign({}, st); ["ranks", "titles", "tr", "tt"].forEach(function (k) { if (st[k]) o[k] = f(st[k]); }); return o; }

export function pack(S) {
  if (!S || S.v === VERSION || !S.npcs) return S;
  var out = Object.assign({}, S, { v: VERSION, npcs: S.npcs.map(packNpc) });
  if (S.start) out.start = mapStart(S.start, packMap);
  /* Only the latest week needs the other tournaments results (Home and the paper read it); older weeks keep a played marker */
  if (S.cal) { var lastDone = -1; S.cal.forEach(function (e, i) { if (e && e.done) lastDone = i; });
    out.cal = S.cal.map(function (e, i) { return i !== lastDone && e && e.result && e.result.parallel && e.result.parallel.length > 1 ? Object.assign({}, e, { result: Object.assign({}, e.result, { parallel: [1] }) }) : e; }); }
  if (S.activeT && S.activeT.bracket) out.activeT = Object.assign({}, S.activeT, { bracket: mapBracket(S.activeT.bracket, packRider) });
  return out;
}
/* Cloud copy: gzip + base64 where the browser can (all current ones); plain JSON otherwise. Prefixed so both read back. */
export async function toCloud(S) {
  var json = JSON.stringify(pack(S));
  try {
    if (typeof CompressionStream === "undefined") return json;
    var buf = await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer();
    var bytes = new Uint8Array(buf), bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return "gz:" + btoa(bin);
  } catch (e) { return json; }
}
export async function fromCloud(str) {
  if (!str) return null;
  if (str.slice(0, 3) !== "gz:") return unpack(JSON.parse(str));
  var bin = atob(str.slice(3)), bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  var text = await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
  return unpack(JSON.parse(text));
}

export function unpack(D) {
  if (!D || D.v !== VERSION) return D;
  var npcs = (D.npcs || []).map(unpackNpc), byId = {};
  npcs.forEach(function (n) { byId[n.id] = n; });
  var S = Object.assign({}, D, { npcs: npcs }); delete S.v;
  if (D.start) S.start = mapStart(D.start, unpackMap);
  if (D.activeT && D.activeT.bracket) S.activeT = Object.assign({}, D.activeT, { bracket: mapBracket(D.activeT.bracket, function (r) { return unpackRider(r, byId, S); }) });
  return S;
}
