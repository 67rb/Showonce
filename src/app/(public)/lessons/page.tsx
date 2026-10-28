import s from "@/lib/strings";
import {
  libraryLessons,
  sampleLesson,
  mosaicLesson,
  wallLesson,
} from "@/design/fixtures";

import Link from "next/link";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { SerifAccent } from "@/components/Reveal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Magnetic } from "@/components/Magnetic";
import { ShaderBackdrop } from "@/components/ShaderBackdrop";

const lessonByKey: Record<string, (typeof sampleLesson)[]> = {
  sample: [sampleLesson],
  mosaic: [mosaicLesson],
  wall: [wallLesson],
};

type ProgressState = "completed" | "in-progress" | "not-started";

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ state?: string }>;
}) {
  const { state } = await searchParams;
  const empty = state === "empty";

  return (
    <div className="-mt-24 relative min-h-[100svh] overflow-hidden">
      {/* cinematic amber wave backdrop (dark) */}
      <ShaderBackdrop />
      {/* header veil for white text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-black/70 via-black/30 to-transparent"
      />

      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 pt-36 pb-24">
        {/* header */}
        <header className="text-center">
          <h1 className="font-display-ui text-[3rem] font-extrabold leading-tight tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.7)]">
            <SerifAccent text={s.lessonsHeading} />
          </h1>
          <div
            aria-hidden
            className="mx-auto mt-3 h-1 w-16 rounded-full bg-accent shadow-[0_0_16px_rgba(245,158,11,0.95)]"
          />
          <Magnetic className="mt-6 inline-block">
            <Link
              href="/create"
              className="btn-shine inline-block rounded-full bg-accent px-6 py-2.5 text-small font-semibold text-[#16161A] shadow-[0_12px_34px_-12px_rgba(245,158,11,0.95)] transition-all duration-[150ms] hover:brightness-105"
            >
              {s.newLesson}
            </Link>
          </Magnetic>
        </header>

        {empty ? (
          <div className="mt-14 rounded-[32px] border border-white/40 bg-white/25 px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl">
            <p className="font-body-ui text-body text-site-ink/80">
              {s.lessonsEmptyLine}
            </p>
            <Magnetic className="mt-6 inline-block">
              <Link
                href="/create"
                className="btn-shine inline-block rounded-full bg-accent px-6 py-2.5 text-small font-semibold text-[#16161A] transition-all duration-[150ms] hover:brightness-105"
              >
                {s.lessonsEmptyButton}
              </Link>
            </Magnetic>
          </div>
        ) : (
          <div className="mt-14 flex flex-col gap-4">
            {libraryLessons.map((lessonMeta, idx) => {
              const fixture = lessonByKey[lessonMeta.id]?.[0];
              const steps = fixture?.steps ?? [];
              const total = steps.length;
              const done = steps.filter(
                (st) => st.visibleState !== "Not started",
              ).length;
              const progress: ProgressState =
                total === 0
                  ? "not-started"
                  : done >= total
                    ? "completed"
                    : done === 0
                      ? "not-started"
                      : "in-progress";
              const fraction = total ? done / total : 0;
              const keyframe = steps[steps.length - 1]?.keyframe;
              const source =
                lessonMeta.meta.split(" · ")[1] ?? lessonMeta.meta;

              return (
                <SpotlightCard
                  key={lessonMeta.id}
                  className="rounded-[28px] border border-white/40 bg-gradient-to-b from-white/70 via-white/35 to-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.75),0_20px_50px_-24px_rgba(0,0,0,0.85)] backdrop-blur-2xl"
                >
                  <Link
                    href={`/lesson/${lessonMeta.id}`}
                    className="group flex gap-4 p-4 transition-transform duration-[150ms] hover:-translate-y-1"
                  >
                    {/* framed, glowing thumbnail */}
                    <div className="relative h-20 w-20 shrink-0">
                      <div
                        aria-hidden
                        className="absolute -inset-1 rounded-xl bg-gradient-to-br from-accent/70 to-orange-300/30 blur-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      />
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-white/40 shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)]">
                        {keyframe ? (
                          <KeyframeVisual
                            spec={keyframe}
                            label={lessonMeta.title}
                            variant="step"
                            fit
                            className="h-full"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="font-display-ui truncate text-xl font-bold leading-tight text-site-ink">
                          {lessonMeta.title}
                        </h3>
                        <span
                          aria-hidden
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/60 bg-white/40 text-site-ink transition-all duration-[150ms] group-hover:border-accent group-hover:bg-accent group-hover:text-[#16161A]"
                        >
                          →
                        </span>
                      </div>
                      <p className="mt-1 font-body-ui text-small font-medium text-site-ink/70">
                        {String(idx + 1).padStart(2, "0")} ·{" "}
                        {lessonMeta.stepCount} {s.stepsSuffix} · {source}
                      </p>
                      {progress === "completed" && (
                        <p className="mt-1.5 inline-flex items-center gap-1 font-body-ui text-small font-semibold text-success">
                          <svg
                            aria-hidden
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                          {s.doneStep}
                        </p>
                      )}
                      {progress === "in-progress" && (
                        <div className="mt-2 h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-black/20">
                          <div
                            className="h-full rounded-full bg-accent"
                            style={{ width: `${fraction * 100}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                </SpotlightCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}