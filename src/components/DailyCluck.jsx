/* ═══ DailyCluck ═══ The weekly cartoon newspaper: you, your tournament, riders at your level, the world's best */

import * as React from "react";
import { fmtFollowers as fmtK } from "../engine/social";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { TIERS } from "../models/constants";
import { sh } from "../models/formulas";
import { quote } from "../models/persona";
import { Face, Rider, PLAYER_PALETTE as BASE_PAL, paletteFor, withKit } from "./Rider";
import { REDUCED_MOTION } from "./fx";
import { playPaperFold } from "../sounds";

const { useState, useRef, useLayoutEffect } = React;

var PAPER = "#f4ecd8", INK = "#1c1917", SOFT = "#4a4038", RULE = "#2a211b";
var SERIF = "Georgia, 'Times New Roman', serif";

function money(m) { m = m || 0; return m >= 1000000 ? "$" + (m / 1000000).toFixed(1) + "M" : m >= 1000 ? "$" + Math.round(m / 1000) + "K" : "$" + m; }
function up(s) { return (s || "").toUpperCase(); }

/* Cartoon "photo": tilted frame, halftone dots, caption */
function Photo(props) {
  return (
    <figure style={{ margin: 0, flexShrink: 0, width: props.w || 96, transform: "rotate(" + (props.tilt || -2) + "deg)" }}>
      <div style={{ position: "relative", background: "#fff", border: "2px solid " + INK, padding: 3, boxShadow: "3px 3px 0 " + INK }}>
        <div style={{ position: "relative", height: (props.w || 96) * 0.78, overflow: "hidden", background: "linear-gradient(180deg,#e0f2fe,#fef3c7)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
          {props.children}
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(28,25,23,0.18) 1px, transparent 1.3px)", backgroundSize: "4px 4px", mixBlendMode: "multiply", pointerEvents: "none" }} />
        </div>
      </div>
      {props.caption && (<figcaption style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 10.5, color: SOFT, marginTop: 5, lineHeight: 1.25, textAlign: "center" }}>{props.caption}</figcaption>)}
    </figure>
  );
}

