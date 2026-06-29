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
  /** Words already shown this session, by value — never repeated. */
  usedWords: string[];
}

export type GameAction =
  | {
      type: "START_GAME";
      players: string[];
      words: string[];
      /** Words already used earlier this session (persisted across games). */
      usedWords?: string[];
    }
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
    // All indices exhausted — reset, but never immediately repeat the most
    // recent pick (the last entry in `exclude`).
    const lastIndex = exclude[exclude.length - 1];
    const pool = Array.from({ length }, (_, i) => i).filter(
      (i) => length <= 1 || i !== lastIndex,
    );
    const index = pool[Math.floor(Math.random() * pool.length)];
    return { index, updatedExclude: [index] };
  }

  const index = available[Math.floor(Math.random() * available.length)];
  return { index, updatedExclude: [...exclude, index] };
}

/**
 * Pick a word that has NOT been used this session, by value.
 *
 * Dedupe is by string (not index) so it stays correct even if the word bank
 * changes between games in the same session. When every word has been used the
 * pool resets, but the word just shown is never picked again immediately.
 * Callers MUST persist the returned `updatedUsed` so the session history grows.
 */
export function pickWord(
  words: string[],
  usedWords: string[],
): { word: string; updatedUsed: string[] } {
  const available = words.filter((w) => !usedWords.includes(w));

  if (available.length === 0) {
    // Whole session pool exhausted — reset, avoiding an immediate repeat.
    const lastWord = usedWords[usedWords.length - 1];
    const pool =
      words.length > 1 ? words.filter((w) => w !== lastWord) : words;
    const word = pool[Math.floor(Math.random() * pool.length)];
    return { word, updatedUsed: [word] };
  }

  const word = available[Math.floor(Math.random() * available.length)];
  return { word, updatedUsed: [...usedWords, word] };
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
    usedWords: [],
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

      // Seed from words already shown earlier this session so repeats are
      // avoided across separate games, not just within one game's rounds.
      const wordPick = pickWord(words, action.usedWords ?? []);

      const imposterPick = pickImposter(players.length, -1, 0);

      return {
        ...state,
        phase: "card-reveal",
        players,
        wordBank: words,
        word: wordPick.word,
        imposterIndex: imposterPick.index,
        imposterStreakCount: imposterPick.streakCount,
        currentPlayerIndex: 0,
        starterName: "",
        usedWords: wordPick.updatedUsed,
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
      const wordPick = pickWord(state.wordBank, state.usedWords);
      const imposterPick = pickImposter(
        state.players.length,
        state.imposterIndex,
        state.imposterStreakCount,
      );

      return {
        ...state,
        phase: "card-reveal",
        word: wordPick.word,
        imposterIndex: imposterPick.index,
        imposterStreakCount: imposterPick.streakCount,
        currentPlayerIndex: 0,
        starterName: "",
        usedWords: wordPick.updatedUsed,
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
