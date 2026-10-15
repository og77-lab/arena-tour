/* ═══ Engine / Interview ═══ Post-tournament press. Answers carry a hidden tone; how the crowd takes it depends on
   who's asking this week (each outlet's audience has hidden tastes), the context, repetition, and a little luck.
   Bold answers are promises, checked against the next tournament. No answer type is always right. */

var OUTLETS = [
  { name: "Knitting Weekly", icon: "🧶", likes: { humble: 3, bold: -2, funny: 1, fiery: -3, gracious: 2 } },
  { name: "Rooster Racing TV", icon: "📺", likes: { humble: -1, bold: 4, funny: 1, fiery: 2, gracious: 0 } },
  { name: "The Daily Cluck", icon: "📰", likes: { humble: 0, bold: 1, funny: 4, fiery: 1, gracious: 1 } },
  { name: "Pensioners' Gazette", icon: "👓", likes: { humble: 2, bold: -1, funny: 2, fiery: -2, gracious: 3 } },
  { name: "Cluckbook Live", icon: "📱", likes: { humble: -2, bold: 2, funny: 3, fiery: 3, gracious: -1 } }
];

var QUESTIONS = {
  champion: ["You've just won {tier}! What do you say to the rest of the tour?", "Champion at {tier}! Where does this rank in your career?"],
  final: ["So close in the {tier} final. How are you feeling?", "A runner-up finish at {tier}. Is that a win or a loss?"],
  deep: ["A run to the {round} at {tier}. What's working for you?", "You went deep at {tier} this week. What changed?"],
  early: ["Out in the {round} at {tier}. What went wrong out there?", "A short week at {tier}. Any excuses, Granny?"],
  rival: ["{foe} has your number lately. What's going on between you two?", "That's another loss to {foe}. Is this a rivalry now?"]
};

var ANSWERS = {
  humble: {
    high: ["I just tried to keep my lance steady. The rooster did the hard work.", "I'm only a granny who got lucky with her timing this week.", "Plenty of better riders out there. I'll take it one week at a time."],
    low: ["She was better today. Back to the barn to practise.", "My fault entirely — I rushed my strikes.", "I've got a lot to learn yet, dear."]
  },
  bold: {
    high: ["Get used to it. I'm winning next week too.", "Tell the legends to polish their golden helmets — I'm coming for them.", "That's just the warm-up. Watch me next week."],
    low: ["Mark my words: next week I take the whole thing.", "A blip. I'll be holding a trophy next week.", "They haven't seen the real me yet. Next week, they will."]
  },
  funny: {
    high: ["I promised my rooster a whole bag of corn if we won. He's going to be insufferable.", "My knees are still in the first round. Someone fetch them.", "I'd do a victory lap but I've just had my hip done."],
    low: ["My rooster saw a worm mid-charge. What can you do?", "I left my reading glasses in the car — I thought she was a hat stand.", "I'm blaming the biscuits. Too many custard creams."]
  },
  fiery: {
    high: ["Nobody gave me a chance. Well — who's laughing now?", "Write that down, all you doubters. Big letters.", "I've been underrated for years. Not any more."],
    low: ["That judge needs his eyes tested.", "She got lucky and she knows it.", "I'm not here to make friends. I'll get her next time."]
  },
  gracious: {
    high: ["Hats off to every granny in that draw — what a week.", "Thank you to the crowd. You carried me through.", "My opponents pushed me all the way. They deserve the applause too."],
    low: ["Full credit to her — a proper champion's ride.", "Wonderful crowd today. I'm sorry I couldn't give you more.", "She deserved it. I'll be cheering for her in the next round."]
  }
};

var TONES = ["humble", "bold", "funny", "fiery", "gracious"];

function fill(s, v) { return s.replace("{tier}", v.tier || "").replace("{round}", v.round || "").replace("{foe}", v.foe || ""); }
function shuffle(a, rnd) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

/* ctx: champion | final | deep | early | rival */
export function makeInterview(ctx, vars, rnd) {
  rnd = rnd || Math.random;
  var outlet = OUTLETS[Math.floor(rnd() * OUTLETS.length)];
  var qs = QUESTIONS[ctx] || QUESTIONS.deep;
  var group = ctx === "champion" || ctx === "deep" ? "high" : "low";
  var tones = shuffle(TONES, rnd).slice(0, 3);
  return {
    ctx: ctx, group: group, outlet: { name: outlet.name, icon: outlet.icon },
    question: fill(qs[Math.floor(rnd() * qs.length)], vars),
    answers: tones.map(function (t) { var pool = ANSWERS[t][group]; return { tone: t, text: pool[Math.floor(rnd() * pool.length)] }; })
  };
}

var GOOD = ["The crowd loved it.", "Fans are chanting your name.", "That clip is everywhere.", "Grannies across the land approve."];
var BAD = ["That one fell flat.", "Critics call it a bit much.", "The stands went quiet.", "Even your rooster looked embarrassed."];

/* Returns { delta, viral, reaction } — revealed only after the player has chosen */
export function scoreAnswer(iv, tone, recentTones, rnd) {
  rnd = rnd || Math.random;
  var o = OUTLETS.filter(function (x) { return x.name === iv.outlet.name; })[0] || OUTLETS[0];
  var d = o.likes[tone] || 0;
  if (tone === "bold" && iv.group === "low") d -= 2;
  if (tone === "humble" && iv.ctx === "champion") d -= 1;
  if (tone === "fiery" && iv.group === "high") d -= 1;
  if (tone === "gracious" && iv.group === "low") d += 1;
  if (tone === "funny" && iv.ctx === "early") d += 1;
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
