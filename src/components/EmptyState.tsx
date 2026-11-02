/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { ReactNode } from "react";

type Props = {
  heading?: string;
  line: string;
  children?: ReactNode;
};

/* 5.4 (M6a) — a resolved empty state: heading, one line and an action slot.
   The old decorative three-block row read as a frozen loading indicator, so it
   is gone; the content itself now carries the state. */
export function EmptyState({ heading, line, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      {heading && (
        <p className="font-body-ui text-small font-semibold uppercase tracking-[0.12em] text-site-muted">
          {heading}
        </p>
      )}
      <p className="max-w-[300px] font-body-ui text-body text-muted">{line}</p>
      {children}
    </div>
  );
}
