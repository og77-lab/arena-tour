/* ═══ FarewellNotice ═══ A retiring granny's notice, in the dullest style the parish paper can manage: black rule,
   oval portrait gone sepia, a formal opener, the facts of her career, how she left, and a solemn closing line.
   Used at the gala (In memoriam) and on Home after the season. The wording is fixed per rider (picked by her cause). */

import { Face, paletteFor } from "./Rider";
import { roosterName } from "../models/persona";
import { causeText } from "../engine/aging";

var SERIF = "Georgia, 'Times New Roman', serif", INK = "#1c1917", PAPER = "#f7f1e1";
var OPENERS = ["The Tour regrets to announce the retirement of", "Notice is hereby given of the retirement of", "It is with mild regret that we record the retirement of",
  "The committee wishes to inform members of the retirement of", "Peacefully, and after some paperwork, the retirement of", "Announced this week, with the minimum of fuss: the retirement of"];
var CLOSERS = ["No flowers, please. Biscuits welcome.", "Donations to the Retired Roosters' Fund.", "A collection will be taken at Thursday bingo.",
  "The family asks for privacy, and for her casserole dish back.", "Light refreshments in the church hall. Bring your own cup.", "Her locker will be cleared on Tuesday."];

function pick(a, n) { return a[((n || 0) % a.length + a.length) % a.length]; }

export default function FarewellNotice(props) {
  var g = props.g, small = props.small, n = g.cause || 0;
  return (
    <div style={{ background: PAPER, color: INK, fontFamily: SERIF, border: "3px double " + INK, padding: small ? "7px 9px" : "9px 11px", textAlign: "center", boxShadow: small ? "none" : "0 4px 14px rgba(0,0,0,0.35)" }}>
      <div style={{ fontSize: 9.5, letterSpacing: 3, fontWeight: 700, color: "#57534e", borderBottom: "1px solid " + INK, paddingBottom: 3 }}>{g.hof ? "❦ RETIREMENT · HALL OF FAME ❦" : "❦ RETIREMENT ❦"}</div>
      <div style={{ display: "flex", gap: 9, alignItems: "center", marginTop: 6, textAlign: "left" }}>
        <div style={{ flexShrink: 0, width: small ? 38 : 48, height: small ? 46 : 58, borderRadius: "50%", border: "2px solid " + INK, overflow: "hidden", background: "#e7dcc2", display: "flex", alignItems: "flex-end", justifyContent: "center", filter: "sepia(0.85) grayscale(0.3)" }}>
          <Face palette={paletteFor(g.id, g.rank)} size={small ? 34 : 44} />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#44403c", lineHeight: 1.25 }}>{pick(OPENERS, n)}</div>
          <div style={{ fontSize: small ? 15 : 17, fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase", lineHeight: 1.15, marginTop: 1 }}>{g.name}</div>
          <div style={{ fontSize: 10.5, color: "#44403c", marginTop: 2 }}>{g.y} seasons on tour · finished #{g.rank} · best #{g.peak}</div>
        </div>
      </div>
      <div style={{ fontSize: small ? 11 : 11.5, lineHeight: 1.4, marginTop: 6, textAlign: "left" }}>
        {g.titles ? (g.titles + (g.titles === 1 ? " title" : " titles") + (g.gsTitles ? ", " + g.gsTitles + " of them Grand Slam" + (g.gsTitles > 1 ? "s" : "") : "") + ". ") : "No titles, though not for want of trying. "}
        {causeText(g)} Survived by her rooster, {roosterName(g.id)}.
      </div>
      {g.hof && (<div style={{ fontSize: 11, fontWeight: 700, marginTop: 4 }}>Inducted into the Hall of Fame: {g.hof}.</div>)}
      <div style={{ fontSize: 10.5, fontStyle: "italic", color: "#57534e", marginTop: 5, borderTop: "1px solid " + INK, paddingTop: 3 }}>{pick(CLOSERS, n >> 3)}</div>
    </div>
  );
}
