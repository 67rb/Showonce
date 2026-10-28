"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useFrame, useMediaQuery } from "./SmoothScroll";

/**
 * Task B — Parallax depth. Any element carrying `data-parallax="<speed>"`
 * (speed in [-0.15, 0.15]) drifts vertically at (1 − speed) of scroll speed:
 * `translateY = (elementCentreDistanceFromViewportCentre) × speed`.
 *
 * Driven by the shared rAF loop in SmoothScroll (exactly one loop). Updates are
 * transform-only and fire only while the element is near the viewport
 * (IntersectionObserver gating, 120px overscan). Under prefers-reduced-motion
 * nothing is moved. The registry is module-level so the loop never touches a
 * component ref.
 */

const parallaxSpeeds = new Map<HTMLElement, number>();
const parallaxActive = new Set<HTMLElement>();

export function Parallax() {
  const pathname = usePathname();
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  useEffect(() => {
    // Rebuild the registry whenever the route (and thus the DOM) changes.
    parallaxSpeeds.clear();
    parallaxActive.clear();

    const items = Array.from(
      document.querySelectorAll<HTMLElement>("[data-parallax]"),
    )
      .map((el) => ({ el, speed: Number(el.dataset.parallax) }))
      .filter(
        (it) => Number.isFinite(it.speed) && it.speed >= -0.15 && it.speed <= 0.15,
      );

    for (const it of items) parallaxSpeeds.set(it.el, it.speed);

    // Only update elements near the viewport.
    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const target = entry.target as HTMLElement;
            if (parallaxSpeeds.has(target)) {
              if (entry.isIntersecting) parallaxActive.add(target);
              else parallaxActive.delete(target);
            }
          }
        },
        { rootMargin: "120px 0px", threshold: 0 },
      );
      items.forEach((it) => io!.observe(it.el));
    } else {
      items.forEach((it) => parallaxActive.add(it.el));
    }

    return () => io?.disconnect();
  }, [pathname]);

  useFrame(() => {
    // Parallax fully off under reduced motion — no transforms at all.
    if (reduced) return;
    const mid = window.innerHeight / 2;
    for (const el of parallaxSpeeds.keys()) {
      if (!parallaxActive.has(el)) continue;
      const rect = el.getBoundingClientRect();
      const centre = rect.top + rect.height / 2;
      const offset = (centre - mid) * parallaxSpeeds.get(el)!;
      // transform-only; the 1.15 scale lives in the separate CSS `scale`
      // property, so it composes with this translateY and never exposes an edge.
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  });

  return null;
}