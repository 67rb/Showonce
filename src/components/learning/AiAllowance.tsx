/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Config } from "@/lib/learning";
import type { ReactNode } from "react";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function isMoney(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

/* 5.4 (M1) — compact variant: ONE slim row (label + amount + bar) for pages
   with no AI action, instead of the full card stack. */
function AllowanceCompact({
  label,
  value,
  total,
}: {
  label: string;
  value: number | null;
  total: number | null;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-[16px] border border-site-border bg-white px-4 py-3 text-small">
      <span className="min-w-0 text-site-ink">{label}</span>
      {value !== null && total !== null && total > 0 ? (
        <progress
          className="h-1 min-w-0 max-w-full flex-1 basis-full md:basis-auto md:w-[240px]"
          value={value}
          max={total}
          aria-label={label}
          style={{ accentColor: "#f59e0b" }}
        />
      ) : null}
    </div>
  );
}

/* 5.3 (L4) — one card, one source of truth: the text prints the same
   `value`/`safeTotal` pair the bar fills from, and the footer row (balance at
   last check + refresh) lives INSIDE the card. */
function AllowanceCard({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-site-border bg-white p-4 text-small">
      {children}
      {footer && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-site-border pt-3">
          {footer}
        </div>
      )}
    </div>
  );
}

export function AiAllowance({
  config,
  footer,
  compact = false,
}: {
  config: Config | null;
  footer?: ReactNode;
  compact?: boolean;
}) {
  if (!config || !config.ai_available) {
    if (compact)
      return <AllowanceCompact label="AI checks are unavailable." value={null} total={null} />;
    return (
      <AllowanceCard footer={footer}>
        <p className="text-site-ink">AI checks are unavailable.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </AllowanceCard>
    );
  }

  const budget = config.budget;
  const remaining = budget?.remaining_usd;
  const total = budget?.limit_usd;
  const paused = budget?.paused === true;

  if (!budget || !isMoney(remaining)) {
    if (compact)
      return (
        <AllowanceCompact label="Shared AI allowance unavailable." value={null} total={null} />
      );
    return (
      <AllowanceCard footer={footer}>
        <p className="text-site-ink">Shared AI allowance unavailable.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </AllowanceCard>
    );
  }

  if (paused) {
    if (compact)
      return <AllowanceCompact label="Shared AI allowance is paused." value={null} total={null} />;
    return (
      <AllowanceCard footer={footer}>
        <p className="text-site-ink">Shared AI allowance is paused.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </AllowanceCard>
    );
  }

  if (remaining <= 0) {
    if (compact)
      return <AllowanceCompact label="Shared AI allowance exhausted." value={null} total={null} />;
    return (
      <AllowanceCard footer={footer}>
        <p className="text-site-ink">Shared AI allowance exhausted.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </AllowanceCard>
    );
  }

  const hasTotal = isMoney(total) && (total as number) > 0;
  const safeTotal = hasTotal ? (total as number) : 0;
  const value = hasTotal ? Math.min(Math.max(remaining, 0), safeTotal) : remaining;

  if (compact) {
    return (
      <AllowanceCompact
        label={
          "Shared AI allowance: " +
          usd.format(value) +
          (hasTotal ? ` of ${usd.format(safeTotal)} remaining` : " remaining")
        }
        value={hasTotal ? value : null}
        total={hasTotal ? safeTotal : null}
      />
    );
  }

  return (
    <AllowanceCard footer={footer}>
      <p className="text-site-ink">
        Shared AI allowance: {usd.format(value)}
        {hasTotal ? ` of ${usd.format(safeTotal)} remaining` : " remaining"}
      </p>
      <p className="text-site-muted">This AI allowance is shared across the site. Free practice remains available.</p>
      {hasTotal ? (
        <progress
          className="mt-3 block w-full"
          value={value}
          max={safeTotal}
          aria-label={`Shared AI allowance ${usd.format(value)} of ${usd.format(safeTotal)} remaining`}
          style={{ accentColor: "#f59e0b" }}
        />
      ) : null}
    </AllowanceCard>
  );
}
