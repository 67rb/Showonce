"use client";

import Link from "next/link";
import {
  LiquidGlassCard,
  LiquidGlassCardHeader,
  LiquidGlassCardTitle,
  LiquidGlassCardDescription,
} from "@/components/lightswind/liquid-glass-card";
import s from "@/lib/strings";

/** Four steady cards, with native scrolling on small screens. */
const CAPABILITIES = [
  {
    id: "tower",
    title: s.galleryTitleTower,
    line: s.galleryLineTower,
    examples: s.galleryExamplesTower,
    href: "/create/",
  },
  {
    id: "mosaic",
    title: s.galleryTitleMosaic,
    line: s.galleryLineMosaic,
    examples: s.galleryExamplesMosaic,
    href: "/create/",
  },
  {
    id: "wall",
    title: s.galleryTitleWall,
    line: s.galleryLineWall,
    examples: s.galleryExamplesWall,
    href: "/create/",
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
        hoverEffect={false}
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

  return <div className="relative z-10 mx-auto mt-10 w-full snap-x snap-mandatory overflow-x-auto pb-4" tabIndex={0} aria-label="Skills you can practice"><div className="flex w-max items-stretch gap-4 py-3">{cards}</div></div>;
}
