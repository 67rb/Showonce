/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";

/**
 * A card that wakes up on hover: a radial amber spotlight follows the cursor
 * over its white surface and fades in, plus a soft lift and amber-tinted edge.
 * Content is placed on top (relative z-10). Off under prefers-reduced-motion.
 */
export function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const mx = useMotionValue(-999);
  const my = useMotionValue(-999);
  const sx = useSpring(mx, { stiffness: 180, damping: 24, mass: 0.3 });
  const sy = useSpring(my, { stiffness: 180, damping: 24, mass: 0.3 });

  const background = useMotionTemplate`radial-gradient(360px circle at ${sx}px ${sy}px, rgba(245,158,11,0.22), rgba(217,119,6,0.08) 42%, transparent 70%)`;

  const onMove = (e: React.MouseEvent) => {
    if (reduced || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        mx.set(-999);
        my.set(-999);
      }}
      className={`group relative overflow-hidden ${className}`}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: reduced ? "transparent" : background,
          boxShadow: reduced
            ? undefined
            : "inset 0 0 0 1px rgba(245,158,11,0.28)",
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}