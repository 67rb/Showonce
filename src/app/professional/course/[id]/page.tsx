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

export default function CoursePreviewPage({ params }: { params: { id: string } }) {
  const isPlumbing = params.id === "plumbing-foundations";
  return (
    <>
      <div className="mx-auto w-full max-w-[720px] px-4 pb-12 md:px-6 lg:max-w-[1120px] lg:px-8">
        <div className="mb-4 rounded-[16px] border border-site-border bg-white p-3 text-sm text-site-ink">
          <a className="underline" href="/professional/lessons/">← {s["proSample.backToHub"]}</a>
          <p className="mt-1 text-site-muted">{s["proCourse.previewEyebrow"]}</p>
        </div>
        <header>
          <p className="font-body-ui text-small font-semibold uppercase tracking-[0.14em] text-[#15803D]">{proSampleLesson.trade} foundations</p>
          <h1 className="mt-1 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2.5rem]">{proSampleLesson.courseTitle}</h1>
          <p className="mt-3 max-w-[560px] font-body-ui text-body text-site-muted">{s["proCourse.previewEyebrow"]}. {s["proSample.readNote"]}</p>
        </header>

        {isPlumbing&&<section id="lesson-plumbing-1" className="mt-8">
          <h2 className="font-body-ui text-2xl font-bold tracking-[-0.01em] text-site-ink">Lesson 1 · {proSampleLesson.lessonTitle} <span className="text-base font-medium text-site-muted">· {proSampleLesson.steps.length} steps</span></h2>
          <ol className="mt-4 space-y-4">
            {proSampleLesson.steps.map((step, i) => (
              <li key={step.id} className="rounded-[16px] border border-site-border bg-white p-4">
                <div className="lg:flex lg:gap-5">
                  <div className="shrink-0 overflow-hidden rounded-lg border border-site-border lg:w-[220px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="w-full object-contain" src={step.visual} alt={`${s["sample.stepLabel"]} ${i + 1} — ${step.title}`} width={420} height={320}/>
                  </div>
                  <div className="mt-3 min-w-0 flex-1 lg:mt-0">
                    <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">{s["sample.stepLabel"]} {i + 1}</p>
                    <h3 className="mt-1 font-body-ui text-lg font-bold text-site-ink">{step.title}</h3>
                    <p className="mt-2 font-body-ui text-site-ink">{step.instructions}</p>
                    <p className="mt-2 text-small font-body-ui text-site-muted"><span className="font-semibold text-[#15803D]">{s["sample.targetLabel"]}</span> {step.target}</p>
                    <p className="mt-1 text-small font-body-ui text-site-muted"><span className="font-semibold text-[#15803D]">{s["sample.criterionLabel"]}</span> {step.criterion}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-4 rounded-[16px] border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
            <p className="font-body-ui text-small text-site-ink">{s["proSample.readNote"]}</p>
            <ProSampleStart className={`${primary} mt-3`}/>
          </div>
        </section>}

        {isPlumbing&&<section id="lesson-plumbing-2" className="mt-8 border-t border-site-border pt-8">
          <h2 className="font-body-ui text-2xl font-bold tracking-[-0.01em] text-site-ink">Lesson 2 · Join a fitting to a supply line <span className="text-base font-medium text-site-muted">· {lessonTwoSteps.length} steps</span></h2>
          <ol className="mt-4 space-y-4">
            {lessonTwoSteps.map((step, i) => (
              <li key={step.title} className="rounded-[16px] border border-site-border bg-white p-4">
                <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">{s["sample.stepLabel"]} {i + 1}</p>
                <h3 className="mt-1 font-body-ui text-lg font-bold text-site-ink">{step.title}</h3>
                <p className="mt-2 font-body-ui text-site-ink">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-small text-site-muted">{s["proCourse.enrolGate"]}</p>
          <button type="button" disabled className={`${primary} mt-3 opacity-50 cursor-not-allowed`}>{s["proCourse.enrol"]}</button>
        </section>}

        {!isPlumbing&&<section className="mt-8 rounded-[16px] border border-site-border bg-white p-6">
          <p className="font-body-ui text-small text-site-ink">This course's full lesson text is available after enrolling. <span className="text-site-muted">{s["proCourse.enrolGate"]}</span></p>
        </section>}
      </div>
      <PublicFooter/>
    </>
  );
}