import { VULNERABILITY_QUESTIONS } from "./questions";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Pick a random index in `[0, length)` that is NOT in `exclude`.
 *
 * If every index has already been used the exclusion list is reset so the
 * full pool is available again. The returned `updatedExclude` reflects this
 * reset (it will contain only the newly picked index). Callers MUST persist
 * the returned `updatedExclude` into `GameState` so the reset is not lost.
 */
export function pickRandom(
  length: number,
  exclude: number[],
): { index: number; updatedExclude: number[] } {
  const available = Array.from({ length }, (_, i) => i).filter(
    (i) => !exclude.includes(i),
  );

  if (available.length === 0) {
    // All indices exhausted — reset and pick from the full pool.
    const index = Math.floor(Math.random() * length);
    return { index, updatedExclude: [index] };
  }

  const index = available[Math.floor(Math.random() * available.length)];
  return { index, updatedExclude: [...exclude, index] };
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    // -----------------------------------------------------------------------
    // START_GAME — begin a new game session
    // -----------------------------------------------------------------------
    case "START_GAME": {
      const { players, words } = action;

      // Pick a word, avoiding previously used indices.
      const wordPick = pickRandom(words.length, state.usedWordIndices);

      // Pick the imposter (random player index).
      const imposterIndex = Math.floor(Math.random() * players.length);

      return {
        ...state,
        phase: "card-reveal",
        players,
        word: words[wordPick.index],
        imposterIndex,
        currentPlayerIndex: 0,
        starterName: "",
        drawnQuestion: "",
        reDrawUsed: false,
        usedWordIndices: wordPick.updatedExclude,
      };
    }

    // -----------------------------------------------------------------------
    // REVEAL_WORD — flip the current player's card face-up
    // -----------------------------------------------------------------------
    case "REVEAL_WORD": {
      return { ...state, phase: "word-shown" };
    }

    // -----------------------------------------------------------------------
    // NEXT_PLAYER — advance to the next player (NOT for the last player)
    // -----------------------------------------------------------------------
    case "NEXT_PLAYER": {
      return {
        ...state,
        phase: "card-reveal",
        currentPlayerIndex: state.currentPlayerIndex + 1,
      };
    }

    // -----------------------------------------------------------------------
    // START_DISCUSSION — all players have seen their card
    // -----------------------------------------------------------------------
    case "START_DISCUSSION": {
      // Pick a random NON-imposter to start the discussion.
      const nonImposterIndices = state.players
        .map((_, i) => i)
        .filter((i) => i !== state.imposterIndex);
      const starterIdx =
        nonImposterIndices[
          Math.floor(Math.random() * nonImposterIndices.length)
        ];

      return {
        ...state,
        phase: "discussion",
        starterName: state.players[starterIdx],
      };
    }

    // -----------------------------------------------------------------------
    // SHOW_REVEAL — transition to the reveal screen
    // -----------------------------------------------------------------------
    case "SHOW_REVEAL": {
      return { ...state, phase: "reveal" };
    }

    // -----------------------------------------------------------------------
    // CAUGHT — the group correctly identified the imposter
    // -----------------------------------------------------------------------
    case "CAUGHT": {
      const questionPick = pickRandom(
        VULNERABILITY_QUESTIONS.length,
        state.usedQuestionIndices,
      );
      return {
        ...state,
        phase: "caught",
        drawnQuestion: VULNERABILITY_QUESTIONS[questionPick.index],
        reDrawUsed: false,
        usedQuestionIndices: questionPick.updatedExclude,
      };
    }

    // -----------------------------------------------------------------------
    // ESCAPED — the imposter was not caught
    // -----------------------------------------------------------------------
    case "ESCAPED": {
      const questionPick = pickRandom(
        VULNERABILITY_QUESTIONS.length,
        state.usedQuestionIndices,
      );
      return {
        ...state,
        phase: "escaped",
        drawnQuestion: VULNERABILITY_QUESTIONS[questionPick.index],
        reDrawUsed: false,
        usedQuestionIndices: questionPick.updatedExclude,
      };
    }

    // -----------------------------------------------------------------------
    // DRAW_QUESTION — re-draw a vulnerability question (one-time use)
    // -----------------------------------------------------------------------
    case "DRAW_QUESTION": {
      const questionPick = pickRandom(
        VULNERABILITY_QUESTIONS.length,
        state.usedQuestionIndices,
      );
      return {
        ...state,
        drawnQuestion: VULNERABILITY_QUESTIONS[questionPick.index],
        reDrawUsed: true,
        usedQuestionIndices: questionPick.updatedExclude,
      };
    }

    // -----------------------------------------------------------------------
    // PICK_PLAYER — imposter picks who answers the question (escaped flow)
    // -----------------------------------------------------------------------
    case "PICK_PLAYER": {
      return { ...state, phase: "pick-player" };
    }

    // -----------------------------------------------------------------------
    // NEW_ROUND — same players, fresh word & imposter
    // -----------------------------------------------------------------------
    case "NEW_ROUND": {
      const { words } = action;

      const wordPick = pickRandom(words.length, state.usedWordIndices);
      const imposterIndex = Math.floor(Math.random() * state.players.length);

      return {
        ...state,
        phase: "card-reveal",
        word: words[wordPick.index],
        imposterIndex,
        currentPlayerIndex: 0,
        starterName: "",
        drawnQuestion: "",
        reDrawUsed: false,
        usedWordIndices: wordPick.updatedExclude,
      };
    }

    // -----------------------------------------------------------------------
    // CANCEL_GAME — bail out, return to setup
    // -----------------------------------------------------------------------
    case "CANCEL_GAME": {
      return createInitialState();
    }

    default:
      return state;
  }
}
