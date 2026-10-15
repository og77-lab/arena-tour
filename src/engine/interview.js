/* ═══ Engine / Interview ═══ Post-tournament press. Every answer is a joke, but each carries a hidden tone:
   sass (a cheeky dig at a rival), excuse (a daft excuse — or a daft secret when you won), sporting (funny but gracious)
   and bold (a funny promise, checked against the next tournament). How the crowd takes it depends on who's asking
   this week (each outlet's audience has hidden tastes), the context, repetition, and a little luck.
   Lines the player has already seen are skipped until the pool runs dry, so the press never sounds like a loop. */

var OUTLETS = [
  { name: "Knitting Weekly", icon: "🧶", likes: { sass: -2, excuse: 1, sporting: 3, bold: -1 } },
  { name: "Rooster Racing TV", icon: "📺", likes: { sass: 2, excuse: -1, sporting: 0, bold: 4 } },
  { name: "The Daily Cluck", icon: "📰", likes: { sass: 2, excuse: 3, sporting: 1, bold: 1 } },
  { name: "Pensioners' Gazette", icon: "👓", likes: { sass: -1, excuse: 2, sporting: 3, bold: -2 } },
  { name: "Cluckbook Live", icon: "📱", likes: { sass: 4, excuse: 2, sporting: -1, bold: 2 } },
  { name: "Bingo Hall Radio", icon: "📻", likes: { sass: 1, excuse: 2, sporting: 2, bold: 0 } }
];

/* {tier} {round} {foe} = who knocked you out, {beat} = your best scalp this week */
var QUESTIONS = {
  champion: [
    "You've just won {tier}! What do you say to the rest of the tour?",
    "Champion at {tier}! Who are you dedicating it to?",
    "{tier} champion! How will you celebrate — tea, or something stronger?",
    "You beat {beat} on the way to the {tier} title. Any words for her?",
    "Will the {tier} trophy fit on your mantelpiece, Granny?",
    "The {tier} title is yours. Go on — what's the secret?",
    "Your rooster's strutting like he owns the place. Does he?"
  ],
  final: [
    "So close in the {tier} final. How are you feeling?",
    "A runner-up finish at {tier}. Is that a win or a loss?",
    "{foe} beat you in the {tier} final. What happened out there?",
    "Silver at {tier}. Will the medal go next to the biscuit tin?",
    "One charge from glory at {tier}. What will you tell the grandchildren?",
    "You were a whisker from the {tier} trophy. Any regrets?"
  ],
  deep: [
    "A run to the {round} at {tier}. What's working for you?",
    "You went deep at {tier} this week. What changed?",
    "You knocked out {beat} at {tier}. Was that the plan all along?",
    "The {round} at {tier}! Where's all this energy coming from?",
    "{foe} finally stopped you in the {round}. Your thoughts?",
    "Your rooster looked sharp at {tier}. What's he been eating?"
  ],
  early: [
    "Out in the {round} at {tier}. What went wrong out there?",
    "A short week at {tier}. Any excuses, Granny?",
    "{foe} sent you packing early at {tier}. Thoughts?",
    "A quick trip to {tier}. Did you at least enjoy the sandwiches?",
    "Early exit at {tier}. Is it time to retire the rooster?",
    "Spectators say they barely had time to sit down. What happened?"
  ],
  rival: [
    "{foe} has your number lately. What's going on between you two?",
    "That's another loss to {foe}. Is this a rivalry now?",
    "Is it true you and {foe} aren't speaking at the knitting circle?",
    "{foe} again! Does she keep you up at night?",
    "What would you say to {foe} if she were standing here right now?"
  ]
};

