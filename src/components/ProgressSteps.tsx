/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
type Props = {
  current: number;
  total: number;
  /** Bar-segment fill class for completed segments (default: accent amber). */
  accentClass?: string;
};

/* 5.3 (L11b) — one full-width track (not separate segments that read as an
   underline): the fill is the completed fraction in the face accent. */
export function ProgressSteps({ current, total, accentClass = "bg-accent" }: Props) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;
  return (
    <div className="flex items-center gap-2">
      <div
        className="min-w-0 flex-1"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={current}
      >
        <div className="h-1 w-full rounded-full bg-site-page">
          <div
            className={`h-1 rounded-full ${accentClass}`}
            style={{ width: percent + "%" }}
          />
        </div>
      </div>
      <span className="text-caption font-medium text-site-muted">
        {current} of {total}
      </span>
    </div>
  );
}