function Bubble(props) {
  return (
    <div style={{ position: "relative", margin: "8px 0 2px 10px", background: "#fff", border: "2px solid " + INK, borderRadius: 14, padding: "6px 10px", fontFamily: SERIF, fontStyle: "italic", fontSize: 13, color: INK, boxShadow: "2px 2px 0 " + INK }}>
      “{props.children}”
      {props.by && (<span style={{ fontStyle: "normal", fontWeight: 700, fontSize: 11, color: SOFT }}> — {props.by}</span>)}
      <span aria-hidden style={{ position: "absolute", left: -9, top: 10, width: 0, height: 0, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", borderRight: "9px solid " + INK }} />
      <span aria-hidden style={{ position: "absolute", left: -6, top: 11, width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "7px solid #fff" }} />
    </div>
  );
}

function Kicker(props) {
  return (<div style={{ fontFamily: SERIF, fontSize: 10, fontWeight: 700, letterSpacing: 2.5, color: props.col || "#9a3412", textTransform: "uppercase", borderTop: "1px solid " + RULE, paddingTop: 7, marginTop: 12 }}>{props.children}</div>);
}

function Headline(props) {
  return (<h2 style={{ fontFamily: SERIF, fontWeight: 900, fontSize: props.big ? 27 : 19, lineHeight: 1.05, letterSpacing: -0.4, margin: "3px 0 5px", color: INK, textTransform: "uppercase" }}>{props.children}</h2>);
}

function Body(props) { return (<p style={{ fontFamily: SERIF, fontSize: 13.5, lineHeight: 1.45, color: INK, margin: "0 0 6px" }}>{props.children}</p>); }

function Arrow(props) {
  var d = (props.from || props.to) - props.to;
  if (!props.from || d === 0) return (<span style={{ color: SOFT, fontWeight: 700 }}>–</span>);
  return (<span style={{ color: d > 0 ? "#166534" : "#b91c1c", fontWeight: 900 }}>{d > 0 ? "▲" + d : "▼" + (-d)}</span>);
}

/* Rotating pick: each issue's variety counter v moves every pool on by one, so consecutive issues never share a line */
function pk(pool, v, off) { var n = pool.length; return pool[(((v + (off || 0)) % n) + n) % n]; }

function leadStory(y, v) {
  var T = up(y.tierName), N = up(y.name), t = y.tierName, n = y.name, R = up(y.reached), W = y.wins;
  var wins = W + (W === 1 ? " win" : " wins");
  if (y.away) return { pose: "idle",
    h: pk([N + " PUTS HER FEET UP", "A WEEK OFF FOR " + N, N + " WATCHES FROM THE STANDS", "DECKCHAIR DUTY FOR " + N, "KETTLE ON, LANCE DOWN: " + N + " RESTS"], v, 0),
    deck: y.away === "slam" ? "Not in the top 64, so " + n + " watched " + t + " from the stands with a flask of tea." : n + " gave her knees and her rooster a week off.",
    say: pk(["A granny needs her rest. And her biscuits.", "I was there in spirit. And in a deckchair.", "Next year they'll be watching me.", "The rooster needed a lie-in. So did I."], v, 1) };
  if (y.champion) return { pose: "cheer",
    h: pk([N + " CONQUERS " + T + "!", "ALL HAIL QUEEN " + N, N + " TAKES " + T + " BY THE WATTLES", "TROPHY! " + N + " RULES " + T, "GRANNY GOLD: " + N + " SWEEPS " + T, "FEATHERS FLY AS " + N + " WINS " + T, "UNSTOPPABLE! " + N + " LIFTS " + T + " CUP",
      N + " IS QUEEN OF " + T, "CROWN AND CUSTARD: " + N + " WINS " + T, N + " KNITS UP THE " + T + " TITLE", "BINGO! " + N + " SCOOPS " + T,
      "THE " + T + " CUP GOES HOME WITH " + N, N + " HAS " + T + " IN THE BAG (THE BIG HANDBAG)", "PERFECT WEEK FOR " + N + " AT " + T, "CHAMPION " + N + "! PUT THE KETTLE ON"], v, 0),
    deck: pk(["Won all " + W + " matches. Roosters across the county weep.", W + " matches, " + W + " wins, not a single dropped stitch.", "The tea urn ran dry from all the celebrating.", "Rivals were spotted sobbing into their cardigans.", "Bookmakers are refunding bets out of sheer embarrassment.", "Her rooster has demanded a pay rise.",
      "Not one loss in " + W + " matches. Not one hair out of place.", "The church bells rang. Nobody is quite sure who asked them to.", "Her grandchildren have finally admitted she's cool.",
      "The trophy now sits next to the good china, which is saying something.", "The garden centre has named a begonia after her.", "Her rooster strutted the whole way home and refused to stop."], v, 3),
    say: pk(["Never bet against a granny with a boxing glove.", "I'd like to thank my hip surgeon.", "Somebody fetch me a cushion and a bigger shelf.", "Told you. I told ALL of you.",
      "Pass the biscuits. The chocolate ones. I've earned them.", "Not bad for a woman who needs two goes to get out of a deckchair.", "My knees creaked, but they never quit.", "I'm off for a sherry and a very long sit-down.",
      "Put it in the parish newsletter. Front page.", "The secret? A good breakfast and a grudge.", "I'd like to dedicate this to everyone at Thursday bingo.", "My rooster did the hard bit. I just held on and shouted."], v, 1) };
  if (y.reached === "Final") return { pose: "knocked",
    h: pk(["HEARTBREAK IN THE " + T + " FINAL", "SO NEAR! " + N + " PIPPED AT " + T, "SILVER LINING FOR " + N, N + " FALLS AT THE FINAL FENCE", "ONE CHARGE TOO FAR FOR " + N, "RUNNER-UP " + N + " VOWS REVENGE",
      "SO CLOSE, " + N + ", SO CLOSE", N + " LEFT HOLDING THE RUNNER-UP RIBBON", "FINAL FLOP FOR " + N + " AT " + T, "NEARLY QUEEN: " + N + " BOWS OUT IN " + T + " FINAL",
      "TEARS IN THE TEA AS " + N + " LOSES " + T + " FINAL", N + " SETTLES FOR SECOND AT " + T, "THE CUP SLIPS AWAY FROM " + N, "ALMOST! " + N + " FALLS AT THE LAST", N + " DENIED " + T + " GLORY"], v, 0),
    deck: pk([n + " falls one charge short of the trophy.", "The final was lost; the dignity, mostly, survived.", "Silver medal, gold-medal sulk.", n + " was last seen glaring at the trophy from a distance.", "A tissue-heavy evening in the " + t + " stands.",
      "So close she could see her reflection in the trophy.", n + " has asked for a recount. Of the jousting.", "The silver plate will look lovely on the mantelpiece, she insists.", "Her rooster blames the wind. There was no wind.",
      "The " + t + " crowd gave her a standing ovation, then a sit-down one.", "Second best in the whole draw. She is not pleased about the second bit.", "The vicar offered words of comfort. She declined them."], v, 2),
    say: pk(["Silver suits me. Gold would've suited me better.", "Second place is just first loser. Lovely ribbon, though.", "I'll be back. With sharper elbows.",
      "I'm not crying. It's hay fever.", "Lovely day out. Shame about the last ten minutes.", "Next time I'm bringing my lucky cardigan.", "She got lucky. I'll tell her that to her face.",
      "I've had worse weeks. My hip replacement, for one.", "Runner-up sounds very grand at the bridge club.", "My rooster wants a word with the referee.", "Silver goes with my hair, at least.", "Somebody owes me a trophy. I've written it on the calendar."], v, 1) };
  if (W === 0) return { pose: "fallen",
    h: pk(["EARLY BATH FOR " + N, N + " HITS THE HAY", "SHORT AND NOT SWEET FOR " + N, "WHERE DID " + N + " GO?", "OOPS! " + N + " OUT IN A FLASH", "ROOSTER ROUT: " + N + " DUMPED EARLY",
      N + " BITES THE DUST", "FIRST ROUND FLUMP FOR " + N, N + " BACK HOME BEFORE ELEVENSES", "FEATHERS AND DIGNITY LOST: " + N + " OUT", "BRIEF VISIT FROM " + N + " AT " + T,
      "NO JOY FOR " + N + " AT " + T, N + " TAKES A TUMBLE", "HAY THERE! " + N + " LANDS FIRST TIME OUT", "QUICK EXIT FOR " + N], v, 0),
    deck: pk(["Out in the " + y.reached + " of " + t + ". The tea was still warm.", "Spectators barely had time to unwrap their sandwiches.", "Her rooster has been seen hiding behind the stables.", "Over before the brass band finished tuning up.", "Not so much a run as a brisk stroll to the exit.",
      "Out in the " + y.reached + " and home in time for the afternoon film.", "The car park attendant saw more of her than the crowd did.", "Her flask of tea was still full when she left " + t + ".",
      "She spent longer queuing for the loo than on the lanes.", "The programme seller hadn't even reached her row.", "A week best forgotten, and she's already trying.", "Her rooster has gone right off his corn."], v, 4),
    say: pk(["My rooster had a cold. That's my story and I'm sticking to it.", "I was just checking the hay was soft. It is.", "Practice round. Everyone knows the real tournament is next week.",
      "The ground came up very quickly. Rude of it.", "I wasn't ready. I was still looking for my glasses.", "At least I got a nice sit-down in the hay.", "Don't tell my grandchildren. They'll put it on the internet.",
      "We'll call this one a warm-up, shall we?", "I've had more dignified tumbles at the church fete.", "Next week I'm wearing my lucky bloomers.", "Even the best of us have Mondays. Mine lasted all week.", "I let her win. Out of kindness. Don't print that."], v, 2) };
  if (y.reached === "Semifinals" || y.reached === "Quarterfinals") return { pose: "idle",
    h: pk([N + " CHARGES INTO THE " + R, "GRANNY ON THE RISE: " + N + " IN " + T + " " + R, N + " MAKES THE " + T + " " + R, "WATCH OUT! " + N + " IS WARMING UP", "DEEP RUN FOR DETERMINED " + N, N + " RATTLES THE " + T + " DRAW",
      N + " BARGES INTO THE " + R, "WHAT A RUN! " + N + " REACHES " + T + " " + R, N + " TURNS HEADS AT " + T, "KNITTING NEEDLES DOWN: " + N + " IS ON A ROLL", N + " ROLLS ON TO THE " + R,
      "GRANNY POWER! " + N + " IN THE " + R, "THE " + T + " " + R + " WELCOMES " + N, N + " PUFFS INTO THE " + R, "SPIRITED " + N + " STIRS UP " + T], v, 0),
    deck: pk([wins + " at " + t + " before the run finally ended.", wins + " and a rooster who's starting to believe.", "The bigger names are checking over their shoulders.", "A run that had the bingo hall on its feet.", "Knitting circles across the land are buzzing.",
      wins + " and a fair few biscuits along the way.", "A run at " + t + " that'll be talked about at the bowls club for weeks.", "She went further than her bus pass, and that's saying something.",
      wins + " at " + t + " and the grandchildren are suddenly ringing.", "The top seeds noticed. So did the tea lady.", "Not the trophy, but a good long look at it.", "Her rooster has started doing press-ups."], v, 1),
    say: pk(["Next week I'm bringing the good biscuits.", "We're only just getting started, dear.", "My rooster wants a bigger stable now. Typical.",
      "Give me another week and a strong cuppa.", "I can smell the trophy from here. It smells of polish.", "Not bad for someone who fell asleep in the car on the way.", "The knees are holding up. Just about.",
      "Tell the top seeds I'm coming. Slowly, but I'm coming.", "I'll need a new hat for the next round.", "Lovely crowd. They cheered louder than at bingo.", "One more charge and I'd have had her.", "My grandson says I'm trending. I said lovely, dear."], v, 2) };
  return { pose: "idle",
    h: pk([N + " REACHES THE " + R, "STEADY DOES IT FOR " + N, N + " CLIMBS TO THE " + R, "PROGRESS! " + N + " PUSHES ON AT " + T, "QUIET WEEK, LOUD GRANNY: " + N, N + " LIVES TO JOUST ANOTHER DAY",
      N + " SOLDIERS ON AT " + T, "NOT BAD AT ALL, " + N, N + " KEEPS HER HAT ON", "A DECENT DAY'S WORK FOR " + N, N + " CREAKS INTO THE " + R,
      "ONWARDS AND UPWARDS FOR " + N, "FAIR PLAY TO " + N + " AT " + T, N + " PLODS ON, PROUDLY", "SOLID STUFF FROM " + N + " IN THE " + R], v, 0),
    deck: pk([wins + " at " + t + ". The lance is warming up.", wins + " and only one minor tantrum.", "Not the trophy, but the hat stayed on. Mostly.", "A respectable week, by anyone's standards. Except hers.", "Her rooster ate well, slept well and jousted reasonably.",
      wins + " at " + t + " and a very nice packed lunch.", "Nothing to write home about. She wrote home anyway.", wins + " and a bit of a limp, but who's counting.",
      "A tidy week that ended a round or two too early.", "She came, she jousted, she queued for a scone.", "The lance held, the knees held, the run didn't.", "Steady progress, like a good slow-cooked stew."], v, 3),
    say: pk(["Small steps, dear. Small, determined steps.", "Rome wasn't built in a day. Neither was my left knee.", "Next week, the big one. Or the medium one.",
      "Good enough for a Tuesday, dear.", "Slow and steady. Like my pension.", "I'm saving the best for later. Much later.", "Every match is a chance to wear my nice cardigan.",
      "I'm not getting older, I'm getting craftier.", "Back to the gym. Well, back to the garden. Same thing.", "My rooster says well done. I think. He mostly clucks.", "Not quite, but closer than last week.", "Somebody put the kettle on. I've earned a cup."], v, 1) };
}

/* Front-page stories that aren't about you: Grand Slam champions, a new #1, Cinderella titles, giant-killings, big titles */
function WorldLead(props) {
  var L = props.lead, v = props.v, s;
  var nm = function (p) { return p.emoji + " " + sh(p.name); };
  if (L.type === "slam") {
    var N = up(sh(L.winner.name)), u = L.upset;
    s = { kick: pk(["Grand Slam", "Slam special", "The big one", "Grand Slam glory", "Slam of the season", "Biggest week on tour", "The golden lance", "Grand Slam report", "Slam sensation", "Trophy of trophies", "Slam souvenir edition", "Slam day"], v, 0), p: L.winner, crown: true, pose: "cheer",
      h: pk([N + " WINS THE GRAND SLAM!", "SLAM QUEEN " + N, N + " CONQUERS THE GRAND SLAM", "GLORY! " + N + " TAKES THE SLAM", "THE SLAM BELONGS TO " + N,
        N + " IS THE GRAND SLAM CHAMPION", "GRAND SLAM, GRAND GRANNY: " + N, N + " GRABS THE GOLDEN LANCE", "ALL HAIL " + N + ", SLAM WINNER", "SLAM DUNKED! " + N + " WINS IT ALL",
        N + " TAMES THE GRAND SLAM", "BUNTING OUT FOR SLAM CHAMP " + N, "THE GOLDEN LANCE GOES TO " + N, N + " SLAMS THE DOOR ON THE FIELD", "HISTORY! " + N + " WINS THE SLAM"], v, 1),
      deck: u && u.winner.id === L.winner.id ? "Ranked #" + u.wRank + ", she left top seed " + nm(u.fav) + " (#" + u.favRank + ") and sixty-two others in the dust."
        : pk(["Sixty-four grannies saddled up. One rode home with the golden lance.", "Six rounds, six wins, one very smug rooster.", "The biggest prize on tour, and she barely spilt her tea.",
          "Sixty-three opponents, sixty-three polite handshakes, one trophy.", "She rode in a contender and rode out a legend.", "Six matches, one cardigan, zero mercy.",
          "The whole tour turned up. Only one granny went home smiling.", "The golden lance has never looked so pleased with itself.", "A week of thunderous charges and a fair few cream teas.",
          "The biggest draw of the season, and she had it for breakfast.", "Roosters across the land bowed their combs.", "She'll be dining out on this until next season. Possibly forever."], v, 2),
      body: nm(L.winner) + (L.winner.rank ? " (world #" + L.winner.rank + ")" : "") + " is the toast of the tour after the week's Grand Slam. " + pk(["Celebrations went on until well past nine o'clock.", "Her rooster has hired an agent.", "The knitting circle has already started on the commemorative scarf.",
        "The village hall has booked a barn dance in her honour.", "Her grandchildren have been told they may now call her Your Majesty.", "She's already found the perfect spot on the mantelpiece.",
        "The commemorative tea towels go on sale on Monday.", "Her rooster was presented with a medal and promptly ate the ribbon.", "The parish council has voted to rename the duck pond after her.",
        "She celebrated with a Victoria sponge the size of a cartwheel.", "Fireworks were planned but postponed on account of the dog.", "She has asked for the trophy to be engraved in a nice curly font."], v, 3) };
  } else if (L.type === "no1") {
    s = { kick: pk(["A new queen", "Changing of the guard", "World rankings", "Top of the pecking order", "Crown watch", "Rankings shake-up", "The summit", "Number one news", "Head of the henhouse", "New at the top", "The golden crown", "Throne room"], v, 0), p: L.p, crown: true, pose: "cheer",
      h: pk(["NEW WORLD NUMBER ONE: " + up(sh(L.p.name)), up(sh(L.p.name)) + " SEIZES THE CROWN", "LONG LIVE QUEEN " + up(sh(L.p.name)), "THE THRONE HAS A NEW BOTTOM",
        up(sh(L.p.name)) + " IS THE NEW NUMBER ONE", "MAKE WAY FOR QUEEN " + up(sh(L.p.name)), up(sh(L.p.name)) + " CLIMBS TO THE SUMMIT", "TOP OF THE PECKING ORDER: " + up(sh(L.p.name)),
        up(sh(L.p.name)) + " TAKES THE TOP SPOT", "THE WORLD BOWS TO " + up(sh(L.p.name)), "A NEW NAME ON THE THRONE", "CROWN ON, KETTLE ON: " + up(sh(L.p.name)) + " IS NO. 1",
        up(sh(L.p.name)) + " RULES THE ROOST", "NUMBER ONE AT LAST FOR " + up(sh(L.p.name)), "HEAD OF THE HENHOUSE: " + up(sh(L.p.name))], v, 1),
      deck: pk(["The old queen has been sent to the back of the bus.", "The golden crown changes heads for the first time in weeks.", "Somewhere, a former world number one is sulking into her scones.",
        "The rankings were checked twice. It's true.", "The previous queen has been offered a nice cushion and a cup of tea.", "A new name sits at the very top of the ladder.",
        "The crown has been resized, polished and passed along.", "Her rooster has started walking with a noticeable swagger.", "Months of early mornings have finally paid off.",
        "The whole tour has a new target pinned to its noticeboard.", "The bunting has been rehung with a new name on it.", "Nobody stays on top forever, but she intends to try."], v, 2),
      body: nm(L.p) + " tops the world rankings this week. " + pk(["The view from the top is lovely, she says, if a bit draughty.", "She celebrated with a second biscuit. Living dangerously.", "Rivals have already started training twice as hard.",
        "She has promised to stay humble. Her new monogrammed slippers say otherwise.", "Her first royal decree: longer tea breaks.", "She had the crown fitted over her rain bonnet.",
        "The neighbours have been informed. Several times.", "She says it's an honour, then asked whether it comes with a parking space.", "Her rooster now insists on being addressed as Sir.",
        "She rang her sister at the seaside to gloat, politely.", "Her grandchildren have stuck the rankings on the fridge.", "She has vowed to defend the crown with lance, glove and knitting needle."], v, 1) };
  } else if (L.type === "upsetTitle") {
    var U = L.upset, T = U.event || TIERS[L.tier].name;
    s = { kick: pk([T + " shock", "Cinderella story", "Nobody saw it coming", "Fairy-tale finish", "Outsider wins!", "Against all odds", "Shock champion", "Long shot lands", "Rank outsider", "Dark horse (well, rooster)", "Upset special", "Underdog's day"], v, 0), p: U.winner, pose: "cheer",
      h: pk(["NOBODY SAW " + up(sh(U.winner.name)) + " COMING", up(sh(U.winner.name)) + " STUNS " + up(T), "CINDERELLA ON A ROOSTER", "FROM NOWHERE TO " + up(T) + " CHAMPION",
        up(sh(U.winner.name)) + " WINS " + up(T) + " AGAINST ALL ODDS", "OUTSIDER " + up(sh(U.winner.name)) + " LIFTS THE CUP", "WHO? " + up(sh(U.winner.name)) + ", THAT'S WHO", "FAIRY TALE AT " + up(T),
        "THE LONG SHOT THAT LANDED", up(sh(U.winner.name)) + " TURNS " + up(T) + " UPSIDE DOWN", "UNDERDOG'S DAY: " + up(sh(U.winner.name)) + " TRIUMPHS", "RANK OUTSIDER RULES " + up(T),
        up(sh(U.winner.name)) + " CRASHES THE PARTY", "DARK ROOSTER " + up(sh(U.winner.name)) + " ROMPS HOME", "SEEDS SCATTERED AS " + up(sh(U.winner.name)) + " WINS"], v, 1),
      deck: "World #" + U.wRank + " " + sh(U.winner.name) + " won " + (U.event ? "the " + U.event : "a " + T + " title") + " as an outsider. Top seed " + nm(U.fav) + " (#" + U.favRank + ") was left eating dust.",
      body: pk(["Bookmakers are reportedly lying down in a dark room.", "Her rooster was 200-to-1. He'd like that noted.", "\"I just closed my eyes and pointed the lance,\" she told reporters.",
        "The favourites have been seen consulting their tea leaves.", "Her own family didn't buy tickets. They have since apologised.", "She'd only entered for the free sandwiches.",
        "The trophy engraver had to ask how to spell her name.", "Her rooster has been offered a modelling job with a feed catalogue.", "Seeding committees across the land are reviewing their sums.",
        "She plans to spend the prize money on a new conservatory.", "Nobody had her in the office sweepstake. Nobody.", "She thanked her knitting group, her hairdresser and her rooster, in that order."], v, 2) };
  } else if (L.type === "shock") {
    var K = L.shock, TT = K.event || TIERS[K.tier].name;
    s = { kick: pk(["Upset of the week", "Giant-killing!", "Shock result", "Stop the presses", "Upset alert", "Topsy-turvy", "Pecking order upended", "Big scalp", "Feathers ruffled", "Form book torn up", "Hay-maker!", "The unthinkable"], v, 0), p: K.w, pose: "cheer", fallen: K.l,
      h: pk([up(sh(K.w.name)) + " TOPPLES " + up(sh(K.l.name)) + "!", "DAVID AND GOLIATH, ON ROOSTERBACK", up(sh(K.l.name)) + " DUMPED BY WORLD #" + K.wRank, "THE UPSET THAT SHOOK THE HENHOUSE",
        up(sh(K.w.name)) + " FELLS THE MIGHTY " + up(sh(K.l.name)), "HAY DAY FOR " + up(sh(K.w.name)), up(sh(K.l.name)) + " SENT TO THE HAY BY AN OUTSIDER", "STUNNER! " + up(sh(K.w.name)) + " BEATS " + up(sh(K.l.name)),
        "WORLD #" + K.wRank + " CAUSES A KERFUFFLE", up(sh(K.w.name)) + " BRINGS THE HOUSE DOWN", "BIG SCALP FOR " + up(sh(K.w.name)), "OH MY WATTLES! " + up(sh(K.l.name)) + " IS OUT",
        up(sh(K.l.name)) + " LEFT RED-FACED", "THE FORM BOOK IS IN THE BIN", "GOLIATH GOES DOWN: " + up(sh(K.l.name)) + " BEATEN"], v, 1),
      deck: "In the " + K.round + " of " + (K.event ? "the " + K.event : "a " + TT) + ", world #" + K.wRank + " " + sh(K.w.name) + " knocked out #" + K.lRank + " " + sh(K.l.name) + ".",
      body: pk(["Several spectators had to be revived with smelling salts and a custard cream.", sh(K.l.name) + " has asked for the lance to be inspected.", "The losing rooster is said to be \"absolutely mortified\".",
        "The favourite's fan club has gone very quiet.", sh(K.l.name) + " left without signing a single autograph.", "Bingo was suspended so everyone could watch the replay.",
        sh(K.l.name) + " claims her glove was on the wrong hand.", "The winner celebrated with a modest, if noisy, cup of tea.", "Even the umpire dropped her custard tart.",
        "The tour's statisticians are said to need a lie-down.", sh(K.l.name) + "'s rooster has refused to come out of his hutch.", "Spectators are still arguing about it in the tea tent."], v, 3) };
  } else {
    var TB = (L.winner && L.winner.event) || TIERS[L.tier].name;
    s = { kick: TB, p: L.winner, pose: "cheer",
      h: pk([up(sh(L.winner.name)) + " CONQUERS THE " + up(TB), up(TB) + " GOLD FOR " + up(sh(L.winner.name)), up(sh(L.winner.name)) + " IS THE WEEK'S BIG WINNER",
        up(sh(L.winner.name)) + " TAKES THE " + up(TB) + " TITLE", "TRIUMPH FOR " + up(sh(L.winner.name)) + " AT " + up(TB), up(TB) + " BELONGS TO " + up(sh(L.winner.name)), up(sh(L.winner.name)) + " RIDES OFF WITH THE SPOILS",
        "A BIG WEEK FOR " + up(sh(L.winner.name)), up(sh(L.winner.name)) + " ROARS TO " + up(TB) + " GLORY", "TOP OF THE WEEK: " + up(sh(L.winner.name)), "CUP AND SAUCER FOR " + up(sh(L.winner.name)),
        up(sh(L.winner.name)) + " WINS THE WEEK'S BIGGEST PRIZE", "NO STOPPING " + up(sh(L.winner.name)) + " AT " + up(TB), up(TB) + " CROWN FOR " + up(sh(L.winner.name)), "A BIG SHINY CUP FOR " + up(sh(L.winner.name))], v, 1),
      deck: "The week's most prestigious title went to " + nm(L.winner) + (L.winner.rank ? " (world #" + L.winner.rank + ")" : "") + (L.count > 1 ? ", best of " + L.count + " events at this level." : "."),
      body: pk(["She dedicated the win to her late husband's moustache.", "Her rooster celebrated by pecking a steward. Twice.", "\"Not bad for a Tuesday,\" she said, adjusting her shawl.",
        "She celebrated with a large slice of lemon drizzle.", "Her rooster has been asked to stop crowing at the press.", "\"Is there a cash prize? Lovely,\" she said, reaching for her purse.",
        "The trophy is going straight on top of the telly.", "She thanked her chiropodist in her victory speech.", "Her lucky brooch has been put away for safe keeping.",
        "She has promised the grandchildren a trip to the garden centre.", "The tea tent stayed open late in her honour.", "She waved her walking stick at the crowd, who waved back."], v, 2) };
  }
  return (
    <section>
      <Kicker col="#7c2d12">{s.kick}</Kicker>
      <Headline big>{s.h}</Headline>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: SOFT, marginBottom: 8 }}>{s.deck}</div>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <Photo w={118} tilt={-2.5} caption={sh(s.p.name) + pk([" takes a bow", " on her lap of honour", " soaks it up", " basks in the glory", " waves to the crowd", " poses for posterity", " with a rather smug rooster", ", all smiles", " before the tea party", " salutes the stands", " in her finest hour", ", still a bit breathless"], v, 1)}>
          <div style={{ marginBottom: -4 }}><Rider palette={paletteFor(s.p.id, L.type === "no1" ? 1 : L.type === "upsetTitle" ? L.upset.wRank : L.type === "shock" ? L.shock.wRank : s.p.rank)} width={112} pose={s.pose} crown={s.crown} /></div>
        </Photo>
        <div style={{ minWidth: 0 }}>
          <Body>{s.body}</Body>
          {s.fallen && (<Photo w={84} tilt={3} caption={sh(s.fallen.name) + ", in the hay"}><div style={{ marginBottom: -4 }}><Rider palette={paletteFor(s.fallen.id, L.shock.lRank)} width={78} pose="knocked" hatOff={true} flip={true} /></div></Photo>)}
        </div>
      </div>
      <Bubble by={sh(s.p.name)}>{quote(s.p.id, v)}</Bubble>
    </section>
  );
}

