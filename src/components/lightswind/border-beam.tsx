/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Lightswind BorderBeam — a beam that traces the element's border. Adapted to
 * this project's token palette (defaults to SHOW ONCE amber) and this repo's
 * `@/lib/utils` cn. SSSR-safe; the loop is disabled under prefers-reduced-motion
 * (a micro-interaction).
 */
interface BorderBeamProps {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  className?: string;
  style?: React.CSSProperties;
  reverse?: boolean;
  initialOffset?: number;
  borderThickness?: number;
  opacity?: number;
  glowIntensity?: number;
  beamBorderRadius?: number;
  pauseOnHover?: boolean;
  speedMultiplier?: number;
}

export const BorderBeam = ({
  className,
  size = 90,
  delay = 0,
  duration = 6,
  colorFrom = "#F59E0B",
  colorTo = "#D97706",
  style,
  reverse = false,
  initialOffset = 0,
  opacity = 0.5,
  glowIntensity = 0,
  beamBorderRadius,
  speedMultiplier = 1,
}: BorderBeamProps) => {
  const reduced = useReducedMotion();
  const actualDuration = speedMultiplier ? duration / speedMultiplier : duration;
  const glowEffect =
    glowIntensity > 0
      ? `0 0 ${glowIntensity * 5}px ${glowIntensity * 2}px var(--color-from)`
      : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 rounded-[inherit] border border-transparent [mask-clip:padding-box,border-box] [mask-composite:intersect] [mask-image:linear-gradient(transparent,transparent),linear-gradient(#000,#000)]">
      <motion.div
        className={cn(
          "absolute aspect-square",
          "bg-gradient-to-l from-[var(--color-from)] via-[var(--color-to)] to-transparent",
          className,
        )}
        style={
          {
            width: size,
            offsetPath: `rect(0 auto auto 0 round ${beamBorderRadius ?? size}px)`,
            "--color-from": colorFrom,
            "--color-to": colorTo,
            borderRadius: beamBorderRadius ? `${beamBorderRadius}px` : undefined,
            opacity: reduced ? 0.35 : opacity,
            boxShadow: glowEffect,
            offsetDistance: reduced ? "50%" : undefined,
            ...style,
          } as unknown as React.CSSProperties
        }
        initial={{ offsetDistance: `${initialOffset}%` }}
        animate={
          reduced
            ? { offsetDistance: `${initialOffset}%` }
            : {
                offsetDistance: reverse
                  ? [`${100 - initialOffset}%`, `${-initialOffset}%`]
                  : [`${initialOffset}%`, `${100 + initialOffset}%`],
              }
        }
        transition={
          reduced
            ? undefined
            : {
                repeat: Infinity,
                ease: "linear",
                duration: actualDuration,
                delay: -delay,
              }
        }
      />
    </div>
  );
};