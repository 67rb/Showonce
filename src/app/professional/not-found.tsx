/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";
import s from "@/lib/strings";
import Link from "next/link";
import { Magnetic } from "@/components/Magnetic";

/* 5.3 (L12) — the Professional 404 reuses the face-aware pattern: it renders
   inside the Professional layout (P1: ProfessionalChrome supplies the docked
   InteriorHeader with Pro nav links), and P2: the chrome's compact footer is
   the single footer — the page-level PublicFooter copy is removed so the
   footer renders exactly once. The home target is /professional. */
export default function ProfessionalNotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 overflow-hidden px-6 py-28 text-center">
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
            href="/professional"
            className="btn-shine inline-block rounded-full bg-[#16161A] px-6 py-3 font-body-ui text-body font-semibold text-white shadow-[0_12px_30px_-12px_rgba(22,22,26,0.7)] transition-colors duration-[150ms] hover:bg-[#16A34A]"
          >
            {s.backHome}
          </Link>
        </Magnetic>
        {/* 5.4 (M2) — one useful onward link on the Professional face. */}
        <Link
          href="/professional/lessons/"
          className="font-body-ui text-small font-semibold underline text-site-ink"
        >
          {s["proNotFound.action"]}
        </Link>
      </div>
    </div>
  );
}
