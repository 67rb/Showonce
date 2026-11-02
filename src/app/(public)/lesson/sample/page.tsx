/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
/**
 * 5.1.5 — the free Hobby sample overview at /lesson/sample. Renders the
 * "Fold a paper cup" sample (7 steps, each with a committed reference visual)
 * immediately for a signed-out visitor — never gated behind the account check.
 * The Start action opens the real runtime player with the sample lesson_id.
 */
import { SampleStart } from "@/components/learning/SampleStart";
import type { Metadata } from "next";
import s from "@/lib/strings";
import { origamiSample } from "@/lib/sample";

export const metadata: Metadata = {
  title: `SHOW ONCE · ${s["sample.origamiTitle"]}`,
  description: "Seven steps, each with a saved reference visual.",
};

const primary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full bg-accent px-6 py-3 font-semibold text-[#16161A] transition hover:brightness-105";

export default function SampleLessonPage() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pt-4 pb-24 md:px-6 lg:max-w-[1120px] lg:px-8">
      <header className="scroll-mt-28">
        <div className="min-w-0">
          <p className="font-body-ui text-small font-semibold uppercase tracking-[0.14em] text-accent-deep">
            {s["sample.origamiEyebrow"]}
          </p>
          <h1 className="mt-1 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2.5rem]">
            {s["sample.origamiTitle"]}
          </h1>
          {/* 5.3 (L5c) — the step count leaves the H1 and becomes the muted
              meta line under it, like the lesson cards. */}
          <p className="mt-2 font-body-ui text-small font-medium text-site-muted">
            {origamiSample.steps.length} steps · {s.sampleFreeNote}
          </p>
          <p className="mt-3 max-w-[560px] font-body-ui text-body text-site-muted">
            {s["sample.origamiSubtitle"]}
          </p>
        </div>
      </header>

      <section className="scroll-mt-28 mt-8">
        <h2 className="font-body-ui text-xl font-bold tracking-[-0.01em] text-site-ink">
          {s["sample.materialsLabel"]}
        </h2>
        <ul className="mt-3 list-inside list-disc font-body-ui text-site-ink">
          {origamiSample.materials.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      </section>

      <section className="scroll-mt-28 mt-8">
        <h2 className="font-body-ui text-xl font-bold tracking-[-0.01em] text-site-ink">
          {s["sample.stepsHeading"]}
        </h2>
        <div className="mt-4 space-y-4">
          {origamiSample.steps.map((step, i) => (
            <article
              key={step.id}
              className="scroll-mt-28 rounded-[16px] border border-site-border bg-white p-4 lg:p-5"
            >
              {/* 5.3 (L5a) — the media column gets a fixed desktop height so
                  it cannot drive the card taller than its text; the text
                  column centres when it is the shorter side. */}
              <div className="lg:flex lg:items-center lg:gap-6">
                <div className="shrink-0 overflow-hidden rounded-xl border border-site-border lg:w-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    className="w-full object-contain lg:h-[200px]"
                    src={step.visual}
                    alt={`${s["sample.stepLabel"]} ${i + 1} — ${step.title}`}
                    width={420}
                    height={320}
                  />
                </div>
                <div className="mt-4 min-w-0 flex-1 lg:mt-0">
                  <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">
                    {s["sample.stepLabel"]} {i + 1}
                  </p>
                  <h3 className="mt-1 font-body-ui text-lg font-bold text-site-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2 font-body-ui text-site-ink">
                    {step.instructions}
                  </p>
                  {/* 5.3 (L5b) — label and value are separate elements: the
                      small-caps label gets its own line with a 4px gap. */}
                  <p className="mt-3 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-accent-deep">
                    {s["sample.targetLabel"]}
                  </p>
                  <p className="mt-1 text-small font-body-ui text-site-muted">
                    {step.target}
                  </p>
                  <p className="mt-3 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-accent-deep">
                    {s["sample.criterionLabel"]}
                  </p>
                  <p className="mt-1 text-small font-body-ui text-site-muted">
                    {step.criterion}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="scroll-mt-28 mt-8 rounded-[16px] border border-accent/30 bg-accent/5 p-4">
        <p className="font-body-ui text-small text-site-ink">
          {s["sample.livePlayerNote"]}
        </p>
        <SampleStart className={`${primary} mt-3`}/>
      </section>
    </div>
  );
}
