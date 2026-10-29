import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Step by step",
};

export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ProfessionalPlayPage() {
  return <LessonFlow screen="play" />;
}