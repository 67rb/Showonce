/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import s from "@/lib/strings";
import { proSampleLesson } from "@/lib/proSample";
import { ProSampleStart } from "@/components/professional/ProSampleStart";
import { PublicFooter } from "@/components/PublicFooter";

export const metadata: Metadata = { title: "SHOW ONCE · Professional · Course preview" };

// Read-only course preview. The Plumbing foundations course preview renders its
// two lessons end to end; lesson 1 is the playable sample ("Identify plumbing
// components"). Enrol stays a separate action with its gate reason inline.
// 5.3 (L9) — in Next 16 `params` is a Promise; reading `params.id` directly
// resolved to `undefined` and silently dropped the lesson rows behind the
// `isPlumbing` condition. The component now awaits params, so the signed-out
// render always shows the lesson rows — no account resolution gates them.
const lessonTwoSteps = [
  { title: "Name the supply line", text: "On the study sheet, point to the cold supply line entering the fixture and name it." },
  { title: "Name the fitting", text: "Find the coupling that joins two lengths of pipe on the diagram and name it." },
  { title: "Say where each part goes", text: "Rehearse the route: supply in, shut-off valve, fixture, trap, drain out." },
];

const primary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full bg-[#16A34A] px-6 py-3 font-semibold text-white transition hover:brightness-105";

export function generateStaticParams() {
  return [{ id: "plumbing-foundations" }];
}

export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isPlumbing = id === "plumbing-foundations";
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-4 pb-12 md:px-6 lg:max-w-[1120px] lg:px-8">
        {/* 5.3 (L10) — plain back link, one arrow (the string carries it), not
            wrapped in a card. */}
        <a
          className="text-small font-medium underline text-site-ink"
          href="/professional/lessons/"
        >
          {s["proSample.backToHub"]}
        </a>
        <header className="scroll-mt-28 lg:flex lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0">
            <p className="font-body-ui text-small font-semibold uppercase tracking-[0.14em] text-[#15803D]">{proSampleLesson.trade} foundations</p>
            <h1 className="mt-1 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2.5rem]">{proSampleLesson.courseTitle}</h1>
            <p className="mt-3 max-w-[560px] font-body-ui text-body text-site-muted">{s["proCourse.previewEyebrow"]}. {s["proSample.readNote"]}</p>
          </div>
          {/* 5.3 (L9) — the subtitle row gains the course meta on the right of
              the header row. */}
          <p className="mt-3 font-body-ui text-small font-medium text-site-muted lg:mt-1 lg:shrink-0 lg:text-right">
            {isPlumbing
              ? `2 lessons · ${proSampleLesson.steps.length + lessonTwoSteps.length} steps · ${proSampleLesson.trade}`
              : proSampleLesson.trade}
          </p>
        </header>

        {isPlumbing&&<section id="lesson-plumbing-1" className="scroll-mt-28 mt-8">
          <h2 className="font-body-ui text-2xl font-bold tracking-[-0.01em] text-site-ink">Lesson 1 · {proSampleLesson.lessonTitle} <span className="text-base font-medium text-site-muted">· {proSampleLesson.steps.length} steps</span></h2>
          <ol className="mt-4 space-y-4">
            {proSampleLesson.steps.map((step, i) => (
              <li key={step.id} className="scroll-mt-28 rounded-[16px] border border-site-border bg-white p-4">
                <div className="lg:flex lg:gap-5">
                  <div className="shrink-0 overflow-hidden rounded-lg border border-site-border lg:w-[220px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full object-contain lg:h-[180px]" src={step.visual} alt={`${s["sample.stepLabel"]} ${i + 1} — ${step.title}`} width={420} height={320}/>
                  </div>
                  <div className="mt-3 min-w-0 flex-1 lg:mt-0">
                    <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">{s["sample.stepLabel"]} {i + 1}</p>
                    <h3 className="mt-1 font-body-ui text-lg font-bold text-site-ink">{step.title}</h3>
                    <p className="mt-2 font-body-ui text-site-ink">{step.instructions}</p>
                    <p className="mt-2 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-[#15803D]">{s["sample.targetLabel"]}</p>
                    <p className="mt-1 text-small font-body-ui text-site-muted">{step.target}</p>
                    <p className="mt-2 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-[#15803D]">{s["sample.criterionLabel"]}</p>
                    <p className="mt-1 text-small font-body-ui text-site-muted">{step.criterion}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="scroll-mt-28 mt-4 rounded-[16px] border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
            <p className="font-body-ui text-small text-site-ink">{s["proSample.readNote"]}</p>
            <ProSampleStart className={`${primary} mt-3`}/>
          </div>
        </section>}

        {isPlumbing&&<section id="lesson-plumbing-2" className="scroll-mt-28 mt-8 border-t border-site-border pt-8">
          <h2 className="font-body-ui text-2xl font-bold tracking-[-0.01em] text-site-ink">Lesson 2 · Join a fitting to a supply line <span className="text-base font-medium text-site-muted">· {lessonTwoSteps.length} steps</span></h2>
          <ol className="mt-4 space-y-4">
            {lessonTwoSteps.map((step, i) => (
              <li key={step.title} className="scroll-mt-28 rounded-[16px] border border-site-border bg-white p-4">
                <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">{s["sample.stepLabel"]} {i + 1}</p>
                <h3 className="mt-1 font-body-ui text-lg font-bold text-site-ink">{step.title}</h3>
                <p className="mt-2 font-body-ui text-site-ink">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-small text-site-muted">{s["proCourse.enrolGate"]}</p>
          <button type="button" disabled className={`${primary} mt-3 opacity-50 cursor-not-allowed`}>{s["proCourse.enrol"]}</button>
        </section>}

        {!isPlumbing&&<section className="scroll-mt-28 mt-8 rounded-[16px] border border-site-border bg-white p-6">
          <p className="font-body-ui text-small text-site-ink">This course's full lesson text is available after enrolling. <span className="text-site-muted">{s["proCourse.enrolGate"]}</span></p>
        </section>}
      </div>
      <PublicFooter/>
    </div>
  );
}
