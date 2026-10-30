/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import type { Config } from "@/lib/learning";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function isMoney(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

export function AiAllowance({ config }: { config: Config | null }) {
  if (!config || !config.ai_available) {
    return (
      <div className="rounded-2xl border border-site-border bg-white p-4 text-small">
        <p className="text-site-ink">AI checks are unavailable.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </div>
    );
  }

  const budget = config.budget;
  const remaining = budget?.remaining_usd;
  const total = budget?.limit_usd;
  const paused = budget?.paused === true;

  if (!budget || !isMoney(remaining)) {
    return (
      <div className="rounded-2xl border border-site-border bg-white p-4 text-small">
        <p className="text-site-ink">Shared AI allowance unavailable.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </div>
    );
  }

  if (paused) {
    return (
      <div className="rounded-2xl border border-site-border bg-white p-4 text-small">
        <p className="text-site-ink">Shared AI allowance is paused.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </div>
    );
  }

  if (remaining <= 0) {
    return (
      <div className="rounded-2xl border border-site-border bg-white p-4 text-small">
        <p className="text-site-ink">Shared AI allowance exhausted.</p>
        <p className="text-site-muted">Free practice remains available.</p>
      </div>
    );
  }

  const hasTotal = isMoney(total) && (total as number) > 0;
  const safeTotal = hasTotal ? (total as number) : 0;
  const value = hasTotal ? Math.min(Math.max(remaining, 0), safeTotal) : remaining;

  return (
    <div className="rounded-2xl border border-site-border bg-white p-4 text-small">
      <p className="text-site-ink">
        Shared AI allowance: {usd.format(value)}
        {hasTotal ? ` of ${usd.format(safeTotal)} remaining` : " remaining"}
      </p>
      <p className="text-site-muted">This AI allowance is shared across the site. Free practice remains available.</p>
      {hasTotal ? (
        <progress
          value={value}
          max={safeTotal}
          aria-label={`Shared AI allowance ${usd.format(value)} of ${usd.format(safeTotal)} remaining`}
          style={{ accentColor: "#f59e0b" }}
        />
      ) : null}
    </div>
  );
}
