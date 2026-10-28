"use client";

import Link from "next/link";
import {
  LiquidGlassCard,
  LiquidGlassCardHeader,
  LiquidGlassCardTitle,
  LiquidGlassCardDescription,
} from "@/components/lightswind/liquid-glass-card";
import {
  ThreeDScrollTriggerContainer,
  ThreeDScrollTriggerRow,
} from "@/components/lightswind/3d-scroll-trigger";
import { useMediaQuery } from "./SmoothScroll";
import s from "@/lib/strings";

/**
 * v2.25 (Tasks A-C) — capability cards are taller text-only glass.
 *
 * Each card is a LiquidGlassCard (variant "glass", glow, hoverEffect) holding a
 * capability title (ink #16161A, 32px top padding) and ONE capability line
 * (muted ink #52525B, 17px); the lower space is empty glass. Cards are a fixed
 * 320px tall on md+ (min-height 260px on smaller) so all four are equal in the
 * stretched row.
 *
 * Task B: the header→row gap is 40px (`mt-10`) and the marquee container's
 * vertical padding is only what the 3D tilt needs (~24px, `py-3`).
 *
 * Task C (ghosting): the installed 3D Scroll Trigger repeats children by
 * rendering them four times as sibling inline-flex sets in ONE track and
 * translating the track (transform + modulo wrap) — the copies are coplanar.
 * The glass cards are translucent, so any content behind the card can read
 * through the face; each card therefore gets an OPAQUE #FFFFFF backing (same
 * radius) behind the glass so nothing behind can show through, while the front
 * glare/refraction/glow survive.
 *
 * Reduced motion: the installed 3D Scroll Trigger has no reduced-motion path, so
 * the same four cards render in a static horizontal scroll row (data-lenis-prevent).
 */

const CAPABILITIES = [
  {
    id: "tower",
    title: s.galleryTitleTower,
    line: s.galleryLineTower,
    examples: s.galleryExamplesTower,
    href: "/lesson/sample",
  },
  {
    id: "mosaic",
    title: s.galleryTitleMosaic,
    line: s.galleryLineMosaic,
    examples: s.galleryExamplesMosaic,
    href: "/lesson/mosaic",
  },
  {
    id: "wall",
    title: s.galleryTitleWall,
    line: s.galleryLineWall,
    examples: s.galleryExamplesWall,
    href: "/lesson/wall",
  },
];

const MORE = {
  id: "more",
  title: s.galleryMoreTitle,
  line: s.galleryMoreLine,
  examples: s.galleryExamplesMore,
  href: "/lessons",
};

const CARD_LINK_CLASS =
  "group relative block w-[min(80vw,480px)] shrink-0 snap-start rounded-3xl px-4 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F59E0B]";

export function HorizontalGallery() {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");

  const capabilityCard = (c: {
    id: string;
    title: string;
    line: string;
    examples: string;
    href: string;
  }) => (
    <Link key={c.id} href={c.href} className={CARD_LINK_CLASS}>
      {/* opaque backing behind the translucent glass card (Task C) */}
      <div aria-hidden className="absolute inset-0 rounded-3xl bg-white" />
      <LiquidGlassCard
        variant="glass"
        glow
        hoverEffect
        className="relative min-h-[260px] md:h-[320px]"
      >
        <LiquidGlassCardHeader className="p-8 pb-2">
          <LiquidGlassCardTitle className="!text-[#16161A] font-display-ui whitespace-normal">
            {c.title}
          </LiquidGlassCardTitle>
        </LiquidGlassCardHeader>
        <LiquidGlassCardDescription className="!text-[#52525B] px-8 pb-8 font-body-ui text-[17px] leading-relaxed whitespace-normal">
          {c.line}
        </LiquidGlassCardDescription>
        <p className="mt-auto px-8 pb-8 text-[13px] font-body-ui font-medium leading-snug tracking-wide text-site-muted whitespace-normal">
          {c.examples}
        </p>
      </LiquidGlassCard>
    </Link>
  );

  const cards = (
    <>
      {CAPABILITIES.map(capabilityCard)}
      {capabilityCard(MORE)}
    </>
  );

  if (reduced) {
    // REDUCED-MOTION PATH: the same four cards in a static scroll row (no auto-scroll).
    return (
      <div
        data-lenis-prevent
        className="relative z-10 mx-auto mt-10 w-full snap-x overflow-x-auto"
      >
        <div className="flex w-max items-stretch px-4 py-6">
          <div aria-hidden className="w-[max(1.5rem,4vw)] shrink-0" />
          {cards}
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto mt-10 w-full">
      <ThreeDScrollTriggerContainer className="py-3">
        <ThreeDScrollTriggerRow baseVelocity={4} direction={-1}>
          {cards}
        </ThreeDScrollTriggerRow>
      </ThreeDScrollTriggerContainer>
    </div>
  );
}