# Arena Tour — Build Specification
## Claude Code Build Prompt

### Overview
Arena Tour is a single-player ATP-style combat tournament game with 1000 NPC warriors, tiered tournaments, seasonal rankings, training systems, and a career progression spanning multiple seasons. It's built to be polished as single-player now but architecturally ready for multiplayer later.

### Tech Stack
- **React 18 + TypeScript** — strict types for all game state
- **Vite** — build tool
- **Zustand** — state management (replaces useState chaos)
- **Tailwind CSS** — styling (replace all inline styles)
- **Framer Motion** — animations (hit/miss effects, transitions)
- **LocalStorage** for persistence (swap to Supabase later)

### Project Structure
```
src/
├── main.tsx
├── App.tsx
├── stores/
│   ├── gameStore.ts          # Main Zustand store
│   ├── tournamentStore.ts    # Active tournament state
│   └── finalsStore.ts        # Season finals state
├── models/
│   ├── types.ts              # All TypeScript interfaces
│   ├── constants.ts          # Tiers, points, tier configs
│   └── formulas.ts           # All game math (scoring, difficulty, NPC sim)
├── engine/
│   ├── npcGenerator.ts       # Generate 1000 NPCs with skill/potential
│   ├── bracketRunner.ts      # Run tournament brackets (reusable for multiplayer)
│   ├── parallelSim.ts        # Simulate parallel tour each week
│   ├── trainingEngine.ts     # NPC + player training logic
│   ├── rankingEngine.ts      # Calculate rankings, defending points
│   └── seasonManager.ts      # Calendar, season transitions, defending
├── components/
│   ├── screens/
│   │   ├── TitleScreen.tsx
│   │   ├── HubScreen.tsx
│   │   ├── TournamentScreen.tsx
│   │   ├── TrainingScreen.tsx
│   │   ├── FinalsScreen.tsx
│   │   └── HelpScreen.tsx
│   ├── combat/
│   │   ├── PowerBar.tsx       # The strike mechanic
│   │   ├── MatchCard.tsx      # Opponent info + training comparison
│   │   └── ResultCard.tsx     # Strike breakdown + why you won/lost
│   ├── hub/
│   │   ├── StatusBar.tsx
│   │   ├── NextEvent.tsx
│   │   ├── TierPicker.tsx
│   │   ├── CalendarGrid.tsx
│   │   ├── RankingsTable.tsx
│   │   ├── ResultsHistory.tsx
│   │   └── LastWeekResults.tsx
│   ├── shared/
│   │   ├── PlayerProfile.tsx  # Modal with full player stats
│   │   ├── SkillBar.tsx       # Talent + potential visual bar
│   │   ├── TrainingBars.tsx   # 5-stat training display
│   │   └── MoneyFormat.tsx    # $3K / $150K / $1.2M formatting
│   └── layout/
│       ├── GameShell.tsx      # Dark theme wrapper
│       └── ScreenTransition.tsx
├── hooks/
│   ├── usePersistence.ts     # Save/load (LocalStorage now, Supabase later)
│   ├── useRanking.ts         # Compute player rank from store
│   └── useAvailableTiers.ts  # Which tiers player can enter
└── utils/
    ├── shuffle.ts
    ├── formatMoney.ts
    └── exportImport.ts       # JSON save file export/import
```

---

## Data Models (types.ts)

