/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { ReactNode } from "react";

/**
 * Professional face — light ground for the create + lessons + instructor tool
 * screens (5.4). A solid white backdrop only; content sits on white cards with
 * the existing green header treatment. No photographic, gradient, radial,
 * canvas or glow layers — the page looks identical on every visit.
 */
export function ProfessionalBackground({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-white">
      <div className="relative z-10">{children}</div>
    </div>
  );
}