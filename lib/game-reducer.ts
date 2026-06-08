// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type GamePhase =
  | "setup"
  | "card-reveal"
  | "word-shown"
  | "discussion"
  | "reveal";

export interface GameState {
  phase: GamePhase;
  players: string[];
  wordBank: string[];
  word: string;
  imposterIndex: number;
  imposterStreakCount: number;
  currentPlayerIndex: number;
  starterName: string;
  usedWordIndices: number[];
}

export type GameAction =
  | { type: "START_GAME"; players: string[]; words: string[] }
  | { type: "REVEAL_WORD" }
  | { type: "NEXT_PLAYER" }
  | { type: "START_DISCUSSION" }
  | { type: "SHOW_REVEAL" }
  | { type: "NEW_ROUND" }
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

export function pickImposter(
  playerCount: number,
  previousImposterIndex: number,
  previousStreakCount: number,
): { index: number; streakCount: number } {
  if (playerCount <= 0) return { index: -1, streakCount: 0 };

  const shouldExcludePrevious =
    playerCount > 1 &&
    previousImposterIndex >= 0 &&
    previousImposterIndex < playerCount &&
    previousStreakCount >= 2;

  const available = Array.from({ length: playerCount }, (_, i) => i).filter(
    (i) => !shouldExcludePrevious || i !== previousImposterIndex,
  );

  const index = available[Math.floor(Math.random() * available.length)];
  const streakCount =
    index === previousImposterIndex ? previousStreakCount + 1 : 1;

  return { index, streakCount };
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

export function createInitialState(): GameState {
  return {
    phase: "setup",
    players: [],
    wordBank: [],
    word: "",
    imposterIndex: -1,
    imposterStreakCount: 0,
    currentPlayerIndex: 0,
    starterName: "",
    usedWordIndices: [],
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

      const imposterPick = pickImposter(players.length, -1, 0);

      return {
        ...state,
        phase: "card-reveal",
        players,
        wordBank: words,
        word: words[wordPick.index],
        imposterIndex: imposterPick.index,
        imposterStreakCount: imposterPick.streakCount,
        currentPlayerIndex: 0,
        starterName: "",
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
    // NEW_ROUND — same players, fresh word & imposter
    // -----------------------------------------------------------------------
    case "NEW_ROUND": {
      const wordPick = pickRandom(state.wordBank.length, state.usedWordIndices);
      const imposterPick = pickImposter(
        state.players.length,
        state.imposterIndex,
        state.imposterStreakCount,
      );

      return {
        ...state,
        phase: "card-reveal",
        word: state.wordBank[wordPick.index],
        imposterIndex: imposterPick.index,
        imposterStreakCount: imposterPick.streakCount,
        currentPlayerIndex: 0,
        starterName: "",
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