/* After a tournament: the paper spins onto the screen over everything, and folds itself away when you're done */
export default function DailyCluck(props) {
  var _f = useState(false), folding = _f[0], setFolding = _f[1];
  var closed = useRef(false);
  function close() { if (closed.current) return; closed.current = true; props.onClose(); }
  function fold() {
    if (folding) return;
    if (REDUCED_MOTION) { close(); return; }
    playPaperFold(); setFolding(true);
    setTimeout(close, 1600); /* safety net if the animation never reports back */
  }
  return createPortal(
    <motion.div onClick={fold} animate={{ opacity: folding ? 0 : 1 }} transition={{ duration: 0.35, delay: folding ? 0.85 : 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(28,25,23,0.6)", overflowY: folding ? "hidden" : "auto", overflowX: "hidden", padding: "14px 10px 30px", boxSizing: "border-box" }}>
      <CluckPaper issue={props.issue} onClose={fold} folding={folding} onFolded={close} onDraws={props.onDraws} />
    </motion.div>,
    document.body
  );
}

/* The fold: bottom half over the top (horizontal crease), then left over right (vertical crease), then tossed off-screen.
   Creases sit on the middle of what's on screen, wherever the reader has scrolled to. */
var FOLD = { duration: 1.15, times: [0, 0.32, 0.36, 0.66, 0.7, 1], ease: "easeInOut" };
function foldAnim() {
  return {
    scale: 1, /* hold the entry scale, or it falls back to its tiny starting value */
    scaleY: [1, 0.5, 0.5, 0.5, 0.5, 0.32], scaleX: [1, 1, 1, 0.5, 0.5, 0.32],
    rotateX: [0, 28, 0, 0, 0, 0], rotateY: [0, 0, 0, -28, 0, 0],
    rotate: [-1, -1, -1, -2, -2, -24], y: [0, 0, 0, 0, 0, 520], opacity: [1, 1, 1, 1, 1, 0]
  };
}

function Creases(props) {
  /* Shading that sweeps over the folding half, plus the crease lines that stay once folded */
  var t = { duration: FOLD.duration, times: FOLD.times };
  return (
    <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0.55, 0.15, 0.15, 0.15, 0.15] }} transition={t}
        style={{ position: "absolute", left: 0, right: 0, top: props.y, height: "50vh", background: "linear-gradient(180deg, rgba(60,40,20,0.55), rgba(60,40,20,0.05))" }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 1, 1, 1] }} transition={t}
        style={{ position: "absolute", left: 0, right: 0, top: props.y - 3, height: 6, background: "linear-gradient(180deg, transparent, rgba(40,25,10,0.45), rgba(255,255,255,0.5), transparent)" }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0, 0.5, 0.15, 0.15] }} transition={t}
        style={{ position: "absolute", top: 0, bottom: 0, left: "50%", width: "50%", background: "linear-gradient(90deg, rgba(60,40,20,0.05), rgba(60,40,20,0.55))" }} />
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: [0, 0, 0, 1, 1, 1] }} transition={t}
        style={{ position: "absolute", top: 0, bottom: 0, left: "calc(50% - 3px)", width: 6, background: "linear-gradient(90deg, transparent, rgba(40,25,10,0.45), rgba(255,255,255,0.5), transparent)" }} />
    </div>
  );
}