```typescript
interface NPC {
  id: number;                    // 2-1000
  name: string;                  // "Kai the Swift"
  emoji: string;                 // "⚔️"
  skill: number;                 // Current natural talent (15-92)
  pot: number;                   // Potential ceiling (skill+8 to skill+23, max 95)
  sp: number;                    // Season points (resets each season)
  ap: number;                    // All-time points (career total)
  tr: TrainingStats;             // Training levels
  best: BestStats;               // Career achievements
}

interface Player {
  id: 1;
  isP: true;
  sp: number;
  ap: number;
  tr: TrainingStats & { tp: number }; // TP = training points to spend
  money: number;                       // Career prize money
  seasonMoney: number;                 // This season prize money
  best: BestStats;
  def: number[];                       // Defending points per calendar slot
  res: number[];                       // This season's results per slot
}

interface TrainingStats {
  r: number;  // Reflexes (0-20) — slows bar speed relative to opponent
  p: number;  // Power (0-20) — widens sweet spot relative to opponent
  f: number;  // Focus (0-20) — adds to strike score relative to opponent
  s: number;  // Stamina (0-20) — reduces bar acceleration between strikes
  g: number;  // Grit (0-20) — raises minimum score on bad misses
}

interface BestStats {
  rank: number;         // Peak ranking ever achieved
  peakS: number;        // Peak season points
  titles: number;       // Total tournament titles
  gsTitles: number;     // Grand Slam titles
  finals: number;       // Season Finals appearances
  careerMoney: number;  // NPC career earnings
}

interface Season {
  pName: string;
  sNum: number;           // Season number
  player: Player;
  npcs: NPC[];            // 999 NPCs
  cal: CalendarEvent[];   // 20 events
  calIdx: number;         // Current event index
  champs: Champion[];     // World champions history
  tHist: TournamentResult[]; // All tournament results
}

interface CalendarEvent {
  type: "swing" | "gs";
  block: number;          // 1-4
  week?: number;          // 1-4 for swings
  gsNum?: number;         // 1-4 for grand slams
  tier: number | null;    // Which tier was played
  done: boolean;
  result: EventResult | null;
}

interface TierConfig {
  name: string;          // "Futures", "Challenger", etc.
  short: string;         // "FUT", "CHL", etc.
  col: string;           // Tier color
  size: 32 | 64;         // Players per draw
  rounds: 5 | 6;         // Tournament rounds
  pts: number[];         // Points per round won
  money: number[];       // Prize money per round
  rankRange: [number, number]; // Eligible rank range
}
```

---

## Game Constants (constants.ts)

### Tournament Tiers
| Tier | Short | Size | Rounds | Rank Range | Win Pts (R1→Final) | Win Prize |
|------|-------|------|--------|------------|---------------------|-----------|
| Futures | FUT | 32 | 5 | 601-1001 | 10,25,50,100,200 | $3,000 |
| Challenger | CHL | 32 | 5 | 301-700 | 25,60,120,250,500 | $10,000 |
| Tour 250 | 250 | 32 | 5 | 101-400 | 80,160,320,640,1200 | $40,000 |
| Tour 500 | 500 | 32 | 5 | 31-200 | 160,320,640,1200,2400 | $100,000 |
| Masters | MST | 32 | 5 | 1-100 | 300,600,1200,2400,5000 | $300,000 |
| Grand Slam | GS | 64 | 6 | 1-64 | 500,1000,2000,4000,8000,16000 | $1,000,000 |

### Season Calendar (20 events)
4 blocks × (4 swing weeks + 1 Grand Slam) = 20 events per season.

### Season Finals
Top 16 ranked players after 20 events. 4 houses of 4, round-robin groups. House winners → semifinals. Semi winners → World Championship Final.

### Parallel Tour Each Week (Swing Weeks)
| Tier | Simultaneous Events | Participants |
|------|---------------------|-------------|
| Futures | 10 | 320 |
| Challenger | 5 | 160 |
| Tour 250 | 3 | 96 |
| Tour 500 | 2 | 64 |
| Masters | 1 | 32 |
| **Total** | **21** | **672** |

Grand Slam weeks: only 1 GS event (64 players).

---

## Core Game Mechanics (formulas.ts)

### Combat: The Power Bar

Each match = 3 strikes. Player taps STRIKE to stop a bouncing cursor on a horizontal bar.

