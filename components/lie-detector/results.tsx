"use client";

import { useState } from "react";
import type { LieDetectorState, LieDetectorAction } from "@/lib/lie-detector-reducer";
import type { Prompt } from "@/lib/prompts";
import type { PromptMode } from "@/lib/lie-detector-reducer";
import { Button } from "@/components/ui/button";

interface ResultsProps {
  state: LieDetectorState;
  dispatch: React.Dispatch<LieDetectorAction>;
  prompts: Prompt[];
  questions: string[];
  promptMode: PromptMode;
}

function QuestionCard({ question }: { question: string }) {
  return (
    <div className="w-full rounded-xl border border-border bg-card p-6">
      <p className="text-lg leading-relaxed text-white">{question}</p>
    </div>
  );
}

function VoteBreakdown({
  state,
}: {
  state: LieDetectorState;
}) {
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

export function Results({
  state,
  dispatch,
  prompts,
  questions,
  promptMode,
}: ResultsProps) {
  const [fooledStep, setFooledStep] = useState<
    "reveal" | "handoff" | "question" | "selected"
  >("reveal");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const truthTellerName = state.players[state.truthTellerIndex];

  function handleNewRound() {
    setFooledStep("reveal");
    setSelectedPlayer(null);
    dispatch({
      type: "NEW_ROUND",
      prompts,
      questions,
      promptMode,
    });
  }

  // ---------------------------------------------------------------------------
  // Phase: caught
  // ---------------------------------------------------------------------------
  if (state.phase === "caught") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-white">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
          <h1 className="text-2xl font-bold">The group caught the truth!</h1>

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

          <p className="text-sm text-white/70">
            {truthTellerName} must answer:
          </p>

          <QuestionCard question={state.drawnQuestion} />

          <Button
            onClick={() =>
              dispatch({ type: "DRAW_QUESTION", questions })
            }
            disabled={state.reDrawUsed}
            variant="outline"
            size="lg"
            className="w-full min-h-[44px] rounded-2xl text-base font-medium"
          >
            Draw Again
          </Button>

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

  // ---------------------------------------------------------------------------
  // Phase: fooled — multi-step flow
  // ---------------------------------------------------------------------------
  if (state.phase === "fooled") {
    // Step 1: Reveal (visible to all)
    if (fooledStep === "reveal") {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 text-white">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <h1 className="text-2xl font-bold">
              The truth was hiding in plain sight!
            </h1>

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
              onClick={() => setFooledStep("handoff")}
              variant="default"
              size="lg"
              className="h-14 w-full rounded-2xl text-base font-semibold"
            >
              Hand the phone to {truthTellerName}
            </Button>
          </div>
        </div>
      );
    }

    // Step 2: Handoff gate
    if (fooledStep === "handoff") {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center px-6 py-8">
          <h1 className="mb-6 text-center text-5xl font-bold tracking-tight text-white">
            {truthTellerName}
          </h1>
          <p className="mb-10 text-center text-lg text-muted-foreground">
            Hand the phone to {truthTellerName}
          </p>
          <Button
            onClick={() => setFooledStep("question")}
            variant="outline"
            className="h-14 w-full max-w-xs rounded-2xl border-primary text-lg font-semibold text-primary hover:bg-primary/10"
          >
            Tap to Continue
          </Button>
        </div>
      );
    }

    // Step 3: Truth Teller sees question + picks a player
    if (fooledStep === "question") {
      const otherPlayers = state.players.filter(
        (_, i) => i !== state.truthTellerIndex
      );

      return (
        <div className="flex min-h-screen items-center justify-center px-4 text-white">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <QuestionCard question={state.drawnQuestion} />

            <Button
              onClick={() =>
                dispatch({ type: "DRAW_QUESTION", questions })
              }
              disabled={state.reDrawUsed}
              variant="outline"
              size="lg"
              className="w-full min-h-[44px] rounded-2xl text-base font-medium"
            >
              Draw Again
            </Button>

            <h2 className="text-xl font-bold">Who must answer?</h2>

            <div className="flex w-full flex-col gap-3">
              {otherPlayers.map((name) => (
                <Button
                  key={name}
                  onClick={() => {
                    setSelectedPlayer(name);
                    setFooledStep("selected");
                  }}
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

    // Step 4: After selection — show who answers
    if (fooledStep === "selected" && selectedPlayer) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4 text-white">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <p className="text-sm text-white/70">
              {selectedPlayer} answers:
            </p>

            <QuestionCard question={state.drawnQuestion} />

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
  }

  // ---------------------------------------------------------------------------
  // Phase: pick-player (shouldn't be reached in Lie Detector flow but included
  // for completeness — the fooled flow manages player picking internally)
  // ---------------------------------------------------------------------------

  return null;
}
