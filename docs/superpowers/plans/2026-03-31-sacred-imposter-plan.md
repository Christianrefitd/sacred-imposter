# Sacred Imposter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first web game for running recovery-themed social deduction rounds at a men's treatment center — single phone, passed around the group.

**Architecture:** Next.js App Router SPA with all game logic client-side. Game state managed via React useReducer. localStorage for persisting word bank and player names between sessions. Serwist for PWA offline support.

**Tech Stack:** Next.js (latest stable), React, TypeScript, Tailwind CSS, shadcn/ui, Serwist (PWA)

**Spec:** `docs/superpowers/specs/2026-03-31-sacred-imposter-design.md`

---

## File Structure

```
sacred-imposter/
├── app/
│   ├── layout.tsx              # Root layout: dark theme, fonts, PWA wrapper
│   ├── page.tsx                # Home screen (player list + start game)
│   ├── manifest.ts             # PWA manifest
│   ├── sw.ts                   # Serwist service worker
│   ├── serwist.ts              # Client-side SerwistProvider export
│   ├── globals.css             # Tailwind + global styles
│   ├── ~offline/
│   │   └── page.tsx            # Offline fallback page
│   ├── settings/
│   │   └── page.tsx            # Word bank management
│   └── imposter/
│       └── page.tsx            # Full game flow (all game screens)
├── components/
│   ├── ui/                     # shadcn components (auto-generated)
│   └── game/
│       ├── player-setup.tsx    # Player name list + add/remove
│       ├── card-reveal.tsx     # Per-player word reveal cycle
│       ├── discussion.tsx      # Random starter + instructions
│       ├── reveal.tsx          # Imposter reveal + caught/escaped
│       └── question-draw.tsx   # Vulnerability question + re-draw + player pick
├── lib/
│   ├── game-reducer.ts         # useReducer: game state machine
│   ├── storage.ts              # localStorage helpers (word bank, player names)
│   ├── words.ts                # Default word bank
│   └── questions.ts            # Hardcoded vulnerability questions
├── next.config.ts              # Next.js config with Serwist wrapper
├── public/
│   ├── icon-192x192.png        # PWA icon
│   └── icon-512x512.png        # PWA icon
└── docs/
    └── superpowers/
        ├── specs/              # Design spec
        └── plans/              # This plan
```

**Responsibility breakdown:**
- `lib/game-reducer.ts` — Pure state machine. All game logic lives here: phase transitions, imposter assignment, word selection, session tracking (used words/questions). No UI.
- `lib/storage.ts` — Read/write localStorage for word bank and player names. Handles defaults on first load or after clear.
- `lib/words.ts` — Exports the default word array. Single source of truth for defaults.
- `lib/questions.ts` — Exports the hardcoded vulnerability questions array.
- `app/imposter/page.tsx` — Orchestrator. Calls useReducer, renders the right game component based on current phase.
- `components/game/*.tsx` — Pure presentational components. Each receives state + dispatch, renders one phase of the game.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `app/layout.tsx`, `app/page.tsx`, `app/globals.css`, `next.config.ts`
- Modify: `package.json`, `.gitignore`, `tailwind.config.ts`

- [ ] **Step 1: Initialize Next.js project**

Since we're already in the `sacred-imposter` directory with existing files (docs, .git), we need to create the Next.js project in a temp location and move files in:

