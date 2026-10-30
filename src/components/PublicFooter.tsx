/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
import s from "@/lib/strings";
import Link from "next/link";

export function PublicFooter() {
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
        <div className="flex items-center gap-5"><Link href="/privacy" className="font-body-ui text-small text-white/70 hover:text-white">{s.navPrivacy}</Link>
        <Link
          href="/design"
          className="font-body-ui text-small font-medium text-white/70 transition-colors duration-[150ms] hover:text-white"
        >
          {s.designLink}
        </Link></div>
      </div>
    </footer>
  );
}