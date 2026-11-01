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
      <div className="mx-auto w-full max-w-[720px] px-4 pb-12 md:px-6 lg:max-w-[1120px] lg:px-8">
        <div className="mb-4 rounded-[16px] border border-site-border bg-white p-3 text-sm text-site-ink">
          <a className="underline" href="/professional/lessons/">← {s["proSample.backToHub"]}</a>
          <p className="mt-1 text-site-muted">{s["proSample.readNote"]}</p>
        </div>
        <header className="lg:flex lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p className="font-body-ui text-small font-semibold uppercase tracking-[0.14em] text-[#15803D]">
              {s["proSample.eyebrow"]}
            </p>
            <h1 className="mt-1 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2.5rem]">
              {proSampleLesson.lessonTitle} · {proSampleLesson.steps.length} steps
            </h1>
            <p className="mt-3 max-w-[560px] font-body-ui text-body text-site-muted">
              {s["proSample.subtitle"]}
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-3 lg:mt-0 lg:items-end">
            <ProSampleStart className={primary}/>
            <p className="text-small font-body-ui text-site-muted">{s.sampleFreeNote}</p>
          </div>
        </header>

        <section className="mt-8">
          <h2 className="font-body-ui text-xl font-bold tracking-[-0.01em] text-site-ink">
            {s["proSample.materialsLabel"]}
          </h2>
          <p className="mt-2 font-body-ui text-small text-site-ink">
            A printed or screen study sheet of plumbing components.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="font-body-ui text-xl font-bold tracking-[-0.01em] text-site-ink">
            {s["proSample.stepsHeading"]}
          </h2>
          <div className="mt-4 space-y-4">
            {proSampleLesson.steps.map((step, i) => (
              <article key={step.id} className="rounded-[16px] border border-site-border bg-white p-4 lg:p-5">
                <div className="lg:flex lg:gap-6">
                  <div className="shrink-0 overflow-hidden rounded-xl border border-site-border lg:w-[300px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full object-contain" src={step.visual} alt={`${s["sample.stepLabel"]} ${i + 1} — ${step.title}`} width={420} height={320}/>
                  </div>
                  <div className="mt-4 min-w-0 flex-1 lg:mt-0">
                    <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">{s["sample.stepLabel"]} {i + 1} · {step.title}</p>
                    <p className="mt-2 font-body-ui text-site-ink">{step.instructions}</p>
                    <p className="mt-3 text-small font-body-ui text-site-muted"><span className="font-semibold text-[#15803D]">{s["sample.targetLabel"]}</span> {step.target}</p>
                    <p className="mt-1 text-small font-body-ui text-site-muted"><span className="font-semibold text-[#15803D]">{s["sample.criterionLabel"]}</span> {step.criterion}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-[16px] border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
          <p className="font-body-ui text-small text-site-ink">{s["proSample.readNote"]}</p>
          <ProSampleStart className={`${primary} mt-3`}/>
        </section>
      </div>
      <PublicFooter/>
    </>
  );
}