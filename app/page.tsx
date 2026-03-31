"use client";

import Link from "next/link";
import { Settings } from "lucide-react";

const GAMES = [
  {
    name: "Imposter",
    description: "One word. One imposter. Can you blend in?",
    href: "/imposter",
    color: "bg-purple-600",
  },
  {
    name: "Lie Detector",
    description: "True story or total fiction? You decide.",
    href: "/lie-detector",
    color: "bg-green-600",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col px-6 pb-8 pt-6">
      <div className="relative flex items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          RECOVERY CIRCLE
        </h1>
        <Link
          href="/settings"
          className="absolute right-0 rounded-full p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
        >
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </Link>
      </div>

      <p className="mt-2 text-center text-muted-foreground">
        Sacred Journey Recovery
      </p>

      <div className="mt-10 flex flex-1 flex-col gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-card p-6 transition-colors hover:bg-[#252525]"
          >
            <div className="flex items-center gap-3">
              <div className={`h-3 w-3 rounded-full ${game.color}`} />
              <h2 className="text-xl font-bold text-white">{game.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{game.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
