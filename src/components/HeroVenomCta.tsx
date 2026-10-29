"use client";

import { VenomButton } from "@/components/venom-button";
import { useRouter } from "next/navigation";
import s from "@/lib/strings";

/**
 * Hero CTA — Nexus UI Venom Button (v2.6 Task B).
 *
 * Client wrapper that renders the Venom Button in the hero's CTA slot and
 * navigates to /create on click. `cursor="native"` keeps the system pointer;
 * `autoplay={false}` so the button only reacts to the visitor's own cursor.
 * The label reuses the existing hero CTA string (s.finalCtaButton).
 */
export function HeroVenomCta() {
  const router = useRouter();

  return (
    <div className="venom-cta mx-auto flex items-center justify-center" style={{ width: "min(92vw, 520px)" }}>
      <VenomButton
        label={s.finalCtaButton}
        onClick={() => void router.push("/create")}
        strands={7}
        sense={290}
        reach={140}
        release={215}
        cursor="native"
        autoplay={false}
        height={170}
        className="bg-transparent"
      />
    </div>
  );
}