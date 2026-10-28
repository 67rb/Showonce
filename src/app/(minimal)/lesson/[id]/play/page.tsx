import s from "@/lib/strings";
import { sampleLesson } from "@/design/fixtures";

import Link from "next/link";
import type { ReactNode } from "react";
import { KeyframeVisual } from "@/components/KeyframeVisual";

type PlayState = "step" | "checking" | "right" | "wrong" | "canttell";

/** Dark step/photo stage in FIT mode at a 4/3 aspect ratio (never cropped). */
function Stage({
  spec,
  label,
  variant,
  highlightId,
}: {
  spec: typeof sampleLesson.steps[number]["keyframe"];
  label: string;
  variant: "step" | "photo";
  highlightId?: string;
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px]">
      <KeyframeVisual
        spec={spec}
        label={label}
        variant={variant}
        fit
        highlightId={highlightId}
        className="h-full"
      />
    </div>
  );
}

function InkPill({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full bg-[#16161A] px-5 py-3 text-center font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
    >
      {children}
    </Link>
  );
}

function GhostPill({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-full border border-site-border-2 bg-white px-5 py-3 text-center font-body-ui text-body font-semibold text-site-ink transition-colors duration-[150ms] hover:bg-site-page"
    >
      {children}
    </Link>
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

  const lesson = sampleLesson;
  const total = lesson.steps.length;
  const current = lesson.steps[1]; // the "current" step 2 of the fixture
  const differ = lesson.steps[2]; // step 3 — its photo differs from the keyframe
  const stepNo = 2;

  const disabledAction = (
    label: string,
    key: string,
  ) => (
    <span
      key={key}
      className="block rounded-full border border-site-border bg-site-page px-5 py-3 text-center font-body-ui text-body font-semibold text-site-muted opacity-70"
    >
      {label}
    </span>
  );

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-8">
      {/* compact player header */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/lesson/sample"
          aria-label={lesson.title}
          className="inline-flex items-center gap-2 font-body-ui text-small font-medium text-site-muted transition-colors duration-[150ms] hover:text-site-ink"
        >
          <span aria-hidden>←</span>
        </Link>
        <span className="font-body-ui text-small font-medium text-site-muted">
          {current.caption}
        </span>
      </div>
      {/* slim progress bar — amber fill on a hairline track */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-site-border">
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${(stepNo / total) * 100}%` }}
        />
      </div>

      <main className="mt-6">
        {/* BASE STEP STATE (Task B) */}
        {mode === "step" && (
          <section className="flex flex-col gap-5">
            <div className="rounded-[24px] border border-site-border bg-white p-4">
              <h1 className="font-display-ui text-[1.75rem] font-bold leading-tight text-site-ink">
                {current.caption}
              </h1>
              <div className="mt-4">
                <Stage spec={current.keyframe} label={current.caption} variant="step" />
              </div>
            </div>
            <InkPill href="/lesson/sample/play/camera">{s.takePhoto}</InkPill>
            <Link
              href="/lesson/sample/play?state=checking"
              className="text-center font-body-ui text-small font-medium text-site-muted underline-offset-4 transition-colors duration-[150ms] hover:text-site-ink hover:underline"
            >
              {s.usePhotoInstead}
            </Link>
            <p className="text-center font-body-ui text-caption text-site-muted">
              {s.privacyClaim}
            </p>
          </section>
        )}

        {/* CHECKING (Task C) — photo variant + scanning line, actions disabled */}
        {mode === "checking" && (
          <section className="flex flex-col gap-5">
            <div className="relative rounded-[24px] border border-site-border bg-white p-4">
              <Stage spec={differ.photo} label={differ.caption} variant="photo" />
              <span aria-hidden className="play-checking-scan" />
            </div>
            <p className="text-center font-body-ui text-body text-site-muted">
              {s.checkingLine}
            </p>
            <div className="flex flex-col gap-2">
              {disabledAction(s.takePhoto, "take")}
              {disabledAction(s.usePhotoInstead, "upload")}
            </div>
          </section>
        )}

        {/* RIGHT (Task C) — success band + next action */}
        {mode === "right" && (
          <section className="flex flex-col gap-5">
            <div className="rounded-[24px] border border-site-border bg-white p-4">
              <Stage spec={differ.keyframe} label={differ.caption} variant="step" />
            </div>
            <div className="rounded-[24px] border border-[#00C758]/30 bg-[#00C758]/[0.12] p-5">
              <div className="flex items-center gap-2 text-success">
                <svg
                  aria-hidden
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span className="font-display-ui text-[1.5rem] font-bold leading-tight">
                  {s.verdictRightLabel}
                </span>
              </div>
              <p className="mt-1 font-body-ui text-body text-site-muted">
                {s.verdictRightLine}
              </p>
            </div>
            <InkPill href="/lesson/sample/play/camera">{s.nextStep}</InkPill>
          </section>
        )}

        {/* WRONG (Task C) — danger band + ringed differing brick, non-blocking */}
        {mode === "wrong" && (
          <section className="flex flex-col gap-5">
            <div className="rounded-[24px] border border-site-border bg-white p-4">
              <Stage
                spec={differ.photo}
                label={differ.caption}
                variant="photo"
                highlightId="accent"
              />
            </div>
            <div className="rounded-[24px] border border-[#E5484D]/30 bg-[#E5484D]/[0.10] p-5">
              <div className="flex items-center gap-2 text-danger">
                <svg
                  aria-hidden
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                <span className="font-display-ui text-[1.5rem] font-bold leading-tight">
                  {s.verdictWrongLabel}
                </span>
              </div>
              <p className="mt-1 font-body-ui text-body font-medium text-site-ink">
                {s.checkDemoDifference}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <InkPill href="/lesson/sample/play/camera">{s.retakePhoto}</InkPill>
              <GhostPill href="/lesson/sample/complete">
                {s.mineIsRight}
              </GhostPill>
            </div>
          </section>
        )}

        {/* CAN'T TELL (Task C) — amber band + same two actions */}
        {mode === "canttell" && (
          <section className="flex flex-col gap-5">
            <div className="rounded-[24px] border border-site-border bg-white p-4">
              <Stage spec={differ.photo} label={differ.caption} variant="photo" />
            </div>
            <div className="rounded-[24px] border border-[#F59E0B]/30 bg-[#F59E0B]/[0.12] p-5">
              <div className="flex items-center gap-2 text-accent-deep">
                <svg
                  aria-hidden
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" fill="none" />
                  <path d="M12 7v5l3 2" strokeLinecap="round" />
                </svg>
                <span className="font-display-ui text-[1.5rem] font-bold leading-tight">
                  {s.verdictCantTellLabel}
                </span>
              </div>
              <p className="mt-1 font-body-ui text-body text-site-muted">
                {s.cantTellLine}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <InkPill href="/lesson/sample/play/camera">{s.retakePhoto}</InkPill>
              <GhostPill href="/lesson/sample/complete">
                {s.mineIsRight}
              </GhostPill>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}