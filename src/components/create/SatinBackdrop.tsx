"use client";

import { useReducedMotion } from "framer-motion";
import SatinFlow from "@/components/lightswind/satin-flow";

/** Cinematic amber satin backdrop for the create entry. Uses the installed
    Lightswind SatinFlow (self-pausing via useInView); under prefers-reduced-
    motion it renders a static warm gradient instead of the WebGL canvas. */
export function SatinBackdrop() {
  const reduced = useReducedMotion();

  if (reduced) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #1A0E02 0%, #3d210a 45%, #6f3d12 78%, #241204 100%)",
        }}
      />
    );
  }

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
    <SatinFlow
      colors={["#160B02", "#7a4310", "#E29A3A"]}
      speed={0.4}
      scale={1.25}
      noiseIntensity={0.3}
      interactive={false}
      backdropBlurAmount="none"
    />
    <div className="absolute inset-0 bg-black/55" />
    </div>
  );
}