"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import s from "@/lib/strings";
import { SerifAccent } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { VerdictChip } from "@/components/VerdictChip";
import { ProgressSteps } from "@/components/ProgressSteps";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { proBreadboardLesson } from "@/design/fixtures";

// 4.3 — Professional lessons, lesson path, play + camera, live, complete.
// These mirrors follow the canonical design from DESIGN.md (v3.1/v3.3) because
// the live Hobby routes render the divergent dark `learning/Workspace` — the
// 4.2 create-flow precedent. Content is the breadboard sample; the check
// pattern (verdict bands, dashed difference ring, scan) is functional and
// identical to Hobby. Only chrome accents are green.
type QueryState = string | null;

function useQueryState(): QueryState {
  const [state, setState] = useState<QueryState>(null);
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("state");
    const timer = window.setTimeout(() => setState(value), 0);
    return () => window.clearTimeout(timer);
  }, []);
  return state;
}

// Any /professional/lesson/[id] resolves to the breadboard sample — the same
// "resolves to the sample for any id" rule Hobby uses for /lesson/[id].
const lessonById = () => proBreadboardLesson;

export function LessonFlow({ screen }: { screen: "library" | "overview" | "play" | "camera" | "live" | "complete" }) {
  const query = useQueryState();
  const lesson = lessonById();

  if (screen === "library") return <Library empty={query === "empty"} />;
  if (screen === "overview") return <OverviewLesson lesson={lesson} />;
  if (screen === "play") return <Player lesson={lesson} state={query} />;
  if (screen === "camera") return <Camera lesson={lesson} />;
  if (screen === "live") return <Live lesson={lesson} state={query} />;
  return <Complete lesson={lesson} />;
}

/* ----------------------------- library ----------------------------- */

function Library({ empty }: { empty: boolean }) {
  if (empty) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <header className="text-center">
          <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
            <SerifAccent text={s.lessonsHeading} />
          </h1>
          <div
            aria-hidden
            className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#16A34A]"
          />
        </header>
        <div className="mx-auto mt-10 max-w-[430px]">
          <EmptyPro />
        </div>
      </div>
    );
  }

  const lesson = proBreadboardLesson;
  const done = lesson.steps.filter((st) => st.visibleState === "Done").length;
  const total = lesson.stepCount;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <header className="text-center">
        <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
          <SerifAccent text={s.lessonsHeading} />
        </h1>
        <div
          aria-hidden
          className="mx-auto mt-3 h-1 w-14 rounded-full bg-[#16A34A]"
        />
        <Button href="/professional/create" className="mt-6">
          {s.newLesson}
        </Button>
      </header>

      <ul className="mt-8 divide-y divide-site-border border-y border-site-border">
        <li>
          <Link
            href="/professional/lesson/sample"
            className="group flex w-full items-center gap-4 py-5 transition-all duration-[150ms] hover:bg-site-page/70 hover:shadow-[0_14px_36px_-30px_rgba(21,128,61,0.45)]"
          >
            <div className="w-[96px] shrink-0 md:w-[112px]">
              <KeyframeVisual
                spec={lesson.steps[0].keyframe}
                label={lesson.title}
                fit
                className="h-20"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display-ui truncate text-[1.25rem] font-semibold leading-tight text-site-ink">
                {lesson.title}
              </h3>
              <p className="mt-1 text-small text-site-muted">{lesson.meta}</p>
              <p className="mt-1 text-caption text-site-muted/70">{lesson.date}</p>
              <div className="mt-2 max-w-[260px]">
                <ProgressSteps accentClass="bg-[#16A34A]" current={done} total={total} />
              </div>
            </div>
            <span
              aria-hidden
              className="text-2xl leading-none text-site-ink transition-colors duration-[150ms] group-hover:text-[#16A34A]"
            >
              →
            </span>
          </Link>
        </li>
      </ul>
    </div>
  );
}

