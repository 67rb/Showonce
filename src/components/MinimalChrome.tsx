import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import { Wordmark } from "@/components/Wordmark";
import { ProgressSteps } from "@/components/ProgressSteps";
import Link from "next/link";

/** Minimal chrome for player, camera, live and completion screens. */
export function MinimalChrome() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <Wordmark href="/" size="sm" />
      <div className="min-w-0 flex-1">
        <ProgressSteps current={2} total={sampleLesson.stepCount} />
      </div>
      <Link
        href="/lessons"
        className="shrink-0 text-small font-medium text-muted transition-colors duration-[150ms] hover:text-ink"
      >
        {s.exitLesson}
      </Link>
    </header>
  );
}