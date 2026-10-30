/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useState } from "react";
import s from "@/lib/strings";

type Mode = "stepbystep" | "live";

export function ModeChoice() {
  const [mode, setMode] = useState<Mode>("stepbystep");

  const options: { key: Mode; title: string; desc: string; chip?: string }[] = [
    { key: "stepbystep", title: s.modeStepByStep, desc: s.modeStepByStepDesc },
    {
      key: "live",
      title: s.modeLive,
      desc: s.modeLiveDesc,
      chip: s.modeLiveChip,
    },
  ];

  return (
    <div className="mt-3 grid gap-3">
      {options.map((opt) => {
        const selected = mode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => setMode(opt.key)}
            aria-pressed={selected}
            className={
              "p-5 text-left " +
              (selected
                ? "site-card ring-2 ring-accent-deep "
                : "site-card hover:shadow-[0_16px_40px_-16px_rgba(22,22,26,0.18)] ")
            }
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-body-ui text-body font-semibold text-site-ink">
                {opt.title}
              </span>
              {opt.chip ? (
                <span className="rounded-full border border-site-border bg-site-page px-2.5 py-1 text-caption font-medium text-site-muted">
                  {opt.chip}
                </span>
              ) : null}
            </div>
            <p className="font-body-ui mt-1 text-small text-site-muted">{opt.desc}</p>
          </button>
        );
      })}
    </div>
  );
}