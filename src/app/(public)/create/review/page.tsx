"use client";

import { useState } from "react";
import s from "@/lib/strings";
import { sampleLesson, type FixtureStep } from "@/design/fixtures";

import Link from "next/link";
import { KeyframeVisual } from "@/components/KeyframeVisual";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { SerifAccent } from "@/components/Reveal";
import { SpotlightCard } from "@/components/SpotlightCard";
import { Magnetic } from "@/components/Magnetic";
import { SatinBackdrop } from "@/components/create/SatinBackdrop";

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
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/60 transition-colors duration-[150ms] hover:bg-white/10 hover:text-white";

  return (
    <div className="-mt-24 relative min-h-[100svh] overflow-hidden">
      <SatinBackdrop />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(120%_120%_at_50%_0%,rgba(18,10,2,0.28),rgba(8,4,1,0.62)_78%)]"
      />

      <div className="relative z-10 mx-auto w-full max-w-[430px] px-4 pt-32 pb-16">
        <h1 className="font-display-ui text-[2.5rem] font-extrabold leading-tight tracking-tight text-white">
          <SerifAccent text={sampleLesson.title} />
        </h1>
        <p className="mt-1 font-body-ui text-small text-white/70">
          {sampleLesson.meta}
        </p>

        {/* saved hint — glass */}
        <p className="mt-4 rounded-[20px] border border-white/15 bg-white/[0.06] px-4 py-2.5 font-body-ui text-small text-white/60 backdrop-blur-xl">
          {s.savedBanner}
        </p>

        {/* title edit — quiet underline field */}
        <label className="font-body-ui mt-6 block text-small font-medium text-white/65">
          {s.reviewTitleFieldLabel}
        </label>
        <input
          type="text"
          defaultValue={sampleLesson.title}
          aria-label={s.reviewTitleFieldLabel}
          className="mt-1 w-full border-b border-white/25 bg-transparent pb-1.5 font-display-ui text-[1.5rem] font-bold leading-tight text-white caret-amber-300 focus:border-accent focus:outline-none"
        />

        {/* THE STEPS — glass rows, 12px gaps */}
        <div className="mt-6 flex flex-col gap-3">
          {steps.map((step, i) => {
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;
            return (
              <SpotlightCard
                key={step.caption}
                className="rounded-[20px] border border-white/15 bg-white/[0.06]"
              >
                <div className="flex gap-3 p-3">
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
                    <p className="font-display-ui text-[1.125rem] font-bold leading-snug text-white">
                      <span className="pr-1.5 font-body-ui text-small text-white/45">
                        #{i + 1}
                      </span>
                      {step.caption}
                    </p>
                    <p className="mt-1 line-clamp-2 font-body-ui text-small text-white/60">
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
              </SpotlightCard>
            );
          })}
        </div>

        {/* FOOTER — sticky dark glass on mobile, static on desktop */}
        <div className="sticky bottom-0 z-10 mt-6 -mx-4 bg-black/25 px-4 pb-2 pt-3 backdrop-blur-md lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:backdrop-blur-none">
          <Magnetic className="block w-full">
            <Link
              href="/lesson/sample"
              className="btn-shine block rounded-full bg-accent px-5 py-3 text-center font-body-ui text-body font-semibold text-[#16161A] shadow-[0_14px_40px_-10px_rgba(245,158,11,0.8)] transition-all duration-[150ms] hover:brightness-105"
            >
              {s.startLesson}
            </Link>
          </Magnetic>
          <Link
            href="/create"
            className="mt-2 block text-center font-body-ui text-small font-medium text-white/60 underline-offset-4 transition-colors duration-[150ms] hover:text-white hover:underline"
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
    </div>
  );
}