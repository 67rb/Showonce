"use client";

import { useState } from "react";
import s from "@/lib/strings";
import { sampleLesson, type FixtureStep } from "@/design/fixtures";

import { StepCard } from "@/components/StepCard";
import { Button } from "@/components/Button";
import { Banner } from "@/components/Banner";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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

  return (
    <div className="mx-auto w-full max-w-[430px] px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display-ui text-[2.25rem] font-extrabold leading-tight text-site-ink">
          {s.reviewHeading}
        </h1>
      </div>

      <div className="mt-4">
        <Banner tone="saved">{s.savedBanner}</Banner>
      </div>

      <div className="mt-5">
        <label className="font-body-ui mb-2 block text-small font-medium text-site-ink">
          {s.reviewTitleFieldLabel}
        </label>
        <input
          type="text"
          defaultValue={sampleLesson.title}
          aria-label={s.reviewTitleFieldLabel}
          className="w-full rounded-lg border border-site-border bg-white px-4 py-3 text-body text-site-ink focus:outline focus:outline-2 focus:outline-accent"
        />
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((step, i) => {
          const isFirst = i === 0;
          const isLast = i === steps.length - 1;
          return (
            <StepCard key={step.caption} step={step} index={i} editableCaption>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => move(i, -1)}
                  disabled={isFirst}
                  className="h-9 px-3"
                >
                  <span aria-hidden>↑</span>
                  <span className="sr-only">{s.reorderUpLabel}</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => move(i, 1)}
                  disabled={isLast}
                  className="h-9 px-3"
                >
                  <span aria-hidden>↓</span>
                  <span className="sr-only">{s.reorderDownLabel}</span>
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setDeleteIndex(i)}
                  className="ml-auto h-9 px-3 text-wrong"
                >
                  <span aria-hidden>✕</span>
                  <span className="sr-only">{s.deleteStepLabel}</span>
                </Button>
              </div>
            </StepCard>
          );
        })}
      </div>

      <div className="mt-8 flex gap-2">
        <Button href="/create" variant="secondary" className="flex-1">
          {s.backToImport}
        </Button>
        <Button href="/lesson/sample" className="flex-1">
          {s.startLesson}
        </Button>
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