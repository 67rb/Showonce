"use client";
import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/Wordmark";
import { ProgressSteps } from "@/components/ProgressSteps";
import Link from "next/link";

/** Minimal chrome for player, camera, live and completion screens. The
    completion screen must never show a partial/progress state, so on /complete
    the progress reads fully complete and the mid-lesson Exit action is hidden
    (leaving is the bottom action's job there). Everywhere else it shows the
    active player progress + Exit, as before. */
export function MinimalChrome() {
  const pathname = usePathname();
  const isComplete = !!pathname && pathname.includes("/complete");
  const total = sampleLesson.stepCount;

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <Wordmark href="/" size="sm" />
      <div className="min-w-0 flex-1">
        {isComplete ? (
          <ProgressSteps current={total} total={total} />
        ) : (
          <ProgressSteps current={2} total={total} />
        )}
      </div>
      {!isComplete && (
        <Link
          href="/lessons"
          className="shrink-0 text-small font-medium text-muted transition-colors duration-[150ms] hover:text-ink"
        >
          {s.exitLesson}
        </Link>
      )}
    </header>
  );
}