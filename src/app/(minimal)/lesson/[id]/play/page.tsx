import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import { KeyframeVisual } from "@/components/KeyframeVisual";
import { VerdictChip } from "@/components/VerdictChip";
import { Button } from "@/components/Button";
import Link from "next/link";

type PlayState =
  | "step"
  | "checking"
  | "right"
  | "wrong"
  | "canttell";

/** White panel: hairline border, 24px radius, no heavy shadow. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-site-border bg-white p-3">
      {children}
    </div>
  );
}

export default async function PlayPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  await params;
  const { state } = await searchParams;
  const mode = ((state as PlayState) || "step") as PlayState;

  const current = sampleLesson.steps[1]; // step 2 of the fixture lesson
  const differ = sampleLesson.steps[2]; // the step with the differing photo

  const modeClass =
    mode === "right" || mode === "wrong"
      ? "bg-white"
      : "bg-site-page";

  const compare = (
    <>
      <Panel>
        <KeyframeVisual spec={differ.keyframe} label={s.proofStepLabel} variant="step" />
      </Panel>
      <Panel>
        <KeyframeVisual spec={differ.photo} label={s.proofPhotoLabel} variant="photo" />
      </Panel>
    </>
  );

  return (
    <div className={(modeClass ? `${modeClass} ` : "") + "min-h-dvh"}>
      <div className="mx-auto w-full max-w-[430px] px-4 py-8">
      {mode === "step" && (
        <section className="flex flex-col gap-5">
          <Panel>
            <KeyframeVisual spec={current.keyframe} label={current.caption} variant="step" />
          </Panel>
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display-ui text-[1.75rem] font-bold leading-tight text-site-ink">
              {current.caption}
            </h2>
            <button
              type="button"
              aria-label={s.speakerLabel}
              className="shrink-0 rounded-full border border-site-border p-2 text-site-muted transition-colors duration-[150ms] hover:text-site-ink"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M3 9v6h4l5 5V4L7 9H3z" />
                <path d="M16 8a5 5 0 0 1 0 8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
          <Button href="/lesson/sample/play/camera" size="large">
            {s.doneStep}
          </Button>
        </section>
      )}

      {mode === "checking" && (
        <section className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">{compare}</div>
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="flex h-6 w-6 animate-progress items-center justify-center rounded-full border border-accent text-accent">
              <span className="h-2 w-2 rounded-full bg-accent" />
            </span>
            <p className="text-body text-site-muted">{s.checkingLine}</p>
          </div>
        </section>
      )}

      {mode === "right" && (
        <section className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">{compare}</div>
          <div className="relative flex flex-col items-center gap-2 text-center">
            <div className="relative">
              <VerdictChip variant="right" label={s.verdictRightLabel} size="large" />
            </div>
            <p className="relative font-display-ui text-[1.5rem] font-bold leading-heading text-site-ink">
              {s.verdictRightLine}
            </p>
          </div>
          <Button href="/lesson/sample/play/camera">{s.nextStep}</Button>
        </section>
      )}

      {mode === "wrong" && (
        <section className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">{compare}</div>
          <div className="relative flex flex-col gap-2">
            <div className="relative">
              <VerdictChip variant="wrong" label={s.verdictWrongLabel} size="large" />
            </div>
            <p className="relative font-display-ui text-[1.5rem] font-bold leading-heading text-site-ink">
              {s.verdictWrongLine}
            </p>
          </div>
          <div className="flex gap-2">
            <Button href="/lesson/sample/play/camera" className="flex-1">
              {s.fixIt}
            </Button>
            <Button href="/lesson/sample/complete" variant="secondary" className="flex-1">
              {s.mineIsRight}
            </Button>
          </div>
        </section>
      )}

      {mode === "canttell" && (
        <section className="flex flex-col gap-5">
          <Panel>
            <KeyframeVisual spec={differ.photo} label={s.verdictCantTellLabel} variant="photo" />
          </Panel>
          <div className="flex flex-col gap-2">
            <VerdictChip variant="canttell" label={s.verdictCantTellLabel} size="large" />
            <p className="font-display-ui text-3xl font-bold leading-heading text-site-ink">
              {s.cantTellLine}
            </p>
          </div>
          <div className="flex gap-2">
            <Button href="/lesson/sample/play/camera" className="flex-1">
              {s.retakePhoto}
            </Button>
            <Button href="/lesson/sample/complete" variant="secondary" className="flex-1">
              {s.mineIsRight}
            </Button>
          </div>
        </section>
      )}

      {/* Scaffold-flow nav hint */}
      <p className="mt-8 text-center text-caption text-site-muted">
        <Link href="/design" className="underline-offset-4 hover:underline">
          {s.designLink}
        </Link>
      </p>
      </div>
    </div>
  );
}