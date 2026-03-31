"use client";

import type { LieDetectorState, LieDetectorAction } from "@/lib/lie-detector-reducer";
import { Button } from "@/components/ui/button";

interface StorytellingProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
}

export function Storytelling({ state, dispatch }: StorytellingProps) {
  return (
    <div className="flex min-h-screen flex-col px-6 py-8">
      {/* Prompt card */}
      <div className="rounded-xl border border-white/10 bg-[#1a1a1a] px-6 py-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Prompt
        </p>
        <p className="text-xl font-medium text-white">
          {state.prompt.text}
        </p>
      </div>

      {/* Storytellers */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Storytellers
        </h2>
        <ul className="space-y-3">
          {state.storytellerOrder.map((playerIndex, i) => (
            <li
              key={playerIndex}
              className="flex items-center gap-3 rounded-xl bg-card px-5 py-4"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-lg font-medium text-white">
                {state.players[playerIndex]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Each storyteller tells their story. Ask follow-up questions. Then vote.
      </p>

      {/* Time to Vote button */}
      <div className="mt-auto pt-8">
        <Button
          onClick={() => dispatch({ type: "START_VOTING" })}
          className="h-14 w-full rounded-2xl text-lg font-semibold"
        >
          Time to Vote
        </Button>
      </div>
    </div>
  );
}
