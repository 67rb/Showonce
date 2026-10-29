"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import ShaderBackground from "@/components/lightswind/shader-background";

/** Cinematic amber turbulent-wave backdrop. Raw WebGL; mounts only while in
    view (IntersectionObserver) and falls back to a static bronze gradient under
    prefers-reduced-motion. */
export function ShaderBackdrop() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "160px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  if (reduced) {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 120% at 78% -10%, #3a2109 0%, #1a0e02 52%, #0c0703 100%)",
        }}
      />
    );
  }

  return (
    <div ref={ref} aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#3a2109,#0c0703)]">
      {inView ? (
        <ShaderBackground color="#E89A3A" backdropBlurAmount="none" />
      ) : null}
    </div>
  );
}