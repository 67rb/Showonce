/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";
import { SampleComplete } from "@/components/learning/SampleFixture";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Complete",
};

export function generateStaticParams() {
  return [{ id: "runtime" }, { id: "sample" }];
}

export default async function ProfessionalCompletePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id === "sample") return <SampleComplete face="pro" />;
  return <LessonFlow screen="complete" />;
}