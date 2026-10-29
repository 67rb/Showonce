"use client";

/* eslint-disable react-hooks/set-state-in-effect -- render after mount, SSR-safe */

import { useEffect, useState } from "react";
import CloudSky from "@/components/originkit/cloud-sky";

type Motion = "unknown" | "reduced" | "full";

/**
 * Mounts OriginKit's Cloud Sky in the landing hero only (v2.12).
 *
 * The wrapper fills the hero (absolute inset-0, pointer-events-none); content
 * stays relative z-10. A background's existence is never gated on reduced
 * motion: under prefers-reduced-motion the sky is still mounted but with
 * speed 0, which freezes it into a still image (per the component's docs).
 * CloudSky's visibleAnimation pauses draws offscreen without destroying the
 * canvas, shader programs or drift state. Returning to the hero reuses them.
 */
export function SkyGate() {
  const [motion, setMotion] = useState<Motion>("unknown");

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotion(reduced ? "reduced" : "full");

  }, []);

  // reduced motion => still sky (speed 0); otherwise animated only when on screen.
  const speed = motion === "reduced" ? 0 : 100;
  const mounted = motion !== "unknown";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0"
    >
      {mounted && (
        <CloudSky
          background="#0075FF"
          baseColor="#B4D2F0"
          accentColor="#FFFFFF"
          density={100}
          size={130}
          speed={speed}
        />
      )}
    </div>
  );
}