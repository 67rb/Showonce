import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Camera",
};

export function generateStaticParams() {
  return [{ id: "sample" }];
}

export default function ProfessionalCameraPage() {
  return <LessonFlow screen="camera" />;
}