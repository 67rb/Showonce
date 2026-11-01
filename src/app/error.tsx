/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import s from "@/lib/strings";
import { Magnetic } from "@/components/Magnetic";

export default function Error({
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-4 overflow-hidden px-6 py-10 text-center">
      <p
        aria-hidden
        className="font-body-ui text-[6rem] font-extrabold leading-none text-site-ink/20"
      >
        !
      </p>
      <h1 className="max-w-[430px] font-body-ui text-3xl font-extrabold leading-[1.05] text-site-ink">
        {s.errorHeading}
      </h1>
      <p className="max-w-[430px] font-body-ui text-body text-site-muted">
        {s.errorBody}
      </p>
      <Magnetic className="mt-2">
        <button
          type="button"
          onClick={retry}
          className="btn-shine inline-block rounded-full bg-[#16161A] px-6 py-3 font-body-ui text-body font-semibold text-white shadow-[0_12px_30px_-12px_rgba(22,22,26,0.7)] transition-colors duration-[150ms] hover:bg-accent"
        >
          {s.errorRetry}
        </button>
      </Magnetic>
    </main>
  );
}