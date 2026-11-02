/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import s from "@/lib/strings";
import { ProSampleStart } from "@/components/professional/ProSampleStart";
import { PublicFooter } from "@/components/PublicFooter";
import catalogue from "../../../../../services/learning/hashir/public-site/web/professional-catalogue.json";

export const metadata: Metadata = { title: "SHOW ONCE · Professional · Course preview" };
export const dynamicParams = false;

type Course = (typeof catalogue.courses)[number];
type Lesson = (typeof catalogue.lessons)[number];

const ALIAS: Record<string, string> = { "plumbing-foundations": "plumbing" };

export function generateStaticParams() {
  return [
    ...catalogue.courses.map((course) => ({ id: course.id })),
    ...Object.keys(ALIAS).map((id) => ({ id })),
  ];
}

const primary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full bg-[#16A34A] px-6 py-3 font-semibold text-white transition hover:brightness-105";
const secondary =
  "inline-flex min-h-11 items-center justify-center text-center rounded-full border border-site-border-2 bg-white px-5 py-3 font-semibold text-site-ink";

// Read-only course preview generated from the canonical Worker catalogue, so
// titles, lessons and anchors can never drift from the enforced course.
// Reading a preview never enrols anyone: enrolment stays in the training hub
// behind its sign-in and classroom-confirmation gates.
export default async function CoursePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course: Course | undefined = catalogue.courses.find(
    (item) => item.id === (ALIAS[id] || id),
  );
  if (!course) notFound();
  const lessons: Lesson[] = course.lesson_ids
    .map((lessonID) => catalogue.lessons.find((lesson) => lesson.id === lessonID))
    .filter((lesson): lesson is Lesson => !!lesson);
  const isSampleCourse = course.id === "plumbing";

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto w-full max-w-[720px] flex-1 px-4 pt-4 pb-12 md:px-6 lg:max-w-[1120px] lg:px-8">
        <a className="text-small font-medium underline text-site-ink" href="/professional/lessons/">
          {s["proSample.backToHub"]}
        </a>
        <header className="scroll-mt-28 lg:flex lg:items-start lg:justify-between lg:gap-8">
          <div className="min-w-0">
          <p className="font-body-ui text-small font-semibold uppercase tracking-[0.14em] text-[#15803D]">
            {course.trade} · {course.level}
          </p>
          <h1 className="mt-1 font-body-ui text-[2rem] font-bold tracking-[-0.02em] text-site-ink lg:text-[2.5rem]">
            {course.title}
          </h1>
          <p className="mt-2 font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">
            {course.content_status}
          </p>
          <p className="mt-3 max-w-[560px] font-body-ui text-body text-site-muted">
            {course.description}
          </p>
          {course.prerequisites.length > 0 && (
            <ul className="mt-4 list-inside list-disc font-body-ui text-small text-site-ink">
              {course.prerequisites.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 font-body-ui text-small text-site-muted">
            Classroom or disconnected training only. This preview is read-only
            and does not grant instructor approval or a trade qualification.
          </p>
          </div>
          <p className="mt-3 font-body-ui text-small font-medium text-site-muted lg:mt-1 lg:shrink-0 lg:text-right">
            {lessons.length} lessons · {lessons.reduce((total, lesson) => total + lesson.steps.length, 0)} steps · {course.trade}
          </p>
        </header>

        {/* 5.4 (M3) — each lesson is ONE card: header with the meta line, the
            steps as numbered rows inside the card, and a single per-lesson
            action (the playable sample starts; the rest state the gate). */}
        {lessons.map((lesson, lessonIndex) => {
          const isSampleLesson =
            isSampleCourse && lesson.id === "pro_plumbing_parts";
          return (
            <section
              key={lesson.id}
              id={"lesson-" + lesson.id}
              className="mt-8 scroll-mt-28 first:mt-0"
            >
              <div className="rounded-[16px] border border-site-border bg-white p-4 lg:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h2 className="font-body-ui text-2xl font-bold tracking-[-0.01em] text-site-ink">
                    {lesson.title}
                  </h2>
                  <p className="font-body-ui text-small font-medium text-site-muted">
                    {lesson.steps.length} steps
                  </p>
                </div>
                <ol className="mt-4 space-y-5">
                  {lesson.steps.map((step, i) => (
                    <li key={step.id} className="border-t border-site-border pt-4 first:border-t-0 first:pt-0">
                      <p className="step-label">
                        {s["sample.stepLabel"]} {i + 1}
                      </p>
                      <h3 className="mt-1 font-body-ui text-lg font-bold text-site-ink">
                        {step.title}
                      </h3>
                      <p className="mt-2 font-body-ui text-site-ink">{step.instructions}</p>
                      <p className="step-label mt-3">{s["sample.targetLabel"]}</p>
                      <p className="mt-1 font-body-ui text-small text-site-muted">
                        {step.expected_visual_result}
                      </p>
                      {step.assessment_criteria.length > 0 && (
                        <>
                          <p className="step-label mt-3">{s["sample.criterionLabel"]}</p>
                          <p className="mt-1 font-body-ui text-small text-site-muted">
                            {step.assessment_criteria.join(" ")}
                          </p>
                        </>
                      )}
                    </li>
                  ))}
                </ol>
                <div className="mt-5 border-t border-site-border pt-4">
                  {isSampleLesson ? (
                    <>
                      <ProSampleStart className={primary} />
                      {/* 5.4 (M3) — the sample start is never presented as
                          enrolment (course-routes test contract). */}
                      <p className="mt-2 font-body-ui text-small text-site-muted">
                        {s["proCourse.sampleNote"]}
                      </p>
                    </>
                  ) : (
                    <p className="text-small font-body-ui text-site-muted">
                      {s["proCourse.runsAfterEnrolment"]}
                    </p>
                  )}
                </div>
              </div>
            </section>
          );
        })}

        {/* 5.4 (M3) — ONE slim enrol banner replaces the dual-CTA card: the
            gate reason plus the hub as a text link. */}
        <section className="scroll-mt-28 mt-10 rounded-[16px] border border-[#16A34A]/30 bg-[#16A34A]/5 p-4">
          <p className="font-body-ui text-small text-site-ink">
            {s["proCourse.enrolGate"]} In the training hub you confirm
            classroom-only training, enrol, and your progress is saved for
            instructor review.
          </p>
          <a
            className="mt-2 inline-block text-small font-semibold text-[#15803D] underline"
            href="/professional/lessons/"
          >
            Go to the training hub to enrol
          </a>
        </section>
      </div>
      <PublicFooter />
    </div>
  );
}
