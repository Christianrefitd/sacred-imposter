"use client";

import { useState } from "react";
import { GameState, GameAction } from "@/lib/game-reducer";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

function QuestionCard({ question }: { question: string }) {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] p-6">
      <p className="text-lg leading-relaxed text-white">{question}</p>
    </div>
  );
}

export function QuestionDraw({ state, dispatch, words }: GameComponentProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const imposterName = state.players[state.imposterIndex];

  // -------------------------------------------------------------------------
  // Phase: caught
  // -------------------------------------------------------------------------
  if (state.phase === "caught") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <h1 className="text-2xl font-bold">
            <span className="text-red-500">{imposterName}</span> was caught!
          </h1>

          <p className="text-sm text-white/70">
            {imposterName} must answer:
          </p>

          <QuestionCard question={state.drawnQuestion} />

          <button
            onClick={() => dispatch({ type: "DRAW_QUESTION" })}
            disabled={state.reDrawUsed}
            className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-3 text-base font-medium text-white transition-opacity disabled:opacity-40"
          >
            Draw Again
          </button>

          <button
            onClick={() => dispatch({ type: "NEW_ROUND", words })}
            className="h-14 w-full rounded-xl bg-purple-600 text-base font-semibold text-white transition-colors hover:bg-purple-500"
          >
            New Round
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Phase: escaped
  // -------------------------------------------------------------------------
  if (state.phase === "escaped") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <h1 className="text-2xl font-bold">
            <span className="text-red-500">{imposterName}</span> escaped!
          </h1>

          <p className="text-sm text-white/70">
            Hand the phone to {imposterName}
          </p>

          <QuestionCard question={state.drawnQuestion} />

          <button
            onClick={() => dispatch({ type: "DRAW_QUESTION" })}
            disabled={state.reDrawUsed}
            className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] py-3 text-base font-medium text-white transition-opacity disabled:opacity-40"
          >
            Draw Again
          </button>

          <button
            onClick={() => dispatch({ type: "PICK_PLAYER" })}
            className="h-14 w-full rounded-xl bg-purple-600 text-base font-semibold text-white transition-colors hover:bg-purple-500"
          >
            Choose Who Answers
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Phase: pick-player
  // -------------------------------------------------------------------------
  if (state.phase === "pick-player") {
    const otherPlayers = state.players.filter(
      (_, i) => i !== state.imposterIndex
    );

    // After a player has been selected
    if (selectedPlayer) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 text-white">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <p className="text-sm text-white/70">
              {selectedPlayer} must answer:
            </p>

            <QuestionCard question={state.drawnQuestion} />

            <button
              onClick={() => {
                setSelectedPlayer(null);
                dispatch({ type: "NEW_ROUND", words });
              }}
              className="h-14 w-full rounded-xl bg-purple-600 text-base font-semibold text-white transition-colors hover:bg-purple-500"
            >
              New Round
            </button>
          </div>
        </div>
      );
    }

    // Player selection list
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <QuestionCard question={state.drawnQuestion} />

          <h2 className="text-xl font-bold">Who must answer?</h2>

          <div className="flex w-full flex-col gap-3">
            {otherPlayers.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedPlayer(name)}
                className="h-12 w-full rounded-xl bg-[#1a1a1a] text-base font-medium text-white transition-colors hover:bg-[#252525]"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback (should not be reached in normal flow)
  return (
    <div className="flex min-h-screen items-center justify-center text-white">
      {state.phase}
    </div>
  );
}
