/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
// SeasonalHoverCards — adapted (v2.31): THREE-card expanding hover row. The row
// container, flex row, width/flex transition timing (`duration-500`) and the
// export name/file location are kept; the mechanics are retuned for three cards —
// resting = three equal shares, the hovered card expands to ~50% of the row width
// while the other two narrow (flex-grow). Cards are text-only on a light surface
// in the project's tokens (white surface, ink title with the last-word serif
// accent the scope headings use, muted-ink line, amber item markers). The file
// never contained seasonal content — the "seasonal" name is marketing only.
import React from "react";
import { cn } from "@/lib/utils";

export interface SeasonCardProps {
  title: string;
  line: string;
  items: readonly string[];
  className?: string;
}

interface SeasonalHoverCardsProps {
  cards: SeasonCardProps[];
  className?: string;
}

// Accent the LAST word of the title in the serif-italic display span, matching
// the scope headings' mixed-type treatment.
function accentLastWord(title: string) {
  const words = title.split(/\s+/);
  const last = words[words.length - 1] ?? "";
  const lead = words.slice(0, -1).join(" ");
  if (!last) return title;
  return (
    <>
      {lead ? <>{lead} </> : null}
      <span className="font-serif-accent">{last}</span>
    </>
  );
}

const SeasonCard = ({ title, line, items, className }: SeasonCardProps) => {
  return (
    <div
      className={cn(
        "group relative flex flex-col p-6 w-full md:flex-1 md:min-w-0 hover:md:flex-[2] min-h-[320px] rounded-2xl bg-white border border-site-border shadow-sm transition-all duration-500",
        className
      )}
    >
      <h3 className="font-display-ui text-[1.375rem] font-bold leading-tight text-site-ink">
        {accentLastWord(title)}
      </h3>
      <p className="mt-2 font-body-ui text-[1.0625rem] leading-relaxed text-site-muted">
        {line}
      </p>
      <ul className="mt-5 space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <span aria-hidden className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-accent-deep" />
            <span className="font-body-ui text-[1.0625rem] leading-snug text-site-ink">
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export function SeasonalHoverCards({
  cards,
  className,
}: SeasonalHoverCardsProps) {
  return (
    // Row mechanics: flex-wrap below md -> cards stack full-width on touch/mobile
    // (no hover there); md:flex-nowrap where each card is an equal share resting
    // (flex-1) and the hovered card flexes to ~2x (flex-[2], ~50% of the row)
    // while the other two narrow.
    <div className={cn("flex flex-wrap md:flex-nowrap gap-4 w-full px-4", className)}>
      {cards.map((card, index) => (
        <SeasonCard
          key={index}
          title={card.title}
          line={card.line}
          items={card.items}
        />
      ))}
    </div>
  );
}