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
