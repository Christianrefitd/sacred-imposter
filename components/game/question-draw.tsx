"use client";

import { useState } from "react";
import { GameState, GameAction } from "@/lib/game-reducer";
import { Button } from "@/components/ui/button";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

function QuestionCard({ question }: { question: string }) {
  return (
    <div className="w-full rounded-xl border border-border bg-card p-6">
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
            <span className="text-destructive">{imposterName}</span> was caught!
          </h1>

          <p className="text-sm text-white/70">
            {imposterName} must answer:
          </p>

          <QuestionCard question={state.drawnQuestion} />

          <Button
            onClick={() => dispatch({ type: "DRAW_QUESTION" })}
            disabled={state.reDrawUsed}
            variant="outline"
            size="lg"
            className="w-full min-h-[44px] rounded-2xl text-base font-medium"
          >
            Draw Again
          </Button>

          <Button
            onClick={() => dispatch({ type: "NEW_ROUND", words })}
            variant="default"
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold"
          >
            New Round
          </Button>
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
            <span className="text-destructive">{imposterName}</span> escaped!
          </h1>

          <p className="text-sm text-white/70">
            Hand the phone to {imposterName}
          </p>

          <QuestionCard question={state.drawnQuestion} />

          <Button
            onClick={() => dispatch({ type: "DRAW_QUESTION" })}
            disabled={state.reDrawUsed}
            variant="outline"
            size="lg"
            className="w-full min-h-[44px] rounded-2xl text-base font-medium"
          >
            Draw Again
          </Button>

          <Button
            onClick={() => dispatch({ type: "PICK_PLAYER" })}
            variant="default"
            size="lg"
            className="h-14 w-full rounded-2xl text-base font-semibold"
          >
            Choose Who Answers
          </Button>
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

            <Button
              onClick={() => {
                setSelectedPlayer(null);
                dispatch({ type: "NEW_ROUND", words });
              }}
              variant="default"
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-semibold"
            >
              New Round
            </Button>
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
              <Button
                key={name}
                onClick={() => setSelectedPlayer(name)}
                variant="ghost"
                size="lg"
                className="h-12 w-full rounded-2xl bg-card text-base font-medium hover:bg-muted/80"
              >
                {name}
              </Button>
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
