"use client";

import { GameState, GameAction } from "@/lib/game-reducer";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

export function Discussion({ state, dispatch }: GameComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-white">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <p className="text-lg text-gray-400">Everyone has seen their card</p>

        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-gray-400">Starting player:</p>
          <p className="text-5xl font-bold">{state.starterName}</p>
        </div>

        <p className="text-center text-gray-300 text-lg leading-relaxed">
          Go around the circle. Say one word related to your word. Two rounds.
          Then vote.
        </p>

        <button
          onClick={() => dispatch({ type: "SHOW_REVEAL" })}
          className="w-full h-14 rounded-lg bg-purple-600 text-white text-lg font-semibold active:bg-purple-700 transition-colors mt-auto"
        >
          Done — Reveal Imposter
        </button>
      </div>
    </div>
  );
}
