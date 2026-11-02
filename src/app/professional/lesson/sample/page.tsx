/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import s from "@/lib/strings";
import { proSampleLesson } from "@/lib/proSample";
import { ProSampleStart } from "@/components/professional/ProSampleStart";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = {
  title: `SHOW ONCE · Professional · ${s["proSample.overviewTitle"]}`,
  description: "Three steps, each with a saved reference visual on paper.",
};

const primary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full bg-[#16A34A] px-6 py-3 font-semibold text-white transition hover:brightness-105";

export default function ProfessionalSamplePage() {
  return (
    <>
      <div className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-12 md:px-6 lg:max-w-[1120px] lg:px-8">
        {/* 5.3 (L10) — plain back link, one arrow (the string carries it), not
            wrapped in a card, directly above the header block. */}
        <a
          className="text-small font-medium underline text-site-ink"
          href="/professional/lessons/"
        >
          {s["proSample.backToHub"]}
        </a>
        <header className="scroll-mt-28">
          <div className="min-w-0">
            <p className="font-body-ui text-small font-semibold uppercase tracking-[0.14em] text-[#15803D]">
              {s["proSample.eyebrow"]}
            </p>
            <h1 className="mt-1 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2.5rem]">
              {proSampleLesson.lessonTitle}
            </h1>
            {/* 5.3 (L5c) — step count becomes the muted meta line. */}
            <p className="mt-2 font-body-ui text-small font-medium text-site-muted">
              {proSampleLesson.steps.length} steps · {s.sampleFreeNote}
            </p>
            <p className="mt-3 max-w-[560px] font-body-ui text-body text-site-muted">
              {s["proSample.subtitle"]}
            </p>
          </div>
        </header>
        {/* 5.3 (L10) — the preview notice appears ONCE, as a banner under the
            header (not a card wrapping the back link), bottom duplicate
            removed. */}
        <p className="mt-4 rounded-[16px] border border-[#16A34A]/30 bg-[#16A34A]/5 p-4 font-body-ui text-small text-site-ink">
          {s["proSample.readNote"]}
        </p>

        <section className="scroll-mt-28 mt-8">
          <h2 className="font-body-ui text-xl font-bold tracking-[-0.01em] text-site-ink">
            {s["proSample.materialsLabel"]}
          </h2>
          <p className="mt-2 font-body-ui text-small text-site-ink">
            A printed or screen study sheet of plumbing components.
          </p>
        </section>

        <section className="scroll-mt-28 mt-8">
          <h2 className="font-body-ui text-xl font-bold tracking-[-0.01em] text-site-ink">
            {s["proSample.stepsHeading"]}
          </h2>
          <div className="mt-4 space-y-4">
            {proSampleLesson.steps.map((step, i) => (
              <article
                key={step.id}
                className="scroll-mt-28 rounded-[16px] border border-site-border bg-white p-4 lg:p-5"
              >
                {/* 5.3 (L5a) — fixed media height; text column centres. */}
                <div className="lg:flex lg:items-center lg:gap-6">
                  <div className="shrink-0 overflow-hidden rounded-xl border border-site-border lg:w-[300px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full object-contain lg:h-[200px]" src={step.visual} alt={`${s["sample.stepLabel"]} ${i + 1} — ${step.title}`} width={420} height={320}/>
                  </div>
                  <div className="mt-4 min-w-0 flex-1 lg:mt-0">
                    <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">{s["sample.stepLabel"]} {i + 1} · {step.title}</p>
                    <p className="mt-2 font-body-ui text-site-ink">{step.instructions}</p>
                    {/* 5.3 (L5b) — label and value as separate lines. */}
                    <p className="mt-3 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-[#15803D]">{s["sample.targetLabel"]}</p>
                    <p className="mt-1 text-small font-body-ui text-site-muted">{step.target}</p>
                    <p className="mt-3 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-[#15803D]">{s["sample.criterionLabel"]}</p>
                    <p className="mt-1 text-small font-body-ui text-site-muted">{step.criterion}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="scroll-mt-28 mt-8 rounded-[16px] border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
          <ProSampleStart className={primary}/>
        </section>
      </div>
      <PublicFooter/>
    </>
  );
}
