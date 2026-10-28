import s from "@/lib/strings";
import { sampleLesson, sessionResult } from "@/design/fixtures";

import Link from "next/link";
import { Magnetic } from "@/components/Magnetic";

export default function CompletePage() {
  return (
    <div className="relative min-h-[100svh] overflow-hidden bg-site-page">
      {/* celebratory warm glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[360px] w-[560px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(245,158,11,0.35), transparent)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(rgba(22,22,26,0.05) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-20 pb-12 text-center">
        {/* completion medallion */}
        <div className="relative inline-flex">
          <div
            aria-hidden
            className="absolute -inset-3 rounded-full bg-accent/20 blur-2xl"
          />
          <span
            aria-hidden
            className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-accent bg-white/80 text-4xl font-bold leading-none text-accent shadow-[0_0_50px_rgba(245,158,11,0.6)] backdrop-blur-sm"
          >
            ✓
          </span>
        </div>

        <div className="mt-8 inline-block">
          <h1 className="font-display-ui text-[3rem] font-extrabold leading-tight text-site-ink">
            {s.completeHeading}
          </h1>
          <div
            aria-hidden
            className="mx-auto mt-2 h-1 w-14 rounded-full bg-accent shadow-[0_0_14px_rgba(245,158,11,0.8)]"
          />
        </div>
        <p className="font-display-ui mt-3 text-[1.5rem] font-semibold leading-heading text-site-ink">
          {sampleLesson.title}
        </p>

        {/* summary card */}
        <div className="mt-8 rounded-[28px] border border-site-border bg-white p-6 text-left shadow-[0_20px_50px_-30px_rgba(22,22,26,0.5)]">
          <dl className="space-y-3">
            <div className="flex items-center justify-between">
              <dt className="font-body-ui text-small text-site-muted">
                {s.completeTotalTimeLabel}
              </dt>
              <dd className="font-display-ui text-lg font-bold text-site-ink">
                {sessionResult.totalTime}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="font-body-ui text-small text-site-muted">
                {s.completeStepsCompletedLabel}
              </dt>
              <dd className="font-display-ui text-lg font-bold text-success">
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

        {/* actions */}
        <div className="mt-8 flex flex-col gap-2">
          <Magnetic className="block w-full">
            <Link
              href="/lessons"
              className="btn-shine block rounded-full bg-accent px-5 py-3.5 text-center font-body-ui text-body font-semibold text-[#16161A] shadow-[0_14px_40px_-12px_rgba(245,158,11,0.9)] transition-all duration-[150ms] hover:brightness-105"
            >
              {s.backToYourLessons}
            </Link>
          </Magnetic>
          <Link
            href="/create"
            className="rounded-full border border-site-border-2 bg-white px-5 py-3 text-center font-body-ui text-body font-semibold text-site-ink transition-colors duration-[150ms] hover:bg-site-page"
          >
            {s.learnAnother}
          </Link>
        </div>
      </div>
    </div>
  );
}