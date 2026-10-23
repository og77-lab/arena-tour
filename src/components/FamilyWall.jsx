/* ═══ FamilyWall ═══ The grannies of your family who rode before you, framed on the wall (newest nearest you), each with
   the two things worth remembering — her best world rank and her biggest titles — and the tour's Hall of Fame. */

import { Rider, Face, PLAYER_PALETTE, paletteFor, withKit } from "./Rider";
import { C, FONT, display, label } from "../ui/theme";
import { HOF_RULE } from "../engine/aging";

/* 0 = the granny who retired last, 1 = her mother… */
function relation(k) { return k === 0 ? "Granny" : k <= 3 ? "Great-" + Array(k).join("great-") + "granny" : "Great ×" + k + " granny"; }

function Frame(props) {
  var r = props.r;
  return (
    <div style={{ width: 150, flexShrink: 0, textAlign: "center" }}>
      <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 1, color: C.goldInk, textTransform: "uppercase", marginBottom: 4 }}>{props.title}</div>
      <div style={{ padding: 6, borderRadius: 10, background: "linear-gradient(135deg,#b45309,#fbbf24 40%,#92400e 70%,#fde68a)", boxShadow: "0 4px 10px rgba(63,42,29,0.35)" }}>
        <div style={{ height: 120, borderRadius: 6, background: props.me ? "linear-gradient(180deg,#e0f2fe,#fef3c7)" : "linear-gradient(180deg,#e7e5e4,#fef3c7)", display: "flex", alignItems: "flex-end", justifyContent: "center", overflow: "hidden", filter: props.me ? "none" : "sepia(0.45)" }}>
          <Rider palette={withKit(PLAYER_PALETTE, r.kit)} width={124} pose={props.me ? "idle" : "cheer"} />
        </div>
      </div>
      <div style={{ fontSize: 14, fontWeight: 900, color: C.text, marginTop: 5 }}>{r.name}{r.hof ? " 🏛️" : ""}</div>
      <div style={{ fontSize: 11.5, color: C.textSoft, fontWeight: 700 }}>{props.me ? "Season " + r.s0 + " – now" : "Seasons " + r.s0 + "–" + r.s1 + " · " + r.y + " on tour"}</div>
      <div style={{ fontSize: 12.5, fontWeight: 900, color: C.text, marginTop: 3 }}>Best: World #{r.peak > 1000 ? "—" : r.peak}</div>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.goldInk }}>{r.gsTitles || 0} Grand Slam{r.gsTitles === 1 ? "" : "s"} · {r.mst || 0} Masters</div>
    </div>
  );
}

export default function FamilyWall(props) {
  var S = props.S, fam = (S.family || []).slice().reverse(), hof = (S.hof || []).slice().reverse();
  var me = { name: S.pName, s0: Math.max(1, S.sNum - (S.player.y || S.sNum) + 1), peak: (S.player.best || {}).rank || 1001, gsTitles: (S.player.best || {}).gsTitles || 0, mst: props.myMasters || 0, kit: S.player.kit };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 12, fontFamily: FONT }} onClick={props.onClose}>
      <div style={{ background: C.page, borderRadius: 14, padding: 14, maxWidth: 520, width: "100%", maxHeight: "88vh", overflowY: "auto", border: "1px solid " + C.line }} onClick={function (e) { e.stopPropagation(); }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={display(24)}>The family wall</span>
          <button onClick={props.onClose} aria-label="Close" style={{ background: "none", border: "none", color: "#64748b", fontSize: 20, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ fontSize: 12.5, color: C.textSoft, marginBottom: 10 }}>{fam.length ? "Every granny of your family who rode this tour." : "You're the first granny of the family on this tour. From season 15 on tour, the gala lets you retire and pass the lance — your portrait goes up here."}</div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", padding: "4px 2px 10px", background: "repeating-linear-gradient(90deg,#fdf6e3 0 22px,#f8edd0 22px 44px)", borderRadius: 12 }}>
          <Frame r={me} me title="You" />
          {fam.map(function (r, k) { return (<Frame key={k} r={r} title={relation(k)} />); })}
        </div>

        <div style={Object.assign(label(C.textSoft), { marginTop: 14 })}>🏛️ The Hall of Fame</div>
        <div style={{ fontSize: 12, color: C.textMuted, margin: "2px 0 8px" }}>Very hard to enter: {HOF_RULE}. Riders are inducted when they retire — you too — and stay here for good.</div>
        {hof.length ? hof.map(function (g, i) {
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 9px", marginBottom: 4, borderRadius: 10, background: g.isP ? C.goldSoft : "#fff", border: "1.5px solid " + C.line }}>
              {g.isP ? (<Face palette={withKit(PLAYER_PALETTE, g.kit)} size={38} />) : (<Face palette={paletteFor(g.id, 1)} size={38} />)}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: C.text }}>{g.emoji || (g.isP ? "👵" : "")} {g.name}{g.isP ? " · your family" : ""}</div>
                <div style={{ fontSize: 12, fontWeight: 900, color: C.goldInk }}>{g.hof}</div>
                <div style={{ fontSize: 11.5, color: C.textSoft }}>Retired after season {g.s1 || g.s} · {g.y} seasons · best #{g.peak} · {g.gsTitles} Slams · {g.titles} titles</div>
              </div>
            </div>
          );
        }) : (<div style={{ fontSize: 13, color: C.textSoft, fontStyle: "italic" }}>Nobody has made it yet.</div>)}

        {/* who is on course now */}
        {(props.candidates || []).length > 0 && (<>
          <div style={Object.assign(label(C.textSoft), { marginTop: 14 })}>On course for the Hall</div>
          {props.candidates.map(function (g) {
            return (
              <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 9px", marginTop: 4, borderRadius: 10, background: g.isP ? C.goldSoft : "#fff", border: "1.5px dashed " + C.line }}>
                {g.isP ? (<Face palette={withKit(PLAYER_PALETTE, props.S.player.kit)} size={34} />) : (<Face palette={paletteFor(g.id, 1)} size={34} />)}
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, color: C.text }}>{g.emoji || ""} {g.name}{g.isP ? " · you" : ""} <span style={{ fontWeight: 700, color: C.textMuted, fontSize: 11.5 }}>· {g.y} seasons on tour</span></div>
                  <div style={{ fontSize: 11.5, color: C.textSoft }}>{g.line}</div>
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 900, color: g.bound ? C.greenInk : C.goldInk, whiteSpace: "nowrap" }}>{g.bound ? "✓ bound" : g.pts + "/" + g.bar}</div>
              </div>
            );
          })}
        </>)}
      </div>
    </div>
  );
}
