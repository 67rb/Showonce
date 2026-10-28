"use client";

import s from "@/lib/strings";
import { Button } from "@/components/Button";

export function StartLearningButton() {
  const handle = () => {
    const panel = document.getElementById("hero-import");
    const input = document.getElementById("hero-link-input") as
      | HTMLInputElement
      | null;
    panel?.scrollIntoView({ behavior: "smooth", block: "center" });
    input?.focus();
  };

  return (
    <Button size="large" onClick={handle}>
      {s.finalCtaButton}
    </Button>
  );
}