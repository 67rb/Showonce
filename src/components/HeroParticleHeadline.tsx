/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useEffect, useRef, useState } from "react";
import { TextParticleAnimation } from "@/components/lightswind/text-particle-animation";
import s from "@/lib/strings";

/**
 * Hero headline as Lightswind Text Particle Animation (Task A, v2.1).
 *
 * The particle component samples its text onto the canvas with the props it
 * is mounted with, so the single brand line only mounts after the Anton font
 * is really loaded (document.fonts.load + document.fonts.ready). Until then
 * — and permanently under prefers-reduced-motion — the real h1 stays the
 * visible headline with the same classes as the static headline it replaces
 * (the brand renders uppercase in Anton at the stepped sizes below). The h1
 * always keeps the readable headline text for accessibility; once the
 * particle line carries the visual it is visually hidden (sr-only). The
 * particle block is its own box in normal flow above the tagline, not an
 * overlay over other content.
 */

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
// Glyph sample for the single brand line; all copy lives in strings.ts.
const FONT_SAMPLE = s.landingHeadlineLines[0];

/** fontSize stages by hero container width (owner values, v2.5). */
function fontSizeForWidth(width: number): 56 | 96 | 132 {
  if (width < 640) return 56;
  if (width < 1024) return 96;
  return 132;
}

export function HeroParticleHeadline() {
  const [particlesLive, setParticlesLive] = useState(false);
  const [particlesReady, setParticlesReady] = useState(false);
  const [fontSize, setFontSize] = useState<56 | 96 | 132>(132);
  const blockRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);

  // Mount gate — order matters. Capability guards first (jsdom and ancient
  // browsers keep the static headline forever), then prefers-reduced-motion
  // returns early and the canvases never mount. Otherwise wait for the Anton
  // face — resolved from the placeholder's computed font stack, because
  // next/font registers Anton under a generated internal family name — and
  // for document.fonts.ready.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    if (window.matchMedia(REDUCED_MOTION_QUERY).matches) return;
    const fonts = document.fonts;
    if (!fonts?.load || !fonts.ready) return;
    const heading = headingRef.current;
    const computed = heading
      ? window.getComputedStyle(heading).fontFamily
      : "";
    const family = computed || '"Anton"';
    const spec = `400 100px ${family}`;
    let alive = true;
    Promise.all([fonts.load(spec, FONT_SAMPLE), fonts.ready])
      .then(() => {
        if (alive) setParticlesLive(true);
      })
      .catch(() => {
        // Font loading failed: keep the static headline.
      });
    return () => {
      alive = false;
    };
  }, []);

  // Responsive fontSize from the hero container width. The particle
  // component re-samples its canvas when fontSize changes, so resize
  // updates propagate through it.
  useEffect(() => {
    const block = blockRef.current;
    if (!block || typeof ResizeObserver === "undefined") return;
    const measure = () => setFontSize(fontSizeForWidth(block.clientWidth));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(block);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={blockRef} className="flex w-full flex-col items-center">
      <h1
        ref={headingRef}
        className={
          particlesReady
            ? "sr-only"
            : "relative font-display text-display uppercase leading-display text-[#52525B]"
        }
      >
        {s.landingHeadline}
      </h1>
      {particlesLive && (
        <div aria-hidden="true" className={particlesReady ? "flex flex-col items-center" : "hidden"}>
          <TextParticleAnimation
            onReady={setParticlesReady}
            text={s.landingHeadlineLines[0]}
            fontFamily="Anton, sans-serif"
            fontWeight={400}
            fontSize={fontSize}
            theme="light"
            resolution={2}
            pixelSize={3}
            hoverRadius={90}
            repelForce={14}
            clickRadius={240}
            clickForce={50}
            springForce={0.085}
            friction={0.86}
            padding={24}
          />
        </div>
      )}
    </div>
  );
}
