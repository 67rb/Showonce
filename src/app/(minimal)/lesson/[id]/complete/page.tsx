import s from "@/lib/strings";
import { sampleLesson, sessionResult } from "@/design/fixtures";

import Link from "next/link";

export default function CompletePage() {
  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      {/* completion medallion — amber ring, soft amber tint fill, amber check */}
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

      {/* summary card */}
      <div className="mt-6 rounded-[24px] border border-site-border bg-white p-5">
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

      {/* bottom actions — leaving is this screen's job */}
      <div className="mt-8 flex flex-col gap-2">
        <Link
          href="/lessons"
          className="rounded-full bg-[#16161A] px-5 py-3 text-center font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
        >
          {s.backToYourLessons}
        </Link>
        <Link
          href="/create"
          className="rounded-full border border-site-border-2 bg-white px-5 py-3 text-center font-body-ui text-body font-semibold text-site-ink transition-colors duration-[150ms] hover:bg-site-page"
        >
          {s.learnAnother}
        </Link>
      </div>
    </div>
  );
}