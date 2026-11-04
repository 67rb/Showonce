/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { usePathname } from "next/navigation";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { InteriorHeader } from "@/components/InteriorHeader";
import ShaderBackground from "@/components/lightswind/shader-background";
import type { ReactNode } from "react";

// P1 — the (public) group serves the Hobby landing page (/) and every Hobby
// interior page. The landing keeps the floating pill navbar byte-for-byte
// (PublicNavbar unchanged); interior routes switch to the DOCKED InteriorHeader,
// so the old fixed-pill compensation padding (pt-24 on main) is no longer
// needed there — the header is in normal flow above the content.
export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const landing = pathname === "/" || pathname === "";
  const create = pathname.replace(/\/$/, "") === "/create";
  const floatingHeader = landing || create;
  return (
    // `dark` activates the installed Resizable Navbar's dark: variants (the
    // site is dark-only). Interior pages are light surfaces (5.4).
    <div className="dark relative isolate flex min-h-dvh flex-col">
      {create && (
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-[#57412a]">
          <ShaderBackground color="#B58B55" className="motion-reduce:hidden" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}
      {floatingHeader ? <PublicNavbar /> : <InteriorHeader />}
      <main
        id="main-content"
        tabIndex={-1}
        className={floatingHeader ? "flex-1 pt-24" : "flex-1"}
      >
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
