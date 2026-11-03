/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import s from "@/lib/strings";
import Link from "next/link";
import { Magnetic } from "@/components/Magnetic";
import { InteriorHeader } from "@/components/InteriorHeader";
import { PublicFooter } from "@/components/PublicFooter";
import { usePathname } from "next/navigation";

export default function NotFound() {
  // 5.1 — face-aware 404. P1: the 404 is an interior route, so it renders the
  // docked InteriorHeader (face-aware, ModeToggle included) instead of the
  // floating pill; the footer stays the shared PublicFooter (compact off the
  // landing routes), and its home link goes to /professional when the failed
  // path started with /professional, otherwise to /.
  const pathname = usePathname();
  const home = pathname?.startsWith("/professional") ? "/professional" : "/";

  return (
    <div className="flex min-h-dvh flex-col">
      <InteriorHeader />
      <main id="main-content" tabIndex={-1} className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-6 py-28 text-center">
        {/* 5.3 (L12) — the numeral renders at full ink strength (was pale
            grey on the pale ground). */}
        <p
          aria-hidden
          className="font-body-ui text-[6rem] font-extrabold leading-none text-site-ink"
        >
          404
        </p>
        <h1 className="max-w-[430px] font-body-ui text-3xl font-extrabold leading-[1.05] text-site-ink">
          {s.notFoundHeading}
        </h1>
        <p className="max-w-[430px] font-body-ui text-body text-site-muted">
          {s.notFoundBody}
        </p>
        <Magnetic className="mt-2">
          <Link
            href={home}
            className="btn-shine inline-block rounded-full bg-[#16161A] px-6 py-3 font-body-ui text-body font-semibold text-white shadow-[0_12px_30px_-12px_rgba(22,22,26,0.7)] transition-colors duration-[150ms] hover:bg-accent"
          >
            {s.backHome}
          </Link>
        </Magnetic>
        {/* 5.4 (M2) — one useful onward link on the Hobby face. */}
        <Link
          href={home === "/professional" ? "/professional/lesson/sample" : "/lesson/sample"}
          className="font-body-ui text-small font-semibold underline text-site-ink"
        >
          {s.notFoundSampleAction}
        </Link>
      </main>
      <PublicFooter />
    </div>
  );
}
