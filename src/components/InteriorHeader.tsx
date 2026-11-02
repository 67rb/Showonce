/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import s from "@/lib/strings";
import { ModeToggle } from "@/components/ModeToggle";

// P1 — the interior header replaces the floating pill on interior routes only.
// The two landing pages (/ and /professional) keep the existing PublicNavbar
// byte-for-byte; this component is used by every interior route on both faces.
// It is DOCKED: sticky at top:0, solid face ground background, 1px bottom
// border in the line colour — not floating, not rounded-full, not glass. The
// page's main content starts below it in normal flow, so content never scrolls
// underneath it.
//
// The Professional face lives under /professional; everything else is Hobby.
// The face is read from the pathname only — same rule as PublicNavbar/ModeToggle.
const PROFESSIONAL_PREFIX = "/professional";

// Same labels/destinations as the frozen navbar per face (values copied from
// PublicNavbar, which must stay zero-diff for the landing rendering).
const HOBBY_ITEMS = [
  { name: s.navCreate, link: "/create" },
  { name: s.yourLessonsLink, link: "/lessons" },
  { name: s.navPrivacy, link: "/privacy" },
];
const PROFESSIONAL_ITEMS = [
  { name: s.proNavHub, link: "/professional/lessons" },
  { name: s.proNavReview, link: "/professional/instructor" },
  { name: s.navPrivacy, link: "/professional/privacy" },
];

export function InteriorHeader() {
  const pathname = usePathname();
  const isProfessional =
    typeof pathname === "string" && pathname.startsWith(PROFESSIONAL_PREFIX);
  const navItems = isProfessional ? PROFESSIONAL_ITEMS : HOBBY_ITEMS;
  const ctaHref = isProfessional ? "/professional/create" : "/create";

  // P5 — the Start action is QUIET here (bordered/ghost, not filled accent):
  // the page's own primary is the only filled accent action in the first
  // viewport. The landing pill keeps its filled Start.
  const startClass = isProfessional
    ? "rounded-[0.65rem] border border-[#c0d6c7] bg-white px-4 py-2 font-body-ui text-small font-semibold text-[#244a32] transition-colors hover:bg-[#edf7f0]"
    : "rounded-full border border-black/15 bg-transparent px-4 py-2 font-body-ui text-small font-semibold text-site-ink transition-colors hover:bg-black/5";

  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        menuButton.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [open]);
  const close = () => setOpen(false);

  return (
    <header
      className={`interior-header sticky top-0 z-40 w-full border-b bg-white ${
        isProfessional ? "border-[#d5e2da]" : "border-site-border"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href={isProfessional ? "/professional" : "/"}
          onClick={close}
          aria-label="Show Once — home"
          className="wordmark pointer-events-auto select-none whitespace-nowrap text-xl leading-none"
        >
          <span className="text-site-ink">{s.wordmarkShow}</span>{" "}
          <span className={isProfessional ? "text-[#16A34A]" : "text-accent-deep"}>
            {s.wordmarkOnce}
          </span>
        </Link>

        {/* Desktop links (same labels/destinations as the face's navbar). */}
        <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.link}
              href={item.link}
              className={`rounded-full px-3 py-2 font-body-ui text-small font-medium transition-colors ${
                isProfessional
                  ? "text-[#244a32] hover:bg-[#edf7f0]"
                  : "text-site-ink hover:bg-black/5"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ModeToggle showDestination />
          <Link href={ctaHref} className={`${startClass} hidden whitespace-nowrap sm:inline-flex`}>
            {isProfessional ? s.proNavBrief : s.importStart}
          </Link>
          {/* Mobile: the Start action and links collapse into a menu; the
              header stays in flow and single-column. */}
          <div ref={menuButton} className="sm:hidden">
            <button
              type="button"
              aria-expanded={open}
              aria-label={s.navMenu}
              onClick={() => setOpen((o) => !o)}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                isProfessional
                  ? "border-[#c0d6c7] text-[#244a32] hover:bg-[#edf7f0]"
                  : "border-black/15 text-site-ink hover:bg-black/5"
              }`}
            >
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                {open ? (
                  <path d="M4 4l8 8M12 4l-8 8" />
                ) : (
                  <path d="M2.5 5h11M2.5 8h11M2.5 11h11" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <nav
          aria-label="Primary"
          className={`border-t bg-white px-4 pb-4 pt-2 sm:hidden ${
            isProfessional ? "border-[#d5e2da]" : "border-site-border"
          }`}
        >
          <ul className="flex flex-col">
            {navItems.map((item) => (
              <li key={item.link}>
                <Link
                  href={item.link}
                  onClick={close}
                  className={`block rounded-[0.65rem] px-4 py-3 font-body-ui text-body font-medium ${
                    isProfessional
                      ? "text-[#244a32] hover:bg-[#edf7f0]"
                      : "text-site-ink hover:bg-black/5"
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={ctaHref}
            onClick={close}
            className={`${startClass} mt-2 inline-flex w-full justify-center`}
          >
            {isProfessional ? s.proNavBrief : s.importStart}
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