/* high = you won it or went deep; low = you lost */
var ANSWERS = {
  sass: {
    high: [
      "{beat} rides like she's parallel parking a shopping trolley. Lovely woman, though.",
      "I'd thank my opponents, but honestly I barely noticed them.",
      "{beat} brought a lovely cardigan. Shame she didn't bring a lance.",
      "Someone tell {beat} the pointy end goes at the front, dear.",
      "I've seen sharper jousting at the Tuesday bingo.",
      "{beat}'s rooster asked for my autograph afterwards. I signed his beak.",
      "My grandson's goldfish puts up more of a fight. And he's been dead since 2009.",
      "The others were wonderful. Wonderfully slow.",
      "{beat} said she'd knock my teeth out. Joke's on her — they're in a glass at home.",
      "I'll send {beat} a get-well card. And a jousting manual. Large print."
    ],
    low: [
      "{foe} won, fine. But have you seen her knitting? Dropped stitches everywhere.",
      "{foe}'s rooster is lovely. It's the rider who needs work.",
      "Congratulations to {foe}. Enjoy it, sweetheart — it won't happen twice.",
      "{foe} only won because her perfume knocked my rooster out cold.",
      "I let {foe} win. It's her birthday. Somewhere. Probably.",
      "{foe} jousts like she knits: slowly, and with a smug little face.",
      "She beat me, yes. But I've still got more grandchildren than {foe}.",
      "{foe} should treasure that win. It's the only thing in her cabinet besides biscuits.",
      "{foe} cheated. I can't prove it, but her hat looked very suspicious.",
      "Tell {foe} I want a rematch. And my Tupperware back."
    ]
  },
  excuse: {
    high: [
      "The secret's in the porridge. Three bowls and a splash of rooster tonic.",
      "I wasn't even trying. I thought it was the queue for the post office.",
      "My rooster's been watching motivational videos. He won't stop crowing about it.",
      "I took my glasses off. Can't be scared of what you can't see.",
      "Prune juice. That's all I'm prepared to say on the matter.",
      "I told my rooster there was a fox behind us. He's never run faster.",
      "My late husband's lucky socks. Unwashed since 1987. Nobody dares come near me.",
      "I've been training by chasing the bin lorry every Thursday.",
      "My new hip came with a turbo. Nobody told the doctors.",
      "I just pretended every opponent was the woman who stole my parking space."
    ],
    low: [
      "My rooster saw a worm mid-charge. What was I supposed to do, fight nature?",
      "I left my reading glasses in the car. I thought {foe} was a hat stand.",
      "The sun was in my eyes. Also the wind. Also it was a Tuesday.",
      "I'd just had a custard cream. Rookie mistake. Far too heavy before a joust.",
      "My hearing aid picked up the radio. I was listening to the cricket.",
      "My rooster's going through a phase. He wants to be a duck.",
      "The lance was clearly bent. I'll be writing a strongly worded letter.",
      "Someone in row three was knitting a cable stitch wrong. I couldn't concentrate.",
      "My bunion was playing up. It's a weather bunion — very accurate, very painful.",
      "My rooster's in love with {foe}'s rooster. He threw the match. Romantic fool.",
      "I forgot my lucky teaspoon. Never again. Never."
    ]
  },
  sporting: {
    high: [
      "Lovely week. Nobody fell off, and the tea was hot. That's a win in my book.",
      "Biscuits for everyone on the way out — I baked for all of you. Especially the losers.",
      "Big hand for {beat}. She hit me so hard my dentures are still in the second round.",
      "Full credit to the roosters. They do all the running and we take all the bows.",
      "Every granny in that draw was brilliant. Some were just brilliantly slower than me.",
      "I owe {beat} a cup of tea and a new hat. Sorry about the hat, dear.",
      "Thank you to the crowd. Your cheering drowned out my knees creaking.",
      "A good clean contest. Well — mostly clean. My rooster had a little accident in the semis.",
      "I'll be sharing the prize money with my rooster. He wants it in corn.",
      "To every granny watching: it's never too late to hit someone with a stick. Lovingly."
    ],
    low: [
      "{foe} was magnificent. I hate her a tiny bit, but magnificent.",
      "Well played, {foe}. I'll knit you a scarf. A slightly itchy one.",
      "She was better today. I was better at falling off — that takes skill too.",
      "Congratulations to {foe}. I'll be cheering for her. Through gritted dentures.",
      "Losing builds character. I must have the most character on the whole tour.",
      "No complaints. My pride's bruised but my hip held up, so that's a win.",
      "Hats off to {foe}. Mine came off by itself, actually, during the second charge.",
      "Lovely crowd today. Sorry about the language when I landed in the hay.",
      "I'll be back stronger. Or at least with better cushions.",
      "Fair's fair — {foe} earned it. I'll get her back at bingo."
    ]
  },
  bold: {
    high: [
      "Next week I'm winning again. Somebody warn the trophy.",
      "Tell the golden helmets to keep their seats warm. I'm coming for them.",
      "That was the warm-up. Next week the cardigan comes off.",
      "Next week I'll win it one-handed. The other hand's holding my tea.",
      "I'm not stopping until there's a statue of me. Bronze. With the rooster. Life-size.",
      "I'll win next week too. My rooster's already ordered the cake.",
      "Book the brass band for next week. And a chiropractor.",
      "Next week I'll joust so well they'll name a biscuit after me."
    ],
    low: [
      "Mark my words: next week I win the whole thing. It's on the calendar. In pen.",
      "Next week I'm coming back angrier. And with a pointier lance.",
      "That was a blip. Next week the trophy comes home in my handbag.",
      "Next week I'm going deep. I've cancelled bingo. That's how serious I am.",
      "Watch me next week. I've been saving my best moves. Mostly for my hip's sake.",
      "Next week I'm unbeatable. I've found my lucky teaspoon.",
      "Semifinal at least next week, or I'll eat my hat. The knitted one.",
      "Next week they'll meet the real me. The real me has had a nap and is furious."
    ]
  }
};

