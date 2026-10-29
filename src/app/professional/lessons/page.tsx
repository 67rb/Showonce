import type { Metadata } from "next";
import { ProfessionalBackground } from "@/components/professional/ProfessionalBackground";
import { LessonFlow } from "@/components/professional/LessonFlow";
import s from "@/lib/strings";

export const metadata: Metadata = {
  title: `SHOW ONCE · Professional · ${s.lessonsHeading}`,
  description: s.proStubLine,
};

export default function ProfessionalLessonsPage() {
  return (
    <ProfessionalBackground>
      <LessonFlow screen="library" />
    </ProfessionalBackground>
  );
}