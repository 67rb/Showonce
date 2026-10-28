"use client";

import { useState } from "react";
import s from "@/lib/strings";
import { sampleLesson, type FixtureStep } from "@/design/fixtures";

import Link from "next/link";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SerifAccent } from "@/components/Reveal";

export default function ReviewPage() {
  const [steps, setSteps] = useState<FixtureStep[]>(sampleLesson.steps);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const move = (index: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const target = index + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const confirmDelete = () => {
    if (deleteIndex === null) return;
    setSteps((prev) => prev.filter((_, i) => i !== deleteIndex));
    setDeleteIndex(null);
  };

  const iconButton =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-site-border text-site-muted transition-colors duration-[150ms] hover:text-site-ink";

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-site-ink">
        <SerifAccent text={sampleLesson.title} />
      </h1>
      <p className="mt-1 font-body-ui text-small text-site-muted">
        {sampleLesson.meta}
      </p>

      {/* saved hint */}
      <p className="mt-4 rounded-[20px] border border-site-border bg-white px-4 py-2.5 font-body-ui text-small text-site-muted">
        {s.savedBanner}
      </p>

      {/* title edit — quiet underline field */}
      <label className="font-body-ui mt-6 block text-small font-medium text-site-muted">
        {s.reviewTitleFieldLabel}
      </label>
      <input
        type="text"
        defaultValue={sampleLesson.title}
        aria-label={s.reviewTitleFieldLabel}
        className="mt-1 w-full border-b border-site-border bg-transparent pb-1.5 font-display-ui text-[1.5rem] font-bold leading-tight text-site-ink focus:border-accent focus:outline-none"
      />

      {/* THE STEPS — white rows, 12px gaps (a list, not a table) */}
      <div className="mt-6 flex flex-col gap-3">
        {steps.map((step, i) => {
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          return (
            <div
              key={step.caption}
              className="flex gap-3 rounded-[20px] border border-site-border bg-white p-3"
            >
              <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg">
                <KeyframeVisual
                  spec={step.keyframe}
                  label={step.caption}
                  variant="step"
                  fit
                  className="h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display-ui text-[1.125rem] font-bold leading-snug text-site-ink">
                  <span className="pr-1.5 font-body-ui text-small text-site-muted">
                    #{i + 1}
                  </span>
                  {step.caption}
                </p>
                <p className="mt-1 line-clamp-2 font-body-ui text-small text-site-muted">
                  {step.caption}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={isFirst}
                  className={iconButton + (isFirst ? " opacity-40" : "")}
                >
                  <span aria-hidden>↑</span>
                  <span className="sr-only">{s.reorderUpLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={isLast}
                  className={iconButton + (isLast ? " opacity-40" : "")}
                >
                  <span aria-hidden>↓</span>
                  <span className="sr-only">{s.reorderDownLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteIndex(i)}
                  className={iconButton}
                >
                  <span aria-hidden>✕</span>
                  <span className="sr-only">{s.deleteStepLabel}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER — sticky on mobile, static on desktop */}
      <div className="sticky bottom-0 z-10 mt-6 bg-site-page/95 pb-2 pt-2 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none">
        <Link
          href="/lesson/sample"
          className="block w-full rounded-full bg-[#16161A] px-5 py-3 text-center font-body-ui text-body font-semibold text-white transition-colors duration-[150ms] hover:bg-accent"
        >
          {s.startLesson}
        </Link>
        <Link
          href="/create"
          className="mt-2 block text-center font-body-ui text-small font-medium text-site-muted underline-offset-4 transition-colors duration-[150ms] hover:text-site-ink hover:underline"
        >
          {s.backToImport}
        </Link>
      </div>

      <ConfirmDialog
        open={deleteIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteIndex(null);
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