var TONES = ["sass", "excuse", "sporting", "bold"];

function fill(s, v) { return s.replace(/\{(tier|round|foe|beat)\}/g, function (_, k) { return v[k] || ""; }); }
function fits(s, v) { var ok = true; s.replace(/\{(tier|round|foe|beat)\}/g, function (_, k) { if (!v[k]) ok = false; return ""; }); return ok; }
function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* Pick a line the player hasn't seen recently (falls back to any that fits) */
function fresh(pool, v, seen, rnd) {
  var ok = pool.filter(function (s) { return fits(s, v); });
  var unseen = ok.filter(function (s) { return seen.indexOf(s) < 0; });
  var from = unseen.length ? unseen : ok.length ? ok : pool;
  return from[Math.floor(rnd() * from.length)];
}

/* ctx: champion | final | deep | early | rival. seen: template lines used in recent interviews */
export function makeInterview(ctx, vars, rnd, seen) {
  rnd = rnd || Math.random; seen = seen || []; vars = vars || {};
  var outlet = OUTLETS[Math.floor(rnd() * OUTLETS.length)];
  var group = ctx === "champion" || ctx === "deep" ? "high" : "low";
  var q = fresh(QUESTIONS[ctx] || QUESTIONS.deep, vars, seen, rnd);
  var tones = shuffle(TONES, rnd).slice(0, 3);
  var lines = tones.map(function (t) { return { tone: t, line: fresh(ANSWERS[t][group], vars, seen, rnd) }; });
  return {
    ctx: ctx, group: group, outlet: { name: outlet.name, icon: outlet.icon },
    question: fill(q, vars),
    used: [q].concat(lines.map(function (l) { return l.line; })),
    answers: lines.map(function (l) { return { tone: l.tone, text: fill(l.line, vars) }; })
  };
}

var GOOD = ["The crowd loved it.", "Fans are chanting your name.", "That clip is everywhere.", "Grannies across the land approve.",
  "Someone's already printing it on tea towels.", "The knitting circle is in stitches.", "Your rooster puffed up with pride.", "Even the referee laughed."];
var BAD = ["That one fell flat.", "Critics call it a bit much.", "The stands went quiet.", "Even your rooster looked embarrassed.",
  "Somebody coughed. Loudly.", "The bingo hall is not amused.", "A pensioner in row two tutted audibly.", "Tumbleweed. And a single cluck."];

/* Returns { delta, viral, reaction } — revealed only after the player has chosen */
export function scoreAnswer(iv, tone, recentTones, rnd) {
  rnd = rnd || Math.random;
  var o = OUTLETS.filter(function (x) { return x.name === iv.outlet.name; })[0] || OUTLETS[0];
  var d = o.likes[tone] || 0;
  if (tone === "bold" && iv.group === "low") d -= 2;
  if (tone === "sass" && iv.group === "high") d -= 1;
  if (tone === "sass" && iv.ctx === "rival") d += 2;
  if (tone === "sporting" && iv.group === "low") d += 1;
  if (tone === "excuse" && iv.ctx === "early") d += 1;
  if (tone === "excuse" && iv.ctx === "final") d -= 1;
  var rep = (recentTones || []).filter(function (t) { return t === tone; }).length;
  d -= rep * 2;
  d += Math.round(rnd() * 4 - 2);
  var viral = rnd() < 0.08;
  if (viral) d = Math.round(d * 2.5) || (rnd() < 0.5 ? 6 : -6);
  var pool = d >= 0 ? GOOD : BAD;
  return { delta: d, viral: viral, reaction: (viral ? "It went viral! " : "") + pool[Math.floor(rnd() * pool.length)] };
}

/* A bold answer is a promise for the next tournament: kept = semifinal or better */
export function resolvePromise(promise, pRound, rounds, wonTitle) {
  if (!promise) return null;
  var kept = wonTitle || pRound >= rounds - 2;
  return { kept: kept, delta: kept ? 6 : -5, text: kept ? "Promise kept! The crowd remembers what you said." : "You talked big last week. The fans noticed you didn't back it up." };
}
