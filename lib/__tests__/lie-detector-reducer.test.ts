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
