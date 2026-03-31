"use client";

import { GameState, GameAction } from "@/lib/game-reducer";
import { Button } from "@/components/ui/button";

interface GameComponentProps {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  words: string[];
}

export function Discussion({ state, dispatch }: GameComponentProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-white">
      <div className="flex flex-col items-center gap-8 w-full max-w-md">
        <p className="text-lg text-muted-foreground">Everyone has seen their card</p>

        <div className="flex flex-col items-center gap-2">
          <p className="text-lg text-muted-foreground">Starting player:</p>
          <p className="text-5xl font-bold">{state.starterName}</p>
        </div>

        <p className="text-center text-muted-foreground text-lg leading-relaxed">
          Go around the circle. Say one word related to your word. Two rounds.
          Then vote.
        </p>

        <Button
          onClick={() => dispatch({ type: "SHOW_REVEAL" })}
          variant="default"
          size="lg"
          className="w-full h-14 rounded-2xl text-lg font-semibold mt-auto"
        >
          Done — Reveal Imposter
        </Button>
      </div>
    </div>
  );
}