```bash
cd /tmp && npx create-next-app@latest sacred-imposter-init --yes --app --tailwind --typescript --eslint --turbopack --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Move scaffolded files into project**

```bash
# Move everything except .git and docs from the temp project
cp -r /tmp/sacred-imposter-init/* /Users/christianreed/sacred-imposter/
cp /tmp/sacred-imposter-init/.eslintrc.json /Users/christianreed/sacred-imposter/ 2>/dev/null || true
cp /tmp/sacred-imposter-init/.gitignore /Users/christianreed/sacred-imposter/.gitignore.new
# Merge .gitignore (keep our existing entries, add Next.js entries)
cat /Users/christianreed/sacred-imposter/.gitignore.new >> /Users/christianreed/sacred-imposter/.gitignore
rm /Users/christianreed/sacred-imposter/.gitignore.new
rm -rf /tmp/sacred-imposter-init
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd /Users/christianreed/sacred-imposter
npx shadcn@latest init -d
```

- [ ] **Step 4: Add shadcn components**

```bash
npx shadcn@latest add button input dialog sheet card
```

- [ ] **Step 5: Verify it runs**

```bash
npm run dev
```

Open http://localhost:3000 — confirm the default Next.js page loads.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "scaffold: Next.js + Tailwind + shadcn/ui project"
```

---

### Task 2: Dark Theme + Layout Shell

**Files:**
- Modify: `app/layout.tsx`, `app/globals.css`
- Modify: `app/page.tsx` (replace default content)

- [ ] **Step 1: Set up dark theme globals**

Replace `app/globals.css` with Tailwind base + dark theme CSS variables. The theme should use:
- Background: near-black (#09090b)
- Card/surface: dark gray (#1a1a1a)
- Border: (#333)
- Primary: purple (#7c3aed)
- Destructive: red (#dc2626)
- Text: white/light gray

- [ ] **Step 2: Update root layout**

Update `app/layout.tsx`:
- Set `<html>` to `dark` class and `lang="en"`
- Add viewport meta for mobile (no zoom on input focus)
- Set page title "Sacred Imposter"
- Apply dark background and text color to body
- Set `className="dark"` on html element

- [ ] **Step 3: Create placeholder home page**

Replace `app/page.tsx` with a centered "SACRED IMPOSTER" title and placeholder buttons to verify the dark theme works.

- [ ] **Step 4: Verify dark theme**

```bash
npm run dev
```

Open http://localhost:3000 — confirm dark background, light text, styled correctly on mobile viewport.

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/globals.css app/page.tsx
git commit -m "feat: dark theme and layout shell"
```

---

### Task 3: Data Layer — Words, Questions, Storage

**Files:**
- Create: `lib/words.ts`
- Create: `lib/questions.ts`
- Create: `lib/storage.ts`

- [ ] **Step 1: Create default word bank**

Create `lib/words.ts` — export a `DEFAULT_WORDS: string[]` array with ~35 recovery-themed words:

```typescript
export const DEFAULT_WORDS: string[] = [
  "sobriety", "community", "surrender", "relapse", "gratitude",
  "sponsor", "amends", "honesty", "courage", "acceptance",
  "fellowship", "serenity", "powerless", "willingness", "humility",
  "accountability", "forgiveness", "triggers", "boundaries", "mindfulness",
  "meditation", "prayer", "service", "hope", "faith",
  "trust", "healing", "growth", "progress", "freedom",
  "purpose", "recovery", "hangover", "sober", "God",
];
```

- [ ] **Step 2: Create vulnerability questions**

Create `lib/questions.ts` — export a `VULNERABILITY_QUESTIONS: string[]` array with placeholder recovery questions:

```typescript
export const VULNERABILITY_QUESTIONS: string[] = [
  "What's one thing you're afraid to face in your recovery?",
  "Who have you hurt the most, and what would you say to them right now?",
  "What's a lie you've told yourself to justify using?",
  "What's the hardest thing about being honest with yourself?",
  "If you could redo one moment in your life, what would it be?",
  "What are you most grateful for today that you didn't have a year ago?",
  "What's one thing you haven't forgiven yourself for?",
  "What does surrender mean to you personally?",
  "What's your biggest fear about staying sober?",
  "Who do you need to make amends to, and what's stopping you?",
  "What was your rock bottom moment?",
  "What's one thing people here don't know about you?",
  "What does community mean to you now versus before treatment?",
  "What's the most courageous thing you've done in recovery?",
  "What would your life look like in five years if you stay on this path?",
  "What emotion is hardest for you to sit with?",
  "What's one boundary you need to set but haven't?",
  "How has your relationship with yourself changed in recovery?",
  "What's a coping mechanism you're still working on letting go of?",
  "What would you tell someone who's where you were six months ago?",
];
```

- [ ] **Step 3: Create localStorage helpers**

Create `lib/storage.ts`:

```typescript
import { DEFAULT_WORDS } from "./words";

const STORAGE_KEYS = {
  WORDS: "sacred-imposter-words",
  PLAYERS: "sacred-imposter-players",
} as const;

export function getWords(): string[] {
  if (typeof window === "undefined") return DEFAULT_WORDS;
  const stored = localStorage.getItem(STORAGE_KEYS.WORDS);
  if (!stored) return DEFAULT_WORDS;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_WORDS;
  } catch {
    return DEFAULT_WORDS;
  }
}

export function saveWords(words: string[]): void {
  localStorage.setItem(STORAGE_KEYS.WORDS, JSON.stringify(words));
}

export function resetWords(): void {
  localStorage.removeItem(STORAGE_KEYS.WORDS);
}

export function getPlayers(): string[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEYS.PLAYERS);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlayers(players: string[]): void {
  localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: data layer — word bank, questions, localStorage helpers"
```

---

### Task 4: Game State Machine (Reducer)

**Files:**
- Create: `lib/game-reducer.ts`

This is the core logic of the app. The reducer manages all game phases and transitions.

- [ ] **Step 1: Define types**

```typescript
export type GamePhase =
  | "setup"
  | "card-reveal"
  | "word-shown"
  | "discussion"
  | "reveal"
  | "caught"
  | "escaped"
  | "pick-player";

export interface GameState {
  phase: GamePhase;
  players: string[];
  word: string;
  imposterIndex: number;
  currentPlayerIndex: number;
  starterName: string;
  drawnQuestion: string;
  reDrawUsed: boolean;
  usedWordIndices: number[];
  usedQuestionIndices: number[];
}

export type GameAction =
  | { type: "START_GAME"; players: string[]; words: string[] }
  | { type: "REVEAL_WORD" }
  | { type: "NEXT_PLAYER" }
  | { type: "START_DISCUSSION" }
  | { type: "SHOW_REVEAL" }
  | { type: "CAUGHT" }
  | { type: "ESCAPED" }
  | { type: "DRAW_QUESTION" }
  | { type: "PICK_PLAYER" }
  | { type: "NEW_ROUND"; words: string[] }
  | { type: "CANCEL_GAME" };
```

- [ ] **Step 2: Implement the reducer**

Implement `gameReducer(state: GameState, action: GameAction): GameState` with the full state machine:

- `START_GAME` — Pick a random word (avoiding `usedWordIndices`), pick a random imposter, set phase to `card-reveal`, `currentPlayerIndex` to 0.
- `REVEAL_WORD` — Transition from `card-reveal` to `word-shown` (shows the word or imposter message).
- `NEXT_PLAYER` — Increment `currentPlayerIndex`, set phase back to `card-reveal`. This action is ONLY dispatched for non-last players. The last player dispatches `START_DISCUSSION` instead (see Card Reveal component, Task 7).
- `START_DISCUSSION` — Pick a random non-imposter as `starterName`, set phase to `discussion`.
- `SHOW_REVEAL` — Set phase to `reveal`.
- `CAUGHT` — Draw a random question (avoiding `usedQuestionIndices`), set phase to `caught`, `reDrawUsed` to false.
- `ESCAPED` — Draw a random question, set phase to `escaped`, `reDrawUsed` to false.
- `DRAW_QUESTION` — Re-draw a new question, set `reDrawUsed` to true.
- `PICK_PLAYER` — Set phase to `pick-player`.
- `NEW_ROUND` — Keep `players`, `usedWordIndices`, `usedQuestionIndices`, reset `currentPlayerIndex` to 0, pick new word (avoiding used), pick new imposter, set phase to `card-reveal`. The `words` param must be the same array captured at game start (passed from the orchestrator's ref), NOT re-read from localStorage.
- `CANCEL_GAME` — Reset to `setup` phase.

Helper: `pickRandom(length: number, exclude: number[]): { index: number; updatedExclude: number[] }` — picks a random index not in the exclusion list. Returns both the picked index AND the updated exclusion list. If all indices are excluded, the returned `updatedExclude` is reset to `[pickedIndex]` (i.e., clears the list and starts fresh). The caller MUST use the returned `updatedExclude` to update state — this ensures the reset is persisted in `GameState`.

- [ ] **Step 3: Export initial state factory**

```typescript
export function createInitialState(): GameState {
  return {
    phase: "setup",
    players: [],
    word: "",
    imposterIndex: -1,
    currentPlayerIndex: 0,
    starterName: "",
    drawnQuestion: "",
    reDrawUsed: false,
    usedWordIndices: [],
    usedQuestionIndices: [],
  };
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/game-reducer.ts
git commit -m "feat: game state machine reducer"
```

---

### Task 5: Home Screen — Player Setup

**Files:**
- Modify: `app/page.tsx`
- Create: `components/game/player-setup.tsx`

- [ ] **Step 1: Build PlayerSetup component**

Create `components/game/player-setup.tsx`:
- Text input + "Add" button to add player names
- List of player names with X button to remove each
- Inline validation: reject empty names, reject duplicates (case-insensitive), show error message
- Minimum 3 players to enable Start Game button — show disabled state with helper text ("Need at least 3 players")
- Also disable Start Game if word bank is empty
- Settings gear icon button in top-right linking to `/settings`
- "Start Game" button at bottom — navigates to `/imposter` with player list

Component receives: `players: string[]`, `onPlayersChange: (players: string[]) => void`, `wordCount: number`

- [ ] **Step 2: Wire up home page**

Update `app/page.tsx`:
- `"use client"` directive
- Load players from localStorage on mount via `getPlayers()`
- Load word count via `getWords().length`
- Save players to localStorage on every change via `savePlayers()`
- Render `<PlayerSetup>` with players, onPlayersChange, wordCount
- On "Start Game", save players to localStorage and navigate to `/imposter` using `useRouter().push("/imposter")`

- [ ] **Step 3: Verify**

```bash
npm run dev
```

Open on mobile viewport — add/remove names, verify persistence across page reload, verify Start Game disabled with fewer than 3 players.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/game/player-setup.tsx
git commit -m "feat: home screen with player setup"
```

---

### Task 6: Game Page Orchestrator

**Files:**
- Create: `app/imposter/page.tsx`

- [ ] **Step 1: Build game page**

Create `app/imposter/page.tsx`:
- `"use client"` directive
- Load players from localStorage on mount. If no players, redirect to `/`.
- Load words from `getWords()` once on mount and store in a `useRef` — this same array is reused for all `NEW_ROUND` dispatches throughout the session. Do NOT re-read from localStorage between rounds.
- Initialize `useReducer(gameReducer, createInitialState())`
- On mount, dispatch `START_GAME` with players and the words ref
- Render the correct game component based on `state.phase`:
  - `"card-reveal"` / `"word-shown"` → `<CardReveal />`
  - `"discussion"` → `<Discussion />`
  - `"reveal"` → `<Reveal />`
  - `"caught"` → `<QuestionDraw />` (caught mode)
  - `"escaped"` / `"pick-player"` → `<QuestionDraw />` (escaped mode)

Each component receives `state`, `dispatch`, and `words` (the ref array from the orchestrator — needed by QuestionDraw to dispatch `NEW_ROUND`).

- [ ] **Step 2: Create placeholder components**

Create minimal placeholder files for each game component that just render their phase name:
- `components/game/card-reveal.tsx`
- `components/game/discussion.tsx`
- `components/game/reveal.tsx`
- `components/game/question-draw.tsx`

- [ ] **Step 3: Verify navigation**

Start the app, add 3+ players, tap Start Game — should navigate to `/imposter` and show the "card-reveal" placeholder.

- [ ] **Step 4: Commit**

```bash
git add app/imposter/ components/game/
git commit -m "feat: game page orchestrator with phase routing"
```

---

### Task 7: Card Reveal Component

**Files:**
- Modify: `components/game/card-reveal.tsx`

- [ ] **Step 1: Implement card reveal**

Two states based on `phase`:

**`card-reveal` (pass prompt):**
- Shows "Player X of Y" counter
- Shows player name large and centered
- "Hand the phone to [Name]"
- "Tap to Reveal Word" button → dispatches `REVEAL_WORD`
- Small "Cancel Game" button in top corner → dispatches `CANCEL_GAME`, navigates to `/`

**`word-shown` (word visible):**
- If current player is NOT the imposter:
  - "Your word is:" label
  - Word displayed large in purple (#7c3aed)
  - "Remember it. Don't say it out loud."
- If current player IS the imposter:
  - Red theme (#dc2626)
  - "YOU ARE THE IMPOSTER" large
  - "Listen carefully. Blend in."
- If this is NOT the last player: "Pass to Next Person" button → dispatches `NEXT_PLAYER`
- If this IS the last player: button text is "Everyone's Ready" → dispatches `START_DISCUSSION` (NOT `NEXT_PLAYER` — the component checks `currentPlayerIndex === players.length - 1` to decide which action to dispatch)

- [ ] **Step 2: Verify the full reveal cycle**

Test with 4 players. Cycle through all cards. Confirm one player sees the imposter screen, others see the word. Confirm last player's button says "Everyone's Ready."

- [ ] **Step 3: Commit**

```bash
git add components/game/card-reveal.tsx
git commit -m "feat: card reveal component with imposter detection"
```

---

### Task 8: Discussion Component

**Files:**
- Modify: `components/game/discussion.tsx`

- [ ] **Step 1: Implement discussion screen**

- "Everyone has seen their card" subtext
- "Starting player:" label
- `state.starterName` displayed large and bold
- Instructions: "Go around the circle. Say one word related to your word. Two rounds. Then vote."
- "Done — Reveal Imposter" button → dispatches `SHOW_REVEAL`

- [ ] **Step 2: Verify**

Play through to discussion screen — confirm a random non-imposter name is shown.

- [ ] **Step 3: Commit**

```bash
git add components/game/discussion.tsx
git commit -m "feat: discussion screen with random starter"
```

---

### Task 9: Reveal Component

**Files:**
- Modify: `components/game/reveal.tsx`

- [ ] **Step 1: Implement reveal screen**

- Initially shows a "Tap to Reveal the Imposter" button (builds suspense)
- On tap, reveals:
  - "The imposter was..." label
  - Imposter's name in large red text
  - "The word was: [WORD]" in purple
- Two action buttons appear:
  - "Caught!" (purple) → dispatches `CAUGHT`
  - "Escaped!" (red/outline) → dispatches `ESCAPED`

- [ ] **Step 2: Verify**

Play a full round through to reveal. Confirm imposter name and word are correct.

- [ ] **Step 3: Commit**

```bash
git add components/game/reveal.tsx
git commit -m "feat: imposter reveal screen"
```

---

### Task 10: Question Draw Component

**Files:**
- Modify: `components/game/question-draw.tsx`

- [ ] **Step 1: Implement caught flow**

When `state.phase === "caught"`:
- "[Imposter Name] was caught!"
- Display drawn question in a styled card
- "Draw Again" button (enabled if `!state.reDrawUsed`, disabled otherwise) → dispatches `DRAW_QUESTION`
- "New Round" button → dispatches `NEW_ROUND` with current words

- [ ] **Step 2: Implement escaped flow**

When `state.phase === "escaped"`:
- "[Imposter Name] escaped!"
- "Hand the phone to [Imposter Name]" instruction text
- Display drawn question in a styled card
- "Draw Again" button (same re-draw logic)
- "Choose who answers" label
- Button or text prompting to pick → dispatches `PICK_PLAYER`

When `state.phase === "pick-player"`:
- Show the question at top
- List all players EXCEPT the imposter as tappable buttons
- Tapping a name shows "[Name] must answer:" with the question
- "New Round" button → dispatches `NEW_ROUND`

- [ ] **Step 3: Verify both flows**

Play two full rounds — one where you tap Caught, one where you tap Escaped. Verify:
- Question appears
- Draw Again works once then disables
- Escaped flow shows player picker
- New Round starts fresh with a new word

- [ ] **Step 4: Commit**

```bash
git add components/game/question-draw.tsx
git commit -m "feat: vulnerability question draw with caught/escaped flows"
```

---

### Task 11: Settings — Word Bank Management

**Files:**
- Create: `app/settings/page.tsx`

- [ ] **Step 1: Build settings page**

Create `app/settings/page.tsx`:
- `"use client"` directive
- Back button/link to `/` at top
- "Word Bank" heading
- List of all words with X button to delete each
- Cannot delete last word — disable the X or show warning
- Text input + "Add" button to add new words
- Reject duplicates (case-insensitive)
- "Reset to Defaults" button at bottom (with confirmation dialog using shadcn Dialog)
- All changes save to localStorage immediately via `saveWords()`

- [ ] **Step 2: Verify**

Add words, delete words, reset to defaults, navigate away and back — confirm persistence.

- [ ] **Step 3: Commit**

```bash
git add app/settings/
git commit -m "feat: settings page with word bank management"
```

---

### Task 12: PWA Setup

**Files:**
- Create: `app/sw.ts`, `app/serwist.ts`, `app/manifest.ts`, `app/~offline/page.tsx`
- Modify: `app/layout.tsx`, `next.config.ts`, `.gitignore`
- Create: `public/icon-192x192.png`, `public/icon-512x512.png`

- [ ] **Step 1: Install Serwist**

```bash
npm i @serwist/next && npm i -D serwist
```

- [ ] **Step 2: Create service worker**

Create `app/sw.ts` with Serwist config — precache all routes, skip waiting, claim clients, offline fallback to `/~offline`.

- [ ] **Step 3: Create manifest**

Create `app/manifest.ts` — app name "Sacred Imposter", standalone display, dark theme color (#09090b), icons.

- [ ] **Step 4: Create offline page**

Create `app/~offline/page.tsx` — simple dark-themed "You're offline" message.

- [ ] **Step 5: Create SerwistProvider wrapper**

Create `app/serwist.ts` — client-side re-export of SerwistProvider.

- [ ] **Step 6: Update layout**

Wrap `app/layout.tsx` children in `<SerwistProvider>`. Add PWA metadata (appleWebApp, applicationName, etc.).

- [ ] **Step 7: Update next.config.ts**

Wrap existing config with `withSerwist` from `@serwist/next`.

- [ ] **Step 8: Generate PWA icons**

Create simple placeholder icons (192x192 and 512x512 PNGs) in `public/`. Can be replaced with proper branded icons later.

- [ ] **Step 9: Update .gitignore**

Add `public/sw.js` and `public/sw.js.map` to `.gitignore`.

- [ ] **Step 10: Verify PWA**

```bash
npm run build && npm start
```

Open in Chrome, check Application tab in DevTools — confirm manifest loads, service worker registers, app is installable.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: PWA setup with Serwist for offline support"
```

---

### Task 13: Polish & Mobile Optimization

**Files:**
- Modify: various component files

- [ ] **Step 1: Tap target sizing**

Review all buttons and interactive elements. Ensure minimum 44x44px tap targets per Apple HIG. Add appropriate padding to any undersized elements.

- [ ] **Step 2: Viewport and input handling**

Ensure no zoom on input focus (font-size >= 16px on all inputs). Test the player name input and word bank input on mobile viewport.

- [ ] **Step 3: Transitions**

Add subtle fade/slide transitions between game phases for polish. Keep them fast (150-200ms) so they don't slow down the pass-around flow.

- [ ] **Step 4: Full playtest**

Run through 3 complete rounds on a mobile viewport (Chrome DevTools device mode):
- Add 5 players
- Play round 1 — caught flow
- Play round 2 — escaped flow
- Play round 3 — verify word doesn't repeat
- Check settings — add/remove words
- Verify player names persist after reload

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "polish: mobile optimization and transitions"
```

---

### Task 14: Deploy

**Files:**
- No new files (Vercel auto-detects Next.js)

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create sacred-imposter --public --source=. --push
```

- [ ] **Step 2: Deploy to Vercel**

```bash
npx vercel --yes
```

Or connect the GitHub repo to Vercel dashboard for auto-deploys.

- [ ] **Step 3: Test on actual phone**

Open the Vercel URL on your phone. Add to home screen. Play a test round. Verify offline works (toggle airplane mode after first load).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: deployment adjustments"
```