**Bar Properties (per match, based on difficulty + relative training):**
```
difficulty = roundIndex + tierOffset[tierIdx]
  tierOffset = [0, 1, 2, 3, 4, 3]  // FUT, CHL, 250, 500, MST, GS

barSpeed = max(0.8, 2.0 + difficulty * 0.4 - netReflexes * 0.12)
sweetSpotWidth = max(3, 16 - difficulty * 1.8 + netPower * 1.5)
focusBonus = netFocus * 2.0
strikeAcceleration = max(0.03, 0.3 - netStamina * 0.015)
minMissScore = max(0, 15 + netGrit * 1.5)

where net[Stat] = player[stat] - opponent[stat]  (RELATIVE)
```

**Player Scoring (per strike):**
```
if cursor inside gold zone:
  score = 88 + random(0, 12) + focusBonus   // 88-100
else:
  distance = |cursorPos - zoneCenter|
  score = max(minMissScore, 75 - distance * 1.0 + random(0, 12)) + focusBonus
  // Near miss: ~65-77, Medium: ~55-67, Far: ~25-50
```

**NPC Scoring (auto-generated per strike):**
```
effectiveSkill = npcSkill + (sum of all 5 npc training stats) * 0.9
base = min(95, 45 + effectiveSkill * 0.45)
score = min(99, base + random(-5, +9))
```

| NPC Skill | Score Range | Tier |
|-----------|-------------|------|
| 15-20 | 47-63 | Futures |
| 30-40 | 58-72 | Challenger |
| 55 | 65-79 | Tour 250 |
| 70 | 72-86 | Tour 500 |
| 85+ | 78-92+ | Masters |

**Match Result:** Average of 3 player strikes vs average of 3 NPC strikes. Higher wins.

**After each match:** Show strike-by-strike breakdown, averages, and plain-English explanation of why you won/lost. Player must click "Continue" (NO auto-advance).

### NPC Generation (1000 warriors)

**Skill Distribution:**
```
Top 3%  (30 NPCs):  skill = 82 + random(0, 10)   → Elite
Top 10% (70 NPCs):  skill = 70 + random(0, 14)   → Strong  
Top 25% (150 NPCs): skill = 55 + random(0, 18)   → Average-Strong
Top 50% (250 NPCs): skill = 38 + random(0, 20)   → Developing-Average
Bottom 50% (499):   skill = 15 + random(0, 28)    → Developing
```

**Potential:** `pot = min(95, skill + 8 + random(0, 15))`
Skill can never grow past potential. This creates a natural talent ceiling per NPC.

**Initial Seed SP (Season 1 only):**
Sort NPCs by skill descending, then assign:
```
if rank > 800:  seed = random(0, 10)
if rank > 600:  seed = 20 + random(0, 30)
else:           seed = 100 + 4500 * ((700 - rank) / 699)^2
```
This gives #1 ~4600 SP, #500 ~468 SP, #999 ~5 SP. Player starts at 0.

### Ranking Points

**R1 losers get 0 points.** You must win to earn.

**Season points** = sum of all tournament earnings this season.

**Defending Points (Season 2+):** At the start of a new season, player's SP = sum of last season's per-slot results. Each calendar slot has a "defending" value. When you play that slot, your net change = earned - defending. Your SP adjusts by the net. If you do worse than last season, you LOSE ranking points.

### Training System

**Player:** Earns TP (Training Points) per tournament: `floor(pointsEarned / 4) + 15`
Spends TP to upgrade stats. Cost per level: `(currentLevel + 1) * 15 + max(0, currentLevel - 8) * 15`
Max level per stat: 20. Total possible: 100 (5 × 20).

**NPC Training (per parallel tournament participation):**
| Result | Training Levels |
|--------|----------------|
| R1 loser | 30% chance of 1 |
| Won ≥1 match | 1 |
| Semifinalist | 1 |
| Finalist/Winner | 2 |

**Background training:** 12% chance per week for non-participants to gain 1 level.

**NPC skill growth:** +random(0, 0.3) - 0.05 per tournament, capped at their potential.