function EmptyPro() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="flex items-center gap-1.5" aria-hidden>
        <span className="h-3 w-3 rounded-sm bg-[#16A34A]/70" />
        <span className="h-3 w-3 rounded-sm bg-site-muted/50" />
        <span className="h-3 w-3 rounded-sm bg-[#15803D]" />
      </div>
      <p className="max-w-[300px] text-body text-site-muted">
        {s.proLessonsEmptyLine}
      </p>
      <Button href="/professional/create" variant="secondary">
        {s.newLesson}
      </Button>
    </div>
  );
}

/* ----------------------------- overview ---------------------------- */

function OverviewLesson({
  lesson,
}: {
  lesson: typeof proBreadboardLesson;
}) {
  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-8">
      <Link href="/professional/lessons" className="text-small underline">
        ← {s.yourLessonsLink}
      </Link>

      <header className="mt-4">
        <p className="text-small uppercase tracking-wider text-site-muted">
          {lesson.meta}
        </p>
        <h1 className="mt-2 font-display-ui text-[1.75rem] font-bold leading-tight text-site-ink">
          <SerifAccent text={lesson.title} />
        </h1>
        <p className="mt-3 text-site-muted">
          {lesson.steps.filter((st) => st.visibleState === "Done").length} of {lesson.stepCount}{" "}
          {s.stepsSuffix}
        </p>
      </header>

      <ol className="mt-8 flex flex-col">
        {lesson.steps.map((step, i) => {
          const done = step.visibleState === "Done";
          const current = step.visibleState === "Needed more than one check";
          return (
            <li key={step.caption} className="relative flex gap-4 pb-5 last:pb-0">
              {i < lesson.steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute left-[9px] top-6 h-[calc(100%-12px)] w-px bg-site-border"
                />
              )}
              <span
                aria-hidden
                className={
                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 " +
                  (done
                    ? "border-site-ink bg-site-ink text-white"
                    : current
                      ? "border-[#16A34A]"
                      : "border-site-border-2 bg-white")
                }
              >
                {done ? <CheckIcon /> : null}
              </span>
              <div
                className={
                  "min-w-0 flex-1 rounded-[20px] border bg-white px-4 py-3 " +
                  (current ? "border-[#16A34A]/40" : "border-site-border")
                }
              >
                <p className="font-display-ui text-[1.0625rem] font-bold leading-tight text-site-ink">
                  {i + 1}. {step.caption}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-3">
        <p className="text-center text-small font-semibold text-site-muted">
          {s.modeHeading}
        </p>
        <Link
          href="/professional/lesson/sample/play"
          className="site-card flex items-center justify-between p-5 text-left ring-2 ring-[#16A34A]"
        >
          <span>
            <span className="block font-display-ui text-body font-semibold text-site-ink">
              {s.modeStepByStep}
            </span>
            <span className="mt-1 block text-small text-site-muted">
              {s.modeStepByStepDesc}
            </span>
          </span>
          <span aria-hidden className="text-2xl leading-none text-[#16A34A]">
            →
          </span>
        </Link>
        <Link
          href="/professional/lesson/sample/live"
          className="site-card flex items-center justify-between p-5 text-left"
        >
          <span>
            <span className="block font-display-ui text-body font-semibold text-site-ink">
              {s.modeLive}
            </span>
            <span className="mt-1 block text-small text-site-muted">
              {s.modeLiveDesc}
            </span>
          </span>
          <span className="rounded-full border border-site-border bg-site-page px-2.5 py-1 text-caption font-medium text-site-muted">
            {s.modeLiveChip}
          </span>
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------ player ----------------------------- */

function Player({
  lesson,
  state,
}: {
  lesson: typeof proBreadboardLesson;
  state: QueryState;
}) {
  // The showcased step is the green-jumper wiring step (index 2) — the one with
  // the wrong-variant photo, so RIGHT/WRONG/CAN'T TELL can be demonstrated.
  const step = lesson.steps[2];
  const total = lesson.stepCount;
  const current = 3; // demonstrating step 3 of 4
  const isPhoto =
    state === "checking" || state === "right" || state === "wrong" || state === "canttell";

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/professional/lesson/sample" className="text-small underline">
          ← {s.backToImport}
        </Link>
        <div className="min-w-0 flex-1">
          <ProgressSteps accentClass="bg-[#16A34A]" current={isCompleteState(state) ? total : current} total={total} />
        </div>
      </div>

      <div className="mt-4 rounded-[20px] border border-site-border bg-white p-4">
        <p className="text-caption font-semibold uppercase tracking-wide text-site-muted">
          Step 3 of {total}
        </p>
        <h2 className="mt-1 font-display-ui text-[1.375rem] font-bold leading-tight text-site-ink">
          {step.caption}
        </h2>
        <div className="relative mt-4">
          <KeyframeVisual
            spec={isPhoto ? step.photo : step.keyframe}
            label={step.caption}
            variant={isPhoto ? "photo" : "step"}
            highlightId={state === "wrong" ? "wireGreen" : undefined}
            fit
            className="aspect-[4/3]"
          />
          {state === "checking" && (
            <span
              aria-hidden
              className="play-checking-scan pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-[#16A34A]"
            />
          )}
        </div>
      </div>

      {state !== "checking" && (
        <div className="mt-4 space-y-3">
          <Button
            href="/professional/lesson/sample/play/camera"
            className="w-full"
          >
            {s.takePhoto}
          </Button>
          <button type="button" className="block w-full text-center text-small underline">
            {s.usePhotoInstead}
          </button>
          <p className="text-center text-caption text-site-muted">{s.privacyClaim}</p>
        </div>
      )}
      {state === "checking" && (
        <p role="status" className="mt-4 text-center text-small text-site-muted">
          {s.checkingLine}
        </p>
      )}

      {state === "right" && (
        <div role="status" className="mt-4 rounded-[20px] border border-success/30 bg-success/10 p-5">
          <VerdictChip variant="right" label={s.verdictRightLabel} size="large" />
          <p className="mt-3 text-body font-medium text-site-ink">{s.verdictRightLine}</p>
          <Button href="/professional/lesson/sample/complete" className="mt-4 w-full">
            {s.nextStep}
          </Button>
        </div>
      )}
      {state === "wrong" && (
        <div role="status" className="mt-4 rounded-[20px] border border-danger/30 bg-danger/10 p-5">
          <VerdictChip variant="wrong" label={s.verdictWrongLabel} size="large" />
          <p className="mt-3 text-body font-medium text-site-ink">{s.proDifferenceWrong}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button href="/professional/lesson/sample/play/camera" className="w-full">
              {s.retakePhoto}
            </Button>
            <Button variant="secondary" href="/professional/lesson/sample/complete" className="w-full">
              {s.mineIsRight}
            </Button>
          </div>
        </div>
      )}
      {state === "canttell" && (
        <div role="status" className="mt-4 rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-5">
          <VerdictChip variant="canttell" label={s.verdictCantTellLabel} size="large" />
          <p className="mt-3 text-body font-medium text-site-ink">{s.cantTellLine}</p>
          <div className="mt-4 flex flex-col gap-2">
            <Button href="/professional/lesson/sample/play/camera" className="w-full">
              {s.retakePhoto}
            </Button>
            <Button variant="secondary" href="/professional/lesson/sample/complete" className="w-full">
              {s.mineIsRight}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function isCompleteState(state: QueryState) {
  return state === "right" || state === "wrong" || state === "canttell";
}

/* ------------------------------ camera ----------------------------- */

function Camera({ lesson }: { lesson: typeof proBreadboardLesson }) {
  const step = lesson.steps[2];
  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/professional/lesson/sample/play" className="text-small underline text-white">
          ← {s.backToImport}
        </Link>
        <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-caption text-white/80">
          {step.caption}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-white/20 bg-[#101013]">
        <KeyframeVisual
          spec={step.photo}
          label={step.caption}
          variant="photo"
          fit
          className="aspect-[3/4]"
        />
      </div>

      <div className="mt-5 flex flex-col items-center gap-4">
        <button
          type="button"
          aria-label={s.takePhoto}
          className="grid h-[72px] w-[72px] place-items-center rounded-full border-[3px] border-white bg-transparent"
        >
          <span className="h-11 w-11 rounded-full bg-white/90" />
        </button>
        <p className="text-caption text-white/60">{s.guideHandsAway}</p>
      </div>
    </div>
  );
}

/* ------------------------------- live ------------------------------ */

function Live({
  lesson,
  state,
}: {
  lesson: typeof proBreadboardLesson;
  state: QueryState;
}) {
  const step = lesson.steps[2];
  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/professional/lesson/sample" className="text-small underline text-white">
          ← {s.backToImport}
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-caption text-white/80">
          <span aria-hidden className="h-2 w-2 rounded-full bg-[#16A34A]" />
          {s.liveChip}
        </span>
      </div>

      <div className="mt-4 overflow-hidden rounded-[20px] border border-white/20 bg-[#101013]">
        <KeyframeVisual
          spec={step.photo}
          label={step.caption}
          variant="photo"
          dim
          fit
          className="aspect-[3/4]"
        />
      </div>

      <p className="mt-4 text-center text-small text-white/70">{step.caption}</p>

      {state === "check" && (
        <div role="status" className="mt-4 rounded-[20px] border border-amber-400/30 bg-amber-400/10 p-5">
          <p className="font-semibold text-amber-700">{s.liveCheckLine}</p>
          <p className="mt-1 text-small text-amber-700/80">{s.liveTooBlurry}</p>
        </div>
      )}
      {state === "wrong" && (
        <div role="status" className="mt-4 rounded-[20px] border border-danger/30 bg-danger/10 p-5">
          <p className="font-semibold text-danger">{s.liveWrongLine}</p>
          <p className="mt-1 text-small text-site-ink">{s.proDifferenceWrong}</p>
          <Button variant="secondary" href="/professional/lesson/sample/complete" className="mt-3 w-full">
            {s.mineIsRight}
          </Button>
        </div>
      )}
      {(!state || state === "on-track") && (
        <div role="status" className="mt-4 rounded-[20px] border border-success/30 bg-success/10 p-5">
          <p className="font-semibold text-success">{s.liveOnTrackLine}</p>
        </div>
      )}

      <LiveEnd />
    </div>
  );
}

function LiveEnd() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)} className="mt-4 w-full">
        {s.endSession}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={s.endSessionTitle}
        body={s.endSessionBody}
        cancelLabel={s.cancel}
        confirmLabel={s.endSessionConfirm}
        onConfirm={() => {
          setOpen(false);
          router.push("/professional/lesson/sample/complete");
        }}
      />
    </>
  );
}

/* ----------------------------- complete ---------------------------- */

function Complete({ lesson }: { lesson: typeof proBreadboardLesson }) {
  return (
    <div className="mx-auto flex w-full max-w-[430px] flex-col items-center px-4 py-10">
      <div
        aria-hidden
        className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#16A34A]/50 bg-[#16A34A]/10 text-[#16A34A]"
      >
        <CheckIcon solid />
      </div>
      <h1 className="mt-4 font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
        <SerifAccent text={s.completeHeading} />
      </h1>
      <p className="mt-1 text-site-muted">{lesson.title}</p>

      <div className="mt-6 w-full rounded-[20px] border border-site-border bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="text-small text-site-muted">{s.completeTotalTimeLabel}</span>
          <span className="font-semibold text-site-ink">6 {s.stepsSuffix === "steps" ? "minutes" : "minutes"}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-small text-site-muted">{s.completeStepsCompletedLabel}</span>
          <span className="font-semibold text-site-ink">4 of 4</span>
        </div>
        <div className="mt-4 border-t border-site-border pt-4">
          <span className="text-small font-medium text-site-ink">{s.completeNeededMoreLabel}</span>
          <ul className="mt-2 space-y-1">
            {lesson.steps
              .filter((st) => st.visibleState === "Needed more than one check")
              .map((st) => (
                <li key={st.caption} className="text-small text-site-muted">
                  {st.caption}
                </li>
              ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 w-full space-y-2">
        <Button href="/professional/lessons" className="w-full">
          {s.backToYourLessons}
        </Button>
        <Button variant="secondary" href="/professional/create" className="w-full">
          {s.learnAnother}
        </Button>
      </div>
    </div>
  );
}

function CheckIcon({ solid = false }: { solid?: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      aria-hidden
      style={{ color: solid ? "#16A34A" : undefined }}
    >
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}