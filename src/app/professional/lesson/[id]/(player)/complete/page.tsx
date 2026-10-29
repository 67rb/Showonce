import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Complete",
};

export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ProfessionalCompletePage() {
  return <LessonFlow screen="complete" />;
}