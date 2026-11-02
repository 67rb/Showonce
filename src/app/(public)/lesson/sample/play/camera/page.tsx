/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Metadata } from "next";
import { SampleFixture } from "@/components/learning/SampleFixture";

export const metadata: Metadata = { title: "SHOW ONCE · Sample camera preview" };

export default function SampleCameraFixturePage() {
  return <SampleFixture face="hobby" screen="live" />;
}
