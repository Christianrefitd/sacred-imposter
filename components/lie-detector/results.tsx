"use client";

import type { LieDetectorState, LieDetectorAction } from "@/lib/lie-detector-reducer";
import type { Prompt } from "@/lib/prompts";
import type { PromptMode } from "@/lib/lie-detector-reducer";
import { Button } from "@/components/ui/button";

interface ResultsProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
  prompts: Prompt[];
  promptMode: PromptMode;
}

function VoteBreakdown({ state }: { state: LieDetectorState }) {
  return (
    <div className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Vote Breakdown
      </p>
      <ul className="space-y-2">
        {state.storytellerOrder.map((playerIndex) => {
          const votes = state.voteCounts[playerIndex] ?? 0;
          const isTruth = playerIndex === state.truthTellerIndex;
          return (
            <li key={playerIndex} className="flex items-center justify-between">
              <span
                className={`font-medium ${
                  isTruth ? "text-[#16a34a]" : "text-white"
                }`}
              >
                {state.players[playerIndex]}
                {isTruth && (
                  <span className="ml-2 text-xs text-[#16a34a]/70">
                    Truth Teller
                  </span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                {votes} {votes === 1 ? "vote" : "votes"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Results({ state, dispatch, prompts, promptMode }: ResultsProps) {
  const truthTellerName = state.players[state.truthTellerIndex];

  const headline =
    state.phase === "caught"
      ? "The group caught the truth!"
      : "The truth was hiding in plain sight!";

  function handleNewRound() {
    dispatch({ type: "NEW_ROUND", prompts, promptMode });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 text-white">
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <h1 className="text-center text-2xl font-bold">{headline}</h1>

        <p className="text-sm text-white/70">
          <span className="font-semibold text-[#16a34a]">
            {truthTellerName}
          </span>{" "}
          was the Truth Teller
        </p>

        <VoteBreakdown state={state} />

        <div className="w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-5 py-3">
          <p className="text-xs text-muted-foreground">Prompt</p>
          <p className="text-base text-white">{state.prompt.text}</p>
        </div>

        <Button
          onClick={handleNewRound}
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
