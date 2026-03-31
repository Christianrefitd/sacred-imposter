"use client";

import { GameState, GameAction } from "@/lib/game-reducer";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

export function QuestionDraw({ state }: GameComponentProps) {
  return (
    <div className="flex items-center justify-center min-h-screen text-white">
      {state.phase}
    </div>
  );
}
