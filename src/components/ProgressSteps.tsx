/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
type Props = {
  current: number;
  total: number;
  /** Bar-segment fill class for completed segments (default: accent amber). */
  accentClass?: string;
};

export function ProgressSteps({ current, total, accentClass = "bg-accent" }: Props) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${
              i < current ? accentClass : "bg-site-page"
            }`}
          />
        ))}
      </div>
      <span className="text-caption font-medium text-site-muted">
        {current} of {total}
      </span>
    </div>
  );
}