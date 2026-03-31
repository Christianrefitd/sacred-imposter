# Lie Detector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Lie Detector as the second game in the Recovery Circle hub, including the hub refactor (shared storage, game menu, expanded settings).

**Architecture:** Refactor the existing single-game app into a multi-game hub. The home page becomes a game selector. Each game owns its own route, setup screen, reducer, and components. Shared infrastructure (player names, vulnerability questions, storage) is extracted to hub-level modules. Lie Detector follows the same patterns as Imposter: useReducer state machine, pass-around component cycle, localStorage persistence.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Vitest

**Spec:** `docs/superpowers/specs/2026-03-31-lie-detector-design.md`

---

## Task 1: Set Up Test Infrastructure

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (add devDependencies + test script)

- [ ] **Step 1: Install vitest**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

- [ ] **Step 2: Create vitest config**

Create `vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
```

- [ ] **Step 3: Add test script to package.json**

Add to `"scripts"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify setup**

Run: `npm test`
Expected: "No test files found" (no error — config works)

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts package.json package-lock.json
git commit -m "chore: add vitest test infrastructure"
```

---

## Task 2: Refactor Shared Storage

Migrate localStorage keys from Imposter-specific to hub-wide `rc-` prefix. Add vulnerability question persistence. Existing Imposter functionality must not break.

**Files:**
- Modify: `lib/storage.ts`
- Modify: `lib/questions.ts` (export DEFAULT array for seeding)
- Create: `lib/__tests__/storage.test.ts`

- [ ] **Step 1: Write storage migration tests**

Create `lib/__tests__/storage.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";

// We'll test the storage module after refactoring.
// Mock localStorage for Node/jsdom:
beforeEach(() => {
  localStorage.clear();
});

describe("storage migration", () => {
  it("migrates old player key to new key on first read", async () => {
    localStorage.setItem(
      "sacred-imposter-players",
      JSON.stringify(["Alice", "Bob"])
    );
    const { getPlayers } = await import("../storage");
    const players = getPlayers();
    expect(players).toEqual(["Alice", "Bob"]);
    // Old key should be removed after migration
    expect(localStorage.getItem("sacred-imposter-players")).toBeNull();
    // New key should exist
    expect(localStorage.getItem("rc-player-names")).not.toBeNull();
  });

  it("migrates old words key to new key on first read", async () => {
    localStorage.setItem(
      "sacred-imposter-words",
      JSON.stringify(["sobriety", "hope"])
    );
    const { getWords } = await import("../storage");
    const words = getWords();
    expect(words).toEqual(["sobriety", "hope"]);
    expect(localStorage.getItem("sacred-imposter-words")).toBeNull();
    expect(localStorage.getItem("rc-imposter-words")).not.toBeNull();
  });
});

describe("getPlayers / savePlayers", () => {
  it("returns empty array when nothing stored", async () => {
    const { getPlayers } = await import("../storage");
    expect(getPlayers()).toEqual([]);
  });

  it("round-trips player names", async () => {
    const { getPlayers, savePlayers } = await import("../storage");
    savePlayers(["Marcus", "James", "Devon"]);
    expect(getPlayers()).toEqual(["Marcus", "James", "Devon"]);
  });
});

describe("vulnerability questions", () => {
  it("returns defaults when nothing stored", async () => {
    const { getVulnerabilityQuestions } = await import("../storage");
    const questions = getVulnerabilityQuestions();
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0]).toContain("?"); // they're questions
  });

  it("persists custom questions", async () => {
    const { getVulnerabilityQuestions, saveVulnerabilityQuestions } =
      await import("../storage");
    saveVulnerabilityQuestions(["Custom Q1?", "Custom Q2?"]);
    expect(getVulnerabilityQuestions()).toEqual(["Custom Q1?", "Custom Q2?"]);
  });

  it("resets to defaults", async () => {
    const { getVulnerabilityQuestions, saveVulnerabilityQuestions, resetVulnerabilityQuestions } =
      await import("../storage");
    saveVulnerabilityQuestions(["Custom Q?"]);
    resetVulnerabilityQuestions();
    const questions = getVulnerabilityQuestions();
    expect(questions.length).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/storage.test.ts`
