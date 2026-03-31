"use client";

import { useState } from "react";
import { GameState, GameAction } from "@/lib/game-reducer";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

export function Reveal({ state, dispatch }: GameComponentProps) {
  const [revealed, setRevealed] = useState(false);

  if (!revealed) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-white">
        <div className="flex flex-col items-center gap-8 w-full max-w-md">
          <p className="text-2xl text-gray-400 animate-pulse">
            The votes are in...
          </p>

          <button
            onClick={() => setRevealed(true)}
            className="w-full h-16 rounded-2xl bg-destructive text-white text-xl font-bold active:scale-95 transition-transform"
          >
            Tap to Reveal the Imposter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-white">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <p className="text-lg text-gray-400">The imposter was...</p>

        <div className="flex flex-col items-center gap-2 rounded-xl border border-destructive/40 px-8 py-6 shadow-[0_0_24px_rgba(220,38,38,0.15)]">
          <p className="text-5xl font-bold text-destructive">
            {state.players[state.imposterIndex]}
          </p>
        </div>

        <p className="text-xl text-gray-300">
          The word was:{" "}
          <span className="font-bold text-primary">{state.word}</span>
        </p>

        <div className="flex flex-col gap-3 w-full mt-4">
          <button
            onClick={() => dispatch({ type: "CAUGHT" })}
            className="w-full h-14 rounded-2xl bg-primary text-primary-foreground text-lg font-semibold active:bg-primary/80 transition-colors"
          >
            Caught!
          </button>
          <button
            onClick={() => dispatch({ type: "ESCAPED" })}
            className="w-full h-14 rounded-2xl border border-destructive text-destructive text-lg font-semibold active:bg-destructive/10 transition-colors"
          >
            Escaped!
          </button>
        </div>
      </div>
    </div>
  );
}
