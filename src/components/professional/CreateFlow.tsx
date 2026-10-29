"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "@/lib/strings";
import { SerifAccent } from "@/components/Reveal";
import { Button } from "@/components/Button";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ProgressSteps } from "@/components/ProgressSteps";
import { BorderBeam } from "@/components/lightswind/border-beam";
import { proBreadboardLesson } from "@/design/fixtures";

// 4.2.B — Professional create flow. Mirrors the Hobby create flow's canonical
// structure (DESIGN v3.2: import → processing → review) rendered in the
// Professional face: green accents, trades copy under pro* keys, and the
// breadboard sample lesson on the review screen. Face-neutral mechanism labels
// (import errors, processing stages, review labels, the privacy claim) reuse
// the shared strings. Verdict colours are never swapped.
type CreateState = "default" | "invalid" | "failed" | "not-configured";

// Reads the `?state=` review variant client-side (the route is static-exported,
// so the server renders the default). Prerender shows the default state; a visit
// carrying `?state=invalid|failed|not-configured` swaps the band in after mount.
function useQueryState(): CreateState {
  const [state, setState] = useState<CreateState>("default");
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("state");
    let timer = 0;
    if (value === "invalid" || value === "failed" || value === "not-configured") {
      timer = window.setTimeout(() => setState(value), 0);
    }
    return () => window.clearTimeout(timer);
  }, []);
  return state;
}

export function CreateFlow({
  screen,
}: {
  screen: "create" | "processing" | "review";
}) {
  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      {screen === "create" && <CreateScreen />}
      {screen === "processing" && <ProcessingScreen />}
      {screen === "review" && <ReviewScreen />}
    </div>
  );
}

/* ----------------------------- import ----------------------------- */

function CreateScreen() {
  const state = useQueryState();
  const invalid = state === "invalid";
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
          <SerifAccent text={s.proCreateHeading} />
        </h1>
        <p className="mx-auto mt-3 max-w-[340px] font-body-ui text-body font-semibold leading-relaxed text-site-muted">
          {s.proCreateScopeNote}
        </p>
      </header>

      {state === "failed" && (
        <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/10 p-4 text-small text-site-ink">
          <p className="font-semibold">{s.importErrorFailed}</p>
          <Link href="/professional/create" className="mt-2 inline-block text-[#16A34A] underline">
            Try again
          </Link>
        </div>
      )}
      {state === "not-configured" && (
        <div role="status" className="rounded-2xl border border-[#16A34A]/30 bg-[#16A34A]/10 p-4 text-small text-site-ink">
          {s.importErrorNotConfigured}
        </div>
      )}

      <form
        onSubmit={(e) => e.preventDefault()}
        className="space-y-4"
        aria-busy="false"
      >
        <div className="relative rounded-[20px] border border-site-border bg-white p-5 shadow-[0_22px_50px_-32px_rgba(22,163,74,0.4)]">
          <BorderBeam
            aria-hidden
            size={70}
            duration={8}
            colorFrom="#16A34A"
            colorTo="#15803D"
            opacity={0.55}
            beamBorderRadius={20}
          />
          <label className="block">
            <span className="text-small font-medium text-site-ink">
              {s.importFieldLabel}
            </span>
            <input
              type="url"
              aria-label={s.importFieldLabel}
              placeholder={s.proImportLinkPlaceholder}
              required
              maxLength={2048}
              aria-invalid={invalid || undefined}
              className={
                "mt-2 w-full rounded-xl border bg-white px-4 py-3 text-body text-site-ink " +
                "placeholder:text-site-muted/70 focus:outline focus:outline-2 " +
                (invalid
                  ? "border-danger focus:outline-danger"
                  : "border-site-border focus:outline-[#16A34A]")
              }
            />
          </label>
          {invalid && (
            <p role="alert" className="mt-2 text-small text-danger">
              {s.importErrorInvalid}
            </p>
          )}
        </div>

        <Button href="/professional/create/processing" size="default" className="w-full">
          {s.createGetSteps}
        </Button>
      </form>

      <div aria-hidden className="h-px w-full bg-site-border" />

      <div className="rounded-[20px] border-2 border-dashed border-site-border-2 bg-white/60 px-6 py-7 text-center">
        <p className="text-small text-site-muted">{s.uploadPrompt}</p>
        <Button variant="secondary" href="/professional/create/processing" className="mt-3">
          {s.uploadButton}
        </Button>
      </div>

      <p className="text-center text-caption text-site-muted">{s.privacyClaim}</p>
    </div>
  );
}

/* --------------------------- processing --------------------------- */

