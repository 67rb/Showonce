"use client";

/* eslint-disable react-hooks/set-state-in-effect -- render after mount, SSR-safe */

import { useEffect, useRef, useState } from "react";
import CloudSky from "@/components/originkit/cloud-sky";

type Motion = "unknown" | "reduced" | "full";

/**
 * Mounts OriginKit's Cloud Sky in the landing hero only (v2.12).
 *
 * The wrapper fills the hero (absolute inset-0, pointer-events-none); content
 * stays relative z-10. A background's existence is never gated on reduced
 * motion: under prefers-reduced-motion the sky is still mounted but with
 * speed 0, which draws a still image.
 * While the hero is off-screen the IntersectionObserver pauses the sky by
 * unmounting it, so no frames are burned off-screen.
 */
export function SkyGate() {
  const ref = useRef<HTMLDivElement>(null);
  const [motion, setMotion] = useState<Motion>("unknown");
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setMotion(reduced ? "reduced" : "full");

    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) {
      setOnScreen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) setOnScreen(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Animate only the visible hero; reduced motion keeps the same still sky.
  const speed = motion === "reduced" ? 0 : onScreen ? 100 : 0;
  const mounted = motion !== "unknown" && (motion === "reduced" || onScreen);

  return (
    <div
      ref={ref}
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