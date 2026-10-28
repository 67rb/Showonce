import s from "@/lib/strings";
import { sampleLesson, sessionResult } from "@/design/fixtures";

import { Button } from "@/components/Button";
import { Reveal, RevealGroup } from "@/components/Reveal";

export default function CompletePage() {
  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <RevealGroup>
        <Reveal>
          <div className="flex flex-col items-center text-center">
            <span
              aria-hidden
              className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-accent bg-accent/10 text-3xl font-bold leading-none text-accent"
            >
              ✓
            </span>
            <h1 className="font-display-ui mt-6 text-[3rem] font-extrabold leading-tight text-site-ink">
              {s.completeHeading}
            </h1>
            <p className="font-display-ui mt-2 text-[1.5rem] font-semibold leading-heading text-site-ink">
              {sampleLesson.title}
            </p>
          </div>
        </Reveal>
      </RevealGroup>

      <div className="site-card mt-6 p-6">
        <dl className="space-y-3">
          <div className="flex items-center justify-between">
            <dt className="font-body-ui text-small text-site-muted">
              {s.completeTotalTimeLabel}
            </dt>
            <dd className="font-body-ui text-body font-semibold text-site-ink">
              {sessionResult.totalTime}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="font-body-ui text-small text-site-muted">
              {s.completeStepsCompletedLabel}
            </dt>
            <dd className="font-body-ui text-body font-semibold text-site-ink">
              {sessionResult.stepsCompleted}
            </dd>
          </div>
        </dl>
        <div className="mt-4 border-t border-site-border pt-4">
          <p className="font-body-ui text-small font-medium text-site-muted">
            {s.completeNeededMoreLabel}
          </p>
          <ul className="mt-2 space-y-1">
            {sessionResult.neededMoreThanOneCheck.map((line) => (
              <li key={line} className="font-body-ui text-small text-site-ink">
                {line}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        <Button href="/lessons" className="w-full">
          {s.backToYourLessons}
        </Button>
        <Button href="/create" variant="secondary" className="w-full">
          {s.learnAnother}
        </Button>
      </div>
    </div>
  );
}