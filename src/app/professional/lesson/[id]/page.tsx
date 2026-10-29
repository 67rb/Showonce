import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";
import { proBreadboardLesson } from "@/design/fixtures";

// Any /professional/lesson/[id] resolves to the breadboard sample lesson (the
// same "any id -> the sample" rule the Hobby /lesson/[id] uses).
export function generateStaticParams() {
  return [{ id: "sample" }];
}

export function generateMetadata(): Metadata {
  return {
    title: `SHOW ONCE · Professional · ${proBreadboardLesson.title}`,
    description: proBreadboardLesson.meta,
  };
}

export default function ProfessionalLessonPage() {
  return <LessonFlow screen="overview" />;
}