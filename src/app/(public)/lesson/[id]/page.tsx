import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import { KeyframeVisual } from "@/components/KeyframeVisual";
import { Button } from "@/components/Button";
import { ModeChoice } from "@/components/ModeChoice";
import { Reveal, RevealGroup, SerifAccent } from "@/components/Reveal";

export default async function LessonOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  const lesson = sampleLesson;
  const finalStep = lesson.steps[lesson.steps.length - 1];

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <RevealGroup>
        <Reveal>
          <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight text-site-ink">
            <SerifAccent text={lesson.title} />
          </h1>
          <p className="mt-2 text-small text-site-muted">{lesson.meta}</p>
        </Reveal>
      </RevealGroup>

      {/* large Task D visual of the finished step — its inner media is the
          parallax element (speed 0.08), scaled + clipped by this container */}
      <div className="mt-6 overflow-hidden rounded-[24px] border border-site-border bg-white p-3">
        <div data-parallax="0.08" className="parallax-media overflow-hidden rounded-[14px]">
          <KeyframeVisual
            spec={finalStep.keyframe}
            label={lesson.title}
            variant="step"
          />
        </div>
      </div>

      {/* step list as numbered rows with hairline dividers */}
      <div className="mt-8 border-y border-site-border">
        {lesson.steps.map((step, i) => (
          <div
            key={step.caption}
            className="flex items-baseline gap-3 border-b border-site-border py-4 last:border-b-0"
          >
            <span className="font-display-ui w-6 shrink-0 text-xl font-bold leading-none text-site-muted">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-body-ui text-body font-semibold text-site-ink">{step.caption}</p>
              {step.visibleState ? (
                <span className="mt-0.5 block text-small text-site-muted">{step.visibleState}</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <h2 className="font-display-ui mt-8 text-[1.75rem] font-bold leading-heading text-site-ink">
        {s.modeHeading}
      </h2>
      <ModeChoice />

      <div className="mt-6 flex flex-col gap-2">
        <Button href="/lesson/sample/play" size="large">
          {s.startLessonShort}
        </Button>
        <Button href="/create/review" variant="secondary">
          {s.reviewSteps}
        </Button>
      </div>
    </div>
  );
}