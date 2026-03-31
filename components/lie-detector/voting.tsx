"use client";

import { useState } from "react";
import type { LieDetectorState, LieDetectorAction } from "@/lib/lie-detector-reducer";
import { Button } from "@/components/ui/button";

interface VotingProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
  questions: string[];
}

export function Voting({ state, dispatch, questions }: VotingProps) {
  const [showVoteScreen, setShowVoteScreen] = useState(false);

  // ---------------------------------------------------------------------------
  // Phase: vote-complete — all votes are in
  // ---------------------------------------------------------------------------
  if (state.phase === "vote-complete") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
        <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          All votes are in
        </p>
        <h1 className="mb-10 animate-pulse text-center text-4xl font-extrabold tracking-tight text-white">
          The moment of truth...
        </h1>
        <Button
          onClick={() =>
            dispatch({ type: "SHOW_RESULTS", questions })
          }
          className="h-14 w-full max-w-xs rounded-2xl text-lg font-semibold"
        >
          Reveal Truth
        </Button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Phase: voting — pass-around
  // ---------------------------------------------------------------------------
  const currentDetectorIndex = state.detectorIndices[state.currentVoterIndex];
  const currentDetectorName = state.players[currentDetectorIndex];

  // Pass prompt (hand phone to detector)
  if (!showVoteScreen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Detector {state.currentVoterIndex + 1} of{" "}
          {state.detectorIndices.length}
        </p>

        <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-white">
          {currentDetectorName}
        </h1>

        <p className="mb-10 text-center text-lg text-muted-foreground">
          Hand the phone to {currentDetectorName}
        </p>

        <Button
          onClick={() => setShowVoteScreen(true)}
          variant="outline"
          className="h-14 w-full max-w-xs rounded-2xl border-primary text-lg font-semibold text-primary hover:bg-primary/10"
        >
          Tap to Vote
        </Button>
      </div>
    );
  }

  // Vote screen — pick a storyteller
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
      <p className="mb-2 text-sm font-medium uppercase tracking-wider text-muted-foreground">
        {currentDetectorName}&apos;s Vote
      </p>
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-white">
        Who is the Truth Teller?
      </h1>

      <div className="flex w-full max-w-sm flex-col gap-3">
        {state.storytellerOrder.map((playerIndex) => (
          <Button
            key={playerIndex}
            onClick={() => {
              dispatch({ type: "CAST_VOTE", votedForIndex: playerIndex });
              setShowVoteScreen(false);
            }}
            variant="outline"
            className="h-14 rounded-2xl text-lg font-medium"
          >
            {state.players[playerIndex]}
          </Button>
        ))}
      </div>
    </div>
  );
}
