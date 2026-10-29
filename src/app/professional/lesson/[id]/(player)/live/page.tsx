import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Live",
};

export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ProfessionalLivePage() {
  return <LessonFlow screen="live" />;
}