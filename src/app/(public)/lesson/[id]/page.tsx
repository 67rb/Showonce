import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import Link from "next/link";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { SerifAccent } from "@/components/Reveal";

type NodeState = "done" | "current" | "upcoming";

export default async function LessonOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  const lesson = sampleLesson;
  const total = lesson.steps.length;
  // Deterministic design-state mapping from the fixture's visibleState:
  // the first step that is not "Done" is the CURRENT step; "Done" steps are
  // complete; everything after the current step is upcoming.
  const currentIdx =
    lesson.steps.findIndex((st) => st.visibleState !== "Done");
  const doneCount = currentIdx === -1 ? total : currentIdx;
  const lastIdx = total - 1;

  const nodeState = (i: number): NodeState =>
    lesson.steps[i].visibleState === "Done"
      ? "done"
      : i === currentIdx
        ? "current"
        : "upcoming";

  const nodeClass = (state: NodeState) => {
    if (state === "done")
      return "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-site-ink text-white";
    if (state === "current")
      return "h-6 w-6 shrink-0 rounded-full border-2 border-accent bg-site-ink";
    return "h-6 w-6 shrink-0 rounded-full border-2 border-site-border-2 bg-transparent";
  };

  return (
    <div className="bg-site-page min-h-dvh">
      <div className="mx-auto w-full max-w-[430px] px-4 py-10 lg:max-w-[1000px]">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 font-body-ui text-small font-medium text-site-muted transition-colors duration-[150ms] hover:text-site-ink"
        >
          <span aria-hidden>←</span>
          {s.yourLessonsLink}
        </Link>

        <header className="mt-4">
          <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight tracking-tight text-site-ink">
            <SerifAccent text={lesson.title} />
          </h1>
          <p className="mt-2 font-body-ui text-small text-site-muted">
            {lesson.meta}
          </p>
          <p className="mt-1 font-body-ui text-small text-site-muted">
            {doneCount} / {total} {s.stepsSuffix}
          </p>
        </header>

        <div className="mt-8 lg:grid lg:grid-cols-[1fr_1.5fr] lg:gap-12">
          {/* lesson summary — large finished-step visual */}
          <section className="self-start rounded-[24px] border border-site-border bg-white p-3">
            <div className="aspect-[4/3] w-full overflow-hidden rounded-[14px]">
              <KeyframeVisual
                spec={lesson.steps[lastIdx].keyframe}
                label={lesson.title}
                variant="step"
                fit
                className="h-full"
              />
            </div>
          </section>

          <div className="mt-8 lg:mt-0">
            {/* THE PATH — vertical connecting line, one node per step */}
            <ol className="flex flex-col">
              {lesson.steps.map((step, i) => {
                const state = nodeState(i);
                const segmentInk =
                  i < lastIdx && nodeState(i + 1) !== "upcoming";
                return (
                  <li key={step.caption} className="flex gap-4">
                    <div className="flex w-8 shrink-0 flex-col items-center">
                      <span className={nodeClass(state)}>
                        {state === "done" && (
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
                        )}
                      </span>
                      {i < lastIdx && (
                        <span
                          className={
                            "w-px flex-1 " +
                            (segmentInk ? "bg-site-ink/70" : "bg-site-border")
                          }
                        />
                      )}
                    </div>

                    <div
                      className={
                        "mb-5 min-w-0 flex-1 rounded-2xl p-4 " +
                        (state === "current"
                          ? "border border-site-border bg-white shadow-sm"
                          : "")
                      }
                    >
                      <p
                        className={
                          "font-display-ui text-[1.25rem] font-bold leading-tight text-site-ink"
                        }
                      >
                        {step.caption}
                      </p>
                      {state === "current" && step.visibleState && (
                        <p className="mt-1 font-body-ui text-small text-site-muted">
                          {step.visibleState}
                        </p>
                      )}
                      {state === "done" && (
                        <p className="mt-1 font-body-ui text-small font-medium text-site-muted">
                          ✓ {s.doneStep}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>

            {/* MODE CHOICE */}
            <div className="mt-2">
              <h2 className="font-display-ui text-[1.5rem] font-bold leading-heading text-site-ink">
                {s.modeHeading}
              </h2>
              <div className="mt-3 grid gap-3">
                <Link
                  href="/lesson/sample/play"
                  className="rounded-full bg-[#16161A] px-5 py-3 text-center font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
                >
                  {s.modeStepByStep}
                </Link>
                <p className="mt-1 text-center font-body-ui text-small text-site-muted">
                  {s.modeStepByStepDesc}
                </p>

                <Link
                  href="/lesson/sample/live"
                  className="rounded-full border border-site-border-2 bg-white px-5 py-3 text-center font-body-ui text-body font-semibold text-site-ink transition-colors duration-[150ms] hover:bg-site-page"
                >
                  {s.modeLive}
                </Link>
                <div className="flex items-center justify-center gap-2">
                  <p className="font-body-ui text-small text-site-muted">
                    {s.modeLiveDesc}
                  </p>
                  <span className="rounded-full border border-site-border bg-site-page px-2.5 py-1 text-caption font-medium text-site-muted">
                    {s.modeLiveChip}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}