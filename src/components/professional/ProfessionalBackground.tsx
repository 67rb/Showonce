/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { ReactNode } from "react";

/**
 * Professional face — light "green studio" backdrop for the create + lessons
 * tool screens. A near-white ground lifted with a cool-green gradient, two
 * soft radial green glows, a faint dot grid, and a feather into the navbar
 * seam. Purely decorative (aria-hidden, pointer-events-none), sits behind the
 * content, and spans the full scrollable page (the wrapper grows with its
 * children; the layers are absolute inset-0 over it).
 */
export function ProfessionalBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-site-page">
      {/* ground gradient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, #FCFCFD 0%, #F4F7F4 48%, #EEF3EE 100%)",
        }}
      />

      {/* soft green spotlight behind the content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(54% 40% at 50% 4%, rgba(22,163,74,0.13), transparent 72%)",
        }}
      />

      {/* deep-green wash, lower right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-44 -right-36 h-[560px] w-[560px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(21,128,61,0.13), transparent)",
        }}
      />

      {/* cool neutral wash, upper left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-44 -top-44 h-[540px] w-[540px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(22,163,74,0.10), transparent)",
        }}
      />

      {/* faint dot grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(22,163,74,0.09) 1px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }}
      />

      {/* feather into the navbar seam */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-44"
        style={{ background: "linear-gradient(180deg, #F7F7F8, transparent)" }}
      />

      {/* content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}