function ProcessingScreen() {
  const stages = [s.procStageFetch, s.procStageSample, s.procStageDerive];
  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-display-ui text-[2rem] font-extrabold leading-tight tracking-tight text-site-ink">
          <SerifAccent text={s.processingHeading} />
        </h1>
        <p className="mx-auto mt-3 text-small text-site-muted">{s.processingNote}</p>
      </header>

      <div className="rounded-[20px] border border-site-border bg-white p-5">
        <p className="font-mono text-caption text-site-muted">{s.proStubLine}</p>
        <div className="mt-4 space-y-2" aria-hidden>
          <div className="create-skeleton h-4 w-2/3 rounded bg-site-page" />
          <div className="create-skeleton h-4 w-1/2 rounded bg-site-page" />
        </div>
      </div>

      <span className="sr-only">{s.proStubLine}</span>

      <ol className="space-y-3">
        {stages.map((label, i) => {
          const done = i < 1;
          const current = i === 1;
          return (
            <li
              key={label}
              className={
                "flex items-center gap-3 rounded-[20px] border bg-white px-4 py-3 " +
                (current ? "border-[#16A34A]/40" : "border-site-border")
              }
            >
              <span
                aria-hidden
                className={
                  "h-3 w-3 shrink-0 rounded-full border-2 " +
                  (done
                    ? "border-[#16A34A] bg-[#16A34A]"
                    : current
                      ? "border-[#16A34A] bg-white"
                      : "border-site-border-2 bg-white")
                }
              />
              <span className="text-body font-semibold text-site-ink">{label}</span>
            </li>
          );
        })}
      </ol>

      <ProgressSteps current={2} total={3} />

      <div className="flex items-center justify-between gap-4">
        <Link href="/professional/create" className="text-small underline">
          {s.backToImport}
        </Link>
        <Button variant="secondary" href="/professional/create/review" className="shrink-0">
          {s.seeReviewScreen}
        </Button>
      </div>
    </div>
  );
}

/* ----------------------------- review ----------------------------- */

function ReviewScreen() {
  const [title, setTitle] = useState(proBreadboardLesson.title);
  const [rows, setRows] = useState(
    proBreadboardLesson.steps.map((step) => ({
      caption: step.caption,
      spec: step.keyframe,
    })),
  );
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= rows.length) return;
    setRows((prev) => {
      const next = [...prev];
      const [row] = next.splice(index, 1);
      next.splice(target, 0, row!);
      return next;
    });
  };

  const confirmDelete = () => {
    if (pendingDelete == null) return;
    setRows((prev) => prev.filter((_, i) => i !== pendingDelete));
    setPendingDelete(null);
  };

  return (
    <div className="space-y-8">
      <header className="text-center">
        <h1 className="font-display-ui text-[2rem] font-extrabold leading-tight tracking-tight text-site-ink">
          <SerifAccent text={title} />
        </h1>
        <p className="mt-3 text-small text-site-muted">{proBreadboardLesson.meta}</p>
      </header>

      <div className="rounded-2xl border border-site-border bg-white p-3 text-center">
        <span className="text-small font-medium text-site-ink">
          {s.reviewTitleFieldLabel}
        </span>
        <input
          aria-label={s.reviewTitleFieldLabel}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-xl border-b border-site-border bg-transparent px-2 py-1 text-center text-body font-semibold text-site-ink focus:outline-none focus:border-[#16A34A]"
        />
      </div>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <div
            key={row.caption + "-" + i}
            className="flex gap-4 rounded-[20px] border border-site-border bg-white p-3"
          >
            <div className="w-24 shrink-0">
              <KeyframeVisual
                spec={row.spec}
                label={row.caption}
                fit
                className="h-20"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-[#16A34A]">
                {i + 1}
              </p>
              <p className="mt-1 font-display-ui text-[1.0625rem] font-bold leading-tight text-site-ink">
                {row.caption}
              </p>
              <div className="mt-2 flex gap-2 text-small text-site-muted">
                <button
                  type="button"
                  aria-label={s.reorderUpLabel}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                  className="underline disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label={s.reorderDownLabel}
                  disabled={i === rows.length - 1}
                  onClick={() => move(i, 1)}
                  className="underline disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label={s.deleteStepLabel}
                  onClick={() => setPendingDelete(i)}
                  className="ml-auto text-danger underline"
                >
                  {s.proReviewRemove}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-caption text-site-muted">{s.savedBanner}</p>

      <div className="sticky bottom-0 flex flex-col gap-2 rounded-t-2xl bg-site-page pb-2 pt-3 md:static md:flex-row md:justify-between md:pt-0">
        <Button href="/professional/lesson/sample" size="default" className="w-full md:w-auto">
          {s.startLesson}
        </Button>
        <Button variant="ghost" href="/professional/create" className="w-full md:w-auto">
          {s.backToImport}
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title={s.deleteStepTitle}
        body={s.deleteStepBody}
        cancelLabel={s.cancel}
        confirmLabel={s.deleteStepConfirm}
        onConfirm={confirmDelete}
      />
    </div>
  );
}