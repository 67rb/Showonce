/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "@/components/ui/resizable-navbar";
import s from "@/lib/strings";
import { ModeToggle } from "@/components/ModeToggle";

// The Professional face lives under /professional; everything else is Hobby.
// The same shared component renders both — only these face-derived values
// change, and the Hobby path returns exactly the pre-change output.
const PROFESSIONAL_PREFIX = "/professional";

// Face-aware route targets. Hobby targets are byte-identical to the former
// module-level `navItems` so the Hobby rendering is unchanged.
const HOBBY_ITEMS = [
  { name: s.navCreate, link: "/create" },
  { name: s.yourLessonsLink, link: "/lessons" },
  { name: s.navPrivacy, link: "/privacy" },
];
const PROFESSIONAL_ITEMS = [
  // 5.12.7(a): "New training brief" is the CTA pill (below) — the inline nav
  // duplicate is removed so the word is not said twice in the navbar.
  { name: s.proNavHub, link: "/professional/lessons" },
  { name: s.proNavReview, link: "/professional/instructor" },
  { name: s.navPrivacy, link: "/professional/privacy" },
];

function WordmarkAnchor({
  className = "",
  onClick,
  light = false,
  professional = false,
}: {
  className?: string;
  onClick?: () => void;
  light?: boolean;
  professional?: boolean;
}) {
  return (
    <Link
      href={professional ? "/professional" : "/"}
      onClick={onClick}
      aria-label="Show Once — home"
      className={`wordmark relative z-20 pointer-events-auto cursor-pointer select-none ${className}`}
    >
      <span className={light ? "text-[#121212]" : ""}>{s.wordmarkShow}</span>
      <span
        className={
          professional
            ? "text-[#16A34A]"
            : light
              ? "text-[#D97706]"
              : "text-accent"
        }
      >
        {s.wordmarkOnce}
      </span>
    </Link>
  );
}

// Light glass over the landing sky (v2.12). `!` utilities win over the
// component's own `dark:` variants on every route, so a non-landing route
// simply omits them.
const LIGHT_BODY =
  "!bg-white/65 border !border-white/60 backdrop-blur-xl backdrop-saturate-150";
const LIGHT_LINKS = "[&_a]:!text-[#121212] [&_a]:hover:!text-white";
const LIGHT_MENU = "!bg-white !text-[#121212]";

export function PublicNavbar() {
  const pathname = usePathname();
  const isProfessional =
    typeof pathname === "string" && pathname.startsWith(PROFESSIONAL_PREFIX);
  const navItems = isProfessional ? PROFESSIONAL_ITEMS : HOBBY_ITEMS;
  const ctaHref = isProfessional ? "/professional/create" : "/create";
  const ctaClass = isProfessional
    ? "bg-[#16A34A] text-white hover:bg-[#15803D] rounded-full"
    : "bg-[#F59E0B] text-black hover:brightness-110 rounded-full";

  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);menuButton.current?.querySelector<HTMLButtonElement>("button")?.focus();}};document.addEventListener("keydown",escape);return()=>document.removeEventListener("keydown",escape);},[open]);
  const toggle = () => setOpen((o) => !o);
  const close = () => setOpen(false);

  return (
    <Navbar className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <NavBody className={LIGHT_BODY}>
        <WordmarkAnchor className="text-xl leading-none" light professional={isProfessional} />
        <NavItems
          items={navItems}
          className={
            (isProfessional
              ? // 5.12.7(b): in the shrunken/scrolled state the Professional
                // pill is 40% wide (min 800px); tight bracket padding keeps the
                // wordmark, links and toggle clear of each other.
                "!relative !inset-auto min-w-0 whitespace-nowrap [&_a]:!px-[10px] [&_a]:whitespace-nowrap "
              : "!relative !inset-auto min-w-0 whitespace-nowrap ") + LIGHT_LINKS
          }
        />
        <div
          className={
            isProfessional
              ? "flex shrink-0 items-center gap-[10px]"
              : "flex shrink-0 items-center gap-3"
          }
        >
          <ModeToggle />
          <NavbarButton href={ctaHref} className={ctaClass + " whitespace-nowrap"}>
            {isProfessional ? s.proNavBrief : s.importStart}
          </NavbarButton>
        </div>
      </NavBody>
      <MobileNav className={LIGHT_BODY}>
        <MobileNavHeader>
          <WordmarkAnchor className="text-xl leading-none" onClick={close} light professional={isProfessional} />
          <div className="flex shrink-0 items-center gap-2"><ModeToggle showDestination /><div ref={menuButton}><MobileNavToggle isOpen={open} onClick={toggle} /></div></div>
        </MobileNavHeader>
        <MobileNavMenu isOpen={open} onClose={close} className={LIGHT_MENU}>
          <NavItems
            items={navItems}
            onItemClick={close}
            className={`!relative !inset-auto !flex w-full flex-col !items-stretch !space-x-0 gap-2 [&_a]:rounded-xl [&_a]:px-4 [&_a]:py-3 ${LIGHT_LINKS}`}
          />
          <NavbarButton
            href={ctaHref}
            onClick={close}
            className={ctaClass}
          >
            {isProfessional ? s.proNavBrief : s.importStart}
          </NavbarButton>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}