/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import s from "@/lib/strings";
import {useIdentity} from "@/components/learning/Identity";
import { usePathname } from "next/navigation";

import { Wordmark } from "@/components/Wordmark";
import { ProgressSteps } from "@/components/ProgressSteps";

import Link from "next/link";

/** Player chrome always reads actual authenticated practice progress. */
export function MinimalChrome() {
  const pathname = usePathname();
  const isProfessional = !!pathname && pathname.startsWith("/professional");
  const isComplete = !!pathname && pathname.includes("/complete");
  const identity=useIdentity();
  const practice=identity.ready?identity.practice:null;
  const total=practice?.total||0;

  const showProgress = !!practice;
  const current = practice?.current || 0;
  const barTotal = total;
  const accent = isProfessional ? "bg-[#16A34A]" : "bg-accent";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-3">
      <header className="flex items-center justify-between gap-4">
        <Wordmark
          href={isProfessional?"/professional":"/"}
          size="sm"
          onceClassName={isProfessional ? "text-[#16A34A]" : undefined}
        />
        {!isComplete && (
          <Link
            href={isProfessional ? "/professional/lessons" : "/lessons"}
            className="shrink-0 text-small font-medium text-muted transition-colors duration-[150ms] hover:text-ink"
          >
            {s.exitLesson}
          </Link>
        )}
      </header>
      {/* 5.3 (L11b) — the progress track sits directly under the header row and
          spans the full container width. */}
      <div className="mt-2">{showProgress && (
        <ProgressSteps accentClass={accent} current={current} total={barTotal} />
      )}</div>
    </div>
  );
}
