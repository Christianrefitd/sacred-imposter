import { Settings } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6">
      <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
        SACRED IMPOSTER
      </h1>
      <p className="text-muted-foreground text-lg">
        A game of sacred deception
      </p>
      <div className="flex flex-col items-center gap-4">
        <button className="rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white transition-colors hover:bg-primary/90 active:bg-primary/80">
          Start Game
        </button>
        <button className="rounded-full p-3 text-muted-foreground transition-colors hover:bg-card hover:text-foreground">
          <Settings className="h-6 w-6" />
          <span className="sr-only">Settings</span>
        </button>
      </div>
    </div>
  );
}
