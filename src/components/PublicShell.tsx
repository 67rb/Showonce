/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
"use client";

import { usePathname } from "next/navigation";
import { PublicNavbar } from "@/components/PublicNavbar";
import { PublicFooter } from "@/components/PublicFooter";
import { InteriorHeader } from "@/components/InteriorHeader";
import type { ReactNode } from "react";

// P1 — the (public) group serves the Hobby landing page (/) and every Hobby
// interior page. The landing keeps the floating pill navbar byte-for-byte
// (PublicNavbar unchanged); interior routes switch to the DOCKED InteriorHeader,
// so the old fixed-pill compensation padding (pt-24 on main) is no longer
// needed there — the header is in normal flow above the content.
export function PublicShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const landing = pathname === "/" || pathname === "";
  return (
    // `dark` activates the installed Resizable Navbar's dark: variants (the
    // site is dark-only). Interior pages are light surfaces (5.4).
    <div className="dark flex min-h-dvh flex-col">
      {landing ? <PublicNavbar /> : <InteriorHeader />}
      <main
        id="main-content"
        tabIndex={-1}
        className={landing ? "flex-1 pt-24" : "flex-1"}
      >
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
