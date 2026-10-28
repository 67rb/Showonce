import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import { KeyframeVisual } from "@/components/KeyframeVisual";
import { VerdictChip } from "@/components/VerdictChip";
import { EndSessionButton } from "@/components/EndSessionButton";

type LiveState = "on-track" | "check" | "wrong";

export default async function LivePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  await params;
  const { state } = await searchParams;
  const mode = ((state as LiveState) || "on-track") as LiveState;

  const differ = sampleLesson.steps[2];

  const feedback =
    mode === "on-track"
      ? {
          chip: <VerdictChip variant="right" label={s.verdictRightLabel} />,
          line: null,
        }
      : mode === "check"
        ? {
            chip: (
              <VerdictChip variant="canttell" label={s.verdictCantTellLabel} />
            ),
            line: s.liveTooBlurry,
          }
        : {
            chip: <VerdictChip variant="wrong" label={s.verdictWrongLabel} />,
            line: s.verdictWrongLine,
          };

  const bannerTitle =
    mode === "on-track"
      ? s.liveOnTrackLine
      : mode === "check"
        ? s.liveCheckLine
        : s.liveWrongLine;

  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col px-4 py-4">
      {/* live chip bar */}
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex rounded-full bg-danger/15 px-2.5 py-1 text-caption font-semibold text-danger">
          {s.liveChip}
        </span>
        <span className="font-body-ui text-small text-site-muted">{sampleLesson.title}</span>
      </div>

      {/* full-bleed viewfinder — dark photo stage (exception) */}
      <div className="relative overflow-hidden rounded-2xl bg-[#101013] ring-1 ring-[#101013]">
        <KeyframeVisual spec={differ.keyframe} label={sampleLesson.title} dim className="aspect-[3/4]" />
        <div className="pointer-events-none absolute inset-[14%] rounded-md border-2 border-dashed border-accent/50" />
        {/* amber corner brackets */}
        <span aria-hidden className="pointer-events-none absolute left-2 top-2 h-6 w-6 border-l-2 border-t-2 border-accent/70" />
        <span aria-hidden className="pointer-events-none absolute right-2 top-2 h-6 w-6 border-r-2 border-t-2 border-accent/70" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 left-2 h-6 w-6 border-b-2 border-l-2 border-accent/70" />
        <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 h-6 w-6 border-b-2 border-r-2 border-accent/70" />
      </div>

      {/* feedback banner */}
      <div className="site-card relative mt-4 p-5">
        <div className="relative flex flex-wrap items-center gap-2">
          <span className="font-display-ui text-xl font-bold leading-heading text-site-ink">
            {bannerTitle}
          </span>
          {feedback.chip}
        </div>
        {feedback.line ? (
          <p className="font-body-ui relative mt-1 text-body text-site-muted">{feedback.line}</p>
        ) : null}
      </div>

      {/* bottom sheet: current step */}
      <div className="site-card mt-4 flex items-center gap-3 p-3">
        <div className="w-20 shrink-0">
          <KeyframeVisual spec={differ.keyframe} label={sampleLesson.title} />
        </div>
        <div className="min-w-0">
          <p className="font-body-ui text-caption font-semibold uppercase tracking-wide text-site-muted">
            Step 3
          </p>
          <p className="font-body-ui truncate text-body text-site-ink">{differ.caption}</p>
        </div>
      </div>

      <div className="mt-6">
        <EndSessionButton />
      </div>
    </div>
  );
}