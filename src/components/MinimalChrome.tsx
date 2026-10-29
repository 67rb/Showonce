"use client";
import s from "@/lib/strings";
import {useIdentity} from "@/components/learning/Identity";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/Wordmark";
import { ProgressSteps } from "@/components/ProgressSteps";
import { proBreadboardLesson } from "@/design/fixtures";
import Link from "next/link";

/** Minimal chrome for player, camera, live and completion screens. The
    completion screen must never show a partial/progress state, so on /complete
    the progress reads fully complete and the mid-lesson Exit action is hidden
    (leaving is the bottom action's job there). Everywhere else it shows the
    active player progress + Exit, as before. On Professional paths (4.3) the
    same logic applies with Professional green progress and a Professional Exit
    target — Hobby behaviour is unchanged. The Professional screens are
    design-live (no identity practice), so progress derives from the breadboard
    sample's done/total, full on its complete screen. */
export function MinimalChrome() {
  const pathname = usePathname();
  const isProfessional = !!pathname && pathname.startsWith("/professional");
  const isComplete = !!pathname && pathname.includes("/complete");
  const identity=useIdentity();
  const practice=identity.ready?identity.practice:null;
  const total=practice?.total||0;

  const proLesson = isProfessional ? proBreadboardLesson : null;
  const proDone = proLesson ? proLesson.steps.filter((st) => st.visibleState === "Done").length : 0;
  const proTotal = proLesson ? proLesson.stepCount : 0;

  const showProgress = !!(practice || proLesson);
  const current = isComplete
    ? (proLesson ? proTotal : total)
    : (proLesson ? proDone : practice?.current || 0);
  const barTotal = proLesson ? proTotal : total;
  const accent = isProfessional ? "bg-[#16A34A]" : "bg-accent";

  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
      <Wordmark
        href="/"
        size="sm"
        onceClassName={isProfessional ? "text-[#16A34A]" : undefined}
      />
      <div className="min-w-0 flex-1">
        {showProgress && (
          <ProgressSteps accentClass={accent} current={current} total={barTotal} />
        )}
      </div>
      {!isComplete && (
        <Link
          href={isProfessional ? "/professional/lessons" : "/lessons"}
          className="shrink-0 text-small font-medium text-muted transition-colors duration-[150ms] hover:text-ink"
        >
          {s.exitLesson}
        </Link>
      )}
    </header>
  );
}