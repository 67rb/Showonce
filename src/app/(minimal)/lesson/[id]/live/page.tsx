import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import Link from "next/link";
import { KeyframeVisual } from "@/components/KeyframeVisual";
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
  const differ = sampleLesson.steps[2]; // the step whose scene the camera watches

  return (
    <div className="min-h-dvh w-full bg-[#101013] px-4 py-6">
      <div className="mx-auto flex w-full max-w-[430px] flex-col gap-4">
        {/* compact top bar: back, step meta, LIVE chip */}
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/lesson/sample"
            aria-label={sampleLesson.title}
            className="text-white/70 transition-colors duration-[150ms] hover:text-white"
          >
            <span aria-hidden>←</span>
          </Link>
          <span className="truncate font-body-ui text-small text-white/60">
            {differ.caption}
          </span>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-caption font-semibold text-white">
            <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-accent" />
            {s.liveChip}
          </span>
        </div>

        {/* functional dark video surface (near-black) — portrait like the camera */}
        <div className="relative w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
          <div className="aspect-[3/4] w-full">
            <KeyframeVisual
              spec={differ.keyframe}
              label={sampleLesson.title}
              variant="photo"
              dim
              fit
              className="h-full"
            />
          </div>
        </div>

        {/* status region (state variants) */}
        {mode === "on-track" && (
          <div className="rounded-2xl border border-[#00C758]/30 bg-[#00C758]/[0.12] p-4">
            <p className="flex items-center gap-2 font-body-ui text-body font-medium text-success">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-success" />
              {s.liveOnTrackLine}
            </p>
          </div>
        )}
        {mode === "check" && (
          <div className="rounded-2xl border border-[#F59E0B]/30 bg-[#F59E0B]/[0.12] p-4">
            <p className="flex items-center gap-2 font-body-ui text-body font-medium text-accent">
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full bg-accent animate-progress"
              />
              {s.liveCheckLine}
            </p>
            <p className="mt-1 font-body-ui text-small text-white/70">
              {s.liveTooBlurry}
            </p>
          </div>
        )}
        {mode === "wrong" && (
          <div className="rounded-2xl border border-[#E5484D]/30 bg-[#E5484D]/[0.10] p-4">
            <p className="flex items-center gap-2 font-body-ui text-body font-medium text-danger">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-full bg-danger" />
              {s.verdictWrongLabel} · {s.liveWrongLine}
            </p>
            <p className="mt-1 font-body-ui text-small text-white/90">
              {s.verdictWrongLine}
            </p>
            {/* live never hard-blocks: a quiet continue/override */}
            <button
              type="button"
              className="mt-3 font-body-ui text-small font-medium text-white/70 underline-offset-4 transition-colors duration-[150ms] hover:text-white hover:underline"
            >
              {s.mineIsRight}
            </button>
          </div>
        )}

        {/* under the stage — current step, light text on the dark ground */}
        <div>
          <p className="font-display-ui text-[1.25rem] font-bold leading-tight text-white">
            {differ.caption}
          </p>
          {differ.visibleState ? (
            <p className="mt-1 font-body-ui text-small text-white/60">
              {differ.visibleState}
            </p>
          ) : null}
        </div>

        <div className="mt-1">
          <EndSessionButton />
        </div>
      </div>
    </div>
  );
}