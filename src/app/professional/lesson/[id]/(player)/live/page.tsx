/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Live",
};

export function generateStaticParams() {
  return [{ id: "runtime" }, { id: "sample" }];
}

export default function ProfessionalLivePage() {
  return <LessonFlow screen="live" />;
}