### NPC vs NPC Combat (bracket resolution)
Same formula as NPC scoring vs player:
```
scoreA = min(95, 45 + effectiveSkillA * 0.45) + random(-5, 9)
scoreB = min(95, 45 + effectiveSkillB * 0.45) + random(-5, 9)
winner = scoreA >= scoreB ? A : B
```

---

## Multiplayer-Ready Architecture

### What stays the same:
- All game formulas, constants, scoring
- PowerBar component (just swaps NPC auto-score for opponent's real score)
- UI components, ranking display, calendar, profiles

### What changes for multiplayer:
| Current (Single Player) | Future (Multiplayer) |
|------------------------|----------------------|
| `gameStore` in Zustand (memory) | Supabase PostgreSQL tables |
| NPC auto-scores in PowerBar | Opponent's real PowerBar results via WebSocket |
| Parallel sim runs locally | Server-side tournament runner (cron jobs) |
| LocalStorage persistence | Supabase Auth + Row Level Security |
| `bracketRunner.ts` resolves instantly | Server resolves when both players submit strikes |

### Key design principle:
**All game logic lives in `engine/` files that take data in and return data out.** They don't touch React, don't touch the DOM, don't touch storage. This means:
- `bracketRunner.ts` works identically on client or server
- `rankingEngine.ts` can run as a Supabase Edge Function
- `parallelSim.ts` becomes a server cron job
- `formulas.ts` is shared between client and server

### Database schema (for future):
```sql
-- Players (real users replace NPCs)
players (id, name, emoji, skill, pot, sp, ap, tr_r, tr_p, tr_f, tr_s, tr_g, ...)

-- Tournaments
tournaments (id, season_id, tier, calendar_slot, status, bracket_json)

-- Matches (each strike recorded)
matches (id, tournament_id, round, player1_id, player2_id, 
         p1_strikes, p2_strikes, winner_id)

-- Seasons
seasons (id, number, calendar_json, created_at)

-- Rankings (materialized view, refreshed after each tournament)
rankings (player_id, season_id, sp, rank, peak_rank)
```

---

## UX Requirements — ESPN/ATP Tour Style

### Visual Identity
The app should look and feel like a **premium sports app** — think ATP Tour official app, ESPN, or The Score. NOT a dark gaming aesthetic. Clean, confident, data-rich.

- **Color Palette:**
  - Background: `#ffffff` (light) with `#f8fafc` cards — NOT dark theme
  - Primary: `#1e40af` (deep blue, like ATP branding)
  - Accent: `#f59e0b` (gold for champions, achievements)
  - Success: `#16a34a` / Error: `#dc2626`
  - Tier colors: FUT `#6b7280`, CHL `#22c55e`, 250 `#0ea5e9`, 500 `#8b5cf6`, MST `#ec4899`, GS `#f59e0b`
  - Text: `#0f172a` primary, `#64748b` secondary, `#94a3b8` tertiary
- **Typography:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`) — clean, not decorative. Bold headings, regular body. Tabular numbers for stats.
- **Spacing:** Generous padding (16-24px), clear card separation, breathing room
- **Cards:** White cards with subtle `shadow-sm` on light gray backgrounds. Rounded corners (12px). No borders — use elevation/shadow instead.
- **Icons:** Use `lucide-react` for all icons (Trophy, Swords, TrendingUp, User, Calendar, etc.) — NOT emoji in the UI chrome (emoji ok for NPC identities)

### Additional Dependencies
Add to tech stack:
- **Framer Motion** — page transitions, combat animations, ranking animations
- **Howler.js** — sound effects (strike hit, miss, victory, defeat)
- **Recharts** — ranking history charts in dashboard
- **lucide-react** — clean icon system

---

### Mobile-First Layout
- Design for 375px width first, scale up to desktop
- Bottom tab navigation (not buttons in content): **Play** | **Rankings** | **Profile** | **More**
- Swipe between tabs on mobile (Framer Motion gesture)
- Tap targets minimum 44px height
- No tiny 8-9px text — minimum 12px for readable content, 10px only for tertiary labels
- Pull-to-refresh on rankings

---

### Hub / Play Screen (Home Tab)

**Top Section — Player Card:**
A prominent card showing your identity and key stats at a glance.
```
┌─────────────────────────────────────┐
│  [Avatar]  PlayerName               │
│            Rank #847 ↑12            │
│            Season 1 • Week 5/20     │
│                                     │
│  Season Pts    Money     Titles     │
│    1,250      $12.5K      2        │
└─────────────────────────────────────┘
```
- Avatar: circular, chosen during registration (selection of 30 warrior icons)
- Rank shows movement arrow (↑12 green, ↓5 red, — gray since last week)
- Stats in a 3-column row below

**Middle Section — Next Event Card:**
```
┌─────────────────────────────────────┐
│  WEEK 2.3 — Choose Tournament       │
│  ──────────────────────────────     │
│  Defending: 50 pts from last season │
│                                     │
│  [ ▶ PLAY TOURNAMENT ]              │
└─────────────────────────────────────┘
```
Or for Grand Slam:
```
┌─ GRAND SLAM 2 ──────────────────────┐
│  👑 64 players • 6 rounds • 16K pts │
│  You: Rank #45 — QUALIFIED           │
│                                      │
│  [ ▶ ENTER GRAND SLAM ]             │
└──────────────────────────────────────┘
```
- Single primary action button, large (56px tall), full-width
- GS card has gold gradient border

**Bottom Section — Season Dashboard:**
- **Season Progress:** Horizontal bar (not dots) showing % complete with GS markers
- **Ranking History Chart:** Small sparkline (Recharts AreaChart) showing rank over the last 10 events. Green when improving, red when declining.
- **Last Week Summary:** Compact horizontal scroll of parallel tier results as small cards

**Training Access:** Floating action button (bottom-right corner) with TP badge count: `🏋️ 45`

---

### Rankings Tab

ESPN-style leaderboard with rich data per row:

```
SEASON RANKINGS                    ▾ Filter
─────────────────────────────────────────
 1  ↑2  🔥 Kai the Swift      4,850 pts
        Elite • ⚡12 💪8 🎯10     $285K
─────────────────────────────────────────
 2  ↓1  🐉 Nova the Flame     4,720 pts
        Strong • ⚡9 💪11 🎯7     $262K
─────────────────────────────────────────
 3  —   🗡️ Riven the Bold     4,510 pts
        ...
─────────────────────────────────────────
         ··· 844 more ···
─────────────────────────────────────────
847  ↑12 ⭐ YOU (PlayerName)     135 pts
        ⚡2 💪1 🎯3               $3.2K
848      🛡️ Jade the Warden     132 pts
─────────────────────────────────────────
```

- Rank movement arrows (animated with Framer Motion: green slide up, red slide down)
- Top 3 have gold/silver/bronze accent
- Player's row always highlighted with brand color
- Tap any row → full profile modal
- Toggle: Season / All-Time rankings
- Search bar at top to find specific NPCs

---

### Player Profile (Full Screen Modal or Sheet)

Rich profile page inspired by ATP player profiles:

**Header:**
```
┌─────────────────────────────────────┐
│  [Large Avatar]                     │
│  Kai the Swift 🔥                   │
│  Rank #1 (Peak: #1)                │
│  "Elite" talent                     │
└─────────────────────────────────────┘
```

**Stats Grid (2×3):**
| Season Pts | All-Time Pts |
| Season Prize $ | Career Prize $ |
| Titles (🏆 12) | GS Titles (👑 3) |

**Natural Talent Bar:**
```
Talent ████████████████░░░░ 78 → 91 potential
       Developing  Average  Strong  [Elite]
```
Gradient bar showing current skill with potential ceiling marker. Label the tier.

**Training Levels (horizontal bars):**
```
⚡ Reflexes  ████████████░░░░░░░░  12/20
💪 Power     ██████████░░░░░░░░░░  10/20
🎯 Focus     ██████████████░░░░░░  14/20
🫀 Stamina   ████████░░░░░░░░░░░░   8/20
🛡️ Grit      ██████░░░░░░░░░░░░░░   6/20
```

**Career Timeline (NEW):**
Vertical timeline showing major career events:
```
📅 Season 3, Week 12
   🏆 Won Challenger — Earned 500 pts, $10K

📅 Season 2, Week 20
   👑 Grand Slam 4 — Quarterfinals (2000 pts, $60K)

📅 Season 2, Week 8
   📈 Reached career-high rank #45

📅 Season 1, Week 1
   🌱 Career started
```
Store key events: titles won, GS results, peak rank moments, tier promotions.

**Head-to-Head (NEW — for NPCs you've played against):**
```
VS Kai the Swift          3 meetings
   W  Futures R2          You 78 — 65
   L  Challenger QF       You 71 — 82
   W  Tour 250 SF         You 85 — 79
```
Store match history per opponent. Show last 5 encounters.

**Achievements grid:**
```
🏆 12 Titles | 👑 3 GS | ⭐ 2 Finals | 💰 $1.2M career
```

---

### Combat Screen

**Pre-match card (opponent scouting):**
Clean card with opponent photo/avatar, name, rank, talent tier, and the training comparison. Show difficulty level prominently.

**The Power Bar — BIGGER and more satisfying:**
- Bar width: 100% of screen width (with padding)
- Bar height: 48px (was 30px) — easier to see
- Gold zone: glowing animated border
- Cursor: bright white circle with motion trail
- **STRIKE button: huge (64px tall), full-width, red pulsing**

**Strike Feedback (Framer Motion + Howler.js):**
- **Perfect hit (gold zone):** Screen flashes gold, camera shake, "PERFECT" text flies up, satisfying thwack sound
- **Good hit (near zone):** Subtle green pulse, small shake, lighter hit sound
- **Miss:** Screen shakes laterally (miss animation), dull thud sound
- **Each strike score** appears as a large floating number that fades up

**Post-match Result Card:**
```
┌──────────────────────────────────────┐
│           🏆 VICTORY!                │
│                                      │
│  Strike 1    92  vs  67    ✓         │
│  Strike 2    78  vs  71    ✓         │
│  Strike 3    55  vs  68    ✗         │
│  ─────────────────────────           │
│  Average     75  vs  69    WIN       │
│                                      │
│  "Solid win by 6 points.            │
│   Consistent timing made             │
│   the difference."                   │
│                                      │
│  [ → NEXT MATCH ]                    │
└──────────────────────────────────────┘
```
- Large card, centered, with celebration animation (confetti for tournament wins)
- Strike rows have color-coded backgrounds
- Manual continue button — NEVER auto-advance

---

### Tournament Bracket View (NEW)

Visual bracket tree showing the full draw:

```
FUTURES — Round of 32
                                    
 You ────┐                          
         ├── You ────┐              
 #892 ───┘           │              
                     ├── ? ───┐     
 #801 ───┐           │        │     
         ├── #801 ───┘        │     
 #945 ───┘                    ├── WINNER
                              │     
 #876 ───┐                    │     
         ├── #834 ───┐        │     
 #834 ───┘           │        │     
                     ├── ? ───┘     
 #910 ───┐           │             
         ├── #910 ───┘             
 #967 ───┘                          
```

- Horizontal scrollable bracket
- Your path highlighted in brand color
- Completed matches show scores
- Current match pulses
- Tap any match to see result details
- Shows full bracket including NPC matches already resolved

---

### Dashboard Hub — Stats Cards & Charts (NEW)

Below the Next Event card on the Play tab:

**Ranking Trend Chart (Recharts):**
Small area chart, last 20 events, showing rank over time. Green fill when improving.

**Season Summary Cards (horizontal scroll):**
```
[Tournaments: 8] [Best Result: CHL QF] [Win Rate: 45%] [Earnings: $12K]
```

**Career Milestones:**
```
✓ First tournament win
✓ Reached top 500
○ Win a Challenger title
○ Qualify for Grand Slam
○ Reach top 100
○ Win Season Finals
```
Progress tracker showing achieved/upcoming milestones.

---

### Calendar View

Keep the 4×5 grid but style as proper calendar cards:
```
BLOCK 1
┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌──────┐
│Wk1 │ │Wk2 │ │Wk3 │ │Wk4 │ │ 👑   │
│FUT │ │FUT │ │CHL │ │    │ │ GS 1 │
│+50 │ │+25 │ │+120│ │ ▶  │ │      │
│ ↑  │ │ ↓  │ │ ↑  │ │    │ │      │
└────┘ └────┘ └────┘ └────┘ └──────┘
```
- Each cell shows tier badge, points earned, net change arrow
- Current week has blue highlight/border
- GS cells are wider with gold accent
- Cells are tappable to see that week's full results

---

### Training Screen

Clean card-based layout:

```
TRAINING CAMP                    45 TP available

┌─────────────────────────────────────┐
│ ⚡ Reflexes               Level 5   │
│ ████████████░░░░░░░░░░░░░░░░ 5/20  │
│ Slows bar speed vs opponent         │
│                          [90 TP ▶]  │
└─────────────────────────────────────┘
```
- Large cards per stat
- Clear cost shown on button
- Progress bar prominent
- "All stats are RELATIVE" banner at top
- When fully maxed: achievement celebration + explanation

---

### Help / Tutorial

First-time tutorial overlay (triggered on first tournament):
- Step-by-step walkthrough with highlighted UI elements
- "Try a practice strike" interactive tutorial
- Can be re-accessed from More tab

---

### Sound Design (Howler.js)

| Event | Sound |
|-------|-------|
| Strike — gold zone | Satisfying sharp "thwack" + crowd cheer |
| Strike — near miss | Lighter "tap" |
| Strike — bad miss | Dull "thud" |
| Match won | Victory fanfare (short, 1-2 sec) |
| Match lost | Low defeat tone |
| Tournament title won | Extended celebration + crowd |
| Rank up notification | Positive chime |
| GS qualification | Special fanfare |
| Button tap | Subtle click |

Provide audio files as small MP3s (< 50KB each). Include a mute toggle in settings.

---

### Animations (Framer Motion)

| Element | Animation |
|---------|-----------|
| Screen transitions | Slide left/right (250ms ease-out) |
| Strike hit/miss | Scale pulse + shake |
| Ranking changes | Row slides up/down with number counter |
| Tournament bracket | Matches reveal sequentially |
| Result card | Slides up from bottom, strikes count up |
| Gold zone on bar | Gentle pulse glow |
| Confetti on title win | Particle burst from top |
| Rank movement arrows | Fade in + slide |

---

### Deployment & Leaderboard

**Global Leaderboard (Supabase):**
Single table `achievements`:
```sql
achievements (
  id uuid primary key,
  user_id uuid references auth.users,
  player_name text,
  avatar text,
  seasons_played int,
  best_rank int,
  best_season_pts int,
  career_money bigint,
  gs_titles int,
  total_titles int,
  finals_wins int,
  updated_at timestamp
)
```

**Sync flow:**
- After each season ends (or manually via "Sync" button in More tab)
- Game posts player's best stats to Supabase
- Leaderboard page shows all synced players sorted by best_rank, career_money, etc.
- Multiple sort options: by rank, by money, by titles

**Leaderboard UI:** Same ESPN-style table as NPC rankings, but showing real players globally.

---

## Reference Implementation
The current working prototype is in `arena-game.jsx` (85KB single-file React component). Use it as the source of truth for all game logic, but rebuild with proper architecture. Every formula, constant, and mechanic described above is already implemented and balanced in that file.
