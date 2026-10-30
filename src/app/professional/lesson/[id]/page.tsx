/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";


// Static shell; lesson and session IDs are resolved through the authenticated API.
export function generateStaticParams() {
  return [{ id: "runtime" }, { id: "sample" }];
}

export function generateMetadata(): Metadata {
  return {
    title: "SHOW ONCE · Professional practice",
    description: "Your saved professional practice",
  };
}

export default function ProfessionalLessonPage() {
  return <LessonFlow screen="overview" />;
}