/* The paper itself — also shown inline in the News tab (inline: no spin, no close button) */
export function CluckPaper(props) {
  var is = props.issue, y = is.special ? null : is.you, w = is.world, pe = is.peers || {}, ev = is.myEvent || {};
  var PLAYER_PALETTE = withKit(BASE_PAL, y && y.kit);
  var v = is.v != null ? is.v : Math.floor((is.at || 0) / 1000) % 997;
  var lead = y ? leadStory(y, v) : null;
  var youLead = !is.lead || is.lead.type === "you";
  var ledWith = is.lead && is.lead.winner ? is.lead.winner.id : null;
  var rankLine = !y ? "" : !y.rankBefore || y.rankBefore === y.rankAfter
    ? "In the world rankings she holds steady at #" + y.rankAfter + "."
    : "In the world rankings she " + (y.rankAfter < y.rankBefore ? "climbs" : "slips") + " from #" + y.rankBefore + " to #" + y.rankAfter + ".";
  var top1 = w.top[0];
  var art = useRef(null);
  var _oy = useState(null), oy = _oy[0], setOy = _oy[1];
  /* Fold around the middle of what's on screen */
  useLayoutEffect(function () {
    if (!props.folding || !art.current) return;
    var r = art.current.getBoundingClientRect();
    setOy(Math.max(0, Math.min(r.height, window.innerHeight / 2 - r.top)));
  }, [props.folding]);
  var folding = props.folding && oy != null;

  return (
      <motion.article ref={art} onClick={function (e) { e.stopPropagation(); }}
        initial={props.inline ? false : REDUCED_MOTION ? { opacity: 0 } : { rotate: -720, scale: 0.05, opacity: 0 }}
        animate={folding ? foldAnim() : { rotate: props.inline ? 0 : -1, scale: 1, opacity: 1 }}
        transition={folding ? FOLD : { duration: REDUCED_MOTION ? 0.2 : 0.85, ease: [0.2, 0.8, 0.3, 1] }}
        onAnimationComplete={function () { if (folding && props.onFolded) props.onFolded(); }}
        style={{ position: "relative", transformPerspective: 900, transformOrigin: "50% " + (oy != null ? oy + "px" : "50%"), maxWidth: 520, margin: "0 auto", background: PAPER, color: INK, padding: "14px 16px 18px", boxShadow: "0 18px 40px rgba(0,0,0,0.45)", border: "1px solid #d6c7a1",
          backgroundImage: "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.5), transparent 40%), radial-gradient(circle at 80% 90%, rgba(120,90,40,0.10), transparent 45%)" }}>
        {folding && (<Creases y={oy} />)}
        {/* Masthead */}
        <header style={{ textAlign: "center", borderBottom: "3px double " + RULE, paddingBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: SERIF, fontSize: 9.5, letterSpacing: 1, color: SOFT, textTransform: "uppercase" }}>
            <span>Est. 1952</span><span>Season {is.s} · {is.wk}</span><span>2 corn kernels</span>
          </div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: "clamp(30px, 10vw, 44px)", letterSpacing: -1, lineHeight: 1, margin: "4px 0 2px" }}>The Daily Cluck</div>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: SOFT }}>All the jousting news that's fit to peck</div>
        </header>

        {/* Special edition lead: before your first tournament */}
        {is.special && (
          <section>
            <Kicker>Special edition</Kicker>
            <Headline big>{up(is.you.name)} SADDLES UP</Headline>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: SOFT, marginBottom: 8 }}>A new granny joins a tour of a thousand. The roosters are restless.</div>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <Photo w={118} tilt={-2.5} caption={is.you.name + " at the stables"}><div style={{ marginBottom: -4 }}><Rider palette={PLAYER_PALETTE} width={112} pose="idle" /></div></Photo>
              <div style={{ minWidth: 0 }}>
                <Body>Ranked <b>#{is.you.rankAfter}</b> in the world, {is.you.name} sets out to climb from the dusty Futures lanes to the golden helmets of the top ten.</Body>
                <Body>Every tournament earns a fresh issue of this paper: your results, your rivals, and the gossip from the gym.</Body>
              </div>
            </div>
            <Bubble by={is.you.name}>I didn't come here to knit. Well — not only to knit.</Bubble>
          </section>
        )}

        {/* Front page: the week's biggest story, when it isn't you */}
        {y && !youLead && (<WorldLead lead={is.lead} v={v} />)}

        {/* You: the lead story, or your own column further down */}
        {y && (<section>
          <Kicker>{!youLead ? pk(["Meanwhile, your week", "And how did our granny do?", "Your week on the tour", "Closer to home", "Back at our stables", "Our own correspondent reports", "Your granny's diary", "On the home front", "Your tour this week", "News from your corner", "Our granny's progress", "Elsewhere on the lanes"], v, 2) : y.champion ? pk(["Extra! Extra!", "Stop the presses!", "Hold the front page!", "Special souvenir edition", "Ring the church bells!", "Cancel the bingo!", "Read all about it!", "Champion edition", "Put the bunting up!", "Late extra", "Breaking news from the stables", "Front-page splash"], v, 0) : pk(["This week on the tour", "From the jousting lanes", "Our granny of the week", "Dispatches from the stables", "Our woman on the lanes", "Saddle report", "Tour diary", "The weekly jousting round-up", "Notes from the tilt yard", "Hot off the henhouse press", "Ringside report", "This week's joust"], v, 0)}</Kicker>
          <Headline big={youLead}>{lead.h}</Headline>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: youLead ? 14 : 13, color: SOFT, marginBottom: 8 }}>{lead.deck}</div>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <Photo w={youLead ? 118 : 92} tilt={-2.5} caption={y.name + (y.champion ? " with the spoils" : " after the dust settled")}>
              <div style={{ marginBottom: -4 }}><Rider palette={PLAYER_PALETTE} width={youLead ? 112 : 88} pose={lead.pose === "fallen" ? "knocked" : lead.pose} crown={y.champion} hatOff={lead.pose === "fallen"} /></div>
            </Photo>
            <div style={{ minWidth: 0 }}>
              <Body>{y.away === "slam" ? y.name + " wasn't in the top 64, so she sat out " + y.tierName + " and rested." : y.away ? y.name + " rested this week: no points, double the recovery." : (<span>{y.name} collected <b>{y.pts} points</b>{y.money ? " and " + money(y.money) + " in prize money" : ""} at {y.tierName}.</span>)} {rankLine}</Body>
              {y.bestWin && (<Body>Highlight of the week: victory over {y.bestWin.foe.emoji} {sh(y.bestWin.foe.name)}{y.bestWin.foeRank ? " (world #" + y.bestWin.foeRank + ")" : ""} in the {y.bestWin.round}.</Body>)}
              {y.lostTo && (<Body>{y.lostTo.foe.emoji} {sh(y.lostTo.foe.name)} ended the run in the {y.lostTo.round}{y.rivalry ? " — the head-to-head now reads " + y.rivalry.w + "–" + y.rivalry.l + (y.rivalry.l > y.rivalry.w ? ". A rivalry is brewing." : ".") : "."}</Body>)}
            </div>
          </div>
          {is.interview ? (
            <div>
              <div style={{ fontFamily: SERIF, fontSize: 11.5, color: SOFT, marginTop: 6 }}>Asked by {is.interview.outlet.icon} <i>{is.interview.outlet.name}</i>: “{is.interview.question}”</div>
              <Bubble by={y.name}>{is.interview.quote}</Bubble>
            </div>
          ) : (<Bubble by={y.name}>{lead.say}</Bubble>)}
          {is.fans && (
            <div style={{ marginTop: 10, border: "2px solid " + INK, background: "rgba(255,255,255,0.55)", padding: "7px 10px", fontFamily: SERIF }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <b style={{ fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>❤️ The crowd</b>
                <span style={{ fontSize: 18, fontWeight: 900 }}>{is.fans.after}<span style={{ fontSize: 12, color: SOFT }}> / 100</span></span>
              </div>
              <div style={{ fontSize: 12.5, color: SOFT, lineHeight: 1.5, marginTop: 2 }}>
                On the lance <b style={{ color: is.fans.perf >= 0 ? "#166534" : "#b91c1c" }}>{is.fans.perf >= 0 ? "+" : ""}{is.fans.perf}</b>
                {is.fans.notes && is.fans.notes.length ? " (" + is.fans.notes.join(", ") + ")" : ""}
                {is.fans.interview != null && (<span> · Interview <b style={{ color: is.fans.interview >= 0 ? "#166534" : "#b91c1c" }}>{is.fans.interview >= 0 ? "+" : ""}{is.fans.interview}</b></span>)}
                {is.fans.promise && (<span> · {is.fans.promise.kept ? "Promise kept" : "Broken promise"} <b style={{ color: is.fans.promise.kept ? "#166534" : "#b91c1c" }}>{is.fans.promise.delta > 0 ? "+" : ""}{is.fans.promise.delta}</b></span>)}
                {is.fans.sponsor > 0 && (<span> · Sponsors chipped in <b>+{is.fans.sponsor} TP</b></span>)}
              </div>
              {is.interview && (<div style={{ fontSize: 12.5, fontStyle: "italic", color: INK, marginTop: 3 }}>{is.interview.reaction}</div>)}
            </div>
          )}
        </section>)}

        {/* Your tournament */}
        {ev.champ && !ev.champ.isP && String(ev.champ.id) !== String(ledWith) && (
          <section>
            <Kicker col="#1d4ed8">{ev.tierName}</Kicker>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Headline>{pk([sh(ev.champ.name) + " lifts the " + ev.tierName + " trophy", sh(ev.champ.name) + " is queen of " + ev.tierName, "Nobody could catch " + sh(ev.champ.name), sh(ev.champ.name) + " storms " + ev.tierName, "Hats off to " + sh(ev.champ.name), sh(ev.champ.name) + " bags the " + ev.tierName + " cup",
                  sh(ev.champ.name) + " wins it all at " + ev.tierName, "Three cheers for " + sh(ev.champ.name), sh(ev.champ.name) + " rules the roost at " + ev.tierName, ev.tierName + " glory for " + sh(ev.champ.name),
                  "No stopping " + sh(ev.champ.name) + " this week", sh(ev.champ.name) + " takes home the silverware", "The " + ev.tierName + " crown fits " + sh(ev.champ.name), sh(ev.champ.name) + " gallops to the title", "All bow to " + sh(ev.champ.name)], v, 2)}</Headline>
                <Body>{pk(["The week's " + ev.tierName + " draw belonged to " + ev.champ.emoji + " " + sh(ev.champ.name) + ", who rode through the bracket untouched.",
                  ev.champ.emoji + " " + sh(ev.champ.name) + " left a trail of feathers and bruised egos all the way to the " + ev.tierName + " title.",
                  "Rivals tried everything — flattery, fruitcake, mild threats — but " + ev.champ.emoji + " " + sh(ev.champ.name) + " took the title regardless.",
                  ev.champ.emoji + " " + sh(ev.champ.name) + "'s rooster did a lap of honour. Then another. Officials had to step in.",
                  "Nobody laid a glove on " + ev.champ.emoji + " " + sh(ev.champ.name) + " all week at " + ev.tierName + ".",
                  ev.champ.emoji + " " + sh(ev.champ.name) + " celebrated the " + ev.tierName + " title with a pot of tea and a smug little smile.",
                  "The " + ev.tierName + " trophy is heading to " + ev.champ.emoji + " " + sh(ev.champ.name) + "'s mantelpiece, right next to the carriage clock.",
                  ev.champ.emoji + " " + sh(ev.champ.name) + " charged, charged and charged again until there was nobody left to charge at.",
                  "Opponents queued up to be knocked off by " + ev.champ.emoji + " " + sh(ev.champ.name) + ", and knocked off they were.",
                  ev.champ.emoji + " " + sh(ev.champ.name) + " made the " + ev.tierName + " final look like a gentle stroll round the garden centre.",
                  "Several knitting circles have already started on a scarf for " + ev.champ.emoji + " " + sh(ev.champ.name) + ".",
                  ev.champ.emoji + " " + sh(ev.champ.name) + " thanked the crowd, the stewards and, rather pointedly, her rooster."], v, 1)}</Body>
                <Bubble by={sh(ev.champ.name)}>{quote(ev.champ.id, v)}</Bubble>
              </div>
              <Photo w={86} tilt={2.5} caption="Champion's lap"><div style={{ marginBottom: -3 }}><Rider palette={paletteFor(ev.champ.id)} width={82} pose="cheer" flip={true} /></div></Photo>
            </div>
          </section>
        )}

        {/* The feud: your rival's week */}
        {is.rival && (function () {
          var R = is.rival, n = sh(R.p.name), moved = R.from && R.to ? R.from - R.to : 0;
          var h = R.settled ? "Feud over! " + sh(R.settled.name) + " waves the white hanky"
            : R.isNew ? pk(["A new rivalry is born: " + n, n + " has it in for " + (y ? y.name : "you"), "Pistols at dawn: meet " + n,
                "Someone new is glaring at you: " + n, n + " has your name on her list", "Watch your back: " + n + " is coming", "Handbags at dawn with " + n,
                n + " wants a word with " + (y ? y.name : "you"), "Enter the nemesis: " + n, "A grudge is born, courtesy of " + n, n + " is sharpening her knitting needles", "Meet your new arch-enemy: " + n,
                "Trouble brewing: " + n + " takes against " + (y ? y.name : "you"), n + " has taken a dislike", "Say hello to your new nemesis, " + n], v, 0)
            : R.met === "won" ? pk(["Sweet revenge over " + n + "!", n + " gets her comeuppance", "Score settled with " + n + " — for now",
                n + " sent packing!", "A win over " + n + " never tasted sweeter", "Take that, " + n + "!", n + " eats humble pie", "Victory over " + n + ", served with cream",
                "Back in the hay, " + n, n + " is not happy this week", "Bragging rights over " + n, n + " left fuming in the car park",
                n + " knocked off her perch", "Who's laughing now, " + n + "?", n + " goes home to sulk"], v, 1)
            : R.met === "lost" ? pk([n + " strikes again", "The feud deepens: " + n + " wins round " + (R.h2h.w + R.h2h.l), n + " is insufferable this week",
                n + " has the last laugh, again", "Curses! " + n + " wins again", n + " rubs it in", "Round " + (R.h2h.w + R.h2h.l) + " goes to " + n, n + " is gloating at bingo",
                "Defeat at the hands of " + n, n + " won't stop going on about it", "The feud boils over: " + n + " wins", n + " sends a smug postcard",
                "Not again! " + n + " triumphs", n + " is unbearable at the tea urn", "Another one for " + n + "'s scrapbook"], v, 2)
            : pk(["Meanwhile, " + n + " is watching", "What " + n + " did this week", "Keep your enemies closer: " + n,
                n + " is up to something", "An eye on " + n, "The latest on " + n, n + " is biding her time", "Spotted: " + n + " doing her stretches",
                "Not a peep from " + n + ". Suspicious.", "Rival watch: " + n, n + " is plotting, quietly", "What's " + n + " knitting this week?",
                "Curtains twitch as " + n + " passes", n + " has bought a new lance", "Eyes peeled for " + n], v, 3);
          return (
            <section>
              <Kicker col="#be123c">The feud</Kicker>
              <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Headline>{h}</Headline>
                  <Body>{R.p.emoji} <b>{R.p.name}</b> {R.to ? "is world #" + R.to : ""}{moved > 0 ? ", up " + moved + " this week" : moved < 0 ? ", down " + (-moved) + " this week" : ""}. Head-to-head: <b>{R.h2h.w}–{R.h2h.l}</b>{R.h2h.w > R.h2h.l ? " to our granny." : R.h2h.w < R.h2h.l ? " to her." : ", dead level."}
                    {R.lv > 0 ? " She was spotted at the gym too: +" + R.lv + (R.lv === 1 ? " level." : " levels.") : ""}
                    {R.settled ? " Lead a rival by three and she stops bothering you — " + (R.isNew ? "but " + n + " has already stepped into the role." : "for now.") : ""}</Body>
                  <Bubble by={n}>{pk(["I've been practising. Mostly glaring.", "Tell her I said hello. Rudely.", "I'll see her on the lanes, dear.", "She knows what she did.",
                    "I've seen better jousting at the church fete.", "She can keep her trophies. I'll take her next.", "Tell her the knitting needles are out.", "I don't hold grudges. I knit them into scarves.",
                    "Lovely woman. Terrible jouster.", "My rooster doesn't like her rooster. Neither do I.", "She'll get hers. Mark my words.", "I've circled the date on the parish calendar."], v, R.h2h.l)}</Bubble>
                </div>
                <Photo w={86} tilt={2.5} caption={pk(["Seen sharpening her lance", "Not amused", "Plotting", "Muttering darkly", "Glaring at the camera", "Polishing her glove", "Arms very firmly folded", "Unimpressed, as usual", "Taking notes", "Lips pursed", "Biding her time", "Pretending not to care"], v, 1)}><div style={{ marginBottom: -3 }}><Rider palette={paletteFor(R.p.id, R.to)} width={82} pose={R.met === "won" ? "knocked" : "idle"} flip={true} /></div></Photo>
              </div>
            </section>
          );
        })()}

        {/* Fresh blood: the season's new class (first week of a season), then the week's rookie story (engine/rookies) */}
        {is.rookieClass && (
          <section>
            <Kicker col="#15803d">Fresh blood</Kicker>
            <Headline>{pk(["The class of Season " + is.rookieClass.s + " rides in", "New faces at the stables", "Make room: the rookies have arrived", "Fresh blood on the tour", "Season " + is.rookieClass.s + "'s new arrivals", "A new generation saddles up"], v, 5)}</Headline>
            <Body>{is.rookieClass.count} newcomers joined the tour this off-season, one for every granny who hung up her lance. They all start near the bottom. These {is.rookieClass.top.length} have the highest potential in the class:</Body>
            {is.rookieClass.top.map(function (r) {
              return (
                <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px dotted " + RULE }}>
                  <Face palette={paletteFor(r.id, r.rank)} size={34} />
                  <div style={{ fontFamily: SERIF, fontSize: 13.5, flex: 1, minWidth: 0, lineHeight: 1.3 }}>
                    <b>{r.emoji} {r.name}</b>{r.loud ? (<span style={{ marginLeft: 5, fontSize: 11, fontWeight: 900, color: "#b91c1c" }}>📣 OUTSPOKEN</span>) : null}<br />
                    <span style={{ color: SOFT }}>#{r.rank} · talent {r.talent} · potential {r.pot}</span>
                  </div>
                </div>
              );
            })}
          </section>
        )}
        {is.rookie && (function () {
          var R = is.rookie, n = sh(R.p.name);
          var hd = R.kind === "title" ? pk([n + " wins the " + (R.event || TIERS[R.tier].name) + " in her first season", "Rookie champion! " + n + " takes the " + (R.event || TIERS[R.tier].name), "First season, first trophy: " + n], v, 6)
            : R.kind === "mark" ? pk([n + " breaks into the top " + R.mark, "Top " + R.mark + " for rookie " + n, "Rookie " + n + " crashes the top " + R.mark], v, 6)
            : pk([n + " is on the rise", "Rookie on the move: " + n, n + " climbs " + (R.from - R.to) + " places"], v, 6);
          return (
            <section>
              <Kicker col="#15803d">Rookie watch</Kicker>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <Face palette={paletteFor(R.p.id, R.to)} size={46} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Headline>{hd}</Headline>
                  <Body>{R.p.emoji} <b>{R.p.name}</b>, in her first season on tour, is now world <b>#{R.to}</b>{R.from && R.from !== R.to ? " (from #" + R.from + ")" : ""}. Talent {R.talent}, potential {R.pot}.{R.loud ? " She hasn't been shy about saying so, either: see her latest on Knitter." : ""}</Body>
                </div>
              </div>
            </section>
          );
        })()}

        {/* Riders at your level */}
        {(pe.climber || pe.faller || pe.gym) && (
          <section>
            <Kicker col="#166534">Around your ranking</Kicker>
            <Headline>{pk(["On the move near #" + (y ? y.rankAfter : ""), "Shake-up around #" + (y ? y.rankAfter : ""), "Your neighbours are restless", "Comings and goings in your corner", "Elbows out near #" + (y ? y.rankAfter : ""),
              "Busy week around #" + (y ? y.rankAfter : ""), "Who's who near #" + (y ? y.rankAfter : ""), "The neighbours are at it again", "Musical chairs near #" + (y ? y.rankAfter : ""), "Over the garden fence",
              "Gossip from your end of the ladder", "Your corner of the rankings stirs", "Jostling near #" + (y ? y.rankAfter : ""), "Climbers and tumblers by #" + (y ? y.rankAfter : ""), "Twitching curtains in your neighbourhood"], v, 1)}</Headline>
            {[pe.climber && { m: pe.climber, txt: pk(["rockets up the rankings", "is flying up the ladder", "climbs like a startled hen", "can't stop climbing", "shoots up like a runner bean", "has found a second wind", "is on the up and up", "scales the ladder two rungs at a time", "is the talk of the tea tent", "zooms skywards", "leaves the pack behind", "goes up in the world"], v, 0) }, pe.faller && { m: pe.faller, txt: pk(["takes a tumble", "slides down the ladder", "has a week to forget", "is in free fall", "drops like a dropped stitch", "slips a few rungs", "goes down with a bump", "loses her footing", "tumbles out of favour", "sinks like a soggy scone", "goes backwards in a hurry", "is heading the wrong way"], v, 2) }].filter(Boolean).map(function (r) {
              return (
                <div key={r.m.p.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 0", borderBottom: "1px dotted " + RULE }}>
                  <Face palette={paletteFor(r.m.p.id, r.m.to)} size={34} />
                  <div style={{ fontFamily: SERIF, fontSize: 13.5, flex: 1, minWidth: 0 }}><b>{r.m.p.emoji} {r.m.p.name}</b> {r.txt}: #{r.m.from} → #{r.m.to}</div>
                  <Arrow from={r.m.from} to={r.m.to} />
                </div>
              );
            })}
            {pe.gym && (
              <Body><span style={{ display: "inline-block", marginTop: 6 }}><b>Gym gossip:</b> {pe.gym.p.emoji} {pe.gym.p.name} (#{pe.gym.rank}) {pk(["spent the week training", "was spotted lifting feed sacks at dawn", "has been sprinting her rooster up hills", "skipped bingo to practise", "did squats with a hay bale", "jogged three laps of the village green", "practised her lance work on the washing line", "has been doing yoga with her rooster", "swapped the biscuits for porridge", "trained by torchlight on the allotment", "hired a personal trainer from the bowls club", "did lunges all the way to the post office"], v, 1)} — <b>+{pe.gym.lv} {pe.gym.lv === 1 ? "level" : "levels"}</b>. {pk(["The rivals aren't resting, dear.", "Best get to the gym yourself.", "Consider yourself warned.", "Something to think about over your cocoa.", "Put that biscuit down.", "Your rooster's looking a bit soft, dear.", "Time to dust off the leg warmers.", "Don't say we didn't tell you.", "The gym's open till nine, you know.", "Just saying.", "Worth mulling over with a custard cream.", "Your knees won't train themselves."], v, 3)}</span></Body>
            )}
          </section>
        )}

        {/* Knitter lives in its own feed (News → 🧶 Knitter); the paper just points there */}
        {is.knits && is.knits.length > 0 && (
          <section>
            <div onClick={props.onKnitter} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", border: "1.5px solid " + RULE, borderRadius: 8, background: "rgba(255,255,255,0.55)", cursor: props.onKnitter ? "pointer" : "default", fontFamily: SERIF, fontSize: 13.5 }}>
              <span style={{ fontSize: 18 }}>🧶</span>
              <span style={{ flex: 1 }}><b>{is.knits.length} new knits this week</b>{is.knits[0] && is.knits[0].isP ? " — including yours" : ""}. {props.onKnitter ? "Read them on Knitter ›" : "Read them on Knitter, from Home."}</span>
            </div>
          </section>
        )}

        {/* The world's best */}
        <section>
          <Kicker col="#7c2d12">World tour</Kicker>
          <Headline>{w.newNo1
            ? pk(["New world number one! " + sh(top1.p.name) + " seizes the crown", "Long live Queen " + sh(top1.p.name) + "!", "A new #1: " + sh(top1.p.name) + " takes the throne", "The crown changes heads: " + sh(top1.p.name),
              "Make way for " + sh(top1.p.name) + ", the new #1", sh(top1.p.name) + " climbs to the very top", "Top of the tree: " + sh(top1.p.name), "The crown fits " + sh(top1.p.name),
              sh(top1.p.name) + " is number one!", "All change at the top: " + sh(top1.p.name) + " reigns", "Bunting out for new #1 " + sh(top1.p.name), sh(top1.p.name) + " takes the top perch",
              "Queen of the tour: " + sh(top1.p.name), "Fresh face at the summit: " + sh(top1.p.name), sh(top1.p.name) + " is the new head of the henhouse"], v, 0)
            : pk([sh(top1.p.name) + " still rules the tour", sh(top1.p.name) + " keeps the crown polished", "Nobody can shift " + sh(top1.p.name), sh(top1.p.name) + "'s throne: still warm, still hers", "Week after week, it's " + sh(top1.p.name), sh(top1.p.name) + " reigns on",
              sh(top1.p.name) + " stays top of the pecking order", "Still number one: " + sh(top1.p.name), sh(top1.p.name) + " won't budge", "Same old queen: " + sh(top1.p.name), sh(top1.p.name) + " hangs on to the crown",
              "The summit still belongs to " + sh(top1.p.name), sh(top1.p.name) + " guards the throne", "No change at the top: " + sh(top1.p.name), sh(top1.p.name) + " still wears the golden helmet"], v, 4)}</Headline>
          <div style={{ border: "2px solid " + INK, background: "rgba(255,255,255,0.45)", marginTop: 4 }}>
            {w.top.map(function (t) {
              return (
                <div key={t.p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 8px", borderTop: t.rank > 1 ? "1px solid " + RULE : "none", fontFamily: SERIF, fontSize: 13.5 }}>
                  <b style={{ width: 22 }}>{t.rank}.</b>
                  <Face palette={t.p.isP ? PLAYER_PALETTE : paletteFor(t.p.id, t.rank)} size={28} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.p.emoji} {t.p.name}{t.rank === 1 ? " 👑" : ""}</span>
                  <Arrow from={t.from} to={t.rank} />
                </div>
              );
            })}
          </div>
          {w.bigEvent && w.bigEvent.winner && String(w.bigEvent.winner.id) !== String(ledWith) && (
            <Body><span style={{ display: "inline-block", marginTop: 8 }}><b>{w.bigEvent.winner.event || TIERS[w.bigEvent.tier].name}:</b> {w.bigEvent.winner.emoji} {sh(w.bigEvent.winner.name)}{w.bigEvent.rank ? " (#" + w.bigEvent.rank + ")" : ""} took the week's biggest title{w.bigEvent.count > 1 ? " among " + w.bigEvent.count + " events" : ""}.</span></Body>
          )}
        </section>

        {/* Legends column (special edition) */}
        {is.legends && is.legends.length > 0 && (
          <section>
            <Kicker col="#92400e">Hall of the golden helmets</Kicker>
            <Headline>The legends you'll have to unseat</Headline>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 4 }}>
              {is.legends.map(function (l) {
                return (
                  <div key={l.id} style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: SERIF, fontSize: 12.5, minWidth: 0 }}>
                    <Face palette={paletteFor(l.id, l.rank)} size={32} />
                    <span style={{ minWidth: 0, lineHeight: 1.2 }}><b>#{l.rank}</b> {l.emoji} {sh(l.name)}<br /><span style={{ color: SOFT, fontStyle: "italic" }}>{l.titles} {l.titles === 1 ? "title" : "titles"}</span></span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <footer style={{ marginTop: 14, borderTop: "3px double " + RULE, paddingTop: 10, textAlign: "center" }}>
          {props.onDraws && is.hw && (
            <div style={{ marginBottom: 10 }}>
              <button onClick={function () { props.onDraws(is.hw); }} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 13.5, background: PAPER, color: INK, border: "2px solid " + INK, padding: "8px 16px", cursor: "pointer", boxShadow: "2px 2px 0 " + INK }}>
                📋 Every draw of the week →
              </button>
            </div>
          )}
          {props.onClose ? (
            <button onClick={props.onClose} style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 15, letterSpacing: 1, textTransform: "uppercase", background: INK, color: PAPER, border: "none", padding: "11px 22px", cursor: "pointer", boxShadow: "3px 3px 0 #9a3412" }}>
              Fold the paper →
            </button>
          ) : (
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 11, color: SOFT }}>Printed on recycled hen-house paper · Next issue after your next tournament</div>
          )}
        </footer>
      </motion.article>
  );
}
