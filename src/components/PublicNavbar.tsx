"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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

const navItems = [
  { name: s.navCreate, link: "/create" },
  { name: s.yourLessonsLink, link: "/lessons" },
  { name: s.navPrivacy, link: "/privacy" },
];

function WordmarkAnchor({
  className = "",
  onClick,
  light = false,
}: {
  className?: string;
  onClick?: () => void;
  light?: boolean;
}) {
  return (
    <Link
      href="/"
      onClick={onClick}
      aria-label="Show Once — home"
      className={`wordmark relative z-20 pointer-events-auto cursor-pointer select-none ${className}`}
    >
      <span className={light ? "text-[#121212]" : ""}>{s.wordmarkShow}</span>
      <span className={light ? "text-[#D97706]" : "text-accent"}>{s.wordmarkOnce}</span>
    </Link>
  );
}

// Light glass over the landing sky (v2.12). `!` utilities win over the
// component's own `dark:` variants on every route, so a non-landing route
// simply omits them.
const LIGHT_BODY =
  "!bg-white/40 !border-black/10 backdrop-blur-xl backdrop-saturate-150";
const LIGHT_LINKS = "[&_a]:!text-[#121212] [&_a]:hover:!text-white";
const LIGHT_MENU = "!bg-white !text-[#121212]";

export function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLDivElement>(null);
  useEffect(()=>{if(!open)return;const escape=(event:KeyboardEvent)=>{if(event.key==="Escape"){setOpen(false);menuButton.current?.querySelector<HTMLButtonElement>("button")?.focus();}};document.addEventListener("keydown",escape);return()=>document.removeEventListener("keydown",escape);},[open]);
  const toggle = () => setOpen((o) => !o);
  const close = () => setOpen(false);

  return (
    <Navbar className="fixed inset-x-0 top-0 z-40">
      <NavBody className={LIGHT_BODY}>
        <WordmarkAnchor className="text-xl" light />
        <NavItems items={navItems} className={LIGHT_LINKS} />
        <NavbarButton
          href="/create"
          className="bg-[#F59E0B] text-black hover:brightness-110 rounded-full"
        >
          {s.importStart}
        </NavbarButton>
      </NavBody>
      <MobileNav className={LIGHT_BODY}>
        <MobileNavHeader>
          <WordmarkAnchor className="text-base" onClick={close} light />
          <div ref={menuButton}><MobileNavToggle isOpen={open} onClick={toggle} /></div>
        </MobileNavHeader>
        <MobileNavMenu isOpen={open} onClose={close} className={LIGHT_MENU}>
          <NavItems
            items={navItems}
            onItemClick={close}
            className={`relative flex flex-col items-start gap-3 ${LIGHT_LINKS}`}
          />
          <NavbarButton
            href="/create"
            onClick={close}
            className="bg-[#F59E0B] text-black hover:brightness-110 rounded-full"
          >
            {s.importStart}
          </NavbarButton>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}