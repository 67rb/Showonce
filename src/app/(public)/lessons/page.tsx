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
    <div className="bg-site-page min-h-dvh">
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
            <SerifAccent text={s.lessonsHeading} />
          </h1>
          <Link
            href="/create"
            className="shrink-0 rounded-full bg-[#16161A] px-5 py-2.5 text-small font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
          >
            {s.newLesson}
          </Link>
        </div>

        {empty ? (
          <div className="mt-10 rounded-[20px] border border-dashed border-site-border-2 bg-white px-6 py-14 text-center">
            <p className="font-body-ui text-body text-site-muted">
              {s.lessonsEmptyLine}
            </p>
            <Link
              href="/create"
              className="mt-6 inline-block rounded-full bg-[#16161A] px-6 py-2.5 text-small font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
            >
              {s.lessonsEmptyButton}
            </Link>
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-3">
            {libraryLessons.map((lessonMeta) => {
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
                <Link
                  key={lessonMeta.id}
                  href={`/lesson/${lessonMeta.id}`}
                  className="group flex gap-4 rounded-[20px] border border-site-border bg-white p-3 transition-colors duration-[150ms] hover:bg-site-page/70"
                >
                  <div className="h-[88px] w-[88px] shrink-0 overflow-hidden rounded-lg">
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
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display-ui truncate text-[1.25rem] font-bold leading-tight text-site-ink">
                      {lessonMeta.title}
                    </h3>
                    <p className="mt-1 font-body-ui text-small text-site-muted">
                      {lessonMeta.stepCount} {s.stepsSuffix} · {source}
                    </p>
                    {progress === "completed" && (
                      <p className="mt-1.5 inline-flex items-center gap-1 font-body-ui text-small font-medium text-success">
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
                      <div className="mt-2 h-1 w-full max-w-[160px] overflow-hidden rounded-full bg-site-border">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${fraction * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <span
                    aria-hidden
                    className="self-center text-2xl leading-none text-site-ink transition-colors duration-[150ms] group-hover:text-accent"
                  >
                    →
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}