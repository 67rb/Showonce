/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import s from "@/lib/strings";
import Link from "next/link";
import { Magnetic } from "@/components/Magnetic";

export default function NotFound() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-4 overflow-hidden px-6 py-10 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[300px] w-[480px] -translate-x-1/2 rounded-full opacity-60 blur-3xl"
        style={{
          background:
            "radial-gradient(closest-side, rgba(245,158,11,0.22), transparent 70%)",
        }}
      />
      <p
        aria-hidden
        className="font-display-ui bg-gradient-to-b from-site-ink/25 to-site-ink/5 bg-clip-text text-[6rem] font-extrabold leading-none text-transparent"
      >
        404
      </p>
      <h1 className="max-w-[430px] font-display-ui text-3xl font-extrabold leading-[1.05] text-site-ink">
        {s.notFoundHeading}
      </h1>
      <p className="max-w-[430px] font-body-ui text-body text-site-muted">
        {s.notFoundBody}
      </p>
      <Magnetic className="mt-2">
        <Link
          href="/"
          className="btn-shine inline-block rounded-full bg-[#16161A] px-6 py-3 font-body-ui text-body font-semibold text-white shadow-[0_12px_30px_-12px_rgba(22,22,26,0.7)] transition-colors duration-[150ms] hover:bg-accent"
        >
          {s.backHome}
        </Link>
      </Magnetic>
    </main>
  );
}