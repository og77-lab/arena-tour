/* ═══ src/engine/ads.js ═══ The parody mobile-popup ad system.
   Twelve finite ads with pre-generated Nigel audio. One image + one audio clip per ad; the clip is cached
   in Vercel Blob forever on first call and never regenerated. Showing an ad is: pick next ad from the
   shuffled queue, render AdPopup overlay with image + audio, dismiss on tap or after 10 seconds.

   No dynamic content, no placeholders: the clip for Joint Gold is the same 9-second Nigel reading for every
   player on every device, every time it shows. Same model as the studio booth. */

export var ADS = [
  { id: "joint-gold",        img: "/art/ads/joint-gold.png",
    text: "LADIES! JOINT GOLD! The ONLY tonic clinically proven to get your knees back on the rooster! Doctors HATE this! Only three bottles left in your postcode — call NOW!" },
  { id: "granny-squares",    img: "/art/ads/granny-squares.png",
    text: "Download Granny Squares 3D! The number ONE crochet simulator in ninety-four countries! Twelve MILLION reviews, five stars! Free yarn pack for new players! Install — RIGHT NOW!" },
  { id: "rooster-match",     img: "/art/ads/rooster-match.png",
    text: "Lonely rooster in YOUR AREA wants to meet! Forty-seven cockerels in your postcode have swiped RIGHT! Betty just matched with Clive! Don't let your rooster die alone — swipe NOW!" },
  { id: "bingo-blast",       img: "/art/ads/bingo-blast.png",
    text: "Mavis from Hull just won FORTY-SEVEN THOUSAND POUNDS at Bingo Blast! Five THOUSAND free coins for new players! The jackpot resets in minutes — play FREE now!" },
  { id: "egg-spert",         img: "/art/ads/egg-spert.png",
    text: "Egg-spert! The number one rooster dating app! OVER forty MILLION cockerels! Doreen's rooster found love in eleven minutes! Join FREE today — your rooster is waiting!" },
  { id: "neuro-wool",        img: "/art/ads/neuro-wool.png",
    text: "Neuro-Wool! Knit your way to a SHARPER memory! Clinically proven to reverse forgetting your own name! Start your free trial today — before you forget to!" },
  { id: "combworm",          img: "/art/ads/combworm.png",
    text: "WARNING! Three out of FOUR roosters in your postcode have UNDIAGNOSED combworm! Don't wait! Take the free thirty-second quiz — your rooster is counting on you!" },
  { id: "widow-finder",      img: "/art/ads/widow-finder.png",
    text: "Mature gentlemen in Stoke-on-Trent want to meet YOU! Harold, ninety-four, just viewed your profile! Cedric and Bernard have sent winks! See who's interested — join NOW!" },
  { id: "roostermobile",     img: "/art/ads/roostermobile.png",
    text: "The Roostermobile three-THOUSAND! Now with seatbelt! Three stylish colours — brown, slightly browner, and beige-ish! Free delivery! Your rooster has OPINIONS — restrain them TODAY!" },
  { id: "inconti-guard",     img: "/art/ads/inconti-guard.png",
    text: "Inconti-Guard ULTRA! Never miss a bingo night AGAIN! Dorothy sneezed through THREE games! Hydro-Lock Barrier! Rose-Scent Technology! Six pairs, nineteen-ninety-nine — order discreetly!" },
  { id: "clacketts-lances",  img: "/art/ads/clacketts-lances.png",
    text: "CLACKETT'S Championship Lances! Steel-reinforced tip! Used by NINE of the top TEN riders! Anti-bend shaft! Twelve-foot length, arena legal! One-forty-nine the pair — buy NOW!" },
  { id: "tour-pass-gold",    img: "/art/ads/tour-pass-gold.png",
    text: "Tour Pass GOLD! Never MISS a Challenger again! Three-HUNDRED and forty live events a year! First month just ONE POUND! Early-bird closes Sunday — activate your pass TODAY!" }
];

/* Settings toggle, mirrored from localStorage. */
export function isAdsOn() {
  if (typeof localStorage === "undefined") return true;
  var v = localStorage.getItem("adsOn");
  return v !== "0";
}
export function setAdsOn(on) {
  try { localStorage.setItem("adsOn", on ? "1" : "0"); } catch (e) {}
}

/* The shuffled queue is kept in localStorage so the same ad doesn't repeat until the whole set has been shown.
   One full pass through 12 ads before any repeats. */
var QUEUE_KEY = "adsQueue";
function shuffle(arr) {
  var a = arr.slice();
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
function readQueue() {
  try { var q = JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); if (Array.isArray(q) && q.length) return q; } catch (e) {}
  return [];
}
function writeQueue(q) {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); } catch (e) {}
}
export function nextAd() {
  var q = readQueue();
  if (!q.length) q = shuffle(ADS.map(function (a) { return a.id; }));
  var id = q.shift();
  writeQueue(q);
  var ad = ADS.find(function (a) { return a.id === id; });
  return ad || ADS[0];
}

/* Should an ad fire on this tab entry? Deterministic counter: every Nth click on a watched tab shows one ad,
   then the counter resets. The caller (ArenaGame.goTab) passes the tab name; we only count clicks on tabs
   we're configured to interrupt. */
var COUNTER_KEY = "adsTabCounter";
var WATCHED_TABS = { rankings: true, season: true };  /* season = Tournaments tab */
var EVERY_N_CLICKS = 5;

export function shouldShowAdOnTab(tabName) {
  if (!isAdsOn()) return false;
  if (!WATCHED_TABS[tabName]) return false;

  /* Dev override: ?adsdev=1 in the URL fires an ad on EVERY visit to a watched tab. Lets a tester cycle all
     twelve ads quickly without touching the console. */
  var devForce = false;
  try { devForce = typeof location !== "undefined" && /[?&]adsdev=1\b/.test(location.search); } catch (e) {}
  if (devForce) return true;

  /* Increment the global tab-switch counter. Every EVERY_N_CLICKS-th click on a watched tab fires an ad and
     resets the counter. */
  var count = 0;
  try { count = parseInt(localStorage.getItem(COUNTER_KEY) || "0", 10) || 0; } catch (e) {}
  count++;
  if (count >= EVERY_N_CLICKS) {
    try { localStorage.setItem(COUNTER_KEY, "0"); } catch (e) {}
    return true;
  }
  try { localStorage.setItem(COUNTER_KEY, String(count)); } catch (e) {}
  return false;
}

/* Pre-generation enumeration — one line per ad, Nigel voice. Called by the warm-cache script. */
export function enumerateAllAds() {
  return ADS.map(function (a) { return { voice: "nigel", text: a.text, bank: "AD_" + a.id.toUpperCase() }; });
}