Expected: FAIL (new functions don't exist yet)

- [ ] **Step 3: Refactor storage.ts**

Replace `lib/storage.ts` with:

```typescript
import { DEFAULT_WORDS } from "./words";
import { DEFAULT_VULNERABILITY_QUESTIONS } from "./questions";

// ---------------------------------------------------------------------------
// Keys
// ---------------------------------------------------------------------------

const KEYS = {
  PLAYERS: "rc-player-names",
  WORDS: "rc-imposter-words",
  VULNERABILITY_QUESTIONS: "rc-vulnerability-questions",
  LIE_DETECTOR_PROMPTS: "rc-lie-detector-prompts",
} as const;

const OLD_KEYS = {
  PLAYERS: "sacred-imposter-players",
  WORDS: "sacred-imposter-words",
} as const;

// ---------------------------------------------------------------------------
// Migration (runs once per key on first read)
// ---------------------------------------------------------------------------

function migrate(oldKey: string, newKey: string): void {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(newKey) !== null) return; // already migrated
  const old = localStorage.getItem(oldKey);
  if (old !== null) {
    localStorage.setItem(newKey, old);
    localStorage.removeItem(oldKey);
  }
}

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function getArray<T>(key: string, defaults: T[]): T[] {
  if (typeof window === "undefined") return defaults;
  const stored = localStorage.getItem(key);
  if (!stored) return defaults;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaults;
  } catch {
    return defaults;
  }
}

function saveArray<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function resetKey(key: string): void {
  localStorage.removeItem(key);
}

// ---------------------------------------------------------------------------
// Players (shared across all games)
// ---------------------------------------------------------------------------

export function getPlayers(): string[] {
  migrate(OLD_KEYS.PLAYERS, KEYS.PLAYERS);
  return getArray(KEYS.PLAYERS, []);
}

export function savePlayers(players: string[]): void {
  saveArray(KEYS.PLAYERS, players);
}

// ---------------------------------------------------------------------------
// Imposter Word Bank
// ---------------------------------------------------------------------------

export function getWords(): string[] {
  migrate(OLD_KEYS.WORDS, KEYS.WORDS);
  return getArray(KEYS.WORDS, DEFAULT_WORDS);
}

export function saveWords(words: string[]): void {
  saveArray(KEYS.WORDS, words);
}

export function resetWords(): void {
  resetKey(KEYS.WORDS);
}

// ---------------------------------------------------------------------------
// Vulnerability Questions (shared across all games)
// ---------------------------------------------------------------------------

export function getVulnerabilityQuestions(): string[] {
  return getArray(KEYS.VULNERABILITY_QUESTIONS, DEFAULT_VULNERABILITY_QUESTIONS);
}

export function saveVulnerabilityQuestions(questions: string[]): void {
  saveArray(KEYS.VULNERABILITY_QUESTIONS, questions);
}

export function resetVulnerabilityQuestions(): void {
  resetKey(KEYS.VULNERABILITY_QUESTIONS);
}
```

- [ ] **Step 4: Update questions.ts to export defaults**

Rename the export in `lib/questions.ts`:

```typescript
export const DEFAULT_VULNERABILITY_QUESTIONS: string[] = [
  // ... same array contents ...
];

// Keep backward-compatible alias for existing Imposter reducer import
export const VULNERABILITY_QUESTIONS = DEFAULT_VULNERABILITY_QUESTIONS;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/__tests__/storage.test.ts`
Expected: All PASS

- [ ] **Step 6: Update Imposter game page to use refactored storage**

In `app/imposter/page.tsx`, the imports already use `getPlayers` and `getWords` from `@/lib/storage` — these function signatures haven't changed, so no code changes needed. Verify the Imposter game still works:

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 7: Commit**

```bash
git add lib/storage.ts lib/questions.ts lib/__tests__/storage.test.ts
git commit -m "refactor: migrate storage to hub-wide rc- keys with auto-migration"
```

---

## Task 3: Create Prompt Bank Module

Default prompts with categories, localStorage persistence, and selection logic.

**Files:**
- Create: `lib/prompts.ts`
- Create: `lib/__tests__/prompts.test.ts`

- [ ] **Step 1: Write prompt bank tests**

Create `lib/__tests__/prompts.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import {
  DEFAULT_PROMPTS,
  getPrompts,
  savePrompts,
  resetPrompts,
  type Prompt,
  type PromptCategory,
} from "../prompts";

beforeEach(() => {
  localStorage.clear();
});

describe("DEFAULT_PROMPTS", () => {
  it("has prompts in all three categories", () => {
    const categories = new Set(DEFAULT_PROMPTS.map((p) => p.category));
    expect(categories).toContain("self-reflection");
    expect(categories).toContain("accountability");
    expect(categories).toContain("lighter");
  });

  it("has at least 30 prompts", () => {
    expect(DEFAULT_PROMPTS.length).toBeGreaterThanOrEqual(30);
  });
});

describe("getPrompts / savePrompts", () => {
  it("returns defaults when nothing stored", () => {
    expect(getPrompts()).toEqual(DEFAULT_PROMPTS);
  });

  it("round-trips custom prompts", () => {
    const custom: Prompt[] = [
      { text: "Test prompt?", category: "lighter" },
    ];
    savePrompts(custom);
    expect(getPrompts()).toEqual(custom);
  });

  it("resets to defaults", () => {
    savePrompts([{ text: "Custom", category: "lighter" }]);
    resetPrompts();
    expect(getPrompts()).toEqual(DEFAULT_PROMPTS);
  });
});

describe("filtering by category", () => {
  it("can filter prompts by category", () => {
    const prompts = getPrompts();
    const lighter = prompts.filter((p) => p.category === "lighter");
    expect(lighter.length).toBeGreaterThan(0);
    lighter.forEach((p) => expect(p.category).toBe("lighter"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/prompts.test.ts`
Expected: FAIL (module doesn't exist)

- [ ] **Step 3: Create prompts.ts**

Create `lib/prompts.ts`:

```typescript
export type PromptCategory = "self-reflection" | "accountability" | "lighter";

export interface Prompt {
  text: string;
  category: PromptCategory;
}

const STORAGE_KEY = "rc-lie-detector-prompts";

export const DEFAULT_PROMPTS: Prompt[] = [
  // Self-Reflection
  { text: "A time you hit rock bottom", category: "self-reflection" },
  { text: "The moment you realized you needed help", category: "self-reflection" },
  { text: "The hardest conversation you've ever had", category: "self-reflection" },
  { text: "Something you lost that you can't get back", category: "self-reflection" },
  { text: "A time you surprised yourself", category: "self-reflection" },
  { text: "A moment that changed how you see yourself", category: "self-reflection" },
  { text: "The first time you asked for help", category: "self-reflection" },
  { text: "Something you're proud of that no one knows about", category: "self-reflection" },
  { text: "A time you felt truly free", category: "self-reflection" },
  { text: "The biggest risk you ever took", category: "self-reflection" },

  // Accountability
  { text: "The worst lie you told to keep using", category: "accountability" },
  { text: "A time you let someone down and knew it", category: "accountability" },
  { text: "The dumbest excuse you ever made", category: "accountability" },
  { text: "Something you're still avoiding dealing with", category: "accountability" },
  { text: "A promise you broke", category: "accountability" },
  { text: "A time you blamed someone else for your own choices", category: "accountability" },
  { text: "The hardest truth someone told you", category: "accountability" },
  { text: "A boundary you crossed that you regret", category: "accountability" },
  { text: "A time you knew you were wrong but doubled down", category: "accountability" },
  { text: "Something you owe someone an apology for", category: "accountability" },

  // Lighter
  { text: "The worst advice someone gave you", category: "lighter" },
  { text: "Your most embarrassing moment sober", category: "lighter" },
  { text: "The weirdest thing that happened in treatment", category: "lighter" },
  { text: "A time you got caught doing something stupid", category: "lighter" },
  { text: "Your worst job ever", category: "lighter" },
  { text: "The funniest misunderstanding you've been part of", category: "lighter" },
  { text: "A time you tried to impress someone and it backfired", category: "lighter" },
  { text: "The strangest thing you've ever eaten", category: "lighter" },
  { text: "Your worst haircut story", category: "lighter" },
  { text: "A time you laughed when you definitely shouldn't have", category: "lighter" },
];

export function getPrompts(): Prompt[] {
  if (typeof window === "undefined") return DEFAULT_PROMPTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return DEFAULT_PROMPTS;
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PROMPTS;
  } catch {
    return DEFAULT_PROMPTS;
  }
}

export function savePrompts(prompts: Prompt[]): void {
  if (prompts.length === 0) return; // Guard: cannot save empty prompt bank
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts));
}

export function resetPrompts(): void {
  localStorage.removeItem(STORAGE_KEY);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/__tests__/prompts.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add lib/prompts.ts lib/__tests__/prompts.test.ts
git commit -m "feat: add prompt bank module with 30 categorized recovery prompts"
```

---

## Task 4: Create Lie Detector Reducer

The state machine for Lie Detector. Handles role assignment, prompt selection, voting, and result phases.

**Files:**
- Create: `lib/lie-detector-reducer.ts`
- Create: `lib/__tests__/lie-detector-reducer.test.ts`

- [ ] **Step 1: Write reducer tests**

Create `lib/__tests__/lie-detector-reducer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  lieDetectorReducer,
  createInitialState,
  type LieDetectorState,
  type LieDetectorAction,
} from "../lie-detector-reducer";
import { DEFAULT_PROMPTS } from "../prompts";
import { DEFAULT_VULNERABILITY_QUESTIONS } from "../questions";

const TEST_PLAYERS = ["Marcus", "James", "Devon", "Ty", "Rob"];
const TEST_PROMPTS = DEFAULT_PROMPTS;
const TEST_QUESTIONS = DEFAULT_VULNERABILITY_QUESTIONS;

function startGame(state?: LieDetectorState): LieDetectorState {
  const s = state ?? createInitialState();
  return lieDetectorReducer(s, {
    type: "START_GAME",
    players: TEST_PLAYERS,
    prompts: TEST_PROMPTS,
    questions: TEST_QUESTIONS,
    promptMode: "random",
  });
}

describe("START_GAME", () => {
  it("assigns roles: 1 truth-teller, 1 liar for 4-6 players", () => {
    const state = startGame();
    expect(state.phase).toBe("role-reveal");
    expect(state.players).toEqual(TEST_PLAYERS);
    expect(state.truthTellerIndex).toBeGreaterThanOrEqual(0);
    expect(state.truthTellerIndex).toBeLessThan(5);
    expect(state.liarIndices.length).toBe(1);
    expect(state.liarIndices[0]).not.toBe(state.truthTellerIndex);
    expect(state.prompt.text.length).toBeGreaterThan(0);
  });

  it("assigns 2 liars for 7+ players", () => {
    const s = createInitialState();
    const state = lieDetectorReducer(s, {
      type: "START_GAME",
      players: ["A", "B", "C", "D", "E", "F", "G"],
      prompts: TEST_PROMPTS,
      questions: TEST_QUESTIONS,
      promptMode: "random",
    });
    expect(state.liarIndices.length).toBe(2);
  });

  it("picks prompt from specified category", () => {
    const s = createInitialState();
    const state = lieDetectorReducer(s, {
      type: "START_GAME",
      players: TEST_PLAYERS,
      prompts: TEST_PROMPTS,
      questions: TEST_QUESTIONS,
      promptMode: "lighter",
    });
    expect(state.prompt.category).toBe("lighter");
  });
});

describe("phase transitions", () => {
  it("REVEAL_ROLE → role-shown", () => {
    const state = lieDetectorReducer(startGame(), { type: "REVEAL_ROLE" });
    expect(state.phase).toBe("role-shown");
  });

  it("NEXT_PLAYER increments currentPlayerIndex", () => {
    let state = startGame();
    state = lieDetectorReducer(state, { type: "REVEAL_ROLE" });
    state = lieDetectorReducer(state, { type: "NEXT_PLAYER" });
    expect(state.currentPlayerIndex).toBe(1);
    expect(state.phase).toBe("role-reveal");
  });

  it("START_STORYTELLING → storytelling", () => {
    const state = lieDetectorReducer(startGame(), { type: "START_STORYTELLING" });
    expect(state.phase).toBe("storytelling");
    expect(state.storytellerOrder.length).toBeGreaterThan(0);
  });

  it("storyteller order includes truth-teller + liars, shuffled", () => {
    const state = lieDetectorReducer(startGame(), { type: "START_STORYTELLING" });
    const allStorytellers = [state.truthTellerIndex, ...state.liarIndices];
    expect(state.storytellerOrder.length).toBe(allStorytellers.length);
    expect(new Set(state.storytellerOrder)).toEqual(new Set(allStorytellers));
  });

  it("START_VOTING → voting", () => {
    let state = lieDetectorReducer(startGame(), { type: "START_STORYTELLING" });
    state = lieDetectorReducer(state, { type: "START_VOTING" });
    expect(state.phase).toBe("voting");
    expect(state.currentVoterIndex).toBe(0);
  });
});

describe("voting", () => {
  function getToVoting(): LieDetectorState {
    let state = startGame();
    state = lieDetectorReducer(state, { type: "START_STORYTELLING" });
    state = lieDetectorReducer(state, { type: "START_VOTING" });
    return state;
  }

  it("CAST_VOTE records vote and advances voter", () => {
    let state = getToVoting();
    const detectorIndices = state.players
      .map((_, i) => i)
      .filter((i) => i !== state.truthTellerIndex && !state.liarIndices.includes(i));

    state = lieDetectorReducer(state, {
      type: "CAST_VOTE",
      votedForIndex: state.truthTellerIndex,
    });
    expect(state.votes.length).toBe(1);
    expect(state.currentVoterIndex).toBe(1);
  });

  it("determines caught when majority votes for truth-teller", () => {
    let state = getToVoting();
    const detectorIndices = state.players
      .map((_, i) => i)
      .filter((i) => i !== state.truthTellerIndex && !state.liarIndices.includes(i));

    // All detectors vote for truth-teller
    for (const _ of detectorIndices) {
      state = lieDetectorReducer(state, {
        type: "CAST_VOTE",
        votedForIndex: state.truthTellerIndex,
      });
    }
    // After last vote, should auto-transition to vote-complete
    expect(state.phase).toBe("vote-complete");
    expect(state.result).toBe("caught");
  });

  it("determines fooled on tie (even number of detectors)", () => {
    // 6 players = 1 truth + 1 liar + 4 detectors (even split possible)
    const s = createInitialState();
    let state = lieDetectorReducer(s, {
      type: "START_GAME",
      players: ["A", "B", "C", "D", "E", "F"],
      prompts: TEST_PROMPTS,
      questions: TEST_QUESTIONS,
      promptMode: "random",
    });
    state = lieDetectorReducer(state, { type: "START_STORYTELLING" });
    state = lieDetectorReducer(state, { type: "START_VOTING" });

    const detectorIndices = state.players
      .map((_, i) => i)
      .filter((i) => i !== state.truthTellerIndex && !state.liarIndices.includes(i));

    // Half vote truth-teller, half vote liar
    const half = Math.floor(detectorIndices.length / 2);
    for (let i = 0; i < detectorIndices.length; i++) {
      state = lieDetectorReducer(state, {
        type: "CAST_VOTE",
        votedForIndex: i < half ? state.truthTellerIndex : state.liarIndices[0],
      });
    }
    expect(state.result).toBe("fooled");
  });
});

describe("results flow", () => {
  function getToVoteComplete(result: "caught" | "fooled"): LieDetectorState {
    let state = startGame();
    state = lieDetectorReducer(state, { type: "START_STORYTELLING" });
    state = lieDetectorReducer(state, { type: "START_VOTING" });
    const detectorIndices = state.players
      .map((_, i) => i)
      .filter((i) => i !== state.truthTellerIndex && !state.liarIndices.includes(i));
    const voteTarget = result === "caught" ? state.truthTellerIndex : state.liarIndices[0];
    for (const _ of detectorIndices) {
      state = lieDetectorReducer(state, { type: "CAST_VOTE", votedForIndex: voteTarget });
    }
    return state;
  }

  it("SHOW_RESULTS transitions to caught with vulnerability question", () => {
    let state = getToVoteComplete("caught");
    state = lieDetectorReducer(state, { type: "SHOW_RESULTS", questions: TEST_QUESTIONS });
    expect(state.phase).toBe("caught");
    expect(state.drawnQuestion.length).toBeGreaterThan(0);
    expect(state.reDrawUsed).toBe(false);
  });

  it("SHOW_RESULTS transitions to fooled with vulnerability question", () => {
    let state = getToVoteComplete("fooled");
    state = lieDetectorReducer(state, { type: "SHOW_RESULTS", questions: TEST_QUESTIONS });
    expect(state.phase).toBe("fooled");
    expect(state.drawnQuestion.length).toBeGreaterThan(0);
  });

  it("DRAW_QUESTION re-draws and sets reDrawUsed", () => {
    let state = getToVoteComplete("caught");
    state = lieDetectorReducer(state, { type: "SHOW_RESULTS", questions: TEST_QUESTIONS });
    const firstQ = state.drawnQuestion;
    state = lieDetectorReducer(state, { type: "DRAW_QUESTION", questions: TEST_QUESTIONS });
    expect(state.reDrawUsed).toBe(true);
  });

  it("PICK_PLAYER transitions to pick-player phase", () => {
    let state = getToVoteComplete("fooled");
    state = lieDetectorReducer(state, { type: "SHOW_RESULTS", questions: TEST_QUESTIONS });
    state = lieDetectorReducer(state, { type: "PICK_PLAYER" });
    expect(state.phase).toBe("pick-player");
  });

  it("NEW_ROUND resets for a new round", () => {
    let state = getToVoteComplete("caught");
    state = lieDetectorReducer(state, { type: "SHOW_RESULTS", questions: TEST_QUESTIONS });
    state = lieDetectorReducer(state, {
      type: "NEW_ROUND",
      prompts: TEST_PROMPTS,
      questions: TEST_QUESTIONS,
      promptMode: "random",
    });
    expect(state.phase).toBe("role-reveal");
    expect(state.currentPlayerIndex).toBe(0);
    expect(state.votes).toEqual([]);
  });

  it("CANCEL_GAME returns to initial state", () => {
    const state = lieDetectorReducer(startGame(), { type: "CANCEL_GAME" });
    expect(state.phase).toBe("setup");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/__tests__/lie-detector-reducer.test.ts`
Expected: FAIL (module doesn't exist)

- [ ] **Step 3: Implement the reducer**

Create `lib/lie-detector-reducer.ts`:

```typescript
import { pickRandom } from "./game-reducer";
import type { Prompt, PromptCategory } from "./prompts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LieDetectorPhase =
  | "setup"
  | "role-reveal"
  | "role-shown"
  | "storytelling"
  | "voting"
  | "vote-complete"
  | "caught"
  | "fooled"
  | "pick-player";

export interface LieDetectorState {
  phase: LieDetectorPhase;
  players: string[];
  prompt: Prompt;
  truthTellerIndex: number;
  liarIndices: number[];
  currentPlayerIndex: number;
  storytellerOrder: number[];
  currentVoterIndex: number;
  detectorIndices: number[];
  votes: number[]; // each entry is the storyteller index the detector voted for
  result: "caught" | "fooled" | null;
  voteCounts: Record<number, number>;
  drawnQuestion: string;
  reDrawUsed: boolean;
  usedPromptIndices: number[];
  usedQuestionIndices: number[];
}

export type PromptMode = "random" | PromptCategory;

export type LieDetectorAction =
  | { type: "START_GAME"; players: string[]; prompts: Prompt[]; questions: string[]; promptMode: PromptMode }
  | { type: "REVEAL_ROLE" }
  | { type: "NEXT_PLAYER" }
  | { type: "START_STORYTELLING" }
  | { type: "START_VOTING" }
  | { type: "CAST_VOTE"; votedForIndex: number }
  | { type: "SHOW_RESULTS"; questions: string[] }
  | { type: "DRAW_QUESTION"; questions: string[] }
  | { type: "PICK_PLAYER" }
  | { type: "NEW_ROUND"; prompts: Prompt[]; questions: string[]; promptMode: PromptMode }
  | { type: "CANCEL_GAME" };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickPrompt(
  prompts: Prompt[],
  mode: PromptMode,
  usedIndices: number[],
): { prompt: Prompt; updatedUsed: number[] } {
  const pool = mode === "random"
    ? prompts
    : prompts.filter((p) => p.category === mode);

  // Map filtered pool back to indices in the full array
  const poolIndices = prompts
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => mode === "random" || p.category === mode)
    .map(({ i }) => i);

  // Filter out used indices (scoped to this pool)
  const available = poolIndices.filter((i) => !usedIndices.includes(i));

  if (available.length === 0) {
    // Reset this pool's tracking
    const idx = poolIndices[Math.floor(Math.random() * poolIndices.length)];
    // Remove all poolIndices from usedIndices, then add the new pick
    const resetUsed = usedIndices.filter((i) => !poolIndices.includes(i));
    return { prompt: prompts[idx], updatedUsed: [...resetUsed, idx] };
  }

  const idx = available[Math.floor(Math.random() * available.length)];
  return { prompt: prompts[idx], updatedUsed: [...usedIndices, idx] };
}

function assignRoles(playerCount: number): { truthTellerIndex: number; liarIndices: number[] } {
  const indices = Array.from({ length: playerCount }, (_, i) => i);
  const shuffled = shuffle(indices);
  const truthTellerIndex = shuffled[0];
  const liarCount = playerCount >= 7 ? 2 : 1;
  const liarIndices = shuffled.slice(1, 1 + liarCount);
  return { truthTellerIndex, liarIndices };
}

function tallyVotes(
  votes: number[],
  truthTellerIndex: number,
): { result: "caught" | "fooled"; voteCounts: Record<number, number> } {
  const counts: Record<number, number> = {};
  for (const v of votes) {
    counts[v] = (counts[v] ?? 0) + 1;
  }
  const truthVotes = counts[truthTellerIndex] ?? 0;
  const allCounts = Object.values(counts);
  const maxVotes = Math.max(...allCounts);
  // Caught only if truth-teller has strictly more votes than any other
  const result = truthVotes > 0 && truthVotes === maxVotes &&
    Object.values(counts).filter((c) => c === maxVotes).length === 1
    ? "caught"
    : "fooled";
  return { result, voteCounts: counts };
}

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

export function createInitialState(): LieDetectorState {
  return {
    phase: "setup",
    players: [],
    prompt: { text: "", category: "lighter" },
    truthTellerIndex: -1,
    liarIndices: [],
    currentPlayerIndex: 0,
    storytellerOrder: [],
    currentVoterIndex: 0,
    detectorIndices: [],
    votes: [],
    result: null,
    voteCounts: {},
    drawnQuestion: "",
    reDrawUsed: false,
    usedPromptIndices: [],
    usedQuestionIndices: [],
  };
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function lieDetectorReducer(
  state: LieDetectorState,
  action: LieDetectorAction,
): LieDetectorState {
  switch (action.type) {
    case "START_GAME": {
      const { players, prompts, questions, promptMode } = action;
      const { truthTellerIndex, liarIndices } = assignRoles(players.length);
      const { prompt, updatedUsed } = pickPrompt(prompts, promptMode, state.usedPromptIndices);

      return {
        ...state,
        phase: "role-reveal",
        players,
        prompt,
        truthTellerIndex,
        liarIndices,
        currentPlayerIndex: 0,
        storytellerOrder: [],
        currentVoterIndex: 0,
        detectorIndices: [],
        votes: [],
        result: null,
        voteCounts: {},
        drawnQuestion: "",
        reDrawUsed: false,
        usedPromptIndices: updatedUsed,
      };
    }

    case "REVEAL_ROLE":
      return { ...state, phase: "role-shown" };

    case "NEXT_PLAYER":
      return {
        ...state,
        phase: "role-reveal",
        currentPlayerIndex: state.currentPlayerIndex + 1,
      };

    case "START_STORYTELLING": {
      const storytellerOrder = shuffle([state.truthTellerIndex, ...state.liarIndices]);
      const detectorIndices = state.players
        .map((_, i) => i)
        .filter((i) => i !== state.truthTellerIndex && !state.liarIndices.includes(i));
      return {
        ...state,
        phase: "storytelling",
        storytellerOrder,
        detectorIndices,
      };
    }

    case "START_VOTING":
      return {
        ...state,
        phase: "voting",
        currentVoterIndex: 0,
        votes: [],
      };

    case "CAST_VOTE": {
      const votes = [...state.votes, action.votedForIndex];
      const nextVoterIndex = state.currentVoterIndex + 1;
      const allVoted = nextVoterIndex >= state.detectorIndices.length;

      if (allVoted) {
        const { result, voteCounts } = tallyVotes(votes, state.truthTellerIndex);
        return {
          ...state,
          votes,
          currentVoterIndex: nextVoterIndex,
          phase: "vote-complete",
          result,
          voteCounts,
        };
      }

      return {
        ...state,
        votes,
        currentVoterIndex: nextVoterIndex,
      };
    }

    case "SHOW_RESULTS": {
      const { questions } = action;
      const questionPick = pickRandom(questions.length, state.usedQuestionIndices);
      return {
        ...state,
        phase: state.result ?? "caught",
        drawnQuestion: questions[questionPick.index],
        reDrawUsed: false,
        usedQuestionIndices: questionPick.updatedExclude,
      };
    }

    case "DRAW_QUESTION": {
      const { questions } = action;
      const questionPick = pickRandom(questions.length, state.usedQuestionIndices);
      return {
        ...state,
        drawnQuestion: questions[questionPick.index],
        reDrawUsed: true,
        usedQuestionIndices: questionPick.updatedExclude,
      };
    }

    case "PICK_PLAYER":
      return { ...state, phase: "pick-player" };

    case "NEW_ROUND": {
      const { prompts, questions, promptMode } = action;
      const { truthTellerIndex, liarIndices } = assignRoles(state.players.length);
      const { prompt, updatedUsed } = pickPrompt(prompts, promptMode, state.usedPromptIndices);

      return {
        ...state,
        phase: "role-reveal",
        prompt,
        truthTellerIndex,
        liarIndices,
        currentPlayerIndex: 0,
        storytellerOrder: [],
        currentVoterIndex: 0,
        votes: [],
        result: null,
        voteCounts: {},
        drawnQuestion: "",
        reDrawUsed: false,
        usedPromptIndices: updatedUsed,
      };
    }

    case "CANCEL_GAME":
      return {
        ...createInitialState(),
        // Preserve session tracking so prompts/questions don't repeat after cancel
        usedPromptIndices: state.usedPromptIndices,
        usedQuestionIndices: state.usedQuestionIndices,
      };

    default:
      return state;
  }
}
```

**Important:** The `pickRandom` function is imported from `./game-reducer` where it's already exported. Verify this before implementing — if it's not exported, extract it to `lib/utils.ts` or `lib/random.ts` as a shared utility.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/__tests__/lie-detector-reducer.test.ts`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add lib/lie-detector-reducer.ts lib/__tests__/lie-detector-reducer.test.ts
git commit -m "feat: add lie detector game reducer with full state machine"
```

---

## Task 5: Hub Home Screen

Convert the home page from Imposter-specific setup into a game selector menu. Move player setup into the Imposter route.

**Files:**
- Modify: `app/page.tsx` (replace with game menu)
- Modify: `app/imposter/page.tsx` (add setup phase with player management)
- Modify: `components/game/player-setup.tsx` (make reusable — remove Imposter-specific title/branding)
- Modify: `app/layout.tsx` (update metadata title to "Recovery Circle")

- [ ] **Step 1: Make PlayerSetup reusable**

Modify `components/game/player-setup.tsx` to accept `title`, `subtitle`, `minPlayers`, `settingsHref`, and `canStart` as props instead of hardcoding "SACRED IMPOSTER" and the 3-player minimum:

```typescript
interface PlayerSetupProps {
  title: string;
  subtitle: string;
  players: string[];
  onPlayersChange: (players: string[]) => void;
  minPlayers: number;
  canStart: boolean;
  disabledReason: string | null;
  onStartGame: () => void;
  settingsHref?: string;
  extraControls?: React.ReactNode; // slot for prompt mode selector, etc.
}
```

Remove the hardcoded "SACRED IMPOSTER" heading — use `title` prop instead. Remove the hardcoded `wordCount` dependency — `canStart` and `disabledReason` are now caller-controlled. Keep all other UI patterns (player list, add/remove, input, start button).

- [ ] **Step 2: Update Imposter route to include setup phase**

Modify `app/imposter/page.tsx`:
- Add a `setupComplete` state (initially false)
- When `setupComplete` is false, render `PlayerSetup` with title="SACRED IMPOSTER", subtitle="A game of sacred deception", minPlayers=3, settingsHref="/settings"
- When `setupComplete` is true, run the game (existing behavior)
- `onStartGame` sets `setupComplete = true` and dispatches `START_GAME`

- [ ] **Step 3: Create hub home page**

Replace `app/page.tsx` with a game selector:

```tsx
"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

const GAMES = [
  {
    name: "Imposter",
    description: "One word. One imposter. Can you blend in?",
    href: "/imposter",
    color: "bg-purple-600",
  },
  {
    name: "Lie Detector",
    description: "True story or total fiction? You decide.",
    href: "/lie-detector",
    color: "bg-green-600",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      <div className="relative flex items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          RECOVERY CIRCLE
        </h1>
        <Link
          href="/settings"
          className="absolute right-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Link>
      </div>

      <p className="mt-2 text-center text-muted-foreground">
        Sacred Journey Recovery
      </p>

      <div className="mt-10 flex flex-1 flex-col gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:bg-[#252525]"
          >
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${game.color}`} />
              <h2 className="text-xl font-bold text-white">{game.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Update layout.tsx metadata**

In `app/layout.tsx`, update the metadata title from "Sacred Imposter" to "Recovery Circle" and description accordingly.

- [ ] **Step 5: Verify Imposter still works end-to-end**

Run: `npm run build`
Expected: Build succeeds. Manually verify: home shows game menu, tapping Imposter opens setup, game flow works as before.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx app/imposter/page.tsx components/game/player-setup.tsx app/layout.tsx
git commit -m "refactor: convert home to Recovery Circle game hub, move Imposter setup into its route"
```

---

## Task 6: Expand Settings Screen

Add vulnerability questions management and prompt bank management sections alongside the existing word bank.

**Files:**
- Modify: `app/settings/page.tsx` (restructure as tabbed/sectioned settings)

- [ ] **Step 1: Restructure settings as a sectioned page**

The settings page becomes three collapsible sections:
1. **Vulnerability Questions** — shared across all games (add/edit/delete, reset to defaults)
2. **Imposter Word Bank** — existing functionality, relocated
3. **Lie Detector Prompts** — add/edit/delete with category dropdown

Each section follows the same UI pattern as the existing word bank (list + add input + remove buttons + reset). The prompt section adds a category dropdown (select element) when adding/editing. All sections must guard against deleting the last item — disable the remove button when only 1 item remains (same pattern as the existing word bank's `isLastWord` check).

Import the new storage functions: `getVulnerabilityQuestions`, `saveVulnerabilityQuestions`, `resetVulnerabilityQuestions` from `@/lib/storage` and `getPrompts`, `savePrompts`, `resetPrompts` from `@/lib/prompts`.

- [ ] **Step 2: Extract a reusable ListManager component**

Since all three sections share the same pattern (add input, item list with remove, reset button), extract a `components/settings/list-manager.tsx` component:

```typescript
interface ListManagerProps {
  title: string;
  items: string[];
  onAdd: (item: string) => void;
  onRemove: (index: number) => void;
  onReset: () => void;
  placeholder: string;
  emptyMessage?: string;
  renderAddExtra?: () => React.ReactNode; // slot for category dropdown
}
```

This replaces the duplicated add/remove/reset logic across all three sections.

- [ ] **Step 3: Build the prompt section with category support**

For the prompt bank section, the add flow includes a category dropdown:
- Input for prompt text
- Select dropdown: Self-Reflection | Accountability | Lighter
- Add button
- Each prompt in the list shows its category as a small colored badge
- Category badges use the same colors: self-reflection=purple, accountability=red, lighter=amber

- [ ] **Step 4: Verify settings page works**

Run: `npm run build`
Expected: Build succeeds. Settings page shows all three sections. Add/remove/reset works for each.

- [ ] **Step 5: Commit**

```bash
git add app/settings/page.tsx components/settings/list-manager.tsx
git commit -m "feat: expand settings with vulnerability questions and prompt bank sections"
```

---

## Task 7: Lie Detector Setup Screen

Create the Lie Detector route with its setup screen (player names + prompt mode selector).

**Files:**
- Create: `app/lie-detector/page.tsx`

- [ ] **Step 1: Create the Lie Detector page**

Create `app/lie-detector/page.tsx`. This follows the same pattern as the refactored Imposter page:

- `setupComplete` state controls setup vs. game
- Setup phase renders `PlayerSetup` with:
  - title="LIE DETECTOR"
  - subtitle="True story or total fiction?"
  - minPlayers=4
  - settingsHref="/settings"
  - extraControls: prompt mode selector (radio group: Random / Self-Reflection / Accountability / Lighter)
- Game phase uses `useReducer(lieDetectorReducer, undefined, createInitialState)`
- Loads prompts via `getPrompts()` and questions via `getVulnerabilityQuestions()` into refs
- Routes to Lie Detector components based on `state.phase`

- [ ] **Step 2: Add prompt mode selector UI**

The prompt mode selector is a simple radio group or segmented control rendered via the `extraControls` slot in PlayerSetup:

```tsx
<div className="flex flex-col gap-2">
  <label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
    Prompt Mode
  </label>
  <div className="grid grid-cols-2 gap-2">
    {(["random", "self-reflection", "accountability", "lighter"] as const).map((mode) => (
      <button
        key={mode}
        onClick={() => setPromptMode(mode)}
        className={cn(
          "rounded-xl px-3 py-2.5 text-sm font-medium capitalize transition-colors",
          promptMode === mode
            ? "bg-primary text-white"
            : "bg-card text-muted-foreground hover:text-foreground"
        )}
      >
        {mode === "self-reflection" ? "Self-Reflection" : mode}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 3: Verify setup screen renders**

Run: `npm run dev`
Navigate to `/lie-detector`. Expected: Setup screen with player list, prompt mode selector, and Start Game button (disabled until 4+ players).

- [ ] **Step 4: Commit**

```bash
git add app/lie-detector/page.tsx
git commit -m "feat: add lie detector route with setup screen and prompt mode selector"
```

---

## Task 8: Lie Detector Role Reveal Component

Pass-around screen that shows each player their role (Truth Teller, Liar, or Detector).

**Files:**
- Create: `components/lie-detector/role-reveal.tsx`

- [ ] **Step 1: Create the role reveal component**

Create `components/lie-detector/role-reveal.tsx`. Follow the same two-phase pattern as Imposter's `card-reveal.tsx`:

**Phase: role-reveal (pass prompt)**
- Player counter: "Player X of Y"
- Player name prominently displayed
- "Hand the phone to [Name]"
- "Tap to Reveal Role" button → dispatches `REVEAL_ROLE`
- Cancel button top-left

**Phase: role-shown**
- Truth Teller: "YOU ARE THE TRUTH TELLER" in green (#16a34a) + prompt text + "Tell a TRUE story from your life."
- Liar: "YOU ARE A LIAR" in red (#dc2626) + prompt text + "Make up a convincing fake story."
- Detector: "YOU ARE A DETECTOR" in purple (#7c3aed) + "Listen carefully. You'll vote on who's telling the truth." (NO prompt shown)
- "Pass to Next Person" / "Everyone's Ready" button (last player dispatches `START_STORYTELLING`)

Props interface:
```typescript
interface RoleRevealProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
}
```

- [ ] **Step 2: Wire into game page**

In `app/lie-detector/page.tsx`, add the phase routing:
```typescript
case "role-reveal":
case "role-shown":
  return <RoleReveal state={state} dispatch={dispatch} />;
```

- [ ] **Step 3: Verify role reveal works**

Run: `npm run dev`. Add 4+ players, start game. Expected: pass-around cycle showing each player their role with correct colors and text.

- [ ] **Step 4: Commit**

```bash
git add components/lie-detector/role-reveal.tsx app/lie-detector/page.tsx
git commit -m "feat: add lie detector role reveal pass-around screen"
```

---

## Task 9: Lie Detector Storytelling Screen

Static reference screen showing the prompt and storyteller names.

**Files:**
- Create: `components/lie-detector/storytelling.tsx`

- [ ] **Step 1: Create the storytelling component**

Create `components/lie-detector/storytelling.tsx`:

- Prompt displayed prominently at top in a card (same `rounded-xl bg-[#1a1a1a] border-white/10` pattern)
- "Storytellers" heading
- Lists storyteller names in the `storytellerOrder` from state (randomized, group doesn't know who is who)
- Each name shown as a numbered item (1. Marcus, 2. James)
- Instruction text: "Each storyteller tells their story. Ask follow-up questions. Then vote."
- "Time to Vote" button at bottom → dispatches `START_VOTING`

- [ ] **Step 2: Wire into game page**

```typescript
case "storytelling":
  return <Storytelling state={state} dispatch={dispatch} />;
```

- [ ] **Step 3: Commit**

```bash
git add components/lie-detector/storytelling.tsx app/lie-detector/page.tsx
git commit -m "feat: add lie detector storytelling screen"
```

---

## Task 10: Lie Detector Voting Screen

Pass-around voting with handoff screens to prevent vote peeking.

**Files:**
- Create: `components/lie-detector/voting.tsx`

- [ ] **Step 1: Create the voting component**

Create `components/lie-detector/voting.tsx`:

Two sub-phases within the voting component (managed via local state, not reducer):

**Pass prompt (showVoteScreen = false):**
- "Hand the phone to [Detector Name]"
- "Tap to Vote" button → sets showVoteScreen = true

**Vote screen (showVoteScreen = true):**
- "Who is the Truth Teller?"
- Lists storyteller names as tappable buttons (same names as storytelling screen, same order)
- Tapping a name dispatches `CAST_VOTE` with the storyteller's player index and resets showVoteScreen to false

After all detectors have voted (state.phase transitions to "vote-complete"):
- Show "All votes are in..." with pulse animation
- "Reveal Truth" button → dispatches `SHOW_RESULTS` with questions array

- [ ] **Step 2: Wire into game page**

```typescript
case "voting":
case "vote-complete":
  return <Voting state={state} dispatch={dispatch} questions={questionsRef.current} />;
```

- [ ] **Step 3: Commit**

```bash
git add components/lie-detector/voting.tsx app/lie-detector/page.tsx
git commit -m "feat: add lie detector voting pass-around screen"
```

---

## Task 11: Lie Detector Results Screen

Caught/fooled flows with vulnerability question draw.

**Files:**
- Create: `components/lie-detector/results.tsx`

- [ ] **Step 1: Create the results component**

Create `components/lie-detector/results.tsx`. This mirrors Imposter's `question-draw.tsx` but with Lie Detector's caught/fooled flow:

**Phase: caught**
- "The group caught the truth!"
- Truth Teller's name highlighted in green
- Vote breakdown: show each storyteller name + vote count
- The prompt that was used
- Vulnerability question card
- "Draw Again" button (disabled when `reDrawUsed`)
- "New Round" button → dispatches `NEW_ROUND`

**Phase: fooled** (multi-step, managed via local state)

Step 1 — Reveal (visible to all):
- "The truth was hiding in plain sight!"
- Truth Teller's name revealed in green
- Vote breakdown
- "Hand the phone to [Truth Teller name]" button

Step 2 — Handoff gate (prevents others from seeing the question):
- "Hand the phone to [Truth Teller name]"
- "Tap to Continue" button (only Truth Teller should tap)

Step 3 — Truth Teller's screen:
- Vulnerability question card
- "Draw Again" button (disabled when reDrawUsed)
- Player list — Truth Teller taps a name to pick who answers

Step 4 — After selection:
- "[Chosen player] answers:" with question displayed
- "New Round" button

**Phase: pick-player**
- Question displayed
- "Who must answer?" heading
- List of all players except Truth Teller as tappable buttons
- After tap: confirmation screen with question + "New Round" button

Props:
```typescript
interface ResultsProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
  prompts: Prompt[];
  questions: string[];
  promptMode: PromptMode;
}
```

- [ ] **Step 2: Wire into game page**

```typescript
case "caught":
case "fooled":
case "pick-player":
  return (
    <Results
      state={state}
      dispatch={dispatch}
      prompts={promptsRef.current}
      questions={questionsRef.current}
      promptMode={promptMode}
    />
  );
```

- [ ] **Step 3: Verify full game loop**

Run: `npm run dev`. Play a full round: setup → role reveal → storytelling → voting → results → new round. Verify both caught and fooled flows work.

- [ ] **Step 4: Commit**

```bash
git add components/lie-detector/results.tsx app/lie-detector/page.tsx
git commit -m "feat: add lie detector results screen with caught/fooled flows"
```

---

## Task 12: Final Verification

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript or lint errors

- [ ] **Step 3: Manual smoke test**

Verify in browser:
1. Home page shows "RECOVERY CIRCLE" with game cards for Imposter and Lie Detector
2. Settings page has three sections (Vulnerability Questions, Word Bank, Prompt Bank)
3. Imposter game works exactly as before (no regressions)
4. Lie Detector: full round with 4 players — setup, role reveal, storytelling, voting, caught flow
5. Lie Detector: full round with 7+ players — verify 2 liars assigned
6. Lie Detector: prompt mode selector — "Pick Category" filters prompts correctly
7. Lie Detector: fooled flow — Truth Teller picks a player, vulnerability question displays
8. Player names persist across games (add in Imposter, visible in Lie Detector)
9. Vulnerability questions shared (same pool in both games)

- [ ] **Step 4: Commit any fixes from smoke testing**

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete lie detector game and recovery circle hub"
```
