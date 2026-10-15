/* ═══ Models / Persona ═══ Stable personality bits per granny (derived from id, so nothing extra is saved) */

function h(id, salt) { var x = Math.imul((id || 7) * 131 + salt * 7919, 2654435761) >>> 0; x ^= x >>> 16; return Math.imul(x, 2246822519) >>> 0; }
function pick(arr, id, salt) { return arr[h(id, salt) % arr.length]; }

var R_FIRST = ["Sir", "Captain", "Lord", "Big", "Little", "Mister", "Count", "Duke", "Señor", "Professor", "Admiral", "Baron"];
var R_LAST = ["Peckington", "Drumstick", "Nugget", "Thunderbeak", "Wattles", "Scramble", "Gizzard", "Crowsby", "Featherbottom", "Kernel", "Doodle", "Fluffington", "Clucksworth", "Eggbert"];

var TRAITS = [
  "Knits between rounds", "Never misses bingo night", "Former roller-derby queen", "Bakes for the whole tour",
  "Feeds her rooster only organic corn", "Still drives a 1974 Volvo", "Trains at 5am with her water-aerobics club",
  "Has 14 grandchildren in the stands", "Reads the rulebook for fun", "Brings a thermos of tea to every joust",
  "Undefeated at the village pie contest", "Talks to her rooster in Italian", "Collects porcelain spoons",
  "Swears her lance is lucky", "Ex-ballroom dancer — light on her stirrups", "Writes angry letters to the newspaper",
  "Never takes off her pearls", "Hums show tunes while charging", "Retired librarian, shushes the crowd",
  "Grows prize-winning marrows", "Plays the bagpipes at victory parties", "Rides with her cat in a basket",
  "Has a tattoo nobody's allowed to see", "Moonlights as a crossword champion"
];

var QUOTES = [
  "In my day we jousted uphill. Both ways.", "My rooster has more heart than half this field.",
  "I've buried two husbands. I'm not scared of a lance.", "Lovely girl. Shame about her timing.",
  "I'll be home in time for my programmes.", "Tell my grandson I want that trophy on the mantel.",
  "Speed is for youngsters. I bring precision.", "That glove hit me harder than my pension cut.",
  "My knees creak, but my lance doesn't.", "I came here to joust and eat biscuits. I'm all out of biscuits.",
  "Nobody puts Granny in the corner.", "I don't do warm-ups. I do warm milk.",
  "Back in '62 they gave you a medal for less.", "The rooster's name is on the trophy too, you know.",
  "Gold zone? I live in the gold zone, dear.", "I'll knit her a scarf. For the tears."
];

export function roosterName(id) { return pick(R_FIRST, id, 1) + " " + pick(R_LAST, id, 2); }
export function trait(id) { return pick(TRAITS, id, 3); }
export function quote(id, salt) { return pick(QUOTES, id, 4 + (salt || 0)); }

/* Top 10 are the tour's legends (golden helmets); #1 is the reigning world champion (crown) */
export function standing(rank) {
  if (rank === 1) return { tag: "World #1", icon: "👑", legend: true };
  if (rank && rank <= 10) return { tag: "Legend", icon: "🏅", legend: true };
  return null;
}

/* Granny names for newly generated tours (existing saves keep their riders) */
export var GRANNY_NAMES = ["Ethel", "Mabel", "Gladys", "Doris", "Edna", "Agnes", "Bertha", "Dolores", "Mildred", "Phyllis", "Beryl", "Hilda", "Irma", "Rosa", "Wilma", "Muriel", "Florence", "Ida", "Gertrude", "Myrtle", "Peggy", "Shirley", "Vera", "Nora", "Ruth", "Esther", "Lorraine", "Marge", "Thelma", "Constance", "Winifred", "Bea", "Opal", "Hazel", "Maud", "Pearl", "Ingrid", "Greta", "Carmen", "Lupe", "Fumiko", "Mei", "Olga", "Babushka Ana", "Nonna Lucia", "Oma Heidi", "Savta Rina", "Abuela Inés", "Yaya Eleni", "Granny Rose"];
