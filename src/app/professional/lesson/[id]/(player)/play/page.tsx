/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { LessonFlow } from "@/components/professional/LessonFlow";
import { SampleFixture } from "@/components/learning/SampleFixture";

export const metadata: Metadata = {
  title: "SHOW ONCE · Professional · Step by step",
};

export function generateStaticParams() {
  return [{ id: "runtime" }, { id: "sample" }];
}

export default function ProfessionalPlayPage({ params }: { params: { id: string } }) {
  if (params.id === "sample") return <SampleFixture face="pro" screen="play" />;
  return <LessonFlow screen="play" />;
}