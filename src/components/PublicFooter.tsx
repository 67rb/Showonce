/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import s from "@/lib/strings";
import Link from "next/link";
import { usePathname } from "next/navigation";

/* 5.4 (M1) — the interior footer is a COMPACT variant: wordmark at text size
   and one row with the tagline + Privacy link. The landing treatment (giant
   display wordmark) is unchanged and still renders on the two landing pages. */
export function PublicFooter() {
  const pathname = usePathname();
  const landing =
    pathname === "/" ||
    pathname === "/professional" ||
    pathname === "/professional/" ||
    pathname === "";
  if (!landing) {
    return (
      <footer className="w-full bg-site-ink">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6">
          <span className="font-display inline-flex select-none items-baseline gap-1 text-base leading-none tracking-tight">
            <span className="text-white">{s.wordmarkShow}</span>{" "}
            <span className="text-[#D97706]">{s.wordmarkOnce}</span>
          </span>
          <div className="flex flex-wrap items-center gap-5">
            <p className="font-body-ui text-small text-white/70">{s.footerLine}</p>
            <Link href="/privacy/" className="font-body-ui text-small text-white/70 hover:text-white">
              {s.navPrivacy}
            </Link>
          </div>
        </div>
      </footer>
    );
  }
  return (
    <footer className="w-full overflow-hidden bg-site-ink">
      <div
        aria-hidden="true"
        className="mx-auto w-full max-w-6xl px-4 pt-14"
      >
        <span className="font-display block text-center whitespace-nowrap text-[clamp(4rem,17vw,11rem)] leading-none tracking-tight uppercase">
          <span className="text-white">{s.wordmarkShow}</span>{" "}
          <span className="text-[#D97706]">{s.wordmarkOnce}</span>
        </span>
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-8">
        <p className="font-body-ui text-small text-white/70">{s.footerLine}</p>
        <div className="flex items-center gap-5"><Link href="/privacy" className="font-body-ui text-small text-white/70 hover:text-white">{s.navPrivacy}</Link></div>
      </div>
    </footer>
  );
}
